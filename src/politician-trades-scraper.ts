import axios from "axios";
import * as cheerio from "cheerio";
import { TradeWithPrice } from "./types.js";
import { findLink } from "./web-scraper.js";

/**
 * Scrape a single page of trades from the /trades page
 * Uses cheerio for static HTML parsing
 * @param url - The Capitol Trades /trades URL with filters and page number
 * @returns Array of politician trades with price data from the current page
 */
async function scrapePoliticianTradesSinglePage(url: string): Promise<TradeWithPrice[]> {
  try {
    // Fetch the page with increased timeout
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 60000, // Increased to 60 seconds
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      },
    });

    const $ = cheerio.load(response.data);
    const trades: TradeWithPrice[] = [];

    // Try different row selectors
    let rows = $("tbody tr");
    
    // If no rows found, try alternate selectors
    if (rows.length === 0) {
      rows = $("table tr");
    }
    
    rows.each((index, element) => {
      try {
        const $row = $(element);
        
        // Get all cells in the row
        const cells = $row.find("td");
        
        // Extract politician info
        const politicianName = $row.find(".politician-name a, .politician a").first().text().trim() || "";
        const party = $row.find(".party").text().trim() || "";
        const chamber = $row.find(".chamber").text().trim() || "";
        const state = $row.find(".us-state-compact").text().trim() || "";

        // Extract dates - try multiple strategies
        let disclosureText = "";
        let tradeText = "";
        
        // Try to find dates in specific columns
        cells.each((i, cell) => {
          const cellText = $(cell).text().trim();
          // Look for date patterns (e.g., "23 Oct2025", "Nov 2025")
          if (/^\d{1,2}\s+\w+20\d{2}$/.test(cellText) || /^\w+\s+20\d{2}$/.test(cellText)) {
            if (!tradeText) {
              tradeText = cellText;
            } else if (!disclosureText) {
              disclosureText = cellText;
            }
          }
        });
        
        const reportingGap = $row.find(".reporting-gap-tier--2, .reporting-gap-tier--3, .reporting-gap-tier--4").text().trim() || "";

        // Extract transaction info
        const txType = $row.find(".tx-type").text().trim() || "";
        const tradeSizeText = $row.find(".trade-size .text-txt-dimmer, .trade-size").first().text().trim() || "";
        
        // Extract price from tooltip data attribute if available
        const tradeSizeElement = $row.find(".trade-size");
        let price = "N/A";
        const priceData = tradeSizeElement.attr("title") || tradeSizeElement.attr("data-price");
        if (priceData) {
          price = priceData.trim();
        }

        // Extract issuer info
        const issuerName = $row.find(".issuer-name a, .issuer a").first().text().trim() || "";
        const issuerTicker = $row.find(".issuer-ticker").text().trim() || "";

        // Validate that this is a real trade row (not empty or header row)
        // A valid trade should have at least politician name, issuer name, or transaction type
        if (!politicianName && !issuerName && !txType) {
          // Skip empty rows
          return;
        }

        const trade: TradeWithPrice = {
          index: index + 1,
          politician: {
            name: politicianName,
            party: party,
            chamber: chamber,
            state: state,
          },
          issuer: {
            name: issuerName || "Unknown",
            ticker: issuerTicker || "N/A",
          },
          dates: {
            disclosure: disclosureText,
            trade: tradeText,
            reportingGap: reportingGap ? reportingGap + " days" : "",
          },
          transaction: {
            type: txType,
            size: tradeSizeText,
            price: price,
          },
        };

        trades.push(trade);
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
      }
    });

    return trades;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to scrape politician trades page: ${errorMessage}`);
  }
}

/**
 * Scrape trades from the filtered /trades page with pagination
 * Uses cheerio for static HTML parsing and loops through pages
 * @param url - The Capitol Trades /trades URL with filters
 * @param limit - Maximum number of trades to return (default: 50)
 * @returns Array of politician trades with price data
 */
export async function scrapePoliticianTrades(url: string, limit: number = 50): Promise<TradeWithPrice[]> {
  const allTrades: TradeWithPrice[] = [];
  let page = 1;
  
  try {
    // Determine base URL (remove any existing page parameter)
    const urlObj = new URL(url);
    urlObj.searchParams.delete("page");
    const baseUrl = urlObj.toString();
    
    console.error(`Scraping politician trades with limit: ${limit}`);
    
    while (allTrades.length < limit) {
      // Construct URL with page parameter
      const pageUrl = `${baseUrl}&page=${page}`;
      
      console.error(`Fetching page ${page} from: ${pageUrl}`);
      
      try {
        // Scrape the current page
        const pageTrades = await scrapePoliticianTradesSinglePage(pageUrl);
        
        // If no trades found, stop pagination
        if (pageTrades.length === 0) {
          console.error(`No more trades found at page ${page}`);
          break;
        }
        
        console.error(`Found ${pageTrades.length} trades on page ${page}`);
        
        // Add trades from this page
        for (const trade of pageTrades) {
          if (allTrades.length < limit) {
            // Update index to reflect position in combined results
            trade.index = allTrades.length + 1;
            allTrades.push(trade);
          }
        }
        
        // If we got fewer trades than expected or reached limit, we're done
        if (pageTrades.length === 0 || allTrades.length >= limit) {
          break;
        }
        
        page++;
        
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (pageError) {
        console.error(`Error fetching page ${page}:`, pageError);
        // If it's the first page and it fails, throw the error
        // Otherwise, just stop pagination
        if (page === 1) {
          throw pageError;
        }
        break;
      }
    }
    
    console.error(`Total trades scraped: ${allTrades.length}`);
    return allTrades;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to scrape politician trades: ${errorMessage}`);
  }
}

/**
 * Get the issuer ID from Capitol Trades
 * @param issuer - The issuer query (e.g., "AAPL", "Microsoft")
 * @returns The issuer ID (e.g., "apple-inc", "microsoft-corp")
 */
export async function getIssuerId(issuer: string): Promise<string> {
  const url = "https://www.capitoltrades.com/issuers";
  const urlWithQueryParams = `${url}?search=${encodeURIComponent(issuer)}`;

  try {
    // Find the issuer page link
    const linkResult = await findLink(
      urlWithQueryParams,
      (link) => {
        return link.href.includes("issuers/");
      }
    );

    // Extract the issuer ID from the URL
    // URL format: https://www.capitoltrades.com/issuers/issuer-id
    const urlParts = linkResult.targetUrl.split("issuers/");
    if (urlParts.length < 2) {
      throw new Error(`Invalid issuer URL format: ${linkResult.targetUrl}`);
    }

    // Get the issuer ID (might include query params, remove them)
    const issuerIdWithParams = urlParts[1];
    const issuerId = issuerIdWithParams.split("?")[0].split("#")[0].trim();

    if (!issuerId) {
      throw new Error(`Could not extract issuer ID from URL: ${linkResult.targetUrl}`);
    }

    return issuerId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get issuer ID for "${issuer}": ${errorMessage}`);
  }
}

/**
 * Get the politician ID from Capitol Trades
 * @param politician - The politician query (e.g., "Michael", "Nancy Pelosi")
 * @returns The politician ID (e.g., "C001129")
 */
export async function getPoliticianId(politician: string): Promise<string> {
  const url = "https://www.capitoltrades.com/politicians";
  const urlWithQueryParams = `${url}?search=${encodeURIComponent(politician)}`;

  try {
    // Find the politician page link
    const linkResult = await findLink(
      urlWithQueryParams,
      (link) => {
        return link.href.includes("politicians/");
      }
    );

    // Extract the politician ID from the URL
    // URL format: https://www.capitoltrades.com/politicians/C001129
    const urlParts = linkResult.targetUrl.split("politicians/");
    if (urlParts.length < 2) {
      throw new Error(`Invalid politician URL format: ${linkResult.targetUrl}`);
    }

    // Get the politician ID (might include query params, remove them)
    const politicianIdWithParams = urlParts[1];
    const politicianId = politicianIdWithParams.split("?")[0].split("#")[0].trim();

    if (!politicianId) {
      throw new Error(`Could not extract politician ID from URL: ${linkResult.targetUrl}`);
    }

    return politicianId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get politician ID for "${politician}": ${errorMessage}`);
  }
}


import axios from "axios";
import * as cheerio from "cheerio";
import { TradeWithPrice } from "./types.js";
import { findLink } from "./web-scraper.js";

// Helper for conditional logging
const DEBUG = process.env.DEBUG === "true";
const logDebug = (...args: any[]) => {
  if (DEBUG) {
    console.error(...args);
  }
};

// Simple in-memory cache for ID lookups (avoids redundant web requests)
const idCache = new Map<string, { id: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

function getCachedId(key: string): string | null {
  const cached = idCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.id;
  }
  return null;
}

function setCachedId(key: string, id: string): void {
  idCache.set(key, { id, timestamp: Date.now() });
}

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
    
    logDebug(`Scraping politician trades with limit: ${limit}`);
    
    while (allTrades.length < limit) {
      // Construct URL with page parameter
      const pageUrl = `${baseUrl}&page=${page}`;
      
      logDebug(`Fetching page ${page} from: ${pageUrl}`);
      
      try {
        // Scrape the current page
        const pageTrades = await scrapePoliticianTradesSinglePage(pageUrl);
        
        // If no trades found, stop pagination
        if (pageTrades.length === 0) {
          logDebug(`No more trades found at page ${page}`);
          break;
        }
        
        logDebug(`Found ${pageTrades.length} trades on page ${page}`);
        
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
        logDebug(`Error fetching page ${page}:`, pageError);
        // If it's the first page and it fails, throw the error
        // Otherwise, just stop pagination
        if (page === 1) {
          throw pageError;
        }
        break;
      }
    }
    
    logDebug(`Total trades scraped: ${allTrades.length}`);
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
  // Check cache first
  const cachedId = getCachedId(`issuer:${issuer.toLowerCase()}`);
  if (cachedId) {
    logDebug(`Cache hit for issuer: ${issuer}`);
    return cachedId;
  }

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

    // Cache the result
    setCachedId(`issuer:${issuer.toLowerCase()}`, issuerId);
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
  // Check cache first
  const cachedId = getCachedId(`politician:${politician.toLowerCase()}`);
  if (cachedId) {
    logDebug(`Cache hit for politician: ${politician}`);
    return cachedId;
  }

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

    // Cache the result
    setCachedId(`politician:${politician.toLowerCase()}`, politicianId);
    return politicianId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get politician ID for "${politician}": ${errorMessage}`);
  }
}

/**
 * Get top traded stocks by politicians
 */
export async function getTopTradedStocks(limit: number, days: number) {
  try {
    // Fetch all trades (no filters except days)
    const url = `https://www.capitoltrades.com/trades?txDate=${days}d`;
    
    logDebug(`Fetching all trades for top stocks analysis`);
    
    // Get all trades (will be limited by scrapePoliticianTrades)
    const trades = await scrapePoliticianTrades(url, 500); // Get more for better statistics
    
    // Group trades by issuer (stock)
    const stockCounts = new Map<string, { count: number; ticker: string; name: string }>();
    
    for (const trade of trades) {
      const key = trade.issuer.name || "Unknown";
      if (!stockCounts.has(key)) {
        stockCounts.set(key, { 
          count: 0, 
          ticker: trade.issuer.ticker,
          name: trade.issuer.name
        });
      }
      const stock = stockCounts.get(key)!;
      stock.count++;
      // Update ticker if available
      if (trade.issuer.ticker && trade.issuer.ticker !== "N/A") {
        stock.ticker = trade.issuer.ticker;
      }
    }
    
    // Convert to array, sort by count, and take top N
    const sortedStocks = Array.from(stockCounts.entries())
      .map(([name, data]) => ({
        issuer: name,
        ticker: data.ticker,
        tradeCount: data.count
      }))
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, limit);
    
    return {
      limit,
      days,
      totalStocks: sortedStocks.length,
      stocks: sortedStocks
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get top traded stocks: ${errorMessage}`);
  }
}

/**
 * Get politician statistics including trading breakdown and top assets
 */
export async function getPoliticianStats(politician: string, days: number) {
  try {
    // Get politician ID
    const politicianId = await getPoliticianId(politician);
    
    // Fetch all trades for this politician
    const url = `https://www.capitoltrades.com/trades?politician=${politicianId}&txDate=${days}d`;
    const trades = await scrapePoliticianTrades(url, 200);
    
    // Calculate statistics
    const stats = {
      politician,
      days,
      totalTrades: trades.length,
      buys: trades.filter(t => t.transaction.type?.toLowerCase() === 'buy').length,
      sells: trades.filter(t => t.transaction.type?.toLowerCase() === 'sell').length,
      receives: trades.filter(t => t.transaction.type?.toLowerCase() === 'receive').length,
      exchanges: trades.filter(t => t.transaction.type?.toLowerCase() === 'exchange').length,
      buySellRatio: 0, // Will calculate below
      mostTradedAssets: [] as Array<{issuer: string, ticker: string, transactionCount: number}>,
    };
    
    // Calculate buy/sell ratio
    if (stats.sells > 0) {
      stats.buySellRatio = parseFloat((stats.buys / stats.sells).toFixed(2));
    } else if (stats.buys > 0) {
      stats.buySellRatio = stats.buys; // More buys than sells
    }
    
    // Group all trades by issuer to find most traded assets (includes stocks, ETFs, bonds, etc.)
    const assetMap = new Map<string, { ticker: string, count: number }>();
    
    for (const trade of trades) {
      // Count ALL transaction types (buy, sell, receive, exchange)
      const key = trade.issuer.name || "Unknown";
      if (!assetMap.has(key)) {
        assetMap.set(key, { ticker: trade.issuer.ticker, count: 0 });
      }
      const asset = assetMap.get(key)!;
      asset.count++;
    }
    
    // Sort by count and get top 10 most traded assets
    stats.mostTradedAssets = Array.from(assetMap.entries())
      .map(([name, data]) => ({
        issuer: name,
        ticker: data.ticker,
        transactionCount: data.count
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 10);
    
    return stats;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get politician stats: ${errorMessage}`);
  }
}

/**
 * Get asset statistics including trading breakdown and most active traders
 */
export async function getAssetStats(symbol: string, days: number) {
  try {
    // Get issuer ID
    const issuerId = await getIssuerId(symbol);
    
    // Fetch all trades for this issuer
    const url = `https://www.capitoltrades.com/trades?issuer=${issuerId}&txDate=${days}d`;
    const trades = await scrapePoliticianTrades(url, 200);
    
    // Calculate statistics
    const stats = {
      symbol,
      days,
      totalTrades: trades.length,
      buys: trades.filter(t => t.transaction.type?.toLowerCase() === 'buy').length,
      sells: trades.filter(t => t.transaction.type?.toLowerCase() === 'sell').length,
      receives: trades.filter(t => t.transaction.type?.toLowerCase() === 'receive').length,
      exchanges: trades.filter(t => t.transaction.type?.toLowerCase() === 'exchange').length,
      buySellRatio: 0, // Will calculate below
      mostActiveTraders: [] as Array<{politician: string, party: string, chamber: string, transactionCount: number}>,
    };
    
    // Calculate buy/sell ratio
    if (stats.sells > 0) {
      stats.buySellRatio = parseFloat((stats.buys / stats.sells).toFixed(2));
    } else if (stats.buys > 0) {
      stats.buySellRatio = stats.buys; // More buys than sells
    }
    
    // Group all trades by politician to find most active traders
    const politicianMap = new Map<string, { party: string, chamber: string, count: number }>();
    
    for (const trade of trades) {
      // Count ALL transaction types (buy, sell, receive, exchange)
      const key = trade.politician.name || "Unknown";
      if (!politicianMap.has(key)) {
        politicianMap.set(key, { 
          party: trade.politician.party, 
          chamber: trade.politician.chamber,
          count: 0 
        });
      }
      const politician = politicianMap.get(key)!;
      politician.count++;
    }
    
    // Sort by count and get top 10 most active traders
    stats.mostActiveTraders = Array.from(politicianMap.entries())
      .map(([name, data]) => ({
        politician: name,
        party: data.party,
        chamber: data.chamber,
        transactionCount: data.count
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 10);
    
    return stats;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get asset stats: ${errorMessage}`);
  }
}

/**
 * Get buy momentum assets - assets where politicians are net buyers
 */
export async function getBuyMomentumAssets(limit: number, days: number) {
  try {
    // Fetch all trades
    const url = `https://www.capitoltrades.com/trades?txDate=${days}d`;
    const trades = await scrapePoliticianTrades(url, 500);
    
    // Group by issuer and track buy vs sell activity
    const assetMap = new Map<string, {
      ticker: string,
      buys: number,
      sells: number,
      totalTrades: number,
      buySellRatio: number
    }>();
    
    for (const trade of trades) {
      const key = trade.issuer.name || "Unknown";
      if (!assetMap.has(key)) {
        assetMap.set(key, {
          ticker: trade.issuer.ticker,
          buys: 0,
          sells: 0,
          totalTrades: 0,
          buySellRatio: 0
        });
      }
      
      const asset = assetMap.get(key)!;
      asset.totalTrades++;
      
      const txType = trade.transaction.type?.toLowerCase();
      if (txType === 'buy') asset.buys++;
      if (txType === 'sell') asset.sells++;
    }
    
    // Calculate buy/sell ratios and filter for net buyers (more buys than sells)
    const buyMomentumAssets = Array.from(assetMap.entries())
      .map(([name, data]) => {
        data.buySellRatio = data.sells > 0 ? data.buys / data.sells : data.buys;
        return { name, ...data };
      })
      .filter(asset => asset.buys > asset.sells) // Only net buyers
      .sort((a, b) => {
        // Sort by: (1) buy/sell ratio, (2) total buy volume
        const ratioDiff = b.buySellRatio - a.buySellRatio;
        return ratioDiff !== 0 ? ratioDiff : b.buys - a.buys;
      })
      .slice(0, limit)
      .map((asset, index) => ({
        rank: index + 1,
        issuer: asset.name,
        ticker: asset.ticker,
        buys: asset.buys,
        sells: asset.sells,
        netBuys: asset.buys - asset.sells,
        buySellRatio: parseFloat(asset.buySellRatio.toFixed(2)),
        totalTransactions: asset.totalTrades
      }));
    
    return {
      limit,
      days,
      totalAssets: buyMomentumAssets.length,
      disclaimer: "This shows assets where politicians are net buyers. Not investment advice.",
      assets: buyMomentumAssets
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get buy momentum assets: ${errorMessage}`);
  }
}

/**
 * Get buy momentum broken down by political party
 */
export async function getPartyBuyMomentum(limit: number, days: number) {
  try {
    // Fetch all trades
    const url = `https://www.capitoltrades.com/trades?txDate=${days}d`;
    const trades = await scrapePoliticianTrades(url, 500);
    
    // Group by issuer and track buy/sell by party
    const assetMap = new Map<string, {
      ticker: string,
      democrats: { buys: number, sells: number },
      republicans: { buys: number, sells: number }
    }>();
    
    for (const trade of trades) {
      const key = trade.issuer.name || "Unknown";
      const ticker = trade.issuer.ticker;
      
      if (!assetMap.has(key)) {
        assetMap.set(key, {
          ticker,
          democrats: { buys: 0, sells: 0 },
          republicans: { buys: 0, sells: 0 }
        });
      }
      
      const asset = assetMap.get(key)!;
      const txType = trade.transaction.type?.toLowerCase();
      const politician = trade.politician;
      
      // Check party from politician data
      const partyLower = politician?.party?.toLowerCase() || '';
      const isDemocrat = partyLower.includes('democrat');
      const isRepublican = partyLower.includes('republican');
      
      if (txType === 'buy') {
        if (isDemocrat) asset.democrats.buys++;
        if (isRepublican) asset.republicans.buys++;
      }
      if (txType === 'sell') {
        if (isDemocrat) asset.democrats.sells++;
        if (isRepublican) asset.republicans.sells++;
      }
    }
    
    // Process into categories
    const consensus: any[] = [];
    const democratFavorites: any[] = [];
    const republicanFavorites: any[] = [];
    
    for (const [name, data] of assetMap.entries()) {
      const demNet = data.democrats.buys - data.democrats.sells;
      const repNet = data.republicans.buys - data.republicans.sells;
      const demTotal = data.democrats.buys + data.democrats.sells;
      const repTotal = data.republicans.buys + data.republicans.sells;
      
      // Consensus: both parties are net buyers and have significant activity
      if (demNet > 0 && repNet > 0 && demTotal >= 2 && repTotal >= 2) {
        consensus.push({
          issuer: name,
          ticker: data.ticker,
          democrats: {
            buys: data.democrats.buys,
            sells: data.democrats.sells,
            netBuys: demNet
          },
          republicans: {
            buys: data.republicans.buys,
            sells: data.republicans.sells,
            netBuys: repNet
          },
          score: demNet + repNet // Total net buys across both parties
        });
      }
      
      // Democrat favorites: net buyers, more activity from Democrats
      if (demNet > 0 && demTotal >= repTotal) {
        democratFavorites.push({
          issuer: name,
          ticker: data.ticker,
          democrats: {
            buys: data.democrats.buys,
            sells: data.democrats.sells,
            netBuys: demNet
          },
          republicans: {
            buys: data.republicans.buys,
            sells: data.republicans.sells,
            netBuys: repNet
          },
          score: demNet
        });
      }
      
      // Republican favorites: net buyers, more activity from Republicans
      if (repNet > 0 && repTotal >= demTotal) {
        republicanFavorites.push({
          issuer: name,
          ticker: data.ticker,
          democrats: {
            buys: data.democrats.buys,
            sells: data.democrats.sells,
            netBuys: demNet
          },
          republicans: {
            buys: data.republicans.buys,
            sells: data.republicans.sells,
            netBuys: repNet
          },
          score: repNet
        });
      }
    }
    
    // Sort each category by score
    consensus.sort((a, b) => b.score - a.score);
    democratFavorites.sort((a, b) => b.score - a.score);
    republicanFavorites.sort((a, b) => b.score - a.score);
    
    return {
      limit,
      days,
      disclaimer: "This shows assets where politicians are net buyers. Not investment advice.",
      consensus: consensus.slice(0, limit).map((asset, idx) => ({
        rank: idx + 1,
        ...asset
      })),
      democratFavorites: democratFavorites.slice(0, limit).map((asset, idx) => ({
        rank: idx + 1,
        ...asset
      })),
      republicanFavorites: republicanFavorites.slice(0, limit).map((asset, idx) => ({
        rank: idx + 1,
        ...asset
      }))
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get party buy momentum: ${errorMessage}`);
  }
}


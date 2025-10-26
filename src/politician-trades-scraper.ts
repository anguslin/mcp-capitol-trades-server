import { chromium } from "playwright";
import { TradeWithPrice } from "./types.js";

/**
 * Scrape politician trades with price information from Capitol Trades
 * Uses Playwright to extract trade data including prices from hover tooltips
 * @param url - The Capitol Trades issuer page URL with date filter
 * @returns Array of politician trades with price data
 */
export async function scrapePoliticianTrades(url: string): Promise<TradeWithPrice[]> {
  // Launch browser
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 60000
  });
  const page = await browser.newPage();

  try {
    // Navigate to the page
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for table to be present
    await page.waitForSelector("tbody tr", { timeout: 10000 });

    // Get all trade rows
    const rows = await page.locator("tbody tr").all();
    const trades: TradeWithPrice[] = [];

    // Iterate through each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Extract basic trade info
        const politicianName = await row.locator(".politician-name a").textContent() || "";
        const party = await row.locator(".party").textContent() || "";
        const chamber = await row.locator(".chamber").textContent() || "";
        const state = await row.locator(".us-state-compact").textContent() || "";

        // Get disclosure date
        const disclosureDateCell = row.locator("td").nth(1);
        const disclosureDay = await disclosureDateCell.locator(".text-size-3").textContent() || "";
        const disclosureYear = await disclosureDateCell.locator(".text-size-2").textContent() || "";
        const disclosureDate = `${disclosureDay} ${disclosureYear}`.trim();

        // Get trade date
        const tradeDateCell = row.locator("td").nth(2);
        const tradeDay = await tradeDateCell.locator(".text-size-3").textContent() || "";
        const tradeYear = await tradeDateCell.locator(".text-size-2").textContent() || "";
        const tradeDate = `${tradeDay} ${tradeYear}`.trim();

        // Get reporting gap
        const reportingGap = await row.locator(".reporting-gap-tier--2, .reporting-gap-tier--3, .reporting-gap-tier--4, [class*='reporting-gap-tier']").textContent() || "";

        // Get transaction type
        const txType = await row.locator(".tx-type").textContent() || "";

        // Get trade size text
        const tradeSizeText = await row.locator(".trade-size .text-txt-dimmer").textContent() || "";

        // Extract price by hovering over the trade size icon
        let price = "N/A";
        try {
          const tradeSizeElement = row.locator(".trade-size");
          
          // Hover over the trade size element
          await tradeSizeElement.hover({ timeout: 2000 });
          
          // Wait for tooltip to appear
          await page.waitForTimeout(1000);
          
          // Try to find the tooltip with price information
          try {
            const tooltipContainer = page.locator('.tx-trade-size-tooltip-container').first();
            
            if (await tooltipContainer.isVisible({ timeout: 500 })) {
              const priceValue = await tooltipContainer.locator('.q-cell.cell--price .q-value').textContent();
              if (priceValue) {
                price = "$" + priceValue.trim();
              }
            }
          } catch {
            // Tooltip not found, price stays N/A
          }
        } catch (error) {
          // Price extraction failed, keep as N/A
        }

        // Get issuer info from page header (for issuer-specific pages)
        let issuerName = "";
        let issuerTicker = "";
        
        if (i === 0) {
          try {
            // Try to extract from page title first
            const title = await page.title();
            // Title format: "Apple Inc (AAPL:US) trades by politicians"
            const titleMatch = title.match(/^(.+?)\s*\(([^)]+)\)/);
            if (titleMatch) {
              issuerName = titleMatch[1].trim();
              issuerTicker = titleMatch[2].trim();
            } else {
              // Fallback to page elements
              issuerName = await page.locator("h1").first().textContent({ timeout: 2000 }) || "Unknown";
              issuerTicker = await page.locator("h2").first().textContent({ timeout: 2000 }) || "N/A";
            }
          } catch {
            issuerName = "Unknown";
            issuerTicker = "N/A";
          }
        } else {
          // Reuse from first trade
          issuerName = trades[0]?.issuer?.name || "";
          issuerTicker = trades[0]?.issuer?.ticker || "";
        }

        const trade: TradeWithPrice = {
          index: i + 1,
          politician: {
            name: politicianName.trim(),
            party: party.trim(),
            chamber: chamber.trim(),
            state: state.trim()
          },
          issuer: {
            name: issuerName.trim(),
            ticker: issuerTicker.trim()
          },
          dates: {
            disclosure: disclosureDate,
            trade: tradeDate,
            reportingGap: reportingGap ? reportingGap + " days" : ""
          },
          transaction: {
            type: txType.trim(),
            size: tradeSizeText.trim(),
            price: price
          }
        };

        trades.push(trade);

      } catch (error) {
        // Log error but continue processing other rows
        console.error(`Error processing row ${i + 1}:`, error);
      }
    }

    return trades;

  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await browser.close();
  }
}


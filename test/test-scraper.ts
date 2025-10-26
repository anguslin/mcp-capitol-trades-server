#!/usr/bin/env node

/**
 * Test script for politician trades scraper
 * Run with: npx tsx test/test-scraper.ts
 */

import { scrapePoliticianTrades, findLink } from "../src/scraper.js";

async function testPoliticianTrades() {
  console.log("🧪 Testing Politician Trades Scraper\n");
  console.log("=".repeat(60));

  // User Inputs
  const stock = "Apple";
  const days = 90;
  
  // constants for scraping
  const url = "https://www.capitoltrades.com/issuers";
  const urlWithQueryParams = `${url}?search=${stock}`;
  const scrapedLinkIncludes = "issuers/";
  const scrapedLinkQueryParams = `?txDate=${days}d`;

  try {
    console.log(`Searching for: ${stock} (${days} days)`);
    console.log(`Search URL: ${urlWithQueryParams}\n`);

    // Find the issuer page link
    const linkResult = await findLink(
      urlWithQueryParams,
      (link) => {
        return link.href.includes(scrapedLinkIncludes);
      }
    );

    console.log(`✓ Found issuer link: ${linkResult.targetUrl}`);

    // Construct the URL with date filter
    const urlWithScrapedLinkQueryParams = `${linkResult.targetUrl}${scrapedLinkQueryParams}`; 
    console.log(`Full URL: ${urlWithScrapedLinkQueryParams}\n`);
    
    // Get trades with prices
    const tradeWithPrices = await scrapePoliticianTrades(urlWithScrapedLinkQueryParams);
    
    // Console log all TradeWithPrice values
    console.log("\n" + "=".repeat(60));
    console.log("ALL TRADE DATA:");
    console.log("=".repeat(60));
    console.log(JSON.stringify(tradeWithPrices, null, 2));
    
    console.log(`\n✓ Found ${tradeWithPrices.length} trades`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

// Run tests
testPoliticianTrades().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


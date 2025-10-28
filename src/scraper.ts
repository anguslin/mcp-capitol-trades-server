/**
 * Re-export web scraping utilities and politician trades scraper
 * This module acts as a convenience export for all scraping functionality
 */

// Export web scraping utilities and their types
export { scrapeWebPage, extractLinks, extractText, findLink } from "./web-scraper.js";
export type { ScrapedData, LinkData } from "./web-scraper.js";

// Export politician trades scraper
export { scrapePoliticianTrades, getIssuerId, getPoliticianId, getTopTradedStocks, getPoliticianStats, getAssetStats, getBuyMomentumAssets, getPartyBuyMomentum } from "./politician-trades-scraper.js";

#!/usr/bin/env node

/**
 * Test script for politician trades scraper
 * Run with: npx tsx test/test-scraper.ts
 */

import { scrapePoliticianTrades, getIssuerId, getPoliticianId, getTopTradedAssets, getPoliticianStats, getAssetStats, getBuyMomentumAssets, getPartyBuyMomentum } from "../src/scraper.js";

async function testGetIssuerId() {
  console.log("\n🧪 Testing Get Issuer ID\n");
  console.log("=".repeat(60));

  // Test with different issuer queries
  const testIssuers = ["Apple", "Microsoft", "Tesla", "NVIDIA"];

  for (const issuer of testIssuers) {
    try {
      console.log(`\nTesting with issuer: "${issuer}"`);
      const issuerId = await getIssuerId(issuer);
      console.log(`✓ Success! Issuer ID: ${issuerId}`);
    } catch (error) {
      console.error(`❌ Failed for "${issuer}":`, error instanceof Error ? error.message : error);
    }
  }

  console.log("\n" + "=".repeat(60));
}

async function testGetPoliticianId() {
  console.log("\n🧪 Testing Get Politician ID\n");
  console.log("=".repeat(60));

  // Test with different politician queries
  const testPoliticians = ["Michael", "Nancy Pelosi", "Josh", "Mitch"];

  for (const politician of testPoliticians) {
    try {
      console.log(`\nTesting with politician: "${politician}"`);
      const politicianId = await getPoliticianId(politician);
      console.log(`✓ Success! Politician ID: ${politicianId}`);
    } catch (error) {
      console.error(`❌ Failed for "${politician}":`, error instanceof Error ? error.message : error);
    }
  }

  console.log("\n" + "=".repeat(60));
}

async function testGetTopTradedAssets() {
  console.log("\n🧪 Testing Get Top Traded Assets\n");
  console.log("=".repeat(60));

  try {
    console.log("\n📝 Test 1: Top 10 assets in the last 90 days");
    
    const result = await getTopTradedAssets(10, 90);
    console.log(`✓ Found ${result.totalAssets} unique assets with trading activity`);
    console.log("\n📊 Top Traded Assets:");
    result.assets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.issuer} (${asset.ticker}) - ${asset.tradeCount} trades`);
    });
    
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function testGetPoliticianStats() {
  console.log("\n🧪 Testing Get Politician Stats\n");
  console.log("=".repeat(60));

  try {
    console.log("\n📝 Test: Nancy Pelosi stats (90 days)");
    
    const result = await getPoliticianStats("Nancy Pelosi", 365);
    
    console.log(`\n✓ Total Trades: ${result.totalTrades}`);
    console.log(`✓ Buys: ${result.buys}`);
    console.log(`✓ Sells: ${result.sells}`);
    console.log(`✓ Receives: ${result.receives}`);
    console.log(`✓ Exchanges: ${result.exchanges}`);
    console.log(`✓ Buy/Sell Ratio: ${result.buySellRatio}`);
    
    if (result.mostTradedAssets.length > 0) {
      console.log("\n📊 Most Traded Assets:");
      result.mostTradedAssets.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.issuer} (${asset.ticker}) - ${asset.transactionCount} transactions`);
      });
    } else {
      console.log("\n⚠️ No trades found in this time period");
    }
    
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function testGetPoliticianTrades() {
  console.log("\n🧪 Testing Pagination with /trades endpoint\n");
  console.log("=".repeat(60));

  try {
    // Test 1: Filter by stock only
    console.log("\n📝 Test 1: Filter by stock (Apple)");
    
  const stock = "Apple";
  const days = 90;
  
    // Get issuer ID
    console.log(`Getting issuer ID for: ${stock}`);
    const issuerId = await getIssuerId(stock);
    console.log(`✓ Issuer ID: ${issuerId}`);
    
    const url1 = `https://www.capitoltrades.com/trades?issuer=${issuerId}&txDate=${days}d`;
    console.log(`URL: ${url1}`);
    console.log("Testing pagination with limit: 20");
    
    try {
      const trades1 = await scrapePoliticianTrades(url1, 20);
      console.log(`✓ Found ${trades1.length} trades`);
      console.log("\n📊 All Trades:");
      trades1.forEach((trade, index) => {
        console.log(`\n${index + 1}. ${trade.politician.name} (${trade.politician.party}) - ${trade.transaction.type} ${trade.transaction.size} of ${trade.issuer.name} (${trade.issuer.ticker})`);
        console.log(`   Trade Date: ${trade.dates.trade} | Disclosure: ${trade.dates.disclosure}`);
      });
    } catch (error) {
      console.error(`❌ Test 1 failed:`, error instanceof Error ? error.message : error);
    }
    
    // Test 2: Filter by type only
    console.log("\n📝 Test 2: Filter by type (BUY)");
    
    const url2 = `https://www.capitoltrades.com/trades?txType=buy&txDate=90d`;
    console.log(`URL: ${url2}`);
    console.log("Testing pagination with limit: 10");
    
    try {
      const trades2 = await scrapePoliticianTrades(url2, 10);
      console.log(`✓ Found ${trades2.length} trades`);
      console.log("\n📊 All Trades:");
      trades2.forEach((trade, index) => {
        console.log(`\n${index + 1}. ${trade.politician.name} (${trade.politician.party}) - ${trade.transaction.type} ${trade.transaction.size} of ${trade.issuer.name} (${trade.issuer.ticker})`);
        console.log(`   Trade Date: ${trade.dates.trade} | Disclosure: ${trade.dates.disclosure}`);
      });
    } catch (error) {
      console.error(`❌ Test 2 failed:`, error instanceof Error ? error.message : error);
    }
    
    // Test 3: Test empty page detection
    console.log("\n📝 Test 3: Empty page detection (small stock with limited trades)");
    
    const stock2 = "Tesla";
    console.log(`Getting issuer ID for: ${stock2}`);
    const issuerId2 = await getIssuerId(stock2);
    console.log(`✓ Issuer ID: ${issuerId2}`);
    
    const url3 = `https://www.capitoltrades.com/trades?issuer=${issuerId2}&txDate=30d`;
    console.log(`URL: ${url3}`);
    console.log("Testing with limit: 50 (should stop early if no trades)");
    
    try {
      const trades3 = await scrapePoliticianTrades(url3, 50);
      console.log(`✓ Found ${trades3.length} trades (should stop pagination when empty)`);
      if (trades3.length > 0) {
        console.log("\n📊 All Trades:");
        trades3.forEach((trade, index) => {
          console.log(`\n${index + 1}. ${trade.politician.name} (${trade.politician.party}) - ${trade.transaction.type} ${trade.transaction.size} of ${trade.issuer.name} (${trade.issuer.ticker})`);
          console.log(`   Trade Date: ${trade.dates.trade} | Disclosure: ${trade.dates.disclosure}`);
        });
      }
    } catch (error) {
      console.error(`❌ Test 3 failed:`, error instanceof Error ? error.message : error);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Pagination test completed!");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function testGetAssetStats() {
  console.log("\n🧪 Testing Get Asset Stats\n");
  console.log("=".repeat(60));

  try {
    console.log("\n📝 Test: Apple stats (90 days)");
    
    const result = await getAssetStats("Apple", 90);
    
    console.log(`\n✓ Asset: ${result.symbol}`);
    console.log(`✓ Total Trades: ${result.totalTrades}`);
    console.log(`✓ Buys: ${result.buys}`);
    console.log(`✓ Sells: ${result.sells}`);
    console.log(`✓ Receives: ${result.receives}`);
    console.log(`✓ Exchanges: ${result.exchanges}`);
    console.log(`✓ Buy/Sell Ratio: ${result.buySellRatio}`);
    
    if (result.mostActiveTraders.length > 0) {
      console.log("\n📊 Most Active Traders:");
      result.mostActiveTraders.forEach((trader, index) => {
        console.log(`${index + 1}. ${trader.politician} (${trader.party}, ${trader.chamber}) - ${trader.transactionCount} transactions`);
      });
    } else {
      console.log("\n⚠️ No trades found in this time period");
    }
    
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function testGetBuyMomentumAssets() {
  console.log("\n🧪 Testing Get Buy Momentum Assets\n");
    console.log("=".repeat(60));

  try {
    console.log("\n📝 Test: Top 10 buy momentum assets (90 days)");
    
    const result = await getBuyMomentumAssets(10, 90);
    
    console.log(`\n✓ Found ${result.totalAssets} assets with net buy activity`);
    console.log(`⚠️  ${result.disclaimer}`);
    
    if (result.assets.length > 0) {
      console.log("\n📊 Top Buy Momentum Assets:");
      result.assets.forEach((asset) => {
        console.log(`${asset.rank}. ${asset.issuer} (${asset.ticker})`);
        console.log(`   - Buys: ${asset.buys} | Sells: ${asset.sells} | Net Buys: ${asset.netBuys}`);
        console.log(`   - Buy/Sell Ratio: ${asset.buySellRatio} | Total Transactions: ${asset.totalTransactions}`);
      });
    } else {
      console.log("\n⚠️ No assets with net buy activity found");
    }
    
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function testGetPartyBuyMomentum() {
  console.log("\n🧪 Testing Get Party Buy Momentum\n");
    console.log("=".repeat(60));

  try {
    console.log("\n📝 Test: Party buy momentum breakdown (90 days)");
    
    const result = await getPartyBuyMomentum(5, 90);
    
    console.log(`\n⚠️  ${result.disclaimer}`);
    
    // Consensus assets
    if (result.consensus.length > 0) {
      console.log("\n🤝 CONSENSUS ASSETS (Both parties buying):");
      result.consensus.forEach((asset: any) => {
        console.log(`${asset.rank}. ${asset.issuer} (${asset.ticker})`);
        console.log(`   Democrats: ${asset.democrats.buys} buys, ${asset.democrats.sells} sells (net: ${asset.democrats.netBuys})`);
        console.log(`   Republicans: ${asset.republicans.buys} buys, ${asset.republicans.sells} sells (net: ${asset.republicans.netBuys})`);
      });
    } else {
      console.log("\n🤝 No consensus assets found");
    }
    
    // Democrat favorites
    if (result.democratFavorites.length > 0) {
      console.log("\n🔵 DEMOCRAT FAVORITES:");
      result.democratFavorites.forEach((asset: any) => {
        console.log(`${asset.rank}. ${asset.issuer} (${asset.ticker})`);
        console.log(`   Democrats: ${asset.democrats.buys} buys, ${asset.democrats.sells} sells (net: ${asset.democrats.netBuys})`);
        if (asset.republicans.buys + asset.republicans.sells > 0) {
          console.log(`   Republicans: ${asset.republicans.buys} buys, ${asset.republicans.sells} sells (net: ${asset.republicans.netBuys})`);
        }
      });
    } else {
      console.log("\n🔵 No Democrat favorites found");
    }
    
    // Republican favorites
    if (result.republicanFavorites.length > 0) {
      console.log("\n🔴 REPUBLICAN FAVORITES:");
      result.republicanFavorites.forEach((asset: any) => {
        console.log(`${asset.rank}. ${asset.issuer} (${asset.ticker})`);
        console.log(`   Republicans: ${asset.republicans.buys} buys, ${asset.republicans.sells} sells (net: ${asset.republicans.netBuys})`);
        if (asset.democrats.buys + asset.democrats.sells > 0) {
          console.log(`   Democrats: ${asset.democrats.buys} buys, ${asset.democrats.sells} sells (net: ${asset.democrats.netBuys})`);
        }
      });
    } else {
      console.log("\n🔴 No Republican favorites found");
    }
    
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

// Run tests
async function runTests() {
  try {
    await testGetPoliticianId();
    await testGetIssuerId();
    await testGetTopTradedAssets();
    await testGetPoliticianStats();
    await testGetAssetStats();
    await testGetBuyMomentumAssets();
    await testGetPartyBuyMomentum();
    await testGetPoliticianTrades();
  } catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
  }
}

runTests();


# Testing Your MCP Server

## Quick Test

Run the test script to verify everything works:

```bash
npm run test:scraper
```

Or manually:

```bash
npx tsx test/test-scraper.ts
```

This will test getting politician trades for Apple in the last 90 days.

## Testing get_politician_trades Tool

### Test with Different Stocks

**Test 1: Apple Trades**
```json
{
  "stock": "Apple",
  "days": 90
}
```

Expected: Returns politician trades in Apple stock from the last 90 days

**Test 2: Microsoft with Different Time Period**
```json
{
  "stock": "Microsoft",
  "days": 180
}
```

Expected: Returns politician trades in Microsoft from the last 180 days

**Test 3: Tesla with 30 Days**
```json
{
  "stock": "Tesla",
  "days": 30
}
```

Expected: Returns politician trades in Tesla from the last 30 days

## Interactive Testing with Claude Desktop

Once configured in Claude Desktop, try these prompts:

1. **Get Recent Trades:**
   ```
   Get politician trades for Apple in the last 90 days
   ```

2. **Search by Party:**
   ```
   Find all Tesla trades and show me which party is trading more
   ```

3. **Time Period Analysis:**
   ```
   Compare Microsoft trades from the last 30 vs 180 days
   ```

4. **Price Analysis:**
   ```
   Get Amazon trades and show me the highest and lowest prices politicians paid
   ```

## Command Line Testing

### Test the server runs:

```bash
# Should start the server without errors
node build/index.js
```

You should see:
```
MCP Capitol Trades Server running on stdio
```

The server will wait for stdio input following the MCP protocol.

### Test the build:

```bash
npm run build
```

Should complete without errors.

### Verify the structure:

```bash
ls build/
```

Should show:
- index.js
- index.d.ts
- scraper.js
- scraper.d.ts
- (and .map files)

## Common Test Scenarios

### Scenario 1: Basic Trade Retrieval

1. Request trades for "Apple" with 90 days
2. Verify all trades include politician, issuer, dates, and transaction info
3. Check that prices are extracted

### Scenario 2: Time Period Comparison

1. Get trades for "Microsoft" with 30 days
2. Get trades for "Microsoft" with 180 days
3. Compare the number of trades found

### Scenario 3: Different Stock Testing

1. Test with technology stocks (Apple, Microsoft, Google)
2. Test with energy stocks (Tesla, Exxon)
3. Verify data structure is consistent

### Scenario 4: Edge Cases

1. Try stocks with few/no recent trades
2. Try misspelled stock names
3. Test with different valid day values (30, 90, 180, 365)

## Expected Behaviors

### Successful Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"stock\":\"Apple\",\"days\":90,\"totalTrades\":10,\"trades\":[...]}"
    }
  ]
}
```

### Trade Data Structure

Each trade should contain:
- `index`: Trade number
- `politician`: Name, party, chamber, state
- `issuer`: Company name and ticker
- `dates`: Disclosure date, trade date, reporting gap
- `transaction`: Type (buy/sell), size, price

### Error Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Failed to get politician trades: ..."
    }
  ],
  "isError": true
}
```

## Troubleshooting Tests

### If trades retrieval fails:

1. **Check internet connection:** The scraper uses Playwright browser automation
2. **Check stock name:** Verify the stock is available on Capitol Trades
3. **Check time period:** Ensure days value is one of: 30, 90, 180, or 365
4. **Check Capitol Trades availability:** Website may be temporarily down

### If no trades found:

1. **Stock may not exist:** Try a well-known stock like "Apple" or "Microsoft"
2. **No trades in time period:** Try increasing the days value
3. **Misspelled stock name:** Verify the exact company name

### If prices show as "N/A":

1. **Tooltip extraction failed:** Price data may not be available for that trade
2. **Browser automation issue:** Hover tooltip may not have loaded correctly
3. **This is expected:** Some older trades may not have price data available

## Security Considerations

When testing:

1. Data comes from Capitol Trades (public information)
2. All politician trades are publicly available by law
3. No authentication required - all data is public
4. Respect Capitol Trades' rate limits
5. Data is extracted responsibly using browser automation

## Performance Testing

Monitor the scraper performance:

- **Response time:** Should take 10-30 seconds depending on number of trades
- **Browser automation:** Playwright controls the browser automatically
- **Memory usage:** Monitor during testing to ensure no leaks
- **Error handling:** Should gracefully handle failures and continue processing

## Automated Testing

You could add unit tests using Jest or Mocha. Example structure:

```typescript
// test/politician-trades.test.ts
import { scrapePoliticianTrades } from '../src/politician-trades-scraper';

describe('Politician Trades Scraper', () => {
  it('should get Apple trades', async () => {
    const url = "https://www.capitoltrades.com/issuers/429789?txDate=90d";
    const result = await scrapePoliticianTrades(url);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('politician');
    expect(result[0]).toHaveProperty('transaction');
  });
});
```

(Note: Actual test files are not included, but you can add them if needed)

## Next Steps

After testing locally:

1. ✅ Verify get_politician_trades works for various stocks
2. ✅ Test with Claude Desktop integration
3. ✅ Try different time periods (30, 90, 180, 365 days)
4. ✅ Document any issues or data quality problems
5. ✅ Analyze trade patterns and create reports
6. ✅ Package and publish to npm if desired

Happy testing! 🚀

## Running the Test Script

The easiest way to test:

```bash
npx tsx test/test-scraper.ts
```

This will automatically test getting politician trades for Apple with the default configuration.


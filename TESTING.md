# Testing Your MCP Server

## Quick Test

Run the test script:

```bash
npm run build
node build/test/test-scraper.js
```

Tests all 6 tools:
- Issuer/Politician ID lookups
- Pagination and filtering
- Top traded assets
- Politician stats
- Asset stats  
- Buy momentum
- Party buy momentum

## Example Prompts

```
"Get politician trades for Apple"
"Show me Nancy Pelosi's trading activity"
"Which assets have the strongest buy momentum?"
"What are Democrats vs Republicans buying?"
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

## Expected Behaviors

- Returns up to 50 trades per request
- Includes prices, dates, transaction types
- Validates all parameters
- Handles pagination automatically

## Trade Data Structure

Each trade includes:
- Politician info (name, party, chamber, state)
- Issuer info (company name, ticker)
- Dates (disclosure, trade, reporting gap)
- Transaction (type, size, price)

## Troubleshooting

- **Internet:** Requires stable connection
- **No trades found:** Try known stocks (Apple, Microsoft), increase days range
- **Invalid days:** Must be 30, 90, 180, or 365
- **Symbol not found:** Use exact company name or ticker (AAPL, MSFT, etc.)

## Notes

- All data is public from Capitol Trades
- Response time: 10-30 seconds depending on trade volume
- Returns up to 50 trades per request


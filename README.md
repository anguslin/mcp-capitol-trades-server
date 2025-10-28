# MCP Capitol Trades Server

A Model Context Protocol (MCP) server that extracts politician stock trades with prices from Capitol Trades. Get detailed trade information including politicians, dates, transaction types, sizes, and prices.

## Features

- 🔍 **Politician trade data extraction** with prices and details
- 📊 **Analytics tools**: Top traded stocks, buy momentum, party analysis
- 🎯 **Advanced filtering** by stock, politician, party, transaction type
- 💰 Real-time price and transaction data
- 🚀 Easy integration with Claude Desktop and Cursor

## Quick Start

Get politician stock trades with prices from Capitol Trades. Simply ask Claude or Cursor to get trades for any stock!

**Example:** "Get politician trades for Microsoft in the last 90 days"

## Installation

### Step 1: Install Dependencies

```bash
npm install
npm run build
```

✅ **Status:** Build folder contains the compiled JavaScript at `build/src/index.js`

### Step 2: No Additional Installation Required

The server uses Cheerio for static HTML parsing, which requires no additional installation.

## Configuration

### For Claude Desktop

Edit your Claude Desktop configuration file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "capitol-trades": {
      "command": "node",
      "args": [
        "C:/Users/anguslin/Projects/Finance-MCP/build/src/index.js"
      ]
    }
  }
}
```

**Important:** Update the path to your actual project location!

### For Cursor

Edit your Cursor settings:

**Windows:** `%APPDATA%\Cursor\User\settings.json`  
**macOS:** `~/Library/Application Support/Cursor/User/settings.json`  
**Linux:** `~/.config/Cursor/User/settings.json`

Add this configuration:

```json
{
  "mcp": {
    "servers": {
      "mcp-capitol-trades-server": {
        "command": "node",
        "args": [
          "C:/Users/anguslin/Projects/Finance-MCP/build/src/index.js"
        ]
      }
    }
  }
}
```

### Step 3: Restart

Restart Claude Desktop or Cursor completely to load the MCP server.

## Tools Provided

### `get_politician_trades` ⭐ Featured Tool

Extract politician stock trades with advanced filtering options.

Get politician stock trades with price information from Capitol Trades. Searches for a stock by ticker or company name and returns recent trades by politicians.

**Parameters:**
- `symbol` (optional): Asset ticker or name (e.g., 'Apple', 'AAPL', 'VOO')
- `politician` (optional): Politician name (e.g., 'Nancy Pelosi')
- `party` (optional): "DEMOCRAT" or "REPUBLICAN"
- `type` (optional): Array - ["BUY", "SELL", "RECEIVE", "EXCHANGE"]
- `days` (optional): 30, 90, 180, or 365 (default: 90)

### Additional Tools

- **`get_top_traded_stocks`** - Most traded assets by politicians
- **`get_politician_stats`** - Individual politician trading stats
- **`get_asset_stats`** - Asset-level trading statistics
- **`get_buy_momentum_assets`** - Assets with strong buy momentum
- **`get_party_buy_momentum`** - Buy activity by political party

**Returns:**
```json
{
  "stock": "Apple",
  "days": 90,
  "totalTrades": 10,
  "trades": [
    {
      "index": 1,
      "politician": {
        "name": "John Smith",
        "party": "Republican",
        "chamber": "House",
        "state": "CA"
      },
      "issuer": {
        "name": "Apple Inc",
        "ticker": "AAPL:US"
      },
      "dates": {
        "disclosure": "23 Oct 2025",
        "trade": "10 Sept 2025",
        "reportingGap": "41 days"
      },
      "transaction": {
        "type": "buy",
        "size": "1K–15K",
        "price": "$230.03"
      }
    }
  ]
}
```

## Usage

### Example Prompts

**Basic Queries:**
```
"Show me all politician trades for Apple"
"What did Nancy Pelosi trade recently?"
"Get Democrat buys in the last 90 days"
```

**Analytics Queries:**
```
"What stocks are politicians buying the most?"
"Show me assets with strong buy momentum"
"What are Democrats vs Republicans buying?"
"Get detailed stats for Nancy Pelosi's trading"
```

### Tips

- Search by company name or ticker (e.g., "Apple" or "AAPL")
- Supports ETFs and bonds too (e.g., "VOO", "VBTLX")
- All parameters are optional for flexible queries

## Development

### Project Structure

```
Finance-MCP/
├── src/
│   ├── index.ts                      # Main MCP server implementation
│   ├── politician-trades-scraper.ts # Politician trade scraper
│   ├── web-scraper.ts                # Base web scraping utilities
│   ├── types.ts                      # TypeScript type definitions
│   └── scraper.ts                    # Convenience re-exports
├── test/
│   └── test-scraper.ts               # Development test script
├── build/                            # Compiled JavaScript output
├── package.json                       # Package configuration
├── tsconfig.json                      # TypeScript configuration
└── README.md                          # This file
```

### Available Commands

```bash
npm run build      # Compile TypeScript to JavaScript
npm run dev        # Watch mode for development (auto-rebuild)
npm start          # Run the server directly
npm run test:scraper  # Run test script
npm run verify     # Verify installation
```

### Development Mode

For development with auto-rebuild on file changes:

```bash
npm run dev
```

This will watch for file changes and automatically rebuild the project.

### Testing Locally

Test the server without Claude Desktop:

```bash
# Run the test script
npm run test:scraper

# Or directly
node build/src/index.js
```

You should see: `Finance MCP Server running on stdio`

### Adding New Tools

1. Define tool schema in `TOOLS` array in `src/index.ts`:
```typescript
{
  name: "new_tool",
  description: "What it does",
  inputSchema: { ... }
}
```

2. Add case handler:
```typescript
case "new_tool": {
  const result = await newToolFunction(args);
  return { content: [...] };
}
```

3. Implement function:
```typescript
async function newToolFunction(args) {
  // Implementation
}
```

## Publishing to npm

### Option 1: Public Package

1. Update `package.json` with your desired package name (must be unique on npm)
2. Create npm account if you don't have one
3. Login: `npm login`
4. Publish: `npm publish`

### Option 2: Private Package

```bash
npm publish --access restricted
```

### Option 3: Scoped Package (Recommended for personal use)

Update `package.json`:
```json
{
  "name": "@yourusername/finance-mcp-server",
  ...
}
```

Then publish:
```bash
npm publish --access public
```

### Global Installation

Once published, users can install globally:

```bash
npm install -g @yourusername/mcp-capitol-trades-server
```

Then configure Claude Desktop/Cursor to use:
```json
{
  "mcpServers": {
    "capitol-trades": {
      "command": "mcp-capitol-trades-server"
    }
  }
}
```

## Troubleshooting

### Server Not Appearing in Claude Desktop/Cursor

1. **Check the path:** Make sure the path in config is correct (use `build/src/index.js`)
2. **Check build:** Run `npm run build` to ensure build completed
3. **Check permissions:** Ensure Claude/Cursor can execute the file
4. **Restart:** Completely quit and restart Claude Desktop/Cursor
5. **Check logs:** Look for errors in Claude Desktop logs or Cursor console

### Server Fails to Start

1. **Check Node.js:** Ensure Node.js 18+ is installed: `node --version`
2. **Check dependencies:** Run `npm install` to ensure all dependencies installed
3. **Check Playwright:** Playwright browsers must be installed: `npx playwright install`
4. **Check build:** Verify `build/src/index.js` exists

### Scraping Fails

1. **Verify URL:** Check the URL is accessible in your browser
2. **Bot protection:** Some websites block automated requests
3. **JavaScript required:** This uses Playwright for dynamic content
4. **Network issues:** Check your internet connection

### No Trades Found

1. **Invalid stock name:** Try different stock/ticker names
2. **Time period:** Adjust the days parameter (30, 90, 180, 365)
3. **Actually no trades:** There may genuinely be no trades for that stock in that period

### Build Errors

1. **Delete and reinstall:** Delete `node_modules` and `package-lock.json`, then run `npm install` again
2. **Check versions:** Make sure Node.js version is 18 or higher: `node --version`
3. **Check TypeScript:** Verify TypeScript version: `npx tsc --version`

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot find module" | Wrong path | Check path is `build/src/index.js` |
| "Playwright browser not found" | Missing browsers | Run `npx playwright install` |
| "Timeout" | Slow website | Network issue or site down |
| "No trades found" | Invalid stock | Try different stock name |

## Technical Details

- **Protocol:** Model Context Protocol (MCP)
- **Transport:** stdio
- **Language:** TypeScript
- **Runtime:** Node.js 18+
- **Dependencies:**
  - `@modelcontextprotocol/sdk` - MCP SDK
  - `axios` - HTTP client
  - `cheerio` - HTML parsing
  - `playwright` - Browser automation for dynamic content

## Error Handling

The server includes comprehensive error handling:
- Network timeouts (30 seconds)
- Invalid stock names
- Missing elements
- Malformed HTML
- HTTP errors

All errors are returned in a structured format with clear error messages.

## Security Considerations

⚠️ **Important:** Web scraping should be done responsibly:

1. Respect `robots.txt` files
2. Don't overload servers with requests
3. Follow website Terms of Service
4. Consider rate limiting for production use
5. Be aware of legal implications in your jurisdiction

## Limitations

- Subject to rate limiting and blocking by target websites
- Requires valid HTML structure for parsing
- No built-in caching (implement if needed for production)
- Politician trades tool requires stable internet connection for browser automation

## Future Enhancements

- [ ] Add request caching
- [ ] Rate limiting configuration
- [ ] Proxy support
- [ ] Authentication for protected pages
- [ ] More specialized financial data extractors
- [ ] Export to different formats (CSV, JSON, XML)

## Additional Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[TESTING.md](TESTING.md)** - Testing guide and scenarios
- **[GIT-SETUP.md](GIT-SETUP.md)** - Git repository setup guide

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

Built with ❤️ using the Model Context Protocol

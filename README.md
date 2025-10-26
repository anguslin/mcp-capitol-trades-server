# MCP Capitol Trades Server

A Model Context Protocol (MCP) server that extracts politician stock trades with prices from Capitol Trades. Get detailed trade information including politicians, dates, transaction types, sizes, and prices.

## Features

- 🌐 Web scraping with CSS selector support
- 🔗 Link extraction and filtering
- 🏛️ **Politician trade data extraction from Capitol Trades**
- 💰 Financial data extraction (prices, percentages)
- 📊 Table data parsing
- 🚀 Easy to integrate with Claude Desktop and Cursor
- 📦 Packaged as npm module for easy distribution

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

### Step 2: Install Playwright (Required)

The server uses Playwright for browser automation:

```bash
npx playwright install
```

This downloads the necessary browser binaries for scraping dynamic content.

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

### `get_politician_trades` ⭐ Featured

Get politician stock trades with price information from Capitol Trades. Searches for a stock by ticker or company name and returns recent trades by politicians.

**Parameters:**
- `stock` (required): The stock ticker symbol or company name (e.g., 'Apple', 'AAPL', 'Microsoft')
- `days` (optional): Number of days to look back - must be 30, 90, 180, or 365 (default: 90)

**Example Request:**
```json
{
  "stock": "Apple",
  "days": 90
}
```

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

**Basic Usage:**
```
"Get politician trades for Microsoft in the last 90 days"
"What trades did politicians make in Apple stock recently?"
"Show me all Tesla trades by politicians in the last 180 days"
"Find all Amazon trades from the last year with prices"
"Get all politician trades for NVIDIA"
```

**Analysis Queries:**
```
"Get politician trades for Microsoft and show me who bought, who sold, and at what prices"
"Find all Tesla trades by Democrats and Republicans separately. Which party has more trades?"
"Show me all politician trades in Apple during the last quarter (90 days) with prices"
"Get trades for both Google and Microsoft in the last 180 days. Which stock has more politician activity?"
```

### Usage Tips

1. **Use specific stock names:** Search by company name (e.g., "Apple") or ticker (e.g., "AAPL")
2. **Time period options:** Choose from 30, 90, 180, or 365 days
3. **Price information:** The tool extracts actual trade prices from Capitol Trades
4. **Complete data:** Each trade includes politician info, dates, transaction type, size, and price
5. **Multiple trades:** The tool returns all matching trades for the stock and time period

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

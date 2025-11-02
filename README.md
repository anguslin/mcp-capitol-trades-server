# MCP Capitol Trades Server

A Model Context Protocol (MCP) server that extracts politician stock trades with prices from [Capitol Trades](https://www.capitoltrades.com/). Get detailed trade information including politicians, dates, transaction types, sizes, and prices. No API Key required.

## ✨ Why This MCP Server?

- 🆓 **100% Free** - No API key required
- 🚀 **Easy Setup** - Install and go
- 📊 **Analytics Tools** - Top stocks, buy momentum, party analysis
- 🎯 **Advanced Filtering** - By stock, politician, party, transaction type
- 💰 **Real-time Data** - Prices and transaction details

## Quick Start

Get politician stock trades with prices from [Capitol Trades](https://www.capitoltrades.com/). Simply ask Cursor or VS Code AI to get trades for any stock!

**Example:** "Get politician trades for Microsoft in the last 90 days"

## Installation

Choose **Option 1** for a quick start from npm, or **Option 2** to build from source.

### Option 1: Install from npm (Recommended) ⭐

```bash
npm install -g @anguslin/mcp-capitol-trades
```

That's it! The package is installed globally.

**🎉 No API key or authentication needed!** All data is public Congressional financial disclosures.

### Option 2: Install from Source

If you want to build from source or contribute:

```bash
git clone https://github.com/anguslin/mcp-capitol-trades
cd mcp-capitol-trades
npm install
npm run build
```

✅ **Status:** Build folder contains the compiled JavaScript at `build/src/index.js`

## Configuration

Configure Cursor/VS Code to use the MCP server.

### Step 1: Open MCP Settings

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Type "MCP Settings" and select **"MCP: Edit Settings"** or **"Preferences: Open User Settings (JSON)"**

### Step 2: Add Configuration

**If you installed from npm (Option 1):**
```json
{
  "mcp": {
    "servers": {
      "mcp-capitol-trades": {
        "command": "mcp-capitol-trades"
      }
    }
  }
}
```

**If you installed from source (Option 2):**
```json
{
  "mcp": {
    "servers": {
      "mcp-capitol-trades": {
        "command": "node",
        "args": [
          "C:/Users/anguslin/Projects/mcp-capitol-trades/build/src/index.js"
        ]
      }
    }
  }
}
```

**Important:** Update the path to your actual project location for source installs!

### Step 3: Save and Restart

1. Save the settings file (`Ctrl+S` / `Cmd+S`)
2. Restart Cursor/VS Code completely to load the MCP server

### Verify Installation

After restarting, you should see the MCP Capitol Trades server available in your AI chat interface.

## Tools Provided

| Tool | Description |
|------|-------------|
| `get_politician_trades` | Extract politician trades with advanced filtering options |
| `get_top_traded_assets` | Get the most traded assets (stocks, ETFs, mutual funds, bonds) by politicians ranked by volume |
| `get_politician_stats` | Get comprehensive statistics for a specific politician |
| `get_asset_stats` | Get comprehensive statistics for a specific asset (stock, ETF, mutual fund, bond) |
| `get_buy_momentum_assets` | Get assets (stocks, ETFs, mutual funds, bonds) with high buy momentum from politician activity |
| `get_party_buy_momentum` | Get buy momentum broken down by political party for all asset types |

---

### `get_politician_trades`

Extract politician trades with advanced filtering options. Get detailed trade information including transaction types, sizes, and prices.

**Parameters:**
- `symbol` (optional): Asset ticker or name (e.g., 'Apple', 'AAPL', 'VOO')
- `politician` (optional): Politician name (e.g., 'Nancy Pelosi')
- `party` (optional): "DEMOCRAT" or "REPUBLICAN"
- `type` (optional): Array - ["BUY", "SELL", "RECEIVE", "EXCHANGE"]
- `days` (optional): 30, 90, 180, or 365 (default: 90)

**Example Prompts:**
```
"Show me all politician trades for Apple"
"What did Nancy Pelosi trade recently?"
"Get Democrat buys in the last 90 days"
"Find all Republican trades for Microsoft"
"What trades did Nancy Pelosi make in the last 30 days?"
```

---

### `get_top_traded_assets`

Get the most traded assets (stocks, ETFs, mutual funds, bonds) by politicians over a time period, ranked by number of trades.

**Parameters:**
- `limit` (optional): Number of top assets to return (default: 10, max: 50)
- `days` (optional): 30, 90, 180, or 365 (default: 90)

**Example Prompts:**
```
"What assets are politicians trading the most?"
"Show me the top 20 most traded assets in the last 180 days"
"What are the most popular assets among politicians?"
```

---

### `get_politician_stats`

Get comprehensive statistics for a specific politician including total trades, buy/sell ratio, top holdings, and trading activity breakdown.

**Parameters:**
- `politician` (required): Politician name (e.g., 'Nancy Pelosi', 'Michael')
- `days` (optional): 30, 90, 180, or 365 (default: 90)

**Example Prompts:**
```
"Get detailed stats for Nancy Pelosi's trading"
"Show me Michael Jordan's trading statistics"
"What are Nancy Pelosi's top holdings?"
"Give me a breakdown of Pelosi's trading activity"
```

---

### `get_asset_stats`

Get comprehensive statistics for a specific asset (stock, ETF, mutual fund, bond) including total trades, buy/sell ratio, most active traders, and trading activity breakdown.

**Parameters:**
- `symbol` (required): Ticker or asset name (e.g., 'Apple', 'AAPL', 'VOO', 'Microsoft')
- `days` (optional): 30, 90, 180, or 365 (default: 90)

**Example Prompts:**
```
"Show me detailed statistics for Microsoft"
"What are the stats for VOO trading?"
"Who are the most active traders of Apple stock?"
"Get buy/sell breakdown for NVDA"
```

---

### `get_buy_momentum_assets`

Get assets (stocks, ETFs, mutual funds, bonds) with high buy momentum from politician trading activity. Shows assets where politicians are net buyers with scoring based on volume and conviction.

**Parameters:**
- `limit` (optional): Number of top assets to return (default: 10, max: 50)
- `days` (optional): 30, 90, 180, or 365 (default: 90)

**Example Prompts:**
```
"Which stocks should I be buying?"
"Show me assets with strong buy momentum"
"What are politicians buying the most?"
"Find stocks with high buying pressure from congress"
```

---

### `get_party_buy_momentum`

Get buy momentum broken down by political party. Shows consensus assets (stocks, ETFs, mutual funds, bonds) where both parties are buying, Democrat favorites, and Republican favorites.

**Parameters:**
- `limit` (optional): Number of top assets per category (default: 5, max: 20)
- `days` (optional): 30, 90, 180, or 365 (default: 90)

**Example Prompts:**
```
"What are Democrats vs Republicans buying?"
"Show me party-specific buy momentum"
"Which stocks do Democrats favor?"
"What are Republicans buying most?"
"Find consensus stocks that both parties are buying"
```

### Tips

- Search by company name or ticker (e.g., "Apple" or "AAPL")
- Search by politician first, last, or full name (e.g., "Nancy", "Pelosi", "Nancy Pelosi")
- Supports ETFs and bonds too (e.g., "VOO", "VBTLX")
- All parameters are optional for flexible queries
- Use natural language to query any of the tools above

## Technical Details

- **Protocol:** Model Context Protocol (MCP)
- **Transport:** stdio
- **Language:** TypeScript
- **Runtime:** Node.js 18+
- **Dependencies:**
  - `@modelcontextprotocol/sdk` - MCP SDK
  - `axios` - HTTP client
  - `cheerio` - HTML parsing (static, fast, no browser required)

## Additional Documentation

- **[TESTING.md](TESTING.md)** - Testing guide and scenarios

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

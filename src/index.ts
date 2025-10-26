#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
export * from "./types.js";

// Import the trade parsing functions
import { scrapePoliticianTrades } from "./politician-trades-scraper.js";
import { findLink } from "./web-scraper.js";

/**
 * MCP Capitol Trades Server
 * Provides tools for extracting politician stock trades with prices from Capitol Trades
 */

// Define available tools
const TOOLS: Tool[] = [
   {
    name: "get_politician_trades",
    description:
      "Get politician stock trades with price information from Capitol Trades. Searches for a stock by ticker or company name and returns recent trades by politicians.",
    inputSchema: {
      type: "object",
      properties: {
        stock: {
          type: "string",
          description: "The stock ticker symbol or company name to search for (e.g., 'Apple', 'AAPL', 'Microsoft')",
        },
        days: {
          type: "number",
          enum: [30, 90, 180, 365],
          description: "Number of days to look back for trades. Must be one of: 30, 90, 180, or 365 days",
          default: 90,
        },
      },
      required: ["stock"],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "mcp-capitol-trades-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handler for executing tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error("Arguments are required");
    }

    switch (name) {
      case "get_politician_trades": {
        const stock = args.stock as string;
        const days = (args.days as number) || 90;
        
        if (!stock) {
          throw new Error("stock is required");
        }

        // Validate that days is one of the allowed values
        const allowedDays = [30, 90, 180, 365];
        if (!allowedDays.includes(days)) {
          throw new Error(`days must be one of: ${allowedDays.join(', ')}`);
        }

        const result = await getPoliticianTrades(stock, days);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});


/**
 * Get politician trades for a specific stock
 */
async function getPoliticianTrades(stock: string, days: number) {
  const url = "https://www.capitoltrades.com/issuers";
  const urlWithQueryParams = `${url}?search=${stock}`;
  const scrapedLinkIncludes = "issuers/";
  const scrapedLinkQueryParams = `?txDate=${days}d`;

  try {
    // Find the issuer page link
    const linkResult = await findLink(
      urlWithQueryParams,
      (link) => {
        return link.href.includes(scrapedLinkIncludes);
      }
    );

    // Construct the URL with date filter
    const urlWithScrapedLinkQueryParams = `${linkResult.targetUrl}${scrapedLinkQueryParams}`;
    
    // Get trades with prices
    const trades = await scrapePoliticianTrades(urlWithScrapedLinkQueryParams);
    
    return {
      stock,
      days,
      totalTrades: trades.length,
      trades,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get politician trades: ${errorMessage}`);
  }
}

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("MCP Capitol Trades Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


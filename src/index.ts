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
import { scrapePoliticianTrades, getIssuerId, getPoliticianId } from "./politician-trades-scraper.js";

/**
 * MCP Capitol Trades Server
 * Provides tools for extracting politician stock trades with prices from Capitol Trades
 */

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "get_politician_trades",
    description:
      "Get politician trades with advanced filters. Filter by issuer, politician, party, transaction type, and time period.",
    inputSchema: {
      type: "object",
      properties: {
        stock: {
          type: "string",
          description: "Optional: The stock ticker symbol or company name (e.g., 'Apple', 'AAPL'). If provided, filters trades for that stock.",
        },
        politician: {
          type: "string",
          description: "Optional: The politician name to search for (e.g., 'Michael', 'Nancy Pelosi'). If provided, filters trades for that politician.",
        },
        party: {
          type: "string",
          enum: ["DEMOCRAT", "REPUBLICAN"],
          description: "Filter by party affiliation. Options: 'DEMOCRAT' or 'REPUBLICAN'. If null or not provided, treats as ALL (no filter).",
        },
        type: {
          type: "array",
          items: {
            type: "string",
            enum: ["BUY", "SELL", "RECEIVE", "EXCHANGE"],
          },
          description: "Filter by transaction type(s). Can specify any combination of 'BUY', 'SELL', 'RECEIVE', 'EXCHANGE'. If all 4 are specified or empty array, treats as ALL (no filter).",
          default: [],
        },
        days: {
          type: "number",
          enum: [30, 90, 180, 365],
          description: "Number of days to look back for trades. Must be one of: 30, 90, 180, or 365 days",
          default: 90,
        },
      },
      required: [],
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
        const stock = args.stock as string | null;
        const politician = args.politician as string | null;
        // Normalize party: undefined or null both become null
        const party = args.party === undefined || args.party === null ? null : (args.party as string);
        const type = (args.type as string[]) || [];
        const days = (args.days as number) || 90;

        // Validate that days is one of the allowed values
        const allowedDays = [30, 90, 180, 365];
        if (!allowedDays.includes(days)) {
          throw new Error(`days must be one of: ${allowedDays.join(', ')}`);
        }

        // Validate party - must be DEMOCRAT, REPUBLICAN, or null (treated as ALL)
        if (party !== null && party !== "DEMOCRAT" && party !== "REPUBLICAN") {
          throw new Error(`party must be 'DEMOCRAT' or 'REPUBLICAN'`);
        }

        // Validate type array - must be array of strings
        if (!Array.isArray(type)) {
          throw new Error("type must be an array of strings");
        }

        // Validate each type in the array
        const allowedTypeValues = ["BUY", "SELL", "RECEIVE", "EXCHANGE"];
        for (const t of type) {
          if (!allowedTypeValues.includes(t)) {
            throw new Error(`Each type must be one of: ${allowedTypeValues.join(', ')}`);
          }
        }

        const result = await getPoliticianTrades(stock, politician, party, type, days);
        
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
 * Get politician trades with advanced filters
 */
async function getPoliticianTrades(
  stock: string | null,
  politician: string | null,
  party: string | null,
  type: string[],
  days: number
) {
  try {
    const baseUrl = "https://www.capitoltrades.com/trades";
    const params: string[] = [];

    // Get issuer ID if stock is provided
    if (stock) {
      const issuerId = await getIssuerId(stock);
      params.push(`issuer=${issuerId}`);
    }

    // Get politician ID if politician is provided
    if (politician) {
      const politicianId = await getPoliticianId(politician);
      params.push(`politician=${politicianId}`);
    }

    // Add party filter if provided (not null)
    if (party !== null) {
      params.push(`party=${party.toLowerCase()}`);
    }

    // Add type filter(s) if not ALL
    // If array has all 4 types OR is empty, treat as ALL (no filter)
    const allTypes = ["BUY", "SELL", "RECEIVE", "EXCHANGE"];
    const hasAllTypes = type.length === 4 && allTypes.every(t => type.includes(t));
    const isAll = type.length === 0 || hasAllTypes;
    
    if (!isAll && type.length > 0) {
      // Join types with comma for multiple filters
      const typeParam = type.map(t => t.toLowerCase()).join(",");
      params.push(`txType=${typeParam}`);
    }

    // Add date filter
    params.push(`txDate=${days}d`);

    // Construct the full URL
    const url = `${baseUrl}?${params.join("&")}`;
    
    console.error(`Fetching politician trades from: ${url}`);
    
    // Get politician trades (limit to 50 by default)
    const trades = await scrapePoliticianTrades(url, 50);
    
    return {
      filters: {
        stock: stock || null,
        politician: politician || null,
        party: party || "ALL",
        type: type.length === 0 || hasAllTypes ? "ALL" : type,
        days: days,
      },
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


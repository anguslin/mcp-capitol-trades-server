/**
 * TypeScript type definitions for politician trade data
 */

export interface Politician {
  name: string;
  party: string;
  chamber: string;
  state: string;
}

export interface Issuer {
  name: string;
  ticker: string;
}

export interface TradeDates {
  disclosure: string;
  trade: string;
  reportingGap: string;
}

export interface TransactionWithPrice {
  type: string;
  size: string;
  price: string;
}

export interface TransactionWithOwner {
  type: string;
  owner: string;
  size: string;
  price: string;
}

export interface TradeWithPrice {
  index: number;
  politician: Politician;
  issuer: Issuer;
  dates: TradeDates;
  transaction: TransactionWithPrice;
}

export interface TradeWithOwner {
  index: number;
  politician: Politician;
  issuer: Issuer | null;
  dates: TradeDates;
  transaction: TransactionWithOwner;
  detailUrl: string | null;
}

export type Trade = TradeWithPrice | TradeWithOwner;


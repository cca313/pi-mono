import type { MarketCandle, Timeframe } from "../types.js";

export interface QuoteRequest {
	symbol: string;
	timeframe: Timeframe;
	limit: number;
}

export interface QuoteProvider {
	name: string;
	getCandles(request: QuoteRequest): Promise<MarketCandle[]>;
}

export interface RoutedQuoteResult {
	candles: MarketCandle[];
	sourceUsed: string;
	warnings: string[];
}

export type FundamentalsSection = "valuation" | "profitability" | "growth" | "balance-sheet";

export interface FundamentalsRequest {
	symbol: string;
	requestedSections: FundamentalsSection[];
}

export interface FundamentalsSnapshot {
	symbol: string;
	asOf: number;
	sections: Partial<Record<FundamentalsSection, Record<string, number | string | null>>>;
}

export interface FundamentalsProvider {
	getFundamentals(request: FundamentalsRequest): Promise<FundamentalsSnapshot>;
}

export interface RoutedFundamentalsResult {
	fundamentals: FundamentalsSnapshot;
	sourceUsed: string;
	warnings: string[];
	missingSections: FundamentalsSection[];
	coverage: "partial" | "full";
}

export type FinanceDataProvider = QuoteProvider & Partial<FundamentalsProvider>;

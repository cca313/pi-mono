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

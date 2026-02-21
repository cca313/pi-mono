import type { QuoteProvider } from "../providers/types.js";
import type { AnalysisReport } from "../report/generate-report.js";
import type { MarketCandle, Timeframe } from "../types.js";

export interface FinanceMarketData {
	symbol: string;
	timeframe: Timeframe;
	limit: number;
	sourceUsed: string;
	warnings: string[];
	candles: MarketCandle[];
	fetchedAt: number;
}

export interface FinanceIndicatorData {
	lastClose: number;
	sma20: number;
	ema20: number;
	rsi14: number;
	macdLine: number;
	macdSignal: number;
	macdHistogram: number;
	volatilityAnnualized: number;
	maxDrawdown: number;
}

export interface RunFinanceWorkflowInput {
	symbol: string;
	timeframe?: string;
	limit?: number;
	providers: QuoteProvider[];
}

export interface RunFinanceWorkflowResult {
	analysisId: string;
	market: FinanceMarketData;
	indicators: FinanceIndicatorData;
	report: AnalysisReport;
}

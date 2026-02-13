import {
	computeEma,
	computeMacd,
	computeMaxDrawdown,
	computeRsi,
	computeSma,
	computeVolatility,
} from "./indicators/index.js";
import { quoteRouter } from "./providers/router.js";
import type { QuoteProvider } from "./providers/types.js";
import { type AnalysisReport, generateReport } from "./report/generate-report.js";
import { normalizeTimeframe, type Timeframe } from "./types.js";

export interface AnalyzeSymbolInput {
	symbol: string;
	timeframe?: string;
	limit?: number;
	providers: QuoteProvider[];
}

export interface AnalyzeSymbolResult {
	symbol: string;
	timeframe: Timeframe;
	sourceUsed: string;
	warnings: string[];
	report: AnalysisReport;
}

export async function analyzeSymbol(input: AnalyzeSymbolInput): Promise<AnalyzeSymbolResult> {
	const timeframe = normalizeTimeframe(input.timeframe);
	const routed = await quoteRouter(
		{
			symbol: input.symbol,
			timeframe,
			limit: input.limit ?? 200,
		},
		input.providers,
	);

	const closes = routed.candles.map((item) => item.close);
	const lastClose = closes[closes.length - 1];
	const sma20 = computeSma(closes, 20);
	const ema20 = computeEma(closes, 20);
	const rsi14 = computeRsi(closes, 14);
	const macd = computeMacd(closes, 12, 26, 9);
	const volatilityAnnualized = computeVolatility(closes, 20);
	const maxDrawdown = computeMaxDrawdown(closes);

	const report = generateReport({
		symbol: input.symbol,
		timeframe,
		sourceUsed: routed.sourceUsed,
		lastClose,
		sma20,
		ema20,
		rsi14,
		macdLine: macd.line,
		macdSignal: macd.signal,
		macdHistogram: macd.histogram,
		volatilityAnnualized,
		maxDrawdown,
		warnings: routed.warnings,
	});

	return {
		symbol: input.symbol,
		timeframe,
		sourceUsed: routed.sourceUsed,
		warnings: routed.warnings,
		report,
	};
}

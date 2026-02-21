import { randomUUID } from "node:crypto";
import { FinanceAssistantError } from "../errors.js";
import { quoteRouter } from "../providers/router.js";
import { type AnalysisReport, generateReport } from "../report/generate-report.js";
import { normalizeTimeframe } from "../types.js";
import { computeFinanceIndicators } from "./compute-finance-indicators.js";
import type { FinanceMarketData, RunFinanceWorkflowInput, RunFinanceWorkflowResult } from "./types.js";

const DEFAULT_LIMIT = 200;

export function buildFinanceReportInput(
	market: FinanceMarketData,
	indicators: ReturnType<typeof computeFinanceIndicators>,
) {
	return {
		symbol: market.symbol,
		timeframe: market.timeframe,
		sourceUsed: market.sourceUsed,
		lastClose: indicators.lastClose,
		sma20: indicators.sma20,
		ema20: indicators.ema20,
		rsi14: indicators.rsi14,
		macdLine: indicators.macdLine,
		macdSignal: indicators.macdSignal,
		macdHistogram: indicators.macdHistogram,
		volatilityAnnualized: indicators.volatilityAnnualized,
		maxDrawdown: indicators.maxDrawdown,
		warnings: market.warnings,
	};
}

export function buildFinanceMarketData(input: {
	symbol: string;
	timeframe?: string;
	limit?: number;
	sourceUsed: string;
	warnings: string[];
	candles: FinanceMarketData["candles"];
}): FinanceMarketData {
	return {
		symbol: input.symbol.toUpperCase(),
		timeframe: normalizeTimeframe(input.timeframe),
		limit: input.limit ?? DEFAULT_LIMIT,
		sourceUsed: input.sourceUsed,
		warnings: input.warnings,
		candles: input.candles,
		fetchedAt: Date.now(),
	};
}

export function buildFinanceReport(
	market: FinanceMarketData,
	indicators: ReturnType<typeof computeFinanceIndicators>,
): AnalysisReport {
	return generateReport(buildFinanceReportInput(market, indicators));
}

export async function runFinanceWorkflow(input: RunFinanceWorkflowInput): Promise<RunFinanceWorkflowResult> {
	if (input.providers.length === 0) {
		throw new FinanceAssistantError("PROVIDERS_FAILED", "No quote providers configured");
	}

	const symbol = input.symbol.toUpperCase();
	const timeframe = normalizeTimeframe(input.timeframe);
	const limit = input.limit ?? DEFAULT_LIMIT;

	const routed = await quoteRouter(
		{
			symbol,
			timeframe,
			limit,
		},
		input.providers,
	);

	const market = buildFinanceMarketData({
		symbol,
		timeframe,
		limit,
		sourceUsed: routed.sourceUsed,
		warnings: routed.warnings,
		candles: routed.candles,
	});
	const indicators = computeFinanceIndicators(market.candles);
	const report = buildFinanceReport(market, indicators);

	return {
		analysisId: randomUUID(),
		market,
		indicators,
		report,
	};
}

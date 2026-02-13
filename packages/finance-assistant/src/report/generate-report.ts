export type ReportConfidence = "low" | "medium" | "high";

export interface ReportInput {
	symbol: string;
	timeframe: string;
	sourceUsed: string;
	lastClose: number;
	sma20: number;
	ema20: number;
	rsi14: number;
	macdLine: number;
	macdSignal: number;
	macdHistogram: number;
	volatilityAnnualized: number;
	maxDrawdown: number;
	warnings: string[];
}

export interface AnalysisReport {
	symbol: string;
	timeframe: string;
	sourceUsed: string;
	conclusion: string;
	keyEvidence: string[];
	riskPoints: string[];
	watchLevels: string[];
	confidence: ReportConfidence;
	disclaimer: string;
	warnings: string[];
}

function computeConfidence(input: ReportInput): ReportConfidence {
	if (!Number.isFinite(input.volatilityAnnualized) || input.volatilityAnnualized > 0.45) {
		return "low";
	}

	if (input.rsi14 >= 45 && input.rsi14 <= 70 && input.macdHistogram > 0) {
		return "high";
	}

	return "medium";
}

export function generateReport(input: ReportInput): AnalysisReport {
	const trendUp = input.lastClose >= input.sma20 && input.lastClose >= input.ema20;
	const momentumUp = input.macdHistogram >= 0;
	const state = trendUp && momentumUp ? "bullish" : trendUp ? "neutral-to-bullish" : "neutral-to-bearish";

	return {
		symbol: input.symbol,
		timeframe: input.timeframe,
		sourceUsed: input.sourceUsed,
		conclusion: `${input.symbol} on ${input.timeframe} appears ${state} with close ${input.lastClose.toFixed(2)}.`,
		keyEvidence: [
			`Price ${input.lastClose.toFixed(2)} vs SMA20 ${input.sma20.toFixed(2)} and EMA20 ${input.ema20.toFixed(2)}.`,
			`RSI14 at ${input.rsi14.toFixed(2)}.`,
			`MACD line ${input.macdLine.toFixed(3)} vs signal ${input.macdSignal.toFixed(3)} (hist ${input.macdHistogram.toFixed(3)}).`,
		],
		riskPoints: [
			`Annualized volatility ${input.volatilityAnnualized.toFixed(3)} may increase swings.`,
			`Observed max drawdown ${Math.abs(input.maxDrawdown * 100).toFixed(2)}%.`,
		],
		watchLevels: [`Support watch: EMA20 ${input.ema20.toFixed(2)}.`, `Trend watch: SMA20 ${input.sma20.toFixed(2)}.`],
		confidence: computeConfidence(input),
		disclaimer: "For research and educational purposes only, not investment advice.",
		warnings: input.warnings,
	};
}

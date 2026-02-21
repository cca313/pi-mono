import { FinanceAssistantError } from "../errors.js";
import {
	computeEma,
	computeMacd,
	computeMaxDrawdown,
	computeRsi,
	computeSma,
	computeVolatility,
} from "../indicators/index.js";
import type { MarketCandle } from "../types.js";
import type { FinanceIndicatorData } from "./types.js";

const MIN_REQUIRED_CANDLES = 30;

export function computeFinanceIndicators(candles: MarketCandle[]): FinanceIndicatorData {
	if (candles.length < MIN_REQUIRED_CANDLES) {
		throw new FinanceAssistantError(
			"INSUFFICIENT_DATA",
			`At least ${MIN_REQUIRED_CANDLES} candles are required, got ${candles.length}`,
		);
	}

	const closes = candles.map((item) => item.close);
	const lastClose = closes[closes.length - 1];
	const sma20 = computeSma(closes, 20);
	const ema20 = computeEma(closes, 20);
	const rsi14 = computeRsi(closes, 14);
	const macd = computeMacd(closes, 12, 26, 9);
	const volatilityAnnualized = computeVolatility(closes, 20);
	const maxDrawdown = computeMaxDrawdown(closes);

	if (
		!Number.isFinite(lastClose) ||
		!Number.isFinite(sma20) ||
		!Number.isFinite(ema20) ||
		!Number.isFinite(rsi14) ||
		!Number.isFinite(macd.line) ||
		!Number.isFinite(macd.signal) ||
		!Number.isFinite(macd.histogram) ||
		!Number.isFinite(volatilityAnnualized) ||
		!Number.isFinite(maxDrawdown)
	) {
		throw new FinanceAssistantError("INSUFFICIENT_DATA", "Cannot compute indicators from the current candle set");
	}

	return {
		lastClose,
		sma20,
		ema20,
		rsi14,
		macdLine: macd.line,
		macdSignal: macd.signal,
		macdHistogram: macd.histogram,
		volatilityAnnualized,
		maxDrawdown,
	};
}

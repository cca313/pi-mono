export const SUPPORTED_TIMEFRAMES = ["1H", "1D", "1W", "1M"] as const;

export type Timeframe = (typeof SUPPORTED_TIMEFRAMES)[number];

export interface MarketCandle {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface SymbolQuery {
	symbol: string;
	timeframe?: string;
	limit?: number;
}

export function isSupportedTimeframe(value: string): value is Timeframe {
	return SUPPORTED_TIMEFRAMES.includes(value as Timeframe);
}

export function normalizeTimeframe(value: string | undefined): Timeframe {
	if (!value) {
		return "1D";
	}

	const normalized = value.toUpperCase();
	return isSupportedTimeframe(normalized) ? normalized : "1D";
}

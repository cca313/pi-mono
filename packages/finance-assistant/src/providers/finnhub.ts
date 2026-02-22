import { FinanceAssistantError } from "../errors.js";
import type { MarketCandle } from "../types.js";
import type { FundamentalsRequest, FundamentalsSnapshot, QuoteProvider, QuoteRequest } from "./types.js";

interface FinnhubCandleResponse {
	c: number[];
	h: number[];
	l: number[];
	o: number[];
	v: number[];
	t: number[];
	s: string;
}

interface FinnhubMetricResponse {
	metric?: Record<string, number | string | null>;
}

function toNumber(value: number | string | null | undefined): number | undefined {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}

	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	return undefined;
}

function pickMetric(metrics: Record<string, number | string | null>, keys: readonly string[]): number | undefined {
	for (const key of keys) {
		const value = toNumber(metrics[key]);
		if (typeof value === "number") {
			return value;
		}
	}

	return undefined;
}

function compactNumericRecord(input: Record<string, number | undefined>): Record<string, number> | undefined {
	const entries = Object.entries(input).filter((entry): entry is [string, number] => typeof entry[1] === "number");
	if (entries.length === 0) {
		return undefined;
	}

	return Object.fromEntries(entries);
}

export class FinnhubProvider implements QuoteProvider {
	public readonly name = "finnhub";
	private readonly apiKey: string;

	public constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	public async getCandles(request: QuoteRequest): Promise<MarketCandle[]> {
		const now = Math.floor(Date.now() / 1000);
		const from = now - request.limit * 24 * 60 * 60;
		const resolution =
			request.timeframe === "1H" ? "60" : request.timeframe === "1W" ? "W" : request.timeframe === "1M" ? "M" : "D";
		const url = new URL("https://finnhub.io/api/v1/stock/candle");
		url.searchParams.set("symbol", request.symbol);
		url.searchParams.set("resolution", resolution);
		url.searchParams.set("from", String(from));
		url.searchParams.set("to", String(now));
		url.searchParams.set("token", this.apiKey);

		const response = await fetch(url);
		if (!response.ok) {
			throw new FinanceAssistantError("FINNHUB_HTTP", `Finnhub request failed with status ${response.status}`);
		}

		const payload = (await response.json()) as FinnhubCandleResponse;
		if (!payload.c || !payload.t) {
			return [];
		}

		const candles: MarketCandle[] = [];
		for (let i = 0; i < payload.t.length; i++) {
			candles.push({
				timestamp: payload.t[i] * 1000,
				open: payload.o[i],
				high: payload.h[i],
				low: payload.l[i],
				close: payload.c[i],
				volume: payload.v[i],
			});
		}

		return candles;
	}

	public async getFundamentals(request: FundamentalsRequest): Promise<FundamentalsSnapshot> {
		const url = new URL("https://finnhub.io/api/v1/stock/metric");
		url.searchParams.set("symbol", request.symbol.toUpperCase());
		url.searchParams.set("metric", "all");
		url.searchParams.set("token", this.apiKey);

		const response = await fetch(url);
		if (!response.ok) {
			throw new FinanceAssistantError("FINNHUB_HTTP", `Finnhub request failed with status ${response.status}`);
		}

		const payload = (await response.json()) as FinnhubMetricResponse;
		const metrics = payload.metric;
		if (!metrics) {
			throw new FinanceAssistantError(
				"FINNHUB_FUNDAMENTALS_EMPTY",
				"Finnhub fundamentals response missing metric payload",
			);
		}

		const sections: FundamentalsSnapshot["sections"] = {};
		const requested = new Set(request.requestedSections);

		if (requested.has("valuation")) {
			const valuation = compactNumericRecord({
				peTTM: pickMetric(metrics, ["peTTM"]),
				psTTM: pickMetric(metrics, ["psTTM"]),
				pbQuarterly: pickMetric(metrics, ["pbQuarterly"]),
				marketCapitalization: pickMetric(metrics, ["marketCapitalization"]),
			});
			if (valuation) {
				sections.valuation = valuation;
			}
		}

		if (requested.has("profitability")) {
			const profitability = compactNumericRecord({
				grossMarginTTM: pickMetric(metrics, ["grossMarginTTM"]),
				netMargin: pickMetric(metrics, ["netMargin"]),
				operatingMarginTTM: pickMetric(metrics, ["operatingMarginTTM"]),
				roeTTM: pickMetric(metrics, ["roeTTM"]),
				roaTTM: pickMetric(metrics, ["roaTTM"]),
			});
			if (profitability) {
				sections.profitability = profitability;
			}
		}

		if (requested.has("growth")) {
			const growth = compactNumericRecord({
				revenueGrowth3Y: pickMetric(metrics, ["revenueGrowth3Y"]),
				epsGrowth5Y: pickMetric(metrics, ["epsGrowth5Y"]),
				epsGrowthQuarterlyYoy: pickMetric(metrics, ["epsGrowthQuarterlyYoy", "epsGrowthTTMYoy"]),
			});
			if (growth) {
				sections.growth = growth;
			}
		}

		if (requested.has("balance-sheet")) {
			const balanceSheet = compactNumericRecord({
				totalDebtToEquityAnnual: pickMetric(metrics, ["totalDebt/totalEquityAnnual"]),
				totalDebtToEquityQuarterly: pickMetric(metrics, ["totalDebt/totalEquityQuarterly"]),
				currentRatioQuarterly: pickMetric(metrics, ["currentRatioQuarterly"]),
				bookValuePerShareAnnual: pickMetric(metrics, ["bookValuePerShareAnnual"]),
			});
			if (balanceSheet) {
				sections["balance-sheet"] = balanceSheet;
			}
		}

		if (Object.keys(sections).length === 0) {
			throw new FinanceAssistantError(
				"FINNHUB_FUNDAMENTALS_EMPTY",
				"Finnhub fundamentals response had no mappable fields",
			);
		}

		return {
			symbol: request.symbol.toUpperCase(),
			asOf: Date.now(),
			sections,
		};
	}
}

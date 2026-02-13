import { FinanceAssistantError } from "../errors.js";
import type { MarketCandle } from "../types.js";
import type { QuoteProvider, QuoteRequest } from "./types.js";

interface FinnhubCandleResponse {
	c: number[];
	h: number[];
	l: number[];
	o: number[];
	v: number[];
	t: number[];
	s: string;
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
}

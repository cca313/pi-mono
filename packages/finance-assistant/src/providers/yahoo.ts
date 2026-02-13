import { FinanceAssistantError } from "../errors.js";
import type { MarketCandle } from "../types.js";
import type { QuoteProvider, QuoteRequest } from "./types.js";

interface YahooChartResponse {
	chart?: {
		result?: Array<{
			timestamp?: number[];
			indicators?: {
				quote?: Array<{
					open?: Array<number | null>;
					high?: Array<number | null>;
					low?: Array<number | null>;
					close?: Array<number | null>;
					volume?: Array<number | null>;
				}>;
			};
		}>;
	};
}

export class YahooProvider implements QuoteProvider {
	public readonly name = "yahoo";

	public async getCandles(request: QuoteRequest): Promise<MarketCandle[]> {
		const interval =
			request.timeframe === "1H"
				? "1h"
				: request.timeframe === "1W"
					? "1wk"
					: request.timeframe === "1M"
						? "1mo"
						: "1d";
		const range =
			request.timeframe === "1H"
				? "1mo"
				: request.timeframe === "1W"
					? "2y"
					: request.timeframe === "1M"
						? "10y"
						: "1y";
		const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${request.symbol}`);
		url.searchParams.set("interval", interval);
		url.searchParams.set("range", range);

		const response = await fetch(url);
		if (!response.ok) {
			throw new FinanceAssistantError("YAHOO_HTTP", `Yahoo request failed with status ${response.status}`);
		}

		const payload = (await response.json()) as YahooChartResponse;
		const result = payload.chart?.result?.[0];
		const quote = result?.indicators?.quote?.[0];
		const timestamps = result?.timestamp;

		if (!quote || !timestamps) {
			return [];
		}

		const candles: MarketCandle[] = [];
		for (let i = 0; i < timestamps.length; i++) {
			const open = quote.open?.[i];
			const high = quote.high?.[i];
			const low = quote.low?.[i];
			const close = quote.close?.[i];
			const volume = quote.volume?.[i];
			if (
				typeof open !== "number" ||
				typeof high !== "number" ||
				typeof low !== "number" ||
				typeof close !== "number" ||
				typeof volume !== "number"
			) {
				continue;
			}

			candles.push({
				timestamp: timestamps[i] * 1000,
				open,
				high,
				low,
				close,
				volume,
			});
		}

		if (candles.length <= request.limit) {
			return candles;
		}

		return candles.slice(candles.length - request.limit);
	}
}

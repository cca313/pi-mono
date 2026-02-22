import { FinanceAssistantError } from "../errors.js";
import type { MarketCandle } from "../types.js";
import type { FundamentalsRequest, FundamentalsSnapshot, QuoteProvider, QuoteRequest } from "./types.js";

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

interface YahooQuoteValue {
	raw?: number | null;
	fmt?: string;
	longFmt?: string;
}

interface YahooQuoteSummaryResponse {
	quoteSummary?: {
		result?: Array<{
			summaryDetail?: Record<string, YahooQuoteValue>;
			defaultKeyStatistics?: Record<string, YahooQuoteValue>;
			financialData?: Record<string, YahooQuoteValue>;
			price?: Record<string, YahooQuoteValue>;
		}>;
		error?: { code?: string; description?: string } | null;
	};
}

function getYahooRaw(record: Record<string, YahooQuoteValue> | undefined, key: string): number | undefined {
	const value = record?.[key]?.raw;
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function compactNumericRecord(input: Record<string, number | undefined>): Record<string, number> | undefined {
	const entries = Object.entries(input).filter((entry): entry is [string, number] => typeof entry[1] === "number");
	if (entries.length === 0) {
		return undefined;
	}

	return Object.fromEntries(entries);
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

	public async getFundamentals(request: FundamentalsRequest): Promise<FundamentalsSnapshot> {
		const symbol = request.symbol.toUpperCase();
		const url = new URL(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`);
		url.searchParams.set("modules", "summaryDetail,defaultKeyStatistics,financialData,price");

		const response = await fetch(url);
		if (!response.ok) {
			throw new FinanceAssistantError("YAHOO_HTTP", `Yahoo request failed with status ${response.status}`);
		}

		const payload = (await response.json()) as YahooQuoteSummaryResponse;
		const result = payload.quoteSummary?.result?.[0];
		if (!result) {
			const reason = payload.quoteSummary?.error?.description ?? "missing quoteSummary result";
			throw new FinanceAssistantError("YAHOO_FUNDAMENTALS_EMPTY", `Yahoo fundamentals unavailable: ${reason}`);
		}

		const summaryDetail = result.summaryDetail;
		const statistics = result.defaultKeyStatistics;
		const financialData = result.financialData;
		const price = result.price;
		const sections: FundamentalsSnapshot["sections"] = {};
		const requested = new Set(request.requestedSections);

		if (requested.has("valuation")) {
			const valuation = compactNumericRecord({
				trailingPE: getYahooRaw(summaryDetail, "trailingPE"),
				forwardPE: getYahooRaw(summaryDetail, "forwardPE"),
				priceToSalesTrailing12Months:
					getYahooRaw(summaryDetail, "priceToSalesTrailing12Months") ??
					getYahooRaw(financialData, "priceToSalesTrailing12Months"),
				priceToBook: getYahooRaw(statistics, "priceToBook"),
				marketCap: getYahooRaw(price, "marketCap"),
			});
			if (valuation) {
				sections.valuation = valuation;
			}
		}

		if (requested.has("profitability")) {
			const profitability = compactNumericRecord({
				profitMargins: getYahooRaw(financialData, "profitMargins"),
				operatingMargins: getYahooRaw(financialData, "operatingMargins"),
				grossMargins: getYahooRaw(financialData, "grossMargins"),
				returnOnAssets: getYahooRaw(financialData, "returnOnAssets"),
				returnOnEquity: getYahooRaw(financialData, "returnOnEquity"),
			});
			if (profitability) {
				sections.profitability = profitability;
			}
		}

		if (requested.has("growth")) {
			const growth = compactNumericRecord({
				revenueGrowth: getYahooRaw(financialData, "revenueGrowth"),
				earningsGrowth: getYahooRaw(financialData, "earningsGrowth"),
			});
			if (growth) {
				sections.growth = growth;
			}
		}

		if (requested.has("balance-sheet")) {
			const balanceSheet = compactNumericRecord({
				debtToEquity: getYahooRaw(financialData, "debtToEquity"),
				totalDebt: getYahooRaw(financialData, "totalDebt"),
				totalCash: getYahooRaw(financialData, "totalCash"),
				bookValue: getYahooRaw(statistics, "bookValue"),
			});
			if (balanceSheet) {
				sections["balance-sheet"] = balanceSheet;
			}
		}

		if (Object.keys(sections).length === 0) {
			throw new FinanceAssistantError(
				"YAHOO_FUNDAMENTALS_EMPTY",
				"Yahoo fundamentals response had no mappable fields",
			);
		}

		return {
			symbol,
			asOf: Date.now(),
			sections,
		};
	}
}

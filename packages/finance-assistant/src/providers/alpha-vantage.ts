import { FinanceAssistantError } from "../errors.js";
import type { MarketCandle } from "../types.js";
import type { FundamentalsRequest, FundamentalsSnapshot, QuoteProvider, QuoteRequest } from "./types.js";

interface AlphaVantageRow {
	"1. open": string;
	"2. high": string;
	"3. low": string;
	"4. close": string;
	"5. volume": string;
}

interface AlphaVantageResponse {
	"Time Series (Daily)"?: Record<string, AlphaVantageRow>;
}

type AlphaVantageOverviewResponse = Partial<Record<string, string>>;

function toNumber(value: string | undefined): number | undefined {
	if (!value || value.trim().length === 0 || value === "None") {
		return undefined;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function compactNumericRecord(input: Record<string, number | undefined>): Record<string, number> | undefined {
	const entries = Object.entries(input).filter((entry): entry is [string, number] => typeof entry[1] === "number");
	if (entries.length === 0) {
		return undefined;
	}

	return Object.fromEntries(entries);
}

export class AlphaVantageProvider implements QuoteProvider {
	public readonly name = "alpha-vantage";
	private readonly apiKey: string;

	public constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	public async getCandles(request: QuoteRequest): Promise<MarketCandle[]> {
		const url = new URL("https://www.alphavantage.co/query");
		url.searchParams.set("function", "TIME_SERIES_DAILY");
		url.searchParams.set("symbol", request.symbol);
		url.searchParams.set("outputsize", "compact");
		url.searchParams.set("apikey", this.apiKey);

		const response = await fetch(url);
		if (!response.ok) {
			throw new FinanceAssistantError(
				"ALPHA_VANTAGE_HTTP",
				`Alpha Vantage request failed with status ${response.status}`,
			);
		}

		const payload = (await response.json()) as AlphaVantageResponse;
		const rows = payload["Time Series (Daily)"];
		if (!rows) {
			return [];
		}

		const candles = Object.entries(rows)
			.map(([date, row]) => ({
				timestamp: Date.parse(`${date}T00:00:00Z`),
				open: Number(row["1. open"]),
				high: Number(row["2. high"]),
				low: Number(row["3. low"]),
				close: Number(row["4. close"]),
				volume: Number(row["5. volume"]),
			}))
			.filter((item) => Number.isFinite(item.open) && Number.isFinite(item.close))
			.sort((a, b) => a.timestamp - b.timestamp);

		if (request.timeframe === "1D") {
			return candles.slice(-request.limit);
		}

		return candles;
	}

	public async getFundamentals(request: FundamentalsRequest): Promise<FundamentalsSnapshot> {
		const symbol = request.symbol.toUpperCase();
		const url = new URL("https://www.alphavantage.co/query");
		url.searchParams.set("function", "OVERVIEW");
		url.searchParams.set("symbol", symbol);
		url.searchParams.set("apikey", this.apiKey);

		const response = await fetch(url);
		if (!response.ok) {
			throw new FinanceAssistantError(
				"ALPHA_VANTAGE_HTTP",
				`Alpha Vantage request failed with status ${response.status}`,
			);
		}

		const payload = (await response.json()) as AlphaVantageOverviewResponse;
		const hasData = typeof payload.Symbol === "string" || typeof payload.Name === "string";
		if (!hasData) {
			const message = payload["Error Message"] ?? payload.Information ?? payload.Note ?? "missing overview data";
			throw new FinanceAssistantError(
				"ALPHA_VANTAGE_FUNDAMENTALS_EMPTY",
				`Alpha Vantage fundamentals unavailable: ${message}`,
			);
		}

		const sections: FundamentalsSnapshot["sections"] = {};
		const requested = new Set(request.requestedSections);

		if (requested.has("valuation")) {
			const valuation = compactNumericRecord({
				marketCapitalization: toNumber(payload.MarketCapitalization),
				peRatio: toNumber(payload.PERatio),
				priceToSalesRatioTTM: toNumber(payload.PriceToSalesRatioTTM),
				priceToBookRatio: toNumber(payload.PriceToBookRatio),
			});
			if (valuation) {
				sections.valuation = valuation;
			}
		}

		if (requested.has("profitability")) {
			const profitability = compactNumericRecord({
				profitMargin: toNumber(payload.ProfitMargin),
				operatingMarginTTM: toNumber(payload.OperatingMarginTTM),
				returnOnAssetsTTM: toNumber(payload.ReturnOnAssetsTTM),
				returnOnEquityTTM: toNumber(payload.ReturnOnEquityTTM),
			});
			if (profitability) {
				sections.profitability = profitability;
			}
		}

		if (requested.has("growth")) {
			const growth = compactNumericRecord({
				quarterlyRevenueGrowthYOY: toNumber(payload.QuarterlyRevenueGrowthYOY),
				quarterlyEarningsGrowthYOY: toNumber(payload.QuarterlyEarningsGrowthYOY),
			});
			if (growth) {
				sections.growth = growth;
			}
		}

		if (requested.has("balance-sheet")) {
			const balanceSheet = compactNumericRecord({
				debtToEquity: toNumber(payload.DebtToEquity),
				bookValue: toNumber(payload.BookValue),
				eps: toNumber(payload.EPS),
			});
			if (balanceSheet) {
				sections["balance-sheet"] = balanceSheet;
			}
		}

		if (Object.keys(sections).length === 0) {
			throw new FinanceAssistantError(
				"ALPHA_VANTAGE_FUNDAMENTALS_EMPTY",
				"Alpha Vantage fundamentals response had no mappable fields",
			);
		}

		return {
			symbol,
			asOf: Date.now(),
			sections,
		};
	}
}

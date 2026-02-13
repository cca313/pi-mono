import { FinanceAssistantError } from "../errors.js";
import type { MarketCandle } from "../types.js";
import type { QuoteProvider, QuoteRequest } from "./types.js";

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
}

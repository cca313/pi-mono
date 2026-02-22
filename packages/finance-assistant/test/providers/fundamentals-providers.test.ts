import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AlphaVantageProvider } from "../../src/providers/alpha-vantage.js";
import { FinnhubProvider } from "../../src/providers/finnhub.js";
import { YahooProvider } from "../../src/providers/yahoo.js";

const originalFetch = globalThis.fetch;

function mockJsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("fundamentals providers", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test("FinnhubProvider maps metric response into fundamentals sections", async () => {
		globalThis.fetch = vi.fn(async () =>
			mockJsonResponse({
				metric: {
					peTTM: 21.5,
					psTTM: 7.2,
					netMargin: 0.22,
					operatingMarginTTM: 0.31,
					revenueGrowth3Y: 0.12,
					epsGrowth5Y: 0.18,
					"totalDebt/totalEquityAnnual": 1.05,
					bookValuePerShareAnnual: 4.5,
				},
			}),
		) as typeof fetch;

		const provider = new FinnhubProvider("test-key");
		const result = await provider.getFundamentals({
			symbol: "aapl",
			requestedSections: ["valuation", "profitability", "growth", "balance-sheet"],
		});

		expect(result.symbol).toBe("AAPL");
		expect(result.sections.valuation?.peTTM).toBe(21.5);
		expect(result.sections.profitability?.netMargin).toBe(0.22);
		expect(result.sections.growth?.revenueGrowth3Y).toBe(0.12);
		expect(result.sections["balance-sheet"]?.totalDebtToEquityAnnual).toBe(1.05);
	});

	test("YahooProvider maps quoteSummary modules into fundamentals sections", async () => {
		globalThis.fetch = vi.fn(async () =>
			mockJsonResponse({
				quoteSummary: {
					result: [
						{
							summaryDetail: {
								trailingPE: { raw: 28.1 },
								forwardPE: { raw: 24.3 },
								priceToSalesTrailing12Months: { raw: 8.6 },
							},
							defaultKeyStatistics: {
								priceToBook: { raw: 12.4 },
								bookValue: { raw: 4.8 },
							},
							financialData: {
								profitMargins: { raw: 0.24 },
								operatingMargins: { raw: 0.29 },
								revenueGrowth: { raw: 0.11 },
								earningsGrowth: { raw: 0.15 },
								debtToEquity: { raw: 135.5 },
								totalDebt: { raw: 99000000000 },
								totalCash: { raw: 62000000000 },
							},
							price: {
								marketCap: { raw: 3000000000000 },
							},
						},
					],
				},
			}),
		) as typeof fetch;

		const provider = new YahooProvider();
		const result = await provider.getFundamentals({
			symbol: "msft",
			requestedSections: ["valuation", "profitability", "growth", "balance-sheet"],
		});

		expect(result.symbol).toBe("MSFT");
		expect(result.sections.valuation?.marketCap).toBe(3000000000000);
		expect(result.sections.profitability?.profitMargins).toBe(0.24);
		expect(result.sections.growth?.earningsGrowth).toBe(0.15);
		expect(result.sections["balance-sheet"]?.debtToEquity).toBe(135.5);
	});

	test("AlphaVantageProvider maps OVERVIEW into fundamentals sections", async () => {
		globalThis.fetch = vi.fn(async () =>
			mockJsonResponse({
				Symbol: "NVDA",
				MarketCapitalization: "2500000000000",
				PERatio: "55.2",
				PriceToSalesRatioTTM: "23.4",
				PriceToBookRatio: "40.1",
				ProfitMargin: "0.48",
				OperatingMarginTTM: "0.52",
				ReturnOnAssetsTTM: "0.33",
				ReturnOnEquityTTM: "0.69",
				QuarterlyRevenueGrowthYOY: "0.78",
				QuarterlyEarningsGrowthYOY: "0.86",
				DebtToEquity: "0.34",
				BookValue: "12.5",
				EPS: "10.2",
			}),
		) as typeof fetch;

		const provider = new AlphaVantageProvider("test-key");
		const result = await provider.getFundamentals({
			symbol: "nvda",
			requestedSections: ["valuation", "profitability", "growth", "balance-sheet"],
		});

		expect(result.symbol).toBe("NVDA");
		expect(result.sections.valuation?.peRatio).toBe(55.2);
		expect(result.sections.profitability?.operatingMarginTTM).toBe(0.52);
		expect(result.sections.growth?.quarterlyRevenueGrowthYOY).toBe(0.78);
		expect(result.sections["balance-sheet"]?.debtToEquity).toBe(0.34);
	});
});

import { describe, expect, test } from "vitest";
import { fundamentalsRouter, quoteRouter } from "../../src/providers/router.js";
import type { FinanceDataProvider, QuoteProvider } from "../../src/providers/types.js";

describe("quoteRouter", () => {
	test("uses first successful provider", async () => {
		const providerA: QuoteProvider = {
			name: "finnhub",
			getCandles: async () => {
				throw new Error("upstream down");
			},
		};

		const providerB: QuoteProvider = {
			name: "yahoo",
			getCandles: async () => {
				return [{ timestamp: 1, open: 1, high: 2, low: 1, close: 2, volume: 100 }];
			},
		};

		const result = await quoteRouter({ symbol: "AAPL", timeframe: "1D", limit: 100 }, [providerA, providerB]);

		expect(result.sourceUsed).toBe("yahoo");
		expect(result.candles).toHaveLength(1);
		expect(result.warnings[0]).toContain("finnhub");
	});

	test("throws when all providers fail", async () => {
		const provider: QuoteProvider = {
			name: "finnhub",
			getCandles: async () => {
				throw new Error("network error");
			},
		};

		await expect(quoteRouter({ symbol: "AAPL", timeframe: "1D", limit: 100 }, [provider])).rejects.toThrow(
			"All quote providers failed",
		);
	});
});

describe("fundamentalsRouter", () => {
	test("uses next fundamentals provider after NOT_IMPLEMENTED and keeps warnings", async () => {
		const providerA: FinanceDataProvider = {
			name: "finnhub",
			getCandles: async () => [],
			getFundamentals: async () => {
				throw new Error("NOT_IMPLEMENTED fundamentals provider not implemented yet");
			},
		};

		const providerB: FinanceDataProvider = {
			name: "yahoo",
			getCandles: async () => [],
			getFundamentals: async () => ({
				symbol: "AAPL",
				asOf: Date.now(),
				sections: {
					valuation: { peRatio: 20 },
					profitability: { grossMarginPct: 42 },
					growth: { revenueGrowthPct: 8 },
					"balance-sheet": { debtToEquity: 1.1 },
				},
			}),
		};

		const result = await fundamentalsRouter(
			{
				symbol: "AAPL",
				requestedSections: ["valuation", "profitability", "growth", "balance-sheet"],
			},
			[providerA, providerB],
		);

		expect(result.sourceUsed).toBe("yahoo");
		expect(result.coverage).toBe("full");
		expect(result.warnings[0]).toContain("finnhub");
	});

	test("throws FUNDAMENTALS_PROVIDERS_FAILED when all providers fail", async () => {
		const provider: FinanceDataProvider = {
			name: "alpha-vantage",
			getCandles: async () => [],
			getFundamentals: async () => {
				throw new Error("upstream down");
			},
		};

		await expect(
			fundamentalsRouter(
				{
					symbol: "MSFT",
					requestedSections: ["valuation"],
				},
				[provider],
			),
		).rejects.toMatchObject({
			code: "FUNDAMENTALS_PROVIDERS_FAILED",
		});
	});
});

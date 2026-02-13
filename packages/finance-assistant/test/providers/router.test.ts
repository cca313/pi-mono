import { describe, expect, test } from "vitest";
import { quoteRouter } from "../../src/providers/router.js";
import type { QuoteProvider } from "../../src/providers/types.js";

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

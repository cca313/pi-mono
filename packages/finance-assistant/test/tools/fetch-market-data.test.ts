import { describe, expect, test } from "vitest";
import type { QuoteProvider } from "../../src/providers/types.js";
import { createFinanceFetchMarketDataTool } from "../../src/tools/fetch-market-data.js";
import { createFinanceWorkflowStore } from "../../src/tools/workflow-store.js";

function createCandles(count: number) {
	const candles = [];
	for (let i = 0; i < count; i++) {
		candles.push({
			timestamp: (i + 1) * 1000,
			open: 100 + i,
			high: 101 + i,
			low: 99 + i,
			close: 100 + i,
			volume: 1000 + i * 10,
		});
	}
	return candles;
}

describe("finance_fetch_market_data tool", () => {
	test("fetches market data and returns analysisId", async () => {
		const provider: QuoteProvider = {
			name: "stub-provider",
			getCandles: async () => createCandles(40),
		};

		const store = createFinanceWorkflowStore();
		const tool = createFinanceFetchMarketDataTool({
			store,
			providers: [provider],
			defaultTimeframe: "1D",
			defaultLimit: 40,
		});

		const result = await tool.execute("tool-call-1", { symbol: "aapl" });
		expect(result.details.analysisId.length).toBeGreaterThan(0);
		expect(result.details.market.symbol).toBe("AAPL");
		expect(result.details.market.sourceUsed).toBe("stub-provider");
		expect(result.details.market.candles).toHaveLength(40);
	});

	test("falls back to the next provider and records warnings", async () => {
		const primary: QuoteProvider = {
			name: "primary",
			getCandles: async () => {
				throw new Error("upstream timeout");
			},
		};
		const secondary: QuoteProvider = {
			name: "secondary",
			getCandles: async () => createCandles(35),
		};

		const store = createFinanceWorkflowStore();
		const tool = createFinanceFetchMarketDataTool({
			store,
			providers: [primary, secondary],
			defaultTimeframe: "1D",
			defaultLimit: 35,
		});

		const result = await tool.execute("tool-call-2", { symbol: "msft", timeframe: "1D", limit: 35 });
		expect(result.details.market.sourceUsed).toBe("secondary");
		expect(result.details.market.warnings[0]).toContain("primary failed");
	});

	test("throws when all providers fail", async () => {
		const provider: QuoteProvider = {
			name: "always-fail",
			getCandles: async () => {
				throw new Error("network down");
			},
		};

		const store = createFinanceWorkflowStore();
		const tool = createFinanceFetchMarketDataTool({
			store,
			providers: [provider],
			defaultTimeframe: "1D",
			defaultLimit: 35,
		});

		await expect(tool.execute("tool-call-3", { symbol: "AAPL" })).rejects.toThrow("All quote providers failed");
	});
});

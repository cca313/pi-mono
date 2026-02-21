import { describe, expect, test } from "vitest";
import type { QuoteProvider } from "../src/providers/types.js";
import { runFinanceWorkflow } from "../src/workflow/run-finance-workflow.js";

function createCandles(count: number) {
	const candles = [];
	for (let i = 0; i < count; i++) {
		candles.push({
			timestamp: (i + 1) * 1000,
			open: 100 + i,
			high: 101 + i,
			low: 99 + i,
			close: 100 + i,
			volume: 1000 + i * 50,
		});
	}
	return candles;
}

describe("runFinanceWorkflow", () => {
	test("runs end-to-end workflow with injected provider", async () => {
		const provider: QuoteProvider = {
			name: "stub-provider",
			getCandles: async () => createCandles(40),
		};

		const result = await runFinanceWorkflow({
			symbol: "aapl",
			timeframe: "1D",
			limit: 40,
			providers: [provider],
		});

		expect(result.analysisId.length).toBeGreaterThan(0);
		expect(result.market.symbol).toBe("AAPL");
		expect(result.market.sourceUsed).toBe("stub-provider");
		expect(result.market.candles).toHaveLength(40);
		expect(result.indicators.lastClose).toBeGreaterThan(0);
		expect(result.report.conclusion.length).toBeGreaterThan(0);
		expect(result.report.riskPoints.length).toBeGreaterThan(0);
	});
});

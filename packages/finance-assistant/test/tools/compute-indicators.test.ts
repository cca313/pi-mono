import { describe, expect, test } from "vitest";
import { createFinanceComputeIndicatorsTool } from "../../src/tools/compute-indicators.js";
import { createFinanceWorkflowStore } from "../../src/tools/workflow-store.js";
import type { FinanceMarketData } from "../../src/workflow/types.js";

function createMarketData(symbol: string, candlesCount: number): FinanceMarketData {
	const candles = [];
	for (let i = 0; i < candlesCount; i++) {
		candles.push({
			timestamp: (i + 1) * 1000,
			open: 100 + i,
			high: 101 + i,
			low: 99 + i,
			close: 100 + i,
			volume: 1000 + i * 50,
		});
	}

	return {
		symbol,
		timeframe: "1D",
		limit: candlesCount,
		sourceUsed: "stub-provider",
		warnings: [],
		candles,
		fetchedAt: Date.now(),
	};
}

describe("finance_compute_indicators tool", () => {
	test("computes indicators and stores them in workflow state", async () => {
		const store = createFinanceWorkflowStore();
		const state = store.createFromMarket(createMarketData("AAPL", 40));
		const tool = createFinanceComputeIndicatorsTool({ store });

		const result = await tool.execute("tool-call-1", { analysisId: state.analysisId });
		expect(result.details.analysisId).toBe(state.analysisId);
		expect(Number.isFinite(result.details.indicators.sma20)).toBe(true);
		expect(Number.isFinite(result.details.indicators.rsi14)).toBe(true);
	});

	test("throws WORKFLOW_STATE_NOT_FOUND for unknown analysisId", async () => {
		const store = createFinanceWorkflowStore();
		const tool = createFinanceComputeIndicatorsTool({ store });

		await expect(tool.execute("tool-call-2", { analysisId: "missing-id" })).rejects.toMatchObject({
			code: "WORKFLOW_STATE_NOT_FOUND",
		});
	});

	test("throws INSUFFICIENT_DATA for too few candles", async () => {
		const store = createFinanceWorkflowStore();
		const state = store.createFromMarket(createMarketData("AAPL", 10));
		const tool = createFinanceComputeIndicatorsTool({ store });

		await expect(tool.execute("tool-call-3", { analysisId: state.analysisId })).rejects.toMatchObject({
			code: "INSUFFICIENT_DATA",
		});
	});
});

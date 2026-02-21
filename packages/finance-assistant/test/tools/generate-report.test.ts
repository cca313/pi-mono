import { describe, expect, test } from "vitest";
import { createFinanceComputeIndicatorsTool } from "../../src/tools/compute-indicators.js";
import { createFinanceGenerateReportTool } from "../../src/tools/generate-report.js";
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
		warnings: ["primary timeout"],
		candles,
		fetchedAt: Date.now(),
	};
}

describe("finance_generate_report tool", () => {
	test("generates report from cached market and indicators", async () => {
		const store = createFinanceWorkflowStore();
		const state = store.createFromMarket(createMarketData("AAPL", 40));
		const indicatorsTool = createFinanceComputeIndicatorsTool({ store });
		await indicatorsTool.execute("tool-call-1", { analysisId: state.analysisId });

		const reportTool = createFinanceGenerateReportTool({ store });
		const result = await reportTool.execute("tool-call-2", { analysisId: state.analysisId });

		expect(result.details.analysisId).toBe(state.analysisId);
		expect(result.details.report.conclusion.length).toBeGreaterThan(0);
		expect(result.details.report.riskPoints.length).toBeGreaterThan(0);
		expect(result.details.report.warnings[0]).toContain("primary timeout");
	});

	test("throws WORKFLOW_STATE_NOT_FOUND when indicators are missing", async () => {
		const store = createFinanceWorkflowStore();
		const state = store.createFromMarket(createMarketData("MSFT", 40));
		const reportTool = createFinanceGenerateReportTool({ store });

		await expect(reportTool.execute("tool-call-3", { analysisId: state.analysisId })).rejects.toMatchObject({
			code: "WORKFLOW_STATE_NOT_FOUND",
		});
	});
});

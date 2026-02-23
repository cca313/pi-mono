import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceMonitorPortfolioDriftTool } from "../../src/tools/monitor-portfolio-drift.js";
import { createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_monitor_portfolio_drift tool", () => {
	test("reports breaches and priority queue", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const portfolio = advisoryStore.savePortfolio(createPortfolioSnapshot());
		const tool = createFinanceMonitorPortfolioDriftTool({ advisoryStore });

		const result = await tool.execute("tool-call-1", {
			portfolioId: portfolio.portfolioId,
			targetPolicy: { singlePositionMaxPct: 10, cashTargetRangePct: { min: 5, max: 12 } },
		});

		expect(result.details.driftReportId.length).toBeGreaterThan(0);
		expect(result.details.driftReport.breaches.length).toBeGreaterThan(0);
		expect(result.details.driftReport.priorityQueue.length).toBeGreaterThan(0);
	});
});

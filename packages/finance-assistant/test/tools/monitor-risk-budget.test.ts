import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceMonitorRiskBudgetTool } from "../../src/tools/monitor-risk-budget.js";
import { createFinanceWorkflowStore } from "../../src/tools/workflow-store.js";
import { createInvestorProfile, createPortfolioSnapshot, seedAnalysisState } from "./advisory-fixtures.js";

describe("finance_monitor_risk_budget tool", () => {
	test("uses built-in conservative/moderate/aggressive tiers", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const workflowStore = createFinanceWorkflowStore();
		const analysisId = await seedAnalysisState(workflowStore);
		const portfolio = advisoryStore.savePortfolio(createPortfolioSnapshot());
		const tool = createFinanceMonitorRiskBudgetTool({ advisoryStore, workflowStore });

		const conservative = await tool.execute("tool-call-1", {
			riskTier: "conservative",
			portfolioId: portfolio.portfolioId,
			analysisId,
		});
		const aggressive = await tool.execute("tool-call-2", {
			riskTier: "aggressive",
			portfolioId: portfolio.portfolioId,
			analysisId,
		});

		expect(conservative.details.riskMonitor.thresholds.maxSinglePositionPct).toBeLessThan(
			aggressive.details.riskMonitor.thresholds.maxSinglePositionPct,
		);
	});

	test("derives risk tier from profile when omitted", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const workflowStore = createFinanceWorkflowStore();
		const portfolio = advisoryStore.savePortfolio(createPortfolioSnapshot());
		const profile = advisoryStore.saveProfile(createInvestorProfile({ riskTolerance: "aggressive" }));
		const tool = createFinanceMonitorRiskBudgetTool({ advisoryStore, workflowStore });

		const result = await tool.execute("tool-call-3", {
			portfolioId: portfolio.portfolioId,
			profileId: profile.profileId,
		});

		expect(result.details.riskMonitor.riskTier).toBe("aggressive");
	});

	test("supports risk template override with metadata", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const workflowStore = createFinanceWorkflowStore();
		const portfolio = advisoryStore.savePortfolio(createPortfolioSnapshot());
		const tool = createFinanceMonitorRiskBudgetTool({ advisoryStore, workflowStore });

		const result = await tool.execute("tool-call-4", {
			riskTier: "moderate",
			portfolioId: portfolio.portfolioId,
			riskTemplate: {
				templateId: "org-alpha",
				version: "1.0.0",
				tiers: {
					conservative: {
						maxSinglePositionPct: 9,
						maxSectorPct: 22,
						maxVolatilityAnnualized: 0.24,
						maxDrawdownPct: 12,
						minCashPct: 10,
						maxCashPct: 35,
						maxStressLossPct: 10,
					},
					moderate: {
						maxSinglePositionPct: 14,
						maxSectorPct: 28,
						maxVolatilityAnnualized: 0.35,
						maxDrawdownPct: 18,
						minCashPct: 6,
						maxCashPct: 22,
						maxStressLossPct: 16,
					},
					aggressive: {
						maxSinglePositionPct: 22,
						maxSectorPct: 40,
						maxVolatilityAnnualized: 0.55,
						maxDrawdownPct: 28,
						minCashPct: 2,
						maxCashPct: 16,
						maxStressLossPct: 26,
					},
				},
			},
		});

		expect(result.details.riskMonitor.templateId).toBe("org-alpha");
		expect(result.details.riskMonitor.templateVersion).toBe("1.0.0");
		expect(result.details.riskMonitor.thresholds.maxSinglePositionPct).toBe(14);
	});
});

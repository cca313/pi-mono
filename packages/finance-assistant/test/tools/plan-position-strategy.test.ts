import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceAssessInvestmentSuitabilityTool } from "../../src/tools/assess-investment-suitability.js";
import { createFinancePlanPositionStrategyTool } from "../../src/tools/plan-position-strategy.js";
import { createFinanceWorkflowStore } from "../../src/tools/workflow-store.js";
import { createInvestorProfile, seedAnalysisState } from "./advisory-fixtures.js";

describe("finance_plan_position_strategy tool", () => {
	test("generates position strategy from profileId", async () => {
		const workflowStore = createFinanceWorkflowStore();
		const advisoryStore = createFinanceAdvisoryStore();
		const analysisId = await seedAnalysisState(workflowStore);
		const profile = advisoryStore.saveProfile(createInvestorProfile({ riskTolerance: "moderate" }));
		const tool = createFinancePlanPositionStrategyTool({ workflowStore, advisoryStore });

		const result = await tool.execute("tool-call-1", {
			analysisId,
			profileId: profile.profileId,
			positionContext: { accountType: "taxable", unrealizedGainPct: 12 },
			accountContext: { accountType: "taxable" },
			riskBudgetPct: 10,
		});

		expect(result.details.positionPlanId.length).toBeGreaterThan(0);
		expect(result.details.positionPlan.entryConditions.length).toBeGreaterThan(0);
		expect(result.details.positionPlan.suggestedExposureRangePct.max).toBeLessThanOrEqual(10);
		expect(result.details.positionPlan.taxNotes.length).toBeGreaterThan(0);
	});

	test("supports assessmentId path", async () => {
		const workflowStore = createFinanceWorkflowStore();
		const advisoryStore = createFinanceAdvisoryStore();
		const analysisId = await seedAnalysisState(workflowStore, { symbol: "NVDA" });
		const assessTool = createFinanceAssessInvestmentSuitabilityTool({ workflowStore, advisoryStore });
		const assessment = await assessTool.execute("tool-call-a", {
			analysisId,
			profile: createInvestorProfile({ riskTolerance: "aggressive" }),
		});
		const tool = createFinancePlanPositionStrategyTool({ workflowStore, advisoryStore });

		const result = await tool.execute("tool-call-b", {
			analysisId,
			assessmentId: assessment.details.assessmentId,
		});

		expect(result.details.coverage).toBeDefined();
		expect(result.details.positionPlan.trimConditions.length).toBeGreaterThan(0);
	});
});

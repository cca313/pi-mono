import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceAssessInvestmentSuitabilityTool } from "../../src/tools/assess-investment-suitability.js";
import { createFinanceWorkflowStore } from "../../src/tools/workflow-store.js";
import { createInvestorProfile, seedAnalysisState, seedFundamentals } from "./advisory-fixtures.js";

describe("finance_assess_investment_suitability tool", () => {
	test("supports profileId and stores an assessment", async () => {
		const workflowStore = createFinanceWorkflowStore();
		const advisoryStore = createFinanceAdvisoryStore();
		const analysisId = await seedAnalysisState(workflowStore, { symbol: "AAPL" });
		const profile = advisoryStore.saveProfile(createInvestorProfile({ riskTolerance: "moderate" }));
		const fundamentals = seedFundamentals(advisoryStore, { symbol: "AAPL" });

		const tool = createFinanceAssessInvestmentSuitabilityTool({ workflowStore, advisoryStore });
		const result = await tool.execute("tool-call-1", {
			analysisId,
			profileId: profile.profileId,
			fundamentalsId: fundamentals.fundamentalsId,
		});

		expect(result.details.assessmentId.length).toBeGreaterThan(0);
		expect(result.details.analysisId).toBe(analysisId);
		expect(result.details.profileResolved.riskTolerance).toBe("moderate");
		expect(result.details.suitability.fitLevel).toMatch(/fit/);
	});

	test("direct profile input overrides profileId when both are provided", async () => {
		const workflowStore = createFinanceWorkflowStore();
		const advisoryStore = createFinanceAdvisoryStore();
		const analysisId = await seedAnalysisState(workflowStore, { symbol: "MSFT" });
		const cached = advisoryStore.saveProfile(createInvestorProfile({ riskTolerance: "conservative" }));
		const tool = createFinanceAssessInvestmentSuitabilityTool({ workflowStore, advisoryStore });

		const result = await tool.execute("tool-call-2", {
			analysisId,
			profileId: cached.profileId,
			profile: createInvestorProfile({ riskTolerance: "aggressive" }),
		});

		expect(result.details.profileResolved.riskTolerance).toBe("aggressive");
	});

	test("throws INVALID_ADVISORY_INPUT when profile and profileId are both missing", async () => {
		const workflowStore = createFinanceWorkflowStore();
		const advisoryStore = createFinanceAdvisoryStore();
		const analysisId = await seedAnalysisState(workflowStore);
		const tool = createFinanceAssessInvestmentSuitabilityTool({ workflowStore, advisoryStore });

		await expect(tool.execute("tool-call-3", { analysisId })).rejects.toMatchObject({
			code: "INVALID_ADVISORY_INPUT",
		});
	});
});

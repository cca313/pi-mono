import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceBuildInvestmentPolicyStatementTool } from "../../src/tools/build-investment-policy-statement.js";
import { createInvestorProfile, createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_build_investment_policy_statement tool", () => {
	test("builds IPS from cached profile and goals", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const profile = advisoryStore.saveProfile(createInvestorProfile({ riskTolerance: "moderate" }));
		const goals = advisoryStore.saveGoals({
			planningHorizonYears: 15,
			goals: [{ label: "Retirement", targetAmount: 1200000, priority: "high" }],
			liquidityBufferPct: 8,
		});
		const tool = createFinanceBuildInvestmentPolicyStatementTool({ advisoryStore });

		const result = await tool.execute("tool-call-1", {
			profileId: profile.profileId,
			goalsId: goals.goalsId,
			portfolio: createPortfolioSnapshot(),
		});

		expect(result.details.ipsId.length).toBeGreaterThan(0);
		expect(result.details.ips.riskProfileTier).toBe("moderate");
		expect(result.details.ips.disclaimer).toContain("not investment advice");
	});

	test("throws when goals input is missing", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const profile = advisoryStore.saveProfile(createInvestorProfile());
		const tool = createFinanceBuildInvestmentPolicyStatementTool({ advisoryStore });

		await expect(tool.execute("tool-call-2", { profileId: profile.profileId })).rejects.toThrow(
			"Expected goals or goalsId",
		);
	});
});

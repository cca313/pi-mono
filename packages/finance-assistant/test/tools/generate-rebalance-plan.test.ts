import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceGenerateRebalancePlanTool } from "../../src/tools/generate-rebalance-plan.js";
import { createFinanceReviewPortfolioTool } from "../../src/tools/review-portfolio.js";
import { createFinanceRunPortfolioStressTestTool } from "../../src/tools/run-portfolio-stress-test.js";
import { createInvestorProfile, createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_generate_rebalance_plan tool", () => {
	test("generates rebalance plan from cached portfolio/review/stress with queue and conditions", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const capturePortfolio = advisoryStore.savePortfolio(createPortfolioSnapshot());
		const captureProfile = advisoryStore.saveProfile(createInvestorProfile());
		const reviewTool = createFinanceReviewPortfolioTool({ advisoryStore });
		const review = await reviewTool.execute("tool-call-r", {
			portfolioId: capturePortfolio.portfolioId,
			profileId: captureProfile.profileId,
			benchmarkPolicy: { singlePositionMaxPct: 10 },
		});
		const stressTool = createFinanceRunPortfolioStressTestTool({ advisoryStore });
		const stress = await stressTool.execute("tool-call-s", { portfolioId: capturePortfolio.portfolioId });

		const tool = createFinanceGenerateRebalancePlanTool({ advisoryStore });
		const result = await tool.execute("tool-call-1", {
			portfolioId: capturePortfolio.portfolioId,
			profileId: captureProfile.profileId,
			portfolioReviewId: review.details.portfolioReviewId,
			stressTestId: stress.details.stressTestId,
			targetPolicy: { singlePositionMaxPct: 10, cashTargetRangePct: { min: 5, max: 15 } },
		});

		expect(result.details.rebalancePlanId.length).toBeGreaterThan(0);
		expect(result.details.rebalancePlan.targetRanges.length).toBeGreaterThan(0);
		expect(result.details.rebalancePlan.executionConditions.length).toBeGreaterThan(0);
		expect(Array.isArray(result.details.rebalancePlan.taxImpactNotes)).toBe(true);
	});

	test("supports direct portfolio input and inline fallback review/stress", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const tool = createFinanceGenerateRebalancePlanTool({ advisoryStore });

		const result = await tool.execute("tool-call-2", {
			portfolio: createPortfolioSnapshot(),
			profile: createInvestorProfile(),
		});

		expect(result.details.coverage).toMatch(/partial|full/);
		expect(result.details.warnings.join(" ")).toContain("inline");
	});

	test("throws PORTFOLIO_STATE_NOT_FOUND for missing cached portfolioId", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const tool = createFinanceGenerateRebalancePlanTool({ advisoryStore });

		await expect(tool.execute("tool-call-3", { portfolioId: "missing" })).rejects.toMatchObject({
			code: "PORTFOLIO_STATE_NOT_FOUND",
		});
	});
});

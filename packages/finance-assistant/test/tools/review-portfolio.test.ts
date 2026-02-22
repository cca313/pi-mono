import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceReviewPortfolioTool } from "../../src/tools/review-portfolio.js";
import { createInvestorProfile, createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_review_portfolio tool", () => {
	test("supports portfolioId and returns findings", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const portfolio = advisoryStore.savePortfolio(createPortfolioSnapshot());
		const profile = advisoryStore.saveProfile(createInvestorProfile());
		const tool = createFinanceReviewPortfolioTool({ advisoryStore });

		const result = await tool.execute("tool-call-1", {
			portfolioId: portfolio.portfolioId,
			profileId: profile.profileId,
			benchmarkPolicy: { singlePositionMaxPct: 10, sectorMaxPct: 25 },
		});

		expect(result.details.portfolioReviewId.length).toBeGreaterThan(0);
		expect(result.details.portfolioReview.summary.length).toBeGreaterThan(0);
		expect(result.details.portfolioReview.priorityActions.length).toBeGreaterThan(0);
	});

	test("throws INVALID_ADVISORY_INPUT when portfolio and portfolioId are missing", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const tool = createFinanceReviewPortfolioTool({ advisoryStore });

		await expect(tool.execute("tool-call-2", {})).rejects.toMatchObject({
			code: "INVALID_ADVISORY_INPUT",
		});
	});
});

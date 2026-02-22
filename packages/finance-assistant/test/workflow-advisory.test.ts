import { describe, expect, test } from "vitest";
import type { FinanceDataProvider } from "../src/providers/types.js";
import { runInvestmentAdvisorWorkflow } from "../src/workflow/run-investment-advisor-workflow.js";
import { runPortfolioAdvisorWorkflow } from "../src/workflow/run-portfolio-advisor-workflow.js";

function createCandles(count: number) {
	const candles = [];
	for (let i = 0; i < count; i++) {
		candles.push({
			timestamp: (i + 1) * 1000,
			open: 100 + i,
			high: 101 + i,
			low: 99 + i,
			close: 100 + i,
			volume: 1000 + i * 10,
		});
	}
	return candles;
}

function createProvider(overrides?: Partial<FinanceDataProvider>): FinanceDataProvider {
	return {
		name: "stub-provider",
		getCandles: async () => createCandles(60),
		getFundamentals: async (request) => ({
			symbol: request.symbol,
			asOf: Date.now(),
			sections: {
				valuation: { peRatio: 20 },
				profitability: { grossMarginPct: 42 },
				growth: { revenueGrowthPct: 10 },
				"balance-sheet": { debtToEquity: 1.1 },
			},
		}),
		...overrides,
	};
}

describe("advisory workflow wrappers", () => {
	test("runInvestmentAdvisorWorkflow runs end-to-end with fundamentals", async () => {
		const result = await runInvestmentAdvisorWorkflow({
			symbol: "aapl",
			timeframe: "1D",
			limit: 60,
			providers: [createProvider()],
			profile: {
				clientLabel: "Wrapper Test",
				riskTolerance: "moderate",
				investmentHorizon: "long",
				objectives: ["growth", "diversification"],
				liquidityNeeds: "medium",
				accountTypes: ["taxable"],
			},
		});

		expect(result.analysis.market.symbol).toBe("AAPL");
		expect(result.fundamentals.coverage).toBe("full");
		expect(result.assessment.suitability.fitLevel).toMatch(/fit/);
		expect(result.positionPlan.positionPlan.entryConditions.length).toBeGreaterThan(0);
	});

	test("runInvestmentAdvisorWorkflow falls back to placeholder fundamentals when provider fails", async () => {
		const result = await runInvestmentAdvisorWorkflow({
			symbol: "msft",
			providers: [
				createProvider({
					getFundamentals: async () => {
						throw new Error("fundamentals unavailable");
					},
				}),
			],
			profile: {
				riskTolerance: "conservative",
				investmentHorizon: "long",
				objectives: ["capital-preservation"],
				liquidityNeeds: "low",
			},
		});

		expect(result.fundamentals.coverage).toBe("placeholder");
		expect(result.assessment.coverage).toMatch(/placeholder|partial/);
	});

	test("runPortfolioAdvisorWorkflow returns review, stress test, and rebalance plan", async () => {
		const result = await runPortfolioAdvisorWorkflow({
			profile: {
				clientLabel: "Portfolio Wrapper",
				riskTolerance: "moderate",
				investmentHorizon: "long",
				objectives: ["growth", "diversification"],
				liquidityNeeds: "medium",
				accountTypes: ["taxable", "ira"],
			},
			portfolio: {
				asOf: Date.now(),
				baseCurrency: "usd",
				accounts: [
					{
						accountId: "tax-1",
						accountType: "taxable",
						cashBalance: 5000,
						positions: [
							{
								symbol: "AAPL",
								quantity: 30,
								lastPrice: 200,
								marketValue: 6000,
								sector: "Technology",
								taxLots: [
									{
										lotId: "aapl-1",
										quantity: 10,
										costBasisPerShare: 150,
										acquiredAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
									},
								],
							},
							{
								symbol: "VOO",
								quantity: 20,
								lastPrice: 500,
								marketValue: 10000,
								sector: "ETF",
							},
						],
					},
				],
			},
		});

		expect(result.portfolio.baseCurrency).toBe("USD");
		expect(result.portfolioReview.portfolioReview.summary.length).toBeGreaterThan(0);
		expect(result.stressTest.stressTest.scenarioResults.length).toBeGreaterThan(0);
		expect(result.rebalancePlan.rebalancePlan.executionConditions.length).toBeGreaterThan(0);
	});
});

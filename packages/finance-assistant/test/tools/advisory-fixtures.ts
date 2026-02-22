import type { InvestorProfile, PortfolioSnapshot } from "../../src/advisory/types.js";
import type { FundamentalsSnapshot } from "../../src/providers/types.js";
import type { FinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceComputeIndicatorsTool } from "../../src/tools/compute-indicators.js";
import { createFinanceGenerateReportTool } from "../../src/tools/generate-report.js";
import type { FinanceWorkflowStore } from "../../src/tools/workflow-store.js";
import type { FinanceMarketData } from "../../src/workflow/types.js";

export function createMarketData(symbol: string, candlesCount: number): FinanceMarketData {
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

export async function seedAnalysisState(
	workflowStore: FinanceWorkflowStore,
	options?: { symbol?: string; candlesCount?: number },
): Promise<string> {
	const state = workflowStore.createFromMarket(
		createMarketData(options?.symbol ?? "AAPL", options?.candlesCount ?? 60),
	);
	const indicatorsTool = createFinanceComputeIndicatorsTool({ store: workflowStore });
	await indicatorsTool.execute("tool-call-compute", { analysisId: state.analysisId });
	const reportTool = createFinanceGenerateReportTool({ store: workflowStore });
	await reportTool.execute("tool-call-report", { analysisId: state.analysisId });
	return state.analysisId;
}

export function createInvestorProfile(overrides?: Partial<InvestorProfile>): InvestorProfile {
	return {
		clientLabel: "Example Investor",
		riskTolerance: "moderate",
		investmentHorizon: "long",
		objectives: ["growth", "diversification"],
		liquidityNeeds: "medium",
		accountTypes: ["taxable"],
		...overrides,
	};
}

export function createPortfolioSnapshot(overrides?: Partial<PortfolioSnapshot>): PortfolioSnapshot {
	const base: PortfolioSnapshot = {
		asOf: Date.now(),
		baseCurrency: "USD",
		accounts: [
			{
				accountId: "tax-1",
				accountType: "taxable",
				cashBalance: 5000,
				positions: [
					{
						symbol: "AAPL",
						quantity: 20,
						lastPrice: 190,
						marketValue: 3800,
						sector: "Technology",
						taxLots: [
							{
								lotId: "aapl-1",
								quantity: 10,
								costBasisPerShare: 160,
								acquiredAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
							},
						],
					},
					{
						symbol: "XOM",
						quantity: 15,
						lastPrice: 105,
						marketValue: 1575,
						sector: "Energy",
					},
				],
			},
			{
				accountId: "ira-1",
				accountType: "ira",
				cashBalance: 3000,
				positions: [
					{
						symbol: "VOO",
						quantity: 30,
						lastPrice: 500,
						marketValue: 15000,
						sector: "ETF",
					},
				],
			},
		],
	};

	return {
		...base,
		...overrides,
		accounts: overrides?.accounts ?? base.accounts,
	};
}

export function createFundamentalsSnapshot(symbol = "AAPL"): FundamentalsSnapshot {
	return {
		symbol,
		asOf: Date.now(),
		sections: {
			valuation: {
				peRatio: 25,
				priceToSales: 6,
			},
			profitability: {
				grossMarginPct: 44,
			},
			growth: {
				revenueGrowthPct: 8,
			},
			"balance-sheet": {
				debtToEquity: 1.2,
			},
		},
	};
}

export function seedFundamentals(
	advisoryStore: FinanceAdvisoryStore,
	options?: { symbol?: string; coverage?: "placeholder" | "partial" | "full" },
) {
	const symbol = options?.symbol ?? "AAPL";
	const coverage = options?.coverage ?? "full";
	return advisoryStore.saveFundamentals({
		symbol,
		fundamentals: coverage === "placeholder" ? null : createFundamentalsSnapshot(symbol),
		sourceUsed: coverage === "placeholder" ? null : "stub-provider",
		coverage,
		warnings: coverage === "placeholder" ? ["stub placeholder"] : [],
		missingSections: coverage === "partial" ? ["growth"] : coverage === "placeholder" ? ["valuation"] : [],
	});
}

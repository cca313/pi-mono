import { AlphaVantageProvider } from "../providers/alpha-vantage.js";
import { FinnhubProvider } from "../providers/finnhub.js";
import type { FinanceDataProvider } from "../providers/types.js";
import { YahooProvider } from "../providers/yahoo.js";
import type { Timeframe } from "../types.js";
import { createFinanceAdvisoryStore } from "./advisory-store.js";
import { createFinanceAssessInvestmentSuitabilityTool } from "./assess-investment-suitability.js";
import { createFinanceCaptureInvestorProfileTool } from "./capture-investor-profile.js";
import { createFinanceCapturePortfolioSnapshotTool } from "./capture-portfolio-snapshot.js";
import { createFinanceComputeIndicatorsTool } from "./compute-indicators.js";
import { createFinanceFetchFundamentalsTool } from "./fetch-fundamentals.js";
import { createFinanceFetchMarketDataTool } from "./fetch-market-data.js";
import { createFinanceGenerateRebalancePlanTool } from "./generate-rebalance-plan.js";
import { createFinanceGenerateReportTool } from "./generate-report.js";
import { createFinancePlanPositionStrategyTool } from "./plan-position-strategy.js";
import { createFinanceReviewPortfolioTool } from "./review-portfolio.js";
import { createFinanceRunPortfolioStressTestTool } from "./run-portfolio-stress-test.js";
import { createFinanceWorkflowStore } from "./workflow-store.js";

export interface FinanceToolsetOptions {
	providers?: FinanceDataProvider[];
	defaultTimeframe?: Timeframe;
	defaultLimit?: number;
	maxCachedWorkflows?: number;
	maxCachedAdvisoryArtifacts?: number;
}

export function resolveFinanceProvidersFromEnv(): FinanceDataProvider[] {
	const providers: FinanceDataProvider[] = [];
	if (process.env.FINNHUB_API_KEY) {
		providers.push(new FinnhubProvider(process.env.FINNHUB_API_KEY));
	}

	providers.push(new YahooProvider());

	if (process.env.ALPHA_VANTAGE_API_KEY) {
		providers.push(new AlphaVantageProvider(process.env.ALPHA_VANTAGE_API_KEY));
	}

	return providers;
}

export function createFinanceToolset(options?: FinanceToolsetOptions) {
	const workflowStore = createFinanceWorkflowStore(options?.maxCachedWorkflows);
	const advisoryStore = createFinanceAdvisoryStore(options?.maxCachedAdvisoryArtifacts);
	const defaultTimeframe = options?.defaultTimeframe ?? "1D";
	const defaultLimit = options?.defaultLimit ?? 200;

	return [
		createFinanceFetchMarketDataTool({
			store: workflowStore,
			providers: options?.providers,
			resolveProviders: resolveFinanceProvidersFromEnv,
			defaultTimeframe,
			defaultLimit,
		}),
		createFinanceComputeIndicatorsTool({ store: workflowStore }),
		createFinanceGenerateReportTool({ store: workflowStore }),
		createFinanceCaptureInvestorProfileTool({ store: advisoryStore }),
		createFinanceCapturePortfolioSnapshotTool({ store: advisoryStore }),
		createFinanceFetchFundamentalsTool({
			store: advisoryStore,
			providers: options?.providers,
			resolveProviders: resolveFinanceProvidersFromEnv,
		}),
		createFinanceAssessInvestmentSuitabilityTool({
			workflowStore,
			advisoryStore,
		}),
		createFinancePlanPositionStrategyTool({
			workflowStore,
			advisoryStore,
		}),
		createFinanceReviewPortfolioTool({ advisoryStore }),
		createFinanceRunPortfolioStressTestTool({ advisoryStore }),
		createFinanceGenerateRebalancePlanTool({ advisoryStore }),
	];
}

export * from "./advisory-store.js";
export * from "./assess-investment-suitability.js";
export * from "./capture-investor-profile.js";
export * from "./capture-portfolio-snapshot.js";
export * from "./compute-indicators.js";
export * from "./fetch-fundamentals.js";
export * from "./fetch-market-data.js";
export * from "./generate-rebalance-plan.js";
export * from "./generate-report.js";
export * from "./plan-position-strategy.js";
export * from "./review-portfolio.js";
export * from "./run-portfolio-stress-test.js";
export * from "./workflow-store.js";

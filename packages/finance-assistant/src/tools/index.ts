import { AlphaVantageProvider } from "../providers/alpha-vantage.js";
import { FinnhubProvider } from "../providers/finnhub.js";
import type { QuoteProvider } from "../providers/types.js";
import { YahooProvider } from "../providers/yahoo.js";
import type { Timeframe } from "../types.js";
import { createFinanceComputeIndicatorsTool } from "./compute-indicators.js";
import { createFinanceFetchMarketDataTool } from "./fetch-market-data.js";
import { createFinanceGenerateReportTool } from "./generate-report.js";
import { createFinanceWorkflowStore } from "./workflow-store.js";

export interface FinanceToolsetOptions {
	providers?: QuoteProvider[];
	defaultTimeframe?: Timeframe;
	defaultLimit?: number;
	maxCachedWorkflows?: number;
}

export function resolveFinanceProvidersFromEnv(): QuoteProvider[] {
	const providers: QuoteProvider[] = [];
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
	const store = createFinanceWorkflowStore(options?.maxCachedWorkflows);
	const defaultTimeframe = options?.defaultTimeframe ?? "1D";
	const defaultLimit = options?.defaultLimit ?? 200;

	return [
		createFinanceFetchMarketDataTool({
			store,
			providers: options?.providers,
			resolveProviders: resolveFinanceProvidersFromEnv,
			defaultTimeframe,
			defaultLimit,
		}),
		createFinanceComputeIndicatorsTool({ store }),
		createFinanceGenerateReportTool({ store }),
	];
}

export * from "./compute-indicators.js";
export * from "./fetch-market-data.js";
export * from "./generate-report.js";
export * from "./workflow-store.js";

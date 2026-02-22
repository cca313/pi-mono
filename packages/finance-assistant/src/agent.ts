import { Agent, type ThinkingLevel } from "@mariozechner/pi-agent-core";
import { type Api, getModel, getModels, getProviders, type KnownProvider, type Model } from "@mariozechner/pi-ai";
import type { FinanceDataProvider } from "./providers/types.js";
import { createFinanceToolset } from "./tools/index.js";
import type { Timeframe } from "./types.js";

export const FINANCE_DEFAULT_PROVIDER = "deepseek";
export const FINANCE_DEFAULT_MODEL_ID = "deepseek-chat";

function resolveProvider(rawProvider: string): KnownProvider {
	const provider = getProviders().find((item: string) => item.toLowerCase() === rawProvider.toLowerCase());
	if (!provider) {
		throw new Error(`Unknown finance provider: ${rawProvider}`);
	}

	return provider;
}

export function resolveFinanceModel(provider?: string, modelId?: string): Model<Api> {
	const resolvedProvider = resolveProvider(provider ?? process.env.FINANCE_PROVIDER ?? FINANCE_DEFAULT_PROVIDER);
	const resolvedModelId =
		modelId ??
		process.env.FINANCE_MODEL ??
		(resolvedProvider === FINANCE_DEFAULT_PROVIDER ? FINANCE_DEFAULT_MODEL_ID : "");

	if (!resolvedModelId) {
		throw new Error(`No finance model configured for provider ${resolvedProvider}`);
	}

	const model = getModels(resolvedProvider).find((candidate: Model<Api>) => candidate.id === resolvedModelId);
	if (!model) {
		throw new Error(`Finance model not found: ${resolvedProvider}/${resolvedModelId}`);
	}

	return model;
}

export interface CreateFinanceAgentOptions {
	model?: Model<Api>;
	thinkingLevel?: ThinkingLevel;
	systemPrompt?: string;
	providers?: FinanceDataProvider[];
	defaultTimeframe?: Timeframe;
	defaultLimit?: number;
	maxCachedWorkflows?: number;
	maxCachedAdvisoryArtifacts?: number;
}

export function createFinanceAgent(options?: CreateFinanceAgentOptions): Agent {
	const model = options?.model ?? resolveFinanceModel();
	const tools = createFinanceToolset({
		providers: options?.providers,
		defaultTimeframe: options?.defaultTimeframe,
		defaultLimit: options?.defaultLimit,
		maxCachedWorkflows: options?.maxCachedWorkflows,
		maxCachedAdvisoryArtifacts: options?.maxCachedAdvisoryArtifacts,
	});

	return new Agent({
		initialState: {
			systemPrompt:
				options?.systemPrompt ??
				"You are a financial analysis and investment advisory assistant. " +
					"Prefer these skills by request type: finance-analysis (technical analysis), " +
					"finance-investment-advisor (single-symbol advisory), finance-portfolio-advisor (portfolio review). " +
					"If skills are unavailable, use tool chains in order. " +
					"Analysis chain: finance_fetch_market_data -> finance_compute_indicators -> finance_generate_report. " +
					"Single-symbol advisory chain extends analysis with: finance_fetch_fundamentals -> " +
					"finance_capture_investor_profile -> finance_assess_investment_suitability -> finance_plan_position_strategy. " +
					"Portfolio advisory chain: finance_capture_investor_profile -> finance_capture_portfolio_snapshot -> " +
					"finance_review_portfolio -> finance_run_portfolio_stress_test -> finance_generate_rebalance_plan. " +
					"Always include key risks, uncertainty, coverage level, and a not-investment-advice disclaimer.",
			model,
			thinkingLevel: options?.thinkingLevel ?? "off",
			tools,
			messages: [],
		},
	});
}

export function getFinanceDefaultModel(): Model<Api> {
	return getModel(FINANCE_DEFAULT_PROVIDER, FINANCE_DEFAULT_MODEL_ID);
}

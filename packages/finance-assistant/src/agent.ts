import { Agent, type ThinkingLevel } from "@mariozechner/pi-agent-core";
import { type Api, getModel, getModels, getProviders, type KnownProvider, type Model } from "@mariozechner/pi-ai";
import type { QuoteProvider } from "./providers/types.js";
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
	providers?: QuoteProvider[];
	defaultTimeframe?: Timeframe;
	defaultLimit?: number;
	maxCachedWorkflows?: number;
}

export function createFinanceAgent(options?: CreateFinanceAgentOptions): Agent {
	const model = options?.model ?? resolveFinanceModel();
	const tools = createFinanceToolset({
		providers: options?.providers,
		defaultTimeframe: options?.defaultTimeframe,
		defaultLimit: options?.defaultLimit,
		maxCachedWorkflows: options?.maxCachedWorkflows,
	});

	return new Agent({
		initialState: {
			systemPrompt:
				options?.systemPrompt ??
				"You are a financial analysis assistant. Prefer the finance-analysis skill workflow. " +
					"If the skill is unavailable, call tools in this order: " +
					"finance_fetch_market_data -> finance_compute_indicators -> finance_generate_report. " +
					"Always include key risks and uncertainty in every answer.",
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

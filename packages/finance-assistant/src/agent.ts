import { Agent, type AgentTool, type AgentToolResult, type ThinkingLevel } from "@mariozechner/pi-agent-core";
import { type Api, getModel, getModels, getProviders, type KnownProvider, type Model } from "@mariozechner/pi-ai";
import { type Static, Type } from "@sinclair/typebox";
import { type AnalyzeSymbolResult, analyzeSymbol } from "./analyze.js";
import { AlphaVantageProvider } from "./providers/alpha-vantage.js";
import { FinnhubProvider } from "./providers/finnhub.js";
import type { QuoteProvider } from "./providers/types.js";
import { YahooProvider } from "./providers/yahoo.js";
import type { Timeframe } from "./types.js";

export const FINANCE_DEFAULT_PROVIDER = "deepseek";
export const FINANCE_DEFAULT_MODEL_ID = "deepseek-chat";

export interface FinanceToolDetails {
	error: string;
	result?: AnalyzeSymbolResult;
}

export interface FinanceToolOptions {
	providers?: QuoteProvider[];
	defaultTimeframe?: Timeframe;
	defaultLimit?: number;
}

const financeAnalyzeParameters = Type.Object({
	symbol: Type.String({ description: "US stock symbol, e.g. AAPL" }),
	timeframe: Type.Optional(
		Type.Union([Type.Literal("1H"), Type.Literal("1D"), Type.Literal("1W"), Type.Literal("1M")], {
			description: "Analysis timeframe",
			default: "1D",
		}),
	),
	limit: Type.Optional(Type.Number({ description: "Maximum candles to request", default: 200, minimum: 30 })),
});

type FinanceAnalyzeParams = Static<typeof financeAnalyzeParameters>;

function resolveProvidersFromEnv(): QuoteProvider[] {
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

export function createFinanceAnalyzeTool(
	options?: FinanceToolOptions,
): AgentTool<typeof financeAnalyzeParameters, FinanceToolDetails> {
	const defaultTimeframe = options?.defaultTimeframe ?? "1D";
	const defaultLimit = options?.defaultLimit ?? 200;

	return {
		name: "finance_analyze",
		label: "Finance Analyze",
		description: "Analyze a US stock with technical indicators across selected timeframe.",
		parameters: financeAnalyzeParameters,
		execute: async (_toolCallId, params): Promise<AgentToolResult<FinanceToolDetails>> => {
			const parsed = params as FinanceAnalyzeParams;
			const providers = options?.providers ?? resolveProvidersFromEnv();

			if (providers.length === 0) {
				return {
					content: [{ type: "text", text: "No finance providers configured." }],
					details: { error: "No providers configured" },
				};
			}

			const result = await analyzeSymbol({
				symbol: parsed.symbol.toUpperCase(),
				timeframe: parsed.timeframe ?? defaultTimeframe,
				limit: parsed.limit ?? defaultLimit,
				providers,
			});

			return {
				content: [{ type: "text", text: result.report.conclusion }],
				details: { error: "", result },
			};
		},
	};
}

function resolveProvider(rawProvider: string): KnownProvider {
	const provider = getProviders().find((item) => item.toLowerCase() === rawProvider.toLowerCase());
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

	const model = getModels(resolvedProvider).find((candidate) => candidate.id === resolvedModelId);
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
}

export function createFinanceAgent(options?: CreateFinanceAgentOptions): Agent {
	const model = options?.model ?? resolveFinanceModel();
	const tool = createFinanceAnalyzeTool({ providers: options?.providers });

	return new Agent({
		initialState: {
			systemPrompt:
				options?.systemPrompt ??
				"You are a financial analysis assistant. Use finance_analyze for US stocks and include risks in every answer.",
			model,
			thinkingLevel: options?.thinkingLevel ?? "off",
			tools: [tool],
			messages: [],
		},
	});
}

export function getFinanceDefaultModel(): Model<Api> {
	return getModel(FINANCE_DEFAULT_PROVIDER, FINANCE_DEFAULT_MODEL_ID);
}

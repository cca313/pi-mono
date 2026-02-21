import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { FinanceAssistantError } from "../errors.js";
import { quoteRouter } from "../providers/router.js";
import type { QuoteProvider } from "../providers/types.js";
import { normalizeTimeframe, type Timeframe } from "../types.js";
import { buildFinanceMarketData } from "../workflow/run-finance-workflow.js";
import type { FinanceMarketData } from "../workflow/types.js";
import type { FinanceWorkflowStore } from "./workflow-store.js";

const fetchMarketDataParameters = Type.Object({
	symbol: Type.String({ description: "US stock symbol, e.g. AAPL" }),
	timeframe: Type.Optional(
		Type.Union([Type.Literal("1H"), Type.Literal("1D"), Type.Literal("1W"), Type.Literal("1M")], {
			description: "Analysis timeframe",
			default: "1D",
		}),
	),
	limit: Type.Optional(Type.Number({ description: "Maximum candles to request", default: 200, minimum: 30 })),
});

type FetchMarketDataParams = Static<typeof fetchMarketDataParameters>;

export interface FinanceFetchMarketDataDetails {
	analysisId: string;
	market: FinanceMarketData;
}

export interface CreateFinanceFetchMarketDataToolOptions {
	store: FinanceWorkflowStore;
	providers?: QuoteProvider[];
	resolveProviders?: () => QuoteProvider[];
	defaultTimeframe?: Timeframe;
	defaultLimit?: number;
}

export function createFinanceFetchMarketDataTool(
	options: CreateFinanceFetchMarketDataToolOptions,
): AgentTool<typeof fetchMarketDataParameters, FinanceFetchMarketDataDetails> {
	return {
		name: "finance_fetch_market_data",
		label: "Finance Fetch Market Data",
		description: "Fetch OHLCV market candles from configured quote providers for a symbol/timeframe.",
		parameters: fetchMarketDataParameters,
		execute: async (_toolCallId: string, params: FetchMarketDataParams) => {
			const parsed = params;
			const providers = options.providers ?? options.resolveProviders?.() ?? [];

			if (providers.length === 0) {
				throw new FinanceAssistantError("PROVIDERS_FAILED", "No quote providers configured");
			}

			const symbol = parsed.symbol.toUpperCase();
			const timeframe = normalizeTimeframe(parsed.timeframe ?? options.defaultTimeframe);
			const limit = parsed.limit ?? options.defaultLimit ?? 200;

			const routed = await quoteRouter(
				{
					symbol,
					timeframe,
					limit,
				},
				providers,
			);

			const market = buildFinanceMarketData({
				symbol,
				timeframe,
				limit,
				sourceUsed: routed.sourceUsed,
				warnings: routed.warnings,
				candles: routed.candles,
			});
			const state = options.store.createFromMarket(market);
			const warningSuffix = market.warnings.length > 0 ? `, warnings=${market.warnings.length}` : "";

			return {
				content: [
					{
						type: "text",
						text:
							`Fetched ${market.candles.length} candles for ${market.symbol} ${market.timeframe} ` +
							`from ${market.sourceUsed} (analysisId=${state.analysisId}${warningSuffix}).`,
					},
				],
				details: {
					analysisId: state.analysisId,
					market,
				},
			};
		},
	};
}

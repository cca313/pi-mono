import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { FinanceAssistantError } from "../errors.js";
import { computeFinanceIndicators } from "../workflow/compute-finance-indicators.js";
import type { FinanceIndicatorData, FinanceMarketData } from "../workflow/types.js";
import type { FinanceWorkflowStore } from "./workflow-store.js";

const computeIndicatorsParameters = Type.Object({
	analysisId: Type.String({ description: "analysisId returned by finance_fetch_market_data" }),
});

type ComputeIndicatorsParams = Static<typeof computeIndicatorsParameters>;

export interface FinanceComputeIndicatorsDetails {
	analysisId: string;
	market: FinanceMarketData;
	indicators: FinanceIndicatorData;
}

export interface CreateFinanceComputeIndicatorsToolOptions {
	store: FinanceWorkflowStore;
}

export function createFinanceComputeIndicatorsTool(
	options: CreateFinanceComputeIndicatorsToolOptions,
): AgentTool<typeof computeIndicatorsParameters, FinanceComputeIndicatorsDetails> {
	return {
		name: "finance_compute_indicators",
		label: "Finance Compute Indicators",
		description: "Compute SMA, EMA, RSI, MACD, volatility, and max drawdown from cached market candles.",
		parameters: computeIndicatorsParameters,
		execute: async (_toolCallId: string, params: ComputeIndicatorsParams) => {
			const parsed = params;
			const state = options.store.getOrThrow(parsed.analysisId);
			const market = state.market;
			if (!market) {
				throw new FinanceAssistantError(
					"WORKFLOW_STATE_NOT_FOUND",
					`No market data found in workflow state: ${parsed.analysisId}`,
				);
			}

			const indicators = computeFinanceIndicators(market.candles);
			options.store.setIndicators(parsed.analysisId, indicators);

			return {
				content: [
					{
						type: "text",
						text:
							`Computed indicators for analysisId=${parsed.analysisId} ` +
							`(close=${indicators.lastClose.toFixed(2)}, RSI14=${indicators.rsi14.toFixed(2)}, ` +
							`MACD hist=${indicators.macdHistogram.toFixed(3)}).`,
					},
				],
				details: {
					analysisId: parsed.analysisId,
					market,
					indicators,
				},
			};
		},
	};
}

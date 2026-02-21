import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { FinanceAssistantError } from "../errors.js";
import type { AnalysisReport } from "../report/generate-report.js";
import { buildFinanceReport } from "../workflow/run-finance-workflow.js";
import type { FinanceIndicatorData, FinanceMarketData } from "../workflow/types.js";
import type { FinanceWorkflowStore } from "./workflow-store.js";

const generateReportParameters = Type.Object({
	analysisId: Type.String({ description: "analysisId with market data and computed indicators" }),
});

type GenerateReportParams = Static<typeof generateReportParameters>;

export interface FinanceGenerateReportDetails {
	analysisId: string;
	market: FinanceMarketData;
	indicators: FinanceIndicatorData;
	report: AnalysisReport;
}

export interface CreateFinanceGenerateReportToolOptions {
	store: FinanceWorkflowStore;
}

export function createFinanceGenerateReportTool(
	options: CreateFinanceGenerateReportToolOptions,
): AgentTool<typeof generateReportParameters, FinanceGenerateReportDetails> {
	return {
		name: "finance_generate_report",
		label: "Finance Generate Report",
		description: "Generate a structured financial analysis report from cached market data and indicators.",
		parameters: generateReportParameters,
		execute: async (_toolCallId: string, params: GenerateReportParams) => {
			const parsed = params;
			const state = options.store.getOrThrow(parsed.analysisId);
			const market = state.market;
			const indicators = state.indicators;

			if (!market || !indicators) {
				throw new FinanceAssistantError(
					"WORKFLOW_STATE_NOT_FOUND",
					`Missing market data or indicators in workflow state: ${parsed.analysisId}`,
				);
			}

			const report = buildFinanceReport(market, indicators);
			options.store.setReport(parsed.analysisId, report);

			return {
				content: [{ type: "text", text: report.conclusion }],
				details: {
					analysisId: parsed.analysisId,
					market,
					indicators,
					report,
				},
			};
		},
	};
}

import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildAdvisoryDecisionLog } from "../advisory/decision-log.js";
import type { AdvisoryDecisionLogEnvelope } from "../advisory/types.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const logAdvisoryDecisionParameters = Type.Object({
	decisionSummary: Type.String(),
	recommendation: Type.String(),
	evidence: Type.Array(Type.String(), { minItems: 1 }),
	constraints: Type.Optional(Type.Array(Type.String())),
	relatedArtifactIds: Type.Optional(Type.Array(Type.String())),
});

type LogAdvisoryDecisionParams = Static<typeof logAdvisoryDecisionParameters>;

export type FinanceLogAdvisoryDecisionDetails = AdvisoryDecisionLogEnvelope;

export interface CreateFinanceLogAdvisoryDecisionToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceLogAdvisoryDecisionTool(
	options: CreateFinanceLogAdvisoryDecisionToolOptions,
): AgentTool<typeof logAdvisoryDecisionParameters, FinanceLogAdvisoryDecisionDetails> {
	return {
		name: "finance_log_advisory_decision",
		label: "Finance Log Advisory Decision",
		description: "Create an auditable advisory decision record with evidence and constraints.",
		parameters: logAdvisoryDecisionParameters,
		execute: async (_toolCallId: string, params: LogAdvisoryDecisionParams) => {
			const built = buildAdvisoryDecisionLog(params);
			const envelope = options.advisoryStore.saveDecisionLog(built.decisionLog, built.coverage, built.warnings);

			return {
				content: [
					{
						type: "text",
						text:
							`Advisory decision logged (decisionLogId=${envelope.decisionLogId}) ` +
							`evidence=${envelope.decisionLog.evidence.length}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { normalizeClientGoals } from "../advisory/goals.js";
import { clientGoalsSchema } from "../advisory/schemas.js";
import type { ClientGoalsEnvelope } from "../advisory/types.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const captureClientGoalsParameters = Type.Object({
	goals: clientGoalsSchema,
});

type CaptureClientGoalsParams = Static<typeof captureClientGoalsParameters>;

export type FinanceCaptureClientGoalsDetails = ClientGoalsEnvelope;

export interface CreateFinanceCaptureClientGoalsToolOptions {
	store: FinanceAdvisoryStore;
}

export function createFinanceCaptureClientGoalsTool(
	options: CreateFinanceCaptureClientGoalsToolOptions,
): AgentTool<typeof captureClientGoalsParameters, FinanceCaptureClientGoalsDetails> {
	return {
		name: "finance_capture_client_goals",
		label: "Finance Capture Client Goals",
		description: "Normalize and cache client goals, constraints, and planning inputs.",
		parameters: captureClientGoalsParameters,
		execute: async (_toolCallId: string, params: CaptureClientGoalsParams) => {
			const normalized = normalizeClientGoals(params.goals);
			const envelope = options.store.saveGoals(normalized.goals, normalized.coverage, normalized.warnings);

			return {
				content: [
					{
						type: "text",
						text:
							`Captured client goals (goalsId=${envelope.goalsId}) ` +
							`items=${envelope.goals.goals.length}, coverage=${envelope.coverage}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

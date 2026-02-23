import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildClientReviewPacket } from "../advisory/review-packet.js";
import type { ClientReviewPacketEnvelope } from "../advisory/types.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const generateClientReviewPacketParameters = Type.Object({
	clientLabel: Type.Optional(Type.String()),
	goalsId: Type.Optional(Type.String()),
	portfolioReviewId: Type.Optional(Type.String()),
	stressTestId: Type.Optional(Type.String()),
	rebalancePlanId: Type.Optional(Type.String()),
	driftReportId: Type.Optional(Type.String()),
	riskMonitorId: Type.Optional(Type.String()),
});

type GenerateClientReviewPacketParams = Static<typeof generateClientReviewPacketParameters>;

export type FinanceGenerateClientReviewPacketDetails = ClientReviewPacketEnvelope;

export interface CreateFinanceGenerateClientReviewPacketToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceGenerateClientReviewPacketTool(
	options: CreateFinanceGenerateClientReviewPacketToolOptions,
): AgentTool<typeof generateClientReviewPacketParameters, FinanceGenerateClientReviewPacketDetails> {
	return {
		name: "finance_generate_client_review_packet",
		label: "Finance Generate Client Review Packet",
		description: "Generate a client-facing periodic review packet from advisory artifacts.",
		parameters: generateClientReviewPacketParameters,
		execute: async (_toolCallId: string, params: GenerateClientReviewPacketParams) => {
			const built = buildClientReviewPacket({
				clientLabel: params.clientLabel,
				goals: params.goalsId ? options.advisoryStore.getGoalsOrThrow(params.goalsId).goals : undefined,
				portfolioReview: params.portfolioReviewId
					? options.advisoryStore.getPortfolioReviewOrThrow(params.portfolioReviewId).portfolioReview
					: undefined,
				stressTest: params.stressTestId
					? options.advisoryStore.getStressTestOrThrow(params.stressTestId).stressTest
					: undefined,
				rebalancePlan: params.rebalancePlanId
					? options.advisoryStore.getRebalancePlanOrThrow(params.rebalancePlanId).rebalancePlan
					: undefined,
				driftReport: params.driftReportId
					? options.advisoryStore.getDriftReportOrThrow(params.driftReportId).driftReport
					: undefined,
				riskMonitor: params.riskMonitorId
					? options.advisoryStore.getRiskMonitorOrThrow(params.riskMonitorId).riskMonitor
					: undefined,
			});

			const envelope = options.advisoryStore.saveReviewPacket(built.reviewPacket, built.coverage, built.warnings);

			return {
				content: [
					{
						type: "text",
						text:
							`Client review packet generated (reviewPacketId=${envelope.reviewPacketId}) ` +
							`actions=${envelope.reviewPacket.recommendedActions.length}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

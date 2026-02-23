import { randomUUID } from "node:crypto";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildAdvisorySummary } from "../advisory/advisory-summary.js";
import type { AdvisorySummaryEnvelope } from "../advisory/types.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const generateAdvisorySummaryParameters = Type.Object({
	profileId: Type.Optional(Type.String()),
	goalsId: Type.Optional(Type.String()),
	ipsId: Type.Optional(Type.String()),
	portfolioReviewId: Type.Optional(Type.String()),
	stressTestId: Type.Optional(Type.String()),
	rebalancePlanId: Type.Optional(Type.String()),
	driftReportId: Type.Optional(Type.String()),
	riskMonitorId: Type.Optional(Type.String()),
	reviewPacketId: Type.Optional(Type.String()),
	decisionLogId: Type.Optional(Type.String()),
	includeAudit: Type.Optional(Type.Boolean({ default: false })),
	workflow: Type.Optional(
		Type.Union([
			Type.Literal("agent"),
			Type.Literal("onboarding"),
			Type.Literal("operations"),
			Type.Literal("symbol-advice"),
		]),
	),
	runId: Type.Optional(Type.String()),
});

type GenerateAdvisorySummaryParams = Static<typeof generateAdvisorySummaryParameters>;

export type FinanceGenerateAdvisorySummaryDetails = AdvisorySummaryEnvelope;

export interface CreateFinanceGenerateAdvisorySummaryToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceGenerateAdvisorySummaryTool(
	options: CreateFinanceGenerateAdvisorySummaryToolOptions,
): AgentTool<typeof generateAdvisorySummaryParameters, FinanceGenerateAdvisorySummaryDetails> {
	return {
		name: "finance_generate_advisory_summary",
		label: "Finance Generate Advisory Summary",
		description: "Aggregate onboarding and operations artifacts into a concise machine-readable advisory summary.",
		parameters: generateAdvisorySummaryParameters,
		execute: async (_toolCallId: string, params: GenerateAdvisorySummaryParams) => {
			const artifactIds = [
				params.profileId,
				params.goalsId,
				params.ipsId,
				params.portfolioReviewId,
				params.stressTestId,
				params.rebalancePlanId,
				params.driftReportId,
				params.riskMonitorId,
				params.reviewPacketId,
				params.decisionLogId,
			]
				.filter((item): item is string => Boolean(item))
				.map((item) => item.trim());

			const summary = buildAdvisorySummary({
				profile: params.profileId ? options.advisoryStore.getProfileOrThrow(params.profileId) : undefined,
				goals: params.goalsId ? options.advisoryStore.getGoalsOrThrow(params.goalsId) : undefined,
				ips: params.ipsId ? options.advisoryStore.getIpsOrThrow(params.ipsId) : undefined,
				portfolioReview: params.portfolioReviewId
					? options.advisoryStore.getPortfolioReviewOrThrow(params.portfolioReviewId)
					: undefined,
				stressTest: params.stressTestId
					? options.advisoryStore.getStressTestOrThrow(params.stressTestId)
					: undefined,
				rebalancePlan: params.rebalancePlanId
					? options.advisoryStore.getRebalancePlanOrThrow(params.rebalancePlanId)
					: undefined,
				driftReport: params.driftReportId
					? options.advisoryStore.getDriftReportOrThrow(params.driftReportId)
					: undefined,
				riskMonitor: params.riskMonitorId
					? options.advisoryStore.getRiskMonitorOrThrow(params.riskMonitorId)
					: undefined,
				reviewPacket: params.reviewPacketId
					? options.advisoryStore.getReviewPacketOrThrow(params.reviewPacketId)
					: undefined,
				decisionLog: params.decisionLogId
					? options.advisoryStore.getDecisionLogOrThrow(params.decisionLogId)
					: undefined,
				audit:
					params.includeAudit === true
						? {
								runId: params.runId ?? randomUUID(),
								workflow: params.workflow ?? "operations",
								artifactIds,
							}
						: undefined,
			});

			const envelope = options.advisoryStore.saveSummary(summary, summary.coverage, summary.warnings);

			return {
				content: [
					{
						type: "text",
						text:
							`Advisory summary generated (summaryId=${envelope.summaryId}) ` +
							`coverage=${envelope.coverage}, warnings=${envelope.warnings.length}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

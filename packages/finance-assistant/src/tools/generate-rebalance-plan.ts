import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildPortfolioReview } from "../advisory/portfolio-review.js";
import { normalizeInvestorProfile, normalizePortfolioSnapshot } from "../advisory/profile.js";
import { buildRebalancePlan } from "../advisory/rebalance.js";
import {
	investorProfileSchema,
	portfolioSnapshotSchema,
	rebalanceConstraintsSchema,
	targetPolicySchema,
} from "../advisory/schemas.js";
import { buildPortfolioStressTest } from "../advisory/stress-test.js";
import type { RebalancePlanEnvelope } from "../advisory/types.js";
import { resolvePortfolioInput, resolveProfileInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const generateRebalancePlanParameters = Type.Object({
	portfolioId: Type.Optional(Type.String()),
	portfolio: Type.Optional(portfolioSnapshotSchema),
	profileId: Type.Optional(Type.String()),
	profile: Type.Optional(investorProfileSchema),
	portfolioReviewId: Type.Optional(Type.String()),
	stressTestId: Type.Optional(Type.String()),
	targetPolicy: Type.Optional(targetPolicySchema),
	rebalanceConstraints: Type.Optional(rebalanceConstraintsSchema),
});

type GenerateRebalancePlanParams = Static<typeof generateRebalancePlanParameters>;

export type FinanceGenerateRebalancePlanDetails = RebalancePlanEnvelope;

export interface CreateFinanceGenerateRebalancePlanToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceGenerateRebalancePlanTool(
	options: CreateFinanceGenerateRebalancePlanToolOptions,
): AgentTool<typeof generateRebalancePlanParameters, FinanceGenerateRebalancePlanDetails> {
	return {
		name: "finance_generate_rebalance_plan",
		label: "Finance Generate Rebalance Plan",
		description: "Generate a condition-based rebalance plan with target ranges and tax notes.",
		parameters: generateRebalancePlanParameters,
		execute: async (_toolCallId: string, params: GenerateRebalancePlanParams) => {
			const resolvedPortfolio = resolvePortfolioInput(options.advisoryStore, {
				portfolio: params.portfolio ? normalizePortfolioSnapshot(params.portfolio) : undefined,
				portfolioId: params.portfolioId,
			});
			const resolvedProfile =
				params.profile || params.profileId
					? resolveProfileInput(options.advisoryStore, {
							profile: params.profile ? normalizeInvestorProfile(params.profile) : undefined,
							profileId: params.profileId,
						})
					: undefined;

			const reviewEnvelope = params.portfolioReviewId
				? options.advisoryStore.getPortfolioReviewOrThrow(params.portfolioReviewId)
				: undefined;
			const stressEnvelope = params.stressTestId
				? options.advisoryStore.getStressTestOrThrow(params.stressTestId)
				: undefined;

			const fallbackReview =
				reviewEnvelope ??
				({
					portfolioReview: buildPortfolioReview({
						portfolio: resolvedPortfolio.portfolio,
						profile: resolvedProfile?.profile,
					}).portfolioReview,
				} as const);
			const fallbackStress =
				stressEnvelope ??
				({ stressTest: buildPortfolioStressTest({ portfolio: resolvedPortfolio.portfolio }).stressTest } as const);

			const built = buildRebalancePlan({
				portfolio: resolvedPortfolio.portfolio,
				profile: resolvedProfile?.profile,
				portfolioReview: fallbackReview.portfolioReview,
				stressTest: fallbackStress.stressTest,
				targetPolicy: params.targetPolicy,
				rebalanceConstraints: params.rebalanceConstraints,
			});

			const warnings = [...built.warnings];
			if (!reviewEnvelope) {
				warnings.push("portfolioReviewId not provided; portfolio review was computed inline.");
			}
			if (!stressEnvelope) {
				warnings.push("stressTestId not provided; stress test was computed inline.");
			}

			const envelope = options.advisoryStore.saveRebalancePlan({
				rebalancePlan: built.rebalancePlan,
				coverage: built.coverage,
				warnings,
			});

			return {
				content: [
					{
						type: "text",
						text:
							`Rebalance plan generated (rebalancePlanId=${envelope.rebalancePlanId}) ` +
							`queue=${envelope.rebalancePlan.tradePriorityQueue.length}, coverage=${envelope.coverage}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildPortfolioReview } from "../advisory/portfolio-review.js";
import { normalizeInvestorProfile, normalizePortfolioSnapshot } from "../advisory/profile.js";
import { benchmarkPolicySchema, investorProfileSchema, portfolioSnapshotSchema } from "../advisory/schemas.js";
import type { PortfolioReviewEnvelope } from "../advisory/types.js";
import { resolvePortfolioInput, resolveProfileInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const reviewPortfolioParameters = Type.Object({
	portfolioId: Type.Optional(Type.String()),
	portfolio: Type.Optional(portfolioSnapshotSchema),
	profileId: Type.Optional(Type.String()),
	profile: Type.Optional(investorProfileSchema),
	benchmarkPolicy: Type.Optional(benchmarkPolicySchema),
	includeFundamentalsSummary: Type.Optional(Type.Boolean({ default: false })),
});

type ReviewPortfolioParams = Static<typeof reviewPortfolioParameters>;

export type FinanceReviewPortfolioDetails = PortfolioReviewEnvelope;

export interface CreateFinanceReviewPortfolioToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceReviewPortfolioTool(
	options: CreateFinanceReviewPortfolioToolOptions,
): AgentTool<typeof reviewPortfolioParameters, FinanceReviewPortfolioDetails> {
	return {
		name: "finance_review_portfolio",
		label: "Finance Review Portfolio",
		description: "Review portfolio concentration, liquidity, restrictions, and tax warnings.",
		parameters: reviewPortfolioParameters,
		execute: async (_toolCallId: string, params: ReviewPortfolioParams) => {
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

			const built = buildPortfolioReview({
				portfolio: resolvedPortfolio.portfolio,
				profile: resolvedProfile?.profile,
				benchmarkPolicy: params.benchmarkPolicy,
			});

			const warnings = [...built.warnings];
			if (params.includeFundamentalsSummary) {
				warnings.push("Fundamentals portfolio summary is not implemented yet (placeholder behavior).");
			}

			const envelope = options.advisoryStore.savePortfolioReview({
				portfolioReview: built.portfolioReview,
				coverage: built.coverage,
				warnings,
			});

			return {
				content: [
					{
						type: "text",
						text:
							`Portfolio review completed (portfolioReviewId=${envelope.portfolioReviewId}) ` +
							`with ${envelope.portfolioReview.priorityActions.length} priority action(s).`,
					},
				],
				details: envelope,
			};
		},
	};
}

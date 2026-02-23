import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildInvestmentPolicyStatement } from "../advisory/ips.js";
import { normalizeInvestorProfile, normalizePortfolioSnapshot } from "../advisory/profile.js";
import { clientGoalsSchema, investorProfileSchema, portfolioSnapshotSchema } from "../advisory/schemas.js";
import type { InvestmentPolicyStatementEnvelope } from "../advisory/types.js";
import { resolveProfileInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const buildInvestmentPolicyStatementParameters = Type.Object({
	profileId: Type.Optional(Type.String()),
	profile: Type.Optional(investorProfileSchema),
	goalsId: Type.Optional(Type.String()),
	goals: Type.Optional(clientGoalsSchema),
	portfolioId: Type.Optional(Type.String()),
	portfolio: Type.Optional(portfolioSnapshotSchema),
});

type BuildInvestmentPolicyStatementParams = Static<typeof buildInvestmentPolicyStatementParameters>;

export type FinanceBuildInvestmentPolicyStatementDetails = InvestmentPolicyStatementEnvelope;

export interface CreateFinanceBuildInvestmentPolicyStatementToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceBuildInvestmentPolicyStatementTool(
	options: CreateFinanceBuildInvestmentPolicyStatementToolOptions,
): AgentTool<typeof buildInvestmentPolicyStatementParameters, FinanceBuildInvestmentPolicyStatementDetails> {
	return {
		name: "finance_build_investment_policy_statement",
		label: "Finance Build Investment Policy Statement",
		description: "Build an IPS from profile, goals, and optional portfolio context.",
		parameters: buildInvestmentPolicyStatementParameters,
		execute: async (_toolCallId: string, params: BuildInvestmentPolicyStatementParams) => {
			const resolvedProfile = resolveProfileInput(options.advisoryStore, {
				profile: params.profile ? normalizeInvestorProfile(params.profile) : undefined,
				profileId: params.profileId,
			});

			if (!params.goals && !params.goalsId) {
				throw new Error("Expected goals or goalsId");
			}

			const goals = params.goals
				? params.goals
				: options.advisoryStore.getGoalsOrThrow(params.goalsId as string).goals;

			const portfolio = params.portfolio
				? normalizePortfolioSnapshot(params.portfolio)
				: params.portfolioId
					? options.advisoryStore.getPortfolioOrThrow(params.portfolioId).portfolio
					: undefined;

			const built = buildInvestmentPolicyStatement({
				profile: resolvedProfile.profile,
				goals,
				portfolio,
			});

			const envelope = options.advisoryStore.saveIps(built.ips, built.coverage, built.warnings);

			return {
				content: [
					{
						type: "text",
						text:
							`Built IPS (ipsId=${envelope.ipsId}) ` +
							`risk=${envelope.ips.riskProfileTier}, rebalance=${envelope.ips.rebalanceFrequency}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

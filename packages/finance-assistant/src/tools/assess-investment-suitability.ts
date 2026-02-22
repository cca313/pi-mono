import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { normalizeInvestorProfile } from "../advisory/profile.js";
import { fundamentalsSnapshotSchema, investorProfileSchema, positionContextSchema } from "../advisory/schemas.js";
import { buildSuitabilityAssessment } from "../advisory/suitability.js";
import type { SuitabilityAssessmentEnvelope } from "../advisory/types.js";
import { resolveAnalysisContext, resolveFundamentalsInput, resolveProfileInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";
import type { FinanceWorkflowStore } from "./workflow-store.js";

const assessInvestmentSuitabilityParameters = Type.Object({
	analysisId: Type.String({ description: "analysisId returned by finance_fetch_market_data" }),
	profileId: Type.Optional(Type.String({ description: "profileId returned by finance_capture_investor_profile" })),
	profile: Type.Optional(investorProfileSchema),
	fundamentalsId: Type.Optional(Type.String({ description: "fundamentalsId returned by finance_fetch_fundamentals" })),
	fundamentals: Type.Optional(fundamentalsSnapshotSchema),
	positionContext: Type.Optional(positionContextSchema),
});

type AssessInvestmentSuitabilityParams = Static<typeof assessInvestmentSuitabilityParameters>;

export type FinanceAssessInvestmentSuitabilityDetails = SuitabilityAssessmentEnvelope;

export interface CreateFinanceAssessInvestmentSuitabilityToolOptions {
	workflowStore: FinanceWorkflowStore;
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceAssessInvestmentSuitabilityTool(
	options: CreateFinanceAssessInvestmentSuitabilityToolOptions,
): AgentTool<typeof assessInvestmentSuitabilityParameters, FinanceAssessInvestmentSuitabilityDetails> {
	return {
		name: "finance_assess_investment_suitability",
		label: "Finance Assess Investment Suitability",
		description: "Assess suitability by combining technical analysis, investor profile, and optional fundamentals.",
		parameters: assessInvestmentSuitabilityParameters,
		execute: async (_toolCallId: string, params: AssessInvestmentSuitabilityParams) => {
			const analysis = resolveAnalysisContext(options.workflowStore, params.analysisId);
			const resolvedProfile = resolveProfileInput(options.advisoryStore, {
				profile: params.profile ? normalizeInvestorProfile(params.profile) : undefined,
				profileId: params.profileId,
			});
			const fundamentals = resolveFundamentalsInput(
				options.advisoryStore,
				{ fundamentals: params.fundamentals, fundamentalsId: params.fundamentalsId },
				analysis.market.symbol,
			);

			const built = buildSuitabilityAssessment({
				analysis,
				profile: resolvedProfile.profile,
				fundamentals,
				positionContext: params.positionContext,
			});

			const envelope = options.advisoryStore.saveAssessment({
				analysisId: analysis.analysisId,
				profileResolved: resolvedProfile.profile,
				fundamentalsResolved: fundamentals,
				suitability: built.suitability,
				coverage: built.coverage,
				warnings: built.warnings,
			});

			return {
				content: [
					{
						type: "text",
						text:
							`Suitability assessment completed for ${analysis.market.symbol} ` +
							`(assessmentId=${envelope.assessmentId}, fit=${envelope.suitability.fitLevel}, coverage=${envelope.coverage}).`,
					},
				],
				details: envelope,
			};
		},
	};
}

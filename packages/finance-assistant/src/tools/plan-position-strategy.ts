import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildPositionStrategy } from "../advisory/position-strategy.js";
import { normalizeInvestorProfile } from "../advisory/profile.js";
import {
	executionConstraintsSchema,
	investorProfileSchema,
	positionContextSchema,
	positionStrategyAccountContextSchema,
} from "../advisory/schemas.js";
import type { PositionStrategyPlanEnvelope } from "../advisory/types.js";
import { resolveAnalysisContext, resolveProfileInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";
import type { FinanceWorkflowStore } from "./workflow-store.js";

const planPositionStrategyParameters = Type.Object({
	analysisId: Type.String({ description: "analysisId with market data and indicators" }),
	profileId: Type.Optional(Type.String()),
	profile: Type.Optional(investorProfileSchema),
	assessmentId: Type.Optional(Type.String()),
	currentExposurePct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	riskBudgetPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	positionContext: Type.Optional(positionContextSchema),
	accountContext: Type.Optional(positionStrategyAccountContextSchema),
	executionConstraints: Type.Optional(executionConstraintsSchema),
});

type PlanPositionStrategyParams = Static<typeof planPositionStrategyParameters>;

export type FinancePlanPositionStrategyDetails = PositionStrategyPlanEnvelope;

export interface CreateFinancePlanPositionStrategyToolOptions {
	workflowStore: FinanceWorkflowStore;
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinancePlanPositionStrategyTool(
	options: CreateFinancePlanPositionStrategyToolOptions,
): AgentTool<typeof planPositionStrategyParameters, FinancePlanPositionStrategyDetails> {
	return {
		name: "finance_plan_position_strategy",
		label: "Finance Plan Position Strategy",
		description: "Generate position sizing ranges and condition-based risk controls.",
		parameters: planPositionStrategyParameters,
		execute: async (_toolCallId: string, params: PlanPositionStrategyParams) => {
			const analysis = resolveAnalysisContext(options.workflowStore, params.analysisId);
			const assessment = params.assessmentId
				? options.advisoryStore.getAssessmentOrThrow(params.assessmentId)
				: undefined;

			const resolvedProfile = assessment
				? { profile: assessment.profileResolved }
				: resolveProfileInput(options.advisoryStore, {
						profile: params.profile ? normalizeInvestorProfile(params.profile) : undefined,
						profileId: params.profileId,
					});

			const positionContext = {
				...(params.positionContext ?? {}),
				currentExposurePct: params.positionContext?.currentExposurePct ?? params.currentExposurePct,
			};

			const built = buildPositionStrategy({
				analysis,
				profile: resolvedProfile.profile,
				assessment,
				positionContext,
				accountContext: params.accountContext,
				riskBudgetPct: params.riskBudgetPct,
				executionConstraints: params.executionConstraints,
			});

			const envelope = options.advisoryStore.savePositionPlan({
				analysisId: analysis.analysisId,
				positionPlan: built.positionPlan,
				coverage: built.coverage,
				warnings: built.warnings,
			});

			return {
				content: [
					{
						type: "text",
						text:
							`Position strategy planned for ${analysis.market.symbol} ` +
							`(positionPlanId=${envelope.positionPlanId}, range=${envelope.positionPlan.suggestedExposureRangePct.min.toFixed(1)}-` +
							`${envelope.positionPlan.suggestedExposureRangePct.max.toFixed(1)}%).`,
					},
				],
				details: envelope,
			};
		},
	};
}

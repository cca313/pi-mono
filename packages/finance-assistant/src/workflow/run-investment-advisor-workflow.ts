import { randomUUID } from "node:crypto";
import { buildPositionStrategy } from "../advisory/position-strategy.js";
import { normalizeInvestorProfile } from "../advisory/profile.js";
import { buildSuitabilityAssessment } from "../advisory/suitability.js";
import type {
	ExecutionConstraints,
	FundamentalsSnapshotEnvelope,
	InvestorProfile,
	PositionContext,
	PositionStrategyAccountContext,
	PositionStrategyPlanEnvelope,
	SuitabilityAssessmentEnvelope,
} from "../advisory/types.js";
import { fundamentalsRouter } from "../providers/router.js";
import type { FinanceDataProvider, FundamentalsSection } from "../providers/types.js";
import { runFinanceWorkflow } from "./run-finance-workflow.js";
import type { RunFinanceWorkflowResult } from "./types.js";

const DEFAULT_FUNDAMENTALS_SECTIONS: FundamentalsSection[] = ["valuation", "profitability", "growth", "balance-sheet"];

export interface RunInvestmentAdvisorWorkflowInput {
	symbol: string;
	timeframe?: string;
	limit?: number;
	providers: FinanceDataProvider[];
	profile: InvestorProfile;
	requestedFundamentalsSections?: FundamentalsSection[];
	allowPlaceholderFundamentals?: boolean;
	positionContext?: PositionContext;
	riskBudgetPct?: number;
	accountContext?: PositionStrategyAccountContext;
	executionConstraints?: ExecutionConstraints;
}

export interface RunInvestmentAdvisorWorkflowResult {
	analysis: RunFinanceWorkflowResult;
	fundamentals: FundamentalsSnapshotEnvelope;
	assessment: SuitabilityAssessmentEnvelope;
	positionPlan: PositionStrategyPlanEnvelope;
}

export async function runInvestmentAdvisorWorkflow(
	input: RunInvestmentAdvisorWorkflowInput,
): Promise<RunInvestmentAdvisorWorkflowResult> {
	const analysis = await runFinanceWorkflow({
		symbol: input.symbol,
		timeframe: input.timeframe,
		limit: input.limit,
		providers: input.providers,
	});

	const requestedSections = input.requestedFundamentalsSections ?? DEFAULT_FUNDAMENTALS_SECTIONS;
	let fundamentals: FundamentalsSnapshotEnvelope;
	try {
		const routed = await fundamentalsRouter({ symbol: analysis.market.symbol, requestedSections }, input.providers);
		fundamentals = {
			fundamentalsId: randomUUID(),
			symbol: analysis.market.symbol,
			fundamentals: routed.fundamentals,
			sourceUsed: routed.sourceUsed,
			coverage: routed.coverage,
			warnings: routed.warnings,
			missingSections: routed.missingSections,
			updatedAt: Date.now(),
		};
	} catch (error) {
		if (input.allowPlaceholderFundamentals === false) {
			throw error;
		}

		const reason = error instanceof Error ? error.message : String(error);
		fundamentals = {
			fundamentalsId: randomUUID(),
			symbol: analysis.market.symbol,
			fundamentals: null,
			sourceUsed: null,
			coverage: "placeholder",
			warnings: [reason],
			missingSections: [...requestedSections],
			updatedAt: Date.now(),
		};
	}

	const profile = normalizeInvestorProfile(input.profile);
	const suitabilityBuilt = buildSuitabilityAssessment({
		analysis: {
			analysisId: analysis.analysisId,
			market: analysis.market,
			indicators: analysis.indicators,
			report: analysis.report,
		},
		profile,
		fundamentals,
		positionContext: input.positionContext,
	});

	const assessment: SuitabilityAssessmentEnvelope = {
		assessmentId: randomUUID(),
		analysisId: analysis.analysisId,
		profileResolved: profile,
		fundamentalsResolved: fundamentals,
		suitability: suitabilityBuilt.suitability,
		coverage: suitabilityBuilt.coverage,
		warnings: suitabilityBuilt.warnings,
		updatedAt: Date.now(),
	};

	const positionBuilt = buildPositionStrategy({
		analysis: {
			analysisId: analysis.analysisId,
			market: analysis.market,
			indicators: analysis.indicators,
			report: analysis.report,
		},
		profile,
		assessment,
		positionContext: input.positionContext,
		accountContext: input.accountContext,
		riskBudgetPct: input.riskBudgetPct,
		executionConstraints: input.executionConstraints,
	});

	const positionPlan: PositionStrategyPlanEnvelope = {
		positionPlanId: randomUUID(),
		analysisId: analysis.analysisId,
		positionPlan: positionBuilt.positionPlan,
		coverage: positionBuilt.coverage,
		warnings: positionBuilt.warnings,
		updatedAt: Date.now(),
	};

	return {
		analysis,
		fundamentals,
		assessment,
		positionPlan,
	};
}

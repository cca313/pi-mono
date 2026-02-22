import { buildSuitabilityAssessment } from "./suitability.js";
import type {
	AdvisoryAnalysisContext,
	AdvisoryCoverage,
	ExecutionConstraints,
	InvestorProfile,
	PositionContext,
	PositionStrategyAccountContext,
	PositionStrategyPlan,
	SuitabilityAssessmentEnvelope,
} from "./types.js";

export interface BuildPositionStrategyInput {
	analysis: AdvisoryAnalysisContext;
	profile: InvestorProfile;
	assessment?: SuitabilityAssessmentEnvelope;
	positionContext?: PositionContext;
	accountContext?: PositionStrategyAccountContext;
	riskBudgetPct?: number;
	executionConstraints?: ExecutionConstraints;
}

export interface BuildPositionStrategyOutput {
	positionPlan: PositionStrategyPlan;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function defaultBaseRangeByRisk(profile: InvestorProfile): { min: number; max: number } {
	if (profile.riskTolerance === "conservative") {
		return { min: 0, max: 8 };
	}

	if (profile.riskTolerance === "moderate") {
		return { min: 3, max: 15 };
	}

	return { min: 5, max: 25 };
}

export function buildPositionStrategy(input: BuildPositionStrategyInput): BuildPositionStrategyOutput {
	const derivedAssessment =
		input.assessment ??
		({
			assessmentId: "derived",
			analysisId: input.analysis.analysisId,
			profileResolved: input.profile,
			suitability: buildSuitabilityAssessment({
				analysis: input.analysis,
				profile: input.profile,
				positionContext: input.positionContext,
			}).suitability,
			coverage: "partial" as const,
			warnings: ["Assessment was derived without fundamentals data."],
			updatedAt: Date.now(),
		} satisfies SuitabilityAssessmentEnvelope);

	const warnings = [...derivedAssessment.warnings];
	const baseRange = defaultBaseRangeByRisk(input.profile);
	let min = baseRange.min;
	let max = baseRange.max;

	if (derivedAssessment.suitability.fitLevel === "poor-fit") {
		max *= 0.5;
	}

	if (derivedAssessment.suitability.fitLevel === "conditional-fit") {
		max *= 0.75;
	}

	const volatility = input.analysis.indicators.volatilityAnnualized;
	if (volatility > 0.5) {
		max *= 0.7;
		warnings.push(`High volatility (${volatility.toFixed(2)}) reduced suggested exposure range.`);
	}

	if (typeof input.riskBudgetPct === "number") {
		max = Math.min(max, input.riskBudgetPct);
	}

	if (typeof input.positionContext?.currentExposurePct === "number") {
		const currentExposure = input.positionContext.currentExposurePct;
		if (currentExposure > max) {
			min = 0;
		}
	}

	min = clamp(min, 0, 100);
	max = clamp(Math.max(min, max), min, 100);

	const ema20 = input.analysis.indicators.ema20;
	const sma20 = input.analysis.indicators.sma20;
	const rsi14 = input.analysis.indicators.rsi14;
	const macdHistogram = input.analysis.indicators.macdHistogram;

	const entryConditions = [
		`Prefer entries while price holds above EMA20 (${ema20.toFixed(2)}).`,
		`Seek improving momentum confirmation (MACD histogram > ${Math.max(0, macdHistogram).toFixed(3)}).`,
	];

	const addConditions = [
		`Add only if exposure remains within ${min.toFixed(1)}-${max.toFixed(1)}% range and trend remains intact.`,
		`Stagger adds when RSI14 normalizes toward 45-60 (current ${rsi14.toFixed(1)}).`,
	];

	const trimConditions = [
		`Trim if exposure exceeds range ceiling (${max.toFixed(1)}%) or position outgrows portfolio risk budget.`,
		"Trim on momentum deterioration after failed highs (MACD histogram rolls negative).",
	];

	const exitRiskConditions = [
		`Risk exit if price closes below EMA20 (${ema20.toFixed(2)}) and fails reclaim attempts.`,
		`Escalate risk controls if price breaks below SMA20 (${sma20.toFixed(2)}).`,
	];

	const invalidatingSignals = [
		"Sudden change in investor liquidity needs or account constraints.",
		"Material negative fundamental event not reflected in current analysis.",
		`Volatility regime shift materially above current ${volatility.toFixed(2)} baseline.`,
	];

	const taxNotes: string[] = [];
	if (input.accountContext?.accountType === "taxable" || input.positionContext?.accountType === "taxable") {
		taxNotes.push("Consider tax impact before trims or full exits in taxable accounts.");
		if ((input.positionContext?.unrealizedGainPct ?? 0) > 0) {
			taxNotes.push("Prefer staged trims if unrealized gains are significant and timing is flexible.");
		}
	}

	if (input.executionConstraints?.avoidSelling) {
		taxNotes.push("Execution constraints indicate avoiding sells; use tighter add criteria instead.");
	}

	if (input.executionConstraints?.blacklistSymbols?.length) {
		warnings.push(
			"Blacklist constraints were provided; ensure the analyzed symbol is not restricted before execution.",
		);
	}

	if (input.executionConstraints?.noMargin) {
		warnings.push("No-margin constraint assumed; range excludes leveraged sizing.");
	}

	return {
		positionPlan: {
			suggestedExposureRangePct: { min, max },
			entryConditions,
			addConditions,
			trimConditions,
			exitRiskConditions,
			invalidatingSignals,
			taxNotes,
		},
		coverage: derivedAssessment.coverage,
		warnings,
	};
}

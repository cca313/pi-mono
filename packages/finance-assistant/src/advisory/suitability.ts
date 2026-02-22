import type {
	AdvisoryAnalysisContext,
	AdvisoryCoverage,
	FundamentalsSnapshotEnvelope,
	InvestorProfile,
	SuitabilitySummary,
} from "./types.js";

export interface BuildSuitabilityInput {
	analysis: AdvisoryAnalysisContext;
	profile: InvestorProfile;
	fundamentals?: FundamentalsSnapshotEnvelope;
	positionContext?: {
		isExistingPosition?: boolean;
		currentExposurePct?: number;
		accountType?: string;
		unrealizedGainPct?: number;
	};
}

export interface BuildSuitabilityOutput {
	suitability: SuitabilitySummary;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function deriveCoverage(fundamentals: FundamentalsSnapshotEnvelope | undefined): AdvisoryCoverage {
	if (!fundamentals) {
		return "partial";
	}

	return fundamentals.coverage;
}

export function buildSuitabilityAssessment(input: BuildSuitabilityInput): BuildSuitabilityOutput {
	const { analysis, profile, fundamentals, positionContext } = input;
	const fitReasons: string[] = [];
	const misalignments: string[] = [];
	const requiredAssumptions: string[] = [];
	const warnings: string[] = [];

	const volatility = analysis.indicators.volatilityAnnualized;
	const drawdownPct = Math.abs(analysis.indicators.maxDrawdown * 100);
	const rsi = analysis.indicators.rsi14;
	const trendUp = analysis.indicators.lastClose >= analysis.indicators.ema20;

	if (trendUp) {
		fitReasons.push("Price is above EMA20, which supports trend-following entries.");
	} else {
		misalignments.push("Price is below EMA20, which weakens short-term trend confirmation.");
	}

	if (profile.riskTolerance === "conservative") {
		if (volatility > 0.35) {
			misalignments.push(`Annualized volatility ${volatility.toFixed(2)} exceeds conservative comfort levels.`);
		} else {
			fitReasons.push("Observed volatility is within a conservative screening range.");
		}
	}

	if (profile.riskTolerance === "moderate") {
		if (volatility > 0.55) {
			misalignments.push(`Annualized volatility ${volatility.toFixed(2)} is elevated for a moderate profile.`);
		} else {
			fitReasons.push("Volatility is generally compatible with a moderate risk profile.");
		}
	}

	if (profile.riskTolerance === "aggressive") {
		fitReasons.push("Aggressive risk tolerance can absorb higher short-term variance.");
	}

	if (typeof profile.maxDrawdownTolerancePct === "number" && drawdownPct > profile.maxDrawdownTolerancePct) {
		misalignments.push(
			`Observed max drawdown ${drawdownPct.toFixed(1)}% exceeds stated tolerance ${profile.maxDrawdownTolerancePct.toFixed(1)}%.`,
		);
	}

	if (profile.liquidityNeeds === "high" && analysis.market.timeframe !== "1D") {
		requiredAssumptions.push(
			"High liquidity need should be checked against trading volume and spread at execution time.",
		);
	}

	if (rsi >= 70 && !positionContext?.isExistingPosition) {
		requiredAssumptions.push("Entry assumes momentum continuation despite elevated RSI.");
	}

	if (positionContext?.isExistingPosition && typeof positionContext.currentExposurePct === "number") {
		fitReasons.push(
			`Existing exposure (${positionContext.currentExposurePct.toFixed(1)}%) can be managed with staged decisions instead of full re-entry.`,
		);
	}

	if (!fundamentals) {
		warnings.push("Fundamentals data not provided; suitability is based on technicals and profile only.");
		requiredAssumptions.push("Issuer fundamentals do not materially conflict with the technical setup.");
	} else {
		warnings.push(...fundamentals.warnings);
		if (fundamentals.coverage !== "full") {
			requiredAssumptions.push("Missing fundamentals sections could change the suitability assessment.");
		}
	}

	let fitLevel: SuitabilitySummary["fitLevel"] = "good-fit";
	if (misalignments.length >= 2) {
		fitLevel = "poor-fit";
	} else if (misalignments.length === 1 || requiredAssumptions.length >= 2) {
		fitLevel = "conditional-fit";
	}

	return {
		suitability: {
			fitLevel,
			fitReasons,
			misalignments,
			requiredAssumptions,
		},
		coverage: deriveCoverage(fundamentals),
		warnings,
	};
}

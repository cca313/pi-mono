import { getPortfolioCashValue, getPortfolioTotalValue } from "./profile.js";
import type {
	AdvisoryCoverage,
	ClientGoals,
	InvestmentPolicyStatement,
	InvestorProfile,
	PortfolioSnapshot,
	RangePct,
} from "./types.js";

export interface BuildIpsInput {
	profile: InvestorProfile;
	goals: ClientGoals;
	portfolio?: PortfolioSnapshot;
}

export interface BuildIpsOutput {
	ips: InvestmentPolicyStatement;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function defaultTargetReturnRange(profile: InvestorProfile): RangePct {
	if (profile.riskTolerance === "conservative") {
		return { min: 4, max: 8 };
	}

	if (profile.riskTolerance === "moderate") {
		return { min: 6, max: 12 };
	}

	return { min: 9, max: 18 };
}

function defaultPolicyByRisk(profile: InvestorProfile): {
	maxDrawdownPct: number;
	cashRange: RangePct;
	singlePositionMaxPct: number;
	sectorMaxPct: number;
	rebalanceFrequency: InvestmentPolicyStatement["rebalanceFrequency"];
} {
	if (profile.riskTolerance === "conservative") {
		return {
			maxDrawdownPct: 12,
			cashRange: { min: 8, max: 25 },
			singlePositionMaxPct: 12,
			sectorMaxPct: 25,
			rebalanceFrequency: "monthly",
		};
	}

	if (profile.riskTolerance === "moderate") {
		return {
			maxDrawdownPct: 20,
			cashRange: { min: 4, max: 18 },
			singlePositionMaxPct: 18,
			sectorMaxPct: 35,
			rebalanceFrequency: "quarterly",
		};
	}

	return {
		maxDrawdownPct: 30,
		cashRange: { min: 2, max: 12 },
		singlePositionMaxPct: 25,
		sectorMaxPct: 45,
		rebalanceFrequency: "quarterly",
	};
}

export function buildInvestmentPolicyStatement(input: BuildIpsInput): BuildIpsOutput {
	const warnings: string[] = [];
	const defaults = defaultPolicyByRisk(input.profile);
	const targetReturnRangePct = input.goals.targetReturnRangePct ?? defaultTargetReturnRange(input.profile);
	const maxAcceptableDrawdownPct = input.goals.maxLossTolerancePct ?? defaults.maxDrawdownPct;
	const cashTargetRangePct = input.goals.liquidityBufferPct
		? {
				min: input.goals.liquidityBufferPct,
				max: Math.max(input.goals.liquidityBufferPct + 6, defaults.cashRange.max),
			}
		: defaults.cashRange;

	if (!input.goals.targetReturnRangePct) {
		warnings.push("Target return range not provided; IPS applied risk-tier defaults.");
	}

	if (input.portfolio) {
		const totalValue = getPortfolioTotalValue(input.portfolio);
		const cashPct = totalValue > 0 ? (getPortfolioCashValue(input.portfolio) / totalValue) * 100 : 0;
		if (cashPct < cashTargetRangePct.min || cashPct > cashTargetRangePct.max) {
			warnings.push("Current cash allocation is outside IPS target cash range.");
		}
	}

	const constraints: string[] = [];
	for (const restriction of input.profile.restrictions ?? []) {
		if (restriction.value) {
			constraints.push(`${restriction.kind}: ${restriction.value}`);
		} else {
			constraints.push(restriction.kind);
		}
	}

	for (const restriction of input.goals.restrictions ?? []) {
		if (restriction.value) {
			constraints.push(`${restriction.kind}: ${restriction.value}`);
		} else {
			constraints.push(restriction.kind);
		}
	}

	const ips: InvestmentPolicyStatement = {
		riskProfileTier: input.profile.riskTolerance,
		investmentHorizon: input.profile.investmentHorizon,
		objectives: input.profile.objectives,
		targetReturnRangePct,
		maxAcceptableDrawdownPct,
		cashTargetRangePct,
		singlePositionMaxPct: defaults.singlePositionMaxPct,
		sectorMaxPct: defaults.sectorMaxPct,
		rebalanceFrequency: defaults.rebalanceFrequency,
		reviewCadence: "quarterly",
		tradingRules: [
			"Use range-and-conditions execution, not deterministic all-in/all-out calls.",
			"If a position breaches policy max weight, stage trims instead of one-shot liquidation.",
			"Escalate review after stress-loss breaches or major regime shifts.",
		],
		constraints,
		assumptions: [
			"Inputs are based on available profile/goals data and may be incomplete.",
			"Market liquidity and transaction costs must be validated at execution time.",
		],
		disclaimer: "For research and educational purposes only, not investment advice.",
	};

	return {
		ips,
		coverage: warnings.length > 0 ? "partial" : "full",
		warnings,
	};
}

import { flattenPortfolioPositions, getPortfolioTotalValue } from "./profile.js";
import type {
	AdvisoryCoverage,
	InvestorProfile,
	PortfolioReview,
	PortfolioSnapshot,
	PortfolioStressTest,
	RebalanceConstraints,
	RebalancePlan,
	RebalanceTradePriorityItem,
	TargetPolicy,
} from "./types.js";

export interface BuildRebalancePlanInput {
	portfolio: PortfolioSnapshot;
	profile?: InvestorProfile;
	portfolioReview?: PortfolioReview;
	stressTest?: PortfolioStressTest;
	targetPolicy?: TargetPolicy;
	rebalanceConstraints?: RebalanceConstraints;
}

export interface BuildRebalancePlanOutput {
	rebalancePlan: RebalancePlan;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function findPositionTarget(
	symbol: string,
	targetPolicy: TargetPolicy | undefined,
): { minPct: number; maxPct: number } | undefined {
	const rule = targetPolicy?.positionTargets?.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
	if (!rule) {
		return undefined;
	}

	if (typeof rule.targetWeightPct === "number") {
		const band = 2.5;
		return {
			minPct: Math.max(0, rule.targetWeightPct - band),
			maxPct: rule.targetWeightPct + band,
		};
	}

	if (typeof rule.minWeightPct === "number" || typeof rule.maxWeightPct === "number") {
		return {
			minPct: rule.minWeightPct ?? 0,
			maxPct: rule.maxWeightPct ?? 100,
		};
	}

	return undefined;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function buildRebalancePlan(input: BuildRebalancePlanInput): BuildRebalancePlanOutput {
	const warnings: string[] = [];
	const deferredActions: string[] = [];
	const taxImpactNotes: string[] = [];
	const executionConditions: string[] = [];
	const tradePriorityQueue: RebalanceTradePriorityItem[] = [];

	const totalValue = getPortfolioTotalValue(input.portfolio);
	const positions = flattenPortfolioPositions(input.portfolio);
	const defaultSinglePositionMaxPct =
		input.targetPolicy?.singlePositionMaxPct ?? (input.profile?.riskTolerance === "conservative" ? 12 : 20);
	const minTradeValue = input.rebalanceConstraints?.minTradeValue ?? 250;
	const blacklisted = new Set((input.rebalanceConstraints?.blacklistSymbols ?? []).map((item) => item.toUpperCase()));
	const noSellSymbols = new Set((input.rebalanceConstraints?.noSellSymbols ?? []).map((item) => item.toUpperCase()));

	const targetRanges = positions
		.map((position) => {
			const currentWeightPct = totalValue > 0 ? (position.marketValue / totalValue) * 100 : 0;
			const explicitTarget = findPositionTarget(position.symbol, input.targetPolicy);
			const maxFromPosition = typeof position.maxWeight === "number" ? position.maxWeight * 100 : undefined;
			const targetMinPct = explicitTarget?.minPct ?? 0;
			const targetMaxPct = explicitTarget?.maxPct ?? maxFromPosition ?? defaultSinglePositionMaxPct;

			return {
				symbol: position.symbol,
				currentWeightPct,
				targetMinPct: clamp(targetMinPct, 0, 100),
				targetMaxPct: clamp(targetMaxPct, 0, 100),
				accountId: position.accountId,
				accountType: position.accountType,
			};
		})
		.sort((a, b) => b.currentWeightPct - a.currentWeightPct);

	for (const range of targetRanges) {
		const symbol = range.symbol.toUpperCase();
		if (range.currentWeightPct > range.targetMaxPct) {
			if (noSellSymbols.has(symbol)) {
				deferredActions.push(`${range.symbol} exceeds target max but is marked no-sell.`);
				continue;
			}

			const pctDelta = range.currentWeightPct - range.targetMaxPct;
			const estimatedTradeValue = totalValue * (pctDelta / 100);
			if (estimatedTradeValue < minTradeValue) {
				deferredActions.push(`${range.symbol} trim signal below min trade value ${minTradeValue.toFixed(2)}.`);
				continue;
			}

			tradePriorityQueue.push({
				symbol: range.symbol,
				accountId: range.accountId,
				action: "trim",
				priority: pctDelta > 5 ? "high" : "medium",
				estimatedTradeValue,
				reason: `Current weight ${range.currentWeightPct.toFixed(1)}% exceeds max ${range.targetMaxPct.toFixed(1)}%.`,
			});
		}

		if (range.currentWeightPct < range.targetMinPct) {
			if (blacklisted.has(symbol)) {
				deferredActions.push(`${range.symbol} is below target but symbol is blacklisted for adds.`);
				continue;
			}

			const pctDelta = range.targetMinPct - range.currentWeightPct;
			const estimatedTradeValue = totalValue * (pctDelta / 100);
			if (estimatedTradeValue < minTradeValue) {
				deferredActions.push(`${range.symbol} add signal below min trade value ${minTradeValue.toFixed(2)}.`);
				continue;
			}

			tradePriorityQueue.push({
				symbol: range.symbol,
				accountId: range.accountId,
				action: "add",
				priority: pctDelta > 5 ? "high" : "medium",
				estimatedTradeValue,
				reason: `Current weight ${range.currentWeightPct.toFixed(1)}% is below min ${range.targetMinPct.toFixed(1)}%.`,
			});
		}
	}

	tradePriorityQueue.sort((a, b) => b.estimatedTradeValue - a.estimatedTradeValue);

	for (const position of positions) {
		if (position.accountType !== "taxable") {
			continue;
		}

		if ((position.taxLots?.length ?? 0) > 0) {
			taxImpactNotes.push(
				`${position.symbol}: review tax lots before taxable sales (placeholder tax optimization).`,
			);
		}
	}

	if (input.rebalanceConstraints?.allowTaxableSales === false) {
		executionConditions.push("Avoid taxable sales unless risk limits are breached.");
	}

	executionConditions.push(`Ignore recommendations below minimum trade value ${minTradeValue.toFixed(2)}.`);
	executionConditions.push(
		"Validate spreads/liquidity before execution; this plan uses a simplified placeholder model.",
	);

	if (input.portfolioReview) {
		for (const action of input.portfolioReview.priorityActions.slice(0, 3)) {
			executionConditions.push(`Review priority: ${action}`);
		}
	}

	if (input.stressTest) {
		executionConditions.push(
			`Stress focus: worst scenario ${input.stressTest.worstScenario.name} (${input.stressTest.worstScenario.estimatedPortfolioChangePct.toFixed(1)}%).`,
		);
	}

	let coverage: AdvisoryCoverage = "full";
	if (!input.portfolioReview || !input.stressTest) {
		coverage = "partial";
		warnings.push("Rebalance plan generated without both portfolio review and stress test inputs.");
	}

	return {
		rebalancePlan: {
			targetRanges: targetRanges.map((range) => ({
				symbol: range.symbol,
				currentWeightPct: range.currentWeightPct,
				targetMinPct: range.targetMinPct,
				targetMaxPct: range.targetMaxPct,
			})),
			tradePriorityQueue,
			deferredActions,
			taxImpactNotes,
			executionConditions,
		},
		coverage,
		warnings,
	};
}

import { flattenPortfolioPositions, getPortfolioCashValue, getPortfolioTotalValue } from "./profile.js";
import type {
	AdvisoryCoverage,
	DriftBreach,
	DriftPriorityItem,
	InvestmentPolicyStatement,
	PortfolioDriftReport,
	PortfolioSnapshot,
	TargetPolicy,
} from "./types.js";

export interface BuildDriftMonitorInput {
	portfolio: PortfolioSnapshot;
	targetPolicy?: TargetPolicy;
	ips?: InvestmentPolicyStatement;
}

export interface BuildDriftMonitorOutput {
	driftReport: PortfolioDriftReport;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function severityFromDrift(absDrift: number): "high" | "medium" | "low" {
	if (absDrift >= 7) {
		return "high";
	}
	if (absDrift >= 3) {
		return "medium";
	}
	return "low";
}

function findTargetRange(symbol: string, targetPolicy: TargetPolicy | undefined, fallbackMax: number) {
	const explicit = targetPolicy?.positionTargets?.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
	if (explicit?.targetWeightPct !== undefined) {
		return { min: Math.max(0, explicit.targetWeightPct - 2.5), max: explicit.targetWeightPct + 2.5 };
	}
	if (explicit && (explicit.minWeightPct !== undefined || explicit.maxWeightPct !== undefined)) {
		return { min: explicit.minWeightPct ?? 0, max: explicit.maxWeightPct ?? fallbackMax };
	}
	return { min: 0, max: fallbackMax };
}

export function buildPortfolioDriftReport(input: BuildDriftMonitorInput): BuildDriftMonitorOutput {
	const warnings: string[] = [];
	const breaches: DriftBreach[] = [];
	const priorityQueue: DriftPriorityItem[] = [];
	const coverageNotes: string[] = [];

	const totalValue = getPortfolioTotalValue(input.portfolio);
	const positions = flattenPortfolioPositions(input.portfolio);
	const fallbackMax = input.targetPolicy?.singlePositionMaxPct ?? input.ips?.singlePositionMaxPct ?? 20;

	for (const position of positions) {
		const currentWeightPct = totalValue > 0 ? (position.marketValue / totalValue) * 100 : 0;
		const targetRange = findTargetRange(position.symbol, input.targetPolicy, fallbackMax);

		if (currentWeightPct > targetRange.max || currentWeightPct < targetRange.min) {
			const driftPct =
				currentWeightPct > targetRange.max
					? currentWeightPct - targetRange.max
					: targetRange.min - currentWeightPct;
			const severity = severityFromDrift(Math.abs(driftPct));
			const isTrim = currentWeightPct > targetRange.max;
			breaches.push({
				kind: "position",
				symbol: position.symbol,
				currentWeightPct,
				targetMinPct: targetRange.min,
				targetMaxPct: targetRange.max,
				driftPct,
				severity,
				reason: isTrim
					? `Weight ${currentWeightPct.toFixed(1)}% exceeds max ${targetRange.max.toFixed(1)}%`
					: `Weight ${currentWeightPct.toFixed(1)}% below min ${targetRange.min.toFixed(1)}%`,
			});
			priorityQueue.push({
				kind: "position",
				symbol: position.symbol,
				severity,
				action: isTrim ? "trim" : "add",
				estimatedDriftPct: Math.abs(driftPct),
				reason: isTrim ? "Position above policy range" : "Position below policy range",
			});
		}
	}

	const cashTarget = input.targetPolicy?.cashTargetRangePct ?? input.ips?.cashTargetRangePct;
	if (cashTarget) {
		const cashPct = totalValue > 0 ? (getPortfolioCashValue(input.portfolio) / totalValue) * 100 : 0;
		if (cashPct < cashTarget.min || cashPct > cashTarget.max) {
			const driftPct = cashPct < cashTarget.min ? cashTarget.min - cashPct : cashPct - cashTarget.max;
			const severity = severityFromDrift(Math.abs(driftPct));
			breaches.push({
				kind: "cash",
				currentWeightPct: cashPct,
				targetMinPct: cashTarget.min,
				targetMaxPct: cashTarget.max,
				driftPct,
				severity,
				reason: `Cash ${cashPct.toFixed(1)}% outside ${cashTarget.min.toFixed(1)}-${cashTarget.max.toFixed(1)}%`,
			});
			priorityQueue.push({
				kind: "cash",
				severity,
				action: "adjust-cash",
				estimatedDriftPct: Math.abs(driftPct),
				reason: "Cash allocation outside policy range",
			});
		}
	} else {
		warnings.push("Cash target range not provided; cash drift checks were skipped.");
	}

	if (!input.targetPolicy && !input.ips) {
		warnings.push("No targetPolicy or IPS supplied; drift thresholds used defaults.");
		coverageNotes.push("Default single-position max of 20% was used.");
	}

	priorityQueue.sort((a, b) => b.estimatedDriftPct - a.estimatedDriftPct);

	return {
		driftReport: {
			summary: `Detected ${breaches.length} drift breach(es) across ${positions.length} position(s).`,
			breaches,
			priorityQueue,
			coverageNotes,
		},
		coverage: warnings.length > 0 ? "partial" : "full",
		warnings,
	};
}

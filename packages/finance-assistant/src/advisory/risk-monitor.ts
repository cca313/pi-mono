import { flattenPortfolioPositions, getPortfolioCashValue, getPortfolioTotalValue } from "./profile.js";
import { resolveRiskThresholds } from "./risk-template-registry.js";
import type {
	AdvisoryAnalysisContext,
	AdvisoryCoverage,
	PortfolioSnapshot,
	PortfolioStressTest,
	RiskBudgetMonitor,
	RiskFlag,
	RiskProfileTier,
	RiskSeverity,
	RiskThresholdTemplate,
	TargetPolicy,
} from "./types.js";

export interface BuildRiskBudgetMonitorInput {
	riskTier: RiskProfileTier;
	portfolio: PortfolioSnapshot;
	analysis?: AdvisoryAnalysisContext;
	stressTest?: PortfolioStressTest;
	targetPolicy?: TargetPolicy;
	riskTemplate?: RiskThresholdTemplate;
}

export interface BuildRiskBudgetMonitorOutput {
	riskMonitor: RiskBudgetMonitor;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function severityRank(severity: RiskSeverity): number {
	if (severity === "critical") {
		return 3;
	}
	if (severity === "warning") {
		return 2;
	}
	return 1;
}

function pushFlag(flags: RiskFlag[], flag: RiskFlag): void {
	flags.push(flag);
}

export function buildRiskBudgetMonitor(input: BuildRiskBudgetMonitorInput): BuildRiskBudgetMonitorOutput {
	const warnings: string[] = [];
	const flags: RiskFlag[] = [];
	const resolved = resolveRiskThresholds(input.riskTier, {
		template: input.riskTemplate,
		singlePositionMaxPctOverride: input.targetPolicy?.singlePositionMaxPct,
	});
	const thresholds = resolved.thresholds;

	const totalValue = getPortfolioTotalValue(input.portfolio);
	const cashPct = totalValue > 0 ? (getPortfolioCashValue(input.portfolio) / totalValue) * 100 : 0;
	const positions = flattenPortfolioPositions(input.portfolio);
	const symbolWeights = new Map<string, number>();
	const sectorWeights = new Map<string, number>();

	for (const position of positions) {
		const weightPct = totalValue > 0 ? (position.marketValue / totalValue) * 100 : 0;
		symbolWeights.set(position.symbol, (symbolWeights.get(position.symbol) ?? 0) + weightPct);
		const sector = position.sector?.trim() || "Unknown";
		sectorWeights.set(sector, (sectorWeights.get(sector) ?? 0) + weightPct);
	}

	const largestPositionPct = Math.max(0, ...symbolWeights.values());
	if (largestPositionPct > thresholds.maxSinglePositionPct) {
		pushFlag(flags, {
			code: "SINGLE_POSITION_LIMIT",
			severity: largestPositionPct - thresholds.maxSinglePositionPct >= 5 ? "critical" : "warning",
			message: `Largest position ${largestPositionPct.toFixed(1)}% exceeds limit ${thresholds.maxSinglePositionPct.toFixed(1)}%.`,
			metric: largestPositionPct,
			threshold: thresholds.maxSinglePositionPct,
		});
	}

	const largestSectorPct = Math.max(0, ...sectorWeights.values());
	if (largestSectorPct > thresholds.maxSectorPct) {
		pushFlag(flags, {
			code: "SECTOR_CONCENTRATION",
			severity: largestSectorPct - thresholds.maxSectorPct >= 7 ? "critical" : "warning",
			message: `Largest sector ${largestSectorPct.toFixed(1)}% exceeds limit ${thresholds.maxSectorPct.toFixed(1)}%.`,
			metric: largestSectorPct,
			threshold: thresholds.maxSectorPct,
		});
	}

	if (cashPct < thresholds.minCashPct || cashPct > thresholds.maxCashPct) {
		pushFlag(flags, {
			code: "CASH_RANGE",
			severity: "warning",
			message: `Cash ${cashPct.toFixed(1)}% outside target ${thresholds.minCashPct.toFixed(1)}-${thresholds.maxCashPct.toFixed(1)}%.`,
			metric: cashPct,
		});
	}

	if (input.analysis) {
		const volatility = input.analysis.indicators.volatilityAnnualized;
		if (volatility > thresholds.maxVolatilityAnnualized) {
			pushFlag(flags, {
				code: "VOLATILITY_LIMIT",
				severity: volatility - thresholds.maxVolatilityAnnualized >= 0.12 ? "critical" : "warning",
				message: `Volatility ${volatility.toFixed(2)} exceeds threshold ${thresholds.maxVolatilityAnnualized.toFixed(2)}.`,
				metric: volatility,
				threshold: thresholds.maxVolatilityAnnualized,
			});
		}

		const drawdownPct = Math.abs(input.analysis.indicators.maxDrawdown * 100);
		if (drawdownPct > thresholds.maxDrawdownPct) {
			pushFlag(flags, {
				code: "DRAWDOWN_LIMIT",
				severity: drawdownPct - thresholds.maxDrawdownPct >= 8 ? "critical" : "warning",
				message: `Drawdown ${drawdownPct.toFixed(1)}% exceeds threshold ${thresholds.maxDrawdownPct.toFixed(1)}%.`,
				metric: drawdownPct,
				threshold: thresholds.maxDrawdownPct,
			});
		}
	} else {
		warnings.push("No analysis context provided; volatility and drawdown checks were skipped.");
	}

	if (input.stressTest) {
		const worstLossPct = Math.abs(input.stressTest.worstScenario.estimatedPortfolioChangePct);
		if (worstLossPct > thresholds.maxStressLossPct) {
			pushFlag(flags, {
				code: "STRESS_LOSS_LIMIT",
				severity: worstLossPct - thresholds.maxStressLossPct >= 8 ? "critical" : "warning",
				message: `Worst stress loss ${worstLossPct.toFixed(1)}% exceeds threshold ${thresholds.maxStressLossPct.toFixed(1)}%.`,
				metric: worstLossPct,
				threshold: thresholds.maxStressLossPct,
			});
		}
	} else {
		warnings.push("No stress test provided; stress-loss checks were skipped.");
	}

	if (flags.length === 0) {
		flags.push({ code: "RISK_WITHIN_BUDGET", severity: "info", message: "No risk-budget breaches detected." });
	}

	const overallSeverity =
		[...flags].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0]?.severity ?? "info";

	return {
		riskMonitor: {
			riskTier: input.riskTier,
			thresholds,
			templateId: resolved.template.templateId,
			templateVersion: resolved.template.version,
			flags,
			overallSeverity,
			summary: `Risk monitor completed with ${flags.length} flag(s), severity=${overallSeverity}.`,
		},
		coverage: warnings.length > 0 ? "partial" : "full",
		warnings,
	};
}

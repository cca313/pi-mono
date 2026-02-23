import type { RiskBudgetThresholds, RiskProfileTier, RiskThresholdTemplate } from "./types.js";

export const DEFAULT_RISK_TEMPLATE: RiskThresholdTemplate = {
	templateId: "default-core",
	version: "2026-02-23",
	tiers: {
		conservative: {
			maxSinglePositionPct: 12,
			maxSectorPct: 25,
			maxVolatilityAnnualized: 0.28,
			maxDrawdownPct: 15,
			minCashPct: 8,
			maxCashPct: 30,
			maxStressLossPct: 12,
		},
		moderate: {
			maxSinglePositionPct: 18,
			maxSectorPct: 35,
			maxVolatilityAnnualized: 0.45,
			maxDrawdownPct: 22,
			minCashPct: 4,
			maxCashPct: 20,
			maxStressLossPct: 20,
		},
		aggressive: {
			maxSinglePositionPct: 25,
			maxSectorPct: 45,
			maxVolatilityAnnualized: 0.65,
			maxDrawdownPct: 32,
			minCashPct: 2,
			maxCashPct: 15,
			maxStressLossPct: 30,
		},
	},
	notes: "Built-in baseline thresholds for conservative/moderate/aggressive monitoring.",
};

function sanitizeThresholds(input: RiskBudgetThresholds): RiskBudgetThresholds {
	const minCash = Math.max(0, Math.min(100, input.minCashPct));
	const maxCash = Math.max(minCash, Math.min(100, input.maxCashPct));

	return {
		maxSinglePositionPct: Math.max(0, Math.min(100, input.maxSinglePositionPct)),
		maxSectorPct: Math.max(0, Math.min(100, input.maxSectorPct)),
		maxVolatilityAnnualized: Math.max(0, input.maxVolatilityAnnualized),
		maxDrawdownPct: Math.max(0, Math.min(100, input.maxDrawdownPct)),
		minCashPct: minCash,
		maxCashPct: maxCash,
		maxStressLossPct: Math.max(0, Math.min(100, input.maxStressLossPct)),
	};
}

function resolveTierThresholds(template: RiskThresholdTemplate, tier: RiskProfileTier): RiskBudgetThresholds {
	return sanitizeThresholds(template.tiers[tier]);
}

export function resolveRiskTemplate(template?: RiskThresholdTemplate): RiskThresholdTemplate {
	if (!template) {
		return DEFAULT_RISK_TEMPLATE;
	}

	return {
		templateId: template.templateId.trim() || DEFAULT_RISK_TEMPLATE.templateId,
		version: template.version.trim() || DEFAULT_RISK_TEMPLATE.version,
		notes: template.notes?.trim() || undefined,
		tiers: {
			conservative: resolveTierThresholds(template, "conservative"),
			moderate: resolveTierThresholds(template, "moderate"),
			aggressive: resolveTierThresholds(template, "aggressive"),
		},
	};
}

export function resolveRiskThresholds(
	tier: RiskProfileTier,
	options?: { template?: RiskThresholdTemplate; singlePositionMaxPctOverride?: number },
): { template: RiskThresholdTemplate; thresholds: RiskBudgetThresholds } {
	const template = resolveRiskTemplate(options?.template);
	const thresholds = {
		...template.tiers[tier],
		maxSinglePositionPct: options?.singlePositionMaxPctOverride ?? template.tiers[tier].maxSinglePositionPct,
	};

	return {
		template,
		thresholds: sanitizeThresholds(thresholds),
	};
}

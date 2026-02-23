import { describe, expect, test } from "vitest";
import {
	DEFAULT_RISK_TEMPLATE,
	resolveRiskTemplate,
	resolveRiskThresholds,
} from "../../src/advisory/risk-template-registry.js";

describe("risk template registry", () => {
	test("returns default template when none is provided", () => {
		const resolved = resolveRiskTemplate();
		expect(resolved.templateId).toBe(DEFAULT_RISK_TEMPLATE.templateId);
		expect(resolved.version).toBe(DEFAULT_RISK_TEMPLATE.version);
	});

	test("applies template and single-position override", () => {
		const custom = resolveRiskThresholds("moderate", {
			template: {
				templateId: "org-beta",
				version: "2.1.0",
				tiers: {
					conservative: {
						maxSinglePositionPct: 10,
						maxSectorPct: 24,
						maxVolatilityAnnualized: 0.22,
						maxDrawdownPct: 13,
						minCashPct: 9,
						maxCashPct: 32,
						maxStressLossPct: 11,
					},
					moderate: {
						maxSinglePositionPct: 16,
						maxSectorPct: 30,
						maxVolatilityAnnualized: 0.38,
						maxDrawdownPct: 19,
						minCashPct: 5,
						maxCashPct: 22,
						maxStressLossPct: 17,
					},
					aggressive: {
						maxSinglePositionPct: 24,
						maxSectorPct: 42,
						maxVolatilityAnnualized: 0.6,
						maxDrawdownPct: 30,
						minCashPct: 2,
						maxCashPct: 16,
						maxStressLossPct: 27,
					},
				},
			},
			singlePositionMaxPctOverride: 13,
		});

		expect(custom.template.templateId).toBe("org-beta");
		expect(custom.thresholds.maxSinglePositionPct).toBe(13);
		expect(custom.thresholds.maxSectorPct).toBe(30);
	});
});

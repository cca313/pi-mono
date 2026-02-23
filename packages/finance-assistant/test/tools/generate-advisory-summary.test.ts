import { describe, expect, test } from "vitest";
import { buildAdvisorySummary } from "../../src/advisory/advisory-summary.js";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceGenerateAdvisorySummaryTool } from "../../src/tools/generate-advisory-summary.js";
import { createInvestorProfile, createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_generate_advisory_summary tool", () => {
	test("aggregates artifacts from advisory store", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const profile = advisoryStore.saveProfile(createInvestorProfile({ clientLabel: "Summary Tool" }));
		const goals = advisoryStore.saveGoals({
			planningHorizonYears: 12,
			goals: [{ label: "Retirement", targetAmount: 1100000, priority: "high" }],
		});
		const ips = advisoryStore.saveIps({
			riskProfileTier: "moderate",
			investmentHorizon: "long",
			objectives: ["growth", "diversification"],
			targetReturnRangePct: { min: 6, max: 12 },
			maxAcceptableDrawdownPct: 20,
			cashTargetRangePct: { min: 4, max: 15 },
			singlePositionMaxPct: 18,
			sectorMaxPct: 35,
			rebalanceFrequency: "quarterly",
			reviewCadence: "quarterly",
			tradingRules: ["rule"],
			constraints: [],
			assumptions: ["assumption"],
			disclaimer: "For research and educational purposes only, not investment advice.",
		});
		const driftReport = advisoryStore.saveDriftReport({
			summary: "drift",
			breaches: [],
			priorityQueue: [],
			coverageNotes: [],
		});
		const riskMonitor = advisoryStore.saveRiskMonitor({
			riskTier: "moderate",
			templateId: "default-core",
			templateVersion: "2026-02-23",
			thresholds: {
				maxSinglePositionPct: 18,
				maxSectorPct: 35,
				maxVolatilityAnnualized: 0.45,
				maxDrawdownPct: 22,
				minCashPct: 4,
				maxCashPct: 20,
				maxStressLossPct: 20,
			},
			flags: [],
			overallSeverity: "info",
			summary: "ok",
		});
		const reviewPacket = advisoryStore.saveReviewPacket({
			headline: "packet",
			keyUpdates: [],
			riskAlerts: [],
			recommendedActions: ["Hold ranges"],
			clientQuestions: [],
			disclaimer: "For research and educational purposes only, not investment advice.",
		});
		const decisionLog = advisoryStore.saveDecisionLog({
			decisionSummary: "summary",
			recommendation: "recommendation",
			evidence: ["risk ok"],
			constraints: [],
			relatedArtifactIds: [],
			disclaimer: "For research and educational purposes only, not investment advice.",
			loggedAt: Date.now(),
		});

		const tool = createFinanceGenerateAdvisorySummaryTool({ advisoryStore });
		const result = await tool.execute("tool-call-1", {
			profileId: profile.profileId,
			goalsId: goals.goalsId,
			ipsId: ips.ipsId,
			driftReportId: driftReport.driftReportId,
			riskMonitorId: riskMonitor.riskMonitorId,
			reviewPacketId: reviewPacket.reviewPacketId,
			decisionLogId: decisionLog.decisionLogId,
		});

		expect(result.details.summaryId.length).toBeGreaterThan(0);
		expect(result.details.summary.client.clientLabel).toBe("Summary Tool");
		expect(result.details.summary.client.goalLabels).toContain("Retirement");
		expect(result.details.summary.compliance.decisionLogId).toBe(decisionLog.decisionLogId);
	});

	test("includes audit envelope when includeAudit is enabled", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const profile = advisoryStore.saveProfile(createInvestorProfile({ clientLabel: "Audit Client" }));
		const tool = createFinanceGenerateAdvisorySummaryTool({ advisoryStore });

		const result = await tool.execute("tool-call-audit", {
			profileId: profile.profileId,
			includeAudit: true,
			workflow: "operations",
			runId: "run-123",
		});

		expect(result.details.summary.audit?.runId).toBe("run-123");
		expect(result.details.summary.audit?.workflow).toBe("operations");
		expect(result.details.summary.audit?.artifactIds).toContain(profile.profileId);
	});

	test("supports empty input and returns default disclaimer", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const tool = createFinanceGenerateAdvisorySummaryTool({ advisoryStore });

		const result = await tool.execute("tool-call-2", {});
		const direct = buildAdvisorySummary({});

		expect(result.details.summary.coverage).toBe("full");
		expect(result.details.summary.compliance.disclaimer).toBe(direct.compliance.disclaimer);
	});

	test("throws when referenced artifact is missing", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		advisoryStore.savePortfolio(createPortfolioSnapshot());
		const tool = createFinanceGenerateAdvisorySummaryTool({ advisoryStore });

		await expect(tool.execute("tool-call-3", { profileId: "missing-profile" })).rejects.toMatchObject({
			code: "ADVISORY_PROFILE_NOT_FOUND",
		});
	});
});

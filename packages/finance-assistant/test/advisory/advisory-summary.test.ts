import { describe, expect, test } from "vitest";
import { buildAdvisorySummary } from "../../src/advisory/advisory-summary.js";
import type {
	AdvisoryDecisionLogEnvelope,
	ClientGoalsEnvelope,
	ClientReviewPacketEnvelope,
	InvestmentPolicyStatementEnvelope,
	InvestorProfileEnvelope,
	PortfolioDriftReportEnvelope,
	PortfolioStressTestEnvelope,
	RiskBudgetMonitorEnvelope,
} from "../../src/advisory/types.js";

function createBaseArtifacts() {
	const profile: InvestorProfileEnvelope = {
		profileId: "profile-1",
		profile: {
			clientLabel: "Summary Client",
			riskTolerance: "moderate",
			investmentHorizon: "long",
			objectives: ["growth", "diversification"],
			liquidityNeeds: "medium",
		},
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	const goals: ClientGoalsEnvelope = {
		goalsId: "goals-1",
		goals: {
			planningHorizonYears: 10,
			goals: [{ label: "Retirement", priority: "high", targetAmount: 1000000 }],
		},
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	const ips: InvestmentPolicyStatementEnvelope = {
		ipsId: "ips-1",
		ips: {
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
			constraints: ["constraint"],
			assumptions: ["assumption"],
			disclaimer: "For research and educational purposes only, not investment advice.",
		},
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	const drift: PortfolioDriftReportEnvelope = {
		driftReportId: "drift-1",
		driftReport: {
			summary: "one breach",
			breaches: [
				{
					kind: "position",
					symbol: "AAPL",
					currentWeightPct: 24,
					targetMinPct: 0,
					targetMaxPct: 18,
					driftPct: 6,
					severity: "high",
					reason: "above max",
				},
			],
			priorityQueue: [
				{
					kind: "position",
					symbol: "AAPL",
					severity: "high",
					action: "trim",
					estimatedDriftPct: 6,
					reason: "above policy",
				},
			],
			coverageNotes: [],
		},
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	const risk: RiskBudgetMonitorEnvelope = {
		riskMonitorId: "risk-1",
		riskMonitor: {
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
			flags: [{ code: "SINGLE_POSITION_LIMIT", severity: "warning", message: "breach" }],
			overallSeverity: "warning",
			summary: "warning",
		},
		coverage: "partial",
		warnings: ["missing analysis"],
		updatedAt: Date.now(),
	};

	const stress: PortfolioStressTestEnvelope = {
		stressTestId: "stress-1",
		stressTest: {
			scenarioResults: [],
			worstScenario: {
				name: "market_down_20",
				estimatedPortfolioChangePct: -18,
				estimatedPnl: -18000,
				topLossContributors: [],
			},
			keyVulnerabilities: [],
		},
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	const packet: ClientReviewPacketEnvelope = {
		reviewPacketId: "packet-1",
		reviewPacket: {
			headline: "headline",
			keyUpdates: ["update"],
			riskAlerts: ["alert"],
			recommendedActions: ["action"],
			clientQuestions: ["question"],
			disclaimer: "For research and educational purposes only, not investment advice.",
		},
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	const decision: AdvisoryDecisionLogEnvelope = {
		decisionLogId: "decision-1",
		decisionLog: {
			decisionSummary: "summary",
			recommendation: "recommendation",
			evidence: ["evidence 1", "evidence 2"],
			constraints: [],
			relatedArtifactIds: ["drift-1", "risk-1"],
			disclaimer: "For research and educational purposes only, not investment advice.",
			loggedAt: Date.now(),
		},
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	return { profile, goals, ips, drift, risk, stress, packet, decision };
}

describe("buildAdvisorySummary", () => {
	test("builds summary from onboarding + operations artifacts", () => {
		const artifacts = createBaseArtifacts();
		const summary = buildAdvisorySummary({
			profile: artifacts.profile,
			goals: artifacts.goals,
			ips: artifacts.ips,
			driftReport: artifacts.drift,
			riskMonitor: artifacts.risk,
			stressTest: artifacts.stress,
			reviewPacket: artifacts.packet,
			decisionLog: artifacts.decision,
			audit: { runId: "run-1", workflow: "operations", artifactIds: ["risk-1", "decision-1"] },
		});

		expect(summary.client.clientLabel).toBe("Summary Client");
		expect(summary.client.goalLabels).toEqual(["Retirement"]);
		expect(summary.policy?.singlePositionMaxPct).toBe(18);
		expect(summary.monitoring.driftBreachCount).toBe(1);
		expect(summary.monitoring.riskSeverity).toBe("warning");
		expect(summary.monitoring.riskTemplateId).toBe("default-core");
		expect(summary.audit?.runId).toBe("run-1");
		expect(summary.compliance.decisionLogId).toBe("decision-1");
		expect(summary.coverage).toBe("partial");
	});

	test("returns defaults when optional sections are missing", () => {
		const summary = buildAdvisorySummary({});

		expect(summary.coverage).toBe("full");
		expect(summary.client.goalLabels).toEqual([]);
		expect(summary.monitoring.riskFlagCount).toBe(0);
		expect(summary.actions.priorityActions).toEqual([]);
		expect(summary.compliance.disclaimer).toContain("not investment advice");
	});
});

import { randomUUID } from "node:crypto";
import type {
	AdvisoryAuditEnvelope,
	AdvisoryCoverage,
	AdvisoryDecisionLog,
	AdvisoryDecisionLogEnvelope,
	AdvisorySummary,
	AdvisorySummaryInput,
	ClientGoals,
	ClientGoalsEnvelope,
	ClientReviewPacket,
	ClientReviewPacketEnvelope,
	InvestmentPolicyStatement,
	InvestmentPolicyStatementEnvelope,
	InvestorProfile,
	InvestorProfileEnvelope,
	PortfolioDriftReport,
	PortfolioDriftReportEnvelope,
	PortfolioReview,
	PortfolioReviewEnvelope,
	PortfolioStressTest,
	PortfolioStressTestEnvelope,
	RebalancePlan,
	RebalancePlanEnvelope,
	RiskBudgetMonitor,
	RiskBudgetMonitorEnvelope,
} from "./types.js";

function unwrapProfile(profile: AdvisorySummaryInput["profile"]): InvestorProfile | undefined {
	if (!profile) {
		return undefined;
	}
	if ("profile" in profile) {
		return (profile as InvestorProfileEnvelope).profile;
	}
	return profile as InvestorProfile;
}

function unwrapGoals(goals: AdvisorySummaryInput["goals"]): ClientGoals | undefined {
	if (!goals) {
		return undefined;
	}
	if ("goals" in goals && "goalsId" in goals) {
		return (goals as ClientGoalsEnvelope).goals;
	}
	return goals as ClientGoals;
}

function unwrapIps(ips: AdvisorySummaryInput["ips"]): InvestmentPolicyStatement | undefined {
	if (!ips) {
		return undefined;
	}
	if ("ips" in ips && "ipsId" in ips) {
		return (ips as InvestmentPolicyStatementEnvelope).ips;
	}
	return ips as InvestmentPolicyStatement;
}

function unwrapPortfolioReview(input: AdvisorySummaryInput["portfolioReview"]): PortfolioReview | undefined {
	if (!input) {
		return undefined;
	}
	if ("portfolioReview" in input && "portfolioReviewId" in input) {
		return (input as PortfolioReviewEnvelope).portfolioReview;
	}
	return input as PortfolioReview;
}

function unwrapStressTest(input: AdvisorySummaryInput["stressTest"]): PortfolioStressTest | undefined {
	if (!input) {
		return undefined;
	}
	if ("stressTest" in input && "stressTestId" in input) {
		return (input as PortfolioStressTestEnvelope).stressTest;
	}
	return input as PortfolioStressTest;
}

function unwrapRebalancePlan(input: AdvisorySummaryInput["rebalancePlan"]): RebalancePlan | undefined {
	if (!input) {
		return undefined;
	}
	if ("rebalancePlan" in input && "rebalancePlanId" in input) {
		return (input as RebalancePlanEnvelope).rebalancePlan;
	}
	return input as RebalancePlan;
}

function unwrapDriftReport(input: AdvisorySummaryInput["driftReport"]): PortfolioDriftReport | undefined {
	if (!input) {
		return undefined;
	}
	if ("driftReport" in input && "driftReportId" in input) {
		return (input as PortfolioDriftReportEnvelope).driftReport;
	}
	return input as PortfolioDriftReport;
}

function unwrapRiskMonitor(input: AdvisorySummaryInput["riskMonitor"]): RiskBudgetMonitor | undefined {
	if (!input) {
		return undefined;
	}
	if ("riskMonitor" in input && "riskMonitorId" in input) {
		return (input as RiskBudgetMonitorEnvelope).riskMonitor;
	}
	return input as RiskBudgetMonitor;
}

function unwrapReviewPacket(input: AdvisorySummaryInput["reviewPacket"]): ClientReviewPacket | undefined {
	if (!input) {
		return undefined;
	}
	if ("reviewPacket" in input && "reviewPacketId" in input) {
		return (input as ClientReviewPacketEnvelope).reviewPacket;
	}
	return input as ClientReviewPacket;
}

function unwrapDecisionLog(input: AdvisorySummaryInput["decisionLog"]): AdvisoryDecisionLog | undefined {
	if (!input) {
		return undefined;
	}
	if ("decisionLog" in input && "decisionLogId" in input) {
		return (input as AdvisoryDecisionLogEnvelope).decisionLog;
	}
	return input as AdvisoryDecisionLog;
}

function collectCoverage(input: AdvisorySummaryInput): AdvisoryCoverage {
	const coverages: AdvisoryCoverage[] = [];
	for (const value of [
		input.profile,
		input.goals,
		input.ips,
		input.portfolioReview,
		input.stressTest,
		input.rebalancePlan,
		input.driftReport,
		input.riskMonitor,
		input.reviewPacket,
		input.decisionLog,
	]) {
		if (!value || typeof value !== "object") {
			continue;
		}
		if ("coverage" in value && typeof value.coverage === "string") {
			coverages.push(value.coverage as AdvisoryCoverage);
		}
	}

	if (coverages.includes("placeholder")) {
		return "placeholder";
	}
	if (coverages.includes("partial")) {
		return "partial";
	}
	return "full";
}

function collectWarnings(input: AdvisorySummaryInput): string[] {
	const warnings: string[] = [];
	for (const value of [
		input.profile,
		input.goals,
		input.ips,
		input.portfolioReview,
		input.stressTest,
		input.rebalancePlan,
		input.driftReport,
		input.riskMonitor,
		input.reviewPacket,
		input.decisionLog,
	]) {
		if (!value || typeof value !== "object") {
			continue;
		}
		if ("warnings" in value && Array.isArray(value.warnings)) {
			warnings.push(...value.warnings.filter((item): item is string => typeof item === "string"));
		}
	}
	return [...new Set(warnings)];
}

function resolveDecisionLogId(input: AdvisorySummaryInput["decisionLog"]): string | undefined {
	if (!input || typeof input !== "object") {
		return undefined;
	}
	if ("decisionLogId" in input && typeof input.decisionLogId === "string") {
		return input.decisionLogId;
	}
	return undefined;
}

function buildAuditEnvelope(
	summary: Omit<AdvisorySummary, "audit">,
	input: AdvisorySummaryInput,
): AdvisoryAuditEnvelope | undefined {
	if (!input.audit) {
		return undefined;
	}

	const workflow = input.audit.workflow ?? "operations";
	const runId = input.audit.runId?.trim() || randomUUID();
	const artifactIds = [
		...new Set((input.audit.artifactIds ?? []).map((item) => item.trim()).filter((item) => item.length > 0)),
	];

	return {
		runId,
		workflow,
		generatedAt: summary.generatedAt,
		coverage: summary.coverage,
		warningsCount: summary.warnings.length,
		templateId: summary.monitoring.riskTemplateId,
		templateVersion: summary.monitoring.riskTemplateVersion,
		artifactIds,
	};
}

export function buildAdvisorySummary(input: AdvisorySummaryInput): AdvisorySummary {
	const profile = unwrapProfile(input.profile);
	const goals = unwrapGoals(input.goals);
	const ips = unwrapIps(input.ips);
	const portfolioReview = unwrapPortfolioReview(input.portfolioReview);
	const stressTest = unwrapStressTest(input.stressTest);
	const rebalancePlan = unwrapRebalancePlan(input.rebalancePlan);
	const driftReport = unwrapDriftReport(input.driftReport);
	const riskMonitor = unwrapRiskMonitor(input.riskMonitor);
	const reviewPacket = unwrapReviewPacket(input.reviewPacket);
	const decisionLog = unwrapDecisionLog(input.decisionLog);

	const riskAlerts = reviewPacket?.riskAlerts ?? [];
	const priorityActions = [
		...(driftReport?.priorityQueue.slice(0, 3).map((item) => `${item.action}: ${item.reason}`) ?? []),
		...(rebalancePlan?.tradePriorityQueue.slice(0, 3).map((item) => `${item.action}: ${item.reason}`) ?? []),
		...(portfolioReview?.priorityActions.slice(0, 2) ?? []),
	];

	const summary: Omit<AdvisorySummary, "audit"> = {
		generatedAt: Date.now(),
		coverage: collectCoverage(input),
		warnings: collectWarnings(input),
		client: {
			clientLabel: profile?.clientLabel,
			riskTier: ips?.riskProfileTier ?? profile?.riskTolerance,
			investmentHorizon: ips?.investmentHorizon ?? profile?.investmentHorizon,
			goalLabels: goals?.goals.map((goal) => goal.label) ?? [],
		},
		policy: ips
			? {
					targetReturnRangePct: ips.targetReturnRangePct,
					maxAcceptableDrawdownPct: ips.maxAcceptableDrawdownPct,
					cashTargetRangePct: ips.cashTargetRangePct,
					singlePositionMaxPct: ips.singlePositionMaxPct,
					sectorMaxPct: ips.sectorMaxPct,
					rebalanceFrequency: ips.rebalanceFrequency,
				}
			: undefined,
		monitoring: {
			riskSeverity: riskMonitor?.overallSeverity,
			riskFlagCount: riskMonitor?.flags.length ?? 0,
			riskTemplateId: riskMonitor?.templateId,
			riskTemplateVersion: riskMonitor?.templateVersion,
			driftBreachCount: driftReport?.breaches.length ?? 0,
			worstStressScenario: stressTest?.worstScenario.name,
			worstStressLossPct: stressTest?.worstScenario.estimatedPortfolioChangePct,
		},
		actions: {
			priorityActions,
			clientActions: reviewPacket?.recommendedActions ?? riskAlerts,
		},
		compliance: {
			disclaimer:
				decisionLog?.disclaimer ??
				reviewPacket?.disclaimer ??
				ips?.disclaimer ??
				"For research and educational purposes only, not investment advice.",
			decisionLogId: resolveDecisionLogId(input.decisionLog),
			evidenceSummary: decisionLog?.evidence.slice(0, 5) ?? [],
		},
	};

	return {
		...summary,
		audit: buildAuditEnvelope(summary, input),
	};
}

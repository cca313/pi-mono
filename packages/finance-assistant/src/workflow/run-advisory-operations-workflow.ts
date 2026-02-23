import { randomUUID } from "node:crypto";
import { buildAdvisorySummary } from "../advisory/advisory-summary.js";
import { buildAdvisoryDecisionLog } from "../advisory/decision-log.js";
import { buildPortfolioDriftReport } from "../advisory/drift-monitor.js";
import { buildPortfolioReview } from "../advisory/portfolio-review.js";
import { normalizeInvestorProfile, normalizePortfolioSnapshot } from "../advisory/profile.js";
import { buildRebalancePlan } from "../advisory/rebalance.js";
import { buildClientReviewPacket } from "../advisory/review-packet.js";
import { buildRiskBudgetMonitor } from "../advisory/risk-monitor.js";
import { buildPortfolioStressTest } from "../advisory/stress-test.js";
import type {
	AdvisoryDecisionLogEnvelope,
	AdvisorySummary,
	BenchmarkPolicy,
	ClientReviewPacketEnvelope,
	InvestorProfile,
	PortfolioDriftReportEnvelope,
	PortfolioReviewEnvelope,
	PortfolioSnapshot,
	PortfolioStressScenario,
	PortfolioStressTestEnvelope,
	RebalancePlanEnvelope,
	RiskBudgetMonitorEnvelope,
	RiskProfileTier,
	RiskThresholdTemplate,
	TargetPolicy,
} from "../advisory/types.js";

export interface RunAdvisoryOperationsWorkflowInput {
	portfolio: PortfolioSnapshot;
	profile?: InvestorProfile;
	riskTier?: RiskProfileTier;
	riskTemplate?: RiskThresholdTemplate;
	benchmarkPolicy?: BenchmarkPolicy;
	scenarios?: PortfolioStressScenario[];
	targetPolicy?: TargetPolicy;
	decisionSummary?: string;
	recommendation?: string;
}

export interface RunAdvisoryOperationsWorkflowResult {
	profile?: InvestorProfile;
	portfolio: PortfolioSnapshot;
	portfolioReview: PortfolioReviewEnvelope;
	stressTest: PortfolioStressTestEnvelope;
	rebalancePlan: RebalancePlanEnvelope;
	driftReport: PortfolioDriftReportEnvelope;
	riskMonitor: RiskBudgetMonitorEnvelope;
	reviewPacket: ClientReviewPacketEnvelope;
	decisionLog: AdvisoryDecisionLogEnvelope;
	summary: AdvisorySummary;
}

export async function runAdvisoryOperationsWorkflow(
	input: RunAdvisoryOperationsWorkflowInput,
): Promise<RunAdvisoryOperationsWorkflowResult> {
	const runId = randomUUID();
	const profile = input.profile ? normalizeInvestorProfile(input.profile) : undefined;
	const portfolio = normalizePortfolioSnapshot(input.portfolio);

	const reviewBuilt = buildPortfolioReview({
		portfolio,
		profile,
		benchmarkPolicy: input.benchmarkPolicy,
	});
	const portfolioReview: PortfolioReviewEnvelope = {
		portfolioReviewId: randomUUID(),
		portfolioReview: reviewBuilt.portfolioReview,
		coverage: reviewBuilt.coverage,
		warnings: reviewBuilt.warnings,
		updatedAt: Date.now(),
	};

	const stressBuilt = buildPortfolioStressTest({
		portfolio,
		scenarios: input.scenarios,
	});
	const stressTest: PortfolioStressTestEnvelope = {
		stressTestId: randomUUID(),
		stressTest: stressBuilt.stressTest,
		coverage: stressBuilt.coverage,
		warnings: stressBuilt.warnings,
		updatedAt: Date.now(),
	};

	const rebalanceBuilt = buildRebalancePlan({
		portfolio,
		profile,
		portfolioReview: portfolioReview.portfolioReview,
		stressTest: stressTest.stressTest,
		targetPolicy: input.targetPolicy,
	});
	const rebalancePlan: RebalancePlanEnvelope = {
		rebalancePlanId: randomUUID(),
		rebalancePlan: rebalanceBuilt.rebalancePlan,
		coverage: rebalanceBuilt.coverage,
		warnings: rebalanceBuilt.warnings,
		updatedAt: Date.now(),
	};

	const driftBuilt = buildPortfolioDriftReport({
		portfolio,
		targetPolicy: input.targetPolicy,
	});
	const driftReport: PortfolioDriftReportEnvelope = {
		driftReportId: randomUUID(),
		driftReport: driftBuilt.driftReport,
		coverage: driftBuilt.coverage,
		warnings: driftBuilt.warnings,
		updatedAt: Date.now(),
	};

	const riskBuilt = buildRiskBudgetMonitor({
		riskTier: input.riskTier ?? profile?.riskTolerance ?? "moderate",
		portfolio,
		stressTest: stressTest.stressTest,
		targetPolicy: input.targetPolicy,
		riskTemplate: input.riskTemplate,
	});
	const riskMonitor: RiskBudgetMonitorEnvelope = {
		riskMonitorId: randomUUID(),
		riskMonitor: riskBuilt.riskMonitor,
		coverage: riskBuilt.coverage,
		warnings: riskBuilt.warnings,
		updatedAt: Date.now(),
	};

	const packetBuilt = buildClientReviewPacket({
		clientLabel: profile?.clientLabel,
		portfolioReview: portfolioReview.portfolioReview,
		stressTest: stressTest.stressTest,
		rebalancePlan: rebalancePlan.rebalancePlan,
		driftReport: driftReport.driftReport,
		riskMonitor: riskMonitor.riskMonitor,
	});
	const reviewPacket: ClientReviewPacketEnvelope = {
		reviewPacketId: randomUUID(),
		reviewPacket: packetBuilt.reviewPacket,
		coverage: packetBuilt.coverage,
		warnings: packetBuilt.warnings,
		updatedAt: Date.now(),
	};

	const decisionBuilt = buildAdvisoryDecisionLog({
		decisionSummary:
			input.decisionSummary ??
			"Portfolio operations review completed with risk and drift checks; actions are condition-based.",
		recommendation:
			input.recommendation ??
			"Prioritize high-severity drift/risk items first, then stage remaining actions across review cadence.",
		evidence: [
			`Drift breaches: ${driftReport.driftReport.breaches.length}`,
			`Risk severity: ${riskMonitor.riskMonitor.overallSeverity}`,
			`Rebalance queue: ${rebalancePlan.rebalancePlan.tradePriorityQueue.length}`,
		],
		relatedArtifactIds: [
			portfolioReview.portfolioReviewId,
			stressTest.stressTestId,
			rebalancePlan.rebalancePlanId,
			driftReport.driftReportId,
			riskMonitor.riskMonitorId,
			reviewPacket.reviewPacketId,
		],
	});
	const decisionLog: AdvisoryDecisionLogEnvelope = {
		decisionLogId: randomUUID(),
		decisionLog: decisionBuilt.decisionLog,
		coverage: decisionBuilt.coverage,
		warnings: decisionBuilt.warnings,
		updatedAt: Date.now(),
	};

	const summary = buildAdvisorySummary({
		profile,
		portfolioReview,
		stressTest,
		rebalancePlan,
		driftReport,
		riskMonitor,
		reviewPacket,
		decisionLog,
		audit: {
			runId,
			workflow: "operations",
			artifactIds: [
				portfolioReview.portfolioReviewId,
				stressTest.stressTestId,
				rebalancePlan.rebalancePlanId,
				driftReport.driftReportId,
				riskMonitor.riskMonitorId,
				reviewPacket.reviewPacketId,
				decisionLog.decisionLogId,
			],
		},
	});

	return {
		profile,
		portfolio,
		portfolioReview,
		stressTest,
		rebalancePlan,
		driftReport,
		riskMonitor,
		reviewPacket,
		decisionLog,
		summary,
	};
}

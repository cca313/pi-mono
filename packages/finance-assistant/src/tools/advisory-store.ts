import { randomUUID } from "node:crypto";
import type {
	AdvisoryCoverage,
	AdvisoryDecisionLog,
	AdvisoryDecisionLogEnvelope,
	AdvisorySummary,
	AdvisorySummaryEnvelope,
	ClientGoals,
	ClientGoalsEnvelope,
	ClientReviewPacket,
	ClientReviewPacketEnvelope,
	FundamentalsSnapshotEnvelope,
	InvestmentPolicyStatement,
	InvestmentPolicyStatementEnvelope,
	InvestorProfile,
	InvestorProfileEnvelope,
	PortfolioDriftReport,
	PortfolioDriftReportEnvelope,
	PortfolioReview,
	PortfolioReviewEnvelope,
	PortfolioSnapshot,
	PortfolioSnapshotEnvelope,
	PortfolioStressTest,
	PortfolioStressTestEnvelope,
	PositionStrategyPlan,
	PositionStrategyPlanEnvelope,
	RebalancePlan,
	RebalancePlanEnvelope,
	RiskBudgetMonitor,
	RiskBudgetMonitorEnvelope,
	SuitabilityAssessmentEnvelope,
	SuitabilitySummary,
} from "../advisory/types.js";
import { FinanceAssistantError } from "../errors.js";

type AdvisoryArtifactKind =
	| "profile"
	| "portfolio"
	| "fundamentals"
	| "assessment"
	| "position-plan"
	| "portfolio-review"
	| "stress-test"
	| "rebalance-plan"
	| "goals"
	| "ips"
	| "drift-report"
	| "risk-monitor"
	| "review-packet"
	| "decision-log"
	| "advisory-summary";

type AdvisoryArtifactValue =
	| InvestorProfileEnvelope
	| PortfolioSnapshotEnvelope
	| FundamentalsSnapshotEnvelope
	| SuitabilityAssessmentEnvelope
	| PositionStrategyPlanEnvelope
	| PortfolioReviewEnvelope
	| PortfolioStressTestEnvelope
	| RebalancePlanEnvelope
	| ClientGoalsEnvelope
	| InvestmentPolicyStatementEnvelope
	| PortfolioDriftReportEnvelope
	| RiskBudgetMonitorEnvelope
	| ClientReviewPacketEnvelope
	| AdvisoryDecisionLogEnvelope
	| AdvisorySummaryEnvelope;

interface AdvisoryArtifactRecord {
	kind: AdvisoryArtifactKind;
	id: string;
	value: AdvisoryArtifactValue;
}

export interface FinanceAdvisoryStore {
	readonly maxEntries: number;
	saveProfile(profile: InvestorProfile, coverage?: AdvisoryCoverage, warnings?: string[]): InvestorProfileEnvelope;
	getProfile(profileId: string): InvestorProfileEnvelope | undefined;
	getProfileOrThrow(profileId: string): InvestorProfileEnvelope;
	savePortfolio(
		portfolio: PortfolioSnapshot,
		coverage?: AdvisoryCoverage,
		warnings?: string[],
	): PortfolioSnapshotEnvelope;
	getPortfolio(portfolioId: string): PortfolioSnapshotEnvelope | undefined;
	getPortfolioOrThrow(portfolioId: string): PortfolioSnapshotEnvelope;
	saveFundamentals(
		input: Omit<FundamentalsSnapshotEnvelope, "fundamentalsId" | "updatedAt">,
	): FundamentalsSnapshotEnvelope;
	getFundamentals(fundamentalsId: string): FundamentalsSnapshotEnvelope | undefined;
	getFundamentalsOrThrow(fundamentalsId: string): FundamentalsSnapshotEnvelope;
	saveAssessment(input: {
		analysisId: string;
		profileResolved: SuitabilityAssessmentEnvelope["profileResolved"];
		fundamentalsResolved?: SuitabilityAssessmentEnvelope["fundamentalsResolved"];
		suitability: SuitabilitySummary;
		coverage: AdvisoryCoverage;
		warnings: string[];
	}): SuitabilityAssessmentEnvelope;
	getAssessment(assessmentId: string): SuitabilityAssessmentEnvelope | undefined;
	getAssessmentOrThrow(assessmentId: string): SuitabilityAssessmentEnvelope;
	savePositionPlan(input: {
		analysisId: string;
		positionPlan: PositionStrategyPlan;
		coverage: AdvisoryCoverage;
		warnings: string[];
	}): PositionStrategyPlanEnvelope;
	getPositionPlan(positionPlanId: string): PositionStrategyPlanEnvelope | undefined;
	getPositionPlanOrThrow(positionPlanId: string): PositionStrategyPlanEnvelope;
	savePortfolioReview(input: {
		portfolioReview: PortfolioReview;
		coverage: AdvisoryCoverage;
		warnings: string[];
	}): PortfolioReviewEnvelope;
	getPortfolioReview(portfolioReviewId: string): PortfolioReviewEnvelope | undefined;
	getPortfolioReviewOrThrow(portfolioReviewId: string): PortfolioReviewEnvelope;
	saveStressTest(input: {
		stressTest: PortfolioStressTest;
		coverage: AdvisoryCoverage;
		warnings: string[];
	}): PortfolioStressTestEnvelope;
	getStressTest(stressTestId: string): PortfolioStressTestEnvelope | undefined;
	getStressTestOrThrow(stressTestId: string): PortfolioStressTestEnvelope;
	saveRebalancePlan(input: {
		rebalancePlan: RebalancePlan;
		coverage: AdvisoryCoverage;
		warnings: string[];
	}): RebalancePlanEnvelope;
	getRebalancePlan(rebalancePlanId: string): RebalancePlanEnvelope | undefined;
	getRebalancePlanOrThrow(rebalancePlanId: string): RebalancePlanEnvelope;
	saveGoals(goals: ClientGoals, coverage?: AdvisoryCoverage, warnings?: string[]): ClientGoalsEnvelope;
	getGoals(goalsId: string): ClientGoalsEnvelope | undefined;
	getGoalsOrThrow(goalsId: string): ClientGoalsEnvelope;
	saveIps(
		ips: InvestmentPolicyStatement,
		coverage?: AdvisoryCoverage,
		warnings?: string[],
	): InvestmentPolicyStatementEnvelope;
	getIps(ipsId: string): InvestmentPolicyStatementEnvelope | undefined;
	getIpsOrThrow(ipsId: string): InvestmentPolicyStatementEnvelope;
	saveDriftReport(
		report: PortfolioDriftReport,
		coverage?: AdvisoryCoverage,
		warnings?: string[],
	): PortfolioDriftReportEnvelope;
	getDriftReport(driftReportId: string): PortfolioDriftReportEnvelope | undefined;
	getDriftReportOrThrow(driftReportId: string): PortfolioDriftReportEnvelope;
	saveRiskMonitor(
		riskMonitor: RiskBudgetMonitor,
		coverage?: AdvisoryCoverage,
		warnings?: string[],
	): RiskBudgetMonitorEnvelope;
	getRiskMonitor(riskMonitorId: string): RiskBudgetMonitorEnvelope | undefined;
	getRiskMonitorOrThrow(riskMonitorId: string): RiskBudgetMonitorEnvelope;
	saveReviewPacket(
		reviewPacket: ClientReviewPacket,
		coverage?: AdvisoryCoverage,
		warnings?: string[],
	): ClientReviewPacketEnvelope;
	getReviewPacket(reviewPacketId: string): ClientReviewPacketEnvelope | undefined;
	getReviewPacketOrThrow(reviewPacketId: string): ClientReviewPacketEnvelope;
	saveDecisionLog(
		decisionLog: AdvisoryDecisionLog,
		coverage?: AdvisoryCoverage,
		warnings?: string[],
	): AdvisoryDecisionLogEnvelope;
	getDecisionLog(decisionLogId: string): AdvisoryDecisionLogEnvelope | undefined;
	getDecisionLogOrThrow(decisionLogId: string): AdvisoryDecisionLogEnvelope;
	saveSummary(summary: AdvisorySummary, coverage?: AdvisoryCoverage, warnings?: string[]): AdvisorySummaryEnvelope;
	getSummary(summaryId: string): AdvisorySummaryEnvelope | undefined;
	getSummaryOrThrow(summaryId: string): AdvisorySummaryEnvelope;
}

function normalizeMaxEntries(input: number | undefined): number {
	if (!Number.isFinite(input) || !input || input <= 0) {
		return 100;
	}

	return Math.floor(input);
}

function buildMissingStateError(kind: AdvisoryArtifactKind, id: string): FinanceAssistantError {
	if (kind === "profile") {
		return new FinanceAssistantError("ADVISORY_PROFILE_NOT_FOUND", `Investor profile not found: ${id}`);
	}

	if (kind === "portfolio") {
		return new FinanceAssistantError("PORTFOLIO_STATE_NOT_FOUND", `Portfolio state not found: ${id}`);
	}

	if (kind === "fundamentals") {
		return new FinanceAssistantError("FUNDAMENTALS_STATE_NOT_FOUND", `Fundamentals state not found: ${id}`);
	}

	if (kind === "goals") {
		return new FinanceAssistantError("ADVISORY_GOALS_NOT_FOUND", `Client goals not found: ${id}`);
	}

	if (kind === "ips") {
		return new FinanceAssistantError("ADVISORY_IPS_NOT_FOUND", `IPS not found: ${id}`);
	}

	return new FinanceAssistantError("WORKFLOW_STATE_NOT_FOUND", `Advisory state not found (${kind}): ${id}`);
}

export function createFinanceAdvisoryStore(maxEntries?: number): FinanceAdvisoryStore {
	const entryCap = normalizeMaxEntries(maxEntries);
	const entries = new Map<string, AdvisoryArtifactRecord>();

	const makeKey = (kind: AdvisoryArtifactKind, id: string) => `${kind}:${id}`;

	const touch = (record: AdvisoryArtifactRecord): AdvisoryArtifactRecord => {
		entries.delete(makeKey(record.kind, record.id));
		entries.set(makeKey(record.kind, record.id), record);

		while (entries.size > entryCap) {
			const oldest = entries.keys().next().value;
			if (!oldest) {
				break;
			}
			entries.delete(oldest);
		}

		return record;
	};

	const getTyped = <TValue extends AdvisoryArtifactValue>(
		kind: AdvisoryArtifactKind,
		id: string,
	): TValue | undefined => {
		const record = entries.get(makeKey(kind, id));
		if (!record || record.kind !== kind) {
			return undefined;
		}

		return record.value as TValue;
	};

	const getTypedOrThrow = <TValue extends AdvisoryArtifactValue>(kind: AdvisoryArtifactKind, id: string): TValue => {
		const value = getTyped<TValue>(kind, id);
		if (!value) {
			throw buildMissingStateError(kind, id);
		}

		return value;
	};

	const stamp = (updatedAt: number): number => updatedAt;

	return {
		maxEntries: entryCap,
		saveProfile(profile, coverage = "full", warnings = []) {
			const envelope: InvestorProfileEnvelope = {
				profileId: randomUUID(),
				profile,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "profile", id: envelope.profileId, value: envelope });
			return envelope;
		},
		getProfile(profileId) {
			return getTyped<InvestorProfileEnvelope>("profile", profileId);
		},
		getProfileOrThrow(profileId) {
			return getTypedOrThrow<InvestorProfileEnvelope>("profile", profileId);
		},
		savePortfolio(portfolio, coverage = "full", warnings = []) {
			const envelope: PortfolioSnapshotEnvelope = {
				portfolioId: randomUUID(),
				portfolio,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "portfolio", id: envelope.portfolioId, value: envelope });
			return envelope;
		},
		getPortfolio(portfolioId) {
			return getTyped<PortfolioSnapshotEnvelope>("portfolio", portfolioId);
		},
		getPortfolioOrThrow(portfolioId) {
			return getTypedOrThrow<PortfolioSnapshotEnvelope>("portfolio", portfolioId);
		},
		saveFundamentals(input) {
			const envelope: FundamentalsSnapshotEnvelope = {
				fundamentalsId: randomUUID(),
				symbol: input.symbol,
				fundamentals: input.fundamentals,
				fundamentalsNormalized: input.fundamentalsNormalized,
				fundamentalsFieldMetadata: input.fundamentalsFieldMetadata,
				sourceUsed: input.sourceUsed,
				coverage: input.coverage,
				warnings: [...input.warnings],
				missingSections: [...input.missingSections],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "fundamentals", id: envelope.fundamentalsId, value: envelope });
			return envelope;
		},
		getFundamentals(fundamentalsId) {
			return getTyped<FundamentalsSnapshotEnvelope>("fundamentals", fundamentalsId);
		},
		getFundamentalsOrThrow(fundamentalsId) {
			return getTypedOrThrow<FundamentalsSnapshotEnvelope>("fundamentals", fundamentalsId);
		},
		saveAssessment(input) {
			const envelope: SuitabilityAssessmentEnvelope = {
				assessmentId: randomUUID(),
				analysisId: input.analysisId,
				profileResolved: input.profileResolved,
				fundamentalsResolved: input.fundamentalsResolved,
				suitability: input.suitability,
				coverage: input.coverage,
				warnings: [...input.warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "assessment", id: envelope.assessmentId, value: envelope });
			return envelope;
		},
		getAssessment(assessmentId) {
			return getTyped<SuitabilityAssessmentEnvelope>("assessment", assessmentId);
		},
		getAssessmentOrThrow(assessmentId) {
			return getTypedOrThrow<SuitabilityAssessmentEnvelope>("assessment", assessmentId);
		},
		savePositionPlan(input) {
			const envelope: PositionStrategyPlanEnvelope = {
				positionPlanId: randomUUID(),
				analysisId: input.analysisId,
				positionPlan: input.positionPlan,
				coverage: input.coverage,
				warnings: [...input.warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "position-plan", id: envelope.positionPlanId, value: envelope });
			return envelope;
		},
		getPositionPlan(positionPlanId) {
			return getTyped<PositionStrategyPlanEnvelope>("position-plan", positionPlanId);
		},
		getPositionPlanOrThrow(positionPlanId) {
			return getTypedOrThrow<PositionStrategyPlanEnvelope>("position-plan", positionPlanId);
		},
		savePortfolioReview(input) {
			const envelope: PortfolioReviewEnvelope = {
				portfolioReviewId: randomUUID(),
				portfolioReview: input.portfolioReview,
				coverage: input.coverage,
				warnings: [...input.warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "portfolio-review", id: envelope.portfolioReviewId, value: envelope });
			return envelope;
		},
		getPortfolioReview(portfolioReviewId) {
			return getTyped<PortfolioReviewEnvelope>("portfolio-review", portfolioReviewId);
		},
		getPortfolioReviewOrThrow(portfolioReviewId) {
			return getTypedOrThrow<PortfolioReviewEnvelope>("portfolio-review", portfolioReviewId);
		},
		saveStressTest(input) {
			const envelope: PortfolioStressTestEnvelope = {
				stressTestId: randomUUID(),
				stressTest: input.stressTest,
				coverage: input.coverage,
				warnings: [...input.warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "stress-test", id: envelope.stressTestId, value: envelope });
			return envelope;
		},
		getStressTest(stressTestId) {
			return getTyped<PortfolioStressTestEnvelope>("stress-test", stressTestId);
		},
		getStressTestOrThrow(stressTestId) {
			return getTypedOrThrow<PortfolioStressTestEnvelope>("stress-test", stressTestId);
		},
		saveRebalancePlan(input) {
			const envelope: RebalancePlanEnvelope = {
				rebalancePlanId: randomUUID(),
				rebalancePlan: input.rebalancePlan,
				coverage: input.coverage,
				warnings: [...input.warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "rebalance-plan", id: envelope.rebalancePlanId, value: envelope });
			return envelope;
		},
		getRebalancePlan(rebalancePlanId) {
			return getTyped<RebalancePlanEnvelope>("rebalance-plan", rebalancePlanId);
		},
		getRebalancePlanOrThrow(rebalancePlanId) {
			return getTypedOrThrow<RebalancePlanEnvelope>("rebalance-plan", rebalancePlanId);
		},
		saveGoals(goals, coverage = "full", warnings = []) {
			const envelope: ClientGoalsEnvelope = {
				goalsId: randomUUID(),
				goals,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "goals", id: envelope.goalsId, value: envelope });
			return envelope;
		},
		getGoals(goalsId) {
			return getTyped<ClientGoalsEnvelope>("goals", goalsId);
		},
		getGoalsOrThrow(goalsId) {
			return getTypedOrThrow<ClientGoalsEnvelope>("goals", goalsId);
		},
		saveIps(ips, coverage = "full", warnings = []) {
			const envelope: InvestmentPolicyStatementEnvelope = {
				ipsId: randomUUID(),
				ips,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "ips", id: envelope.ipsId, value: envelope });
			return envelope;
		},
		getIps(ipsId) {
			return getTyped<InvestmentPolicyStatementEnvelope>("ips", ipsId);
		},
		getIpsOrThrow(ipsId) {
			return getTypedOrThrow<InvestmentPolicyStatementEnvelope>("ips", ipsId);
		},
		saveDriftReport(report, coverage = "full", warnings = []) {
			const envelope: PortfolioDriftReportEnvelope = {
				driftReportId: randomUUID(),
				driftReport: report,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "drift-report", id: envelope.driftReportId, value: envelope });
			return envelope;
		},
		getDriftReport(driftReportId) {
			return getTyped<PortfolioDriftReportEnvelope>("drift-report", driftReportId);
		},
		getDriftReportOrThrow(driftReportId) {
			return getTypedOrThrow<PortfolioDriftReportEnvelope>("drift-report", driftReportId);
		},
		saveRiskMonitor(riskMonitor, coverage = "full", warnings = []) {
			const envelope: RiskBudgetMonitorEnvelope = {
				riskMonitorId: randomUUID(),
				riskMonitor,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "risk-monitor", id: envelope.riskMonitorId, value: envelope });
			return envelope;
		},
		getRiskMonitor(riskMonitorId) {
			return getTyped<RiskBudgetMonitorEnvelope>("risk-monitor", riskMonitorId);
		},
		getRiskMonitorOrThrow(riskMonitorId) {
			return getTypedOrThrow<RiskBudgetMonitorEnvelope>("risk-monitor", riskMonitorId);
		},
		saveReviewPacket(reviewPacket, coverage = "full", warnings = []) {
			const envelope: ClientReviewPacketEnvelope = {
				reviewPacketId: randomUUID(),
				reviewPacket,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "review-packet", id: envelope.reviewPacketId, value: envelope });
			return envelope;
		},
		getReviewPacket(reviewPacketId) {
			return getTyped<ClientReviewPacketEnvelope>("review-packet", reviewPacketId);
		},
		getReviewPacketOrThrow(reviewPacketId) {
			return getTypedOrThrow<ClientReviewPacketEnvelope>("review-packet", reviewPacketId);
		},
		saveDecisionLog(decisionLog, coverage = "full", warnings = []) {
			const envelope: AdvisoryDecisionLogEnvelope = {
				decisionLogId: randomUUID(),
				decisionLog,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "decision-log", id: envelope.decisionLogId, value: envelope });
			return envelope;
		},
		getDecisionLog(decisionLogId) {
			return getTyped<AdvisoryDecisionLogEnvelope>("decision-log", decisionLogId);
		},
		getDecisionLogOrThrow(decisionLogId) {
			return getTypedOrThrow<AdvisoryDecisionLogEnvelope>("decision-log", decisionLogId);
		},
		saveSummary(summary, coverage = "full", warnings = []) {
			const envelope: AdvisorySummaryEnvelope = {
				summaryId: randomUUID(),
				summary,
				coverage,
				warnings: [...warnings],
				updatedAt: stamp(Date.now()),
			};
			touch({ kind: "advisory-summary", id: envelope.summaryId, value: envelope });
			return envelope;
		},
		getSummary(summaryId) {
			return getTyped<AdvisorySummaryEnvelope>("advisory-summary", summaryId);
		},
		getSummaryOrThrow(summaryId) {
			return getTypedOrThrow<AdvisorySummaryEnvelope>("advisory-summary", summaryId);
		},
	};
}

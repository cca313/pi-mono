import type { FundamentalsSection, FundamentalsSnapshot } from "../providers/types.js";
import type { AnalysisReport } from "../report/generate-report.js";
import type { FinanceIndicatorData, FinanceMarketData } from "../workflow/types.js";

export type AdvisoryCoverage = "placeholder" | "partial" | "full";

export type RiskTolerance = "conservative" | "moderate" | "aggressive";
export type InvestmentHorizon = "short" | "medium" | "long";
export type InvestmentObjective = "income" | "growth" | "capital-preservation" | "speculation" | "diversification";
export type LiquidityNeeds = "low" | "medium" | "high";
export type AccountType = "taxable" | "ira" | "roth" | "401k" | "other";
export type SuitabilityFitLevel = "good-fit" | "conditional-fit" | "poor-fit";

export interface RangePct {
	min: number;
	max: number;
}

export interface InvestorRestriction {
	kind: string;
	value?: string;
	note?: string;
}

export interface InvestorTaxProfile {
	federalBracketPct?: number;
	stateBracketPct?: number;
	shortTermGainSensitive?: boolean;
	longTermGainSensitive?: boolean;
	prefersTaxLossHarvesting?: boolean;
}

export interface InvestorProfile {
	clientLabel?: string;
	riskTolerance: RiskTolerance;
	investmentHorizon: InvestmentHorizon;
	objectives: InvestmentObjective[];
	liquidityNeeds: LiquidityNeeds;
	maxDrawdownTolerancePct?: number;
	accountTypes?: AccountType[];
	restrictions?: InvestorRestriction[];
	taxProfile?: InvestorTaxProfile;
	notes?: string;
}

export interface InvestorProfileEnvelope {
	profileId: string;
	profile: InvestorProfile;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface PortfolioTaxLot {
	lotId: string;
	quantity: number;
	costBasisPerShare: number;
	acquiredAt: number;
}

export interface PortfolioPosition {
	symbol: string;
	quantity: number;
	lastPrice?: number;
	marketValue: number;
	avgCost?: number;
	sector?: string;
	targetWeight?: number;
	maxWeight?: number;
	taxLots?: PortfolioTaxLot[];
}

export interface PortfolioFees {
	commissionPerTrade?: number;
	slippageBps?: number;
}

export interface PortfolioAccount {
	accountId: string;
	accountType: AccountType;
	cashBalance: number;
	fees?: PortfolioFees;
	restrictions?: InvestorRestriction[];
	positions: PortfolioPosition[];
}

export interface PortfolioSnapshot {
	asOf: number;
	baseCurrency: string;
	accounts: PortfolioAccount[];
}

export interface PortfolioSnapshotEnvelope {
	portfolioId: string;
	portfolio: PortfolioSnapshot;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export type FundamentalsFieldKind = "fraction" | "ratio" | "multiple" | "currency" | "count" | "unknown";
export type FundamentalsNormalizedUnit = "fraction" | "raw";

export interface FundamentalsFieldMetadata {
	canonicalField: string;
	sourceField: string;
	sourceProvider: string;
	kind: FundamentalsFieldKind;
	normalizedUnit: FundamentalsNormalizedUnit;
	note?: string;
}

export type FundamentalsFieldMetadataMap = Partial<
	Record<FundamentalsSection, Record<string, FundamentalsFieldMetadata>>
>;

export interface NormalizedFundamentalsSnapshot {
	symbol: string;
	asOf: number;
	sections: Partial<Record<FundamentalsSection, Record<string, number>>>;
}

export interface FundamentalsSnapshotEnvelope {
	fundamentalsId: string;
	symbol: string;
	fundamentals: FundamentalsSnapshot | null;
	fundamentalsNormalized?: NormalizedFundamentalsSnapshot | null;
	fundamentalsFieldMetadata?: FundamentalsFieldMetadataMap;
	sourceUsed: string | null;
	coverage: AdvisoryCoverage;
	warnings: string[];
	missingSections: FundamentalsSection[];
	updatedAt: number;
}

export interface PositionContext {
	isExistingPosition?: boolean;
	currentExposurePct?: number;
	accountType?: AccountType;
	unrealizedGainPct?: number;
}

export interface PositionStrategyAccountContext {
	accountType?: AccountType;
	accountId?: string;
	cashAvailable?: number;
}

export interface ExecutionConstraints {
	minTradeValue?: number;
	avoidSelling?: boolean;
	blacklistSymbols?: string[];
	noMargin?: boolean;
}

export interface SuitabilitySummary {
	fitLevel: SuitabilityFitLevel;
	fitReasons: string[];
	misalignments: string[];
	requiredAssumptions: string[];
}

export interface SuitabilityAssessmentEnvelope {
	assessmentId: string;
	analysisId: string;
	profileResolved: InvestorProfile;
	fundamentalsResolved?: FundamentalsSnapshotEnvelope;
	suitability: SuitabilitySummary;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface PositionStrategyPlan {
	suggestedExposureRangePct: RangePct;
	entryConditions: string[];
	addConditions: string[];
	trimConditions: string[];
	exitRiskConditions: string[];
	invalidatingSignals: string[];
	taxNotes: string[];
}

export interface PositionStrategyPlanEnvelope {
	positionPlanId: string;
	analysisId: string;
	positionPlan: PositionStrategyPlan;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface BenchmarkPolicy {
	minCashPct?: number;
	maxCashPct?: number;
	singlePositionMaxPct?: number;
	sectorMaxPct?: number;
}

export interface PortfolioReview {
	summary: string;
	concentrationFindings: string[];
	diversificationFindings: string[];
	liquidityFindings: string[];
	restrictionViolations: string[];
	taxWarnings: string[];
	priorityActions: string[];
}

export interface PortfolioReviewEnvelope {
	portfolioReviewId: string;
	portfolioReview: PortfolioReview;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export type StressShockTargetType = "symbol" | "sector" | "market-bucket";

export interface StressShock {
	targetType: StressShockTargetType;
	target: string;
	pctChange: number;
}

export interface PortfolioStressScenario {
	name: string;
	shocks: StressShock[];
}

export interface StressContributor {
	symbol: string;
	accountId: string;
	estimatedPnl: number;
}

export interface PortfolioStressScenarioResult {
	name: string;
	estimatedPortfolioChangePct: number;
	estimatedPnl: number;
	topLossContributors: StressContributor[];
}

export interface PortfolioStressTest {
	scenarioResults: PortfolioStressScenarioResult[];
	worstScenario: PortfolioStressScenarioResult;
	keyVulnerabilities: string[];
}

export interface PortfolioStressTestEnvelope {
	stressTestId: string;
	stressTest: PortfolioStressTest;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface PositionTargetPolicy {
	symbol: string;
	targetWeightPct?: number;
	minWeightPct?: number;
	maxWeightPct?: number;
}

export interface TargetPolicy {
	cashTargetRangePct?: RangePct;
	singlePositionMaxPct?: number;
	sectorMaxPct?: number;
	positionTargets?: PositionTargetPolicy[];
}

export interface RebalanceConstraints {
	minTradeValue?: number;
	blacklistSymbols?: string[];
	noSellSymbols?: string[];
	allowTaxableSales?: boolean;
}

export type RebalanceTradeAction = "add" | "trim";

export interface RebalanceTargetRange {
	symbol: string;
	currentWeightPct: number;
	targetMinPct: number;
	targetMaxPct: number;
}

export interface RebalanceTradePriorityItem {
	symbol: string;
	accountId: string;
	action: RebalanceTradeAction;
	priority: "high" | "medium" | "low";
	estimatedTradeValue: number;
	reason: string;
}

export interface RebalancePlan {
	targetRanges: RebalanceTargetRange[];
	tradePriorityQueue: RebalanceTradePriorityItem[];
	deferredActions: string[];
	taxImpactNotes: string[];
	executionConditions: string[];
}

export interface RebalancePlanEnvelope {
	rebalancePlanId: string;
	rebalancePlan: RebalancePlan;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export type RiskProfileTier = "conservative" | "moderate" | "aggressive";

export interface FinancialGoal {
	goalId?: string;
	label: string;
	targetAmount?: number;
	currentAmount?: number;
	targetDate?: number;
	priority?: "high" | "medium" | "low";
	notes?: string;
}

export interface CashFlowPlan {
	monthlyContribution?: number;
	monthlyWithdrawal?: number;
	emergencyFundMonths?: number;
}

export interface ClientGoals {
	planningHorizonYears?: number;
	targetReturnRangePct?: RangePct;
	maxLossTolerancePct?: number;
	liquidityBufferPct?: number;
	goals: FinancialGoal[];
	cashFlowPlan?: CashFlowPlan;
	restrictions?: InvestorRestriction[];
	notes?: string;
}

export interface ClientGoalsEnvelope {
	goalsId: string;
	goals: ClientGoals;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface InvestmentPolicyStatement {
	riskProfileTier: RiskProfileTier;
	investmentHorizon: InvestmentHorizon;
	objectives: InvestmentObjective[];
	targetReturnRangePct: RangePct;
	maxAcceptableDrawdownPct: number;
	cashTargetRangePct: RangePct;
	singlePositionMaxPct: number;
	sectorMaxPct: number;
	rebalanceFrequency: "monthly" | "quarterly" | "semi-annual";
	reviewCadence: "monthly" | "quarterly";
	tradingRules: string[];
	constraints: string[];
	assumptions: string[];
	disclaimer: string;
}

export interface InvestmentPolicyStatementEnvelope {
	ipsId: string;
	ips: InvestmentPolicyStatement;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export type DriftBreachKind = "position" | "cash";

export interface DriftBreach {
	kind: DriftBreachKind;
	symbol?: string;
	currentWeightPct: number;
	targetMinPct: number;
	targetMaxPct: number;
	driftPct: number;
	severity: "high" | "medium" | "low";
	reason: string;
}

export interface DriftPriorityItem {
	kind: DriftBreachKind;
	symbol?: string;
	severity: "high" | "medium" | "low";
	action: "trim" | "add" | "adjust-cash";
	estimatedDriftPct: number;
	reason: string;
}

export interface PortfolioDriftReport {
	summary: string;
	breaches: DriftBreach[];
	priorityQueue: DriftPriorityItem[];
	coverageNotes: string[];
}

export interface PortfolioDriftReportEnvelope {
	driftReportId: string;
	driftReport: PortfolioDriftReport;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export type RiskSeverity = "info" | "warning" | "critical";

export interface RiskBudgetThresholds {
	maxSinglePositionPct: number;
	maxSectorPct: number;
	maxVolatilityAnnualized: number;
	maxDrawdownPct: number;
	minCashPct: number;
	maxCashPct: number;
	maxStressLossPct: number;
}

export interface RiskThresholdTemplate {
	templateId: string;
	version: string;
	tiers: Record<RiskProfileTier, RiskBudgetThresholds>;
	notes?: string;
}

export interface RiskFlag {
	code: string;
	severity: RiskSeverity;
	message: string;
	metric?: number;
	threshold?: number;
}

export interface RiskBudgetMonitor {
	riskTier: RiskProfileTier;
	thresholds: RiskBudgetThresholds;
	templateId: string;
	templateVersion: string;
	flags: RiskFlag[];
	overallSeverity: RiskSeverity;
	summary: string;
}

export interface RiskBudgetMonitorEnvelope {
	riskMonitorId: string;
	riskMonitor: RiskBudgetMonitor;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface ClientReviewPacket {
	headline: string;
	keyUpdates: string[];
	riskAlerts: string[];
	recommendedActions: string[];
	clientQuestions: string[];
	disclaimer: string;
}

export interface ClientReviewPacketEnvelope {
	reviewPacketId: string;
	reviewPacket: ClientReviewPacket;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface AdvisoryDecisionLog {
	decisionSummary: string;
	recommendation: string;
	evidence: string[];
	constraints: string[];
	relatedArtifactIds: string[];
	disclaimer: string;
	loggedAt: number;
}

export interface AdvisoryDecisionLogEnvelope {
	decisionLogId: string;
	decisionLog: AdvisoryDecisionLog;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface AdvisorySummary {
	generatedAt: number;
	coverage: AdvisoryCoverage;
	warnings: string[];
	audit?: AdvisoryAuditEnvelope;
	client: {
		clientLabel?: string;
		riskTier?: RiskProfileTier;
		investmentHorizon?: InvestmentHorizon;
		goalLabels: string[];
	};
	policy?: {
		targetReturnRangePct: RangePct;
		maxAcceptableDrawdownPct: number;
		cashTargetRangePct: RangePct;
		singlePositionMaxPct: number;
		sectorMaxPct: number;
		rebalanceFrequency: InvestmentPolicyStatement["rebalanceFrequency"];
	};
	monitoring: {
		riskSeverity?: RiskSeverity;
		riskFlagCount: number;
		riskTemplateId?: string;
		riskTemplateVersion?: string;
		driftBreachCount: number;
		worstStressScenario?: string;
		worstStressLossPct?: number;
	};
	actions: {
		priorityActions: string[];
		clientActions: string[];
	};
	compliance: {
		disclaimer: string;
		decisionLogId?: string;
		evidenceSummary: string[];
	};
}

export interface AdvisoryAuditEnvelope {
	runId: string;
	workflow: "agent" | "onboarding" | "operations" | "symbol-advice";
	generatedAt: number;
	coverage: AdvisoryCoverage;
	warningsCount: number;
	templateId?: string;
	templateVersion?: string;
	artifactIds: string[];
}

export interface AdvisorySummaryInput {
	profile?: InvestorProfile | InvestorProfileEnvelope;
	goals?: ClientGoals | ClientGoalsEnvelope;
	ips?: InvestmentPolicyStatement | InvestmentPolicyStatementEnvelope;
	portfolioReview?: PortfolioReview | PortfolioReviewEnvelope;
	stressTest?: PortfolioStressTest | PortfolioStressTestEnvelope;
	rebalancePlan?: RebalancePlan | RebalancePlanEnvelope;
	driftReport?: PortfolioDriftReport | PortfolioDriftReportEnvelope;
	riskMonitor?: RiskBudgetMonitor | RiskBudgetMonitorEnvelope;
	reviewPacket?: ClientReviewPacket | ClientReviewPacketEnvelope;
	decisionLog?: AdvisoryDecisionLog | AdvisoryDecisionLogEnvelope;
	audit?: {
		runId?: string;
		workflow?: "agent" | "onboarding" | "operations" | "symbol-advice";
		artifactIds?: string[];
	};
}

export interface AdvisorySummaryEnvelope {
	summaryId: string;
	summary: AdvisorySummary;
	coverage: AdvisoryCoverage;
	warnings: string[];
	updatedAt: number;
}

export interface AdvisoryAnalysisContext {
	analysisId: string;
	market: FinanceMarketData;
	indicators: FinanceIndicatorData;
	report: AnalysisReport;
}

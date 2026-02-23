import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { normalizeInvestorProfile, normalizePortfolioSnapshot } from "../advisory/profile.js";
import { buildRiskBudgetMonitor } from "../advisory/risk-monitor.js";
import {
	investorProfileSchema,
	portfolioSnapshotSchema,
	riskProfileTierSchema,
	riskThresholdTemplateSchema,
	targetPolicySchema,
} from "../advisory/schemas.js";
import type { RiskBudgetMonitorEnvelope, RiskThresholdTemplate } from "../advisory/types.js";
import { resolveAnalysisContext, resolvePortfolioInput, resolveProfileInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";
import type { FinanceWorkflowStore } from "./workflow-store.js";

const monitorRiskBudgetParameters = Type.Object({
	riskTier: Type.Optional(riskProfileTierSchema),
	profileId: Type.Optional(Type.String()),
	profile: Type.Optional(investorProfileSchema),
	portfolioId: Type.Optional(Type.String()),
	portfolio: Type.Optional(portfolioSnapshotSchema),
	analysisId: Type.Optional(Type.String()),
	stressTestId: Type.Optional(Type.String()),
	targetPolicy: Type.Optional(targetPolicySchema),
	riskTemplate: Type.Optional(riskThresholdTemplateSchema),
});

type MonitorRiskBudgetParams = Static<typeof monitorRiskBudgetParameters>;

export type FinanceMonitorRiskBudgetDetails = RiskBudgetMonitorEnvelope;

export interface CreateFinanceMonitorRiskBudgetToolOptions {
	workflowStore: FinanceWorkflowStore;
	advisoryStore: FinanceAdvisoryStore;
	defaultRiskTemplate?: RiskThresholdTemplate;
}

export function createFinanceMonitorRiskBudgetTool(
	options: CreateFinanceMonitorRiskBudgetToolOptions,
): AgentTool<typeof monitorRiskBudgetParameters, FinanceMonitorRiskBudgetDetails> {
	return {
		name: "finance_monitor_risk_budget",
		label: "Finance Monitor Risk Budget",
		description: "Monitor risk-budget breaches using conservative/moderate/aggressive built-in thresholds.",
		parameters: monitorRiskBudgetParameters,
		execute: async (_toolCallId: string, params: MonitorRiskBudgetParams) => {
			const resolvedPortfolio = resolvePortfolioInput(options.advisoryStore, {
				portfolio: params.portfolio ? normalizePortfolioSnapshot(params.portfolio) : undefined,
				portfolioId: params.portfolioId,
			});

			const resolvedProfile =
				params.profile || params.profileId
					? resolveProfileInput(options.advisoryStore, {
							profile: params.profile ? normalizeInvestorProfile(params.profile) : undefined,
							profileId: params.profileId,
						})
					: undefined;

			const riskTier = params.riskTier ?? resolvedProfile?.profile.riskTolerance ?? "moderate";
			const analysis = params.analysisId
				? resolveAnalysisContext(options.workflowStore, params.analysisId)
				: undefined;
			const stressTest = params.stressTestId
				? options.advisoryStore.getStressTestOrThrow(params.stressTestId).stressTest
				: undefined;

			const built = buildRiskBudgetMonitor({
				riskTier,
				portfolio: resolvedPortfolio.portfolio,
				analysis,
				stressTest,
				targetPolicy: params.targetPolicy,
				riskTemplate: params.riskTemplate ?? options.defaultRiskTemplate,
			});

			const envelope = options.advisoryStore.saveRiskMonitor(built.riskMonitor, built.coverage, built.warnings);

			return {
				content: [
					{
						type: "text",
						text:
							`Risk monitor completed (riskMonitorId=${envelope.riskMonitorId}) ` +
							`tier=${envelope.riskMonitor.riskTier}, severity=${envelope.riskMonitor.overallSeverity}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

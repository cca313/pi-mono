import { randomUUID } from "node:crypto";
import { buildAdvisorySummary } from "../advisory/advisory-summary.js";
import { normalizeClientGoals } from "../advisory/goals.js";
import { buildInvestmentPolicyStatement } from "../advisory/ips.js";
import { normalizeInvestorProfile, normalizePortfolioSnapshot } from "../advisory/profile.js";
import type {
	AdvisorySummary,
	ClientGoals,
	ClientGoalsEnvelope,
	InvestmentPolicyStatementEnvelope,
	InvestorProfile,
	InvestorProfileEnvelope,
	PortfolioSnapshot,
	PortfolioSnapshotEnvelope,
} from "../advisory/types.js";

export interface RunClientOnboardingWorkflowInput {
	profile: InvestorProfile;
	goals: ClientGoals;
	portfolio?: PortfolioSnapshot;
}

export interface RunClientOnboardingWorkflowResult {
	profile: InvestorProfileEnvelope;
	goals: ClientGoalsEnvelope;
	ips: InvestmentPolicyStatementEnvelope;
	portfolio?: PortfolioSnapshotEnvelope;
	summary: AdvisorySummary;
}

export async function runClientOnboardingWorkflow(
	input: RunClientOnboardingWorkflowInput,
): Promise<RunClientOnboardingWorkflowResult> {
	const runId = randomUUID();
	const profile = normalizeInvestorProfile(input.profile);
	const profileEnvelope: InvestorProfileEnvelope = {
		profileId: randomUUID(),
		profile,
		coverage: "full",
		warnings: [],
		updatedAt: Date.now(),
	};

	const normalizedGoals = normalizeClientGoals(input.goals);
	const goalsEnvelope: ClientGoalsEnvelope = {
		goalsId: randomUUID(),
		goals: normalizedGoals.goals,
		coverage: normalizedGoals.coverage,
		warnings: normalizedGoals.warnings,
		updatedAt: Date.now(),
	};

	const normalizedPortfolio = input.portfolio ? normalizePortfolioSnapshot(input.portfolio) : undefined;
	const builtIps = buildInvestmentPolicyStatement({
		profile,
		goals: normalizedGoals.goals,
		portfolio: normalizedPortfolio,
	});
	const ipsEnvelope: InvestmentPolicyStatementEnvelope = {
		ipsId: randomUUID(),
		ips: builtIps.ips,
		coverage: builtIps.coverage,
		warnings: builtIps.warnings,
		updatedAt: Date.now(),
	};

	const portfolioEnvelope = normalizedPortfolio
		? {
				portfolioId: randomUUID(),
				portfolio: normalizedPortfolio,
				coverage: "full" as const,
				warnings: [],
				updatedAt: Date.now(),
			}
		: undefined;

	const summary = buildAdvisorySummary({
		profile: profileEnvelope,
		goals: goalsEnvelope,
		ips: ipsEnvelope,
		audit: {
			runId,
			workflow: "onboarding",
			artifactIds: [profileEnvelope.profileId, goalsEnvelope.goalsId, ipsEnvelope.ipsId],
		},
	});

	return {
		profile: profileEnvelope,
		goals: goalsEnvelope,
		ips: ipsEnvelope,
		portfolio: portfolioEnvelope,
		summary,
	};
}

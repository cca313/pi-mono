import { randomUUID } from "node:crypto";
import { buildPortfolioReview } from "../advisory/portfolio-review.js";
import { normalizeInvestorProfile, normalizePortfolioSnapshot } from "../advisory/profile.js";
import { buildRebalancePlan } from "../advisory/rebalance.js";
import { buildPortfolioStressTest } from "../advisory/stress-test.js";
import type {
	BenchmarkPolicy,
	InvestorProfile,
	PortfolioReviewEnvelope,
	PortfolioSnapshot,
	PortfolioStressScenario,
	PortfolioStressTestEnvelope,
	RebalanceConstraints,
	RebalancePlanEnvelope,
	TargetPolicy,
} from "../advisory/types.js";

export interface RunPortfolioAdvisorWorkflowInput {
	profile: InvestorProfile;
	portfolio: PortfolioSnapshot;
	benchmarkPolicy?: BenchmarkPolicy;
	scenarios?: PortfolioStressScenario[];
	targetPolicy?: TargetPolicy;
	rebalanceConstraints?: RebalanceConstraints;
}

export interface RunPortfolioAdvisorWorkflowResult {
	profile: InvestorProfile;
	portfolio: PortfolioSnapshot;
	portfolioReview: PortfolioReviewEnvelope;
	stressTest: PortfolioStressTestEnvelope;
	rebalancePlan: RebalancePlanEnvelope;
}

export async function runPortfolioAdvisorWorkflow(
	input: RunPortfolioAdvisorWorkflowInput,
): Promise<RunPortfolioAdvisorWorkflowResult> {
	const profile = normalizeInvestorProfile(input.profile);
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
		rebalanceConstraints: input.rebalanceConstraints,
	});
	const rebalancePlan: RebalancePlanEnvelope = {
		rebalancePlanId: randomUUID(),
		rebalancePlan: rebalanceBuilt.rebalancePlan,
		coverage: rebalanceBuilt.coverage,
		warnings: rebalanceBuilt.warnings,
		updatedAt: Date.now(),
	};

	return {
		profile,
		portfolio,
		portfolioReview,
		stressTest,
		rebalancePlan,
	};
}

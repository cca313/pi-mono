import type {
	AdvisoryCoverage,
	ClientGoals,
	ClientReviewPacket,
	PortfolioDriftReport,
	PortfolioReview,
	PortfolioStressTest,
	RebalancePlan,
	RiskBudgetMonitor,
} from "./types.js";

export interface BuildClientReviewPacketInput {
	clientLabel?: string;
	goals?: ClientGoals;
	portfolioReview?: PortfolioReview;
	stressTest?: PortfolioStressTest;
	rebalancePlan?: RebalancePlan;
	driftReport?: PortfolioDriftReport;
	riskMonitor?: RiskBudgetMonitor;
}

export interface BuildClientReviewPacketOutput {
	reviewPacket: ClientReviewPacket;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

export function buildClientReviewPacket(input: BuildClientReviewPacketInput): BuildClientReviewPacketOutput {
	const warnings: string[] = [];
	const keyUpdates: string[] = [];
	const riskAlerts: string[] = [];
	const recommendedActions: string[] = [];
	const clientQuestions: string[] = [];

	if (input.goals) {
		keyUpdates.push(`Tracking ${input.goals.goals.length} active financial goal(s).`);
	}

	if (input.portfolioReview) {
		keyUpdates.push(input.portfolioReview.summary);
		recommendedActions.push(...input.portfolioReview.priorityActions.slice(0, 3));
		riskAlerts.push(...input.portfolioReview.restrictionViolations.slice(0, 2));
	}

	if (input.stressTest) {
		riskAlerts.push(
			`Worst stress scenario: ${input.stressTest.worstScenario.name} (${input.stressTest.worstScenario.estimatedPortfolioChangePct.toFixed(1)}%).`,
		);
	}

	if (input.riskMonitor) {
		riskAlerts.push(
			...input.riskMonitor.flags
				.filter((flag) => flag.severity !== "info")
				.map((flag) => flag.message)
				.slice(0, 3),
		);
	}

	if (input.driftReport) {
		recommendedActions.push(
			...input.driftReport.priorityQueue.slice(0, 3).map((item) => `${item.action.toUpperCase()}: ${item.reason}`),
		);
	}

	if (input.rebalancePlan) {
		recommendedActions.push(...input.rebalancePlan.executionConditions.slice(0, 2));
	}

	if (!input.portfolioReview) {
		warnings.push("Portfolio review missing; packet may omit concentration and liquidity context.");
	}
	if (!input.stressTest) {
		warnings.push("Stress test missing; packet may understate downside scenarios.");
	}

	clientQuestions.push("Have your income/liquidity needs changed since the last review?");
	clientQuestions.push("Any restrictions or tax considerations to update before rebalancing?");
	clientQuestions.push("Do current goals and time horizon remain accurate?");

	if (riskAlerts.length === 0) {
		riskAlerts.push("No new critical risk alerts from current monitoring inputs.");
	}
	if (recommendedActions.length === 0) {
		recommendedActions.push("Continue monitoring with no immediate rebalance trigger.");
	}

	const clientName = input.clientLabel?.trim() || "Client";

	return {
		reviewPacket: {
			headline: `${clientName} review packet: ${riskAlerts.length} risk alert(s), ${recommendedActions.length} action item(s).`,
			keyUpdates,
			riskAlerts,
			recommendedActions,
			clientQuestions,
			disclaimer: "For research and educational purposes only, not investment advice.",
		},
		coverage: warnings.length > 0 ? "partial" : "full",
		warnings,
	};
}

import { flattenPortfolioPositions, getPortfolioTotalValue } from "./profile.js";
import type {
	AdvisoryCoverage,
	PortfolioSnapshot,
	PortfolioStressScenario,
	PortfolioStressScenarioResult,
	PortfolioStressTest,
	StressContributor,
	StressShock,
} from "./types.js";

export interface BuildStressTestInput {
	portfolio: PortfolioSnapshot;
	scenarios?: PortfolioStressScenario[];
}

export interface BuildStressTestOutput {
	stressTest: PortfolioStressTest;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function getDefaultScenarios(portfolio: PortfolioSnapshot): PortfolioStressScenario[] {
	const positions = flattenPortfolioPositions(portfolio);
	const largest = [...positions].sort((a, b) => b.marketValue - a.marketValue)[0];

	return [
		{ name: "market_down_10", shocks: [{ targetType: "market-bucket", target: "all", pctChange: -10 }] },
		{ name: "market_down_20", shocks: [{ targetType: "market-bucket", target: "all", pctChange: -20 }] },
		{
			name: "tech_drawdown_25",
			shocks: [
				{ targetType: "sector", target: "Technology", pctChange: -25 },
				{ targetType: "market-bucket", target: "all", pctChange: -8 },
			],
		},
		{
			name: "rates_up_rotation",
			shocks: [
				{ targetType: "sector", target: "Technology", pctChange: -12 },
				{ targetType: "sector", target: "Utilities", pctChange: 4 },
				{ targetType: "market-bucket", target: "all", pctChange: -5 },
			],
		},
		{
			name: "single_position_gap_down_15",
			shocks: largest
				? [{ targetType: "symbol", target: largest.symbol, pctChange: -15 }]
				: [{ targetType: "market-bucket", target: "all", pctChange: -5 }],
		},
	];
}

function aggregateShockPct(position: { symbol: string; sector?: string }, shocks: StressShock[]): number {
	let pct = 0;
	for (const shock of shocks) {
		if (shock.targetType === "market-bucket" && shock.target.toLowerCase() === "all") {
			pct += shock.pctChange;
			continue;
		}

		if (shock.targetType === "symbol" && shock.target.toUpperCase() === position.symbol.toUpperCase()) {
			pct += shock.pctChange;
			continue;
		}

		if (shock.targetType === "sector" && shock.target.toLowerCase() === (position.sector ?? "").toLowerCase()) {
			pct += shock.pctChange;
		}
	}

	return Math.max(pct, -95);
}

function buildScenarioResult(
	portfolio: PortfolioSnapshot,
	scenario: PortfolioStressScenario,
): PortfolioStressScenarioResult {
	const positions = flattenPortfolioPositions(portfolio);
	const totalValue = getPortfolioTotalValue(portfolio);
	const contributors: StressContributor[] = [];
	let estimatedPnl = 0;

	for (const position of positions) {
		const shockPct = aggregateShockPct(position, scenario.shocks);
		if (shockPct === 0) {
			continue;
		}

		const pnl = position.marketValue * (shockPct / 100);
		estimatedPnl += pnl;
		contributors.push({
			symbol: position.symbol,
			accountId: position.accountId,
			estimatedPnl: pnl,
		});
	}

	const topLossContributors = contributors.sort((a, b) => a.estimatedPnl - b.estimatedPnl).slice(0, 3);
	const estimatedPortfolioChangePct = totalValue > 0 ? (estimatedPnl / totalValue) * 100 : 0;

	return {
		name: scenario.name,
		estimatedPortfolioChangePct,
		estimatedPnl,
		topLossContributors,
	};
}

export function buildPortfolioStressTest(input: BuildStressTestInput): BuildStressTestOutput {
	const scenarios =
		input.scenarios && input.scenarios.length > 0 ? input.scenarios : getDefaultScenarios(input.portfolio);
	const warnings: string[] = [];

	if (scenarios.some((scenario) => scenario.name === "rates_up_rotation")) {
		warnings.push("rates_up_rotation uses simplified sector shocks (placeholder methodology).");
	}

	const scenarioResults = scenarios.map((scenario) => buildScenarioResult(input.portfolio, scenario));
	const fallbackWorst: PortfolioStressScenarioResult = {
		name: "none",
		estimatedPortfolioChangePct: 0,
		estimatedPnl: 0,
		topLossContributors: [],
	};
	const worstScenario =
		[...scenarioResults].sort((a, b) => a.estimatedPortfolioChangePct - b.estimatedPortfolioChangePct)[0] ??
		fallbackWorst;

	const keyVulnerabilities = [...new Set(worstScenario.topLossContributors.map((item) => item.symbol))].map(
		(symbol) => `${symbol} is a major contributor in the worst stress scenario (${worstScenario.name}).`,
	);

	return {
		stressTest: {
			scenarioResults,
			worstScenario,
			keyVulnerabilities,
		},
		coverage: "full",
		warnings,
	};
}

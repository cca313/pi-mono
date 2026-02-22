import {
	flattenPortfolioPositions,
	getPortfolioCashValue,
	getPortfolioMarketValue,
	getPortfolioTotalValue,
} from "./profile.js";
import type {
	AdvisoryCoverage,
	BenchmarkPolicy,
	InvestorProfile,
	PortfolioReview,
	PortfolioSnapshot,
} from "./types.js";

export interface BuildPortfolioReviewInput {
	portfolio: PortfolioSnapshot;
	profile?: InvestorProfile;
	benchmarkPolicy?: BenchmarkPolicy;
}

export interface BuildPortfolioReviewOutput {
	portfolioReview: PortfolioReview;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function formatPct(value: number): string {
	return `${value.toFixed(1)}%`;
}

export function buildPortfolioReview(input: BuildPortfolioReviewInput): BuildPortfolioReviewOutput {
	const warnings: string[] = [];
	const concentrationFindings: string[] = [];
	const diversificationFindings: string[] = [];
	const liquidityFindings: string[] = [];
	const restrictionViolations: string[] = [];
	const taxWarnings: string[] = [];
	const priorityActions: string[] = [];

	const portfolio = input.portfolio;
	const positions = flattenPortfolioPositions(portfolio);
	const totalValue = getPortfolioTotalValue(portfolio);
	const marketValue = getPortfolioMarketValue(portfolio);
	const cashPct = totalValue > 0 ? (getPortfolioCashValue(portfolio) / totalValue) * 100 : 0;

	const singlePositionMaxPct = input.benchmarkPolicy?.singlePositionMaxPct ?? 20;
	const sectorMaxPct = input.benchmarkPolicy?.sectorMaxPct ?? 35;
	const minCashPct = input.benchmarkPolicy?.minCashPct ?? 2;
	const maxCashPct = input.benchmarkPolicy?.maxCashPct ?? 30;

	const symbolWeights = new Map<string, number>();
	const sectorWeights = new Map<string, number>();
	for (const position of positions) {
		const weightPct = totalValue > 0 ? (position.marketValue / totalValue) * 100 : 0;
		symbolWeights.set(position.symbol, (symbolWeights.get(position.symbol) ?? 0) + weightPct);
		const sectorKey = position.sector?.trim() || "Unknown";
		sectorWeights.set(sectorKey, (sectorWeights.get(sectorKey) ?? 0) + weightPct);

		if (weightPct > singlePositionMaxPct) {
			concentrationFindings.push(
				`${position.symbol} in account ${position.accountId} is ${formatPct(weightPct)} of portfolio (limit ${formatPct(singlePositionMaxPct)}).`,
			);
		}

		if (position.accountType === "taxable" && position.taxLots?.length) {
			const now = Date.now();
			const hasShortTermLots = position.taxLots.some((lot) => now - lot.acquiredAt < 365 * 24 * 60 * 60 * 1000);
			if (hasShortTermLots) {
				taxWarnings.push(`${position.symbol} has short-term tax lots in taxable account ${position.accountId}.`);
			}
		}
	}

	for (const [sector, weightPct] of sectorWeights) {
		if (weightPct > sectorMaxPct) {
			diversificationFindings.push(
				`Sector concentration in ${sector} is ${formatPct(weightPct)} (policy max ${formatPct(sectorMaxPct)}).`,
			);
		}
	}

	if (symbolWeights.size < 5) {
		diversificationFindings.push(`Portfolio has ${symbolWeights.size} symbols; diversification may be limited.`);
	}

	if (cashPct < minCashPct) {
		liquidityFindings.push(`Cash allocation ${formatPct(cashPct)} is below minimum ${formatPct(minCashPct)}.`);
	}

	if (cashPct > maxCashPct) {
		liquidityFindings.push(
			`Cash allocation ${formatPct(cashPct)} is above maximum ${formatPct(maxCashPct)} and may drag returns.`,
		);
	}

	for (const account of portfolio.accounts) {
		for (const restriction of account.restrictions ?? []) {
			if (restriction.kind === "no-buy" && (restriction.value?.trim().length ?? 0) > 0) {
				restrictionViolations.push(
					`Account ${account.accountId} has no-buy restriction for ${restriction.value}; ensure rebalance suggestions exclude it.`,
				);
			}
		}
	}

	for (const restriction of input.profile?.restrictions ?? []) {
		if (restriction.kind === "sector-ban" && restriction.value) {
			const bannedSector = restriction.value.trim();
			const sectorWeight = sectorWeights.get(bannedSector) ?? 0;
			if (sectorWeight > 0) {
				restrictionViolations.push(
					`Profile restricts sector ${bannedSector}, but current allocation is ${formatPct(sectorWeight)}.`,
				);
			}
		}
	}

	if (concentrationFindings.length > 0) {
		priorityActions.push("Reduce single-name concentration that exceeds policy limits.");
	}
	if (diversificationFindings.length > 0) {
		priorityActions.push("Broaden diversification across sectors and symbols.");
	}
	if (liquidityFindings.length > 0) {
		priorityActions.push("Adjust cash allocation toward target range.");
	}
	if (restrictionViolations.length > 0) {
		priorityActions.push("Resolve restriction conflicts before executing new trades.");
	}
	if (taxWarnings.length > 0) {
		priorityActions.push("Review tax-lot timing before trims in taxable accounts.");
	}

	if (marketValue <= 0) {
		warnings.push("Portfolio market value is zero or missing; review is based on cash and provided values only.");
	}

	return {
		portfolioReview: {
			summary:
				`Portfolio review completed for ${portfolio.accounts.length} account(s), ` +
				`${positions.length} position(s), total value ${totalValue.toFixed(2)} ${portfolio.baseCurrency}.`,
			concentrationFindings,
			diversificationFindings,
			liquidityFindings,
			restrictionViolations,
			taxWarnings,
			priorityActions,
		},
		coverage: "full",
		warnings,
	};
}

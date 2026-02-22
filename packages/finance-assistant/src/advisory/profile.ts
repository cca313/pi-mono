import type {
	InvestorProfile,
	InvestorRestriction,
	PortfolioAccount,
	PortfolioFees,
	PortfolioPosition,
	PortfolioSnapshot,
	PortfolioTaxLot,
} from "./types.js";

type PortfolioPositionInput = Omit<PortfolioPosition, "marketValue"> & { marketValue?: number };
type PortfolioAccountInput = Omit<PortfolioAccount, "positions" | "fees" | "restrictions"> & {
	fees?: PortfolioFees;
	restrictions?: InvestorRestriction[];
	positions: PortfolioPositionInput[];
};
type PortfolioSnapshotInput = Omit<PortfolioSnapshot, "baseCurrency" | "accounts"> & {
	baseCurrency?: string;
	accounts: PortfolioAccountInput[];
};

export interface FlattenedPortfolioPosition extends PortfolioPosition {
	accountId: string;
	accountType: PortfolioSnapshot["accounts"][number]["accountType"];
}

function normalizeSymbol(symbol: string): string {
	return symbol.trim().toUpperCase();
}

function normalizeLot(lot: PortfolioTaxLot): PortfolioTaxLot {
	return {
		lotId: lot.lotId,
		quantity: lot.quantity,
		costBasisPerShare: lot.costBasisPerShare,
		acquiredAt: lot.acquiredAt,
	};
}

function normalizePosition(
	position: Omit<PortfolioPosition, "marketValue"> & { marketValue?: number },
): PortfolioPosition {
	const lastPrice = position.lastPrice;
	const derivedMarketValue =
		typeof position.marketValue === "number"
			? position.marketValue
			: typeof lastPrice === "number"
				? position.quantity * lastPrice
				: 0;

	return {
		symbol: normalizeSymbol(position.symbol),
		quantity: position.quantity,
		lastPrice,
		marketValue: derivedMarketValue,
		avgCost: position.avgCost,
		sector: position.sector?.trim(),
		targetWeight: position.targetWeight,
		maxWeight: position.maxWeight,
		taxLots: position.taxLots?.map(normalizeLot),
	};
}

export function normalizeInvestorProfile(profile: InvestorProfile): InvestorProfile {
	return {
		...profile,
		clientLabel: profile.clientLabel?.trim() || undefined,
		objectives: [...new Set(profile.objectives)],
		accountTypes: profile.accountTypes ? [...new Set(profile.accountTypes)] : undefined,
		restrictions: profile.restrictions?.map((restriction) => ({
			kind: restriction.kind.trim(),
			value: restriction.value?.trim(),
			note: restriction.note?.trim(),
		})),
		notes: profile.notes?.trim(),
	};
}

export function normalizePortfolioSnapshot(portfolio: PortfolioSnapshotInput): PortfolioSnapshot {
	return {
		asOf: portfolio.asOf,
		baseCurrency: (portfolio.baseCurrency || "USD").toUpperCase(),
		accounts: portfolio.accounts.map((account) => ({
			accountId: account.accountId,
			accountType: account.accountType,
			cashBalance: account.cashBalance,
			fees: account.fees ? { ...account.fees } : undefined,
			restrictions: account.restrictions?.map((restriction) => ({ ...restriction })),
			positions: account.positions.map((position) => normalizePosition(position)),
		})),
	};
}

export function flattenPortfolioPositions(portfolio: PortfolioSnapshot): FlattenedPortfolioPosition[] {
	const flattened: FlattenedPortfolioPosition[] = [];
	for (const account of portfolio.accounts) {
		for (const position of account.positions) {
			flattened.push({
				...position,
				accountId: account.accountId,
				accountType: account.accountType,
			});
		}
	}

	return flattened;
}

export function getPortfolioMarketValue(portfolio: PortfolioSnapshot): number {
	let total = 0;
	for (const account of portfolio.accounts) {
		for (const position of account.positions) {
			total += position.marketValue;
		}
	}

	return total;
}

export function getPortfolioCashValue(portfolio: PortfolioSnapshot): number {
	let total = 0;
	for (const account of portfolio.accounts) {
		total += account.cashBalance;
	}
	return total;
}

export function getPortfolioTotalValue(portfolio: PortfolioSnapshot): number {
	return getPortfolioMarketValue(portfolio) + getPortfolioCashValue(portfolio);
}

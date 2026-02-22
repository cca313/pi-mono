import type { FundamentalsRequest, FundamentalsSection, FundamentalsSnapshot } from "../providers/types.js";
import type {
	FundamentalsFieldKind,
	FundamentalsFieldMetadata,
	FundamentalsFieldMetadataMap,
	NormalizedFundamentalsSnapshot,
} from "./types.js";

type SourceFieldRecord = Record<string, number | string | null>;

interface NormalizationRule {
	canonicalField: string;
	sourceFields: string[];
	kind: FundamentalsFieldKind;
	normalizedUnit: "fraction" | "raw";
	normalize?: (value: number) => number;
	note?: string;
}

interface NormalizeFundamentalsInput {
	fundamentals: FundamentalsSnapshot;
	sourceProvider: string;
	requestedSections?: FundamentalsRequest["requestedSections"];
}

export interface NormalizeFundamentalsOutput {
	fundamentalsNormalized: NormalizedFundamentalsSnapshot;
	fundamentalsFieldMetadata: FundamentalsFieldMetadataMap;
}

function normalizePercentLikeToFraction(value: number): number {
	if (Number.isFinite(value) && Math.abs(value) > 1 && Math.abs(value) <= 100) {
		return value / 100;
	}

	return value;
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function getNumericField(
	record: SourceFieldRecord | undefined,
	keys: string[],
): { value: number; sourceField: string } | undefined {
	if (!record) {
		return undefined;
	}

	for (const key of keys) {
		const candidate = record[key];
		if (isFiniteNumber(candidate)) {
			return { value: candidate, sourceField: key };
		}
	}

	return undefined;
}

function buildMetadata(
	rule: NormalizationRule,
	sourceProvider: string,
	sourceField: string,
): FundamentalsFieldMetadata {
	return {
		canonicalField: rule.canonicalField,
		sourceField,
		sourceProvider,
		kind: rule.kind,
		normalizedUnit: rule.normalizedUnit,
		note: rule.note,
	};
}

const COMMON_RULES: Partial<Record<FundamentalsSection, NormalizationRule[]>> = {
	valuation: [
		{
			canonicalField: "peRatio",
			sourceFields: ["peRatio", "peTTM", "trailingPE"],
			kind: "multiple",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "forwardPeRatio",
			sourceFields: ["forwardPE"],
			kind: "multiple",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "priceToSales",
			sourceFields: ["priceToSalesRatioTTM", "psTTM", "priceToSalesTrailing12Months"],
			kind: "multiple",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "priceToBook",
			sourceFields: ["priceToBookRatio", "pbQuarterly", "priceToBook"],
			kind: "multiple",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "marketCap",
			sourceFields: ["marketCapitalization", "marketCap"],
			kind: "currency",
			normalizedUnit: "raw",
		},
	],
	profitability: [
		{
			canonicalField: "grossMargin",
			sourceFields: ["grossMarginTTM", "grossMargins"],
			kind: "fraction",
			normalizedUnit: "fraction",
			normalize: normalizePercentLikeToFraction,
		},
		{
			canonicalField: "profitMargin",
			sourceFields: ["netMargin", "profitMargin", "profitMargins"],
			kind: "fraction",
			normalizedUnit: "fraction",
			normalize: normalizePercentLikeToFraction,
		},
		{
			canonicalField: "operatingMargin",
			sourceFields: ["operatingMarginTTM", "operatingMargins"],
			kind: "fraction",
			normalizedUnit: "fraction",
			normalize: normalizePercentLikeToFraction,
		},
		{
			canonicalField: "returnOnAssets",
			sourceFields: ["roaTTM", "returnOnAssets", "returnOnAssetsTTM"],
			kind: "fraction",
			normalizedUnit: "fraction",
			normalize: normalizePercentLikeToFraction,
		},
		{
			canonicalField: "returnOnEquity",
			sourceFields: ["roeTTM", "returnOnEquity", "returnOnEquityTTM"],
			kind: "fraction",
			normalizedUnit: "fraction",
			normalize: normalizePercentLikeToFraction,
		},
	],
	growth: [
		{
			canonicalField: "revenueGrowth",
			sourceFields: ["revenueGrowth", "revenueGrowth3Y", "quarterlyRevenueGrowthYOY"],
			kind: "fraction",
			normalizedUnit: "fraction",
			normalize: normalizePercentLikeToFraction,
		},
		{
			canonicalField: "earningsGrowth",
			sourceFields: ["earningsGrowth", "epsGrowth5Y", "epsGrowthQuarterlyYoy", "quarterlyEarningsGrowthYOY"],
			kind: "fraction",
			normalizedUnit: "fraction",
			normalize: normalizePercentLikeToFraction,
		},
	],
	"balance-sheet": [
		{
			canonicalField: "debtToEquity",
			sourceFields: ["debtToEquity", "totalDebtToEquityAnnual", "totalDebtToEquityQuarterly"],
			kind: "ratio",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "currentRatio",
			sourceFields: ["currentRatioQuarterly", "currentRatio"],
			kind: "ratio",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "bookValuePerShare",
			sourceFields: ["bookValuePerShareAnnual", "bookValue"],
			kind: "currency",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "totalDebt",
			sourceFields: ["totalDebt"],
			kind: "currency",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "totalCash",
			sourceFields: ["totalCash"],
			kind: "currency",
			normalizedUnit: "raw",
		},
		{
			canonicalField: "eps",
			sourceFields: ["eps", "EPS"],
			kind: "currency",
			normalizedUnit: "raw",
		},
	],
};

function normalizeSection(
	section: FundamentalsSection,
	record: SourceFieldRecord | undefined,
	sourceProvider: string,
): { normalized: Record<string, number>; metadata: Record<string, FundamentalsFieldMetadata> } | undefined {
	const rules = COMMON_RULES[section];
	if (!rules || !record) {
		return undefined;
	}

	const normalized: Record<string, number> = {};
	const metadata: Record<string, FundamentalsFieldMetadata> = {};

	for (const rule of rules) {
		const match = getNumericField(record, rule.sourceFields);
		if (!match) {
			continue;
		}

		const value = rule.normalize ? rule.normalize(match.value) : match.value;
		normalized[rule.canonicalField] = value;
		metadata[rule.canonicalField] = buildMetadata(rule, sourceProvider, match.sourceField);
	}

	if (Object.keys(normalized).length === 0) {
		return undefined;
	}

	return { normalized, metadata };
}

function normalizeProviderName(name: string): string {
	return name.trim().toLowerCase();
}

export function normalizeFundamentalsSnapshot(input: NormalizeFundamentalsInput): NormalizeFundamentalsOutput {
	const sourceProvider = normalizeProviderName(input.sourceProvider);
	const requestedSections =
		input.requestedSections ?? (Object.keys(input.fundamentals.sections) as FundamentalsSection[]);

	const normalizedSections: NormalizedFundamentalsSnapshot["sections"] = {};
	const fundamentalsFieldMetadata: FundamentalsFieldMetadataMap = {};

	for (const section of requestedSections) {
		const record = input.fundamentals.sections[section];
		const result = normalizeSection(section, record, sourceProvider);
		if (!result) {
			continue;
		}

		normalizedSections[section] = result.normalized;
		fundamentalsFieldMetadata[section] = result.metadata;
	}

	return {
		fundamentalsNormalized: {
			symbol: input.fundamentals.symbol,
			asOf: input.fundamentals.asOf,
			sections: normalizedSections,
		},
		fundamentalsFieldMetadata,
	};
}

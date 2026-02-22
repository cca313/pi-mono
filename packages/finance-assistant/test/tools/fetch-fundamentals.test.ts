import { describe, expect, test } from "vitest";
import type { FinanceDataProvider } from "../../src/providers/types.js";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceFetchFundamentalsTool } from "../../src/tools/fetch-fundamentals.js";

function createNotImplementedProvider(name: string): FinanceDataProvider {
	return {
		name,
		getCandles: async () => [],
		getFundamentals: async () => {
			throw new Error("NOT_IMPLEMENTED fundamentals provider not implemented yet");
		},
	};
}

function createFundamentalsProvider(
	name: string,
	sections: Record<string, Record<string, number>>,
): FinanceDataProvider {
	return {
		name,
		getCandles: async () => [],
		getFundamentals: async (request) => ({
			symbol: request.symbol.toUpperCase(),
			asOf: Date.now(),
			sections,
		}),
	};
}

describe("finance_fetch_fundamentals tool", () => {
	test("returns placeholder coverage when all providers are unavailable and placeholder is allowed", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceFetchFundamentalsTool({
			store,
			providers: [createNotImplementedProvider("finnhub"), createNotImplementedProvider("yahoo")],
		});

		const result = await tool.execute("tool-call-1", { symbol: "AAPL" });
		expect(result.details.coverage).toBe("placeholder");
		expect(result.details.fundamentals).toBeNull();
		expect(result.details.fundamentalsNormalized).toBeNull();
		expect(result.details.fundamentalsFieldMetadata).toEqual({});
		expect(result.details.missingSections.length).toBeGreaterThan(0);
	});

	test("throws when placeholder is disabled and all providers fail", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceFetchFundamentalsTool({
			store,
			providers: [createNotImplementedProvider("alpha-vantage")],
		});

		await expect(
			tool.execute("tool-call-2", {
				symbol: "MSFT",
				allowPlaceholder: false,
			}),
		).rejects.toMatchObject({ code: "FUNDAMENTALS_PROVIDERS_FAILED" });
	});

	test("returns full coverage when provider returns all requested sections", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceFetchFundamentalsTool({
			store,
			providers: [
				createFundamentalsProvider("yahoo", {
					valuation: { trailingPE: 20 },
					profitability: { profitMargins: 0.2 },
				}),
			],
		});

		const result = await tool.execute("tool-call-3", {
			symbol: "AAPL",
			requestedSections: ["valuation", "profitability"],
		});

		expect(result.details.coverage).toBe("full");
		expect(result.details.missingSections).toEqual([]);
		expect(result.details.sourceUsed).toBe("yahoo");
		expect(result.details.fundamentalsNormalized?.sections.valuation?.peRatio).toBe(20);
		expect(result.details.fundamentalsFieldMetadata?.valuation?.peRatio?.sourceField).toBe("trailingPE");
		expect(result.details.fundamentalsFieldMetadata?.profitability?.profitMargin?.normalizedUnit).toBe("fraction");
	});

	test("returns partial coverage when provider omits requested sections", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceFetchFundamentalsTool({
			store,
			providers: [
				createFundamentalsProvider("finnhub", {
					valuation: { peTTM: 21 },
				}),
			],
		});

		const result = await tool.execute("tool-call-4", {
			symbol: "MSFT",
			requestedSections: ["valuation", "growth"],
		});

		expect(result.details.coverage).toBe("partial");
		expect(result.details.missingSections).toEqual(["growth"]);
		expect(result.details.fundamentals?.sections.valuation?.peTTM).toBe(21);
		expect(result.details.fundamentalsNormalized?.sections.valuation?.peRatio).toBe(21);
		expect(result.details.fundamentalsFieldMetadata?.valuation?.peRatio?.sourceProvider).toBe("finnhub");
	});

	test("respects providerPreference when multiple providers can serve fundamentals", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceFetchFundamentalsTool({
			store,
			providers: [
				createFundamentalsProvider("alpha-vantage", {
					valuation: { peRatio: 18 },
				}),
				createFundamentalsProvider("yahoo", {
					valuation: { trailingPE: 22 },
				}),
			],
		});

		const result = await tool.execute("tool-call-5", {
			symbol: "NVDA",
			requestedSections: ["valuation"],
			providerPreference: ["yahoo"],
		});

		expect(result.details.sourceUsed).toBe("yahoo");
		expect(result.details.fundamentals?.sections.valuation?.trailingPE).toBe(22);
		expect(result.details.fundamentalsNormalized?.sections.valuation?.peRatio).toBe(22);
	});

	test("normalizes percent-like growth values to fraction scale for alpha-vantage style inputs", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceFetchFundamentalsTool({
			store,
			providers: [
				createFundamentalsProvider("alpha-vantage", {
					growth: { quarterlyRevenueGrowthYOY: 78, quarterlyEarningsGrowthYOY: 12.5 },
				}),
			],
		});

		const result = await tool.execute("tool-call-6", {
			symbol: "NVDA",
			requestedSections: ["growth"],
		});

		expect(result.details.coverage).toBe("full");
		expect(result.details.fundamentalsNormalized?.sections.growth?.revenueGrowth).toBeCloseTo(0.78);
		expect(result.details.fundamentalsNormalized?.sections.growth?.earningsGrowth).toBeCloseTo(0.125);
		expect(result.details.fundamentalsFieldMetadata?.growth?.revenueGrowth?.normalizedUnit).toBe("fraction");
	});
});

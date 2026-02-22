import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { normalizeFundamentalsSnapshot } from "../advisory/fundamentals-normalization.js";
import { fundamentalsSectionSchema } from "../advisory/schemas.js";
import type { FundamentalsSnapshotEnvelope } from "../advisory/types.js";
import { fundamentalsRouter } from "../providers/router.js";
import type { FinanceDataProvider, FundamentalsSection } from "../providers/types.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const DEFAULT_REQUESTED_SECTIONS: FundamentalsSection[] = ["valuation", "profitability", "growth", "balance-sheet"];

const fetchFundamentalsParameters = Type.Object({
	symbol: Type.String({ description: "US stock symbol, e.g. AAPL" }),
	requestedSections: Type.Optional(
		Type.Array(fundamentalsSectionSchema, {
			description: "Requested fundamentals sections",
			default: DEFAULT_REQUESTED_SECTIONS,
			minItems: 1,
		}),
	),
	providerPreference: Type.Optional(Type.Array(Type.String(), { description: "Preferred provider names in order" })),
	allowPlaceholder: Type.Optional(Type.Boolean({ default: true })),
});

type FetchFundamentalsParams = Static<typeof fetchFundamentalsParameters>;

export type FinanceFetchFundamentalsDetails = FundamentalsSnapshotEnvelope;

export interface CreateFinanceFetchFundamentalsToolOptions {
	store: FinanceAdvisoryStore;
	providers?: FinanceDataProvider[];
	resolveProviders?: () => FinanceDataProvider[];
}

function selectProviders(allProviders: FinanceDataProvider[], preference: string[] | undefined): FinanceDataProvider[] {
	if (!preference || preference.length === 0) {
		return allProviders;
	}

	const byName = new Map(allProviders.map((provider) => [provider.name.toLowerCase(), provider] as const));
	const selected: FinanceDataProvider[] = [];
	for (const preferredName of preference) {
		const provider = byName.get(preferredName.toLowerCase());
		if (provider) {
			selected.push(provider);
			byName.delete(preferredName.toLowerCase());
		}
	}

	for (const provider of allProviders) {
		if (!selected.includes(provider)) {
			selected.push(provider);
		}
	}

	return selected;
}

export function createFinanceFetchFundamentalsTool(
	options: CreateFinanceFetchFundamentalsToolOptions,
): AgentTool<typeof fetchFundamentalsParameters, FinanceFetchFundamentalsDetails> {
	return {
		name: "finance_fetch_fundamentals",
		label: "Finance Fetch Fundamentals",
		description: "Fetch company fundamentals via provider routing with placeholder fallback support.",
		parameters: fetchFundamentalsParameters,
		execute: async (_toolCallId: string, params: FetchFundamentalsParams) => {
			const symbol = params.symbol.toUpperCase();
			const requestedSections = params.requestedSections ?? DEFAULT_REQUESTED_SECTIONS;
			const allowPlaceholder = params.allowPlaceholder ?? true;
			const providers = selectProviders(
				options.providers ?? options.resolveProviders?.() ?? [],
				params.providerPreference,
			);

			try {
				const routed = await fundamentalsRouter({ symbol, requestedSections }, providers);
				const normalized = normalizeFundamentalsSnapshot({
					fundamentals: routed.fundamentals,
					sourceProvider: routed.sourceUsed,
					requestedSections,
				});
				const envelope = options.store.saveFundamentals({
					symbol,
					fundamentals: routed.fundamentals,
					fundamentalsNormalized: normalized.fundamentalsNormalized,
					fundamentalsFieldMetadata: normalized.fundamentalsFieldMetadata,
					sourceUsed: routed.sourceUsed,
					coverage: routed.coverage,
					warnings: routed.warnings,
					missingSections: routed.missingSections,
				});

				return {
					content: [
						{
							type: "text",
							text:
								`Fetched fundamentals for ${symbol} from ${routed.sourceUsed} ` +
								`(fundamentalsId=${envelope.fundamentalsId}, coverage=${envelope.coverage}).`,
						},
					],
					details: envelope,
				};
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				if (!allowPlaceholder) {
					throw error;
				}

				const envelope = options.store.saveFundamentals({
					symbol,
					fundamentals: null,
					fundamentalsNormalized: null,
					fundamentalsFieldMetadata: {},
					sourceUsed: null,
					coverage: "placeholder",
					warnings: [reason],
					missingSections: [...requestedSections],
				});

				return {
					content: [
						{
							type: "text",
							text:
								`Fundamentals unavailable for ${symbol}; stored placeholder result ` +
								`(fundamentalsId=${envelope.fundamentalsId}).`,
						},
					],
					details: envelope,
				};
			}
		},
	};
}

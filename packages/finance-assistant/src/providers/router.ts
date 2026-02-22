import { FinanceAssistantError } from "../errors.js";
import type {
	FinanceDataProvider,
	FundamentalsRequest,
	QuoteProvider,
	QuoteRequest,
	RoutedFundamentalsResult,
	RoutedQuoteResult,
} from "./types.js";

export async function quoteRouter(request: QuoteRequest, providers: QuoteProvider[]): Promise<RoutedQuoteResult> {
	const warnings: string[] = [];

	for (const provider of providers) {
		try {
			const candles = await provider.getCandles(request);
			if (candles.length === 0) {
				warnings.push(`${provider.name} returned empty candle set`);
				continue;
			}

			return {
				candles,
				sourceUsed: provider.name,
				warnings,
			};
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error);
			warnings.push(`${provider.name} failed: ${reason}`);
		}
	}

	throw new FinanceAssistantError("PROVIDERS_FAILED", `All quote providers failed (${warnings.join("; ")})`);
}

export async function fundamentalsRouter(
	request: FundamentalsRequest,
	providers: FinanceDataProvider[],
): Promise<RoutedFundamentalsResult> {
	const warnings: string[] = [];

	for (const provider of providers) {
		if (!provider.getFundamentals) {
			warnings.push(`${provider.name} fundamentals not supported`);
			continue;
		}

		try {
			const fundamentals = await provider.getFundamentals(request);
			const requested = new Set(request.requestedSections);
			const availableSections = new Set(Object.keys(fundamentals.sections));
			const missingSections = [...requested].filter((section) => !availableSections.has(section));

			return {
				fundamentals,
				sourceUsed: provider.name,
				warnings,
				missingSections,
				coverage: missingSections.length === 0 ? "full" : "partial",
			};
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error);
			warnings.push(`${provider.name} fundamentals failed: ${reason}`);
		}
	}

	throw new FinanceAssistantError(
		"FUNDAMENTALS_PROVIDERS_FAILED",
		`All fundamentals providers failed (${warnings.join("; ")})`,
	);
}

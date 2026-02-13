import { FinanceAssistantError } from "../errors.js";
import type { QuoteProvider, QuoteRequest, RoutedQuoteResult } from "./types.js";

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

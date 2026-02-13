import { describe, expect, test } from "vitest";
import { analyzeSymbol } from "../src/analyze.js";
import type { QuoteProvider } from "../src/providers/types.js";

describe("analyzeSymbol", () => {
	test("runs end-to-end analysis with injected providers", async () => {
		const provider: QuoteProvider = {
			name: "stub-provider",
			getCandles: async () => {
				return [
					{ timestamp: 1, open: 100, high: 101, low: 99, close: 100, volume: 1000 },
					{ timestamp: 2, open: 100, high: 102, low: 99, close: 101, volume: 1100 },
					{ timestamp: 3, open: 101, high: 103, low: 100, close: 102, volume: 1200 },
					{ timestamp: 4, open: 102, high: 104, low: 101, close: 103, volume: 1300 },
					{ timestamp: 5, open: 103, high: 105, low: 102, close: 104, volume: 1400 },
					{ timestamp: 6, open: 104, high: 106, low: 103, close: 105, volume: 1500 },
					{ timestamp: 7, open: 105, high: 107, low: 104, close: 106, volume: 1600 },
					{ timestamp: 8, open: 106, high: 108, low: 105, close: 107, volume: 1700 },
					{ timestamp: 9, open: 107, high: 109, low: 106, close: 108, volume: 1800 },
					{ timestamp: 10, open: 108, high: 110, low: 107, close: 109, volume: 1900 },
					{ timestamp: 11, open: 109, high: 111, low: 108, close: 110, volume: 2000 },
					{ timestamp: 12, open: 110, high: 112, low: 109, close: 111, volume: 2100 },
					{ timestamp: 13, open: 111, high: 113, low: 110, close: 112, volume: 2200 },
					{ timestamp: 14, open: 112, high: 114, low: 111, close: 113, volume: 2300 },
					{ timestamp: 15, open: 113, high: 115, low: 112, close: 114, volume: 2400 },
					{ timestamp: 16, open: 114, high: 116, low: 113, close: 115, volume: 2500 },
					{ timestamp: 17, open: 115, high: 117, low: 114, close: 116, volume: 2600 },
					{ timestamp: 18, open: 116, high: 118, low: 115, close: 117, volume: 2700 },
					{ timestamp: 19, open: 117, high: 119, low: 116, close: 118, volume: 2800 },
					{ timestamp: 20, open: 118, high: 120, low: 117, close: 119, volume: 2900 },
					{ timestamp: 21, open: 119, high: 121, low: 118, close: 120, volume: 3000 },
					{ timestamp: 22, open: 120, high: 122, low: 119, close: 121, volume: 3100 },
					{ timestamp: 23, open: 121, high: 123, low: 120, close: 122, volume: 3200 },
					{ timestamp: 24, open: 122, high: 124, low: 121, close: 123, volume: 3300 },
					{ timestamp: 25, open: 123, high: 125, low: 122, close: 124, volume: 3400 },
					{ timestamp: 26, open: 124, high: 126, low: 123, close: 125, volume: 3500 },
					{ timestamp: 27, open: 125, high: 127, low: 124, close: 126, volume: 3600 },
					{ timestamp: 28, open: 126, high: 128, low: 125, close: 127, volume: 3700 },
					{ timestamp: 29, open: 127, high: 129, low: 126, close: 128, volume: 3800 },
					{ timestamp: 30, open: 128, high: 130, low: 127, close: 129, volume: 3900 },
				];
			},
		};

		const result = await analyzeSymbol({ symbol: "AAPL", timeframe: "1D", providers: [provider] });

		expect(result.symbol).toBe("AAPL");
		expect(result.timeframe).toBe("1D");
		expect(result.sourceUsed).toBe("stub-provider");
		expect(result.report.conclusion.length).toBeGreaterThan(0);
		expect(result.report.keyEvidence.length).toBeGreaterThan(0);
	});
});

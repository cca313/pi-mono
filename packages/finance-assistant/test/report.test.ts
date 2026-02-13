import { describe, expect, test } from "vitest";
import { generateReport } from "../src/report/generate-report.js";

describe("generateReport", () => {
	test("returns structured report fields", () => {
		const report = generateReport({
			symbol: "AAPL",
			timeframe: "1D",
			sourceUsed: "finnhub",
			lastClose: 210.15,
			sma20: 205.1,
			ema20: 206.2,
			rsi14: 62.4,
			macdLine: 1.8,
			macdSignal: 1.1,
			macdHistogram: 0.7,
			volatilityAnnualized: 0.24,
			maxDrawdown: -0.11,
			warnings: ["primary source timeout"],
		});

		expect(report.conclusion.length).toBeGreaterThan(0);
		expect(report.keyEvidence.length).toBeGreaterThanOrEqual(3);
		expect(report.riskPoints.length).toBeGreaterThan(0);
		expect(report.watchLevels.length).toBeGreaterThan(0);
		expect(["low", "medium", "high"]).toContain(report.confidence);
		expect(report.disclaimer).toContain("not investment advice");
	});
});

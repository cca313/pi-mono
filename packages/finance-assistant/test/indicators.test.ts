import { describe, expect, test } from "vitest";
import {
	computeEma,
	computeMacd,
	computeMaxDrawdown,
	computeRsi,
	computeSma,
	computeVolatility,
} from "../src/indicators/index.js";

describe("indicators", () => {
	const closes = [100, 102, 101, 105, 108, 110, 112, 111, 115, 117];

	test("computes SMA", () => {
		expect(computeSma(closes, 3)).toBeCloseTo((111 + 115 + 117) / 3, 5);
	});

	test("computes EMA", () => {
		const value = computeEma(closes, 3);
		expect(value).toBeGreaterThan(110);
		expect(value).toBeLessThan(117);
	});

	test("computes RSI within range", () => {
		const value = computeRsi(closes, 5);
		expect(value).toBeGreaterThanOrEqual(0);
		expect(value).toBeLessThanOrEqual(100);
	});

	test("computes MACD line/signal/histogram", () => {
		const macd = computeMacd(closes, 3, 6, 3);
		expect(macd.line).not.toBe(0);
		expect(Number.isFinite(macd.signal)).toBe(true);
		expect(Number.isFinite(macd.histogram)).toBe(true);
	});

	test("computes volatility and drawdown", () => {
		const volatility = computeVolatility(closes, 5);
		const drawdown = computeMaxDrawdown(closes);
		expect(volatility).toBeGreaterThanOrEqual(0);
		expect(drawdown).toBeLessThanOrEqual(0);
	});
});

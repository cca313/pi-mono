import { describe, expect, test } from "vitest";
import { isSupportedTimeframe, normalizeTimeframe } from "../src/types.js";

describe("timeframe support", () => {
	test("supports 1H/1D/1W/1M", () => {
		expect(isSupportedTimeframe("1H")).toBe(true);
		expect(isSupportedTimeframe("1D")).toBe(true);
		expect(isSupportedTimeframe("1W")).toBe(true);
		expect(isSupportedTimeframe("1M")).toBe(true);
	});

	test("normalize defaults to 1D for unsupported values", () => {
		expect(normalizeTimeframe(undefined)).toBe("1D");
		expect(normalizeTimeframe("4H")).toBe("1D");
	});
});

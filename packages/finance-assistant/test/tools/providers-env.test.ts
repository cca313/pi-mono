import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { resolveFinanceProvidersFromEnv } from "../../src/tools/index.js";

const originalFinnhubApiKey = process.env.FINNHUB_API_KEY;
const originalAlphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;

function restoreProviderEnv() {
	if (originalFinnhubApiKey === undefined) {
		delete process.env.FINNHUB_API_KEY;
	} else {
		process.env.FINNHUB_API_KEY = originalFinnhubApiKey;
	}

	if (originalAlphaVantageApiKey === undefined) {
		delete process.env.ALPHA_VANTAGE_API_KEY;
	} else {
		process.env.ALPHA_VANTAGE_API_KEY = originalAlphaVantageApiKey;
	}
}

describe("resolveFinanceProvidersFromEnv", () => {
	beforeEach(() => {
		delete process.env.FINNHUB_API_KEY;
		delete process.env.ALPHA_VANTAGE_API_KEY;
	});

	afterEach(() => {
		restoreProviderEnv();
	});

	test("returns yahoo only when no API keys are configured", () => {
		const providers = resolveFinanceProvidersFromEnv();
		expect(providers.map((provider) => provider.name)).toEqual(["yahoo"]);
	});

	test("prepends Finnhub when FINNHUB_API_KEY is set", () => {
		process.env.FINNHUB_API_KEY = "test-finnhub-key";
		const providers = resolveFinanceProvidersFromEnv();
		expect(providers.map((provider) => provider.name)).toEqual(["finnhub", "yahoo"]);
	});

	test("appends Alpha Vantage when ALPHA_VANTAGE_API_KEY is set", () => {
		process.env.ALPHA_VANTAGE_API_KEY = "test-alpha-vantage-key";
		const providers = resolveFinanceProvidersFromEnv();
		expect(providers.map((provider) => provider.name)).toEqual(["yahoo", "alpha-vantage"]);
	});

	test("uses Finnhub -> Yahoo -> Alpha Vantage when both keys are set", () => {
		process.env.FINNHUB_API_KEY = "test-finnhub-key";
		process.env.ALPHA_VANTAGE_API_KEY = "test-alpha-vantage-key";
		const providers = resolveFinanceProvidersFromEnv();
		expect(providers.map((provider) => provider.name)).toEqual(["finnhub", "yahoo", "alpha-vantage"]);
	});
});

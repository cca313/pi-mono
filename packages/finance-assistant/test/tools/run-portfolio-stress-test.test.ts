import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceRunPortfolioStressTestTool } from "../../src/tools/run-portfolio-stress-test.js";
import { createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_run_portfolio_stress_test tool", () => {
	test("runs default scenarios and stores stress test", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const tool = createFinanceRunPortfolioStressTestTool({ advisoryStore });

		const result = await tool.execute("tool-call-1", {
			portfolio: createPortfolioSnapshot(),
		});

		expect(result.details.stressTestId.length).toBeGreaterThan(0);
		expect(result.details.stressTest.scenarioResults.length).toBeGreaterThan(0);
		expect(result.details.stressTest.worstScenario.name.length).toBeGreaterThan(0);
	});

	test("throws INVALID_ADVISORY_INPUT when portfolio input is missing", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const tool = createFinanceRunPortfolioStressTestTool({ advisoryStore });

		await expect(tool.execute("tool-call-2", {})).rejects.toMatchObject({
			code: "INVALID_ADVISORY_INPUT",
		});
	});
});

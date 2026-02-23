import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceCaptureClientGoalsTool } from "../../src/tools/capture-client-goals.js";

describe("finance_capture_client_goals tool", () => {
	test("captures and normalizes client goals", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceCaptureClientGoalsTool({ store });

		const result = await tool.execute("tool-call-1", {
			goals: {
				planningHorizonYears: 10,
				goals: [{ label: " Retirement ", targetAmount: 900000, priority: "high" }],
			},
		});

		expect(result.details.goalsId.length).toBeGreaterThan(0);
		expect(result.details.goals.goals[0].label).toBe("Retirement");
		expect(result.details.coverage).toMatch(/partial|full/);
	});
});

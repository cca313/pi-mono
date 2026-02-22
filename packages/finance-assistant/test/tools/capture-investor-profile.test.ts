import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceCaptureInvestorProfileTool } from "../../src/tools/capture-investor-profile.js";
import { createInvestorProfile } from "./advisory-fixtures.js";

describe("finance_capture_investor_profile tool", () => {
	test("normalizes and stores a profile", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceCaptureInvestorProfileTool({ store });

		const result = await tool.execute("tool-call-1", {
			profile: createInvestorProfile({ clientLabel: "  Alice  ", objectives: ["growth", "growth"] }),
		});

		expect(result.details.profileId.length).toBeGreaterThan(0);
		expect(result.details.coverage).toBe("full");
		expect(result.details.profile.clientLabel).toBe("Alice");
		expect(result.details.profile.objectives).toEqual(["growth"]);
		expect(store.getProfile(result.details.profileId)?.profile.clientLabel).toBe("Alice");
	});
});

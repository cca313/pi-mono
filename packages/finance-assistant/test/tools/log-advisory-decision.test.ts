import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceLogAdvisoryDecisionTool } from "../../src/tools/log-advisory-decision.js";

describe("finance_log_advisory_decision tool", () => {
	test("logs decision with evidence and disclaimer", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const tool = createFinanceLogAdvisoryDecisionTool({ advisoryStore });

		const result = await tool.execute("tool-call-1", {
			decisionSummary: "Maintain current exposure range.",
			recommendation: "Use staged trims if concentration persists.",
			evidence: ["Drift breach count=2", "Risk severity=warning"],
			relatedArtifactIds: ["drift-1", "risk-1"],
		});

		expect(result.details.decisionLogId.length).toBeGreaterThan(0);
		expect(result.details.decisionLog.evidence.length).toBe(2);
		expect(result.details.decisionLog.disclaimer).toContain("not investment advice");
	});
});

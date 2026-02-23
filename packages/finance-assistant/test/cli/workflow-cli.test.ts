import { describe, expect, test } from "vitest";
import {
	buildComplianceReport,
	formatCliOutput,
	getFinanceWorkflowCliUsage,
	parseFinanceCliOptions,
} from "../../src/cli/workflow-cli.js";

describe("workflow CLI helpers", () => {
	test("parses defaults and positional prompt", () => {
		const parsed = parseFinanceCliOptions(["Analyze", "AAPL"]);
		expect(parsed.mode).toBe("text");
		expect(parsed.workflow).toBe("agent");
		expect(parsed.prompt).toContain("Analyze AAPL");
		expect(parsed.symbol).toBe("AAPL");
	});

	test("parses explicit workflow options", () => {
		const parsed = parseFinanceCliOptions([
			"--workflow",
			"operations",
			"--mode",
			"json",
			"--export",
			"bundle",
			"--riskTier",
			"aggressive",
			"--riskTemplateJson",
			'{"templateId":"org","version":"1","tiers":{"conservative":{"maxSinglePositionPct":10,"maxSectorPct":20,"maxVolatilityAnnualized":0.2,"maxDrawdownPct":12,"minCashPct":8,"maxCashPct":30,"maxStressLossPct":10},"moderate":{"maxSinglePositionPct":15,"maxSectorPct":30,"maxVolatilityAnnualized":0.35,"maxDrawdownPct":18,"minCashPct":5,"maxCashPct":22,"maxStressLossPct":16},"aggressive":{"maxSinglePositionPct":22,"maxSectorPct":40,"maxVolatilityAnnualized":0.55,"maxDrawdownPct":28,"minCashPct":2,"maxCashPct":16,"maxStressLossPct":24}}}',
		]);
		expect(parsed.workflow).toBe("operations");
		expect(parsed.mode).toBe("json");
		expect(parsed.exportMode).toBe("bundle");
		expect(parsed.riskTier).toBe("aggressive");
		expect(parsed.riskTemplate?.templateId).toBe("org");
	});

	test("parses compliance report flags", () => {
		const parsed = parseFinanceCliOptions(["--report", "compliance", "--reportFormat", "markdown"]);
		expect(parsed.report).toBe("compliance");
		expect(parsed.reportFormat).toBe("markdown");
	});

	test("formats ndjson with top-level sections", () => {
		const output = formatCliOutput({ summary: { coverage: "full" }, result: { ok: true } }, "ndjson");
		const lines = output.trim().split("\n");
		expect(lines.length).toBe(2);
		expect(lines[0]).toContain('"type":"summary"');
		expect(lines[1]).toContain('"type":"result"');
	});

	test("builds compliance report in markdown", () => {
		const report = buildComplianceReport(
			{
				summary: {
					coverage: "partial",
					audit: { runId: "run-1", workflow: "operations", warningsCount: 2 },
					monitoring: { riskSeverity: "warning" },
					compliance: { decisionLogId: "decision-1", disclaimer: "not investment advice" },
				},
			},
			"markdown",
		);
		expect(report.markdown).toContain("## Compliance Report");
		expect(report.markdown).toContain("run-1");
	});

	test("formats plain text payload without JSON quoting", () => {
		const output = formatCliOutput("## Compliance Report", "text");
		expect(output).toBe("## Compliance Report\n");
	});

	test("returns CLI usage text", () => {
		const usage = getFinanceWorkflowCliUsage();
		expect(usage).toContain("Finance Workflow CLI");
		expect(usage).toContain("--workflow");
	});
});

import { writeFile } from "node:fs/promises";
import {
	buildAdvisorySummary,
	createFinanceAgent,
	resolveFinanceProvidersFromEnv,
	runAdvisoryOperationsWorkflow,
	runClientOnboardingWorkflow,
	runInvestmentAdvisorWorkflow,
} from "../src/index.js";
import {
	buildComplianceReport,
	defaultClientGoals,
	defaultInvestorProfile,
	defaultPortfolioSnapshot,
	formatCliOutput,
	getFinanceWorkflowCliUsage,
	parseFinanceCliOptions,
} from "../src/cli/workflow-cli.js";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
	process.stdout.write(`${getFinanceWorkflowCliUsage()}\n`);
	process.exit(0);
}

const options = parseFinanceCliOptions(process.argv.slice(2));

function buildBundle(workflow: string, result: unknown, summary?: unknown) {
	return {
		meta: {
			workflow,
			generatedAt: Date.now(),
		},
		summary,
		result,
	};
}

async function runAgentWorkflow() {
	const agent = createFinanceAgent();
	let outputText = "";

	agent.subscribe((event) => {
		if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
			outputText += event.assistantMessageEvent.delta;
			if (options.mode === "text" && !options.outputPath) {
				process.stdout.write(event.assistantMessageEvent.delta);
			}
		}
	});

	await agent.prompt(options.prompt);
	if (options.mode === "text" && !options.outputPath) {
		process.stdout.write("\n");
	}

	return { summary: outputText };
}

async function runDeterministicWorkflow() {
	if (options.workflow === "onboarding") {
		const result = await runClientOnboardingWorkflow({
			profile: options.profile ?? defaultInvestorProfile(),
			goals: options.goals ?? defaultClientGoals(),
			portfolio: options.portfolio,
		});
		return { result, summary: result.summary };
	}

	if (options.workflow === "operations") {
		const result = await runAdvisoryOperationsWorkflow({
			profile: options.profile ?? defaultInvestorProfile(),
			portfolio: options.portfolio ?? defaultPortfolioSnapshot(),
			riskTier: options.riskTier,
			riskTemplate: options.riskTemplate,
		});
		return { result, summary: result.summary };
	}

	const result = await runInvestmentAdvisorWorkflow({
		symbol: options.symbol,
		timeframe: options.timeframe,
		limit: options.limit,
		providers: resolveFinanceProvidersFromEnv(),
		profile: options.profile ?? defaultInvestorProfile(),
	});
	const summary = buildAdvisorySummary({
		profile: options.profile ?? defaultInvestorProfile(),
		audit: {
			workflow: "symbol-advice",
			artifactIds: [result.analysis.analysisId, result.assessment.assessmentId, result.positionPlan.positionPlanId],
		},
	});
	return { result, summary };
}

async function main() {
	const workflowResult =
		options.workflow === "agent" ? await runAgentWorkflow() : await runDeterministicWorkflow();
	const rawResult = "result" in workflowResult ? workflowResult.result : workflowResult;
	const payload =
		options.exportMode === "bundle"
			? buildBundle(options.workflow, rawResult, workflowResult.summary)
			: rawResult;
	const reportPayload =
		options.report === "compliance"
			? (() => {
				const report = buildComplianceReport(
					workflowResult.summary ?? (payload as { summary?: unknown }).summary ?? payload,
					options.reportFormat,
				);
				return options.reportFormat === "markdown" ? report.markdown : report.json;
			})()
			: payload;
	const formatted = formatCliOutput(reportPayload, options.mode);

	if (options.outputPath) {
		await writeFile(options.outputPath, formatted, "utf-8");
		if (options.mode === "text") {
			process.stdout.write(`Saved output to ${options.outputPath}\n`);
		}
		return;
	}

	if (options.mode !== "text" || options.workflow !== "agent") {
		process.stdout.write(formatted);
	}
}

main().catch((error) => {
	const reason = error instanceof Error ? error.message : String(error);
	process.stderr.write(`finance workflow CLI failed: ${reason}\n`);
	process.exitCode = 1;
});

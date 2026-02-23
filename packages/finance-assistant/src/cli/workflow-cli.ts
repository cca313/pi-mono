import type { InvestorProfile, PortfolioSnapshot, RiskProfileTier, RiskThresholdTemplate } from "../advisory/types.js";

export type FinanceCliMode = "text" | "json" | "ndjson";
export type FinanceCliWorkflow = "agent" | "onboarding" | "operations" | "symbol-advice";
export type FinanceCliExport = "none" | "bundle";
export type FinanceCliReport = "none" | "compliance";
export type FinanceCliReportFormat = "json" | "markdown";

export interface FinanceCliOptions {
	mode: FinanceCliMode;
	workflow: FinanceCliWorkflow;
	exportMode: FinanceCliExport;
	report: FinanceCliReport;
	reportFormat: FinanceCliReportFormat;
	outputPath?: string;
	prompt: string;
	symbol: string;
	timeframe: string;
	limit: number;
	riskTier?: RiskProfileTier;
	riskTemplate?: RiskThresholdTemplate;
	profile?: InvestorProfile;
	goals?: {
		planningHorizonYears?: number;
		targetReturnRangePct?: { min: number; max: number };
		maxLossTolerancePct?: number;
		liquidityBufferPct?: number;
		goals: Array<{
			goalId?: string;
			label: string;
			targetAmount?: number;
			currentAmount?: number;
			targetDate?: number;
			priority?: "high" | "medium" | "low";
			notes?: string;
		}>;
		notes?: string;
	};
	portfolio?: PortfolioSnapshot;
}

function parseJson<TValue>(name: string, value: string | undefined): TValue | undefined {
	if (!value) {
		return undefined;
	}

	try {
		return JSON.parse(value) as TValue;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid JSON for --${name}: ${reason}`);
	}
}

function parseNumber(name: string, value: string | undefined, fallback: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Invalid numeric value for --${name}: ${value}`);
	}

	return parsed;
}

function parseArgs(argv: string[]): Record<string, string> {
	const parsed: Record<string, string> = {};
	for (let i = 0; i < argv.length; i++) {
		const current = argv[i];
		if (!current.startsWith("--")) {
			parsed._ = `${parsed._ ? `${parsed._} ` : ""}${current}`;
			continue;
		}

		const key = current.slice(2);
		const next = argv[i + 1];
		if (!next || next.startsWith("--")) {
			parsed[key] = "true";
			continue;
		}

		parsed[key] = next;
		i++;
	}

	return parsed;
}

function resolveMode(rawMode: string | undefined): FinanceCliMode {
	if (!rawMode) {
		return "text";
	}
	if (rawMode === "text") {
		return "text";
	}
	if (rawMode === "json") {
		return "json";
	}
	if (rawMode === "ndjson") {
		return "ndjson";
	}
	throw new Error(`Unsupported --mode: ${rawMode}`);
}

function resolveWorkflow(rawWorkflow: string | undefined): FinanceCliWorkflow {
	if (!rawWorkflow) {
		return "agent";
	}
	if (rawWorkflow === "agent") {
		return "agent";
	}
	if (rawWorkflow === "onboarding") {
		return "onboarding";
	}
	if (rawWorkflow === "operations") {
		return "operations";
	}
	if (rawWorkflow === "symbol-advice") {
		return "symbol-advice";
	}
	throw new Error(`Unsupported --workflow: ${rawWorkflow}`);
}

function resolveExport(rawExport: string | undefined): FinanceCliExport {
	if (!rawExport) {
		return "none";
	}
	if (rawExport === "none") {
		return "none";
	}
	if (rawExport === "bundle") {
		return "bundle";
	}
	throw new Error(`Unsupported --export: ${rawExport}`);
}

function resolveReport(rawReport: string | undefined): FinanceCliReport {
	if (!rawReport) {
		return "none";
	}
	if (rawReport === "none") {
		return "none";
	}
	if (rawReport === "compliance") {
		return "compliance";
	}
	throw new Error(`Unsupported --report: ${rawReport}`);
}

function resolveReportFormat(rawFormat: string | undefined): FinanceCliReportFormat {
	if (!rawFormat) {
		return "json";
	}
	if (rawFormat === "json") {
		return "json";
	}
	if (rawFormat === "markdown") {
		return "markdown";
	}
	throw new Error(`Unsupported --reportFormat: ${rawFormat}`);
}

export function parseFinanceCliOptions(argv: string[]): FinanceCliOptions {
	const args = parseArgs(argv);
	const mode = resolveMode(args.mode);
	const workflow = resolveWorkflow(args.workflow);
	const exportMode = resolveExport(args.export);
	const report = resolveReport(args.report);
	const reportFormat = resolveReportFormat(args.reportFormat);

	return {
		mode,
		workflow,
		exportMode,
		report,
		reportFormat,
		outputPath: args.output,
		prompt:
			args.prompt ??
			args._ ??
			"Analyze AAPL on 1D. Use finance_fetch_market_data, then finance_compute_indicators, then finance_generate_report.",
		symbol: (args.symbol ?? "AAPL").toUpperCase(),
		timeframe: args.timeframe ?? "1D",
		limit: parseNumber("limit", args.limit, 200),
		riskTier:
			args.riskTier === "conservative" || args.riskTier === "moderate" || args.riskTier === "aggressive"
				? args.riskTier
				: undefined,
		profile: parseJson("profileJson", args.profileJson),
		goals: parseJson("goalsJson", args.goalsJson),
		portfolio: parseJson("portfolioJson", args.portfolioJson),
		riskTemplate: parseJson("riskTemplateJson", args.riskTemplateJson),
	};
}

interface SummaryLike {
	generatedAt?: number;
	coverage?: string;
	warnings?: string[];
	audit?: {
		runId?: string;
		workflow?: string;
		templateId?: string;
		templateVersion?: string;
		warningsCount?: number;
		artifactIds?: string[];
	};
	monitoring?: {
		riskSeverity?: string;
		riskTemplateId?: string;
		riskTemplateVersion?: string;
		driftBreachCount?: number;
		riskFlagCount?: number;
	};
	compliance?: {
		disclaimer?: string;
		decisionLogId?: string;
		evidenceSummary?: string[];
	};
}

function extractSummary(payload: unknown): SummaryLike | undefined {
	if (!payload || typeof payload !== "object") {
		return undefined;
	}

	if ("summary" in payload && payload.summary && typeof payload.summary === "object") {
		return payload.summary as SummaryLike;
	}

	if ("compliance" in payload || "monitoring" in payload) {
		return payload as SummaryLike;
	}

	return undefined;
}

export function buildComplianceReport(
	payload: unknown,
	format: FinanceCliReportFormat,
): { json: Record<string, unknown>; markdown: string } {
	const summary = extractSummary(payload);
	const report = {
		runId: summary?.audit?.runId,
		workflow: summary?.audit?.workflow,
		generatedAt: summary?.generatedAt,
		coverage: summary?.coverage,
		warningsCount: summary?.audit?.warningsCount ?? summary?.warnings?.length ?? 0,
		templateId: summary?.audit?.templateId ?? summary?.monitoring?.riskTemplateId,
		templateVersion: summary?.audit?.templateVersion ?? summary?.monitoring?.riskTemplateVersion,
		riskSeverity: summary?.monitoring?.riskSeverity,
		riskFlagCount: summary?.monitoring?.riskFlagCount,
		driftBreachCount: summary?.monitoring?.driftBreachCount,
		decisionLogId: summary?.compliance?.decisionLogId,
		disclaimer: summary?.compliance?.disclaimer,
		evidence: summary?.compliance?.evidenceSummary ?? [],
	};

	const markdown =
		"## Compliance Report\n" +
		`- runId: ${report.runId ?? "n/a"}\n` +
		`- workflow: ${report.workflow ?? "n/a"}\n` +
		`- coverage: ${report.coverage ?? "n/a"}\n` +
		`- warningsCount: ${report.warningsCount}\n` +
		`- template: ${report.templateId ?? "n/a"}@${report.templateVersion ?? "n/a"}\n` +
		`- riskSeverity: ${report.riskSeverity ?? "n/a"}\n` +
		`- decisionLogId: ${report.decisionLogId ?? "n/a"}\n` +
		`- disclaimer: ${report.disclaimer ?? "n/a"}\n`;

	if (format === "markdown") {
		return { json: report, markdown };
	}

	return { json: report, markdown };
}

export function defaultInvestorProfile(): InvestorProfile {
	return {
		clientLabel: "CLI Example Client",
		riskTolerance: "moderate",
		investmentHorizon: "long",
		objectives: ["growth", "diversification"],
		liquidityNeeds: "medium",
		accountTypes: ["taxable"],
	};
}

export function defaultClientGoals(): NonNullable<FinanceCliOptions["goals"]> {
	return {
		planningHorizonYears: 12,
		liquidityBufferPct: 8,
		goals: [{ label: "Retirement", targetAmount: 1200000, priority: "high" }],
	};
}

export function defaultPortfolioSnapshot(): PortfolioSnapshot {
	return {
		asOf: Date.now(),
		baseCurrency: "USD",
		accounts: [
			{
				accountId: "tax-1",
				accountType: "taxable",
				cashBalance: 2500,
				positions: [
					{ symbol: "AAPL", quantity: 40, lastPrice: 190, marketValue: 7600, sector: "Technology" },
					{ symbol: "MSFT", quantity: 20, lastPrice: 410, marketValue: 8200, sector: "Technology" },
				],
			},
		],
	};
}

export function formatCliOutput(payload: unknown, mode: FinanceCliMode): string {
	if (mode === "json") {
		return `${JSON.stringify(payload, null, 2)}\n`;
	}

	if (mode === "ndjson") {
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
			return `${JSON.stringify({ type: "payload", data: payload })}\n`;
		}

		const lines: string[] = [];
		for (const [key, value] of Object.entries(payload)) {
			lines.push(JSON.stringify({ type: key, data: value }));
		}
		return `${lines.join("\n")}\n`;
	}

	if (payload && typeof payload === "object" && "summary" in payload) {
		const summary = (payload as { summary?: { compliance?: { disclaimer?: string } } }).summary;
		const disclaimer = summary?.compliance?.disclaimer;
		if (typeof disclaimer === "string") {
			return `Workflow completed.\nDisclaimer: ${disclaimer}\n`;
		}
	}

	if (typeof payload === "string") {
		return payload.endsWith("\n") ? payload : `${payload}\n`;
	}

	return `${JSON.stringify(payload, null, 2)}\n`;
}

export function getFinanceWorkflowCliUsage(): string {
	return [
		"Finance Workflow CLI",
		"",
		"Usage:",
		"  npm run example:workflow -w @mariozechner/pi-finance-assistant -- [options]",
		"",
		"Core options:",
		"  --workflow agent|onboarding|operations|symbol-advice",
		"  --mode text|json|ndjson",
		"  --export none|bundle",
		"  --output <path>",
		"",
		"Compliance report options:",
		"  --report none|compliance",
		"  --reportFormat json|markdown",
		"",
		"Input options:",
		"  --prompt <text>",
		"  --symbol <ticker>",
		"  --timeframe 1H|1D|1W|1M",
		"  --limit <number>",
		"  --riskTier conservative|moderate|aggressive",
		"  --profileJson <json>",
		"  --goalsJson <json>",
		"  --portfolioJson <json>",
		"  --riskTemplateJson <json>",
	].join("\n");
}

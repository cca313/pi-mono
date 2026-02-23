import type { AdvisoryCoverage, AdvisoryDecisionLog } from "./types.js";

export interface BuildDecisionLogInput {
	decisionSummary: string;
	recommendation: string;
	evidence: string[];
	constraints?: string[];
	relatedArtifactIds?: string[];
}

export interface BuildDecisionLogOutput {
	decisionLog: AdvisoryDecisionLog;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

export function buildAdvisoryDecisionLog(input: BuildDecisionLogInput): BuildDecisionLogOutput {
	const warnings: string[] = [];
	const summary = input.decisionSummary.trim();
	const recommendation = input.recommendation.trim();

	if (summary.length === 0) {
		warnings.push("Decision summary is empty.");
	}
	if (recommendation.length === 0) {
		warnings.push("Recommendation is empty.");
	}

	const evidence = input.evidence.map((item) => item.trim()).filter((item) => item.length > 0);
	if (evidence.length === 0) {
		warnings.push("No supporting evidence entries were provided.");
	}

	return {
		decisionLog: {
			decisionSummary: summary,
			recommendation,
			evidence,
			constraints: input.constraints?.map((item) => item.trim()).filter((item) => item.length > 0) ?? [],
			relatedArtifactIds:
				input.relatedArtifactIds?.map((item) => item.trim()).filter((item) => item.length > 0) ?? [],
			disclaimer: "For research and educational purposes only, not investment advice.",
			loggedAt: Date.now(),
		},
		coverage: warnings.length > 0 ? "partial" : "full",
		warnings,
	};
}

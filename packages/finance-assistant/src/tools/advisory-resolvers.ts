import type {
	AdvisoryAnalysisContext,
	FundamentalsSnapshotEnvelope as FundamentalsEnvelope,
	FundamentalsSnapshotEnvelope,
	InvestorProfile,
	InvestorProfileEnvelope,
	PortfolioSnapshot,
	PortfolioSnapshotEnvelope,
} from "../advisory/types.js";
import { FinanceAssistantError } from "../errors.js";
import { buildFinanceReport } from "../workflow/run-finance-workflow.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";
import type { FinanceWorkflowStore } from "./workflow-store.js";

export function resolveAnalysisContext(store: FinanceWorkflowStore, analysisId: string): AdvisoryAnalysisContext {
	const state = store.getOrThrow(analysisId);
	if (!state.market || !state.indicators) {
		throw new FinanceAssistantError(
			"WORKFLOW_STATE_NOT_FOUND",
			`Missing market data or indicators in workflow state: ${analysisId}`,
		);
	}

	return {
		analysisId,
		market: state.market,
		indicators: state.indicators,
		report: state.report ?? buildFinanceReport(state.market, state.indicators),
	};
}

export function resolveProfileInput(
	store: FinanceAdvisoryStore,
	input: { profile?: InvestorProfile; profileId?: string },
): { profile: InvestorProfile; profileEnvelope?: InvestorProfileEnvelope } {
	if (input.profile) {
		return { profile: input.profile };
	}

	if (input.profileId) {
		const profileEnvelope = store.getProfileOrThrow(input.profileId);
		return { profile: profileEnvelope.profile, profileEnvelope };
	}

	throw new FinanceAssistantError("INVALID_ADVISORY_INPUT", "Expected profile or profileId");
}

export function resolvePortfolioInput(
	store: FinanceAdvisoryStore,
	input: { portfolio?: PortfolioSnapshot; portfolioId?: string },
): { portfolio: PortfolioSnapshot; portfolioEnvelope?: PortfolioSnapshotEnvelope } {
	if (input.portfolio) {
		return { portfolio: input.portfolio };
	}

	if (input.portfolioId) {
		const portfolioEnvelope = store.getPortfolioOrThrow(input.portfolioId);
		return { portfolio: portfolioEnvelope.portfolio, portfolioEnvelope };
	}

	throw new FinanceAssistantError("INVALID_ADVISORY_INPUT", "Expected portfolio or portfolioId");
}

export function resolveFundamentalsInput(
	store: FinanceAdvisoryStore,
	input: { fundamentals?: FundamentalsSnapshotEnvelope["fundamentals"]; fundamentalsId?: string },
	symbol?: string,
): FundamentalsEnvelope | undefined {
	if (input.fundamentals) {
		return {
			fundamentalsId: "inline",
			symbol: symbol ?? input.fundamentals.symbol,
			fundamentals: input.fundamentals,
			sourceUsed: "inline",
			coverage: "full",
			warnings: [],
			missingSections: [],
			updatedAt: Date.now(),
		};
	}

	if (input.fundamentalsId) {
		return store.getFundamentalsOrThrow(input.fundamentalsId);
	}

	return undefined;
}

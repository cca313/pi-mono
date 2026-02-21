import { randomUUID } from "node:crypto";
import { FinanceAssistantError } from "../errors.js";
import type { AnalysisReport } from "../report/generate-report.js";
import type { FinanceIndicatorData, FinanceMarketData } from "../workflow/types.js";

export interface FinanceWorkflowState {
	analysisId: string;
	market?: FinanceMarketData;
	indicators?: FinanceIndicatorData;
	report?: AnalysisReport;
	updatedAt: number;
}

export interface FinanceWorkflowStore {
	readonly maxEntries: number;
	createFromMarket(market: FinanceMarketData): FinanceWorkflowState;
	get(analysisId: string): FinanceWorkflowState | undefined;
	getOrThrow(analysisId: string): FinanceWorkflowState;
	setIndicators(analysisId: string, indicators: FinanceIndicatorData): FinanceWorkflowState;
	setReport(analysisId: string, report: AnalysisReport): FinanceWorkflowState;
}

function normalizeMaxEntries(input: number | undefined): number {
	if (!Number.isFinite(input) || !input || input <= 0) {
		return 50;
	}

	return Math.floor(input);
}

export function createFinanceWorkflowStore(maxEntries?: number): FinanceWorkflowStore {
	const entryCap = normalizeMaxEntries(maxEntries);
	const entries = new Map<string, FinanceWorkflowState>();

	const touch = (state: FinanceWorkflowState): FinanceWorkflowState => {
		entries.delete(state.analysisId);
		entries.set(state.analysisId, state);

		while (entries.size > entryCap) {
			const oldestKey = entries.keys().next().value;
			if (!oldestKey) {
				break;
			}

			entries.delete(oldestKey);
		}

		return state;
	};

	const getOrThrow = (analysisId: string): FinanceWorkflowState => {
		const state = entries.get(analysisId);
		if (!state) {
			throw new FinanceAssistantError("WORKFLOW_STATE_NOT_FOUND", `Workflow state not found: ${analysisId}`);
		}

		return state;
	};

	return {
		maxEntries: entryCap,
		createFromMarket(market) {
			const state: FinanceWorkflowState = {
				analysisId: randomUUID(),
				market,
				updatedAt: Date.now(),
			};
			return touch(state);
		},
		get(analysisId) {
			return entries.get(analysisId);
		},
		getOrThrow,
		setIndicators(analysisId, indicators) {
			const existing = getOrThrow(analysisId);
			const state: FinanceWorkflowState = {
				...existing,
				indicators,
				updatedAt: Date.now(),
			};
			return touch(state);
		},
		setReport(analysisId, report) {
			const existing = getOrThrow(analysisId);
			const state: FinanceWorkflowState = {
				...existing,
				report,
				updatedAt: Date.now(),
			};
			return touch(state);
		},
	};
}

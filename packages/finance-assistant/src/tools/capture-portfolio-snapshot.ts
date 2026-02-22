import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { normalizePortfolioSnapshot } from "../advisory/profile.js";
import { portfolioSnapshotSchema } from "../advisory/schemas.js";
import type { PortfolioSnapshotEnvelope } from "../advisory/types.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const capturePortfolioSnapshotParameters = Type.Object({
	portfolio: portfolioSnapshotSchema,
});

type CapturePortfolioSnapshotParams = Static<typeof capturePortfolioSnapshotParameters>;

export type FinanceCapturePortfolioSnapshotDetails = PortfolioSnapshotEnvelope;

export interface CreateFinanceCapturePortfolioSnapshotToolOptions {
	store: FinanceAdvisoryStore;
}

export function createFinanceCapturePortfolioSnapshotTool(
	options: CreateFinanceCapturePortfolioSnapshotToolOptions,
): AgentTool<typeof capturePortfolioSnapshotParameters, FinanceCapturePortfolioSnapshotDetails> {
	return {
		name: "finance_capture_portfolio_snapshot",
		label: "Finance Capture Portfolio Snapshot",
		description: "Normalize and cache a portfolio snapshot with detailed holdings and tax lots.",
		parameters: capturePortfolioSnapshotParameters,
		execute: async (_toolCallId: string, params: CapturePortfolioSnapshotParams) => {
			const portfolio = normalizePortfolioSnapshot(params.portfolio);
			const envelope = options.store.savePortfolio(portfolio, "full", []);

			const positionsCount = portfolio.accounts.reduce((sum, account) => sum + account.positions.length, 0);
			return {
				content: [
					{
						type: "text",
						text:
							`Captured portfolio snapshot (portfolioId=${envelope.portfolioId}) ` +
							`accounts=${portfolio.accounts.length}, positions=${positionsCount}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

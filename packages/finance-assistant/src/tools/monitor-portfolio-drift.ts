import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { buildPortfolioDriftReport } from "../advisory/drift-monitor.js";
import { normalizePortfolioSnapshot } from "../advisory/profile.js";
import { portfolioSnapshotSchema, targetPolicySchema } from "../advisory/schemas.js";
import type { PortfolioDriftReportEnvelope } from "../advisory/types.js";
import { resolvePortfolioInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const monitorPortfolioDriftParameters = Type.Object({
	portfolioId: Type.Optional(Type.String()),
	portfolio: Type.Optional(portfolioSnapshotSchema),
	targetPolicy: Type.Optional(targetPolicySchema),
	ipsId: Type.Optional(Type.String()),
});

type MonitorPortfolioDriftParams = Static<typeof monitorPortfolioDriftParameters>;

export type FinanceMonitorPortfolioDriftDetails = PortfolioDriftReportEnvelope;

export interface CreateFinanceMonitorPortfolioDriftToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceMonitorPortfolioDriftTool(
	options: CreateFinanceMonitorPortfolioDriftToolOptions,
): AgentTool<typeof monitorPortfolioDriftParameters, FinanceMonitorPortfolioDriftDetails> {
	return {
		name: "finance_monitor_portfolio_drift",
		label: "Finance Monitor Portfolio Drift",
		description: "Detect portfolio drift versus target ranges and prioritize actions.",
		parameters: monitorPortfolioDriftParameters,
		execute: async (_toolCallId: string, params: MonitorPortfolioDriftParams) => {
			const resolvedPortfolio = resolvePortfolioInput(options.advisoryStore, {
				portfolio: params.portfolio ? normalizePortfolioSnapshot(params.portfolio) : undefined,
				portfolioId: params.portfolioId,
			});

			const ips = params.ipsId ? options.advisoryStore.getIpsOrThrow(params.ipsId).ips : undefined;
			const built = buildPortfolioDriftReport({
				portfolio: resolvedPortfolio.portfolio,
				targetPolicy: params.targetPolicy,
				ips,
			});

			const envelope = options.advisoryStore.saveDriftReport(built.driftReport, built.coverage, built.warnings);

			return {
				content: [
					{
						type: "text",
						text:
							`Portfolio drift monitor completed (driftReportId=${envelope.driftReportId}) ` +
							`breaches=${envelope.driftReport.breaches.length}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

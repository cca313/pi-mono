import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { normalizePortfolioSnapshot } from "../advisory/profile.js";
import { portfolioSnapshotSchema, portfolioStressScenarioSchema } from "../advisory/schemas.js";
import { buildPortfolioStressTest } from "../advisory/stress-test.js";
import type { PortfolioStressTestEnvelope } from "../advisory/types.js";
import { resolvePortfolioInput } from "./advisory-resolvers.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const runPortfolioStressTestParameters = Type.Object({
	portfolioId: Type.Optional(Type.String()),
	portfolio: Type.Optional(portfolioSnapshotSchema),
	scenarios: Type.Optional(Type.Array(portfolioStressScenarioSchema)),
	pricingMode: Type.Optional(Type.String({ default: "simple-shock" })),
});

type RunPortfolioStressTestParams = Static<typeof runPortfolioStressTestParameters>;

export type FinanceRunPortfolioStressTestDetails = PortfolioStressTestEnvelope;

export interface CreateFinanceRunPortfolioStressTestToolOptions {
	advisoryStore: FinanceAdvisoryStore;
}

export function createFinanceRunPortfolioStressTestTool(
	options: CreateFinanceRunPortfolioStressTestToolOptions,
): AgentTool<typeof runPortfolioStressTestParameters, FinanceRunPortfolioStressTestDetails> {
	return {
		name: "finance_run_portfolio_stress_test",
		label: "Finance Run Portfolio Stress Test",
		description: "Run portfolio stress scenarios using a simplified shock-based placeholder model.",
		parameters: runPortfolioStressTestParameters,
		execute: async (_toolCallId: string, params: RunPortfolioStressTestParams) => {
			const resolvedPortfolio = resolvePortfolioInput(options.advisoryStore, {
				portfolio: params.portfolio ? normalizePortfolioSnapshot(params.portfolio) : undefined,
				portfolioId: params.portfolioId,
			});

			const built = buildPortfolioStressTest({
				portfolio: resolvedPortfolio.portfolio,
				scenarios: params.scenarios,
			});
			const warnings = [...built.warnings];
			if ((params.pricingMode ?? "simple-shock") !== "simple-shock") {
				warnings.push(`Unsupported pricingMode ${params.pricingMode}; fell back to simple-shock.`);
			}

			const envelope = options.advisoryStore.saveStressTest({
				stressTest: built.stressTest,
				coverage: built.coverage,
				warnings,
			});

			return {
				content: [
					{
						type: "text",
						text:
							`Portfolio stress test completed (stressTestId=${envelope.stressTestId}), ` +
							`worst=${envelope.stressTest.worstScenario.name}.`,
					},
				],
				details: envelope,
			};
		},
	};
}

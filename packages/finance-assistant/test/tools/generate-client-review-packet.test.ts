import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceGenerateClientReviewPacketTool } from "../../src/tools/generate-client-review-packet.js";
import { createFinanceMonitorPortfolioDriftTool } from "../../src/tools/monitor-portfolio-drift.js";
import { createFinanceMonitorRiskBudgetTool } from "../../src/tools/monitor-risk-budget.js";
import { createFinanceWorkflowStore } from "../../src/tools/workflow-store.js";
import { createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_generate_client_review_packet tool", () => {
	test("generates packet from drift and risk artifacts", async () => {
		const advisoryStore = createFinanceAdvisoryStore();
		const workflowStore = createFinanceWorkflowStore();
		const portfolio = advisoryStore.savePortfolio(createPortfolioSnapshot());

		const driftTool = createFinanceMonitorPortfolioDriftTool({ advisoryStore });
		const drift = await driftTool.execute("tool-call-d", {
			portfolioId: portfolio.portfolioId,
			targetPolicy: { singlePositionMaxPct: 10 },
		});

		const riskTool = createFinanceMonitorRiskBudgetTool({ advisoryStore, workflowStore });
		const risk = await riskTool.execute("tool-call-r", {
			riskTier: "moderate",
			portfolioId: portfolio.portfolioId,
		});

		const packetTool = createFinanceGenerateClientReviewPacketTool({ advisoryStore });
		const result = await packetTool.execute("tool-call-p", {
			clientLabel: "Example Client",
			driftReportId: drift.details.driftReportId,
			riskMonitorId: risk.details.riskMonitorId,
		});

		expect(result.details.reviewPacketId.length).toBeGreaterThan(0);
		expect(result.details.reviewPacket.headline).toContain("Example Client");
		expect(result.details.reviewPacket.disclaimer).toContain("not investment advice");
	});
});

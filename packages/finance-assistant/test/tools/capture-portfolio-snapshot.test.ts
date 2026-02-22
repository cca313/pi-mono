import { describe, expect, test } from "vitest";
import { createFinanceAdvisoryStore } from "../../src/tools/advisory-store.js";
import { createFinanceCapturePortfolioSnapshotTool } from "../../src/tools/capture-portfolio-snapshot.js";
import { createPortfolioSnapshot } from "./advisory-fixtures.js";

describe("finance_capture_portfolio_snapshot tool", () => {
	test("normalizes and stores a portfolio snapshot", async () => {
		const store = createFinanceAdvisoryStore();
		const tool = createFinanceCapturePortfolioSnapshotTool({ store });

		const portfolio = createPortfolioSnapshot({
			baseCurrency: "usd",
			accounts: [
				{
					accountId: "tax-1",
					accountType: "taxable",
					cashBalance: 1000,
					positions: [{ symbol: "aapl", quantity: 2, lastPrice: 100, marketValue: 200 }],
				},
			],
		});

		const result = await tool.execute("tool-call-1", { portfolio });
		expect(result.details.portfolioId.length).toBeGreaterThan(0);
		expect(result.details.coverage).toBe("full");
		expect(result.details.portfolio.baseCurrency).toBe("USD");
		expect(result.details.portfolio.accounts[0]?.positions[0]?.symbol).toBe("AAPL");
		expect(result.details.portfolio.accounts[0]?.positions[0]?.marketValue).toBe(200);
	});
});

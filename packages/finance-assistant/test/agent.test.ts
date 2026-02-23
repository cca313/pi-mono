import { describe, expect, test } from "vitest";
import {
	createFinanceAgent,
	FINANCE_DEFAULT_MODEL_ID,
	FINANCE_DEFAULT_PROVIDER,
	getFinanceDefaultModel,
	resolveFinanceModel,
} from "../src/agent.js";
import { createFinanceToolset } from "../src/tools/index.js";

describe("finance agent defaults", () => {
	test("uses DeepSeek as default finance model", () => {
		expect(FINANCE_DEFAULT_PROVIDER).toBe("deepseek");
		expect(FINANCE_DEFAULT_MODEL_ID).toBe("deepseek-chat");

		const model = getFinanceDefaultModel();
		expect(model.provider).toBe("deepseek");
		expect(model.id).toBe("deepseek-chat");
	});

	test("resolves model by provider and model id", () => {
		const model = resolveFinanceModel("deepseek", "deepseek-chat");
		expect(model.provider).toBe("deepseek");
		expect(model.id).toBe("deepseek-chat");
	});

	test("creates toolset with expected finance advisory tools", () => {
		const tools = createFinanceToolset();
		expect(tools.map((tool) => tool.name)).toEqual([
			"finance_fetch_market_data",
			"finance_compute_indicators",
			"finance_generate_report",
			"finance_capture_investor_profile",
			"finance_capture_portfolio_snapshot",
			"finance_fetch_fundamentals",
			"finance_capture_client_goals",
			"finance_build_investment_policy_statement",
			"finance_assess_investment_suitability",
			"finance_plan_position_strategy",
			"finance_review_portfolio",
			"finance_run_portfolio_stress_test",
			"finance_generate_rebalance_plan",
			"finance_monitor_portfolio_drift",
			"finance_monitor_risk_budget",
			"finance_generate_client_review_packet",
			"finance_log_advisory_decision",
			"finance_generate_advisory_summary",
		]);
	});

	test("creates finance agent with fallback sequence in system prompt", () => {
		const agent = createFinanceAgent();
		expect(agent.state.tools.map((tool) => tool.name)).toEqual([
			"finance_fetch_market_data",
			"finance_compute_indicators",
			"finance_generate_report",
			"finance_capture_investor_profile",
			"finance_capture_portfolio_snapshot",
			"finance_fetch_fundamentals",
			"finance_capture_client_goals",
			"finance_build_investment_policy_statement",
			"finance_assess_investment_suitability",
			"finance_plan_position_strategy",
			"finance_review_portfolio",
			"finance_run_portfolio_stress_test",
			"finance_generate_rebalance_plan",
			"finance_monitor_portfolio_drift",
			"finance_monitor_risk_budget",
			"finance_generate_client_review_packet",
			"finance_log_advisory_decision",
			"finance_generate_advisory_summary",
		]);
		expect(agent.state.systemPrompt).toContain(
			"finance_fetch_market_data -> finance_compute_indicators -> finance_generate_report",
		);
		expect(agent.state.systemPrompt).toContain("finance-analysis");
		expect(agent.state.systemPrompt).toContain("finance-investment-advisor");
		expect(agent.state.systemPrompt).toContain("finance-portfolio-advisor");
		expect(agent.state.systemPrompt).toContain("finance-client-onboarding");
		expect(agent.state.systemPrompt).toContain("finance-advisory-operations");
		expect(agent.state.systemPrompt).toContain("finance_generate_advisory_summary");
		expect(agent.state.model.provider).toBe("deepseek");
		expect(agent.state.model.id).toBe("deepseek-chat");
	});
});

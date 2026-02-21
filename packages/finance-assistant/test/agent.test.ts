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

	test("creates toolset with required three tools", () => {
		const tools = createFinanceToolset();
		expect(tools.map((tool) => tool.name)).toEqual([
			"finance_fetch_market_data",
			"finance_compute_indicators",
			"finance_generate_report",
		]);
	});

	test("creates finance agent with fallback sequence in system prompt", () => {
		const agent = createFinanceAgent();
		expect(agent.state.tools.map((tool) => tool.name)).toEqual([
			"finance_fetch_market_data",
			"finance_compute_indicators",
			"finance_generate_report",
		]);
		expect(agent.state.systemPrompt).toContain(
			"finance_fetch_market_data -> finance_compute_indicators -> finance_generate_report",
		);
		expect(agent.state.model.provider).toBe("deepseek");
		expect(agent.state.model.id).toBe("deepseek-chat");
	});
});

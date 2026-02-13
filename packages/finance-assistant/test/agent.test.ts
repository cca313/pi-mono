import { describe, expect, test } from "vitest";
import {
	createFinanceAnalyzeTool,
	FINANCE_DEFAULT_MODEL_ID,
	FINANCE_DEFAULT_PROVIDER,
	getFinanceDefaultModel,
	resolveFinanceModel,
} from "../src/agent.js";

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

	test("creates finance tool with default timeframe", () => {
		const tool = createFinanceAnalyzeTool();
		expect(tool.name).toBe("finance_analyze");
	});
});

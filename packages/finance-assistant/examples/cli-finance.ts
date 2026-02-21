import { createFinanceAgent } from "../src/index.js";

const prompt =
	process.argv.slice(2).join(" ") ||
	"Analyze AAPL on 1D. Use finance_fetch_market_data, then finance_compute_indicators, then " +
	"finance_generate_report. Return conclusion, key evidence, risk points, warnings, and confidence.";

const agent = createFinanceAgent();

agent.subscribe((event) => {
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

await agent.prompt(prompt);
process.stdout.write("\n");

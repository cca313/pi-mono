import { createFinanceAgent, YahooProvider } from "../src/index.js";

const prompt =
	process.argv.slice(2).join(" ") ||
	"Use finance_analyze to analyze AAPL on 1D timeframe. Return conclusion, key evidence, and risk points.";

const agent = createFinanceAgent({
	providers: [new YahooProvider()],
});

agent.subscribe((event) => {
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

await agent.prompt(prompt);
process.stdout.write("\n");

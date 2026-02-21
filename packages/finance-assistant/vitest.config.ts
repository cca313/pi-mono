import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@mariozechner/pi-agent-core": resolve(__dirname, "./test/stubs/pi-agent-core.ts"),
			"@mariozechner/pi-ai": resolve(__dirname, "./test/stubs/pi-ai.ts"),
		},
	},
});

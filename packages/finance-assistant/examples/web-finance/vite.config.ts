import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		alias: {
			"@mariozechner/pi-finance-assistant": path.resolve(__dirname, "../../src/index.ts"),
		},
	},
});

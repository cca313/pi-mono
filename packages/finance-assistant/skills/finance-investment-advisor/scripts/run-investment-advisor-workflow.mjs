import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function parseArgs(argv) {
	const parsed = {};
	for (let i = 0; i < argv.length; i++) {
		const current = argv[i];
		if (!current.startsWith("--")) {
			continue;
		}

		const key = current.slice(2);
		const next = argv[i + 1];
		if (!next || next.startsWith("--")) {
			parsed[key] = "true";
			continue;
		}

		parsed[key] = next;
		i++;
	}

	return parsed;
}

function resolveModulePath() {
	const scriptDir = dirname(fileURLToPath(import.meta.url));
	const packageRoot = resolve(scriptDir, "../../../");
	const distPath = resolve(packageRoot, "dist/index.js");
	if (!existsSync(distPath)) {
		throw new Error("dist/index.js not found. Run `npm run build -w @mariozechner/pi-finance-assistant` first.");
	}
	return distPath;
}

function resolveProviders(api) {
	const providers = [];
	if (process.env.FINNHUB_API_KEY) {
		providers.push(new api.FinnhubProvider(process.env.FINNHUB_API_KEY));
	}
	providers.push(new api.YahooProvider());
	if (process.env.ALPHA_VANTAGE_API_KEY) {
		providers.push(new api.AlphaVantageProvider(process.env.ALPHA_VANTAGE_API_KEY));
	}
	return providers;
}

function defaultProfile() {
	return {
		clientLabel: "Example Client",
		riskTolerance: "moderate",
		investmentHorizon: "long",
		objectives: ["growth", "diversification"],
		liquidityNeeds: "medium",
		accountTypes: ["taxable"],
	};
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const symbol = (args.symbol || "AAPL").toUpperCase();
	const timeframe = args.timeframe || "1D";
	const limit = args.limit ? Number(args.limit) : 200;
	const profile = args.profileJson ? JSON.parse(args.profileJson) : defaultProfile();

	if (!Number.isFinite(limit) || limit <= 0) {
		throw new Error(`Invalid --limit: ${args.limit}`);
	}

	const api = await import(pathToFileURL(resolveModulePath()).href);
	const providers = resolveProviders(api);
	const result = await api.runInvestmentAdvisorWorkflow({
		symbol,
		timeframe,
		limit,
		providers,
		profile,
	});

	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
	const reason = error instanceof Error ? error.message : String(error);
	process.stderr.write(`investment advisor workflow failed: ${reason}\n`);
	process.exitCode = 1;
});


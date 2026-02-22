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

function defaultProfile() {
	return {
		clientLabel: "Portfolio Example",
		riskTolerance: "moderate",
		investmentHorizon: "long",
		objectives: ["growth", "diversification"],
		liquidityNeeds: "medium",
		accountTypes: ["taxable", "ira"],
	};
}

function defaultPortfolio() {
	return {
		asOf: Date.now(),
		baseCurrency: "USD",
		accounts: [
			{
				accountId: "tax-1",
				accountType: "taxable",
				cashBalance: 5000,
				positions: [
					{
						symbol: "AAPL",
						quantity: 40,
						lastPrice: 190,
						sector: "Technology",
						taxLots: [
							{
								lotId: "aapl-1",
								quantity: 20,
								costBasisPerShare: 160,
								acquiredAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
							},
						],
					},
					{ symbol: "MSFT", quantity: 20, lastPrice: 410, sector: "Technology" },
				],
			},
			{
				accountId: "ira-1",
				accountType: "ira",
				cashBalance: 3000,
				positions: [{ symbol: "VOO", quantity: 30, lastPrice: 500, sector: "ETF" }],
			},
		],
	};
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const api = await import(pathToFileURL(resolveModulePath()).href);
	const profile = args.profileJson ? JSON.parse(args.profileJson) : defaultProfile();
	const portfolio = args.portfolioJson ? JSON.parse(args.portfolioJson) : defaultPortfolio();

	const result = await api.runPortfolioAdvisorWorkflow({
		profile,
		portfolio,
	});

	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
	const reason = error instanceof Error ? error.message : String(error);
	process.stderr.write(`portfolio advisor workflow failed: ${reason}\n`);
	process.exitCode = 1;
});


import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function resolveModulePath() {
	const scriptDir = dirname(fileURLToPath(import.meta.url));
	const packageRoot = resolve(scriptDir, "../../../");
	const distPath = resolve(packageRoot, "dist/index.js");
	if (!existsSync(distPath)) {
		throw new Error("dist/index.js not found. Run `npm run build -w @mariozechner/pi-finance-assistant` first.");
	}
	return distPath;
}

async function main() {
	const api = await import(pathToFileURL(resolveModulePath()).href);

	const result = await api.runAdvisoryOperationsWorkflow({
		profile: {
			clientLabel: "Operations Example",
			riskTolerance: "moderate",
			investmentHorizon: "long",
			objectives: ["growth", "diversification"],
			liquidityNeeds: "medium",
		},
		portfolio: {
		asOf: Date.now(),
		baseCurrency: "USD",
		accounts: [
			{
				accountId: "tax-1",
				accountType: "taxable",
				cashBalance: 2000,
				positions: [
					{ symbol: "AAPL", quantity: 40, lastPrice: 190, sector: "Technology" },
					{ symbol: "MSFT", quantity: 20, lastPrice: 410, sector: "Technology" },
				],
			},
		],
		},
		targetPolicy: { singlePositionMaxPct: 15, cashTargetRangePct: { min: 5, max: 15 } },
	});

	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
	const reason = error instanceof Error ? error.message : String(error);
	process.stderr.write(`advisory operations workflow failed: ${reason}\n`);
	process.exitCode = 1;
});

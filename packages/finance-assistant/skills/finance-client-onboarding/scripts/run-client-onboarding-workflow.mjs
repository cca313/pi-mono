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
	const result = await api.runClientOnboardingWorkflow({
		profile: {
			clientLabel: "Onboarding Example",
			riskTolerance: "moderate",
			investmentHorizon: "long",
			objectives: ["growth", "diversification"],
			liquidityNeeds: "medium",
		},
		goals: {
			planningHorizonYears: 12,
			goals: [{ label: "Retirement", targetAmount: 1200000, priority: "high" }],
			liquidityBufferPct: 8,
		},
	});

	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
	const reason = error instanceof Error ? error.message : String(error);
	process.stderr.write(`client onboarding workflow failed: ${reason}\n`);
	process.exitCode = 1;
});

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(testDir, "..");
const skillRoot = resolve(packageRoot, "skills/finance-analysis");
const skillFile = resolve(skillRoot, "SKILL.md");
const scriptFile = resolve(skillRoot, "scripts/run-workflow.mjs");
const referencesFile = resolve(skillRoot, "references/tool-contracts.md");
const packageJsonFile = resolve(packageRoot, "package.json");

function parseFrontmatter(markdown: string): Record<string, string> {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) {
		return {};
	}

	const fields: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const separatorIndex = line.indexOf(":");
		if (separatorIndex <= 0) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		const value = line.slice(separatorIndex + 1).trim();
		fields[key] = value;
	}

	return fields;
}

describe("finance skill package wiring", () => {
	test("skill frontmatter contains required name and description", () => {
		expect(existsSync(skillFile)).toBe(true);
		const content = readFileSync(skillFile, "utf-8");
		const frontmatter = parseFrontmatter(content);

		expect(frontmatter.name).toBe("finance-analysis");
		expect((frontmatter.description ?? "").length).toBeGreaterThan(0);
	});

	test("skill script and references exist", () => {
		expect(existsSync(scriptFile)).toBe(true);
		expect(existsSync(referencesFile)).toBe(true);
	});

	test("package.json declares pi.skills entry", () => {
		const packageJson = JSON.parse(readFileSync(packageJsonFile, "utf-8")) as {
			pi?: { skills?: string[] };
		};
		expect(packageJson.pi?.skills).toContain("./skills");
	});
});

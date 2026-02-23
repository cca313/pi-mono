import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(testDir, "..");
const skillsRoot = resolve(packageRoot, "skills");
const packageJsonFile = resolve(packageRoot, "package.json");

const expectedSkills = [
	{ dir: "finance-analysis", name: "finance-analysis" },
	{ dir: "finance-investment-advisor", name: "finance-investment-advisor" },
	{ dir: "finance-portfolio-advisor", name: "finance-portfolio-advisor" },
	{ dir: "finance-client-onboarding", name: "finance-client-onboarding" },
	{ dir: "finance-advisory-operations", name: "finance-advisory-operations" },
];

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
	test("all expected skills have frontmatter, scripts, and references", () => {
		for (const skill of expectedSkills) {
			const skillRoot = resolve(skillsRoot, skill.dir);
			const skillFile = resolve(skillRoot, "SKILL.md");
			const scriptsRoot = resolve(skillRoot, "scripts");
			const referencesFile = resolve(skillRoot, "references/tool-contracts.md");

			expect(existsSync(skillFile)).toBe(true);
			const content = readFileSync(skillFile, "utf-8");
			const frontmatter = parseFrontmatter(content);
			expect(frontmatter.name).toBe(skill.name);
			expect((frontmatter.description ?? "").length).toBeGreaterThan(0);

			expect(existsSync(referencesFile)).toBe(true);
			expect(existsSync(scriptsRoot)).toBe(true);
			const scripts = readdirSync(scriptsRoot).filter((entry) => {
				const path = resolve(scriptsRoot, entry);
				return statSync(path).isFile() && entry.endsWith(".mjs");
			});
			expect(scripts.length).toBeGreaterThan(0);
		}
	});

	test("package.json declares pi.skills entry", () => {
		const packageJson = JSON.parse(readFileSync(packageJsonFile, "utf-8")) as {
			pi?: { skills?: string[] };
		};
		expect(packageJson.pi?.skills).toContain("./skills");
	});
});

import { describe, expect, test } from "vitest";
import {
	FINANCE_ADVISORY_OPERATIONS_SKILL_NAME,
	FINANCE_ANALYSIS_SKILL_NAME,
	FINANCE_CLIENT_ONBOARDING_SKILL_NAME,
	FINANCE_INVESTMENT_ADVISOR_SKILL_NAME,
	FINANCE_PORTFOLIO_ADVISOR_SKILL_NAME,
	getFinanceSkillDescriptor,
	getFinanceSkillDescriptors,
} from "../src/skill.js";

describe("finance skill descriptor API", () => {
	test("returns all finance skills in stable order", () => {
		const skills = getFinanceSkillDescriptors();
		expect(skills.map((skill) => skill.name)).toEqual([
			FINANCE_ANALYSIS_SKILL_NAME,
			FINANCE_INVESTMENT_ADVISOR_SKILL_NAME,
			FINANCE_PORTFOLIO_ADVISOR_SKILL_NAME,
			FINANCE_CLIENT_ONBOARDING_SKILL_NAME,
			FINANCE_ADVISORY_OPERATIONS_SKILL_NAME,
		]);
		expect(skills.every((skill) => skill.relativePath.endsWith("SKILL.md"))).toBe(true);
	});

	test("keeps getFinanceSkillDescriptor backward-compatible", () => {
		expect(getFinanceSkillDescriptor()).toEqual(getFinanceSkillDescriptors()[0]);
	});
});

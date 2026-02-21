export const FINANCE_SKILL_NAME = "finance-analysis";
export const FINANCE_SKILL_RELATIVE_PATH = "skills/finance-analysis/SKILL.md";
export const FINANCE_SKILL_DESCRIPTION =
	"Three-step US equity workflow: finance_fetch_market_data -> finance_compute_indicators -> finance_generate_report.";

export interface FinanceSkillDescriptor {
	name: string;
	relativePath: string;
	description: string;
}

export function getFinanceSkillDescriptor(): FinanceSkillDescriptor {
	return {
		name: FINANCE_SKILL_NAME,
		relativePath: FINANCE_SKILL_RELATIVE_PATH,
		description: FINANCE_SKILL_DESCRIPTION,
	};
}

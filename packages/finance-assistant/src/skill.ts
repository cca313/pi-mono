export const FINANCE_ANALYSIS_SKILL_NAME = "finance-analysis";
export const FINANCE_ANALYSIS_SKILL_RELATIVE_PATH = "skills/finance-analysis/SKILL.md";
export const FINANCE_ANALYSIS_SKILL_DESCRIPTION =
	"Three-step US equity workflow: finance_fetch_market_data -> finance_compute_indicators -> finance_generate_report.";

export const FINANCE_INVESTMENT_ADVISOR_SKILL_NAME = "finance-investment-advisor";
export const FINANCE_INVESTMENT_ADVISOR_SKILL_RELATIVE_PATH = "skills/finance-investment-advisor/SKILL.md";
export const FINANCE_INVESTMENT_ADVISOR_SKILL_DESCRIPTION =
	"Single-symbol investment advisory workflow with suitability assessment and position strategy.";

export const FINANCE_PORTFOLIO_ADVISOR_SKILL_NAME = "finance-portfolio-advisor";
export const FINANCE_PORTFOLIO_ADVISOR_SKILL_RELATIVE_PATH = "skills/finance-portfolio-advisor/SKILL.md";
export const FINANCE_PORTFOLIO_ADVISOR_SKILL_DESCRIPTION =
	"Portfolio review workflow with stress testing and rebalance planning.";

export const FINANCE_CLIENT_ONBOARDING_SKILL_NAME = "finance-client-onboarding";
export const FINANCE_CLIENT_ONBOARDING_SKILL_RELATIVE_PATH = "skills/finance-client-onboarding/SKILL.md";
export const FINANCE_CLIENT_ONBOARDING_SKILL_DESCRIPTION =
	"Client onboarding workflow with profile capture, goals capture, and IPS generation.";

export const FINANCE_ADVISORY_OPERATIONS_SKILL_NAME = "finance-advisory-operations";
export const FINANCE_ADVISORY_OPERATIONS_SKILL_RELATIVE_PATH = "skills/finance-advisory-operations/SKILL.md";
export const FINANCE_ADVISORY_OPERATIONS_SKILL_DESCRIPTION =
	"Ongoing advisory operations workflow for drift/risk monitoring, client review packets, decision logging, and summary publishing.";

// Backward-compatible aliases for existing callers.
export const FINANCE_SKILL_NAME = FINANCE_ANALYSIS_SKILL_NAME;
export const FINANCE_SKILL_RELATIVE_PATH = FINANCE_ANALYSIS_SKILL_RELATIVE_PATH;
export const FINANCE_SKILL_DESCRIPTION = FINANCE_ANALYSIS_SKILL_DESCRIPTION;

export interface FinanceSkillDescriptor {
	name: string;
	relativePath: string;
	description: string;
}

export function getFinanceSkillDescriptors(): FinanceSkillDescriptor[] {
	return [
		{
			name: FINANCE_ANALYSIS_SKILL_NAME,
			relativePath: FINANCE_ANALYSIS_SKILL_RELATIVE_PATH,
			description: FINANCE_ANALYSIS_SKILL_DESCRIPTION,
		},
		{
			name: FINANCE_INVESTMENT_ADVISOR_SKILL_NAME,
			relativePath: FINANCE_INVESTMENT_ADVISOR_SKILL_RELATIVE_PATH,
			description: FINANCE_INVESTMENT_ADVISOR_SKILL_DESCRIPTION,
		},
		{
			name: FINANCE_PORTFOLIO_ADVISOR_SKILL_NAME,
			relativePath: FINANCE_PORTFOLIO_ADVISOR_SKILL_RELATIVE_PATH,
			description: FINANCE_PORTFOLIO_ADVISOR_SKILL_DESCRIPTION,
		},
		{
			name: FINANCE_CLIENT_ONBOARDING_SKILL_NAME,
			relativePath: FINANCE_CLIENT_ONBOARDING_SKILL_RELATIVE_PATH,
			description: FINANCE_CLIENT_ONBOARDING_SKILL_DESCRIPTION,
		},
		{
			name: FINANCE_ADVISORY_OPERATIONS_SKILL_NAME,
			relativePath: FINANCE_ADVISORY_OPERATIONS_SKILL_RELATIVE_PATH,
			description: FINANCE_ADVISORY_OPERATIONS_SKILL_DESCRIPTION,
		},
	];
}

export function getFinanceSkillDescriptor(): FinanceSkillDescriptor {
	return getFinanceSkillDescriptors()[0];
}

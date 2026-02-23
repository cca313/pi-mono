import type { AdvisoryCoverage, ClientGoals } from "./types.js";

export interface BuildClientGoalsOutput {
	goals: ClientGoals;
	coverage: AdvisoryCoverage;
	warnings: string[];
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function normalizeClientGoals(goals: ClientGoals): BuildClientGoalsOutput {
	const warnings: string[] = [];
	const normalizedGoals = goals.goals.map((goal, index) => ({
		...goal,
		goalId: goal.goalId ?? `goal-${index + 1}`,
		label: goal.label.trim(),
		notes: goal.notes?.trim(),
		priority: goal.priority ?? "medium",
	}));

	const targetRange = goals.targetReturnRangePct
		? {
				min: clamp(Math.min(goals.targetReturnRangePct.min, goals.targetReturnRangePct.max), 0, 100),
				max: clamp(Math.max(goals.targetReturnRangePct.min, goals.targetReturnRangePct.max), 0, 100),
			}
		: undefined;

	if (normalizedGoals.some((goal) => goal.label.length === 0)) {
		warnings.push("Some financial goals had empty labels after trimming.");
	}

	const goalsWithTargetDate = normalizedGoals.filter((goal) => typeof goal.targetDate === "number").length;
	if (goalsWithTargetDate === 0) {
		warnings.push("No target date provided in goals; planning horizon confidence is reduced.");
	}

	const normalized: ClientGoals = {
		planningHorizonYears: goals.planningHorizonYears,
		targetReturnRangePct: targetRange,
		maxLossTolerancePct: goals.maxLossTolerancePct,
		liquidityBufferPct: goals.liquidityBufferPct,
		goals: normalizedGoals,
		cashFlowPlan: goals.cashFlowPlan,
		restrictions: goals.restrictions?.map((restriction) => ({
			...restriction,
			kind: restriction.kind.trim(),
			value: restriction.value?.trim(),
			note: restriction.note?.trim(),
		})),
		notes: goals.notes?.trim(),
	};

	const coverage: AdvisoryCoverage = warnings.length > 0 ? "partial" : "full";
	return { goals: normalized, coverage, warnings };
}

import { Type } from "@sinclair/typebox";

export const advisoryCoverageSchema = Type.Union(
	[Type.Literal("placeholder"), Type.Literal("partial"), Type.Literal("full")],
	{ description: "Data coverage level for advisory output" },
);

export const riskToleranceSchema = Type.Union(
	[Type.Literal("conservative"), Type.Literal("moderate"), Type.Literal("aggressive")],
	{ description: "Investor risk tolerance" },
);

export const investmentHorizonSchema = Type.Union(
	[Type.Literal("short"), Type.Literal("medium"), Type.Literal("long")],
	{ description: "Investor time horizon" },
);

export const investmentObjectiveSchema = Type.Union([
	Type.Literal("income"),
	Type.Literal("growth"),
	Type.Literal("capital-preservation"),
	Type.Literal("speculation"),
	Type.Literal("diversification"),
]);

export const liquidityNeedsSchema = Type.Union([Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")], {
	description: "Liquidity needs",
});

export const accountTypeSchema = Type.Union(
	[Type.Literal("taxable"), Type.Literal("ira"), Type.Literal("roth"), Type.Literal("401k"), Type.Literal("other")],
	{ description: "Account type" },
);

export const investorRestrictionSchema = Type.Object({
	kind: Type.String({ description: "Restriction type, e.g. sector-ban" }),
	value: Type.Optional(Type.String()),
	note: Type.Optional(Type.String()),
});

export const investorTaxProfileSchema = Type.Object({
	federalBracketPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	stateBracketPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	shortTermGainSensitive: Type.Optional(Type.Boolean()),
	longTermGainSensitive: Type.Optional(Type.Boolean()),
	prefersTaxLossHarvesting: Type.Optional(Type.Boolean()),
});

export const investorProfileSchema = Type.Object({
	clientLabel: Type.Optional(Type.String()),
	riskTolerance: riskToleranceSchema,
	investmentHorizon: investmentHorizonSchema,
	objectives: Type.Array(investmentObjectiveSchema, { minItems: 1 }),
	liquidityNeeds: liquidityNeedsSchema,
	maxDrawdownTolerancePct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	accountTypes: Type.Optional(Type.Array(accountTypeSchema)),
	restrictions: Type.Optional(Type.Array(investorRestrictionSchema)),
	taxProfile: Type.Optional(investorTaxProfileSchema),
	notes: Type.Optional(Type.String()),
});

export const portfolioTaxLotSchema = Type.Object({
	lotId: Type.String(),
	quantity: Type.Number({ exclusiveMinimum: 0 }),
	costBasisPerShare: Type.Number({ exclusiveMinimum: 0 }),
	acquiredAt: Type.Number(),
});

export const portfolioPositionSchema = Type.Object({
	symbol: Type.String(),
	quantity: Type.Number({ exclusiveMinimum: 0 }),
	lastPrice: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
	marketValue: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
	avgCost: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
	sector: Type.Optional(Type.String()),
	targetWeight: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
	maxWeight: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
	taxLots: Type.Optional(Type.Array(portfolioTaxLotSchema)),
});

export const portfolioFeesSchema = Type.Object({
	commissionPerTrade: Type.Optional(Type.Number({ minimum: 0 })),
	slippageBps: Type.Optional(Type.Number({ minimum: 0 })),
});

export const portfolioAccountSchema = Type.Object({
	accountId: Type.String(),
	accountType: accountTypeSchema,
	cashBalance: Type.Number(),
	fees: Type.Optional(portfolioFeesSchema),
	restrictions: Type.Optional(Type.Array(investorRestrictionSchema)),
	positions: Type.Array(portfolioPositionSchema),
});

export const portfolioSnapshotSchema = Type.Object({
	asOf: Type.Number(),
	baseCurrency: Type.Optional(Type.String({ default: "USD" })),
	accounts: Type.Array(portfolioAccountSchema, { minItems: 1 }),
});

export const fundamentalsSectionSchema = Type.Union(
	[Type.Literal("valuation"), Type.Literal("profitability"), Type.Literal("growth"), Type.Literal("balance-sheet")],
	{ description: "Fundamentals section" },
);

export const fundamentalsSnapshotSchema = Type.Object({
	symbol: Type.String(),
	asOf: Type.Number(),
	sections: Type.Record(Type.String(), Type.Record(Type.String(), Type.Unknown())),
});

export const positionContextSchema = Type.Object({
	isExistingPosition: Type.Optional(Type.Boolean()),
	currentExposurePct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	accountType: Type.Optional(accountTypeSchema),
	unrealizedGainPct: Type.Optional(Type.Number()),
});

export const positionStrategyAccountContextSchema = Type.Object({
	accountType: Type.Optional(accountTypeSchema),
	accountId: Type.Optional(Type.String()),
	cashAvailable: Type.Optional(Type.Number({ minimum: 0 })),
});

export const executionConstraintsSchema = Type.Object({
	minTradeValue: Type.Optional(Type.Number({ minimum: 0 })),
	avoidSelling: Type.Optional(Type.Boolean()),
	blacklistSymbols: Type.Optional(Type.Array(Type.String())),
	noMargin: Type.Optional(Type.Boolean()),
});

export const benchmarkPolicySchema = Type.Object({
	minCashPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	maxCashPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	singlePositionMaxPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	sectorMaxPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
});

export const stressShockSchema = Type.Object({
	targetType: Type.Union([Type.Literal("symbol"), Type.Literal("sector"), Type.Literal("market-bucket")]),
	target: Type.String(),
	pctChange: Type.Number(),
});

export const portfolioStressScenarioSchema = Type.Object({
	name: Type.String(),
	shocks: Type.Array(stressShockSchema, { minItems: 1 }),
});

export const rangePctSchema = Type.Object({
	min: Type.Number({ minimum: 0, maximum: 100 }),
	max: Type.Number({ minimum: 0, maximum: 100 }),
});

export const positionTargetPolicySchema = Type.Object({
	symbol: Type.String(),
	targetWeightPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	minWeightPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	maxWeightPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
});

export const targetPolicySchema = Type.Object({
	cashTargetRangePct: Type.Optional(rangePctSchema),
	singlePositionMaxPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	sectorMaxPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	positionTargets: Type.Optional(Type.Array(positionTargetPolicySchema)),
});

export const rebalanceConstraintsSchema = Type.Object({
	minTradeValue: Type.Optional(Type.Number({ minimum: 0 })),
	blacklistSymbols: Type.Optional(Type.Array(Type.String())),
	noSellSymbols: Type.Optional(Type.Array(Type.String())),
	allowTaxableSales: Type.Optional(Type.Boolean()),
});

export const riskProfileTierSchema = riskToleranceSchema;

export const financialGoalSchema = Type.Object({
	goalId: Type.Optional(Type.String()),
	label: Type.String(),
	targetAmount: Type.Optional(Type.Number({ minimum: 0 })),
	currentAmount: Type.Optional(Type.Number({ minimum: 0 })),
	targetDate: Type.Optional(Type.Number()),
	priority: Type.Optional(Type.Union([Type.Literal("high"), Type.Literal("medium"), Type.Literal("low")])),
	notes: Type.Optional(Type.String()),
});

export const cashFlowPlanSchema = Type.Object({
	monthlyContribution: Type.Optional(Type.Number({ minimum: 0 })),
	monthlyWithdrawal: Type.Optional(Type.Number({ minimum: 0 })),
	emergencyFundMonths: Type.Optional(Type.Number({ minimum: 0 })),
});

export const clientGoalsSchema = Type.Object({
	planningHorizonYears: Type.Optional(Type.Number({ minimum: 1, maximum: 80 })),
	targetReturnRangePct: Type.Optional(rangePctSchema),
	maxLossTolerancePct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	liquidityBufferPct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
	goals: Type.Array(financialGoalSchema, { minItems: 1 }),
	cashFlowPlan: Type.Optional(cashFlowPlanSchema),
	restrictions: Type.Optional(Type.Array(investorRestrictionSchema)),
	notes: Type.Optional(Type.String()),
});

export const driftBreachKindSchema = Type.Union([Type.Literal("position"), Type.Literal("cash")]);

export const riskSeveritySchema = Type.Union([Type.Literal("info"), Type.Literal("warning"), Type.Literal("critical")]);

export const riskBudgetThresholdsSchema = Type.Object({
	maxSinglePositionPct: Type.Number({ minimum: 0, maximum: 100 }),
	maxSectorPct: Type.Number({ minimum: 0, maximum: 100 }),
	maxVolatilityAnnualized: Type.Number({ minimum: 0 }),
	maxDrawdownPct: Type.Number({ minimum: 0, maximum: 100 }),
	minCashPct: Type.Number({ minimum: 0, maximum: 100 }),
	maxCashPct: Type.Number({ minimum: 0, maximum: 100 }),
	maxStressLossPct: Type.Number({ minimum: 0, maximum: 100 }),
});

export const riskThresholdTemplateSchema = Type.Object({
	templateId: Type.String(),
	version: Type.String(),
	tiers: Type.Object({
		conservative: riskBudgetThresholdsSchema,
		moderate: riskBudgetThresholdsSchema,
		aggressive: riskBudgetThresholdsSchema,
	}),
	notes: Type.Optional(Type.String()),
});

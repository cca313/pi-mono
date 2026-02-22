# Tool Contracts (Investment Advisor)

## Required Tools

- `finance_fetch_market_data(symbol, timeframe?, limit?)`
- `finance_compute_indicators(analysisId)`
- `finance_generate_report(analysisId)`
- `finance_fetch_fundamentals(symbol, requestedSections?, providerPreference?, allowPlaceholder?)`
- `finance_capture_investor_profile(profile)`
- `finance_assess_investment_suitability(analysisId, profile|profileId, fundamentals?|fundamentalsId?)`
- `finance_plan_position_strategy(analysisId, profile|profileId or assessmentId, ...)`

## Important Rules

- `profile` and `profileId`: at least one is required for advisory tools.
- If both direct object and id are supplied, direct object takes priority.
- `fundamentals` and `fundamentalsId`: direct object takes priority when both are present.
- `finance_fetch_fundamentals` may return `coverage = "placeholder"` instead of throwing (default behavior).

## Key Outputs

- `finance_assess_investment_suitability` -> `assessmentId`, `suitability.fitLevel`, `coverage`, `warnings`
- `finance_plan_position_strategy` -> `positionPlanId`, `positionPlan.suggestedExposureRangePct`, condition lists, tax notes


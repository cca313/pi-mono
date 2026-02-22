# Tool Contracts (Portfolio Advisor)

## Required Tools

- `finance_capture_investor_profile(profile)`
- `finance_capture_portfolio_snapshot(portfolio)`
- `finance_review_portfolio(portfolio|portfolioId, profile?|profileId?, benchmarkPolicy?)`
- `finance_run_portfolio_stress_test(portfolio|portfolioId, scenarios?, pricingMode?)`
- `finance_generate_rebalance_plan(portfolio|portfolioId, profile?|profileId?, portfolioReviewId?, stressTestId?, targetPolicy?, rebalanceConstraints?)`

## Important Rules

- `portfolio` and `portfolioId`: at least one is required for portfolio tools.
- If both direct object and id are supplied, direct object takes priority.
- `finance_generate_rebalance_plan` can compute inline fallback review/stress results if ids are omitted, but should disclose that behavior.
- Stress test uses a simplified placeholder shock model (`pricingMode = "simple-shock"`).

## Key Outputs

- `finance_review_portfolio` -> `portfolioReviewId`, findings arrays, `priorityActions`
- `finance_run_portfolio_stress_test` -> `stressTestId`, `worstScenario`, `keyVulnerabilities`
- `finance_generate_rebalance_plan` -> `rebalancePlanId`, `targetRanges`, `tradePriorityQueue`, `taxImpactNotes`, `executionConditions`


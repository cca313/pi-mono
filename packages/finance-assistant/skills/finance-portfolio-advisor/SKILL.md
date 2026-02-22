---
name: finance-portfolio-advisor
description: >-
  Run a portfolio advisory workflow with investor profile capture, portfolio
  review, stress testing, and rebalance planning. Optionally add fundamentals
  lookups for concentrated holdings and disclose coverage.
---

# Finance Portfolio Advisor

Use this skill for portfolio-level advisory requests (allocation review, stress tests, rebalance planning).

## Required Flow

1. Call `finance_capture_investor_profile` if no reusable `profileId` is provided.
2. Call `finance_capture_portfolio_snapshot` if no reusable `portfolioId` is provided.
3. Call `finance_review_portfolio`.
4. Call `finance_run_portfolio_stress_test`.
5. Call `finance_generate_rebalance_plan`.
6. If the user explicitly asks for fundamentals context, attempt `finance_fetch_fundamentals` for concentrated holdings and disclose coverage.
7. Respond with main risks, worst stress scenario, rebalance priority queue, tax notes, execution conditions, coverage, and disclaimer.

Do not skip steps. If a tool fails, explain the failure and the next recovery action.

## Input Requirements

- Portfolio snapshot is required (`portfolio` or `portfolioId`).
- Investor profile is recommended; if missing, explicitly state assumptions and reduced confidence.
- Tax lot guidance is warning-only (no tax optimization solver).

## Output Requirements

- Use a "range and conditions" style for rebalance actions (prioritized queue + execution conditions).
- Include stress test coverage and any placeholder methodology warnings.
- Include the research-only disclaimer ("not investment advice").

## Script Mode

For deterministic local execution without agent tool-calling:

```bash
node scripts/run-portfolio-advisor-workflow.mjs
```

See [tool contracts](references/tool-contracts.md) for exact parameters and details shape.


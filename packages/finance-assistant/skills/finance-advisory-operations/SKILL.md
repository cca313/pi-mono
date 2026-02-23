---
name: finance-advisory-operations
description: >-
  Run ongoing advisory operations: monitor portfolio drift and risk budget,
  generate a client review packet, log final advisory decisions, and publish
  a consolidated advisory summary.
---

# Finance Advisory Operations

Use this skill for ongoing advisor operations (weekly/monthly/quarterly monitoring and client communication).

## Required Flow

1. Call `finance_monitor_portfolio_drift`.
2. Call `finance_monitor_risk_budget`.
3. Call `finance_generate_client_review_packet`.
4. Call `finance_log_advisory_decision`.
5. Call `finance_generate_advisory_summary`.
6. Respond with risk triggers, drift priorities, client-facing actions, assumptions, and disclaimer.

Do not skip steps. If a tool fails, explain the failure and the next recovery action.

## Input Requirements

- Portfolio data is required (`portfolio` or `portfolioId`).
- Risk tier defaults to `moderate` if neither `riskTier` nor profile is supplied.
- If analysis/stress context is missing, explicitly disclose reduced confidence.

## Output Requirements

- Use range-and-conditions style with clear trigger thresholds.
- Include data coverage and placeholder warnings.
- Include the research-only disclaimer ("not investment advice").

## Script Mode

For deterministic local execution without agent tool-calling:

```bash
node scripts/run-advisory-operations-workflow.mjs
```

See [tool contracts](references/tool-contracts.md) for exact parameters and details shape.

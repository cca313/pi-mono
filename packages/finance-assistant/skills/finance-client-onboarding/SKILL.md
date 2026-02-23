---
name: finance-client-onboarding
description: >-
  Run a client onboarding workflow: investor profile capture, goal capture,
  and investment policy statement generation with assumptions/disclosure.
---

# Finance Client Onboarding

Use this skill for new-client onboarding or major objective/risk-profile updates.

## Required Flow

1. Call `finance_capture_investor_profile`.
2. Call `finance_capture_client_goals`.
3. Call `finance_build_investment_policy_statement`.
4. If current holdings are relevant, call `finance_capture_portfolio_snapshot` and regenerate IPS with portfolio context.
5. Respond with IPS highlights: risk tier, return range, drawdown guardrails, cash range, constraints, assumptions, and disclaimer.

Do not skip steps. If a tool fails, explain the failure and the next recovery action.

## Input Requirements

- Investor profile is required (`profile` or `profileId`).
- Client goals are required (`goals` or `goalsId`).
- If portfolio context is omitted, disclose that IPS checks did not validate current allocation drift.

## Output Requirements

- Use range-and-conditions language; avoid deterministic buy/sell instructions.
- Explicitly disclose assumptions and missing inputs.
- Include the research-only disclaimer ("not investment advice").

## Script Mode

For deterministic local execution without agent tool-calling:

```bash
node scripts/run-client-onboarding-workflow.mjs
```

See [tool contracts](references/tool-contracts.md) for exact parameters and details shape.

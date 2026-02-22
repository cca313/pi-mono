---
name: finance-investment-advisor
description: >-
  Run a single-symbol advisory workflow using technical analysis, fundamentals
  (with placeholder fallback), investor profile capture, suitability assessment,
  and position strategy planning.
---

# Finance Investment Advisor

Use this skill for single-symbol investment advisory requests (US equities / ETFs).

## Required Flow

1. Call `finance_fetch_market_data`.
2. Call `finance_compute_indicators`.
3. Call `finance_generate_report`.
4. Call `finance_fetch_fundamentals` (must attempt; continue on placeholder coverage).
5. Call `finance_capture_investor_profile` if the user did not provide a reusable `profileId`.
6. Call `finance_assess_investment_suitability`.
7. Call `finance_plan_position_strategy`.
8. Respond with fit conclusion, exposure range, entry/add/trim/exit conditions, invalidating signals, risks, coverage, and disclaimer.

Do not skip steps. If a tool fails, explain the failure and the next recovery action.

## Input Requirements

- Investor profile is required (`profile` or `profileId`).
- The final answer must disclose missing profile fields or assumptions.
- If fundamentals coverage is `placeholder` or `partial`, explicitly state that the advisory result has reduced confidence.

## Output Requirements

- Use a "range and conditions" style, not deterministic trade instructions.
- Include key uncertainty and coverage level (`placeholder` / `partial` / `full`).
- Include the research-only disclaimer ("not investment advice").

## Script Mode

For deterministic local execution without agent tool-calling:

```bash
node scripts/run-investment-advisor-workflow.mjs --symbol AAPL --timeframe 1D --limit 200
```

See [tool contracts](references/tool-contracts.md) for exact parameters and details shape.


---
name: finance-analysis
description: >-
  Analyze US stocks with a strict three-step flow using finance_fetch_market_data,
  finance_compute_indicators, and finance_generate_report, then summarize risks and uncertainty.
---

# Finance Analysis

Use this skill for US equity technical analysis requests.

## Required Flow

1. Call `finance_fetch_market_data` with `symbol`, optional `timeframe`, optional `limit`.
2. Call `finance_compute_indicators` with the returned `analysisId`.
3. Call `finance_generate_report` with the same `analysisId`.
4. Respond with conclusion, key evidence, risk points, confidence, disclaimer, and warnings.

Do not skip steps. If a tool fails, explain the failure and next recovery action.

## Output Requirements

- Always include material risks and uncertainty.
- Include data source (`sourceUsed`) and warnings from the report details.
- Treat all output as research/education only, not investment advice.

## Script Mode

For deterministic local execution without agent tool-calling:

```bash
node scripts/run-workflow.mjs --symbol AAPL --timeframe 1D --limit 200
```

See [tool contracts](references/tool-contracts.md) for exact parameters and details shape.

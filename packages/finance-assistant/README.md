# pi-finance-assistant

Isolated finance analysis + investment advisory toolkit for US equities / ETFs with explicit Agent / Tool / Skill layering.

## Scope and Isolation

- This package is finance domain core (`providers`, `indicators`, `report`, `workflow`, `tools`, `advisory`).
- It creates a finance-focused `Agent` with DeepSeek default model.
- It does not change default behavior of `packages/coding-agent` or `packages/web-ui/example`.
- Outputs are for research/education only and must not be presented as investment advice.

## Architecture

- Agent layer:
  - `createFinanceAgent()`
  - Attaches analysis + advisory tools by default
  - Uses a fallback system prompt for skill/tool ordering
- Tool layer:
  - Analysis chain uses `analysisId` workflow cache
  - Advisory chain uses `FinanceAdvisoryStore` artifact cache (`profileId`, `portfolioId`, etc.)
- Skill layer:
  - `skills/finance-analysis/`
  - `skills/finance-investment-advisor/`
  - `skills/finance-portfolio-advisor/`
  - Declared via `pi.skills`

## Tools (Default Toolset)

Analysis chain:

1. `finance_fetch_market_data`
2. `finance_compute_indicators`
3. `finance_generate_report`

Advisory chain (single-symbol + portfolio):

4. `finance_capture_investor_profile`
5. `finance_capture_portfolio_snapshot`
6. `finance_fetch_fundamentals`
7. `finance_assess_investment_suitability`
8. `finance_plan_position_strategy`
9. `finance_review_portfolio`
10. `finance_run_portfolio_stress_test`
11. `finance_generate_rebalance_plan`

Advisor operations + onboarding:

12. `finance_capture_client_goals`
13. `finance_build_investment_policy_statement`
14. `finance_monitor_portfolio_drift`
15. `finance_monitor_risk_budget` (built-in risk tiers: conservative / moderate / aggressive)
16. `finance_generate_client_review_packet`
17. `finance_log_advisory_decision`
18. `finance_generate_advisory_summary`

## Coverage / Placeholder Semantics

Advisory outputs include:

- `coverage`: `"placeholder" | "partial" | "full"`
- `warnings`: details about missing data, placeholder logic, or degraded assumptions

Current limitation (intentional for framework-first rollout):

- Fundamentals provider interfaces are wired for Finnhub / Yahoo / Alpha Vantage, but fundamentals fetch may still return `coverage="partial"` or fall back to `coverage="placeholder"` when requested sections are missing or providers fail.
- Stress test / rebalance logic uses simplified placeholder methodology (shock model, no tax-lot optimization solver).

## Fundamentals Data Notes

- `finance_fetch_fundamentals` attempts provider routing and returns `sourceUsed`, `coverage`, and `missingSections`.
- It also returns:
  - `fundamentals` (raw provider-mapped fields)
  - `fundamentalsNormalized` (canonical field names where supported)
  - `fundamentalsFieldMetadata` (source field + normalized unit metadata)
- `coverage="full"` means all requested sections were present in the selected provider response.
- `coverage="partial"` means at least one requested section was missing (check `missingSections`).
- `coverage="placeholder"` means no provider result was available and a fallback envelope was returned.
- `fundamentalsNormalized` currently standardizes common ratio/percent-like fields to canonical names (e.g. `peRatio`, `revenueGrowth`, `profitMargin`).
- Percent-like growth/margin fields in `fundamentalsNormalized` use fraction scale when recognizable (e.g. `0.24` = 24%).
- Normalization coverage is best-effort; always interpret fundamentals together with `sourceUsed`, `coverage`, and `fundamentalsFieldMetadata`.

## Skills

- `skills/finance-analysis/SKILL.md`
- `skills/finance-investment-advisor/SKILL.md`
- `skills/finance-portfolio-advisor/SKILL.md`
- `skills/finance-client-onboarding/SKILL.md`
- `skills/finance-advisory-operations/SKILL.md`

Script mode examples:

```bash
node skills/finance-analysis/scripts/run-workflow.mjs --symbol AAPL --timeframe 1D --limit 200
node skills/finance-investment-advisor/scripts/run-investment-advisor-workflow.mjs --symbol AAPL --timeframe 1D --limit 200
node skills/finance-portfolio-advisor/scripts/run-portfolio-advisor-workflow.mjs
node skills/finance-client-onboarding/scripts/run-client-onboarding-workflow.mjs
node skills/finance-advisory-operations/scripts/run-advisory-operations-workflow.mjs
```

## Public API

Key exports include:

- `createFinanceToolset(options?)`
- `createFinanceAgent(options?)`
- `runFinanceWorkflow(input)`
- `runInvestmentAdvisorWorkflow(input)`
- `runPortfolioAdvisorWorkflow(input)`
- `runClientOnboardingWorkflow(input)`
- `runAdvisoryOperationsWorkflow(input)`
- `buildAdvisorySummary(input)`
- `resolveFinanceModel(provider?, modelId?)`
- advisory pure functions/types via `src/advisory/*`
- `getFinanceSkillDescriptor()` (backward compatible, returns `finance-analysis`)
- `getFinanceSkillDescriptors()` (all finance skills)

## Default Model

- Provider: `deepseek`
- Model: `deepseek-chat`

Override via environment variables:

- `FINANCE_PROVIDER`
- `FINANCE_MODEL`

## Fallback Tool Sequences (When Skills Are Unavailable)

Technical analysis:

1. `finance_fetch_market_data`
2. `finance_compute_indicators`
3. `finance_generate_report`

Single-symbol advisory:

1. Analysis chain above
2. `finance_fetch_fundamentals`
3. `finance_capture_investor_profile`
4. `finance_assess_investment_suitability`
5. `finance_plan_position_strategy`

Portfolio advisory:

1. `finance_capture_investor_profile`
2. `finance_capture_portfolio_snapshot`
3. `finance_review_portfolio`
4. `finance_run_portfolio_stress_test`
5. `finance_generate_rebalance_plan`

Advisory operations:

1. `finance_monitor_portfolio_drift`
2. `finance_monitor_risk_budget`
3. `finance_generate_client_review_packet`
4. `finance_log_advisory_decision`
5. `finance_generate_advisory_summary`

Always include risks, uncertainty, coverage, and the research-only disclaimer.

## Quick Start

Run tests:

```bash
npm run test -w @mariozechner/pi-finance-assistant
```

Run isolated CLI demo (default provider chain: `FINNHUB_API_KEY` -> `yahoo` -> `ALPHA_VANTAGE_API_KEY`):

```bash
npm run example:cli -w @mariozechner/pi-finance-assistant -- "Analyze AAPL on 1D and list risks"
npm run example:cli -w @mariozechner/pi-finance-assistant -- "As an investment advisor, assess AAPL for a moderate long-term investor and propose a position range"
```

Deterministic workflow CLI (structured output + export):

```bash
npm run example:workflow -w @mariozechner/pi-finance-assistant -- --workflow onboarding --mode json --export bundle
npm run example:workflow -w @mariozechner/pi-finance-assistant -- --workflow operations --mode ndjson --export bundle
npm run example:workflow -w @mariozechner/pi-finance-assistant -- --workflow operations --mode json --output ./finance-summary.json
```

Supported deterministic flags:

- `--workflow agent|onboarding|operations|symbol-advice`
- `--mode text|json|ndjson`
- `--export none|bundle`
- `--report none|compliance` with `--reportFormat json|markdown`
- `--output <path>`
- `--profileJson <json>` / `--goalsJson <json>` / `--portfolioJson <json>` / `--riskTier conservative|moderate|aggressive`
- `--riskTemplateJson <json>` to override built-in threshold templates at runtime

Risk template notes:

- Built-in template registry defaults are exported from `src/advisory/risk-template-registry.ts`.
- Static baseline template file: `config/risk-templates/default.json`.
- `finance_monitor_risk_budget` supports template overrides and returns `templateId/templateVersion` in `riskMonitor`.
- `buildAdvisorySummary` surfaces template metadata in `summary.monitoring.riskTemplateId/riskTemplateVersion`.

Troubleshooting:

- `PROVIDERS_FAILED`: quote providers unavailable (check network/API keys).
- `FUNDAMENTALS_PROVIDERS_FAILED`: fundamentals providers unavailable and placeholder fallback disabled.
- `coverage="placeholder"`: expected when fundamentals support is not implemented or unavailable.

Productization runbook:

- `docs/finance-productization.md`

Run isolated web demo:

```bash
npm run dev --prefix packages/finance-assistant/examples/web-finance
```

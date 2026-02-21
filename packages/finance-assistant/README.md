# pi-finance-assistant

Isolated finance-analysis toolkit for US equities with explicit Agent / Tool / Skill layering.

## Scope and Isolation

- This package is finance domain core (`providers`, `indicators`, `report`, `workflow`, `tools`).
- It creates a finance-focused `Agent` with DeepSeek default model.
- It does not change default behavior of `packages/coding-agent` or `packages/web-ui/example`.

## Architecture

- Agent layer:
  - `createFinanceAgent()`
  - Attaches three tools by default
  - Uses a fallback system prompt for tool ordering
- Tool layer:
  - `finance_fetch_market_data`
  - `finance_compute_indicators`
  - `finance_generate_report`
  - Uses `analysisId` workflow cache to chain calls
- Skill layer:
  - `skills/finance-analysis/SKILL.md`
  - Declared in package manifest via `pi.skills`
  - Includes script mode and reference contracts

## Public API

Breaking changes:

- Removed: `createFinanceAnalyzeTool`, `analyzeSymbol`
- Added:
  - `createFinanceToolset(options?)`
  - `runFinanceWorkflow(input)`
  - `createFinanceAgent(options?)`
  - `resolveFinanceModel(provider?, modelId?)`
  - `FinanceToolsetOptions`
  - `RunFinanceWorkflowInput`
  - `RunFinanceWorkflowResult`
  - `FinanceMarketData`
  - `FinanceIndicatorData`

## Default Model

- Provider: `deepseek`
- Model: `deepseek-chat`

Override via environment variables:

- `FINANCE_PROVIDER`
- `FINANCE_MODEL`

## Tool Sequence

Default sequence when skill is unavailable:

1. `finance_fetch_market_data`
2. `finance_compute_indicators`
3. `finance_generate_report`

The final answer should always include risks and uncertainty.

## Skill

Skill root:

- `skills/finance-analysis/SKILL.md`

Script mode (deterministic workflow run):

```bash
node skills/finance-analysis/scripts/run-workflow.mjs --symbol AAPL --timeframe 1D --limit 200
```

## Quick Start

Run tests:

```bash
npm run test -w @mariozechner/pi-finance-assistant
```

Run isolated CLI demo (default provider chain: `FINNHUB_API_KEY` -> `yahoo` -> `ALPHA_VANTAGE_API_KEY`):

```bash
npm run example:cli -w @mariozechner/pi-finance-assistant -- "Analyze AAPL on 1D and list risks"
```

Troubleshooting:

- If you see `PROVIDERS_FAILED`, check network access and whether `FINNHUB_API_KEY` / `ALPHA_VANTAGE_API_KEY` are configured correctly.

Run isolated web demo:

```bash
npm run dev --prefix packages/finance-assistant/examples/web-finance
```

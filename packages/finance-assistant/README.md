# pi-finance-assistant

Isolated finance-analysis toolkit for US equities.

## Scope and Isolation

- This package is the finance domain core (`providers`, `indicators`, `report`, `analyze`).
- It can create its own finance-focused `Agent` with DeepSeek default model.
- It does not change default behavior of `packages/coding-agent` or `packages/web-ui/example`.

## Default Model

- Provider: `deepseek`
- Model: `deepseek-chat`

Override via environment variables:

- `FINANCE_PROVIDER`
- `FINANCE_MODEL`

## Quick Start

Run tests:

```bash
npm run test -w @mariozechner/pi-finance-assistant
```

Run isolated CLI demo (uses Yahoo provider by default):

```bash
npm run example:cli -w @mariozechner/pi-finance-assistant -- "Analyze AAPL on 1D and list risks"
```

Run isolated web demo:

```bash
npm run dev --prefix packages/finance-assistant/examples/web-finance
```

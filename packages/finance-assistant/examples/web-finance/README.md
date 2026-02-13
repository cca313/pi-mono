# Finance Assistant Web Demo

This demo is intentionally isolated from `packages/web-ui/example`.

- Keeps finance behavior out of coding-agent/web-ui default flows
- Provides a minimal frontend that calls `/api/finance/analyze`
- The backend can use `createFinanceAgent()` with DeepSeek default model

## Run

```bash
npm run dev --prefix packages/finance-assistant/examples/web-finance
```

## Build

```bash
npm run build --prefix packages/finance-assistant/examples/web-finance
```

# Finance Assistant Productization Guide

This guide describes how to run the finance assistant in production-like workflows with deterministic outputs, audit metadata, and compliance report exports.

## Scope

- Package: `@mariozechner/pi-finance-assistant`
- Entry points:
	- Conversational: `example:cli`
	- Deterministic workflow: `example:workflow`
- Workflows: `agent`, `onboarding`, `operations`, `symbol-advice`

## Deterministic CLI

Run workflow mode:

```bash
npm run example:workflow -w @mariozechner/pi-finance-assistant -- --workflow operations --mode json --export bundle
```

Show help:

```bash
npm run example:workflow -w @mariozechner/pi-finance-assistant -- --help
```

### Common Flags

- `--workflow agent|onboarding|operations|symbol-advice`
- `--mode text|json|ndjson`
- `--export none|bundle`
- `--output <path>`
- `--report none|compliance`
- `--reportFormat json|markdown`

### Input Override Flags

- `--profileJson <json>`
- `--goalsJson <json>`
- `--portfolioJson <json>`
- `--riskTier conservative|moderate|aggressive`
- `--riskTemplateJson <json>`

## Risk Template Strategy

The risk monitor supports three built-in tiers and template overrides:

- Default template file: `packages/finance-assistant/config/risk-templates/default.json`
- Runtime override: `--riskTemplateJson`
- Returned metadata:
	- `riskMonitor.templateId`
	- `riskMonitor.templateVersion`
	- `summary.monitoring.riskTemplateId`
	- `summary.monitoring.riskTemplateVersion`

## Audit Envelope

Workflows and summary tooling support audit metadata suitable for downstream compliance systems.

`summary.audit` includes:

- `runId`
- `workflow`
- `generatedAt`
- `coverage`
- `warningsCount`
- `templateId`
- `templateVersion`
- `artifactIds`

For tool-based summary generation, set `includeAudit=true` and pass `workflow` / `runId`.

## Compliance Reports

Generate a structured compliance report:

```bash
npm run example:workflow -w @mariozechner/pi-finance-assistant -- --workflow operations --report compliance --reportFormat json --mode json
```

Generate markdown for review handoff:

```bash
npm run example:workflow -w @mariozechner/pi-finance-assistant -- --workflow operations --report compliance --reportFormat markdown --mode text
```

## Release Readiness Checklist

From repository root:

```bash
npm run build -w @mariozechner/pi-finance-assistant
npm run test -w @mariozechner/pi-finance-assistant
```

For monorepo integration confidence:

```bash
npm run build
npm run check
npm run test:no-env
```

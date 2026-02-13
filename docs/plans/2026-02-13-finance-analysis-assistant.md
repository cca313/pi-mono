# Finance Analysis Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a US-stock finance analysis assistant with shared core logic and two entry points (CLI extension + Web UI example), defaulting to 1D timeframe and supporting 1H/1W/1M.

**Architecture:** Introduce a new `packages/finance-assistant` workspace package containing provider adapters, fallback routing, indicators, and report generation. Expose the core through a coding-agent extension tool and a web-ui example renderer so both interfaces share one analysis pipeline and one output schema.

**Tech Stack:** TypeScript, Vitest, TypeBox, existing pi monorepo workspaces (`coding-agent`, `web-ui`, `agent-core`).

---

### Task 1: Create core package skeleton

**Files:**
- Create: `packages/finance-assistant/package.json`
- Create: `packages/finance-assistant/tsconfig.json`
- Create: `packages/finance-assistant/tsconfig.build.json`
- Create: `packages/finance-assistant/src/index.ts`
- Create: `packages/finance-assistant/src/types.ts`
- Create: `packages/finance-assistant/src/errors.ts`
- Create: `packages/finance-assistant/test/types.test.ts`

**Step 1: Write failing test**

Define strict type guards/timeframe behavior expectations in `types.test.ts`.

**Step 2: Run test to verify it fails**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/types.test.ts`
Expected: FAIL because package/files do not exist.

**Step 3: Write minimal implementation**

Implement core types and exported helpers (`isSupportedTimeframe`, normalization helpers).

**Step 4: Run test to verify it passes**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/types.test.ts`
Expected: PASS.

### Task 2: Implement provider adapters and fallback routing

**Files:**
- Create: `packages/finance-assistant/src/providers/types.ts`
- Create: `packages/finance-assistant/src/providers/finnhub.ts`
- Create: `packages/finance-assistant/src/providers/yahoo.ts`
- Create: `packages/finance-assistant/src/providers/alpha-vantage.ts`
- Create: `packages/finance-assistant/src/providers/router.ts`
- Create: `packages/finance-assistant/test/providers/router.test.ts`

**Step 1: Write failing tests**

Add tests proving:
- provider priority order is respected,
- fallback proceeds on failure,
- router returns `sourceUsed` and warning metadata.

**Step 2: Run test to verify it fails**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/providers/router.test.ts`
Expected: FAIL due to missing providers/router.

**Step 3: Write minimal implementation**

Implement provider interfaces and router with retry-free deterministic fallback for MVP.

**Step 4: Run test to verify it passes**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/providers/router.test.ts`
Expected: PASS.

### Task 3: Implement indicators

**Files:**
- Create: `packages/finance-assistant/src/indicators/ma.ts`
- Create: `packages/finance-assistant/src/indicators/rsi.ts`
- Create: `packages/finance-assistant/src/indicators/macd.ts`
- Create: `packages/finance-assistant/src/indicators/volatility.ts`
- Create: `packages/finance-assistant/src/indicators/drawdown.ts`
- Create: `packages/finance-assistant/src/indicators/index.ts`
- Create: `packages/finance-assistant/test/indicators.test.ts`

**Step 1: Write failing tests**

Cover deterministic sample inputs for MA/EMA/RSI/MACD plus edge cases for short series.

**Step 2: Run test to verify it fails**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/indicators.test.ts`
Expected: FAIL due to missing functions.

**Step 3: Write minimal implementation**

Implement pure functions with defensive null handling.

**Step 4: Run test to verify it passes**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/indicators.test.ts`
Expected: PASS.

### Task 4: Build report generator

**Files:**
- Create: `packages/finance-assistant/src/report/generate-report.ts`
- Create: `packages/finance-assistant/test/report.test.ts`

**Step 1: Write failing tests**

Validate output schema includes: `conclusion`, `keyEvidence`, `riskPoints`, `watchLevels`, `confidence`, `disclaimer`.

**Step 2: Run test to verify it fails**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/report.test.ts`
Expected: FAIL due to missing generator.

**Step 3: Write minimal implementation**

Generate deterministic report text from indicator inputs, timeframe, and metadata.

**Step 4: Run test to verify it passes**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/report.test.ts`
Expected: PASS.

### Task 5: Wire analysis orchestration

**Files:**
- Create: `packages/finance-assistant/src/analyze.ts`
- Update: `packages/finance-assistant/src/index.ts`
- Create: `packages/finance-assistant/test/analyze.test.ts`

**Step 1: Write failing test**

Test full pipeline: fetch candles via router, compute indicators, produce report, include source and timeframe.

**Step 2: Run test to verify it fails**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/analyze.test.ts`
Expected: FAIL due to missing orchestration.

**Step 3: Write minimal implementation**

Implement `analyzeSymbol` with dependency injection for testability.

**Step 4: Run test to verify it passes**

Run: `npm run test -w @mariozechner/pi-finance-assistant -- --run test/analyze.test.ts`
Expected: PASS.

### Task 6: Add coding-agent extension tool

**Files:**
- Create: `packages/coding-agent/examples/extensions/finance-assistant/index.ts`

**Step 1: Write failing test**

Add/extend extension-runner test ensuring tool registration payload is valid and timeframe defaults to `1D`.

**Step 2: Run test to verify it fails**

Run: `npm run test -w @mariozechner/pi-coding-agent -- --run test/extensions-runner.test.ts`
Expected: FAIL before extension integration.

**Step 3: Write minimal implementation**

Register `finance_analyze` tool that calls `analyzeSymbol` and returns structured JSON.

**Step 4: Run test to verify it passes**

Run: `npm run test -w @mariozechner/pi-coding-agent -- --run test/extensions-runner.test.ts`
Expected: PASS.

### Task 7: Add Web UI example integration

**Files:**
- Create: `packages/web-ui/example/src/finance-tool-renderer.ts`
- Update: `packages/web-ui/example/src/main.ts`

**Step 1: Write failing test**

If no unit harness exists, add minimal renderer unit test in example or validate by build check.

**Step 2: Run verification to fail first**

Run: `npm run build -w @mariozechner/pi-web-ui`
Expected: FAIL before missing imports are implemented.

**Step 3: Write minimal implementation**

Register custom renderer card for `finance_analyze` result fields and wire tool factory.

**Step 4: Run verification to pass**

Run: `npm run build -w @mariozechner/pi-web-ui`
Expected: PASS.

### Task 8: Workspace integration and verification

**Files:**
- Update: root `package.json` scripts/build ordering as needed
- Update: relevant `README.md` docs if required

**Step 1: Verify package is discoverable in workspace**

Run: `npm run build -w @mariozechner/pi-finance-assistant`

**Step 2: Run full checks**

Run: `npm run check`

**Step 3: Run tests**

Run: `npm run test`

**Step 4: Commit**

```bash
git add docs/plans/2026-02-13-finance-analysis-assistant.md packages/finance-assistant packages/coding-agent/examples/extensions/finance-assistant/index.ts packages/web-ui/example/src/main.ts packages/web-ui/example/src/finance-tool-renderer.ts package.json
git commit -m "feat(finance): add multi-source US stock analysis assistant MVP"
```

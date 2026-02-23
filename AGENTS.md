# AGENTS.md

This file is the operating guide for coding agents working in `pi-mono`.
Follow it strictly before proposing edits, running commands, or creating commits.

## Source Of Truth

1. Prefer repository configs over assumptions: `package.json`, `biome.json`, `tsconfig*.json`, CI workflows.
2. Read relevant files fully before editing them.
3. Match existing patterns in nearby code and tests.
4. Do not "fix" type errors by weakening types or deleting behavior.

## Cursor / Copilot Rules

- Checked for Cursor rules in `.cursor/rules/` and `.cursorrules`: **none found**.
- Checked for Copilot instructions in `.github/copilot-instructions.md`: **none found**.
- If these files are added later, treat them as additional mandatory instructions.

## Monorepo Layout

- `packages/ai`: provider abstraction, model registry, stream/complete APIs.
- `packages/agent`: core agent loop/runtime; depends on `@mariozechner/pi-ai`.
- `packages/coding-agent`: CLI coding agent built on `agent + ai + tui`.
- `packages/tui`: terminal UI primitives.
- `packages/web-ui`: web chat UI components and storage.
- `packages/mom`: Slack bot integration.
- `packages/pods`: GPU/vLLM deployment CLI.

## Required Build / Lint / Test Commands

Run from repository root unless noted.

```bash
npm install
npm run build
npm run check
npm run test:no-env
```

Notes:
- `npm run check` is Biome + type checking; it does not run the whole test suite.
- `npm run check` depends on built artifacts (`npm run build` first), especially for `packages/web-ui`.
- CI runs: build -> check -> test.

## Running A Single Test (Important)

Most packages use Vitest. Run from the target package directory:

```bash
# Option A: preferred in package root
npm run test -- --run test/path/to/file.test.ts

# Option B: direct CLI invocation in package root
npx tsx ../../node_modules/vitest/dist/cli.js --run test/path/to/file.test.ts
```

For `packages/tui` (Node test runner, not Vitest):

```bash
node --test --import tsx test/specific.test.ts
```

Package shortcuts from repo root:

```bash
npm run test -w @mariozechner/pi-ai -- --run test/stream.test.ts
npm run test -w @mariozechner/pi-agent-core -- --run test/agent.test.ts
npm run test -w @mariozechner/pi-coding-agent -- --run test/tools.test.ts
```

## Formatting And Linting

Configured by `biome.json`:

- Indentation: tabs, width 3.
- Line width: 120.
- Quotes: double quotes.
- Semicolons: required.
- Keep formatting Biome-compatible; avoid manual style drift.

## TypeScript Standards

- `strict` mode is enabled; keep types precise.
- Use `const` by default; only use `let` when reassignment is necessary.
- Avoid `any`; if unavoidable, justify in code review notes and keep scope narrow.
- Prefer explicit, reusable interfaces/types for API boundaries.
- Check dependency type definitions in `node_modules` before adding custom guesses.

## Import Rules

- Use top-level static imports; avoid inline `await import(...)` unless already established in that file.
- Use `import type` for type-only imports where appropriate.
- For local TS modules, follow repository convention of `.js` extension in import specifiers.
- Group imports in the style already present in each file; do not introduce a new ordering system.

## Naming And File Conventions

- Variables/functions: `camelCase`.
- Types/classes/interfaces/components: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` only when existing code uses it.
- Test files: `*.test.ts` under `test/`.
- Many source files use kebab-case filenames; follow the local directory pattern.

## Error Handling Guidelines

- Throw `Error` with actionable messages.
- In `catch`, treat errors as `unknown`; narrow with `instanceof Error` before reading `.message`.
- Do not silently swallow errors; either rethrow, convert to structured error state, or emit through existing event channels.
- Preserve current retry/abort/cancellation semantics when touching agent loop or streaming code.

## Testing Expectations For Changes

- For targeted edits, run the most specific single test(s) first.
- Then run package-level tests for impacted workspaces.
- Before finishing significant changes, run:

```bash
npm run build
npm run check
npm run test:no-env
```

## Git And Safety Rules

Parallel agents may share this worktree. Be conservative.

1. Stage only files you changed.
2. Never use `git add .` or `git add -A`.
3. Avoid destructive commands: `git reset --hard`, `git clean -fd`, `git stash`.
4. Do not use `git commit --no-verify`.
5. Do not amend commits unless explicitly requested.

Commit message guidance:
- Use conventional style such as `fix(ai): handle stream retry delay`.
- Include `fixes #<id>` or `closes #<id>` when applicable.
- No emoji in commit messages.

## Contribution Workflow Notes

- Read `CONTRIBUTING.md` before making non-trivial changes.
- Do not edit `CHANGELOG.md` unless explicitly requested by maintainers.
- For new contributors, issue approval gates may apply.

## Package-Specific Reminder: Adding A New AI Provider

When adding a provider in `packages/ai`, update all of:

1. `packages/ai/src/types.ts` (`Api`, `ApiOptionsMap`, `KnownProvider`).
2. `packages/ai/src/providers/*` provider implementation.
3. `packages/ai/src/stream.ts` provider registration path.
4. `packages/ai/scripts/generate-models.ts` model generation.
5. Relevant tests in `packages/ai/test/*`.
6. Model parsing/docs touchpoints in `packages/coding-agent`.

## Agent Tooling Rules

- Prefer dedicated file tools for reading/editing over ad-hoc shell commands.
- Do not use `cat`/`sed` to inspect files when a read tool is available.
- Before editing any file, read the full file first.

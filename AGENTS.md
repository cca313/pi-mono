# 开发指南 (AGENTS.md)

本文件包含在此代码库中工作的 AI 代理（Agents）必须遵守的规则和指南。

## 核心原则

1.  **严谨性**：严格遵守现有的项目惯例。在修改代码前，先阅读周围的代码、测试和配置。
2.  **安全性**：绝不假设库/框架可用。使用前先验证 `package.json`。
3.  **风格一致**：模仿现有代码的风格（格式、命名）、结构和模式。
4.  **禁止猜测**：不要为了修复类型错误而移除或降级代码；如有疑问，请先询问。

## 常用命令 (Build/Lint/Test)

-   **检查代码 (Lint/Type Check)**:
    ```bash
    npm run check
    ```
    *注意：此命令不运行测试。在提交代码前必须运行并修复所有错误/警告。*

-   **构建 (Build)**:
    ```bash
    npm run build
    ```

-   **运行所有测试**:
    ```bash
    npm run test
    ```

-   **运行单个测试 (重要)**:
    ```bash
    npx tsx ../../node_modules/vitest/dist/cli.js --run test/specific.test.ts
    ```
    *注意：请从包的根目录（例如 `packages/ai/`）运行此命令，而不是从仓库根目录。*

-   **开发模式**:
    ```bash
    npm run dev
    ```
    *注意：通常不要运行此命令，除非用户明确要求启动开发服务器。*

## 代码风格规范

此项目使用 **Biome** 进行格式化和 Lint 检查。

-   **格式化**:
    -   缩进：**Tabs** (宽度 3)
    -   行宽：**120 字符**
    -   引号：双引号 (Double Quotes)
    -   语句结尾：分号 (Semicolons)

-   **TypeScript**:
    -   **No `any`**: 除非绝对必要，否则禁止使用 `any` 类型。
    -   **类型定义**：检查 `node_modules` 获取外部 API 类型，不要猜测。
    -   **Imports**:
        -   **禁止内联导入**：不要使用 `await import("./foo.js")` 或 `import("pkg").Type`。始终使用标准的顶部导入。
    -   **Const**: 强制使用 `const` 声明变量，除非需要重新赋值。

-   **命名约定**:
    -   遵循现有的驼峰命名法 (camelCase) 或帕斯卡命名法 (PascalCase)。
    -   测试文件通常命名为 `*.test.ts`。

## Git 工作流与安全

### 并行开发规则 (CRITICAL)
多个代理可能同时在同一个工作树中工作。必须遵守以下规则：

1.  **仅提交你修改的文件**:
    -   **禁止**使用 `git add .` 或 `git add -A`。
    -   **必须**使用 `git add <具体文件路径>`。
    -   提交前运行 `git status` 确认。

2.  **Commit 信息格式**:
    -   如果涉及 Issue 或 PR，必须包含 `fixes #<number>` 或 `closes #<number>`。
    -   格式示例：`fix(ai): handle stream errors correctly`
    -   不要在 Commit 信息中使用 Emoji。

3.  **禁止的操作**:
    -   `git reset --hard` (会破坏他人的未提交更改)
    -   `git clean -fd`
    -   `git stash`
    -   `git commit --no-verify`

### PR 流程
-   不要直接创建 PR。在特性分支上工作，直到满足要求，然后合并到 main 并推送。
-   如果在处理 PR：先分析，获得用户批准后，创建特性分支，拉取 PR，变基(rebase)，调整，合并，推送。

## GitHub Issues
-   **读取 Issue**: 阅读所有评论。
-   **标签**: 使用 `pkg:*` 标签指明涉及的包 (如 `pkg:ai`, `pkg:agent`, `pkg:web-ui`)。

## 工具使用禁忌
-   **禁止使用 sed/cat** 读取文件或文件范围。
-   **必须使用 read 工具**。
-   修改文件前，**必须**完整读取该文件。

## 包特定说明

### packages/ai (添加新的 LLM 提供商)
如果需要添加新的 LLM 提供商，需要修改以下文件：
1.  `packages/ai/src/types.ts`: 更新 `Api`, `ApiOptionsMap`, `KnownProvider`。
2.  `packages/ai/src/providers/`: 创建实现文件。
3.  `packages/ai/src/stream.ts`: 注册流函数。
4.  `packages/ai/scripts/generate-models.ts`: 添加模型生成逻辑。
5.  `packages/ai/test/`: 更新相关测试文件。
6.  `packages/coding-agent/`: 更新模型解析器和文档。

### 版本发布
-   所有包版本同步。
-   使用 `npm run release:patch` 或 `npm run release:minor`。
-   在此之前更新每个包的 `CHANGELOG.md` 中的 `[Unreleased]` 部分。

## 目录结构
-   `packages/ai`: AI 核心逻辑与提供商。
-   `packages/agent`: 基础 Agent 架构。
-   `packages/coding-agent`: 编码 Agent 实现。
-   `packages/mom`: 记忆与对象管理。
-   `packages/pods`: 容器/执行环境。
-   `packages/tui`: 终端用户界面。
-   `packages/web-ui`: Web 用户界面。

## 仓库架构概览

### 顶层结构（Monorepo）
-   工作区：npm workspaces（见根目录 `package.json`）。
-   代码主目录：`packages/`（核心 7 个 package）。
-   仓库级脚本：`scripts/`（发布、版本同步、测试入口、二进制构建等）。
-   工具链配置：`biome.json`、`tsconfig.base.json`、`tsconfig.json`。
-   协作与规范：`AGENTS.md`、`CONTRIBUTING.md`、`README.md`。

### 核心包职责与关系
-   `packages/ai`：LLM 抽象层，负责 provider 适配、模型元数据与统一 stream/complete 能力。
-   `packages/agent`：通用 Agent 运行时（状态、事件、工具执行循环），依赖 `packages/ai`。
-   `packages/tui`：终端 UI 组件与渲染基础能力。
-   `packages/coding-agent`：编码场景 Agent（CLI/SDK），组合 `agent + ai + tui`。
-   `packages/web-ui`：Web 聊天与工具渲染层，复用 `agent + ai`。
-   `packages/mom`：Slack bot 场景接入，复用 `coding-agent + agent + ai`。
-   `packages/pods`：GPU pod / vLLM 相关运维 CLI（相对独立）。

架构关系（简化）：

```text
ai -> agent -> (coding-agent / web-ui / mom)
tui -> coding-agent
pods (independent CLI)
```

### `agent` 与 `coding-agent` 调用链

```text
用户输入 / CLI 参数
    ↓
packages/coding-agent/src/main.ts
  - parseArgs / 选择 mode
  - createAgentSession(sessionOptions)
    ↓
packages/coding-agent/src/core/sdk.ts
  - new Agent(...)            ← 来自 @mariozechner/pi-agent-core
  - new AgentSession({ agent, ... })
    ↓
packages/coding-agent/src/core/agent-session.ts
  - 统一封装 session 生命周期、持久化、扩展、工具注册
  - 对外提供 session.prompt()/setModel()/compact()/executeBash() 等
    ↓
运行模式层（I/O 适配）
  - InteractiveMode / runPrintMode / runRpcMode
    ↓
session.prompt(...)
    ↓
agent.prompt(...)            ← packages/agent/src/agent.ts
    ↓
agentLoop(...) / agentLoopContinue(...)
    ↓
模型流式调用 + 工具调用循环 + 事件流
```

### 常用工作流（仓库级）
-   `npm run check`：Biome + TypeScript 类型检查（不含测试）。
-   `npm run build`：按 workspace 构建核心包。
-   `npm run test`：运行 workspace 测试。
-   `npm run dev`：并行启动多个包的 watch/dev。
-   `npm run test:no-env`：运行不依赖环境密钥的测试路径。

### 代码组织模式（常见分层）
-   通用：`src/` + `test/` + `scripts/` + `docs/`。
-   AI 包：`src/providers/*` + `src/types.ts` + `src/stream.ts` + `scripts/generate-models.ts`。
-   coding-agent：`src/core`（核心）、`src/modes`（交互模式）、`src/cli`（入口与参数）。
-   web-ui：`src/components`（组件）、`src/storage`（存储）、`src/tools`（工具结果渲染）。
-   pods：`src/commands`（子命令分层）。

## 新贡献者导航图

### 按目标选择入口

```text
想新增/修改 LLM Provider
-> packages/ai/src/types.ts
-> packages/ai/src/providers/*
-> packages/ai/src/stream.ts
-> packages/ai/scripts/generate-models.ts
-> packages/ai/test/*
-> packages/coding-agent 中模型解析相关代码

想改命令行行为（编码 Agent）
-> packages/coding-agent/src/main.ts
-> packages/coding-agent/src/cli/*
-> packages/coding-agent/src/modes/*
-> packages/coding-agent/src/core/*

想改终端 UI（TUI）
-> packages/tui/src/components/*
-> packages/tui/src/rendering/*
-> packages/tui/src/editor/*

想改 Web 聊天界面
-> packages/web-ui/src/index.ts
-> packages/web-ui/src/components/*
-> packages/web-ui/src/dialogs/*
-> packages/web-ui/src/storage/*
-> packages/web-ui/src/tools/*

想改 Agent 核心循环/工具执行
-> packages/agent/src/agent.ts
-> packages/agent/src/*（events, state, types 等）

想改 Pods 运维命令
-> packages/pods/src/main.ts
-> packages/pods/src/commands/*
```

### 快速上手路径（建议）
1.  先阅读 `AGENTS.md` 与 `CONTRIBUTING.md`，明确风格、测试和 Git 约束。
2.  在仓库根目录执行 `npm install`、`npm run build`，确保基础环境可用。
3.  根据任务类型按上方导航图定位到目标 package 入口文件。
4.  完成修改后先跑 `npm run check`，再按需运行 `npm run test` 或单测。
5.  提交前确认仅提交你修改的文件，并再次检查 `git status`。

---
*Generated by Agentic Coding Assistant*

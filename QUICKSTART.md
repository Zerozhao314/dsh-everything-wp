# Quick Start Guide / 新手入门指导

> **dsh-everything-wp** — WordPress Plugin Development AI Toolkit for DeepSeek Harness (DSH)
>
> WordPress 插件开发 AI 工具包 · DeepSeek Harness (DSH) 适配版

---

## What is this? / 这是什么？

**English**: `dsh-everything-wp` is a DSH plugin that adds 18 WordPress-focused slash commands to DeepSeek Harness. Instead of manually writing plugin code, you describe what you want in plain English, and specialized AI agents handle planning, coding, review, and quality checks — all following WordPress best practices.

**中文**: `dsh-everything-wp` 是一个 DSH 插件，为 DeepSeek Harness 添加了 18 个专注于 WordPress 的 slash 命令。你不需要手动编写插件代码，只需用自然语言描述需求，专门的 AI agent 就会按 WordPress 最佳实践处理规划、编码、审查和质量检查。

**Before vs After / 使用前 vs 使用后**

| Without this plugin / 不用插件 | With dsh-everything-wp / 用插件 |
|-------|-------|
| Manually plan architecture / 手动规划架构 | `/wp-plan` generates a 6-step, 3-layer spec |
| Write PHP classes from scratch / 从零写 PHP 类 | `/wp-todo` reads spec and generates code |
| Manual code review / 人工代码审查 | `/wp-review` checks 6 dimensions including security |
| Run PHPStan/PHPUnit/PHPCS manually / 手动跑检查 | `/wp-verify` runs all three and reports |

---

## Prerequisites / 前置条件

Before you start, make sure you have these installed on your machine.

开始之前，请确保已安装以下软件。

### Required software / 必需软件

| Software / 软件 | Minimum version / 最低版本 | How to install / 安装方法 |
|-----------------|------------------------|------------------------|
| **Node.js** | 22.17+ | `winget install OpenJS.NodeJS.LTS` 或从 [nodejs.org](https://nodejs.org/) 下载 |
| **pnpm** | Latest / 最新 | `npm install -g pnpm` |
| **DSH** | v0.1.x | `npm install -g @deepseek-ai/dsh` |
| **API Key** | Valid DeepSeek API key | 配置在 DSH Web UI Settings 中 |

### Install & verify / 安装并验证

```powershell
# 1. Install DSH (with native module scripts — IMPORTANT!)
# 安装 DSH（包含原生模块脚本 — 重要！）
npm install -g --allow-scripts=@deepseek-ai/dsh-subprocess-local,koffi,node-pty,@google/genai,protobufjs @deepseek-ai/dsh

# 2. Install pnpm
npm install -g pnpm

# 3. Verify installation / 验证安装
node -v          # Should show >= 22.17
pnpm --version   # Should show a version number
dsh --version    # Should show DSH version
```

> 💡 **Note / 提示**: After installing software with winget, your current PowerShell terminal PATH might not refresh. Close and reopen your terminal, or run this at the top of each PowerShell session:
>
> ```powershell
> $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
> ```

---

## Installation / 插件安装

### Step 1: Build the plugin / 构建插件

```powershell
cd d:\project\dsh-everything-wp
npm install
npm run build
```

You should see `tsc` run with no errors. A `dist/index.js` file will be created.

你应该看到 `tsc` 运行且无错误，生成 `dist/index.js` 文件。

### Step 2: Register with DSH / 注册到 DSH

```powershell
# Register dsh-everything-wp as a local plugin in the 'web' profile
# 将 dsh-everything-wp 注册为 'web' profile 中的本地插件
dsh plugin --profile web add d:\project\dsh-everything-wp
```

You should see output mentioning the plugin — no `declares no dsh.bundle` warning.

你应该看到输出中提到该插件 —— 没有 `declares no dsh.bundle` 警告。

### Step 3: Verify registration / 验证注册

```powershell
dsh --profile web --dump-config | Select-String "everything-wp"
```

Expected output / 期望输出：
```
# == dsh-everything-wp
- id: everything-wp
  name: dsh-everything-wp
```

### Step 4: Start DSH Web UI / 启动 DSH Web UI

```powershell
dsh web
```

Expected output / 期望输出：
```
[dsh-everything-wp] applying plugin (Phase 3: 18 commands, 5 agents)...
[dsh-everything-wp] Phase 3 ready: 5 agents + 18 commands registered
[dsh-everything-wp] + wp-planner
[dsh-everything-wp] + wp-task-executor
...
[dsh-everything-wp] + /wp-ajax
dsh web: http://127.0.0.1:3080
```

### Step 5: Configure API Key / 配置 API Key

1. Open your browser and navigate to `http://127.0.0.1:3080`
2. Click **Settings** (⚙️ icon) in the sidebar
3. Find the API configuration section
4. Enter your valid DeepSeek API Key
5. Click **Save**

### Step 6: Verify commands are available / 验证命令可用

1. Go back to the main chat view
2. Type `/` (forward slash) in the message input box
3. You should see a dropdown with all 18 commands:
   - `/wp-plan`, `/wp-todo`, `/wp-review`
   - `/wp-submit-review`, `/wp-test-generate`, `/wp-test`, `/wp-verify`
   - `/wp-init-plugin`, `/wp-init-theme`, `/wp-custom-table`, etc.

If you see all 18 commands, installation is complete! 🎉

如果你能看到全部 18 个命令，安装就完成了！🎊

---

## First Tutorial: Build a Simple Feature / 首个教程：构建一个简单功能

Let's build a FAQ Accordion feature together. This walks you through the complete Plan → Todo → Review workflow.

我们一起构建一个 FAQ Accordion（手风琴）功能。带你体验完整的 Plan → Todo → Review 工作流。

### Step 0: Prepare your workspace / 准备工作区

Open DSH at `http://127.0.0.1:3080` and make sure your **current workspace** is a WordPress plugin folder (containing `composer.json` and a `src/` directory). If not, open a folder, create an empty WordPress plugin, or use `/wp-init-plugin`.

打开 DSH 并确保**当前工作区**是一个 WordPress 插件文件夹（包含 `composer.json` 和 `src/` 目录）。如果没有，打开一个文件夹，创建一个空的 WordPress 插件，或使用 `/wp-init-plugin`。

### Step 1: Generate a plan with /wp-plan / 用 /wp-plan 生成规划

1. Click **New Session** (important — always use a new session for each feature / 重要 — 每个功能都用新会话)
2. Type in the message box:

```
/wp-plan Add a FAQ accordion shortcode [faq_accordion] with admin settings page
```

3. Press Enter and wait. The planner will:
   - 🟢 Analyze your codebase's conventions
   - 🟢 Review WordPress standards
   - 🟢 Create an Operation Flow (6-10 user steps)
   - 🟢 Write User Stories (Given/When/Then with risk tiers)
   - 🟢 Break down Development Tasks into area files
   - 🟢 Write spec files to `spec/faq-accordion/`

Wait for it to finish (usually 2-3 minutes).

等它完成（通常 2-3 分钟）。

**What you get / 产出结果**:
- `spec/faq-accordion/overview.md` — Summary of the plan
- `spec/faq-accordion/01-admin-settings.md` — First area to implement
- `spec/faq-accordion/02-frontend-accordion.md` — Second area to implement

Each area file contains: User Stories, Development Tasks (checkboxes), and a Manual Test Script.

每个 area 文件包含：用户故事、开发任务（复选框）、手动测试脚本。

> 💡 **Pro Tip / 专业提示**: The more specific your `/wp-plan` description, the fewer clarifying questions the planner will ask. Include constraints like "no admin page this phase" or "use native HTML5 details element" upfront.
>
> `/wp-plan` 描述越具体，planner 提出的澄清问题越少。可以提前包含约束，如"本阶段不要管理员页面"或"用原生 HTML5 details 元素"。

### Step 2: Execute area 1 with /wp-todo / 用 /wp-todo 执行 Area 1

1. Click **New Session** (new session for the execution phase — isolates context / 执行阶段用新会话 — 隔离上下文)
2. Type:

```
/wp-todo spec/faq-accordion/01-admin-settings.md --tdd=int
```

3. Press Enter and wait (usually 3-5 minutes for a data/settings area).
4. The task-executor will:
   - 🟢 Read the spec file
   - 🟢 Create `src/class-scf-faq-settings.php`
   - 🟢 Wire the class into the plugin bootstrap (`simple-contact-form.php` + `SCF_Plugin`)
   - 🟢 Create tests in `tests/Integration/` (because `--tdd=int`)
   - 🟢 Mark tasks as `[x]` in the spec file

**What the `--tdd` flag means / `--tdd` 参数含义**:
- `--tdd=int` → Integration tests (WP hooks, DB, Settings API) — use for most WordPress code
- `--tdd=unit` → Unit tests (pure logic/validation) — use for sanitizers, formatters
- No flag → Standard (no tests) — use for prototyping / throwaway code

### Step 3: Execute area 2 with /wp-todo / 用 /wp-todo 执行 Area 2

1. Click **New Session**
2. Type:

```
/wp-todo spec/faq-accordion/02-frontend-accordion.md --tdd=int
```

3. Wait for it to complete. This creates the shortcode class, CSS, and tests.
4. After it finishes, commit your code in git:

```powershell
cd D:\your\plugin\folder
git add -A
git commit -m "Implement FAQ accordion: admin settings + shortcode"
```

> 💡 **Important / 重要**: Commit your code BEFORE running `/wp-review`. The reviewer checks the git diff.
>
> 在运行 `/wp-review` 之前提交代码。审查者检查 git diff。

### Step 4: Code review with /wp-review / 用 /wp-review 审查代码

1. Click **New Session**
2. Type:

```
/wp-review
```

3. Wait 1-3 minutes. The code-reviewer will:
   - 🟢 Classify the diff risk tier (🔴/🟡/🟢)
   - 🟢 Check Acceptance Criteria against the spec
   - 🟢 Audit Security (nonce, escape, sanitize, capability)
   - 🟢 Check Performance (N+1 queries)
   - 🟢 Look for Simplification opportunities (duplication)
   - 🟢 Flag Test Coverage gaps
   - 🟢 Check i18n (hardcoded strings)
4. You get a structured report with **Must / Should / Nice** graded findings.
5. Fix any **Must** issues, then re-run `/wp-review` if needed.

**Example report format / 报告格式示例**:

```
🔴 RED TIER REVIEW (untrusted input → DB)

MUST FIX:
• Nonce verification not first operation in handler (moved before validation)
• Honeypot field uses only aria-hidden; add CSS display:none too

SHOULD FIX:
• Missing i18n escape combo on line 47 (use esc_html__() not esc_html + __())

NICE TO HAVE:
• Could extract error message strings to class constants
```

### Step 5: Quality verification with /wp-verify (optional) / 用 /wp-verify 质量验证（可选）

If you have composer dependencies installed (`vendor/` folder exists):

```
/wp-verify
```

Runs PHPStan → PHPUnit → PHPCS and reports a Code Quality Report table.

运行 PHPStan → PHPUnit → PHPCS 并生成代码质量报告表格。

### Step 6: Repeat for each new feature / 对每个新功能重复

That's it! For every new feature, you follow the same pattern:

就这样！每个新功能都用相同模式：

```
New Session → /wp-plan          (plan the feature / 规划功能)
New Session → /wp-todo Area 1    (build it, commit / 构建，提交)
New Session → /wp-todo Area 2    (build more, commit / 构建更多，提交)
New Session → /wp-review         (review / 审查)
New Session → /wp-verify         (optional quality / 可选质量检查)
```

---

## Command Selection Guide / 命令选择指南

**I don't know which command to use!** Use this decision tree.

**我不知道该用哪个命令！** 用这个决策树。

### Starting a new project / 启动新项目

| Situation / 场景 | Command | Why / 原因 |
|----------------|---------|-----------|
| I need a new WordPress plugin / 需要新插件 | `/wp-init-plugin` | Full scaffold + tests + CI/CD / 完整 scaffold + 测试 |
| I need a new WordPress theme / 需要新主题 | `/wp-init-theme` | Classic or block theme / 经典或块主题 |

### Adding a feature to an existing plugin / 给现有插件加功能

| Situation / 场景 | Command | Why / 原因 |
|----------------|---------|-----------|
| I have a feature idea but no plan / 有想法但没规划 | `/wp-plan` | Always start here! / 永远从这里开始！ |
| I have a spec file already / 已有 spec 文件 | `/wp-todo` | Execute the tasks / 执行任务 |
| I just finished writing code / 刚写完代码 | `/wp-review` | Get a senior engineer review / 资深工程师审查 |
| I want to make sure code is solid / 确保代码稳定 | `/wp-verify` | PHPStan + PHPUnit + PHPCS all at once / 三项全跑 |

### Generating specific code components / 生成特定代码组件

| What I need / 需要什么 | Command / 命令 | Arguments / 参数 |
|----------------------|-------------|----------------|
| Custom DB table + CRUD / 自定义数据表 | `/wp-custom-table` | Table name, e.g. `submissions` |
| REST API endpoints / REST API 端点 | `/wp-rest-api` | Resource name, e.g. `products` |
| AJAX handler / AJAX 处理 | `/wp-ajax` | Action name, e.g. `save_contact` |
| Settings page / 设置页面 | `/wp-option-page` | Page slug, e.g. `faq_settings` |
| Admin list table / 管理列表表格 | `/wp-list-table` | Item name, e.g. `orders` |
| Shortcode / block / 前端页面 | `/wp-frontend-page` | Page description |
| External API wrapper / 外部 API 包装 | `/wp-api-wrapper` | API name + base URL |
| Block theme design system / 块主题设计 | `/wp-make-block` | Reference site URL |
| PHP tests / 单元测试 | `/wp-test-generate` | File or class name (optional) |
| Run tests / 运行测试 | `/wp-test` | Test file (optional) |

### Before release / 发布前

| Situation / 场景 | Command | When / 时机 |
|----------------|---------|-----------|
| Submitting to WordPress.org / 提交到 WP.org | `/wp-submit-review` | After review + verify / 审查验证之后 |
| Version release / 版本发布 | `/wp-release` | Everything passes! / 所有检查通过！ |

---

## Common Problems & Fixes / 常见问题与解决

### Problem: DSH won't start / DSH 无法启动

**Symptom / 症状**: Terminal shows `koffi` or `node-pty` errors on DSH start.

**Fix / 解决**: Reinstall DSH with `--allow-scripts` for native modules:
```powershell
npm install -g --allow-scripts=@deepseek-ai/dsh-subprocess-local,koffi,node-pty,@google/genai,protobufjs @deepseek-ai/dsh
```

### Problem: Commands not showing up in autocomplete / 命令不出现在自动补全

**Symptom / 症状**: Type `/` but no `/wp-*` commands appear.

**Fix / 解决**:
1. Did you register the plugin? `dsh plugin --profile web add d:\project\dsh-everything-wp`
2. Did you build the plugin? `cd d:\project\dsh-everything-wp && npm run build`
3. Did you restart DSH? Kill the node process on port 3080 and re-run `dsh web`
4. Create a NEW SESSION in the UI — old sessions don't get updated command lists

### Problem: Model tries to load "skills/wp-backend" / 模型尝试加载 skills/wp-backend

**Symptom / 症状**: Error message `skill "wp-backend" is unknown or no longer available`.

**Fix / 解决**: Update to the latest version of dsh-everything-wp (skill references are now rewritten to "inline" in buildPrompt). If it still happens, create a NEW SESSION (old session context still has cached memory of the old references).

### Problem: /wp-review says "No changes to review" / /wp-review 说没有更改

**Symptom / 症状**: The reviewer says "No changes to review" immediately.

**Cause / 原因**: Your changes are already committed to git (working tree diff is empty).

**Fix / 解决**: The plugin now auto-falls back: if working tree diff is empty, it reviews the latest commit (`HEAD~1..HEAD`) instead. If you see this message with the latest version, type this manually in chat:

```
Please review git diff HEAD~1..HEAD
```

### Problem: Agent runs but makes no files / agent 运行但没生成文件

**Possible causes / 可能原因**:
1. Be patient! Generating code takes 3-5 minutes for complex files.
2. Create a NEW SESSION. Old session context sometimes confuses the agent.
3. Check if your spec file paths are correct.

### Problem: Port 3080 is already in use / 端口 3080 已占用

**Fix / 解决**: Kill whatever is using port 3080:
```powershell
$conn = Get-NetTCPConnection -LocalPort 3080 -State Listen
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### Problem: Modified plugin code but behavior hasn't changed / 修改了插件代码但行为不变

**Fix / 解决**: DSH doesn't hot-reload third-party plugins. You must:
1. `npm run build`
2. Kill DSH
3. Restart `dsh web`

### Problem: npm error code ECOMPROMISED

**Fix / 解决**: Clear npm cache and reinstall:
```powershell
npm cache clean --force
Remove-Item "$env:LOCALAPPDATA\npm-cache\_cacache" -Recurse -Force
npm install -g @deepseek-ai/dsh
```

---

## Best Practices / 最佳实践

### 🎯 Always use new sessions / 总是用新会话

Never re-run commands in the same session. Previous context leaks into the next command. Create a new session for:
- Each new feature plan
- Each area's `/wp-todo` execution
- Each `/wp-review` pass

永远不要在相同会话中重复运行命令。旧上下文会泄漏到新命令中。以下场景都创建新会话：
- 每个新功能规划
- 每个 area 的 `/wp-todo` 执行
- 每次 `/wp-review` 审查

### 📝 Be specific in /wp-plan descriptions / /wp-plan 描述要具体

Good / 好：
```
/wp-plan Add a contact form shortcode [simple_contact_form] with: form fields name/email/subject/message, server-side validation with nonce + honeypot, database table scf_submissions for storage, email notification to admin_email, no admin list page this phase, settings hardcoded defaults.
```

Bad / 不好：
```
/wp-plan Make a contact form
```

(The vague description causes many clarifying questions and slower output.)
（模糊描述会导致大量澄清问题和更慢的输出。）

### 🔄 Follow the commit cadence / 按节奏提交代码

```
/wp-plan  → no commit (spec files get committed)
/wp-todo  → commit after EACH area completes
/wp-review → run after commits are made (reads git diff)
/wp-release → final commit + git tag
```

### 🔴 Prioritize MUST-findings from /wp-review / 优先处理 /wp-review 的 MUST 问题

The code reviewer grades findings:
- **MUST** = fix before commit / 提交前必须修复
- **SHOULD** = fix soon / 尽快修复
- **NICE** = polish / 优化

Always fix **MUST** findings. They are typically security issues (nonce, escaping, SQL prepare) or broken acceptance criteria.

永远修复 **MUST** 问题。它们通常是安全问题（nonce、转义、SQL prepare）或被破坏的验收标准。

---

## Workspace Project Structure / 工作区项目结构

When working with a WordPress plugin, your folder should look like this:

开发 WordPress 插件时，你的文件夹结构应如下：

```
my-wordpress-plugin/
├── simple-contact-form.php     # Main plugin file (header + bootstrap requires)
├── composer.json               # require + require-dev dependencies
├── phpunit.xml.dist            # PHPUnit config
├── readme.txt                  # WordPress.org readme
├── src/                        # All PHP class files
│   ├── class-scf-plugin.php          # Singleton bootstrap
│   ├── class-scf-submissions-table.php
│   ├── class-scf-submissions-repository.php
│   ├── class-scf-mailer.php
│   ├── class-scf-form.php
│   ├── class-scf-faq-settings.php        # Generated by /wp-todo
│   └── class-scf-faq-accordion.php       # Generated by /wp-todo
├── tests/                      # PHPUnit tests
│   ├── bootstrap.php
│   └── Integration/
│       ├── FormSubmissionTest.php
│       └── FAQSettingsTest.php
├── assets/                     # CSS and JS (conditioned enqueue)
│   ├── faq-accordion.css
│   └── faq-accordion-admin.js
└── spec/                       # Generated by /wp-plan
    ├── simple-contact-form/
    │   ├── overview.md
    │   ├── 01-data-layer.md
    │   ├── 02-email-layer.md
    │   └── 03-form-layer.md
    └── faq-accordion/
        ├── overview.md
        ├── 01-admin-settings.md
        └── 02-frontend-accordion.md
```

---

## Full Command Reference / 完整命令参考

See [COMMANDS.md](COMMANDS.md) for detailed documentation on all 18 commands including:
- English + Chinese descriptions
- Syntax tables with arguments and output
- Code examples
- Risk tier explanations

所有 18 个命令的详细文档参见 [COMMANDS.md](COMMANDS.md)，包含：
- 中英文描述
- 语法表格（参数和输出）
- 代码示例
- 风险等级说明

---

## Agents Behind the Scenes / 幕后的 Agent 机制

When you run a command, a specialized AI agent (system prompt section) becomes active. DSH uses a **mode gate** mechanism — only the agent matching the most recent slash command's instructions are followed by the model. This prevents instruction conflicts when multiple agents exist.

运行命令时，一个专门的 AI agent（system prompt section）会被激活。DSH 使用**模式门控**机制 —— 模型只遵循与最近一次 slash command 匹配的 agent 指令。这避免了多个 agent 共存时的指令冲突。

| Agent / Agent | Commands / 命令 | What it does / 功能 |
|------|--------|------|
| wp-planner | `/wp-plan` | 6-step implementation planning |
| wp-task-executor | `/wp-todo` | Read spec, write code, write tests |
| wp-code-reviewer | `/wp-review` | 6-dimension diff review (Must/Should/Nice) |
| wp-submission-reviewer | `/wp-submit-review` | 6-item WordPress.org compliance |
| wp-code-quality | `/wp-test-generate`, `/wp-test`, `/wp-verify` | Test generation + execution + PHPStan/PHPCS |

---

## Further Reading / 深入阅读

| File / 文件 | Content / 内容 |
|-------|--------|
| [COMMANDS.md](COMMANDS.md) | Detailed 18-command reference with examples |
| [README.md](README.md) | Plugin architecture, installation, file structure |
| `docs/development-spec.md` (if present) | Concrete example plans from `/wp-plan` |

---

## License / 许可证

GPL-2.0-or-later (inherited from everything-wp)

**Author / 作者**: Adapted from [everything-wp](https://github.com/oberonlai/everything-wp) by Oberon Lai for the DeepSeek Harness community.

---

*Version: 1.7.0-dsh.3*
*Last updated: 2026-08-17*

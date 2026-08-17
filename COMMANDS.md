# Command Reference / 命令参考

> dsh-everything-wp — 18 WordPress Development Slash Commands / 18 个 WordPress 开发 Slash 命令

---

## Table of Contents / 目录

- [Core Workflow Commands / 核心工作流命令](#core-workflow-commands--核心工作流命令)
  - [/wp-plan](#wp-plan)
  - [/wp-todo](#wp-todo)
  - [/wp-review](#wp-review)
- [Submission & Quality Commands / 提交与质量命令](#submission--quality-commands--提交与质量命令)
  - [/wp-submit-review](#wp-submit-review)
  - [/wp-test-generate](#wp-test-generate)
  - [/wp-test](#wp-test)
  - [/wp-verify](#wp-verify)
- [Code Generation Commands / 代码生成命令](#code-generation-commands--代码生成命令)
  - [/wp-init-plugin](#wp-init-plugin)
  - [/wp-init-theme](#wp-init-theme)
  - [/wp-custom-table](#wp-custom-table)
  - [/wp-rest-api](#wp-rest-api)
  - [/wp-ajax](#wp-ajax)
  - [/wp-option-page](#wp-option-page)
  - [/wp-list-table](#wp-list-table)
  - [/wp-frontend-page](#wp-frontend-page)
  - [/wp-api-wrapper](#wp-api-wrapper)
  - [/wp-make-block](#wp-make-block)
- [Release Command / 发布命令](#release-command--发布命令)
  - [/wp-release](#wp-release)

---

# Core Workflow Commands / 核心工作流命令

These 3 commands form the standard Plan → Execute → Review development loop.
这 3 个命令构成了标准的「规划 → 执行 → 审查」开发循环。

```
/wp-plan feature-description
        ↓
/wp-todo spec/<feature>/01-area.md  (repeat for each area)
        ↓
/wp-review
```

---

## /wp-plan

**English**: Create a comprehensive implementation plan using the 3-layer task breakdown (Data/Integration/Interface). The `wp-planner` agent analyzes the codebase, references WordPress standards, and produces a 6-step plan saved to `spec/<feature-name>/`.

**中文**: 使用三层任务分解（数据层/集成层/界面层）创建完整的实现规划。`wp-planner` agent 分析代码库，参考 WordPress 标准，生成 6 步规划并保存到 `spec/<feature-name>/`。

| Item / 项 | Value / 值 |
|-----------|-----------|
| **Category / 类别** | Core Workflow / 核心工作流 |
| **Agent** | wp-planner |
| **Mode Gate / 模式门控** | PLANNING |
| **Syntax / 语法** | `/wp-plan <feature description>` |
| **Arguments / 参数** | `feature description` (required): Natural language description of what to build |
| **Output / 输出** | `spec/<feature-name>/overview.md` + numbered area files |

### Examples / 示例

```bash
# Simple feature / 简单功能
/wp-plan Add a FAQ accordion shortcode

# Complex feature with constraints / 带约束的复杂功能
/wp-plan Add a contact form shortcode [simple_contact_form] with validation, DB storage, email notification, and admin settings
```

### What wp-planner does / planner 做什么

1. **Codebase Analysis / 代码库分析** — Identifies conventions, reusable components, and conflicts
2. **Reference Investigation / 参考调查** — Reviews applicable WordPress standards
3. **Operation Flow / 操作流程** — 6-10 step user-facing flow
4. **User Stories / 用户故事** — Given/When/Then BDD scenarios with risk tiers
5. **Development Tasks / 开发任务** — Per-area tasks grouped by Data/Integration/Interface layers
6. **Save Plan / 保存规划** — Writes spec files to `spec/<feature-name>/`

---

## /wp-todo

**English**: Execute development tasks from a spec file. The `wp-task-executor` agent reads the spec, follows codebase conventions, implements classes, writes tests, and checks off completed tasks.

**中文**: 从 spec 文件执行开发任务。`wp-task-executor` agent 读取 spec，遵循代码库约定，实现类，编写测试，并勾选已完成任务。

| Item / 项 | Value / 值 |
|-----------|-----------|
| **Category / 类别** | Core Workflow / 核心工作流 |
| **Agent** | wp-task-executor |
| **Mode Gate / 模式门控** | EXECUTION |
| **Syntax / 语法** | `/wp-todo <spec-file-path> [--tdd[=unit\|int]]` |
| **Arguments / 参数** | `spec-file-path` (required): Path to a spec file (e.g. `spec/faq/01-admin-settings.md`)<br>`--tdd` (optional): Enable TDD mode<br>`--tdd=unit`: Unit tests (pure logic)<br>`--tdd=int`: Integration tests (WP hooks, DB) |
| **Output / 输出** | PHP files created in `src/`, tests in `tests/`, spec tasks marked `[x]` |

### Examples / 示例

```bash
# Standard mode (no tests) / 标准模式（不写测试）
/wp-todo spec/faq-accordion/01-admin-settings.md

# TDD auto mode (agent chooses unit vs integration) / TDD 自动模式
/wp-todo spec/faq-accordion/01-admin-settings.md --tdd

# TDD integration mode (for WP hook/DB code) / TDD 集成测试模式
/wp-todo spec/faq-accordion/01-admin-settings.md --tdd=int

# TDD unit mode (for pure validation/logic) / TDD 单元测试模式
/wp-todo spec/faq-accordion/02-frontend-accordion.md --tdd=unit
```

### Best Practices / 最佳实践

- Execute area files **in build order**: Data Layer first, then Integration, then Interface
- Use `--tdd=int` for code that touches WordPress hooks, DB, or Settings API
- Use `--tdd=unit` for validation rules, pure logic, string formatting

---

## /wp-review

**English**: Senior-engineer code review on the current diff. The `wp-code-reviewer` agent classifies the diff risk tier (🟢/🟡/🔴), then reviews across 6 dimensions: Acceptance Criteria, Security, Performance, Simplification, Test Coverage, and i18n.

**中文**: 对当前 diff 进行资深工程师级别的代码审查。`wp-code-reviewer` agent 分级 diff 风险等级（🟢/🟡/🔴），然后从 6 个维度审查：验收标准、安全性、性能、简化、测试覆盖、国际化。

| Item / 项 | Value / 值 |
|-----------|-----------|
| **Category / 类别** | Core Workflow / 核心工作流 |
| **Agent** | wp-code-reviewer |
| **Mode Gate / 模式门控** | REVIEW |
| **Syntax / 语法** | `/wp-review` (no arguments) |
| **Arguments / 参数** | None |
| **Output / 输出** | Structured review report with Must/Should/Nice graded findings |
| **Diff Source / Diff 来源** | First checks working tree `git diff HEAD`. If empty, falls back to `git diff HEAD~1..HEAD`. |

### Examples / 示例

```bash
# Review uncommitted changes / 审查未提交的更改
/wp-review

# If you just committed, /wp-review automatically reviews the latest commit
# 如果你刚提交了代码，/wp-review 会自动审查最近的 commit
```

### Review Dimensions / 审查维度

1. **Acceptance Criteria / 验收标准** — Does the code satisfy the spec's Given/When/Then scenarios?
2. **Security / 安全性** — Nonce, capability, sanitization, escaping, SQL prepare, file ops
3. **Performance / 性能** — N+1 queries, cache, hook overload
4. **Simplification / 简化** — Duplication, dead code, debug residue
5. **Test Coverage Gap / 测试缺口** — New behavior without corresponding tests
6. **i18n / 国际化** — Hardcoded strings, missing text domain

### Risk Tiers / 风险等级

| Tier / 等级 | Color / 颜色 | Meaning / 含义 |
|-------------|--------------|----------------|
| 🔴 Deep Review | Red / 红色 | SQL, auth, capability, payment, untrusted input → DB/email |
| 🟡 Selective Review | Yellow / 黄色 | Data flows through, but boundaries enforced upstream |
| 🟢 Standard Review | Green / 绿色 | Standard, low-risk glue code |

---

# Submission & Quality Commands / 提交与质量命令

These commands handle plugin submission compliance, testing, and code quality verification. They share the `wp-code-quality` and `wp-submission-reviewer` agents.

---

## /wp-submit-review

**English**: Review plugin for WordPress.org submission compliance. The `wp-submission-reviewer` agent runs 6-item checks required by the WordPress.org plugin review team: License, readme.txt, forbidden files, third-party services, privacy, and admin notices.

**中文**: 审查插件是否符合 WordPress.org 提交合规要求。`wp-submission-reviewer` agent 运行 WordPress.org 插件审查团队要求的 6 项检查：许可证、readme.txt、禁止文件、第三方服务、隐私和管理通知。

| Item / 项 | Value / 值 |
|-----------|-----------|
| **Category / 类别** | Submission & Quality / 提交与质量 |
| **Agent** | wp-submission-reviewer |
| **Mode Gate / 模式门控** | SUBMISSION_REVIEW |
| **Syntax / 语法** | `/wp-submit-review` (no arguments) |
| **Arguments / 参数** | None |
| **Output / 输出** | 6-item compliance report with pass/fail + fix suggestions |

### What it checks / 检查内容

1. **License Verification** — Must be GPL-2.0+ or GPL-3.0+; license header in every PHP file
2. **readme.txt Validation** — Header, tags, tested-up-to, changelog format
3. **Forbidden Files Scan** — No `.git/`, `.DS_Store`, `composer.phar`, VCS marks, Windows thumbs
4. **Third-Party Services** — All external endpoints documented; data disclosure notices
5. **Privacy Review** — User data handling; PII collection disclosed
6. **Admin Notice Audit** — No dismissals forever; notices limited to admin page context

### When to run / 何时执行
- Before releasing a plugin to WordPress.org
- After major refactoring
- As part of pre-release checklist (after `/wp-verify`, before `/wp-release`)

---

## /wp-test-generate

**English**: Generate PHPUnit tests for existing PHP code. Part of the `wp-code-quality` agent (Mode: generate). Analyzes existing classes and creates test files covering public methods, edge cases, and failure paths.

**中文**: 为现有 PHP 代码生成 PHPUnit 测试。属于 `wp-code-quality` agent（模式: generate）。分析现有类并创建测试文件，覆盖公共方法、边界情况和失败路径。

| Item / 项 | Value / 值 |
|-----------|-----------|
| **Category / 类别** | Submission & Quality / 提交与质量 |
| **Agent** | wp-code-quality (OR gate: /wp-test-generate, /wp-test, /wp-verify) |
| **Mode Gate / 模式门控** | CODE_QUALITY (Mode: generate) |
| **Syntax / 语法** | `/wp-test-generate [<php-file-or-class>]` |
| **Arguments / 参数** | `php-file-or-class` (optional): Specific file or class. If omitted, generates for all classes. |
| **Output / 输出** | Test files in `tests/Unit/` or `tests/Integration/` |

### Examples / 示例

```bash
# Generate tests for all classes / 为所有类生成测试
/wp-test-generate

# Generate tests for a specific class / 为指定类生成测试
/wp-test-generate src/class-scf-form.php

# By class name / 按类名
/wp-test-generate SCF_Mailer
```

---

## /wp-test

**English**: Execute PHPUnit tests, analyze failures, and suggest fixes. Part of the `wp-code-quality` agent (Mode: test).

**中文**: 执行 PHPUnit 测试，分析失败并建议修复。属于 `wp-code-quality` agent（模式: test）。

| Item / 项 | Value / 值 |
|-----------|-----------|
| **Category / 类别** | Submission & Quality / 提交与质量 |
| **Agent** | wp-code-quality |
| **Mode Gate / 模式门控** | CODE_QUALITY (Mode: test) |
| **Syntax / 语法** | `/wp-test [<test-file>]` |
| **Arguments / 参数** | `test-file` (optional): Specific test file to run. If omitted, runs all tests. |
| **Prerequisites / 前置条件** | `composer install` must have been run; PHPUnit must be in `vendor/bin/` |
| **Output / 输出** | Test run summary + failure analysis + fix suggestions |

### Examples / 示例

```bash
# Run all tests / 运行所有测试
/wp-test

# Run a specific test file / 运行指定测试文件
/wp-test tests/Integration/FormSubmissionTest.php
```

---

## /wp-verify

**English**: Run all code quality checks in order: PHPStan (static analysis) → PHPUnit (tests) → PHPCS (coding standards). Part of the `wp-code-quality` agent (Mode: verify). Produces a Code Quality Report table.

**中文**: 按顺序运行所有代码质量检查：PHPStan（静态分析）→ PHPUnit（测试）→ PHPCS（编码标准）。属于 `wp-code-quality` agent（模式: verify）。生成代码质量报告表格。

| Item / 项 | Value / 值 |
|-----------|-----------|
| **Category / 类别** | Submission & Quality / 提交与质量 |
| **Agent** | wp-code-quality |
| **Mode Gate / 模式门控** | CODE_QUALITY (Mode: verify) |
| **Syntax / 语法** | `/wp-verify` (no arguments) |
| **Arguments / 参数** | None |
| **Prerequisites / 前置条件** | Composer dependencies installed (`phpstan`, `phpunit`, `phpcs` in `require-dev`) |
| **Output / 输出** | Code Quality Report table with check marks and issue counts |
| **Report format / 报告格式** | Tabular: Check | Tool | Result | Count |

### Examples / 示例

```bash
# Run all quality checks / 运行所有质量检查
/wp-verify
```

### Check order / 检查顺序

1. **PHPStan** — Static analysis: type errors, undefined methods, nullable access
2. **PHPUnit** — Unit and integration tests
3. **PHPCS** — Coding standards (WPCS or PSR-12)

---

# Code Generation Commands / 代码生成命令

These 11 commands generate code directly from templates and patterns. They do not use a dedicated system prompt section — instead, the command document is injected inline as a steer message when the command is called. No token overhead when commands are not in use.

这 11 个命令直接根据模板和模式生成代码。它们不使用专用的 system prompt section —— 相反，命令文档在命令被调用时作为 steer 消息内联注入。未使用时没有 token 开销。

---

## /wp-init-plugin

**English**: Initialize WordPress plugin dev environment with tests and CI/CD. Scaffolds the full project structure: main plugin file, composer.json, phpunit.xml.dist, tests/bootstrap.php, GitHub Actions workflows.

**中文**: 初始化 WordPress 插件开发环境，包含测试和 CI/CD。搭建完整项目结构：主插件文件、composer.json、phpunit.xml.dist、tests/bootstrap.php、GitHub Actions 工作流。

| Syntax / 语法 | `/wp-init-plugin [<plugin-name>]` |
| Arguments / 参数 | `plugin-name` (optional): Plugin slug. If omitted, the agent asks for it. |
| Typical output / 典型输出 | Full plugin scaffold (~15-20 files) in a new directory or the current project |

---

## /wp-init-theme

**English**: Initialize WordPress theme (classic or block) with tests and CI/CD. Scaffolds theme.json, style.css, template parts, block templates, tests, and CI/CD.

**中文**: 初始化 WordPress 主题（经典或块主题），包含测试和 CI/CD。搭建 theme.json、style.css、模板部件、块模板、测试和 CI/CD。

| Syntax / 语法 | `/wp-init-theme [<theme-name>]` |
| Arguments / 参数 | `theme-name` (optional): Theme slug. If omitted, the agent asks for it. |
| Typical output / 典型输出 | Theme scaffold with theme.json, templates/, parts/, style.css, functions.php |

---

## /wp-custom-table

**English**: Generate custom DB table with Repository class for CRUD. Creates a table schema using `dbDelta()` and a Repository class with `insert()`, `update()`, `delete()`, `get()`, `get_all()` methods using `$wpdb->prepare()`.

**中文**: 生成自定义数据库表和 Repository 类用于 CRUD。使用 `dbDelta()` 创建表结构，Repository 类包含使用 `$wpdb->prepare()` 的 `insert()`、`update()`、`delete()`、`get()`、`get_all()` 方法。

| Syntax / 语法 | `/wp-custom-table <table-name>` |
| Arguments / 参数 | `table-name` (required): Table name (without prefix, e.g. `scf_submissions`) |
| Typical output / 典型输出 | `src/class-scf-<table>-table.php` + `src/class-scf-<table>-repository.php` |

### Example / 示例

```bash
/wp-custom-table order_items
```

---

## /wp-rest-api

**English**: Generate WordPress REST API controller with validation. Creates a `WP_REST_Controller` subclass including route registration, permission callback, argument schema validation, CRUD endpoints, and GET/POST/PUT/DELETE handling.

**中文**: 生成带验证的 WordPress REST API controller。创建 `WP_REST_Controller` 子类，包含路由注册、权限回调、参数 schema 验证、CRUD 端点和 GET/POST/PUT/DELETE 处理。

| Syntax / 语法 | `/wp-rest-api <resource-name>` |
| Arguments / 参数 | `resource-name` (required): REST resource (e.g. `products`, `orders`, `bookings`) |
| Typical output / 典型输出 | `src/class-<prefix>-rest-<resource>-controller.php` |

### Example / 示例

```bash
/wp-rest-api products
```

### What it generates / 生成内容

1. Collect API Information — Namespace, routes, methods
2. Configure Authentication — Permission callbacks
3. Generate Controller Class — `WP_REST_Controller` subclass
4. Provide Integration Instructions — Registration + activation

---

## /wp-ajax

**English**: Generate WordPress AJAX handler with nonce and permission checks. Creates both `wp_ajax_<action>` (logged-in) and `wp_ajax_nopriv_<action>` (guest) hooks, nonce verification, capability checks, sanitization, JSON response with success/error.

**中文**: 生成带 nonce 和权限检查的 WordPress AJAX 处理程序。创建 `wp_ajax_<action>`（已登录）和 `wp_ajax_nopriv_<action>`（访客）钩子、nonce 验证、能力检查、净化、带成功/错误的 JSON 响应。

| Syntax / 语法 | `/wp-ajax <action-name>` |
| Arguments / 参数 | `action-name` (required): AJAX action name (e.g. `save_contact`, `get_products`) |
| Typical output / 典型输出 | `src/class-<prefix>-ajax-<action>.php` |

### Example / 示例

```bash
/wp-ajax save_contact
```

---

## /wp-option-page

**English**: Generate WordPress settings page using Settings API. Creates admin submenu, `register_setting()` with sanitize callback, `add_settings_section()`, `add_settings_field()`, and the page render method with `settings_fields()` + `do_settings_sections()`.

**中文**: 使用 Settings API 生成 WordPress 设置页面。创建管理员子菜单、带净化回调的 `register_setting()`、`add_settings_section()`、`add_settings_field()`，以及包含 `settings_fields()` + `do_settings_sections()` 的页面渲染方法。

| Syntax / 语法 | `/wp-option-page <option-page-name>` |
| Arguments / 参数 | `option-page-name` (required): Settings page slug (e.g. `faq-accordion`, `scf_settings`) |
| Typical output / 典型输出 | `src/class-<prefix>-option-page.php` with Settings API wiring |

### Example / 示例

```bash
/wp-option-page faq-accordion
```

---

## /wp-list-table

**English**: Generate `WP_List_Table` class with sorting, pagination, search, bulk actions, row actions, and column filters.

**中文**: 生成 `WP_List_Table` 类，包含排序、分页、搜索、批量操作、行操作和列过滤。

| Syntax / 语法 | `/wp-list-table <table-name>` |
| Arguments / 参数 | `table-name` (required): Logical name for what's listed (e.g. `submissions`, `customers`) |
| Typical output / 典型输出 | `src/class-<prefix>-list-<table>-table.php` extending `WP_List_Table` |

### Example / 示例

```bash
/wp-list-table submissions
```

---

## /wp-frontend-page

**English**: Generate frontend page (Shortcode / Block / Page Template). Asks user which approach, then creates either a shortcode render class, a dynamic block with block.json, or a custom page template.

**中文**: 生成前端页面（Shortcode / Block / 页面模板）。询问用户选择哪种方式，然后创建短代码渲染类、带 block.json 的动态块，或自定义页面模板。

| Syntax / 语法 | `/wp-frontend-page <page-description>` |
| Arguments / 参数 | `page-description` (required): What the page should do (e.g. "product catalog with filters", "user profile edit page") |
| Typical output / 典型输出 | Shortcode class / Block files / Page template, depending on approach chosen |

---

## /wp-api-wrapper

**English**: Generate external API wrapper class with authentication, retry logic, rate limiting, and logging. Supports Basic Auth, OAuth2, API key headers, token refresh, exponential backoff, and WP error handling.

**中文**: 生成外部 API 包装类，包含认证、重试逻辑、速率限制和日志。支持基础认证、OAuth2、API key 头、令牌刷新、指数退避和 WP 错误处理。

| Syntax / 语法 | `/wp-api-wrapper <api-name> <api-base-url>` |
| Arguments / 参数 | `api-name` (required): Name for the API (e.g. `stripe`, `mailchimp`)<br>`api-base-url` (required): Base URL for the API |
| Typical output / 典型输出 | `src/class-<prefix>-api-<api-name>-wrapper.php` with auth, request, retry methods |

### Example / 示例

```bash
/wp-api-wrapper mailchimp https://us1.api.mailchimp.com/3.0
```

---

## /wp-make-block

**English**: Turn a reference website URL into a block theme design system. Analyzes the reference site, creates color palette, typography, spacing, and layout tokens in `theme.json`, then scaffolds block patterns and template parts matching the reference.

**中文**: 将参考网站 URL 转换为块主题设计系统。分析参考网站，在 `theme.json` 中创建调色板、排版、间距和布局 token，然后搭建匹配参考的 block patterns 和模板部件。

| Syntax / 语法 | `/wp-make-block <reference-url>` |
| Arguments / 参数 | `reference-url` (required): URL of the design reference site |
| Typical output / 典型输出 | theme.json + block patterns + template parts + style.css design system |

### Example / 示例

```bash
/wp-make-block https://example.com/design-reference
```

---

# Release Command / 发布命令

## /wp-release

**English**: Release a new plugin version. Syncs version numbers across files (main plugin file header, readme.txt Stable tag, composer.json, PHP constant), creates changelog entry, commits, tags, and pushes.

**中文**: 发布新的插件版本。同步文件间的版本号（主插件文件头、readme.txt Stable tag、composer.json、PHP 常量），创建更新日志条目，提交、打标签并推送。

| Syntax / 语法 | `/wp-release [<version>]` |
| Arguments / 参数 | `version` (optional): Semantic version (e.g. `1.2.0`). If omitted, the agent suggests based on current version. |
| Typical output / 典型输出 | Updated files + git commit + git tag + changelog entry |

### Files Updated / 更新的文件

- Main plugin file header: `Version:` line
- readme.txt: `Stable tag:` line
- composer.json: `version:` field
- PHP version constant (if exists)
- Changelog: New entry added

### Changelog format / 更新日志格式

```
= 1.2.0 =
* New: Feature description
* Fix: Bug description
* Dev: Technical change description
```

---

# Command Quick Reference / 命令速查表

## Core Workflow / 核心工作流

| Command | 命令 | Quick syntax / 快速语法 | When to use / 何时使用 |
|---------|------|------------------------|----------------------|
| `/wp-plan` | 规划 | `/wp-plan <feature>` | Start a new feature / 开始新功能 |
| `/wp-todo` | 执行 | `/wp-todo spec/X/01-area.md [--tdd=int]` | Execute tasks from a spec / 执行 spec 任务 |
| `/wp-review` | 审查 | `/wp-review` | After todo finishes / 任务完成后 |

## Submission & Quality / 提交与质量

| Command | 命令 | Quick syntax / 快速语法 | When to use / 何时使用 |
|---------|------|------------------------|----------------------|
| `/wp-submit-review` | 提交审查 | `/wp-submit-review` | Before WP.org release / 提交 WP.org 前 |
| `/wp-test-generate` | 生成测试 | `/wp-test-generate [class]` | After writing code / 写完代码后 |
| `/wp-test` | 运行测试 | `/wp-test [file]` | Before release / 发布前 |
| `/wp-verify` | 质量验证 | `/wp-verify` | Full quality check / 完整质量检查 |

## Code Generation / 代码生成

| Command | 命令 | Quick syntax / 快速语法 | What it creates / 生成内容 |
|---------|------|------------------------|--------------------------|
| `/wp-init-plugin` | 初始化插件 | `/wp-init-plugin [name]` | Full plugin scaffold / 完整插件 scaffold |
| `/wp-init-theme` | 初始化主题 | `/wp-init-theme [name]` | Theme scaffold / 主题 scaffold |
| `/wp-custom-table` | 自定义表 | `/wp-custom-table orders` | DB table + Repository |
| `/wp-rest-api` | REST API | `/wp-rest-api products` | WP_REST_Controller |
| `/wp-ajax` | AJAX 处理 | `/wp-ajax save_contact` | AJAX handler class |
| `/wp-option-page` | 设置页面 | `/wp-option-page faq` | Settings API page |
| `/wp-list-table` | 列表表格 | `/wp-list-table subs` | WP_List_Table class |
| `/wp-frontend-page` | 前端页面 | `/wp-frontend-page X` | Shortcode / Block / Template |
| `/wp-api-wrapper` | API 包装 | `/wp-api-wrapper stripe URL` | External API wrapper class |
| `/wp-make-block` | 主题设计 | `/wp-make-block URL` | theme.json design system |

## Release / 发布

| Command | 命令 | Quick syntax / 快速语法 | When to use / 何时使用 |
|---------|------|------------------------|----------------------|
| `/wp-release` | 发布 | `/wp-release 1.2.0` | Version sync + tag + changelog / 版本同步+标签 |

---

*Version: 1.7.0-dsh.3*
*Last updated: 2026-08-17*

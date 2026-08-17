# dsh-everything-wp

> [English](README.md) | 中文

DSH (DeepSeek Harness) 插件，将 [everything-wp](https://github.com/oberonlai/everything-wp) 适配到 DeepSeek Harness —— 为 WordPress 插件开发提供 AI 工具集。

## 状态：Phase 3 完成（v1.7.0-dsh.3）

everything-wp 到 DSH 的完整适配：5 个 Agent + 18 个 Slash 命令，支持模式门控和规则内联注入。已通过完整的「规划 → 执行 × 3 → 审查 → 质量验证」端到端流程，产出了一个可运行的 WordPress 联系表单插件（5 个 PHP 文件，554 行代码）。

| 组件 | 数量 | 状态 |
|------|------|------|
| Slash 命令 | 18 | ✅ |
| Agent（system prompt section） | 5 | ✅ |
| 规则（内联到 prompt） | 5 | ✅ |
| 命令文档（内联注入用） | 14 | ✅ |

---

## 功能亮点

- 🧠 **5 个专用 AI Agent** — wp-planner（规划）、wp-task-executor（执行）、wp-code-reviewer（审查）、wp-submission-reviewer（WP.org 合规）、wp-code-quality（质量）
- 🛠️ **18 个 WordPress 开发命令** — 规划/执行/审查工作流 + 代码质量 + 代码生成 + 发布
- 🚪 **模式门控** — 多 Agent 共存时，模型只遵循最近一次调用的命令指令，彻底解决指令冲突
- 📄 **规则内联注入** — 所有 rules/、skills/ 内容直接嵌入 system prompt，模型不会去工作区查找不存在的文件
- 📁 **零编排多 Agent 协作** — Agent 通过 `spec/` 目录和 `src/` 目录自然协作，无需显式编排层
- 🌐 **完整双语文档** — COMMANDS.md 和 QUICKSTART.md 均为中英双语，README 有独立中文版

---

## 快速开始

> 完整的新手教程（含首个 FAQ Accordion 功能构建示例）请查看：
> [QUICKSTART.md](QUICKSTART.md) · [COMMANDS.md](COMMANDS.md)

### 1. 前置条件

| 软件 | 最低版本 | 安装方法 |
|------|---------|---------|
| Node.js | 22.17+ | `winget install OpenJS.NodeJS.LTS` |
| pnpm | 最新版 | `npm install -g pnpm` |
| DSH | v0.1.x | `npm install -g --allow-scripts=@deepseek-ai/dsh-subprocess-local,koffi,node-pty,@google/genai,protobufjs @deepseek-ai/dsh` |
| DeepSeek API Key | 有效 Key | 在 DSH Web UI Settings 中配置 |

### 2. 安装插件

```bash
# 克隆仓库
git clone https://github.com/Zerozhao314/dsh-everything-wp.git
cd dsh-everything-wp

# 构建
npm install
npm run build

# 注册到 DSH
dsh plugin --profile web add .

# 启动 Web UI
dsh web
```

浏览器打开 `http://127.0.0.1:3080`，在输入框输入 `/`，如果能看到 18 个 `/wp-*` 命令，安装成功！🎊

### 3. 标准工作流程

```
/wp-plan 构建一个 FAQ 手风琴短代码 + 设置页面
        ↓
/wp-todo spec/faq-accordion/01-admin-settings.md --tdd=int   # 构建 Area 1，提交
/wp-todo spec/faq-accordion/02-frontend-accordion.md --tdd=int # 构建 Area 2，提交
        ↓
/wp-review    # 资深工程师级别的审查（安全/性能/验收标准 6 维度）
        ↓
/wp-verify    # PHPStan + PHPUnit + PHPCS 全量质量检查
```

💡 **小技巧**：每个步骤都用**新会话**，旧上下文会污染模型输出。

---

## 18 个命令速查

### 核心工作流（3 个）

| 命令 | 用途 |
|------|------|
| `/wp-plan <功能描述>` | 生成 6 步、3 层（数据/集成/界面）的实现规划，写入 `spec/` |
| `/wp-todo <spec路径> [--tdd=int]` | 按 spec 任务写代码 + 测试，TDD 模式写集成或单元测试 |
| `/wp-review` | 审查当前 diff（或最近 commit），6 维度输出 Must/Should/Nice 分级报告 |

### 提交与质量（4 个）

| 命令 | 用途 |
|------|------|
| `/wp-submit-review` | WordPress.org 提交前的 6 项合规检查（许可证/readme/禁止文件等） |
| `/wp-test-generate [类名]` | 生成 PHPUnit 测试 |
| `/wp-test [文件]` | 运行 PHPUnit 测试并分析失败原因 |
| `/wp-verify` | 全量质量检查：PHPStan → PHPUnit → PHPCS |

### 代码生成（11 个）

| 命令 | 生成内容 |
|------|---------|
| `/wp-init-plugin [插件名]` | 完整插件 scaffold（含测试 + CI/CD） |
| `/wp-init-theme [主题名]` | 经典或块主题 scaffold |
| `/wp-custom-table <表名>` | DB 自定义表 + Repository（CRUD + $wpdb->prepare） |
| `/wp-rest-api <资源名>` | WP_REST_Controller 子类（含路由/权限/schema 验证） |
| `/wp-ajax <动作名>` | AJAX 处理（nonce + 能力 + JSON 响应） |
| `/wp-option-page <页面名>` | Settings API 设置页面（子菜单 + section + field） |
| `/wp-list-table <项目名>` | WP_List_Table 子类（排序/分页/搜索/批量操作） |
| `/wp-frontend-page <描述>` | 短代码/动态块/页面模板（三选一） |
| `/wp-api-wrapper <名> <URL>` | 外部 API 包装类（认证/重试/限流/日志） |
| `/wp-make-block <URL>` | 从参考网站生成块主题设计系统（theme.json） |
| `/wp-release [版本号]` | 发布新版本（版本号同步+变更日志+commit+tag） |

**详细的中英文参数表和示例请见 [COMMANDS.md](COMMANDS.md)**。

---

## 架构原理

### 两种命令注册模式

| 模式 | 适用 | 实现 |
|------|------|------|
| **agent-backed** | 有对应 Agent 的命令（7 个） | System prompt section（模式门控） + `agent.steer()` 触发 |
| **doc-inline** | 无 Agent 的代码生成命令（11 个） | Handler 读取命令文档，作为 steer 消息内联注入，空闲时零 token |

### 模式门控（解决多 Agent 指令冲突）

每个 Agent 的 system prompt section 都包裹在条件注释中：

```
<!-- MODE GATE: PLANNING -->
<!-- 只在用户最近一次 slash command 为 /wp-plan 时生效，否则忽略本节。 -->
```

多命令共享的 Agent（如 code-quality）使用 OR 门控：

```
<!-- MODE GATE: CODE_QUALITY -->
<!-- 只在命令为 /wp-test-generate OR /wp-test OR /wp-verify 时生效。 -->
```

### 规则内联注入（避免模型查找外部文件）

`buildPrompt()` 函数将所有 `rules/*.md` 直接注入为 `INLINE APPENDIX`，`inlineRefs()` 函数将 skill 引用和表格替换为「已内联」提示。模型永远不会尝试读取不存在的 `rules/` 或 `skills/` 目录。

### 多 Agent 文件系统协作

```
planner       → 写入 spec/<功能>/     (生成规划文件)
                     ↓
task-executor → 写入 src/, tests/     (读取 spec，写代码写测试)
                     ↓
code-reviewer → 输出审查报告           (读取 src/ diff)
```

无需显式编排 —— 每个 Agent 只知道自己的输入和输出，通过文件系统自然协作。

---

## 文件结构

```
dsh-everything-wp/
├── README.md              # 英文说明（本文件）
├── README.zh-CN.md        # 中文说明
├── COMMANDS.md            # 18 命令中英文参考
├── QUICKSTART.md          # 新手入门教程（双语）
├── package.json           # DSH bundle 声明
├── cordis.patch.yml       # Cordis 插件树 patch
├── tsconfig.json
├── src/
│   └── index.ts           # 入口：注册 5 Agent + 18 命令
├── agents/                # 5 个 Agent 提示（已去除 frontmatter）
│   ├── planner.md              规划（6 步检查清单）
│   ├── task-executor.md        执行（spec → 代码）
│   ├── code-reviewer.md        审查（6 维度分级）
│   ├── submission-reviewer.md  WP.org 合规审查（6 项）
│   └── code-quality.md         质量（3 种模式共享）
├── commands/              # 14 个命令文档（已去除 frontmatter）
└── rules/                 # 5 个规则文件（内联到 system prompt）
    ├── acceptance-criteria.md  验收标准与风险分级
    ├── wp-essentials.md        WordPress 基本规范
    ├── performance-lighthouse.md 性能优化
    ├── org-submission.md       WP.org 提交规则
    └── phpstan.md              PHPStan 级别对照
```

---

## 排错指南

DSH 插件开发中的所有常见问题（环境安装、`dsh.bundle` 配置、Cordis inject、命令路由冲突、模式门控、外部文件查找等）都整理在：

👉 [**DSH 插件开发排错 SKILL**](https://github.com/Zerozhao314/dsh-everything-wp#troubleshooting)

共 17 章节，覆盖从零安装到端到端验证的全部问题。

---

## 许可证

GPL-2.0-or-later（继承自 everything-wp）

## 致谢

- 原始项目：[everything-wp](https://github.com/oberonlai/everything-wp) by Oberon Lai
- 运行框架：[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) by DeepSeek AI

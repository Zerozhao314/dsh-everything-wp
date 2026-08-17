# dsh-everything-wp

> English | [中文](README.zh-CN.md)

DSH (DeepSeek Harness) adapter for [everything-wp](https://github.com/oberonlai/everything-wp) — WordPress plugin development AI toolkit.

## Status: Phase 3 Complete (v1.7.0-dsh.3)

Full adaptation of everything-wp to DSH: 5 agents + 18 slash commands, with mode gating and inline rules injection. End-to-end verified through a complete `plan → todo × 3 → review → verify` workflow that produced a working WordPress contact form plugin (5 PHP files, 554 lines).

| Component | Count | Status |
|-----------|-------|--------|
| Slash commands | 18 | ✅ |
| Agents (system prompt sections) | 5 | ✅ |
| Rules (inlined) | 5 | ✅ |
| Command docs (for doc-inline injection) | 14 | ✅ |

### Architecture

Two command registration patterns:

| Pattern | Use case | Implementation |
|---------|----------|----------------|
| **agent-backed** | Command has `invokes_agent` | System prompt section (mode-gated) + `agent.steer()` trigger |
| **doc-inline** | Command has no agent, only docs | Handler reads command doc and injects as steer message |

Key design decisions:

- **Mode gating**: System prompt sections include conditional comments so the model only follows agent instructions when the corresponding slash command was the most recent input. Multi-command agents (e.g., `code-quality` shared by `/wp-test-generate`, `/wp-test`, `/wp-verify`) use OR-joined gate conditions.
- **Inline injection**: All `rules/*.md` content is embedded directly into system prompt sections as `INLINE APPENDIX`. The `inlineRefs()` function rewrites `@everything-wp/` references and skill auto-detection tables to "already inlined" notices, preventing the model from searching for external files.
- **Agent collaboration via filesystem**: Agents coordinate through `spec/` (planner writes plans) and `src/` (task-executor writes code, code-reviewer reads diffs) — no explicit orchestration needed.

## Installation

### Prerequisites

- Node.js 22.17+
- DSH v0.1.x (`npm install -g @deepseek-ai/dsh`)
- pnpm (`npm install -g pnpm`)

### Build

```bash
cd dsh-everything-wp
npm install
npm run build
```

### Register with DSH

```bash
# Register as a local plugin
dsh plugin --profile web add ./dsh-everything-wp

# Start DSH Web UI
dsh web

# Open http://127.0.0.1:3080
```

### Verify

In the DSH Web UI, type `/` to see all 18 `/wp-*` commands in the autocomplete dropdown.

Example workflow:

```
/wp-plan Add a contact form shortcode [simple_contact_form] with validation, DB storage, and email notification
/wp-todo spec/<feature>/01-data-layer.md
/wp-todo spec/<feature>/02-email-layer.md
/wp-todo spec/<feature>/03-form-layer.md
/wp-review
/wp-verify
```

## Commands

### Agent-backed (7 commands)

| Command | Agent | Purpose |
|---------|-------|---------|
| `/wp-plan <feature>` | wp-planner | Generate implementation plan (6-step checklist → `spec/`) |
| `/wp-todo <spec-file>` | wp-task-executor | Execute tasks from a spec file (TDD) |
| `/wp-review` | wp-code-reviewer | Review current diff or latest commit |
| `/wp-submit-review` | wp-submission-reviewer | WordPress.org submission compliance check (6 items) |
| `/wp-test-generate` | wp-code-quality | Generate PHPUnit tests |
| `/wp-test` | wp-code-quality | Run PHPUnit tests |
| `/wp-verify` | wp-code-quality | Full quality verification (PHPStan → PHPUnit → PHPCS) |

### Doc-inline (11 commands)

| Command | Purpose |
|---------|---------|
| `/wp-api-wrapper <class>` | Generate AJAX API wrapper class |
| `/wp-custom-table <table>` | Generate custom DB table + CRUD |
| `/wp-frontend-page <slug>` | Generate frontend page template |
| `/wp-init-plugin <slug>` | Initialize new plugin scaffold |
| `/wp-init-theme <slug>` | Initialize new theme scaffold |
| `/wp-list-table <class>` | Generate WP_List_Table child class |
| `/wp-make-block <name>` | Generate Gutenberg block |
| `/wp-option-page <slug>` | Generate settings/options page |
| `/wp-release <version>` | Prepare release (changelog, version bump) |
| `/wp-rest-api <resource>` | Generate WP_REST_Controller subclass |
| `/wp-ajax <action>` | Generate AJAX handler |

## File Structure

```
dsh-everything-wp/
├── package.json              # DSH bundle declaration
├── cordis.patch.yml          # Cordis plugin tree patch
├── tsconfig.json
├── src/
│   └── index.ts              # Entry: registers 5 agents + 18 commands
├── dist/                     # tsc output (gitignored)
├── agents/                   # 5 agent prompts (frontmatter removed)
│   ├── planner.md
│   ├── task-executor.md
│   ├── code-reviewer.md
│   ├── submission-reviewer.md
│   └── code-quality.md
├── commands/                 # 14 command docs (frontmatter removed)
│   ├── plan.md, todo.md, review.md
│   ├── api-wrapper.md, rest-api.md, wp-ajax.md, ...
└── rules/                    # 5 rule files (inlined into system prompt)
    ├── acceptance-criteria.md
    ├── wp-essentials.md
    ├── performance-lighthouse.md
    ├── org-submission.md
    └── phpstan.md
```

## How It Works

### Mode Gating

Each agent's system prompt section is wrapped in conditional comments:

```
<!-- MODE GATE: PLANNING -->
<!-- Active only when user's most recent slash command was /wp-plan. Otherwise ignore this section. -->
```

For multi-command agents:

```
<!-- MODE GATE: CODE_QUALITY -->
<!-- Active only when user's most recent slash command was /wp-test-generate OR /wp-test OR /wp-verify. -->
```

### Inline Injection

The `buildPrompt()` function assembles each agent's system prompt:

```typescript
function buildPrompt(modeName, commandNames, agentPath, appendixPaths) {
  const agentBody = inlineRefs(loadMarkdown(agentPath));
  const appendices = appendixPaths
    .map((p) => `\n\n## INLINE APPENDIX: ${p}\n\n${loadMarkdown(p)}`)
    .join("");
  return [
    `<!-- MODE GATE: ${modeName} -->`,
    `<!-- IMPORTANT: Do NOT attempt to load external files in rules/, skills/, or commands/ directories. -->`,
    agentBody,
    appendices,
  ].join("\n");
}
```

The `inlineRefs()` function rewrites all external references:
- `@everything-wp/rules/X.md` → `Refer to INLINE APPENDIX: X.md`
- `skills/<name>/SKILL.md` → `Refer to INLINE APPENDIX (already inlined)`
- `@skill-name` → `inline skill reference`
- Skill auto-detection tables → "All relevant content has been inlined"

### Agent Collaboration

```
planner → spec/<feature>/     (writes plan files)
                ↓
task-executor → src/           (reads spec, writes code)
                ↓
code-reviewer → review report  (reads src/ diff)
```

Agents coordinate through the filesystem. No plugin code orchestrates them — each agent only knows its own input and output.

## DSH API Reference

Verified API calls (DSH v0.1.0-rc.6):

| API | Purpose |
|-----|---------|
| `ctx.inject(['commands'], cb)` | Register slash commands (one per callback to avoid routing conflicts) |
| `ctx.inject(['systemPrompt'], cb)` | Register system prompt sections |
| `ctx.systemPrompt.section({name, order, text})` | Add a system prompt section |
| `ctx.commands.register({name, description, input, handler})` | Register a slash command |
| `handler: ({agent, rawInput}) => ({kind, text})` | Command handler signature (synchronous) |
| `agent.steer(createUserMessage({...}))` | Inject a user message to trigger agent response |
| `createUserMessage({content, source})` | From `@deepseek-ai/dsh-llm` |

## Troubleshooting

See the [DSH Plugin Dev Troubleshoot SKILL](../.trae/skills/dsh-plugin-dev-troubleshoot/SKILL.md) for a comprehensive 17-section troubleshooting guide covering:

- Environment setup (Node.js, pnpm, native modules)
- `dsh.bundle` and `cordis.patch.yml` schema
- Cordis `inject` mechanism
- Slash command routing conflicts
- Inline injection and mode gating
- End-to-end verification methodology

## License

GPL-2.0-or-later (inherited from everything-wp)

## Credits

Adapted from [everything-wp](https://github.com/oberonlai/everything-wp) by Oberon Lai.
Built for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) community.

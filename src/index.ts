/**
 * dsh-everything-wp — DSH adapter for everything-wp v1.7.0
 * Phase 3: 全量适配 18 个命令 + 5 个 agent
 *
 * 架构:
 * - 5 个 agent 通过 system prompt section 注入(带模式门控)
 * - 7 个有 invokes_agent 的命令: steer 消息触发对应 agent
 * - 11 个无 invokes_agent 的命令: 命令文档作为 steer 消息内联注入
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createUserMessage } from "@deepseek-ai/dsh-llm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadMarkdown(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function inlineRefs(text: string): string {
  return text
    .replace(
      /Read `?@?everything-wp\/?rules\/([^`\s]+)`?/g,
      (_, rel) => `Refer to INLINE APPENDIX: ${rel}`
    )
    .replace(
      /apply `?@?everything-wp\/?rules\/([^`\s]+)`?/g,
      (_, rel) => `apply (see INLINE APPENDIX: ${rel})`
    )
    .replace(
      /from `?@?everything-wp\/?rules\/([^`\s]+)`?/g,
      (_, rel) => `from INLINE APPENDIX: ${rel}`
    )
    .replace(
      /Read `?@?everything-wp\/?skills\/([^`\s]+)\/SKILL\.md`?/g,
      (_, rel) => `Refer to INLINE APPENDIX: skills/${rel}`
    )
    .replace(
      /read `?@?everything-wp\/?commands\/([^`\s]+)\.md`?/g,
      (_, rel) => `read INLINE APPENDIX: commands/${rel}.md`
    )
    .replace(
      /@everything-wp\//g,
      ""
    )
    // 处理不带 everything-wp 前缀的 skill 引用
    .replace(
      /Load `?skills\/([^`\s]+)\/SKILL\.md`?/g,
      (_, rel) => `Refer to INLINE APPENDIX (skills/${rel} content is inlined where relevant)`
    )
    .replace(
      /read `?skills\/([^`\s]+)\/SKILL\.md`?/g,
      (_, rel) => `Refer to INLINE APPENDIX (skills/${rel} content is inlined where relevant)`
    )
    .replace(
      /`skills\/([^`\s]+)\/SKILL\.md`/g,
      (_, rel) => `INLINE APPENDIX (skills/${rel})`
    )
    .replace(
      /`@skill-name` references from `skills\/`/g,
      "inline references (already injected as INLINE APPENDIX)"
    )
    .replace(
      /`@skill-name`/g,
      "inline skill reference"
    )
    // 替换 skill auto-detection 表格为说明文字
    .replace(
      /Before Step 1, check the project for these signals and load the matching\nskill docs from `skills\/`[\s\S]*?List auto-loaded skills in the \*\*References\*\* block alongside user-provided ones\./,
      "All relevant skill content has been inlined as INLINE APPENDIX in the system prompt. Do NOT attempt to load external skill files. Do NOT search for skills/ directory. If WordPress backend patterns are needed, refer to the INLINE APPENDIX sections already provided."
    );
}

function buildPrompt(
  modeName: string,
  commandNames: string[],
  agentPath: string,
  appendixPaths: string[]
): string {
  const gateCondition = commandNames
    .map((c) => `user's most recent slash command was ${c}`)
    .join(" OR ");
  const agentBody = inlineRefs(loadMarkdown(agentPath));
  const appendices = appendixPaths
    .map((p) => {
      const content = loadMarkdown(p);
      return `\n\n---\n\n## INLINE APPENDIX: ${p}\n\n${content}`;
    })
    .join("");

  return [
    `<!-- MODE GATE: ${modeName} -->`,
    `<!-- Active only when ${gateCondition}. Otherwise ignore this section. -->`,
    ``,
    `<!-- IMPORTANT: All rules and skill content are inlined as INLINE APPENDIX below. Do NOT attempt to load, read, or search for external files in rules/, skills/, or commands/ directories. Do NOT use @skill-name references. -->`,
    ``,
    agentBody,
    appendices,
  ].join("\n");
}

export const name = "dsh-everything-wp";

export function apply(ctx: any): void {
  console.log("[dsh-everything-wp] applying plugin (Phase 3: 18 commands, 5 agents)...");

  // ==========================================================================
  // 1. 注册 5 个 system prompt section (agent)
  // ==========================================================================

  ctx.inject(["systemPrompt"], (promptCtx: any) => {
    promptCtx.systemPrompt.section({
      name: "wp-planner",
      order: 50,
      text: buildPrompt("PLANNING", ["/wp-plan"], "agents/planner.md", ["rules/acceptance-criteria.md"]),
    });
    console.log("[dsh-everything-wp] + wp-planner");

    promptCtx.systemPrompt.section({
      name: "wp-task-executor",
      order: 51,
      text: buildPrompt("EXECUTION", ["/wp-todo"], "agents/task-executor.md", [
        "rules/acceptance-criteria.md",
        "rules/wp-essentials.md",
        "rules/performance-lighthouse.md",
      ]),
    });
    console.log("[dsh-everything-wp] + wp-task-executor");

    promptCtx.systemPrompt.section({
      name: "wp-code-reviewer",
      order: 52,
      text: buildPrompt("REVIEW", ["/wp-review"], "agents/code-reviewer.md", [
        "rules/acceptance-criteria.md",
        "rules/wp-essentials.md",
      ]),
    });
    console.log("[dsh-everything-wp] + wp-code-reviewer");

    promptCtx.systemPrompt.section({
      name: "wp-submission-reviewer",
      order: 53,
      text: buildPrompt("SUBMISSION_REVIEW", ["/wp-submit-review"], "agents/submission-reviewer.md", [
        "rules/acceptance-criteria.md",
        "rules/org-submission.md",
      ]),
    });
    console.log("[dsh-everything-wp] + wp-submission-reviewer");

    promptCtx.systemPrompt.section({
      name: "wp-code-quality",
      order: 54,
      text: buildPrompt(
        "CODE_QUALITY",
        ["/wp-test-generate", "/wp-test", "/wp-verify"],
        "agents/code-quality.md",
        ["rules/acceptance-criteria.md", "rules/wp-essentials.md", "rules/phpstan.md"]
      ),
    });
    console.log("[dsh-everything-wp] + wp-code-quality");
  });

  // ==========================================================================
  // 2. 注册 7 个有 invokes_agent 的 slash command
  // ==========================================================================

  ctx.inject(["commands"], (cmdCtx: any) => {
    cmdCtx.commands.register({
      name: "wp-plan",
      description: "Create implementation plan using 3-layer task breakdown",
      input: { hint: "<feature description>" },
      handler: ({ agent, rawInput }: { agent: any; rawInput: string }) => {
        const feature = rawInput.trim();
        if (!feature) return { kind: "success" as const, text: "Usage: /wp-plan <feature description>" };
        agent.steer(createUserMessage({
          content: [{ type: "text", text: `[MODE: PLANNING]\n\nPlan: ${feature}` }],
          source: { kind: "user" },
        }));
        return { kind: "success" as const, text: `Planning: ${feature}` };
      },
    });
    console.log("[dsh-everything-wp] + /wp-plan");
  });

  ctx.inject(["commands"], (cmdCtx: any) => {
    cmdCtx.commands.register({
      name: "wp-todo",
      description: "Execute development tasks from a spec file (supports --tdd)",
      input: { hint: "<spec-file-path> [--tdd=unit|int]" },
      handler: ({ agent, rawInput }: { agent: any; rawInput: string }) => {
        const input = rawInput.trim();
        if (!input) return { kind: "success" as const, text: "Usage: /wp-todo <spec-file-path> [--tdd]" };
        const tddMatch = input.match(/--tdd(?:=(unit|int))?/);
        const tddMode = tddMatch ? (tddMatch[1] ? `TDD (${tddMatch[1]})` : "TDD (auto)") : "Standard";
        const specPath = input.replace(/--tdd(?:=(?:unit|int))?/, "").trim();
        agent.steer(createUserMessage({
          content: [{ type: "text", text: `[MODE: EXECUTION]\nTDD mode: ${tddMode}\n\nExecute tasks from spec file: ${specPath}` }],
          source: { kind: "user" },
        }));
        return { kind: "success" as const, text: `Executing: ${specPath}\nMode: ${tddMode}` };
      },
    });
    console.log("[dsh-everything-wp] + /wp-todo");
  });

  ctx.inject(["commands"], (cmdCtx: any) => {
    cmdCtx.commands.register({
      name: "wp-review",
      description: "Senior-engineer code review on the current diff",
      input: { hint: "(no arguments)" },
      handler: ({ agent }: { agent: any; rawInput: string }) => {
        agent.steer(createUserMessage({
          content: [{ type: "text", text: `[MODE: REVIEW]\n\nReview the current diff. First check the working tree diff with \`git diff HEAD -- 'src/**/*.php' 'tests/**/*.php'\`. If the working tree diff is empty, review the latest commit instead with \`git diff HEAD~1..HEAD -- 'src/**/*.php' 'tests/**/*.php'\`.` }],
          source: { kind: "user" },
        }));
        return { kind: "success" as const, text: "Reviewing current diff..." };
      },
    });
    console.log("[dsh-everything-wp] + /wp-review");
  });

  ctx.inject(["commands"], (cmdCtx: any) => {
    cmdCtx.commands.register({
      name: "wp-submit-review",
      description: "Review plugin for WordPress.org submission compliance",
      input: { hint: "(no arguments)" },
      handler: ({ agent }: { agent: any; rawInput: string }) => {
        agent.steer(createUserMessage({
          content: [{ type: "text", text: `[MODE: SUBMISSION_REVIEW]\n\nRun WordPress.org submission review on this plugin.` }],
          source: { kind: "user" },
        }));
        return { kind: "success" as const, text: "Running submission review..." };
      },
    });
    console.log("[dsh-everything-wp] + /wp-submit-review");
  });

  ctx.inject(["commands"], (cmdCtx: any) => {
    cmdCtx.commands.register({
      name: "wp-test-generate",
      description: "Generate PHPUnit tests for existing PHP code",
      input: { hint: "<php-file-or-class>" },
      handler: ({ agent, rawInput }: { agent: any; rawInput: string }) => {
        const target = rawInput.trim();
        agent.steer(createUserMessage({
          content: [{ type: "text", text: `[MODE: CODE_QUALITY]\nMode: generate\n\nGenerate PHPUnit tests for: ${target || "all PHP classes"}` }],
          source: { kind: "user" },
        }));
        return { kind: "success" as const, text: `Generating tests for: ${target || "all classes"}` };
      },
    });
    console.log("[dsh-everything-wp] + /wp-test-generate");
  });

  ctx.inject(["commands"], (cmdCtx: any) => {
    cmdCtx.commands.register({
      name: "wp-test",
      description: "Execute PHPUnit tests, analyze failures, and suggest fixes",
      input: { hint: "[<test-file>]" },
      handler: ({ agent, rawInput }: { agent: any; rawInput: string }) => {
        const target = rawInput.trim();
        agent.steer(createUserMessage({
          content: [{ type: "text", text: `[MODE: CODE_QUALITY]\nMode: test\n\nRun tests${target ? `: ${target}` : " (all)"}.` }],
          source: { kind: "user" },
        }));
        return { kind: "success" as const, text: "Running tests..." };
      },
    });
    console.log("[dsh-everything-wp] + /wp-test");
  });

  ctx.inject(["commands"], (cmdCtx: any) => {
    cmdCtx.commands.register({
      name: "wp-verify",
      description: "Run all code quality checks (PHPStan + PHPUnit + PHPCS)",
      input: { hint: "(no arguments)" },
      handler: ({ agent }: { agent: any; rawInput: string }) => {
        agent.steer(createUserMessage({
          content: [{ type: "text", text: `[MODE: CODE_QUALITY]\nMode: verify\n\nRun full code quality verification (PHPStan → PHPUnit → PHPCS).` }],
          source: { kind: "user" },
        }));
        return { kind: "success" as const, text: "Running full quality check..." };
      },
    });
    console.log("[dsh-everything-wp] + /wp-verify");
  });

  // ==========================================================================
  // 3. 注册 11 个无 invokes_agent 的 slash command (命令文档内联注入)
  // ==========================================================================

  const docCommands: Array<{ name: string; desc: string; hint: string; file: string }> = [
    { name: "wp-api-wrapper", desc: "Generate external API wrapper class with auth, retry, and logging", hint: "<api-name> <api-base-url>", file: "commands/api-wrapper.md" },
    { name: "wp-custom-table", desc: "Generate custom DB table with Repository class for CRUD", hint: "<table-name>", file: "commands/custom-table.md" },
    { name: "wp-frontend-page", desc: "Generate frontend page (Shortcode/Block/Page Template)", hint: "<page-description>", file: "commands/frontend-page.md" },
    { name: "wp-init-plugin", desc: "Initialize WordPress plugin dev environment with tests and CI/CD", hint: "[<plugin-name>]", file: "commands/init-plugin.md" },
    { name: "wp-init-theme", desc: "Initialize WordPress theme (classic or block) with tests and CI/CD", hint: "[<theme-name>]", file: "commands/init-theme.md" },
    { name: "wp-list-table", desc: "Generate WP_List_Table class with sorting, pagination, search", hint: "<table-name>", file: "commands/list-table.md" },
    { name: "wp-make-block", desc: "Turn a reference website URL into a block theme design system", hint: "<reference-url>", file: "commands/make-block.md" },
    { name: "wp-option-page", desc: "Generate WordPress settings page using Settings API", hint: "<option-page-name>", file: "commands/option-page.md" },
    { name: "wp-release", desc: "Release a new plugin version — sync versions, commit, tag, push", hint: "[<version>]", file: "commands/release.md" },
    { name: "wp-rest-api", desc: "Generate WordPress REST API controller with validation", hint: "<resource-name>", file: "commands/rest-api.md" },
    { name: "wp-ajax", desc: "Generate WordPress AJAX handler with nonce and permission checks", hint: "<action-name>", file: "commands/wp-ajax.md" },
  ];

  for (const cmd of docCommands) {
    ctx.inject(["commands"], (cmdCtx: any) => {
      cmdCtx.commands.register({
        name: cmd.name,
        description: cmd.desc,
        input: { hint: cmd.hint },
        handler: ({ agent, rawInput }: { agent: any; rawInput: string }) => {
          const cmdDoc = loadMarkdown(cmd.file);
          const args = rawInput.trim();
          const message = [
            `[MODE: COMMAND]`,
            `Command: /${cmd.name}`,
            args ? `Arguments: ${args}` : `(no arguments)`,
            ``,
            `Follow the command document below to complete this task. Do NOT search for external files — all instructions are inline below.`,
            ``,
            `---`,
            ``,
            cmdDoc,
          ].join("\n");
          agent.steer(createUserMessage({
            content: [{ type: "text", text: message }],
            source: { kind: "user" },
          }));
          return { kind: "success" as const, text: `Executing /${cmd.name}...` };
        },
      });
      console.log(`[dsh-everything-wp] + /${cmd.name}`);
    });
  }

  console.log("[dsh-everything-wp] Phase 3 ready: 5 agents + 18 commands registered");
}

export const pluginMeta = {
  version: "1.7.0-dsh.3",
  phase: 3 as const,
  agents: ["wp-planner", "wp-task-executor", "wp-code-reviewer", "wp-submission-reviewer", "wp-code-quality"],
  commands: [
    "wp-plan", "wp-todo", "wp-review",
    "wp-submit-review", "wp-test-generate", "wp-test", "wp-verify",
    "wp-api-wrapper", "wp-custom-table", "wp-frontend-page", "wp-init-plugin",
    "wp-init-theme", "wp-list-table", "wp-make-block", "wp-option-page",
    "wp-release", "wp-rest-api", "wp-ajax",
  ],
  inlineRules: ["acceptance-criteria.md", "wp-essentials.md", "performance-lighthouse.md", "org-submission.md", "phpstan.md"],
} as const;

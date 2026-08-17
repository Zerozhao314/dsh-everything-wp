# Acceptance Criteria & Risk-Tiered Review

The shared contract for **how work is specified, implemented, and reviewed** in this
project. `planner`, `task-executor`, and `code-reviewer` all read this file — it is the
single source of truth for two things:

1. **BDD acceptance criteria** — every user story is specified as testable
   `Given / When / Then` scenarios, not vague goals.
2. **Risk-tiered review** — review depth is chosen by the blast radius of the change,
   not applied uniformly.

> Origin: distilled from the spec-driven / BDD workflow in Kuro Hsu's *"Vibe Engineering:
> Code Review"* — write the acceptance criteria before the code, put rigor where it buys
> the most confidence.

---

## 1. The Acceptance Gate

**No production code before acceptance criteria are written and approved.**

The flow is one-directional, and each arrow is a gate:

```
Requirement → Acceptance Criteria (Given/When/Then) → [human approves] → Implementation → Review verifies AC
                        ▲                                                                        │
                        └──────────────── requirement changed? go back and revise ──────────────┘
```

- `planner` writes the criteria into the spec. It never implements.
- `task-executor` may only implement scenarios that exist in the spec. If a scenario is
  ambiguous or missing, stop and ask — do not invent behavior.
- `code-reviewer` verifies the diff actually satisfies the scenarios, and that each
  scenario is backed by a test.
- If the requirement changes mid-flight, the criteria are revised first — code follows
  criteria, never the reverse.

---

## 2. BDD Acceptance Criteria — Given / When / Then

Each user story carries **one or more scenarios**. A scenario is concrete enough that a
reader could turn it into a PHPUnit test without asking a follow-up question.

```
**Scenario**: <short outcome-focused title>
  **Given** <the starting state / preconditions>
  **When** <the action the user or system takes>
  **Then** <the observable, checkable result>
   (**And** <additional Given / Then clauses as needed>)
```

Rules for good scenarios:

- **Observable, not internal** — assert on what a user or an API caller can see (a saved
  row, an HTTP 403, an email sent), not on private method calls.
- **Concrete data** — "Given a logged-out visitor" beats "Given an invalid user". Use real
  example values where they clarify (`Given an order with total 0`).
- **One behavior per scenario** — if a scenario needs two `When`s, it is two scenarios.
- **Cover the unhappy paths** — for anything touching input, auth, or money, write the
  rejection scenarios too (missing nonce → 403, invalid capability → `wp_die`, empty field
  → validation error). These are the scenarios that catch real bugs.

### Example

```
**As a** store admin
**I want to** save shipping settings from the admin page
**So that** checkout uses the correct rates

**Scenario**: Valid submission persists settings
  **Given** an admin user on the shipping settings page
  **When** they submit a valid rate of 5.00 with a correct nonce
  **Then** the option `shop_flat_rate` is stored as `5.00`
  **And** a success notice is shown

**Scenario**: Missing nonce is rejected
  **Given** a POST to the settings handler without a valid nonce
  **When** the handler runs
  **Then** the request is rejected with `wp_die()` and nothing is saved

**Scenario**: Non-admin is forbidden
  **Given** a subscriber-level user
  **When** they POST to the settings handler
  **Then** `current_user_can( 'manage_options' )` blocks the request with a 403
```

### Scenarios → tests

In TDD mode, **each scenario maps to at least one test**. The scenario title becomes the
test's intent, the `Given` becomes setup/fixtures, the `When` becomes the call under test,
and the `Then` becomes the assertion(s). A rejection scenario (`Then ... wp_die()`) is an
integration test asserting the guard fires. A feature is not "done" until every scenario in
its story has a corresponding passing test.

---

## 3. Risk Tiers — choose review depth by blast radius

Not every change deserves line-by-line scrutiny, and some changes deserve nothing less.
Tag each spec area (planner) and each diff (code-reviewer) with one tier. Decide the tier
from four dimensions: **blast radius**, **observability**, **reversibility**, and
**independence of verification**.

| Tier | Applies to | Review focus | Escalate to a higher tier when… |
|------|------------|--------------|---------------------------------|
| 🟢 **Green — Outcome-first** | Throwaway prototypes, low-risk internal tooling, pure glue (menu registration, asset enqueue) | Does it meet the spec? Does the demo work? Skim the diff. | Tests behave oddly, infinite loops, or the "throwaway" is about to ship. |
| 🟡 **Yellow — Selective Review** | New features, refactors of existing code, data-flow changes | API contracts, data flow in/out, the acceptance scenarios. Read the changed logic, not every line. | Schema migration appears, a performance regression is plausible, or auth/money enters scope. |
| 🔴 **Red — Deep Review** | Authentication, capabilities/permissions, payments/checkout, anything handling untrusted input that reaches a sink | Line-by-line implementation, threat model, every rejection scenario. No shortcuts. | — (never downgrade; a Red change stays Red). |

**Defaults for this project:** anything touching nonces, `current_user_can`, `$wpdb`,
payment/checkout, file uploads, or REST endpoints that accept input is **at least 🟡, and
🔴 if it is the auth/capability/SQL/payment boundary itself.**

---

## 4. Test Gauntlet (depth ladder)

The tiers above decide *how hard* to verify. When a Red-tier or high-value change warrants
more than "tests pass", climb this ladder as far as the risk justifies (Uncle Bob's Test
Gauntlet, adapted for WP plugins):

1. **Unit tests** — behavior of pure classes/services.
2. **Gherkin / acceptance tests** — the Given/When/Then scenarios, as integration tests.
3. **QA / manual** — the spec's *Manual Test Script* run by a human.
4. **Coverage** — branch coverage on the new logic (see `wp-essentials.md` §11).
5. **Mutation testing** — for critical calculation/auth logic, confirm tests actually
   catch faults (optional, high-value paths only).
6. **Metrics** — cyclomatic complexity / dependency sanity on new code.

Green stops at 1–3 (often just 3). Yellow does 1–4. Red does whatever it takes, up to 6.

---

## Quick reference

- Write `Given/When/Then` scenarios **before** code — including the rejection paths.
- Every scenario → at least one passing test (TDD mode).
- Tag each change 🟢/🟡/🔴; auth/capability/SQL/payment is 🔴 and never downgrades.
- Review verifies the scenarios are met, not just that the suite is green.

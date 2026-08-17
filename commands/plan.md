# Plan Command

Create a comprehensive implementation plan before writing any code.

## When to Use

- Starting a new feature
- Making architectural changes
- Working on complex refactoring
- Requirements are unclear

## Syntax

```bash
# Basic usage
/wp-plan Build a booking system

# With skill reference (loads API documentation)
/wp-plan @wc-api Build custom checkout flow
/wp-plan @stripe-api @ecpay-api Build payment gateway
```

## Output

Plan is saved to a per-feature folder under `spec/`:

```
spec/<feature-name>/
├── overview.md        # Master index (never numbered)
├── 01-<area>.md       # Area specs, numbered by development order
├── 02-<area>.md
└── 03-<area>.md
```

`overview.md` is the index; the numbered files encode the build sequence (`01` first).

## Acceptance Criteria (BDD)

Every user story in the plan is specified as **`Given / When / Then` scenarios** — including
the rejection/unhappy paths (missing nonce, wrong capability, invalid input) — and each area
is tagged with a review **risk tier** (🟢 / 🟡 / 🔴). These scenarios become the tests in
`/wp-todo --tdd` and the acceptance checklist in `/wp-review`. See
`rules/acceptance-criteria.md` for the contract.

## Related

- Agent: `agents/planner.md`
- Skills: `skills/`

# Todo Command

Execute development tasks defined in a spec file.

## When to Use

- After `/plan` has generated spec files
- When implementing features from a plan
- To track progress on development tasks

## Syntax

```bash
# Execute tasks from a specific spec file (numbered by build order)
/todo spec/booking-system/01-user-registration.md

# Execute from overview
/todo spec/booking-system/overview.md
```

## Process

1. Reads the specified spec file — including its `Given / When / Then` acceptance scenarios
2. Scans `src/` folder to understand current architecture
3. Implements tasks one by one, satisfying every acceptance scenario (happy **and**
   rejection paths). In `--tdd` mode each scenario becomes at least one test — see
   `rules/acceptance-criteria.md`.
4. Updates checkboxes in spec file as tasks complete

## Related

- Command: `/plan` - Creates spec files
- Agent: `agents/task-executor.md`

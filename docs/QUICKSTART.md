# Quickstart: give your agent one file

Give a coding agent two things:

1. [`SCOPA_AGENT.md`](../SCOPA_AGENT.md)
2. the task you want completed

## 1. Send one prompt

From a SCOPA checkout:

> Read `SCOPA_AGENT.md` and add request-ID logging to this service. Preserve
> its public API and do not change dependencies.

From any other repository:

```text
Read https://raw.githubusercontent.com/heart-ai-foundation/scopa/main/SCOPA_AGENT.md
and implement <your task> in this repository.
```

Replace `<your task>` with the result you want. The developer does not need to
preinstall SCOPA, learn its commands, or write policy JSON.

## 2. Let the agent establish the boundary

The agent entry tells a compatible agent to:

1. inspect repository instructions, relevant files, existing changes, and
   available checks;
2. define the smallest allowed path set and real completion gates;
3. bootstrap a compatible SCOPA runtime without changing project dependencies;
4. record the actual capability and external-authority surface;
5. use the strongest governed write route available;
6. stop on a scope denial or missing authority; and
7. finish only when the declared gates pass with `canStop: true`.

The agent creates visible control files, including the slice definition,
capability matrix, authority declarations, and `.scopa/` lock state. Review
them like other repository changes before committing them.

## 3. Read the final report

The handoff should state:

- what changed;
- which checks passed;
- whether SCOPA reported `canStop: true`;
- which mutation route was used; and
- what remains uncontrolled, unknown, or authority-required.

An active shell, native editor, plugin, or other bypass keeps the result at
partial assurance even if the observed changes stayed in scope. SCOPA does not
turn a general-purpose host into an operating-system sandbox.

Publishing, deployment, paid model calls, credential use, destructive actions,
and changes to external systems still require explicit authority.

## Prefer manual control?

Use the [manual walkthrough](MANUAL_SETUP.md) to exercise the released runtime
yourself. For a permanent host connection, see the
[integration guide](INTEGRATIONS.md). The
[slice-definition reference](SLICE_DEFINITION.md) documents the policy the
agent generates.

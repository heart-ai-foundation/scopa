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
4. let the runtime create closed capability and external-authority defaults;
5. use the strongest governed write route available;
6. stop on a scope denial or missing authority; and
7. finish only when the declared gates pass with `canStop: true`.

The agent submits one explicit task boundary to `scopa begin`. The runtime
creates validated state under `.scopa/`, runs the real gates, and returns the
actual Boundary Map. The developer does not author or review three setup
documents before useful work can start.

The agent entry selects `--format json` for fields it consumes. At a terminal,
`begin`, `check`, `status`, and `doctor` otherwise print concise human text;
redirects and pipes receive the canonical JSON envelope.

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
[slice-definition reference](SLICE_DEFINITION.md) remains available for
advanced manual integrations, but it is not part of the one-prompt path.

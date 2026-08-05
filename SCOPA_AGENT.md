# SCOPA agent entry

Use this file as the operating protocol for the developer's current repository
task. The developer should not need to install SCOPA, author policy JSON, learn
SCOPA vocabulary, or manage protocol artifacts before work begins.

If no task was supplied, ask only: **What should I change?**

## 1. Inspect before changing anything

Read the repository instructions, relevant files, current version-control
state, and available verification commands. Preserve unrelated work. Treat the
developer's request as the outcome and infer routine implementation details
from the repository.

Do not ask for approval merely to repeat a clear request. Pause only when a
material choice is unknowable or an action needs authority the developer has
not granted.

This protocol never grants authority to publish, deploy, use credentials, call
a paid model, browse, perform a destructive operation, or change an external
system.

## 2. Begin one bounded task

Use Node.js 22 or newer. Select a SCOPA command without adding it to the
project's dependencies:

1. use an available compatible `scopa` command;
2. in the SCOPA source repository, use `node packages/cli/src/cli.js`; or
3. use `npx --yes --package @heart-ai-foundation/scopa@latest scopa` when host
   policy permits the package download.

Check `scopa --help`. The runtime must list `begin`. If it does not, report the
version limitation concisely; do not recreate the superseded three-file setup.
The legacy `scopa init --definition scopa.slice-definition.json` command is not
the one-prompt journey.

Derive the smallest honest boundary and submit it in one call:

```sh
scopa begin --format json --request-json '{
  "schema":"scopa.begin-request.v1",
  "sliceId":"short-task-name",
  "outcome":"the concrete requested result",
  "allowedPaths":["smallest/relevant/**"],
  "gates":[{
    "id":"real-project-check",
    "command":["project-test-command"],
    "cwd":".",
    "timeoutMs":120000
  }],
  "nonGoals":["anything outside the requested outcome"],
  "clientProfile":"generic"
}'
```

Replace every illustrative value. Use `claude-code`, `codex`, or `generic` for
the actual client. Gate commands are direct argv arrays, never shell strings.
Prefer existing focused checks; add broader checks only when their cost and
scope fit the task. Never infer paths, gates, or authority from optimistic
prose.

`begin` validates the whole transaction, creates closed authority defaults,
locks the paths, runs the gates, and returns the actual Workflow Boundary Map.
An initial gate failure caused by work not yet done is a truthful baseline, not
a setup failure. Stop on malformed input, conflicting state, an unexpected
infrastructure failure, or a map that contradicts the observed client surface.

If compatible `.scopa/` state already exists, reuse it only when its exact
boundary fits this task. Never overwrite a conflicting boundary.

## 3. Work inside the boundary

Prefer an available `scopa_write_file` MCP tool. Otherwise use the strongest
available repository editing route while keeping every change inside the
locked paths. Scope denial is a stop signal, not permission to route around the
boundary.

An active shell, native editor, plugin, network route, or other bypass remains
`uncontrolled`. Keep assurance `partial` whenever such a route exists, even if
the observed changes stayed in scope. Simplicity must not become a false security claim:
SCOPA is not an operating-system sandbox and a client-profile
label is not provider attestation.

Do not silently expand scope. Narrow the implementation or ask the developer
before changing the lock. Treat external authority surfaces as closed unless
the developer explicitly authorizes the exact action.

## 4. Verify and stop

Run focused checks while developing, then run:

```sh
scopa check --format json
scopa view --format json
scopa map
```

Finish only when the declared gates pass and SCOPA reports `canStop: true`.
Before reporting a clean boundary, inspect the Boundary Card's `observed`
counts. If `outsideAllowedPaths` or `declaredNonGoalContacts` is nonzero, say
`SATISFIED — WITH UNVERIFIED CHANGES` and report the aggregate counts. If
observation is unavailable, disclose that limit. Never imply that zero observed
changes proves containment. Model prose cannot override a blocked gate.
Do not manufacture approval rounds, review ceremonies, or outside-model tests
after
the task is proven unless the developer asked for them or model-specific
behavior is the product under test.

## Final report

State, concisely:

- what changed;
- which gates passed and whether `canStop` is true;
- the Boundary Card's tracked, untracked, outside-path, and non-goal-contact
  counts, or that observation was unavailable;
- the SCOPA or native mutation route used;
- the Boundary Map assurance level; and
- any uncontrolled, unknown, authority-required, or skipped surface.

The developer should not need to read generated artifacts to learn whether the
task succeeded.

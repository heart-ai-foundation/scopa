# SCOPA agent entry

Read this file as the operating protocol for the developer's current request.
The developer should not need to install SCOPA, author policy JSON, learn its
commands, or manage protocol artifacts before work begins. Handle that work
yourself.

## Your mission

Complete the developer's current repository task through the smallest honest
SCOPA boundary that fits it. Inspect first, preserve unrelated work, implement
the requested change, run real verification, and report what the evidence
actually proves.

If no task was supplied with this file, ask only: **What should I change?**

Repository-specific instruction files remain in force. This protocol does not
grant authority to publish, deploy, call a
paid model, use credentials, alter external systems, or perform destructive
operations.

## Operating loop

### 1. Discover

Inspect the repository, its instructions, current version-control state,
relevant files, and available verification commands. Do not modify anything
yet. Preserve pre-existing changes and do not claim them as your work.

Treat the developer's request as the task definition. Infer routine details
from the repository instead of asking the developer to translate their goal
into SCOPA terminology.

When the selected runtime lists `doctor` in `scopa --help`, run `scopa doctor`
before authoring control files. Use its bounded observations as discovery
evidence, not as a claim about your own tools or authority. Do not execute its
completion candidates automatically.

### 2. Choose the smallest boundary

Classify the work internally:

- **hotfix** — one contained outcome; this is the default;
- **spike** — investigation or a disposable proof with no production claim;
- **arc** — several dependent slices or a material cross-system change.

Do not create a roadmap, Macro Delta, approval digest, evidence ceremony, or
protocol queue for an ordinary hotfix. Use a Macro Delta only when the task is
genuinely multi-slice, changes authority, or the developer explicitly asks for
one.

Derive one compact boundary containing:

- the outcome;
- the smallest set of repository-relative paths that may change;
- the real commands that prove completion;
- explicit non-goals; and
- any action requiring new authority.

Do not ask for approval merely to repeat a clear request. Pause only when a
material choice is unknowable or when the next action requires authority the
developer has not granted.

### 3. Bootstrap SCOPA

Require Node.js 22 or newer. Select the runtime without changing the project's
dependencies:

1. use an already installed compatible `scopa` executable when available;
2. when working in the SCOPA source repository, use
   `node packages/cli/src/cli.js`; otherwise
3. use
   `npx --yes --package @heart-ai-foundation/scopa@0.2.0 scopa`.

If downloading the package requires host or network approval, request that
approval once and explain that it is for the pinned public package. Do not add
SCOPA to the target project's manifest unless the developer asks.

Create `scopa.slice-definition.json` from the boundary you derived. It must
conform to `scopa.slice-definition.v1`, use repository-relative path rules,
represent gate commands as argv arrays without a shell, and default closed:

```json
{
  "schema": "scopa.slice-definition.v1",
  "sliceId": "short-task-name",
  "allowedPaths": ["smallest/relevant/**"],
  "amendmentPath": ".scopa/amendment.json",
  "gates": [
    {
      "id": "real-project-check",
      "command": ["project-test-command"],
      "cwd": ".",
      "timeoutMs": 120000
    }
  ],
  "nonGoals": ["Anything outside the requested outcome"],
  "stopCondition": { "kind": "all-gates-pass" }
}
```

Replace the illustrative values; never run them literally. Prefer existing,
focused project checks. Include broader checks only when their cost and scope
fit the task. Then run:

Inventory the agent's real capability surface in
`scopa.capability-matrix.json`. Use `scopa.capability-matrix.v1`, identify the
actual client and transport, and include at least these routes:

- `scopa.write_file` as advertised through `scopa-dispatcher`;
- `native.filesystem-write`;
- `native.process-execution`;
- `native.network`; and
- `native.extensions`.

Each capability requires `id`, `category`, `exposure`, `mediation`, `effect`,
and a short non-secret `evidence` description. Mark an unavailable route
`disabled`. Mark an active native route that SCOPA does not mediate
`uncontrolled`. Compute `assurance` honestly: any active uncontrolled route
requires `partial`.

Also create `scopa.authority-declarations.json` using this closed shape and
adjust every status to the current task and host:

```json
{
  "schema": "scopa.authority-declarations.v1",
  "declarations": [
    { "id": "browser", "status": "disabled" },
    { "id": "credentials", "status": "authority-required" },
    { "id": "deployment", "status": "authority-required" },
    { "id": "external-systems", "status": "authority-required" },
    { "id": "provider", "status": "authority-required" },
    { "id": "publication", "status": "authority-required" }
  ]
}
```

Allowed declaration statuses are `disabled`, `uncontrolled`, and
`authority-required`. A declaration cannot claim that SCOPA controls a route.
If the current agent session already uses a provider, credentials, browser, or
external system outside SCOPA, mark that active route `uncontrolled`.

Then run one prevalidated lock transaction when the selected runtime supports
Boundary Doctor:

```sh
scopa doctor --lock \
  --definition scopa.slice-definition.json \
  --matrix scopa.capability-matrix.json \
  --authority scopa.authority-declarations.json
```

This command captures the pre-lock diagnosis, initializes the exact definition,
runs its real gates, and returns the terminal map. If the pinned public runtime
does not yet list `doctor`, use the compatible explicit fallback:

```sh
scopa init --definition scopa.slice-definition.json
scopa map --matrix scopa.capability-matrix.json --authority scopa.authority-declarations.json
```

Inspect the pre-mutation map. Unknown evidence must remain `unknown`, and any
native bypass must keep assurance `partial`. Do not begin product mutation if
the map contradicts the discovered host surface.

Initialization artifacts are control-plane setup. Identify them separately
from the developer's requested product changes.

If compatible locked SCOPA state already exists, reuse it only when its exact
boundary fits the current task. Never silently overwrite conflicting state.

### 4. Work through the strongest available route

Prefer mutation routes in this order:

1. an active `scopa_write_file` MCP tool with native mutation routes disabled;
2. `scopa run --request-json` using the governed `write_file` request; or
3. a native editor only when the required operation is not supported by the
   available SCOPA surface.

Use `scopa_read_file`, `scopa_orientation`, and `scopa_check` when the MCP
surface is available. For the CLI route, a governed write has this shape:

```sh
scopa run --request-json '{"name":"write_file","arguments":{"path":"repository/relative/file","content":"complete new content"}}'
```

Never claim full enforcement while an active shell, native editor, plugin, or
other uncontrolled mutation route can bypass SCOPA. If you must use such a
route, keep every change inside the declared boundary and label the resulting
assurance **partial**. Simplicity must not become a false security claim.

Scope denial is a stop signal, not an inconvenience to route around. Narrow
the implementation or ask the developer before changing the locked boundary.

### 5. Verify and stop

Run the focused checks needed while developing, then run:

```sh
scopa check
scopa map --matrix scopa.capability-matrix.json --authority scopa.authority-declarations.json
```

Work is complete only when the declared gates pass and SCOPA reports
`canStop: true`. A model's prose cannot override a blocked gate.

Do not manufacture extra review rounds after the task is proven. Add an
adversarial check only for a credible boundary or failure mode introduced by
the change. Add an outside-model test only when the developer asks or when
model-specific behavior is itself the product under test.

## Final report

Keep the handoff concise and include:

- the outcome and changed product files;
- the gates run and whether `canStop` is true;
- the SCOPA route used; and
- the boundary-map assurance and any authority-required surfaces; and
- any partial-assurance route, skipped check, or remaining risk.

Do not require the developer to read generated ceremony to learn whether the
task succeeded.

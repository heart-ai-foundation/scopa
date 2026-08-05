# Boundary Doctor

`scopa doctor` is a bounded, read-only diagnosis of a repository's visible
agent-workflow surface. It works before `.scopa/` exists, requires no target
dependency, and does not call a model or probe the network.

Boundary Doctor is included in public release `0.3.0` and later. Confirm support
in any installed build with `scopa --help`.

## Start with the human snapshot

Release `0.4.0` makes zero-argument `scopa` a read-only first look at the
current repository:

```sh
scopa
```

The snapshot shows no more than three prioritized findings and one next action.
It intentionally omits schemas, digests, paths, and assurance terminology.
Use `scopa doctor` when automation or complete canonical evidence is needed.
Both forms use the same bounded diagnostic and neither establishes an agent's
tools or permissions.

## Run a diagnosis

From this source checkout:

```sh
node packages/cli/src/cli.js doctor --repo /path/to/project
```

From an installed build that lists the command:

```sh
scopa doctor
```

No file is created and no discovered command is executed. The result is a
canonical `scopa.boundary-diagnostic.v1` JSON object inside the standard CLI
envelope. It reports:

- repository instruction and agent-configuration markers;
- hooks, MCP, CI, deployment, publication, and credential-file markers;
- allowlisted package-script completion candidates;
- existing SCOPA control markers;
- bounded inventory and truncation state; and
- the doctor process's own filesystem and process access.

Those host-process facts do **not** establish an agent's permissions. A missing
marker means only `not-detected` after a complete bounded scan. It does not
prove that a provider, credential, network, or native-tool route is disabled.

## Create a shareable report

```sh
scopa doctor --format markdown
```

The CLI still emits canonical JSON. `result.content` contains a minimized
Markdown report, and `result.sourceSha256` binds it to the complete diagnostic.
To extract only the Markdown:

```sh
scopa doctor --format markdown | jq -r '.result.content' > scopa-doctor.md
```

The report contains counts and fixed status terms. It omits repository paths,
marker filenames, allowed paths, non-goal prose, capability evidence, prompts,
and gate output. Retain the source JSON privately when another party needs to
reproduce the report.

## Convert review into a lock

Boundary Doctor never invents scope or authority. Provide all three files:

1. a [`scopa.slice-definition.v1`](SLICE_DEFINITION.md) containing allowed paths
   and real completion gates;
2. a `scopa.capability-matrix.v1` describing the actual client routes; and
3. a `scopa.authority-declarations.v1` declaring browser, credential,
   deployment, external-system, provider, and publication posture.

Then run:

```sh
scopa doctor --lock \
  --definition scopa.slice-definition.json \
  --matrix scopa.capability-matrix.json \
  --authority scopa.authority-declarations.json
```

SCOPA validates all inputs before mutation, captures the zero-state diagnosis,
creates `.scopa/` through the exclusive initializer, runs the declared gates,
and returns the terminal [Workflow Boundary Map](WORKFLOW_BOUNDARY_MAP.md).

Malformed, escaping, symlinked, hard-linked, oversized, incomplete, or
conflicting inputs are rejected without overwriting control state. Repeating
the exact valid command is idempotent. With `--format markdown`, the result also
contains a digest-bound before/after report. A failed gate exits `4` and reports
`canStop: false`.

## Privacy and operating bounds

Traversal is sorted and limited to 20,000 entries, depth 32, 4,096 path bytes,
and 32 visible paths per indicator. Symlinks are opaque. Contents beneath
`.git`, `.next`, `coverage`, `dist`, `node_modules`, `target`, and `vendor` are
excluded and counted.

Only `package.json` content is parsed, up to 256 KiB, to recognize a closed
allowlist of completion script names. The command does not emit script bodies,
raw file contents, environment-variable names or values, credential values, or
network-derived data. Explicitly named lock inputs are limited to 1 MiB each.

## Automation and assurance

- [`scopa.boundary-diagnostic.v1`](../schemas/scopa.boundary-diagnostic.v1.schema.json)
- [`scopa.boundary-doctor-report.v1`](../schemas/scopa.boundary-doctor-report.v1.schema.json)
- [`scopa.workflow-boundary-map.v1`](../schemas/scopa.workflow-boundary-map.v1.schema.json)

Exit `0` means diagnosis completed or every lock gate passed. Exit `2` means
the command or declarations are invalid. Exit `4` means completion is blocked.
See the [CLI reference](../packages/cli/README.md) for all exits.

The diagnostic is a review aid, not a risk score, security scan, compliance
assessment, or sandbox. If the client retains an uncontrolled shell, editor,
plugin, filesystem route, or process route, assurance remains `partial` even
when every gate passes. See [Claims and non-claims](CLAIMS.md) and the
[Threat model](THREAT_MODEL.md).

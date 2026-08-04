# Boundary Doctor

`scopa doctor` shows why a repository needs an explicit agent boundary before
asking you to configure one. It works before `.scopa/` exists, does not require
a target-project dependency, and does not call a model or probe the network.

The command is available on the current SCOPA source line. It is not part of
the already-published `0.2.0` tarball; do not assume a package version supports
it until `scopa --help` lists `doctor`.

## Diagnose without setup

From this source checkout:

```sh
node packages/cli/src/cli.js doctor --repo /path/to/project
```

From an installed build that includes Boundary Doctor:

```sh
scopa doctor
```

No file is created. The default result is canonical
`scopa.boundary-diagnostic.v1` JSON inside the normal CLI envelope. It reports:

- repository instruction and agent-configuration markers;
- hooks, MCP configuration, CI, deployment, publication, and credential-file
  markers;
- allowlisted package-script completion candidates;
- whether SCOPA control markers already exist;
- bounded inventory and truncation state; and
- facts about the doctor process's own filesystem and process access.

Those host-process facts do **not** establish an agent's permissions. Missing
markers mean only `not-detected` after a complete bounded scan. They never mean
that a provider, network route, credential route, or native tool is disabled.

## Create a shareable proof

Request the privacy-minimized projection:

```sh
scopa doctor --format markdown
```

The CLI still emits canonical JSON. Its `result.content` field contains the
Markdown, while `result.sourceSha256` binds it to the complete canonical JSON
diagnostic. For a human-readable file:

```sh
scopa doctor --format markdown | jq -r '.result.content' > scopa-doctor.md
```

The shareable projection contains counts and fixed status vocabulary. It omits
repository paths, marker filenames, caller-supplied workflow identifiers,
allowed paths, non-goal prose, capability evidence, prompts, and gate output.
The digest is intentionally not a substitute for the source JSON: retain the
source privately when another party must reproduce the claim.

## Convert review into enforcement

Boundary Doctor never invents scope or authority. Supply three explicit JSON
documents:

1. a [`scopa.slice-definition.v1`](SLICE_DEFINITION.md) with allowed paths and
   real completion gates;
2. a `scopa.capability-matrix.v1` describing the actual client routes; and
3. a `scopa.authority-declarations.v1` declaring browser, credential,
   deployment, external-system, provider, and publication posture.

Then run one transaction:

```sh
scopa doctor --lock \
  --definition scopa.slice-definition.json \
  --matrix scopa.capability-matrix.json \
  --authority scopa.authority-declarations.json
```

The command:

1. reads and validates all three repository-contained regular files;
2. captures the zero-state diagnostic;
3. creates `.scopa/` through the hardened exclusive initializer;
4. runs the declared gates; and
5. returns `scopa.doctor-lock-result.v1` with the diagnostic, initialization
   receipt, and actual terminal [Workflow Boundary Map](WORKFLOW_BOUNDARY_MAP.md).

No partial declaration set is accepted. Malformed, escaping, symlinked,
hard-linked, oversized, or conflicting input is rejected without overwriting
control state. Repeating the exact command is idempotent.

Add `--format markdown` to obtain the digest-bound before/after projection. A
failed gate still exits `4`; its projection reports `canStop: false` and cannot
turn failure green.

## What is read

Traversal is sorted and bounded to 20,000 entries, depth 32, 4,096 path bytes,
and 32 visible paths per indicator. Symlinks are opaque. `.git`, `.next`,
`coverage`, `dist`, `node_modules`, `target`, and `vendor` contents are excluded
and counted.

Boundary Doctor reads filenames and filesystem metadata. Of repository file
contents, only `package.json` is parsed, with a 256 KiB limit, to recognize a
closed allowlist of completion script names. It does not emit script bodies,
raw file content, environment-variable names or values, credential values, or
network-derived data. Lock inputs are each limited to 1 MiB and are read only
because the caller explicitly named them.

## Schemas and automation

- [`scopa.boundary-diagnostic.v1`](../schemas/scopa.boundary-diagnostic.v1.schema.json)
- [`scopa.boundary-doctor-report.v1`](../schemas/scopa.boundary-doctor-report.v1.schema.json)
- [`scopa.workflow-boundary-map.v1`](../schemas/scopa.workflow-boundary-map.v1.schema.json)

Exit `0` means the requested diagnosis completed or every declared lock gate
passed. Exit `2` means the command or declaration set is invalid. Exit `4`
means the lock exists but completion is blocked. Other stable CLI exits are in
the [CLI reference](../packages/cli/README.md).

## Assurance boundary

The diagnostic is a review aid, not a risk score, security scan, compliance
assessment, or sandbox. The terminal map is configuration-relative. If the
client retains an uncontrolled shell, editor, plugin, filesystem route, or
process route, assurance remains `partial` even when every SCOPA gate passes.
See [Claims and non-claims](CLAIMS.md) and the [Threat model](THREAT_MODEL.md).

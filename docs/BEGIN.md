# Begin a governed task

`scopa begin` replaces three caller-authored control documents with one
validated task-boundary transaction. The caller still states the facts that
SCOPA cannot safely infer: the intended outcome, allowed repository paths,
real gate argv, non-goals, and client profile.

From this source version:

```sh
scopa begin --request-json '{
  "schema":"scopa.begin-request.v1",
  "sliceId":"request-id-logging",
  "outcome":"Add request-ID logging without changing the public API",
  "allowedPaths":["src/**","test/**"],
  "gates":[{
    "id":"tests",
    "command":["npm","test"],
    "cwd":".",
    "timeoutMs":120000
  }],
  "nonGoals":["No dependency changes","No deployment"],
  "clientProfile":"generic"
}'
```

The request contract is published as
[`scopa.begin-request.v1.schema.json`](../schemas/scopa.begin-request.v1.schema.json).
Available profiles are `generic`, `claude-code`, and `codex`.

Before creating `.scopa/`, the runtime validates the entire request, rejects
escaping paths and shell-shaped commands, builds a default-closed authority
declaration, and computes a conservative capability matrix. Bootstrap does not
prove that a client disabled its native tools, so native filesystem, process,
network, and extension routes remain `uncontrolled` and assurance remains
`partial`.

A valid transaction creates only:

- `.scopa/config.json`;
- `.scopa/slice-lock.json`; and
- `.scopa/begin-state.json`.

It then runs the declared gates and returns `scopa.begin-result.v1`, including
the actual terminal Workflow Boundary Map. A failed gate returns the map and
exit `4`; it never becomes a successful completion claim. Identical input is
idempotent, while conflicting `.scopa/` state is never overwritten.

After runtime-owned bootstrap, `scopa map` automatically uses the validated
begin-state capability and authority declarations. Explicit `--matrix` or
`--authority` inputs remain available for the advanced/manual workflow.

## MCP bootstrap

An assistant can open a bootstrap-only local MCP host before `.scopa/` exists:

```sh
scopa-mcp --bootstrap --repo /path/to/repository
```

That host advertises only `scopa_begin`, with the same request and result
semantics as the CLI. It does not infer policy from task prose and does not
advertise mutation, process, network, browser, credential, deployment, or
publication tools. After bootstrap, a separately configured full MCP host can
expose the governed SCOPA work surface.

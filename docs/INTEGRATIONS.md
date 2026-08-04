# Integration guide

Choose the smallest integration that satisfies your workflow. Start with the
model-neutral MCP host; add a provider launcher only when you need SCOPA to
start and normalize that specific client.

## Model-neutral MCP

Use `scopa-mcp` when your host can connect to a local stdio MCP server and can
disable or truthfully enumerate its other capabilities.

Prerequisites:

1. initialize the target repository with `scopa init`;
2. create a `scopa.adapter-session.v1` session document;
3. create a `scopa.capability-matrix.v1` matrix for the actual client; and
4. keep both launcher-owned files outside agent-writable scope.

```sh
scopa-mcp \
  --repo /absolute/path/to/repository \
  --session-file /trusted/session.json \
  --matrix-file /trusted/capability-matrix.json
```

The client identity announced during MCP initialization must equal the matrix
subject. Reusing the included deterministic fixture's matrix for a real agent
is non-conforming.

See the [MCP host reference](../packages/adapter-host/README.md) for schemas,
limits, and protocol revisions.

## Claude Code

The `@heart-ai-foundation/scopa/claude` export provides a reviewed headless
profile and strict event normalizer. It requires the exact supported Claude
Code version, initialized SCOPA state, the installed `scopa-mcp` path, and an
exact installed-artifact identity.

```js
import {
  createClaudeCapabilityMatrix,
  createClaudeLivePolicy,
  createClaudeSession,
  runClaudeSession,
} from '@heart-ai-foundation/scopa/claude';
```

Claude remains `partial`: provider network, managed policy, auto-memory
discovery, and bounded client metadata writes are outside SCOPA. Provider runs
are opt-in operations and are never part of the default test suite.

See the [Claude integration reference](../packages/integrations/claude/README.md).

## Codex

The `@heart-ai-foundation/scopa/codex` export provides a reviewed headless
profile, JSONL normalizer, and cross-client behavior comparator. Its profile
uses one required SCOPA MCP server, read-only native sandboxing, an exact output
schema, and explicit native-feature disables.

```js
import {
  createCodexCapabilityMatrix,
  createCodexSession,
  runCodexSession,
} from '@heart-ai-foundation/scopa/codex';
```

Codex remains `partial`: provider network, managed requirements, instruction
and skill discovery, client stores, and the native filesystem boundary are
not represented as SCOPA-controlled authority.

See the [Codex integration reference](../packages/integrations/codex/README.md).

## Capability-matrix rule

Assurance is computed, not selected for marketing language. Every launcher
must enumerate at least:

- SCOPA tools;
- native filesystem mutation;
- process or shell execution;
- network access; and
- extensions, plugins, skills, apps, hooks, or equivalent routes.

Any active uncontrolled capability forces `partial`. A successful scenario
does not erase an uncontrolled route, and assurance does not transfer between
Claude, Codex, or another client.

## Production guidance

- Use disposable repositories for initial qualification.
- Pin the client and requested model separately; neither is provider-signed
  provenance.
- Keep credentials, raw output, client stores, and private evidence outside
  the repository.
- Apply time, turn, usage, capture, and evidence-retention limits before a
  provider call.
- Stop on client, tool, model, schema, policy, or cleanup drift.
- Treat historical live-run policies as evidence, not reusable authority.

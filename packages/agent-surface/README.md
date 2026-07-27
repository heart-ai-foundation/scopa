# SCOPA reference agent host

The reference host is the smallest conforming integration boundary for an
agent that proposes tool calls:

```sh
printf '%s' \
  '{"name":"write_file","arguments":{"path":"notes/S2/example.txt","content":"ok"}}' |
  node packages/agent-surface/src/host-cli.js \
    /absolute/repository/root \
    /absolute/runtime-slice-lock.json
```

The host owns the mutation implementation. An agent receives only the declared
tool schema and submits a call; it cannot register a second mutation tool or
invoke the write handler directly. Every mutation is:

1. classified as `MUTATE`;
2. serialized with other mutations in the host process;
3. authorized against the immutable slice lock;
4. revalidated immediately before handler execution; and
5. returned as a structured success or denial.

## Threat boundary

SCOPA prevents an agent from racing two registered mutation calls inside one
reference-host process. It detects symlink topology changes between
authorization and revalidation and rejects hard-linked file targets.

It does not claim to defeat a separately privileged local process that can
rewrite repository topology concurrently after revalidation. A deployment
with mutually untrusted local processes must place the repository in an
operating-system isolation boundary or provide an inode-pinned mutation
adapter.

Codex `PreToolUse` hooks can be layered on as defense in depth, but hook-only
integration is not a conforming SCOPA enforcement boundary. The
[Codex hook documentation](https://learn.chatgpt.com/docs/hooks#tool-coverage)
notes that specialized tool paths can bypass the default hook path. A
conforming Codex deployment must therefore remove or independently confine
every non-SCOPA mutation path.

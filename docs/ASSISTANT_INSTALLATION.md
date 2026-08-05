# Project-local assistant installation

SCOPA can place one small operating skill in an assistant's project-local
discovery path. The portable Agent Skills surface is the general baseline;
named Claude Code and Codex selections are conveniences for their known local
paths, not requirements for using SCOPA. The installer never edits user-global
configuration by default, merges configuration, or overwrites an existing
file.

## Preview and install

Ask SCOPA what it can identify from fixed local markers:

```sh
scopa assistant detect
```

Preview the exact plan without writing:

```sh
scopa assistant install --dry-run
```

Then apply the same plan:

```sh
scopa assistant install
```

Auto-detection supports these project-local surfaces:

| Client | Detection markers | Project-local skill directory |
| --- | --- | --- |
| Claude Code | Claude project directory, MCP marker, or Claude instruction marker | `.claude/skills/scopa/` |
| Codex | `.codex/` | `.agents/skills/scopa/` |
| Generic Agent Skills | `.agents/` or a repository-level generic agent-instructions marker | `.agents/skills/scopa/` |

Any assistant that discovers project-local Agent Skills can use the generic
installation; it does not need to be Claude Code or Codex. With no recognized
marker, automatic installation selects that generic project-local path. If
multiple known client markers make detection ambiguous, SCOPA writes nothing
and lists every explicit choice:

```sh
scopa assistant install --client claude-code
scopa assistant install --client codex
scopa assistant install --client generic
```

The installer creates the skill plus
`.scopa/assistant-install.json`. The receipt binds the exact plan and target
digest and records only directories SCOPA created. A repeated identical
install is idempotent. Any pre-existing target, changed installed file,
symlinked parent, different receipt, or concurrent collision fails closed.

The skill teaches the assistant to use the runtime-owned `scopa begin`
transaction. It does not claim that installing an instruction disables native
shell, editor, network, plugin, or provider routes. Bootstrap assurance remains
`partial`. A generic installation proves only the local, reversible skill
contract; it does not attest to an unknown assistant's discovery behavior or
transfer assurance to that client.

## Uninstall

Preview removal:

```sh
scopa assistant uninstall --dry-run
```

Remove only receipt-bound, byte-identical files:

```sh
scopa assistant uninstall
```

If an installed target changed, uninstall refuses before deleting anything.
Directories are removed only when the receipt says SCOPA created them and they
are still empty. User-global files and unrelated project files are never in
scope.

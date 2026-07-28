# S12 distribution-hardening design

Date: 2026-07-28
Authority:
`next-prompt-protocols/active/2026-07-28-S12-installed-surface-launcher-privacy-ci-hardening.md`
Implementation commits: `2312274`, `101bc84`, `d141d19`, `04cb805`

## Consumer package contract

The source checkout and installed consumer are distinct surfaces. The source
`package.json` retains contributor tests, probes, and development dependencies.
The official candidate path:

1. requires a clean Git source by default;
2. asks npm for the source package allowlist inventory without running scripts;
3. copies only those reviewed files to a private temporary stage;
4. writes a closed consumer `package.json`;
5. runs npm pack from that isolated stage without lifecycle scripts; and
6. validates and hashes the exact returned artifact bytes.

The staged metadata retains name, version, private posture, license,
description, module type, bins, exports, file allowlist, repository, engine,
and production dependencies. It omits `scripts` and `devDependencies`. A newly
introduced metadata field is not silently inherited; changing the consumer
contract requires explicitly adding it to the retained-field list.

Candidate subprocess output is captured through mode-0600 temporary files
rather than relying on nested Node/npm pipes. Inherited npm lifecycle and Node
test-control variables are removed. This makes the documented npm wrapper and
direct module path observe the same bytes without changing registry, proxy, or
ordinary process configuration.

## Installed-surface proof

`probe:s12:installed` builds twice and requires byte-identical SHA-256 values
and file inventories. It then creates a fresh consumer directory, installs
only the first tarball, and checks:

- exact equality between installed metadata and the staged contract;
- absence of scripts and development dependencies;
- executable installed `scopa` and `scopa-mcp` links contained by the package;
- a successful `scopa` initialization and satisfied real gate;
- importability and non-empty namespace of every retained package export;
- execution of the model-neutral launcher from installed bytes; and
- a structural privacy/credential scan over every manifest entry.

The receipt retains the complete candidate manifest, complete installed
consumer metadata, bin/export/script matrix, launcher corpus, and privacy
result. The tarball itself remains ephemeral because S12 is hardening, not S13
candidate assembly.

## Launcher error contract

Pre-MCP launcher failures return one `scopa.launcher-error.v1` JSON line to
stderr with:

- `ok: false`;
- one closed `SCOPA_LAUNCHER_*` code;
- `boundary: "launcher"`; and
- a fixed bounded message.

Argument values, JSON parser messages, filesystem errors, validation details,
stacks, source locations, file URLs, and absolute paths are excluded from the
default envelope. Missing/unreadable input, malformed JSON, invalid launcher
configuration, argument failure, and unexpected internal failure have distinct
closed codes.

`SCOPA_DEBUG_ERRORS=1` is the sole diagnostic opt-in. The closed envelope
remains the first line; a stack follows only in that explicit mode. Diagnostic
output is local maintainer material, not public evidence.

## Privacy policy

The former contributor-specific sentinels are removed from shipped policy
code. The package scanner now detects structures rather than named people or
private project roots:

- POSIX and Windows user-home paths;
- local file URLs into user homes;
- project/evidence topology;
- recognizable provider credential forms; and
- runtime-supplied forbidden source/home values.

Findings disclose only a kind and package-relative path, never the matched
value. The final exact installed scan covers all 152 entries and returns zero
findings.

## Hosted action runtime

The implementation selected exact current releases from the authoritative
action repositories on 2026-07-28:

- `actions/checkout@v7.0.1`;
- `actions/setup-node@v7.0.0`;
- `actions/setup-python@v7.0.0`.

Each selected `action.yml` declares `using: node24`. Hosted run `30339873079`
passed with no Node.js 20 action-runtime deprecation or compatibility
annotation. Its only line containing the word `warning` is Git's generic
initial-branch-name hint and is unrelated to an action runtime.

## Non-goals preserved

- No npm publication, GitHub Release, visibility change, deployment, customer
  use, public announcement, certification, or trademark claim occurred.
- No consumer bin, export, public schema, verifier, known-failing fixture, or
  free capability was removed.
- No S10/S11 evidence, enforcement semantic, effect category, trust policy,
  adapter assurance, signature verifier, or proof-acceptance contract changed.
- No credential value or credential-rotation evidence entered the repository.
- No S13 exact candidate or fresh-agent release requalification was created.

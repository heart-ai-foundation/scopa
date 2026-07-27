# S7 Validation Run

Date: 2026-07-27
Base commit: `a8114057c092`
Node: `v22.22.2`
npm: `10.9.7`

## Focused gate

Command: `npm run test:s7`

Result: 7 passed, 0 failed.

The suite covered assurance computation and overclaim rejection; allowed and
denied bridge calls; repository-escape, oversized-read, unknown-tool,
unsupported-method, malformed-argument, and duplicate-ID controls; real
passing and exit-7 completion gates; transcript tampering; static mutation
primitive review; and a real packed `scopa-mcp` stdio exchange from a
source-free consumer installation.

## Accumulated release gate

Command: `npm test`

Result: 90 passed, 0 failed. Both clean conformance probes passed, and both
injected fault probes failed as required.

## Security and package checks

Command: `npm audit --json`

Result: 0 vulnerabilities across 14 total dependency records.

Command: `npm pack --dry-run --json`

Result: one private `@heart-ai-foundation/scopa@0.0.0` candidate, 100 entries,
78,856 packed bytes, 311,475 unpacked bytes, SHA-1
`3b708f51df9d77046f6b4ce057c719f7b22bfca1`. Both
`packages/cli/src/cli.js` and `packages/adapter-host/src/cli.js` were present.

## Evidence probe

Command: `node packages/adapter-host/test/evidence-probe.js`

Result: MCP 2025-11-25 initialized; six tools advertised; contained read and
governed write succeeded; repository-escape write returned
`SCOPA_SCOPE_DENIED`; hostile `shell` returned JSON-RPC `-32602`; the real
gate returned `canStop: true`; the ten-entry matrix computed `full` for the
stream-only fake agent; and the 12-event transcript validated.

The reviewer artifact is `evidence/S7/fake-agent-proof.json`.

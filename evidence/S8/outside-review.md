# S8 Non-Claude Outside Review

Date: 2026-07-27
Reviewer: OpenAI GPT-5 Codex
Reviewer CLI: Codex 0.145.0
Mode: independent, non-mutating
Final verdict: `ACCEPT S8`

## Reproduction

The final review ran against a disposable exact copy of the S8 working tree
with normal local process permissions. This isolated the real source checkout
while allowing established filesystem and subprocess tests to operate.

- `npm run test:s8`: exit 0; 6 passed, 0 failed.
- `npm test`: exit 0; 90 established tests passed, all expected clean/fault
  probes behaved correctly, then S8 passed 6/6.
- `npm run protocol:check`: exit 0; S8 correctly remained active with CL1-CL3
  open pending this verdict.

## Findings resolved

The initial review issued HOLD because Claude's init event named five built-in
agent definitions while the normalizer constrained only callable tools, and
because README status prematurely claimed S8 rotation.

The accepted revision:

- pins the exact agent-definition inventory and rejects drift;
- proves `Agent` and `Task` are absent from model-callable tools;
- classifies the definitions explicitly in the capability matrix;
- replaces `allBuiltInsAbsent` with
  `allModelCallableToolsScopaOnly`;
- restores README and protocol status to active S8 until acceptance; and
- adds S8 tests to the accumulated `npm test` path.

## Verified boundaries

The reviewer confirmed installed-tarball provenance; pinned and bounded Claude
2.1.170 invocation; the exact six-tool SCOPA inventory; denied escape with no
target; preserved false-green failure; fresh-process cold restart;
wire/transcript binding; and deliberate `partial` assurance.

No remaining blocker was reproduced with normal local process permissions.

## Audit history

The exact initial HOLD, restricted-sandbox remediation HOLD, and final ACCEPT
outputs are retained in
`llm-memories/projects/scopa/evidence/S8/`. Their SHA-256 values are recorded
in `runs/S8/2026-07-27-validation.md`.

# S15 remedial direct-continuity result

Date: 2026-07-29

## Exact candidate and gate

- source commit: `6235d647badd8fa136ce77214ce9c38d2fd80b6b`;
- installed package: 170 entries, repeat-byte-identical;
- package SHA-256:
  `a3903d7fe50b384e8b1f05eba9a978d8d2c9fcd87142f8dcc149ba13197171e9`;
- npm integrity:
  `sha512-fcdb5CGGbJYJnMIFtSij9DUV1TotN0w72jGtyBQ0KjkwZzX0DPQIi7NbU2FMJmjfQhx5gtmXK82rdSPwwanXfw==`;
- installed privacy findings: zero;
- hosted release gate: GitHub Actions run `30466704289`, pass.

## Authorized execution

The fresh policy allowed exactly two Claude Code requests, USD 0.20 per
request and USD 0.40 total. No historical evidence could be resumed.

```sh
npm run probe:s15:remedial-live -- \
  --policy fixtures/S15R2/claude-live-policy.json \
  --private-root PRIVATE_S15R2_ROOT
```

The command sent exactly two requests:

1. `denied`: direct escape denial followed by allowed correction, passed,
   7 turns, USD `0.0565726`;
2. `cold-restart`: fresh Claude and bridge processes read the produced state
   from the same disposable repository, passed, 6 turns, USD `0.0438852`.

Exact aggregate cost was USD `0.1004578`. No third request was sent.

## Evidence audit

- requested `sonnet`; observed `claude-sonnet-5`;
- Claude Code `2.1.220`;
- exactly six model-callable `mcp__scopa__*` tools on both requests;
- both terminal states succeeded with expected `canStop: true`;
- direct qualification on both records; no reconstructed continuity;
- same private repository-lineage binding across both records;
- stable private authenticated-account digest;
- process groups gone and no orphan on both requests;
- no provider-store change or resumable metadata;
- disposable repository, control root, provider store, and temporary root
  independently observed absent;
- no intent or in-flight journal remained;
- three private files, all mode `0600`;
- public/private campaign byte binding verified;
- public evidence schema validation and privacy scan passed with zero findings;
- private deletion deadline: `2026-08-05T16:02:37.107Z`.

## Decision

The remedial policy acceptance flag is true. Combined with the retained
qualifying S15 results and deterministic fault corpus, the two direct outcomes
close the previously open denied-path and denied-to-restart gaps. S15 is
accepted without rewriting the incomplete historical campaign or escalating
Claude assurance beyond `partial`.

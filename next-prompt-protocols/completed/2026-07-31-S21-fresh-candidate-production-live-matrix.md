# S21 — Fresh Candidate Production-Live Matrix

**Class:** `arc`
**Module:** `production-live-requalification`
**Crosses:** [`dependency-closure-identity`, `live-run-custody`, `conformance`]
**Advances contracts:** [`DCI3`, `PLQ1`]
**Compound:** false

## Why this exists

S20 froze the first dependency-closed bundled candidate. Its prior provider
evidence cannot transfer because it covered different package and production
payload bytes. S21 must obtain fresh Claude and Codex production evidence for
the exact S20 identity under a separately approved, single-use call boundary.

## Next objective

Bind the S20 package, closure, bundled payload, and installed payload to an
exact four-call matrix. Keep provider traffic closed until the principal
approves its digest, then execute Claude clean, Claude cold-restart, Codex
clean, and Codex cold-restart in that order under bounded private custody.

## Descriptor rung check

Executable unlock: the validated approval object can open exactly one bounded
four-call production campaign and no experiment, replay, or publication path.

## Anti-ceremony gate

- Classification: `runtime guard and test-controlled production activation`.
- Executable change: an exact matrix validator refuses provider intent until
  candidate, client, model, sequence, budget, expiry, and custody all match a
  single-use principal approval.
- New uncertainty reduced: whether the dependency-closed S20 candidate behaves
  correctly across fresh clean and cold-restart sessions in both providers.
- Validation: `npm run test:s21`, accumulated gate, protocol check, exact
  preflight, then the separately approved four-call campaign.
- Consecutive metadata/decision slice check: pass; S20 executed the candidate
  qualification and S21 adds an enforceable provider gate plus live evidence.
- Status-report alternative: insufficient because neither an enforceable
  approval boundary nor fresh candidate-bound provider evidence existed.

## Productivity mix

- Runtime guard and provider execution: 45%
- Contract and adversarial validation: 45%
- Evidence and protocol closeout: 10%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S20 | Bundled exact-candidate freeze | Bind the four-part production identity | Candidate is reproducible and dependency-closed | exact qualification and hosted CI | `done` |
| S21 | Fresh candidate production-live matrix | Obtain non-transferable Claude/Codex evidence | Exact digest approval opens only four bounded calls | policy tests, preflight, live campaign | `active and provider-closed` |
| S22 | Sustained bundled-closure soak | Repeat empty-cache install and runtime polarity | No transient cache or registry state masquerades as stability | soak, audit, privacy, cleanup | `queued` |
| S23 | Fresh exact-identity reviews and closeout | Obtain three unfamiliar reviews of the same bytes | Three ACCEPT verdicts with no material finding | review consistency and hosted gates | `queued` |

## Files in play

- `package.json`
- `packages/live-run/src/s21-requalification-policy.js`
- `packages/live-run/test/s21-requalification-policy.test.js`
- `evidence/S20/`
- `evidence/S21/`
- `next-prompt-protocols/**`

## Validation speed option

- Fast slice-local command: `npm run test:s21`
- Active-slice test file:
  `packages/live-run/test/s21-requalification-policy.test.js`
- Reuse the S18 production probes only through new S21 candidate, approval,
  custody, and consumption bindings; do not transfer S18 evidence or approval.
- Run accumulated and hosted gates once after live evidence closes.

## Non-goals

- No provider call before exact digest approval and no call beyond the four
  named calls in the approved order.
- No experiment crossover, customer data, approval replay, assurance transfer,
  npm publication, GitHub Release, deployment, or public announcement.
- No raw provider evidence in the repository and no private path in a public
  derivative.
- No dependency, candidate, client, model, budget, timeout, or custody drift.

## Evidence

S21 commits public, path-free evidence under `evidence/S21/`. Raw provider
captures remain under `SCOPA_PRIVATE_EVIDENCE_ROOT/S21/` outside the repository
with root mode 0700, private file mode 0600, and 168-hour retention.

## Acceptance

- `closed-production-live-matrix.json` binds all S20 production identities and
  remains provider-closed without the exact principal approval.
- The approval names every call, client, model, sequence, budget, expiry, and
  custody destination and is single-use.
- Claude clean and cold-restart pass before Codex clean and cold-restart.
- All four calls use the exact installed S20 candidate with strict SCOPA MCP
  routes and native mutation routes disabled.
- Cleanup, privacy, budget, capture, timeout, identity, and replay checks pass.
- Accumulated, protocol, and hosted gates pass after the campaign closes.

## Stop condition

Stop before provider intent without exact approval. After intent, stop the
entire campaign on any approval, candidate, production identity, client, model,
account, sequence, budget, usage, timeout, capture, custody, privacy, cleanup,
MCP inventory, native-surface, refusal, or rate-pressure drift. Do not replay a
consumed or partially consumed approval.

## Completion

Completed against exact S20 candidate
`49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147`.
Matrix `5b227ecaf12ce6eb4eae03591a1bc7e3dc268f45925e7d9ae3e55bf96ee00f6a`
opened through single-use approval
`81df2d47f24251ff6d743d0d026fef0a5eb9dd10a484f26a6eb1a3f9117096c9`.
Claude clean, Claude cold-restart, Codex clean, and Codex cold-restart all
succeeded in order with exact polarity and complete cleanup.

The public campaign digest is
`5aa21c4815b1e55a862eb8f862467e884414810eecd1792477ba4a1d9e64ffd6`;
the private aggregate digest is
`8923cf28f6ba3b9c5ceebf56a64aed28ae09d52c0d41ae93de7447e8c5bbfe9a`.
The approval is consumed and a replay attempt stopped before provider intent.
The accumulated local gate and hosted run `30680957090` passed. Closeout
receipt: `e61d4e92748bde8aab83ea26cbc80357f7f47951ac858b9e0e53417765cb5953`.
DCI3 and PLQ1 are advanced; S22 remains provider-off and queued.

# SCOPA Workflow Boundary Mapping Macro Delta — Principal-Directed Draft

**Status:** completed on 2026-08-03; WBM1-WBM5 satisfied; provider traffic,
publication, and release remain separate decisions
**Project:** SCOPA
**Proposed phase:** Post-R1 workflow boundary mapping
**Trigger:** principal direction to make SCOPA a world-class open-source tool
for mapping agentic workflow control boundaries and a credible foundation for
downstream consultation
**Provider posture:** closed
**Release posture:** closed

## Where we are

SCOPA `0.2.0` provides a strong enforcement kernel for locked repository paths,
governed writes, bounded completion gates, continuity, evidence, and adapter
capability inventories. The current maintenance work adds a self-contained
`SCOPA_AGENT.md` entry so a developer can point an LLM at one file and state a
task. The remaining product gap is legibility across the whole workflow:
SCOPA can enforce important boundaries, but it does not yet project controlled,
uncontrolled, unknown, and authority-sensitive surfaces into one portable map
that a developer or reviewer can understand without reconstructing internals.

## World-class objective

Make one prompt produce one truthful workflow boundary map before meaningful
agent mutation begins, then keep that map bound to runtime policy, completion,
and evidence through closeout.

The map must help a developer answer:

1. What outcome is the agent pursuing?
2. Which paths and mutation routes does SCOPA control?
3. Which process, network, credential, provider, plugin, browser, deployment,
   publication, and external-system routes remain uncontrolled or unknown?
4. What real gates determine completion?
5. Which actions require new human authority?
6. What evidence can an independent party verify?

## Open-source and consultation covenant

The open-source tool remains independently useful. SCOPA will not require a
paid service, hosted truth source, lead form, telemetry channel, or proprietary
verifier to generate, validate, compare, export, or interpret the basic
semantics of a workflow boundary map.

Consultation may provide organizational discovery, custom control profiles,
integration engineering, governance design, evidence review, deployment
support, training, and ongoing assurance operations. Consulting must consume
the same portable artifacts available to every developer; it must not redefine
a failed runtime result as passing or claim certification SCOPA cannot prove.

This separation is strategic: the free tool demonstrates technical truth and
creates a common language; professional services help organizations apply that
language to complex real environments.

## Exit contracts

| Contract | Statement | Proof |
| --- | --- | --- |
| WBM1 | A versioned, closed workflow-boundary-map schema represents controlled, uncontrolled, unknown, and authority-sensitive surfaces without overstating assurance | schema corpus plus deterministic generator tests |
| WBM2 | A developer can obtain matching machine-readable and human-readable maps from initialized SCOPA state through a stable provider-off CLI | CLI integration, hostile input, and byte-stability tests |
| WBM3 | The one-file agent entry produces and consumes the map in a source-free project without requiring manual SCOPA setup or dependency-manifest changes | installed point-and-go consumer fixture |
| WBM4 | Boundary maps can be validated, compared, and exported as sanitized portable assessment packets without a paid or hosted dependency | validator, semantic diff, redaction, and offline round-trip tests |
| WBM5 | Fresh adversarial and usability evaluation confirms the tool is understandable, fails closed, and does not convert unknown authority into a green claim | provider-off adversarial suite plus separately authorized model evaluation if still valuable |

## Protocol queue

| Slice | Classification | Executable value | Validation | Status |
| --- | --- | --- | --- | --- |
| S29 | implementation | Define `scopa.workflow-boundary-map.v1` and a pure deterministic projection from slice lock, completion state, capability inventory, and declared authority | schema corpus; missing/unknown capability cases; canonical byte reproduction | completed; WBM1 |
| S30 | implementation | Add a provider-off `scopa map` surface with JSON and concise Markdown output; bind the map to active lock and runtime state | CLI integration; stale-lock rejection; JSON/Markdown semantic parity; no-mutation proof | completed; WBM2 |
| S31 | runtime guard | Make `SCOPA_AGENT.md` map-first and qualify the one-file-plus-task journey from a source-free installation | clean consumer repo; no project dependency mutation; allowed/denied polarity; `canStop`; truthful partial assurance | completed; WBM3 |
| S32 | implementation | Add offline map validation, semantic comparison, and a sanitized portable assessment packet usable by developers or consultants | deterministic round trip; redaction corpus; controlled-to-uncontrolled regression detection; no-network proof | completed; WBM4 |
| S33 | test/validation | Run fresh adversarial installed-surface and developer-legibility qualification over S29-S32 and make one evidence-based continuation or release recommendation | unknown-surface hostility; misleading-green rejection; clean/cold process checks; documentation journey; optional separately approved outside-model test | completed; WBM5; provider-closed |

## Why each slice earns its place

- S29 creates a runtime-consumable object rather than a descriptive document.
- S30 gives the object a stable developer surface and proves it is derived from
  real locked state.
- S31 proves the promised point-and-go experience rather than merely describing
  it.
- S32 turns maps into a useful open interoperability layer and the legitimate
  input to deeper organizational assessment.
- S33 searches for false confidence and usability failure; it does not repeat
  release ceremony.

If S29 shows that an existing SCOPA schema can express the map without loss,
S29 and S30 should be collapsed. If S31 cannot demonstrate a materially simpler
developer journey, stop and redesign instead of adding documentation. If S32
cannot remain useful without consulting, reject the design.

## Anti-ceremony rules

- No digest approval is required for ordinary provider-off implementation
  inside an approved active slice.
- No standalone planning, approval, review-of-review, closeout, or documentation
  slice.
- One focused evidence set per slice; do not replay historical R1 campaigns.
- Outside-model testing is conditional and requires separate provider authority;
  deterministic qualification comes first.
- Macro Deltas remain optional oversight for multi-slice drift, never an input a
  developer must create before using SCOPA.
- Documentation ships with the executable surface it explains.
- Stop after S33 unless evidence names a concrete runtime defect or a clearly
  valuable next capability.

## Cumulative scope boundary

Expected implementation surfaces:

- `SCOPA_AGENT.md`
- `README.md` and focused public documentation
- `schemas/**`
- a focused boundary-map package or the smallest existing owning package
- `packages/cli/**`
- provider-off conformance and installed-consumer fixtures
- release-readiness policy only where needed to package and qualify new files
- `next-prompt-protocols/**`

## Non-goals

- No hosted dashboard, account system, telemetry, lead capture, CRM integration,
  customer upload, or proprietary map format.
- No paid gate on map generation, validation, comparison, export, schemas, or
  independent verification.
- No claim of OS sandboxing, provider identity, compliance certification, or
  control over capabilities that remain native or unknown.
- No autonomous deployment, publication, release, credential use, or external
  system mutation.
- No customer-specific policy work or consultation delivery inside the public
  runtime arc.
- No new provider call, experiment use, or assurance transfer from historical
  Claude/Codex evidence.
- No expansion of the MCP mutation surface merely to make the map appear more
  complete.

## Stop conditions

- Any map turns an omitted or unknown capability into controlled or safe.
- Machine and human projections disagree semantically.
- Map generation requires network access, proprietary infrastructure, or
  customer data.
- The agent entry claims enforcement over a native bypass route.
- The assessment packet retains credentials, raw prompts, customer content,
  absolute private paths, or provider output.
- A slice becomes predominantly ceremony or cannot name an executable
  uncertainty it retires.
- Implementation would require provider, publication, release, experiment, or
  customer authority not separately granted.

## Outcome and recommendation

WBM1-WBM5 are satisfied by the provider-off implementation and adversarial
qualification. Accept the changed surface for maintainer review and future
versioned release planning. Do not publish or call a provider from this queue;
either action requires a separate authorization and qualification boundary.

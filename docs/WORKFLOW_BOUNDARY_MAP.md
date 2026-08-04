# Workflow boundary map

`scopa.workflow-boundary-map.v1` is SCOPA's portable description of what an
agent workflow can do, what SCOPA controls, what remains outside that control,
and which actions require separate authority.

The map is derived from validated runtime objects. It is not a questionnaire,
compliance score, provider attestation, or claim that the operating system has
been sandboxed.

## Surface states

Every mapped surface has one status:

| Status | Meaning |
| --- | --- |
| `controlled` | The named SCOPA or adapter control mediates this route within the bound configuration |
| `uncontrolled` | The route is active but is not mediated by SCOPA |
| `unknown` | Required evidence is absent; SCOPA makes no safety inference |
| `authority-required` | The action is outside current authority and must not be performed without an explicit decision |
| `disabled` | The capability inventory states that the route is unavailable |

Missing information always becomes `unknown`. An authority declaration may
mark a surface disabled, uncontrolled, or authority-required; it cannot claim
that SCOPA controls a surface.

## What is mapped

The v1 contract always represents:

- locked repository scope and governed completion;
- native filesystem mutation, process execution, network, and extensions;
- credentials, providers, browsers, deployment, publication, and external
  systems; and
- every additional route present in a validated capability matrix.

The map binds the slice-lock hash, stable completion-projection hash, and—when supplied—the
capability-matrix and authority-declaration hashes. Gate output and capability
evidence prose are not copied into the map.

## Assurance summary

The summary is deliberately conservative:

1. any unknown surface produces `assurance.level: "unknown"`;
2. otherwise, any active uncontrolled surface produces `partial`; and
3. `full` is possible only when the represented surface is complete and has no
   active uncontrolled route.

`full` is configuration-relative. It does not mean universally secure,
provider-attested, certified, or protected from a separately privileged local
process.

## Programmatic use

```js
import {
  createWorkflowBoundaryMap,
  validateWorkflowBoundaryMap,
} from '@heart-ai-foundation/scopa/workflow-boundary-map';

const map = createWorkflowBoundaryMap({
  lock,
  stopState,
  capabilityMatrix,
  authorityDeclarations: [
    { id: 'deployment', status: 'authority-required' },
    { id: 'publication', status: 'authority-required' }
  ]
});

validateWorkflowBoundaryMap(map);
```

The generator is pure and deterministic. It performs no filesystem, process,
network, or mutation effect.

The closed public contract is available as
[`schemas/scopa.workflow-boundary-map.v1.schema.json`](../schemas/scopa.workflow-boundary-map.v1.schema.json).

## Open assessment boundary

Map creation, validation, comparison, export, and independent interpretation
are open-source capabilities. They must not require telemetry, customer
uploads, a hosted truth source, or paid consultation. Professional services
may help an organization discover its real capabilities, design controls,
integrate SCOPA, and review evidence, but cannot turn an unknown or failed map
surface into a passing runtime fact.

## Offline comparison and assessment

`compareWorkflowBoundaryMaps(before, after)` treats path expansion, removed
surface evidence, and movement toward unknown or uncontrolled authority as
regressions. It returns the complete local semantic diff.

`createBoundaryAssessmentPacket()` exports a sanitized structural projection.
It commits to the expected map hashes and hashes changed identifiers, while
excluding raw relative paths, non-goal prose, prompts, gate output, provider
output, and capability evidence. A relying party verifies it with
`verifyBoundaryAssessmentPacket()` and caller-supplied expected maps.

```sh
scopa assess --map current-map.json --baseline baseline-map.json
```

The packet posture is `bounded` or `review-required`; neither is a compliance
certification or permission to perform an authority-sensitive action.

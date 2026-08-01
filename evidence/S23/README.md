# S23 fresh exact-identity review evidence — stopped

S23 stopped on its first completed independent review. The evidence reviewer
returned `REJECT` with one high and one medium finding because frozen plan
`703cc8df4d92442730cb913e32d94dfb75c20e02a8c5928f4311c4ad85bcb696`
targets evidence commit `46afe0e63355b09c03b5f7e261eca30af952e818`, which predates the S22 closeout
receipt required by that same plan.

The artifact and runtime reviews were interrupted immediately after the stop
condition fired. No consistency receipt or eligibility closeout was created.
The packet was not silently retargeted. Provider, experiment, network, and
publication traffic were all zero.

`reviews/evidence.json` preserves the normalized rejection. `stop.json` binds
the stopped disposition and requires fresh authority before a corrected packet
or review replay may be created.

## S23-v2 remediation

The principal subsequently approved a binding-only remediation. Approval
`5dae71515d698401cfc70761991081c7042bad47338ab585132344f7d37e94da`
authorizes a superseding packet targeting commit `853b85fc...`, which contains
the completed S22 closeout. The rejected v1 packet and evidence remain
immutable. Three fresh v2 review executions are authorized; all provider,
experiment, network, publication, release, dependency, candidate, and runtime
changes remain forbidden.

## S23-v2 result — stopped

The artifact and evidence reviews returned `ACCEPT` with zero findings. The
runtime review returned `REJECT` with one medium finding: timeout handling in
the installed gate runner killed the immediate child but left a spawned
descendant alive after SCOPA reported the gate terminated. The reviewer killed
the test descendant and removed all disposable material.

The finding triggers the frozen stop condition. No consistency receipt or
eligibility closeout was created, and no runtime remediation was attempted
under the binding-only authority. `stop-v2.json` records the stopped result.

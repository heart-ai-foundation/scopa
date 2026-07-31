# S19 shrinkwrap enforcement stop

S19 implemented a disposable consumer-specific production shrinkwrap and an
independent installed-graph attestation probe. The generated candidate packed
the shrinkwrap, retained it after installation, and bound closure SHA-256
`2eb2403489e7cc932c2482736d6f930469cb0cba9384ec555519e34dd25c1add`.

The first real source-free install disproved the primary design. npm 10.9.7,
running offline with lifecycle scripts disabled, installed `fast-uri@3.1.5`
even though the packed and retained shrinkwrap selected `fast-uri@3.1.4`.
Candidate SHA-256
`f20c31dc08141bbb10195b8d4b4d3475cc801e7e0c4c34022d2615e6ca21ceea`
therefore did not identify the installed production graph.

This is the exact failure anticipated by the ratified S19 stop condition.
npm 11 was not run because one supported npm version had already failed.
Continuing would not improve the decision. The failed implementation was
removed from the worktree so `main` retains no broken or misleading closure
mechanism.

Provider calls, external network requests, and publication actions were zero.
DCI1-DCI3 and PLQ1-PLQ3 remain open. The ratified Macro Delta forbids silently
switching to bundled dependencies, so the next step is a fresh principal
decision on a bundled-production-dependency posture.

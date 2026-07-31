# S19 dependency-closure enforcement evidence

The principal ratified the exact S19-S23 Macro Delta through
`macro-delta-approval.json`. S19 then tested the primary publishable-shrinkwrap
design against a real source-free install.

npm 10.9.7 packed and retained the generated `npm-shrinkwrap.json`, but it
installed `fast-uri@3.1.5` instead of the closure-bound `3.1.4`. This proves
that a shrinkwrap inside a package installed as a dependency does not enforce
the package's transitive closure in this supported environment.

The S19 stop condition fired before npm 11, bundling, candidate freeze, or any
provider work. The attempted implementation was removed from the worktree.
`shrinkwrap-enforcement-stop.json` binds the diagnostic with receipt SHA-256
`277e6a2eb4a0ca5953a23c59eeb5d49c9f1005804d6fd0207aff462127e03295`.
DCI1-DCI3 and PLQ1-PLQ3 remain open.

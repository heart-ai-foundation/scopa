# S18.4 artifact and distribution review

Verdict: `REJECT`

## Exact binding

- candidate SHA-256:
  `e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498`;
- source commit: `43fbb969f32c711d1a68b05ad73fb33717c90d8c`;
- candidate manifest SHA-256:
  `c93946dc164d135869bc869536019629139f5dbb8d5097616026f1d5fed461e6`;
- qualification receipt SHA-256:
  `b1dff3b65d9dcd89b41d9b3e3c8080cce055f0082a96d5ae7013688921330f99`;
- npm integrity:
  `sha512-dr/nONIJCjEqCrBQat261hPc9dRCNpVNymD4Cb1cKZ9cZibCtzYftMVcreHfm6/ZHovAE2x9R2N4R0ixSXJVoQ==`;
- archive size: 211939 bytes;
- package: `@heart-ai-foundation/scopa@0.2.0-dev.1`.

## Findings

- critical: 0;
- high: 0;
- medium: 1;
- low: 0.

### Medium — installed identity does not bind the resolved dependency closure

The candidate pins its four direct dependencies, but their published package
metadata retains semver-ranged transitive dependencies. Examples include
`@endo/lockdown@1.0.19` depending on `ses ^2.0.0`, `ses@2.2.0` using caret
ranges for three `@endo/*` dependencies, and `ajv@8.20.0` depending on
`fast-uri ^3.0.1` and other ranged dependencies.

A consumer installing the tarball does not use the source checkout lockfile,
which is not packed. The installed-artifact identity binds the SCOPA tarball
and source commit but not the resolved dependency graph. The same candidate
SHA-256 can therefore install materially different SES enforcement or AJV
validation runtime bytes later. The S18.3 twelve-cycle stability result proves
one current cache and registry resolution, not immutable future resolution.

This changes the integrity meaning of “exact installed candidate.” Under the
frozen S18.4 rubric it is medium severity and requires `REJECT`.

Recommended closure is either a lock-enforced installation unit or bundled
dependencies, or an approved dependency-closure manifest containing every
resolved version and integrity whose digest is enforced at installation and
bound into live installed-artifact receipts.

## Executed review

The fresh reviewer:

- recomputed SHA-256, SHA-1, and npm SHA-512 integrity;
- verified the qualification receipt with the shipped validator;
- inspected all 179 archive entries for absolute or traversing paths,
  duplicates, links, special files, unsafe modes, owners, and timestamps;
- compared ordinary packed files with source commit `43fbb969…`: zero byte
  mismatches, with only the expected consumer `package.json` transformation;
- matched the complete manifest inventory, sizes, and modes;
- performed a source-free, forced-offline, ignore-scripts installation;
- verified 14 installed dependency nodes, lifecycle absence, bin mode
  promotion, both bin links, three exports, undeclared-import refusal, and
  source-free `scopa --help` launch;
- audited 18 packed Markdown files for missing surfaces and contributor-only
  commands;
- ran the package privacy scanner over all 179 files with zero findings;
- inspected credentials, private keys, private topology, hidden/build
  surfaces, required governance/security/docs, and dependency licenses.

## False positives and limitations

The contribution-template identity and public FreeTSA certificate were
correctly excluded as non-findings. Registry URLs in the locally generated
consumer lock described cached packages; npm was forced offline.

No independent registry advisory query ran because network traffic was
forbidden. The review relied on the retained S18.3 zero-vulnerability audit.
No detached package signature or third-party provenance was available.
Runtime behavior beyond installation, launch, and export resolution was out of
this role's scope. Coverage was Linux, Node 22.22.2, and npm 10.9.7.

Provider calls, network requests, publication actions, and GitHub mutations
were all zero. Disposable material was removed, and the repository and
retained evidence were not modified by the reviewer.

# SCOPA R1 Public Release Finalization Macro Delta

**Status:** principal-approved on 2026-08-02 America/Los_Angeles / 2026-08-03 UTC
**Provider posture:** closed; zero production-model calls
**Experiment posture:** closed
**Publication posture:** closed until a separately approved exact execution digest

## Trigger

S28 recorded principal GO for the exact private developer-preview candidate.
The approved public R1 target changes release metadata and therefore creates new
package bytes that cannot inherit the S28 package digest.

## Objective

1. finalize public stable identity `@heart-ai-foundation/scopa@0.2.0`;
2. set the intended public channels to GitHub repository, tag `v0.2.0`,
   non-prerelease GitHub Release, and npm `latest` with public access;
3. preserve the S28 decision and historical input bytes without rewriting them;
4. build, install, scan, and provider-off qualify the exact final tarball;
5. freeze a single-use ordered release-execution matrix with recovery rules; and
6. present its exact digest for a separate principal approval before any public action.

## Authorized implementation changes

- package and lockfile version/publication metadata;
- release posture, versioning, quickstart, claims, README, schemas, constants,
  proof corpus, and their deterministic tests;
- immutable S28 compatibility snapshots required by the sanctioned metadata change;
- `fixtures/R1/**`, `evidence/R1/**`, release notes, and protocol files.

## Exact public target

- npm: `@heart-ai-foundation/scopa@0.2.0`, access `public`, dist-tag `latest`;
- Git: annotated tag `v0.2.0` on the final qualified commit;
- GitHub: repository `heart-ai-foundation/scopa` public and one non-prerelease
  release titled `SCOPA v0.2.0` carrying the exact tarball and checksums;
- license: Apache-2.0;
- no production deployment, hosted service, telemetry, certification, trademark
  registration claim, provider call, or experiment use.

## Qualification boundary

- The final tarball must be publishable, deterministic, privacy-clean, bundled,
  installable with an unreachable registry, and identical under npm 10 and npm 11.
- `npm publish --dry-run --access public --tag latest` must succeed over the exact
  artifact without invoking lifecycle scripts.
- Package, closure, bundled payload, installed payload, license inventory, release
  notes, and execution matrix receive separate SHA-256 bindings.
- Registry name/version availability, Git tag absence, repository state, GitHub
  authority, and npm publisher authority must pass preflight before execution.

## Execution ordering

After a later exact-digest approval only:

1. revalidate commit, artifact, credentials, name/version availability, and tag absence;
2. change repository visibility to public;
3. create and push annotated tag `v0.2.0`;
4. create the non-prerelease GitHub Release with exact artifact and checksums;
5. publish the exact tarball to npm with public access and `latest`;
6. verify public GitHub and npm bytes, then write the closeout.

Stop on any drift or partial failure. Never overwrite a tag, replace an asset,
republish a version, unpublish, or conceal partial state.

## Non-goals

- No publication, visibility, tag, GitHub Release, npm publish, deployment, or announcement in finalization.
- No provider/model call or experiment use.
- No dependency, runtime behavior, public API, effect ABI, assurance, or evidence-schema semantic change beyond the release identity migration.
- No transfer of the S28 tarball digest to the final `0.2.0` bytes.

## Approval boundary

The principal instruction authorizes finalization and provider-off qualification.
It does not authorize any public execution call. Those calls require one later
approval binding the exact matrix digest and final candidate identities.

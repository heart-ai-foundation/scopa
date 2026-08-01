# S19-v2 bundled production-closure implementation

The failed S19 design showed that retaining a dependency shrinkwrap inside the
package did not compel npm 10 to install its exact transitive versions. S19-v2
therefore moves the trust boundary: the candidate carries the reviewed
production tree itself.

The official candidate path stages from a clean source copy, performs an
offline production-only install against the reviewed root lock, obtains npm's
actual bundle surface, generates `production-bundle.json`, packs once more,
and independently verifies both the packed and installed roots. Raw
`npm pack` remains a normal developer command but is not a qualified-candidate
path.

Four identities remain deliberately separate:

- package tarball SHA-256;
- production graph closure SHA-256;
- bundled file-tree SHA-256;
- installed file-tree SHA-256.

The bundle manifest also binds paths, sizes, modes, per-file hashes, dependency
edges, source resolution/integrity, and exact license/notice bytes. Validation
rejects missing, extra, mutated, permission-drifted, transplanted, stale, dev,
lifecycle-active, local/git, native, link, special-file, and uncontrolled
states. The focused hostile corpus directly exercises the highest-risk graph,
file, false-green, notice, privacy, and source mutations.

The npm 10.9.7/npm 11.19.0 matrix produced the same package and bundle
identities. Empty-cache installs succeeded with `--offline`, an unreachable
loopback registry, lifecycle scripts disabled, and a network-deny preload.
The independent installed-tree digest exactly equals the approved bundled-tree
digest.

Sixteen generic user-home/local-file examples occur in exact public upstream
SES bytes. They are classified as upstream structural references, while an
actual forbidden runtime value still fails the privacy gate. SCOPA-owned
privacy and credential findings remain zero.

This is executable closure, not approval ceremony: installed production code
can no longer be silently substituted after candidate freeze. DCI1 and DCI2
are satisfied. DCI3 remains incomplete until the qualification, live, soak,
and review receipts all preserve the four-part identity.

# S18.3 exact-candidate soak and audits

S18.3 froze a provider-closed plan for 12 fresh installations of candidate
SHA-256 `e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498`.
Each disposable cycle verified the installed file inventory, dependency graph,
and package privacy; initialized a new synthetic repository; executed an
allowed ACT write; refused an escape write; observed status and completion
through fresh CLI processes; and removed the full cycle root.

Three pre-soak validation attempts stopped in cycle 1 and cleaned up completely.
The first exposed locale-aware ordering versus the candidate manifest's
bytewise order. The second exposed npm's required `0644` to `0755` promotion
for the two declared bin targets. A third schema-path check stopped after the
cycle because status exposes `canStop` directly in the orientation object.
The final rules accept only the two package-declared executable promotions;
all other paths, sizes, modes, hashes, and receipt fields remain closed.

The first accumulated release-gate pass then stopped because the new reviewed
public plan was not yet named in the tarball fixture allowlist. The allowlist
was extended to bind that single file; no other packed surface was widened.

The completed run passed all 12 cycles. Installed tree digest
`0e6cb8891aefbd7c38acc825ba05f991e27a9fea9659d54ff724ae22efde32a2`
and dependency graph digest
`814737ae775f21742667343da6887e4c2e92f7b3552161825cfd6dfc9f829c85`
were stable throughout. The current npm production audit found zero
vulnerabilities and the installed package scan found zero privacy or credential
patterns. Descriptor growth was zero. Peak RSS growth was 8343552 bytes under
the 67108864-byte ceiling. All cycle and audit roots were removed, and no
provider process launched.

Receipt SHA-256:
`867b34db1556e8bbd89ac04b7cd5490027409bcedfc15e9ac1f327b35fab17c8`.
PLQ1 is satisfied. S18.4 is active.

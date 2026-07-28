# Independent S10 tarball review request

You are the unfamiliar outside reviewer for SCOPA
`@heart-ai-foundation/scopa@0.2.0-dev.1`.

You have only:

- `heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- `consumer-proof.public.json`
- this request

Do not seek or inspect the source repository, prior conversation, user home,
parent directories, global agent memory, or network resources. Work only
inside this disposable directory, except for invoking locally installed
system tools. Do not modify the supplied tarball or proof.

Independently:

1. Compute the tarball SHA-256 and compare it with the public proof.
2. Inspect the tarball inventory for unexpected private/build surfaces,
   secrets, unsafe paths, or unreviewed credentials/certificates.
3. Install the tarball into a fresh consumer directory using
   `npm install --ignore-scripts --no-audit --no-fund`.
4. From installed-package content only, follow `docs/QUICKSTART.md` and
   exercise the clean and known-failing fixtures.
5. Run the packaged `fixtures/S10/consumer-client.mjs` against the installed
   `scopa-mcp`; verify the allowed write, escaping-write denial, terminal
   state, tool inventory, and assurance result.
6. Independently verify the packaged signed packet using the packaged
   caller-supplied root and the exact trust-policy arguments documented in the
   quickstart.
7. Compare the observations with `consumer-proof.public.json`.
8. Review `SECURITY.md`, `docs/THREAT_MODEL.md`, `docs/CLAIMS.md`,
   `docs/VERSIONING.md`, and `docs/release-posture.json` for material
   omissions, contradictions, inflated claims, or unsafe release posture.

Return one JSON object only with:

- `reviewer` and observed model identity
- `artifactSha256`
- `checks`: an array of `{id, passed, evidence}`
- `findings`: an array of
  `{severity, id, description, remediation}` where severity is one of
  `critical`, `high`, `medium`, `low`
- `verdict`: exactly `ACCEPT` or `HOLD`
- `verdictReason`

Use `HOLD` for any critical/high finding, any failed required check, a proof
mismatch, an inability to reproduce the source-free workflow, or materially
inflated claims. Otherwise use `ACCEPT`. Do not treat explicitly documented
non-claims as defects.

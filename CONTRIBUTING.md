# Contributing to SCOPA

SCOPA accepts contributions under the Apache License 2.0 using the
[Developer Certificate of Origin 1.1](https://developercertificate.org/).
The project uses DCO sign-off and requires no CLA.

## Contribution workflow

This workflow requires a SCOPA source checkout with contributor scripts and
development dependencies installed. Those scripts are intentionally absent
from the source-free consumer package.

1. Start from an issue or bounded proposal that identifies the affected SCOPA
   boundary and claim.
2. Keep protocol/runtime changes distinct and preserve the frozen effect
   taxonomy unless a separately governed change authorizes otherwise.
3. Add fault-oriented tests that fail when the proposed control is absent.
4. Run `npm test`, `npm audit`, and `npm run protocol:check`.
5. Add a sign-off trailer to every contribution commit:

   ```text
   Signed-off-by: Your Name <your-email@example.com>
   ```

   `git commit -s` adds this trailer.

By signing off, you certify the DCO for that contribution. Do not submit
third-party work you are not entitled to contribute.

## Security fixes

Do not submit an uncoordinated public pull request for a vulnerability. Follow
`SECURITY.md`.

## Governance and review

Maintainers may request tighter claims, additional hostile fixtures, evidence
retention, or independent reproduction. Contribution acceptance does not
constitute certification, provider attestation, or endorsement. See
`GOVERNANCE.md`.

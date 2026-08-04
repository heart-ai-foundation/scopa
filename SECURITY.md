# Security policy

SCOPA enforces scope, completion, continuity, and evidence at a trusted local
tool boundary. Security reports are welcome and should be handled privately.

## Supported versions

| Version | Support status |
| --- | --- |
| Latest `0.2.x` release | Security fixes evaluated |
| Older releases and prereleases | Upgrade required |

SCOPA is pre-1.0 software. Support means that the maintainers will assess a
report against the documented boundary; it is not an SLA, warranty, hosted
service commitment, or formal certification.

## Report a vulnerability

Do not open a public issue, pull request, or discussion for a suspected
vulnerability. Do not include exploit details, credentials, personal data, or
live customer information in a public channel.

Request a private follow-up through the
[Heart AI Foundation contact page](https://empathyethicist.ai/contact/) with the
subject “SCOPA security report.” The initial message should contain only:

- a safe contact address;
- the affected SCOPA version and platform;
- the affected boundary—scope, completion, continuity, evidence, adapter,
  package, or disclosure; and
- whether active exploitation or credential exposure is suspected.

The Foundation will establish a private evidence channel before requesting
reproduction details.

## What to include privately

- the smallest safe reproduction;
- expected and observed behavior;
- exact package version, integrity, and platform;
- whether the issue crosses a declared trust boundary;
- known preconditions and impact;
- any temporary mitigation; and
- whether disclosure timing must be coordinated with another project.

Never send real credentials when a synthetic value demonstrates the issue.
Sanitize logs and environment output before sharing them.

## Response process

Maintainers will:

1. acknowledge and establish private custody;
2. reproduce against the exact affected artifact when possible;
3. assess severity, exploitability, and the documented claim boundary;
4. prepare a narrow fix and hostile regression test;
5. requalify the changed package bytes;
6. coordinate release and disclosure; and
7. credit the reporter when requested and safe.

No bounty or response-time guarantee is currently offered.

## Security boundary

SCOPA governs registered mutation tools at its trusted-host boundary and runs
real completion gates. It is not an operating-system sandbox and does not
protect against a separately privileged local process. Claude Code and Codex
integrations carry `partial` assurance because provider, native, policy,
session, network, and filesystem surfaces remain outside SCOPA.

Read the [threat model](docs/THREAT_MODEL.md),
[claims and non-claims](docs/CLAIMS.md), and
[security diagnostics guidance](docs/TROUBLESHOOTING.md#scopa-mcp-exits-with-a-launcher-envelope)
before reporting an expected boundary as a bypass.

## Public disclosure

Please allow maintainers a reasonable opportunity to validate and remediate a
report before public disclosure. The project will not represent an unverified
report as fixed, conceal known affected public state, or claim that automated
scanning is certification.

# Security policy

## Supported version

Security fixes are evaluated for the current `0.2.0-dev.1` private
developer-preview candidate. There is no production or public-release support
commitment yet.

## Reporting a vulnerability

Do not open a public issue or publish exploit details.

Private preview participants should use the private channel supplied with
their evaluation invitation. If that channel is unavailable, request a secure
follow-up through [the Heart AI Foundation contact page](https://empathyethicist.ai/contact/)
using the subject “SCOPA security report”; do not include exploit details,
credentials, personal data, or live secrets in the contact form.

In the secure follow-up, include:

- affected version and platform;
- the smallest safe reproduction;
- expected and observed boundary behavior;
- whether scope, completion, continuity, signature verification, or evidence
  disclosure is affected; and
- any known mitigation.

The Foundation will acknowledge receipt, establish a private evidence channel,
triage severity and affected claims, and coordinate remediation and disclosure.
No response-time or bounty commitment is made during the private preview.

## Security boundary

SCOPA enforces registered mutation tools at its trusted-host boundary. It is
not an operating-system sandbox. Claude and Codex integrations carry
adapter-specific `partial` assurance because provider, native, session,
network, policy, or filesystem routes remain outside SCOPA. See
`docs/THREAT_MODEL.md` and `docs/CLAIMS.md`.

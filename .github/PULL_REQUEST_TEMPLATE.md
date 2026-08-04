## Purpose

Describe the developer problem and the bounded change.

## Boundary and claims

- Affected boundary: scope / completion / continuity / evidence / adapter / packaging / documentation
- Claims added, changed, or removed:
- Explicit non-goals:

## Verification

- [ ] Added a failure-oriented or hostile regression test where behavior changed
- [ ] Ran the narrow relevant tests
- [ ] Ran `npm test`
- [ ] Ran `npm audit`
- [ ] Ran `npm run protocol:check`
- [ ] Tested public documentation commands when they changed
- [ ] Reviewed package contents and dependency impact

## Safety and contribution terms

- [ ] No credentials, private evidence, personal data, or uncoordinated vulnerability details are included
- [ ] No provider-backed probe was run without separate authority
- [ ] Documentation states assurance limits and expected failure behavior
- [ ] Every commit includes DCO sign-off (`git commit -s`)

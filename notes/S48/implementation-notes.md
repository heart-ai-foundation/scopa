# S48 implementation notes

## Decisions

- Keep the no-card report UNKNOWN in completion, assurance, and scope while
  replacing generic absence text with one fixed artifact command.
- State exactly what the default action observed: only that the configured card
  file was absent. It does not inspect PR prose or execute repository content.
- Carry S46 aggregate observation into the available-card PR projection. A
  satisfied card with outside-path or non-goal contact receives the same
  `WITH UNVERIFIED CHANGES` headline as terminal and HTML renderers.
- Retain the canonical card completion status and `canStop`; PR qualification
  remains presentation-only.

## Validation history

The first focused run exposed two test-contract issues: constructed S48 cards
omitted the required observation basis, and an S41 assertion bound an older
sentence fragment. The fixture was corrected to the exact schema and the new
summary retained the historical `No gate or project command was executed`
contract. The official S48 and S41 gates then passed.

## Boundaries retained

No workflow, permission, trigger, token, network default, comment opt-in, card
schema, gate behavior, path disclosure, provider use, publication, or external
system changed.

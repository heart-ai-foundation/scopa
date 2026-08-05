# S49 implementation notes

## Decisions

- Implement the adopter badge as a deterministic local SVG projection of
  `scopa.boundary-card.v1`, not a Shields URL or hosted service.
- Display the computed assurance level with its exact basis. Display only
  aggregate outside-path and non-goal-contact observation; when observation is
  unavailable, say so. Zero is explicitly `OBSERVED`, not a containment claim.
- Embed the complete source-map digest as SVG metadata/data binding without
  treating the badge as the semantic source.
- Amend the badge canon narrowly: fact badges are allowed; grades, scores,
  pass marks, approval, certification, risk rank, and safe-to-merge marks remain
  prohibited.
- Link the already-defined optional organizational review and Heart AI
  Foundation contact route from README and Support while keeping SCOPA itself
  account-free and telemetry-free.

## Boundaries retained

- The SVG contains no scripts, event handlers, foreign objects, links, remote
  assets, analytics, paths, prompts, gate output, non-goal text, or credentials.
- Canonical card, completion, `canStop`, assurance, observation, and source-map
  semantics did not change.
- No GitHub repository setting, Discussion, topic, homepage, social preview,
  visibility, release, publication, provider, or external system was changed.

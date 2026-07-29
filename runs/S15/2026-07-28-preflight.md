# S15 deterministic preflight

Date: 2026-07-28

No provider prompt was sent during this preflight.

## Read-only client preflight

- `claude --version`: `2.1.220 (Claude Code)`
- authentication class: logged-in first-party `claude.ai` Max subscription;
  account identifiers were inspected only in private process output and are
  not retained here;
- requested model policy: `sonnet` alias;
- reviewed CLI controls: stream JSON input/output, structured output schema,
  no session persistence, disabled prompt suggestions, explicit settings and
  MCP configuration, tool closure, turn limit, budget limit, and headless
  operation.

The prior S8 pin was `2.1.170`. S15 treats the installed `2.1.220` client as a
new exact review target; favorable behavior from the older proof is not
silently transplanted.

## Focused deterministic gates

```sh
npm run test:s15
npm run test:s8
npm run test:s14
```

Results before provider authorization unlock:

- S15: pass, 8/8 top-level tests;
- S8: pass, 6/6 Claude profile/normalizer tests;
- S14: pass, 8/8 shared-custody tests.

The accumulated `npm test` gate passed 127/127 discovered tests plus all
focused S8-S15 suites. `npm audit --audit-level=low` reported zero
vulnerabilities, `npm run protocol:check` passed, and `git diff --check`
reported no whitespace errors.

The managed sandbox rejects nested detached process groups. The official
commands passed in the host context. This harness limitation is not provider
evidence.

## Installed-candidate ordering

`npm run probe:s12:installed` correctly refused the dirty implementation
worktree. The S15 runner independently has the same clean-candidate gate.
Installed qualification and real-provider execution occur only after this
deterministic implementation is committed.

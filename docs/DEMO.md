# See SCOPA catch three failures

Run one command. It creates an isolated temporary repository, exercises real
SCOPA runtime paths, and removes the repository before returning:

```sh
scopa demo
```

Exact tested output:

```text
SCOPA DEMO — THREE REAL FAILURE CHECKS

PASS  Scope escape denied by the path dispatcher
PASS  Completion claim blocked until the real gate passed
PASS  Full-assurance overclaim rejected for native bypasses

FINAL  Declared gates satisfied: yes
       Reported assurance: partial
       Uncontrolled routes: 4
       Temporary workspace removed: yes

Proof SHA-256 74798ac93431995f82abb8ac68533cf53f4a74f61a947d9cb54fd3e295d63cb5
Local deterministic demonstration; not a security certification or guaranteed prevention claim.
```

## What actually happened

1. SCOPA initialized a temporary task whose real gate required a file that did
   not exist. The first gate run stayed blocked; an asserted completion could
   not make `canStop` true.
2. The trusted mutation dispatcher attempted a repository escape. The real
   path boundary returned `SCOPA_SCOPE_DENIED`, and no escape file appeared.
3. The demo changed an honestly computed partial capability matrix to claim
   full assurance. The real matrix validator rejected the overclaim.
4. A governed in-scope write created the expected file, the same real gate
   passed, and the final map remained partial because native bypasses were
   still uncontrolled.
5. The temporary repository and escape sentinel were removed and verified
   absent.

The direct gate definition is path-independent, so the same installed bytes
produce the same proof digest in different installation directories. The
result object is available with `scopa demo --format json`. It contains no
temporary path, prompt, environment map, gate output, provider output, or
secret. The proof digest binds that deterministic result.

The demo makes no provider call, network request, telemetry event, account,
hosted result, or change to the caller's repository. It proves these three
runtime behaviors in this build; it is not a benchmark or a claim that SCOPA
captures every route on a general-purpose host.

# S13 round 3 proof/evidence review

Verdict: `REJECT`

- Source commit: `e17bbc2acfb70cadad2511b1f1338ddc346fde74`
- Candidate SHA-256: `740cfc630cefde123b871dd2d7d1c1975a02c2f4edf8d3d0c8da82484ecaa5e0`
- Raw proof SHA-256: `fccf4c2a87e018933bb548ce43a2c156d4865e15d83970cfe36f9c5d2be3ec2b`
- Public proof SHA-256: `ad6f362d57fedcee0fb7c2b1c909997e1437e625fceb366d9e71616a9b002432`
- Manifest SHA-256: `f211054ae6c5e82697724e17f40c2550d6045d8151339e8649132b2e899de040`

## M-01 — Medium: impossible control-bearing candidate paths accepted

Both runtime and published validators accepted a manifest file path containing
U+0000, such as `bad\u0000name`, as canonical POSIX-relative. The path cannot
exist in POSIX or Node filesystem APIs. Newline, carriage return, tab, and DEL
also passed the claimed canonical-path contract.

The finding is a proof false green in the same canonical-path contract family
as the initial normalization-alias rejection. The shared normalizer and
shipped schema must reject at least U+0000; a bounded control-character ban
and parity/focused mutations are recommended.

## Other executed evidence

Official packing and the public proof reproduced byte-identically. Source-free
consumer semantics matched. The 33-case corpus agreed 33/33, and 40 additional
semantic, numeric, closed-field, and path mutations rejected. Redaction
collisions failed closed; equal/overlapping roots remained safe.

Low: the private `final/installed-surface-regression.json` still bound round 2
while the bounded public receipt correctly bound round 3. The private residue
was outside the requested input trio, but must be replaced or removed.

Plain `npm pack` differs by design from the sanitized official pack. Receipts
remain unsigned local evidence and both validators share implementation.

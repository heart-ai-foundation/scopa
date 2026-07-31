# S18.2 live stop: candidate/client mismatch

The approved attempt stopped during the exact candidate's local Claude version
probe. The matrix approved Claude 2.1.170 and Codex 0.145.0, but the installed
candidate exports required versions 2.1.220 and 0.146.0. The Claude runtime
returned `version-drift` before its auth probe or model invocation. Codex was
not opened.

No provider API/model call was consumed. The conservative private intent and
inflight journal remain mode 0600 under the approved external custody root;
the version-probe process group is gone and no orphan was detected. The
approval is closed against replay. A corrected closed matrix requires a fresh
digest and separate approval.

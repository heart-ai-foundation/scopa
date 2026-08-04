# Quickstart: point your agent at SCOPA

Give a coding agent two things:

1. [`SCOPA_AGENT.md`](../SCOPA_AGENT.md)
2. the task you want completed

For example:

> Read `SCOPA_AGENT.md` and add request-ID logging to this service. Preserve
> its public API and do not change dependencies.

That is the primary SCOPA workflow. The agent inspects the repository, derives
the smallest path and verification boundary, bootstraps the pinned public
runtime, performs supported writes through SCOPA, runs the real completion
gates, and reports the resulting assurance. You do not need to preinstall a
package or author a slice definition.

When the template is hosted with the repository, you can point an agent at its
raw URL instead of copying it into the target project:

```text
Read https://raw.githubusercontent.com/heart-ai-foundation/scopa/main/SCOPA_AGENT.md
and implement <your task> in this repository.
```

Replace `<your task>` with the actual outcome. A repository checkout can use
the local file and does not need network access to read the protocol.

## What the agent handles

The entry protocol tells the agent to:

1. discover project instructions, relevant files, and existing checks;
2. treat ordinary work as one small slice instead of creating a roadmap;
3. generate and lock the SCOPA boundary itself;
4. map controlled, uncontrolled, unknown, disabled, and authority-required routes;
5. use the strongest available governed mutation route;
6. stop on scope denial or missing authority;
7. run real project gates and require `canStop: true`; and
8. report limitations without turning them into ceremony.

## What remains explicit

SCOPA does not convert a general shell or native editor into a controlled
capability. If those bypass routes remain active, the agent must report
partial assurance even when its observed changes stay in scope. A host seeking
the strongest boundary should expose the model-neutral SCOPA MCP tools and
disable native mutation routes.

Publishing, deployment, paid provider calls, credential use, destructive
operations, and external-system changes still require explicit authority.

## Manual and integration paths

Use the [manual walkthrough](MANUAL_SETUP.md) when you want to exercise every
interface yourself. For permanent host configuration, see the
[integration guide](INTEGRATIONS.md). The [slice-definition reference](SLICE_DEFINITION.md)
documents the policy the agent generates on your behalf.

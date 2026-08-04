# S31 point-and-go installed journey decisions

- The deterministic fixture represents an agent following `SCOPA_AGENT.md`;
  it does not substitute for a separately authorized outside-model usability test.
- Control-plane files are agent-created bootstrap artifacts. The requested
  product file is written only through the SCOPA dispatcher after initialization.
- The installed harness loads runtime modules from the installed package, never
  the source checkout.
- SCOPA is installed in a separate tool root. The target receives no
  `package.json`, package lock, or `node_modules` tree.
- The fixture's native bootstrap and process routes are explicitly uncontrolled,
  keeping both pre- and post-mutation maps at partial assurance.

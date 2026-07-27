import {
  createInterface,
} from 'node:readline';

export class FakeAgentClient {
  constructor({
    input,
    output,
    name = 'scopa-fake-agent',
    version = '0.1.0',
  }) {
    this.input = input;
    this.name = name;
    this.version = version;
    this.nextId = 1;
    this.lines = createInterface({
      input: output,
      crlfDelay: Infinity,
      terminal: false,
    });
    this.iterator = this.lines[Symbol.asyncIterator]();
  }

  send(message) {
    this.input.write(`${JSON.stringify(message)}\n`);
  }

  async receive() {
    const next = await this.iterator.next();
    if (next.done) throw new Error('MCP server closed before responding');
    return JSON.parse(next.value);
  }

  async requestWithId(id, method, params) {
    const message = {
      jsonrpc: '2.0',
      id,
      method,
    };
    if (params !== undefined) message.params = params;
    this.send(message);
    const reply = await this.receive();
    if (reply.id !== id) {
      throw new Error(`MCP response id mismatch: expected ${id}`);
    }
    return reply;
  }

  async request(method, params) {
    const id = this.nextId;
    this.nextId += 1;
    return this.requestWithId(id, method, params);
  }

  notify(method, params) {
    const message = {
      jsonrpc: '2.0',
      method,
    };
    if (params !== undefined) message.params = params;
    this.send(message);
  }

  async initialize(protocolVersion = '2025-11-25') {
    const reply = await this.request('initialize', {
      protocolVersion,
      capabilities: {},
      clientInfo: {
        name: this.name,
        version: this.version,
      },
    });
    if (reply.error) return reply;
    this.notify('notifications/initialized');
    return reply;
  }

  listTools() {
    return this.request('tools/list', {});
  }

  callTool(name, args = {}) {
    return this.request('tools/call', {
      name,
      arguments: args,
    });
  }

  close() {
    this.input.end();
    this.lines.close();
  }
}

#!/usr/bin/env python3

import json
import subprocess
import sys


def request(identifier, method, params=None):
    value = {
        "jsonrpc": "2.0",
        "id": identifier,
        "method": method,
    }
    if params is not None:
        value["params"] = params
    return value


binary, repo, session, matrix = sys.argv[1:]
messages = [
    request(1, "initialize", {
        "protocolVersion": "2025-11-25",
        "capabilities": {},
        "clientInfo": {
            "name": "scopa-fake-agent",
            "version": "0.1.0",
        },
    }),
    {
        "jsonrpc": "2.0",
        "method": "notifications/initialized",
    },
    request(2, "tools/list", {}),
    request(3, "tools/call", {
        "name": "scopa_write_file",
        "arguments": {
            "path": "workspace/installed.txt",
            "content": "installed-bridge",
        },
    }),
    request(4, "tools/call", {
        "name": "scopa_write_file",
        "arguments": {
            "path": "../installed-escape.txt",
            "content": "blocked",
        },
    }),
    request(5, "tools/call", {
        "name": "scopa_check",
        "arguments": {},
    }),
    request(6, "tools/call", {
        "name": "scopa_transcript",
        "arguments": {},
    }),
]
wire = "".join(
    json.dumps(message, separators=(",", ":")) + "\n"
    for message in messages
)
completed = subprocess.run(
    [
        binary,
        "--repo",
        repo,
        "--session-file",
        session,
        "--matrix-file",
        matrix,
    ],
    cwd=repo,
    input=wire,
    text=True,
    capture_output=True,
    timeout=20,
    check=False,
)
if completed.returncode != 0:
    raise RuntimeError(
        f"scopa-mcp exited {completed.returncode}: {completed.stderr}"
    )
if completed.stderr:
    raise RuntimeError(f"scopa-mcp wrote stderr: {completed.stderr}")
replies = [
    json.loads(line)
    for line in completed.stdout.splitlines()
    if line
]
if len(replies) != 6:
    raise RuntimeError(f"expected 6 replies, received {len(replies)}")

summary = {
    "serverName": replies[0]["result"]["serverInfo"]["name"],
    "toolCount": len(replies[1]["result"]["tools"]),
    "writeError": replies[2]["result"]["isError"],
    "deniedError": replies[3]["result"]["isError"],
    "deniedCode": replies[3]["result"]["structuredContent"]["code"],
    "canStop": replies[4]["result"]["structuredContent"]["state"]["canStop"],
    "transcript": replies[5]["result"]["structuredContent"],
}
sys.stdout.write(json.dumps(summary, separators=(",", ":")) + "\n")

# ML3 robot MCP server

A headless **stdio MCP server** that exposes the ML3 robot as tools, so an MCP client
(**Claude Code**, Claude Desktop, …) can look through the camera and drive the robot itself.

It is a sibling to the [`runner/`](../runner) course-runner: where the runner runs its own
LLM loop, this server hands the loop to the MCP client. Both **reuse the cockpit's own robot
clients** (`createTeleopClient`, `createRecordClient`, camera/host helpers) rather than
re-implementing the protocol.

> ⚠️ **Reachability & safety.** It moves a real robot over the LAN — run it on a machine on the
> robot's Wi‑Fi. Start with a low `ML3_SPEED_SCALE`, keep a clear area. Every `drive` is a bounded
> burst that auto-stops, and `stop` sends zero velocity immediately.

## Tools

| Tool               | Args                                    | Effect                                                     |
| ------------------ | --------------------------------------- | ---------------------------------------------------------- |
| `get_camera_frame` | `camera: "front" \| "rear"` (front)     | Returns the current JPEG as an image block to look at      |
| `drive`            | `vx`, `wz` (−1..1), `durationS` (0..5)  | Short bounded burst then auto-stop (speed/duration capped) |
| `stop`             | —                                       | Immediate zero-velocity stop                               |
| `start_recording`  | `route` (mcp), `operator` (claude-code) | Start a dataset episode (record_server, port 9002)         |
| `stop_recording`   | `label: "success" \| "failure"`         | Save the episode with a label and stop                     |
| `get_status`       | —                                       | host / speed scale / duration cap / teleop + record state  |

`vx` is forward(+)/back(−), `wz` is turn-left(+)/turn-right(−), both normalized to `[-1, 1]`.
Drive in **short bursts** (`durationS` ≈ 0.3–0.8) and re-check the camera between moves.

## Use it from Claude Code

The repo ships a project-scoped [`.mcp.json`](../.mcp.json) registering this server as
`ml3-robot`. Open the repo in Claude Code and approve the server when prompted, then just ask it to
drive — Claude Code will call `get_camera_frame`, look, and call `drive`/`stop` in a loop.

Config lives in `.mcp.json` (`command: npx tsx mcp/index.ts`) with env defaults; override the robot
address by setting `ML3_HOST` there or in a repo-root `.env`:

```jsonc
// .mcp.json
{
    "mcpServers": {
        "ml3-robot": {
            "command": "npx",
            "args": ["-y", "tsx", "--env-file-if-exists=.env", "mcp/index.ts"],
            "env": {
                "ML3_HOST": "192.168.1.42",
                "ML3_SPEED_SCALE": "0.5",
                "ML3_MAX_DURATION_S": "3",
            },
        },
    },
}
```

Register it elsewhere (other MCP clients / user scope) with the same command, e.g.:

```bash
claude mcp add ml3-robot -- npx -y tsx --env-file-if-exists=.env mcp/index.ts
```

## Run / inspect manually

```bash
pnpm mcp            # start the stdio server (talks JSON-RPC on stdout)
```

Because it is a stdio server, **stdout carries only JSON-RPC** — all logging goes to stderr (the
entry also forces any stray `console.log` to stderr so reused client code can't corrupt the stream).

## Config

| Env var              | Default        | Meaning                                  |
| -------------------- | -------------- | ---------------------------------------- |
| `ML3_HOST`           | `192.168.1.42` | Robot host on the LAN                    |
| `ML3_SPEED_SCALE`    | `0.5`          | Global speed governor (0..1)             |
| `ML3_MAX_DURATION_S` | `3`            | Hard cap on any single `drive` burst (s) |

## Test

```bash
pnpm vitest run --project runner    # includes mcp/*.test.ts
```

`mcp/server.test.ts` wires the server to an in-memory MCP client and asserts the tool list, that
`drive` connects-then-drives, that `get_camera_frame` returns an image block, that an out-of-range
axis is rejected before touching the robot, and that stop/record tools call through — no robot
required.

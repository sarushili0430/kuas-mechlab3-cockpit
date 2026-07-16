# ML3 autonomous course-runner

A headless **Node/TypeScript CLI** that drives the ML3 robot through a course on its own.
Given a course brief (overview + per-waypoint instructions), it runs a **vision-in-the-loop**
loop — look through the robot camera → ask Claude for the next move → drive a short burst → look
again — until the course is done.

It is the **operator** counterpart to the robot side: the robot + its MCP server live in
`kuas-mechlab3`; this runner lives in the cockpit repo and **reuses the cockpit's own robot
clients** (`createTeleopClient`, `createRecordClient`, camera/host helpers) rather than
re-implementing the protocol.

> ⚠️ **Reachability & safety.** The runner talks to the robot over the LAN, so run it on a machine
> on the robot's Wi‑Fi. It moves a real robot: start with a low `ML3_SPEED_SCALE`, keep a clear
> area, and be ready to Ctrl‑C (which sends a stop). Every `drive` is bounded and auto-stops; the
> loop stops between moves and on any parse failure.

## Setup

```bash
pnpm install
cp runner/.env.example .env      # then edit .env
```

`.env` (gitignored) holds `ANTHROPIC_API_KEY` and, optionally, `ML3_HOST` / `ML3_SPEED_SCALE` /
`ML3_MAX_DURATION_S`.

## Run

```bash
pnpm runner --course runner/course.example.json
```

Flags:

| Flag                   | Default                  | Meaning                                                              |
| ---------------------- | ------------------------ | -------------------------------------------------------------------- |
| `--course <path>`      | (required)               | Course JSON: `{ overview, waypoints: [{ instruction, landmark? }] }` |
| `--max-steps <n>`      | 40                       | Hard cap on loop iterations                                          |
| `--speed-scale <0..1>` | `ML3_SPEED_SCALE` or 0.5 | Global speed governor                                                |
| `--model <id>`         | `claude-sonnet-5`        | Claude model (use `claude-opus-4-8` for harder navigation)           |
| `--rear`               | off                      | Also send the rear camera frame each step                            |
| `--record`             | off                      | Record the run as a dataset episode (rosbag, port 9002)              |
| `--dry-run`            | off                      | Ask Claude but don't move — logs each decision                       |

**Model note:** `claude-sonnet-5` (default) is a strong vision + agentic model with low latency
and cheap intro pricing; step up to `claude-opus-4-8` (`--model claude-opus-4-8`) for harder
navigation.

## How it works

Each step (`runner/loop.ts`): grab a front (and optionally rear) JPEG from the MJPEG stream
(`runner/camera.ts`), send it plus the course + a short action history to Claude
(`runner/agent.ts` → `runner/anthropic.ts`), and get back a single validated action
(`{action: "drive"|"stop"|"done", vx, wz, durationS, ...}`). The runner clamps + speed-scales it
and executes via the reused teleop client (`runner/robot.ts`), which streams the command at ~20 Hz
and always finishes with a stop. There is no motion acknowledgement from the robot, so the loop
re-observes with the camera after every move.

## Test

```bash
pnpm test            # runs the "unit", "storybook", and "runner" projects
pnpm vitest run --project runner
```

`runner/*.test.ts` covers the MJPEG frame parser, decision validation + safe-stop fallback, and an
end-to-end loop test that drives scripted actions through the **real** teleop client (via its
`createSocket` DI seam) and asserts the scaled command stream + a final stop — all in-process, no
robot required.

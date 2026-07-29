# RXOS

RXOS is an experimental dual-screen infotainment and instrument-cluster
platform for a Mazda RX-8. This repository currently contains a desktop
simulator and the milestone 1.2 dual-display visual foundation.

> RXOS is read-only and is not a certified vehicle instrument. Milestone one
> must not be connected to a vehicle or used to control any vehicle system.

## What works

- Deterministic simulated RPM, speed, gear, throttle, temperatures, oil
  pressure, fuel and battery voltage.
- A versioned, validated telemetry stream served at
  `ws://127.0.0.1:8787/telemetry`.
- Rust and TypeScript simulator/gateway implementations using the same JSON
  contract.
- Recorded NDJSON playback.
- Qt/QML driver display with Daily, Performance, Track, and reduced-data
  presentation.
- Qt/QML cabin shell with Home, Navigation, Media, Vehicle, Performance,
  Diagnostics, and Settings applications.
- Shared day/night design tokens, reusable controls, configurable logical
  profiles, keyboard/rotary-style focus support, and bounded telemetry charts.
- Browser developer console for inspecting the stream.
- Loss-of-data and stale-data presentation.
- TypeScript unit/integration tests and Rust provider/contract tests.

## Quick start

Requirements: Node.js 22 or newer and pnpm 10 or newer.

```bash
pnpm install
pnpm dev --filter @rxos/vehicle-simulator
```

In a second terminal:

```bash
pnpm dev --filter @rxos/developer-console
```

Open the URL printed by Vite. For playback:

```bash
pnpm --filter @rxos/vehicle-simulator dev -- \
  --playback packages/telemetry-fixtures/recordings/demo-lap.ndjson
```

For Rust and Qt setup and commands, see
[`docs/development/setup.md`](docs/development/setup.md).

Complete verification, including Rust and Qt:

```bash
pnpm verify
```

Run the deterministic milestone 1.2 scenario server with `pnpm demo`. Launch
the driver display with `--demo-cycle` to cycle Daily, Performance, and Track
during the scenario. Profile overrides use `--width`, `--height`, `--scale`,
and `--density`.

## Repository map

- `apps/driver-display`: driver Qt/QML display.
- `apps/cabin-display`: centre cabin Qt/QML display.
- `apps/vehicle-simulator`: TypeScript reference simulator.
- `apps/developer-console`: browser telemetry inspector.
- `services/vehicle-gateway`: Rust simulation/playback gateway.
- `packages/vehicle-schema`: canonical TypeScript telemetry types and validator.
- `packages/ipc`: transport parsing and freshness policy.
- `packages/telemetry-fixtures`: deterministic generation and recordings.

Read the architecture and safety documents before making changes:

- [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md)
- [`docs/safety/safety-boundaries.md`](docs/safety/safety-boundaries.md)
- [`docs/architecture/adr-001-technology-stack.md`](docs/architecture/adr-001-technology-stack.md)

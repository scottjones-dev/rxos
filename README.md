# RXOS

RXOS is an experimental dual-screen infotainment and instrument-cluster
platform for a Mazda RX-8. This repository currently contains a desktop
simulator, milestone 1.5 representative-hardware qualification tooling, and
the milestone 1.6 presentation redesign.

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
- Qt/QML driver display with Road, Sport, Track, and reduced-data presentation
  (legacy scenario names remain Daily and Performance).
- Qt/QML cabin shell with Home, Navigation, Media, Vehicle, Climate, Cameras,
  Settings, Vehicle Health, Service, and Diagnostics applications.
- A resizable desktop design preview showing both display concepts and local
  presentation controls without opening a vehicle or telemetry connection.
- Shared day/night design tokens, reusable controls, configurable logical
  profiles, keyboard/rotary-style focus support, and bounded telemetry charts.
- Browser developer console for inspecting the stream.
- Loss-of-data and stale-data presentation.
- Shared Qt localisation and metric/UK/US presentation formatting.
- Deterministic headless screenshots, layout invariants, concurrent-display
  reliability tests, and a development review gallery.
- Release-mode native profiling with bounded frame timing, Linux memory detail,
  chart-work counters and environment-aware comparisons.
- Deterministic dual-display profiles, fail-closed role assignment, a temporary
  prototype launcher, review overlays, and redacted diagnostics.
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

Milestone 1.3 validation commands:

```bash
pnpm concurrent:launch
pnpm localisation:validate
pnpm layout:test
pnpm visual:verify
pnpm performance:native:short
pnpm verify:milestone-1.3
```

Milestone 1.4 native investigation commands:

```bash
pnpm qt:configure:release
pnpm qt:build:release
pnpm performance:native:driver
pnpm performance:native:cabin
pnpm performance:native:concurrent
pnpm performance:native:frame
pnpm performance:native:memory
pnpm performance:native:chart
pnpm performance:native:compare build/performance/native-concurrent-short.json
pnpm verify:milestone-1.4
```

Milestone 1.5 software qualification commands:

```bash
pnpm prototype:display:validate
pnpm prototype:rotary
pnpm prototype:power
pnpm prototype:boot
pnpm prototype:review:occlusion
pnpm prototype:review:touch
pnpm prototype:diagnostics
pnpm prototype:verify:software
```

Milestone 1.6 presentation commands:

```bash
pnpm qt:configure
pnpm qt:build
pnpm preview:desktop        # Linux
pnpm preview:desktop:windows
pnpm visual:verify
pnpm verify:milestone-1.6
```

The desktop preview controls local display values only. It is not a simulator,
telemetry provider, or vehicle interface.

`prototype:dev`, `prototype:fullscreen`, `prototype:review`, and
`prototype:verify:hardware` require a native release build and appropriately
configured Linux displays. They do not connect to a vehicle. Milestone 1.5
remains open until the documented physical and GPU-backed sessions are run.

Native CPU, memory and frame figures are host observations, not representative
hardware or automotive qualification. See `docs/performance` and the
representative-hardware review plan before interpreting them.

Visual comparison is automated evidence only. Use the checklists in
`docs/review`; physical readability, touch reach, mounting, distraction, and
automotive safety have not been validated.

Run the deterministic milestone 1.2 scenario server with `pnpm demo`. Launch
the driver display with `--demo-cycle` to cycle Daily, Performance, and Track
during the scenario. Profile overrides use `--width`, `--height`, `--scale`,
and `--density`.

## Repository map

- `apps/driver-display`: driver Qt/QML display.
- `apps/cabin-display`: centre cabin Qt/QML display.
- `apps/desktop-preview`: resizable presentation-only development preview.
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

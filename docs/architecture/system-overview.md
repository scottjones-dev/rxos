# RXOS System Overview

## Purpose

RXOS is a dual-display infotainment and instrument-cluster platform for a Mazda
RX-8. Milestone one is a desktop-only simulator: it proves the telemetry
contract, display behaviour, recording and playback without connecting to a
vehicle.

## Milestone-one architecture

```text
                         read-only telemetry
┌──────────────────┐     typed WebSocket stream      ┌──────────────────┐
│ simulated provider├───────────────────────────────►│ driver display   │
│ or recording      │                                │ Qt 6 / QML       │
└────────┬─────────┘                                └──────────────────┘
         │
         ▼                                           ┌──────────────────┐
┌──────────────────┐     same typed stream          │ cabin display    │
│ vehicle gateway  ├───────────────────────────────►│ Qt 6 / QML       │
│ Rust             │                                └──────────────────┘
└────────┬─────────┘
         │                                           ┌──────────────────┐
         ├──────────────────────────────────────────►│ developer console│
         │                                           │ TypeScript / web │
         ▼                                           └──────────────────┘
┌──────────────────┐
│ trip recorder    │
│ milestone stub   │
└──────────────────┘
```

The Rust `vehicle-gateway` owns the data-source abstraction. Its simulated
provider generates deterministic RX-8-like values using names such as
`engine_rpm`; it does not claim that any signal corresponds to a real CAN
identifier. Its playback provider reads newline-delimited telemetry fixtures.

The gateway publishes versioned JSON envelopes over WebSocket. JSON is used for
the desktop milestone because Qt/QML can consume it without generated runtime
bindings. TypeScript and Rust models, runtime validation, a protocol version,
and contract tests make this a strongly typed IPC boundary. A future ADR may
replace the wire format with Protocol Buffers if measured requirements justify
it.

Both displays consume the same snapshots. They never infer freshness from a
signal's value: each envelope contains source and monotonic sequence metadata,
and clients calculate age from `capturedAt`. A disconnected client immediately
shows loss of data; a connected client marks data stale after 1.5 seconds
without a valid snapshot.

## Repository ownership

- `apps/`: user-facing displays, simulators, developer tools and companion app.
- `services/`: independently testable Rust vehicle and platform services.
- `packages/`: shared TypeScript contracts, IPC helpers, fixtures and policy.
- `hardware/`: documentation and future adapter boundaries; no verified Mazda
  mappings are present in milestone one.
- `docs/`: architecture, safety, hardware and UI decisions.
- `tooling/`: repository scripts and developer-only configuration.

## Data flow

1. A `TelemetryProvider` returns a complete, internally consistent snapshot.
2. The gateway stamps it with schema version, sequence and capture time.
3. The gateway broadcasts the envelope to every connected consumer.
4. Consumers validate the envelope before updating visible state.
5. Clients retain the last good sample while showing `STALE` or `NO DATA`.
6. Playback uses the same provider interface and wire contract as simulation.

## Deployment boundary

Milestone one runs on a developer workstation. Docker is not required and is
not part of display runtime. The intended production target is Linux with Qt 6,
but production boot, compositor, power, audio, camera and hardware integration
are explicitly outside this milestone.

## Uncertain assumptions

- Qt 6 with `QtQuick`, `QtQuick.Controls`, and `QtWebSockets` will be available
  on target Linux hardware; the exact distribution and graphics stack are not
  selected.
- Two 15-inch displays are assumed to use 1920×1080 logical layouts. Physical
  resolution, brightness, colour, touch controller and mounting are unknown.
- The milestone uses generic simulated ranges and dynamics, not Mazda CAN
  scaling, arbitration IDs, diagnostic PIDs or warning semantics.
- Gear is represented as `R`, `N`, or `1` through `6`; the actual gearbox and
  reliable source for selected gear are not yet known.
- Oil temperature and pressure may require aftermarket sensors. Their eventual
  source, calibration and failure modes are unknown.
- WebSocket JSON is assumed adequate for the initial update rate and number of
  consumers. Latency and resource budgets have not been measured on target
  hardware.
- GPS, IMU, cameras, audio, LTE, navigation routing and OTA infrastructure are
  represented only as boundaries or placeholders.
- Authentication is omitted for loopback desktop IPC. Production IPC trust,
  process isolation and credential management need threat modelling.
- Recorded fixtures use newline-delimited JSON and are assumed to contain no
  personal location data in milestone one.

## Phased implementation plan

## Mobile companion

`apps/mobile` is a separate Expo/React Native presentation runtime. It shares
the TypeScript telemetry contract, mobile API domain logic, state semantics,
and design tokens, but not QML components. It connects only to the existing
local WebSocket stream or deterministic fixtures. Local AsyncStorage contains
presentation settings and a last-known validated snapshot; cached values are
never presented as live.

### Phase 1 — desktop telemetry vertical slice

Create the monorepo, typed telemetry contract, deterministic simulator, Rust
gateway, playback support, Qt/QML Daily and Track driver layouts, cabin pages,
stale/loss handling, tests and developer documentation.

### Phase 2 — Linux hardware-in-the-loop

Select target computer and Linux image; benchmark graphics and IPC; add a
read-only SocketCAN provider behind the existing interface; capture and
document signals using approved equipment; add power-state and watchdog
prototypes. No transmission to a vehicle CAN interface is permitted.

### Phase 3 — local platform services

Implement trip recording, settings and maintenance SQLite stores, diagnostic
read models, GPS/IMU ingestion, media session integration and offline
navigation. Add service supervision, permissions and structured logging.

### Phase 4 — cameras and connectivity

Integrate camera capture, Bluetooth, Wi-Fi and optional LTE with privacy,
bandwidth and degraded-mode behaviour. Validate boot time, thermal behaviour
and display readability.

### Phase 5 — update and companion ecosystem

Build signed A/B OTA updates, fleet-safe rollback, companion applications and
opt-in remote services. Complete security review, privacy controls and recovery
procedures before any road use.

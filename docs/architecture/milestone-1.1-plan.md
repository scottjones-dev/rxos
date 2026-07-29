# Milestone 1.1: Native Verification and Display Reliability

## Scope

Milestone 1.1 hardens the existing desktop-only, read-only simulator. It adds
Linux CI, native build verification, bounded telemetry delivery, contract
compatibility checks, structured lifecycle logs, graceful shutdown, and
automated reliability tests for both Qt/QML displays.

It does not add vehicle integration, physical CAN access, control APIs, SQLite,
GPS, IMU, cameras, navigation routing, media services, OTA, or mobile features.
Factory vehicle instrumentation remains the safety authority.

## Native build risks found

1. The display projects require Qt 6.5, while Ubuntu 24.04 distribution
   repositories may provide an older Qt release. CI needs a pinned Qt SDK rather
   than relying on the system Qt packages alone.
2. The driver and cabin displays duplicate telemetry parsing and freshness
   logic, creating contract-drift and reliability risk.
3. QML state logic is coupled to a live `WebSocket`, so stale, malformed,
   disconnect, and reconnect behaviour cannot be tested deterministically.
4. The applications have no bounded test-mode exit; a headless CI launch would
   otherwise hang indefinitely.
5. The Rust gateway uses a bounded Tokio broadcast channel, but lagged receivers
   currently exit without structured diagnostic information.
6. The TypeScript simulator checks socket state but not `bufferedAmount`, so a
   slow client can accumulate an unbounded per-client WebSocket send queue.
7. Neither native nor TypeScript lifecycle logs use a stable structured format.
8. Rust shutdown does not stop the producer task explicitly or report graceful
   termination.
9. Existing Rust/TypeScript contract tests cover only selected field names and
   do not prove units, nullability, timestamp rules, or warning representation.
10. Native build outputs and tests have not yet run on this Windows workstation
    because Rust, CMake, Ninja, Qt, and `qmllint` are not installed.
11. The QML code uses JavaScript APIs that must be checked against the pinned Qt
    runtime and `qmllint`.
12. Generated build directories exist locally but are ignored; CI must always
    configure from a clean build directory.

## Uncertain assumptions

- Qt 6.8.x is assumed to be an appropriate supported CI baseline for the Qt
  6.5-minimum project.
- The `offscreen` Qt platform plugin is assumed to support these non-visual CI
  reliability checks. An Xvfb fallback may be required if a runner/plugin
  combination cannot initialise Qt Quick offscreen.
- GitHub-hosted Ubuntu 24.04 runners are assumed to support the selected Qt
  installation action and cache locations.
- A 32-snapshot Rust broadcast channel and a 256 KiB TypeScript per-client send
  threshold are initial desktop reliability limits, not production performance
  budgets.
- Update rates of 1, 10, 20, and 60 Hz are tested with deterministic virtual
  sample generation. CI timing is not treated as a real-time guarantee.
- The loopback WebSocket endpoint remains unauthenticated for desktop
  development only.
- All telemetry fields in schema version 1 are required and non-nullable.
- RFC 3339 UTC timestamps with millisecond precision and a trailing `Z` are the
  canonical wire representation.
- Warning values are required booleans grouped in a required `warnings` object.

## Native dependencies

### All platforms

- Node.js 22
- pnpm 11.17.0 via Corepack
- Rust stable with `rustfmt` and `clippy`
- CMake 3.21 or newer
- Ninja
- Qt 6.5 or newer with:
  - Qt Quick
  - Qt Quick Controls 2
  - Qt WebSockets
  - Qt Test / Qt Quick Test
  - QML tooling including `qmllint` and `qmltestrunner`

### Ubuntu 24.04 CI

- C/C++ compiler toolchain
- OpenGL/EGL and XKB runtime/development libraries required by Qt Quick
- `libgl1-mesa-dev`, `libegl1-mesa-dev`, `libxkbcommon-dev`, and
  `libxkbcommon-x11-0`
- Pinned Qt SDK installation with dependency caching

### Windows

- Visual Studio 2022 C++ build tools
- A matching Qt MSVC kit
- CMake and Ninja on `PATH`

## Implementation work

1. Add pinned Ubuntu 24.04 GitHub Actions jobs for Node, Rust, and Qt.
2. Add root scripts for native format, lint, test, Qt configure/build/lint, and
   complete verification.
3. Define a machine-readable contract manifest and shared canonical envelope.
4. Test the manifest and envelope from both TypeScript and Rust.
5. Make simulation rates configurable and add deterministic 1/10/20/60 Hz load
   tests.
6. Bound TypeScript client buffering and verify that a slow client cannot affect
   another client.
7. Preserve the Rust bounded broadcast channel, handle lag explicitly, and test
   multiple clients.
8. Add JSON structured logs for startup, connection lifecycle, malformed input,
   stale data, playback lifecycle, and shutdown.
9. Add cooperative graceful shutdown to both telemetry servers.
10. Extract QML parsing/freshness into one shared testable component.
11. Add QML unit tests and a controlled reliability WebSocket scenario.
12. Run each complete display binary headlessly against that scenario and fail
    if it does not observe live, stale, malformed, disconnected, and reconnected
    states.
13. Expand Linux and Windows setup documentation and agent instructions.

## Exit criteria

- All Node checks pass on Ubuntu 24.04.
- Rust formatting, Clippy with denied warnings, and all-feature tests pass.
- Both Qt applications configure and build with Ninja.
- `qmllint` passes for shared and application QML.
- Both display binaries pass the controlled headless reliability scenario.
- Contract compatibility and four-rate deterministic load tests pass.
- Delivery queues are bounded and slow clients are isolated.
- CI and local documentation distinguish unavailable tools from passing checks.
- No safety boundary or product scope has changed.

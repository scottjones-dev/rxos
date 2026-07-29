# Milestone 1.2: Dual-display visual foundation

## Scope

Milestone 1.2 creates the reusable QML visual and interaction architecture for
the desktop simulator. It does not change the telemetry wire contract, connect
to vehicle hardware, persist settings, or add real navigation, media, cameras,
mobile, OTA, GPS, IMU, SQLite, or SocketCAN capability.

RXOS remains a read-only secondary display. Factory instruments remain the
safety authority.

## Preconditions

Ubuntu 24.04 CI run 30447890028 passed on 2026-07-29, including Node and
TypeScript verification, strict Rust verification, QML lint, both Qt builds,
QML state tests, and both headless display reliability scenarios.

## Architecture

- `DisplayProfiles.qml` resolves configurable driver and cabin dimensions,
  density, and scale from defaults or command-line/environment overrides.
- `RxTheme.qml` and `RxTokens.qml` provide day/night, high-contrast,
  reduced-motion, layout, sizing, colour, typography, and motion roles.
- Reusable `Rx*.qml` controls live in `packages/design-system/qml`.
- `DisplaySettings.qml` owns milestone-local in-memory preferences.
- `WarningModel.qml` maps simulated telemetry flags to presentation-only
  warnings. It does not encode Mazda thresholds or factory lamp behaviour.
- `BoundedHistory.qml` keeps a fixed-size sampled series and represents gaps
  explicitly.
- Driver and cabin shells own navigation and composition; telemetry parsing and
  freshness remain shared in `TelemetryState.qml`.

## Phases

1. Document display, information, warning, accessibility, and distraction
   assumptions.
2. Add profiles, tokens, themes, settings, warning presentation, chart history,
   and reusable QML controls.
3. Refactor the driver shell into Daily, Performance, Track, and reduced-data
   layouts.
4. Refactor the cabin shell into persistent navigation with Home, Navigation,
   Media, Vehicle, Performance, Diagnostics, and Settings applications.
5. Add deterministic QML behavioural tests, profile launch tests, a demo
   scenario runner, and bounded performance observations.
6. Run local checks that are available and the complete Ubuntu CI workflow.

## Uncertain assumptions

- The physical panels, brightness, viewing angles, touch controller, pixel
  density, and compositor are not selected.
- Driver 2560×720 and cabin 1920×1080 are logical development profiles, not
  procurement specifications.
- Desktop keyboard focus approximates a future rotary controller; its actual
  event protocol and detents are unknown.
- The simulator warning flags have no verified Mazda severity. Their mapping is
  demonstration presentation only.
- Range is an explicitly labelled estimate derived from simulated fuel, not a
  verified vehicle calculation.
- Performance observations on GitHub-hosted runners and developer desktops are
  not target-hardware or automotive certification results.
- Automatic theme selection has no ambient-light input in this milestone and
  therefore resolves to the configured fallback.

## Exit criteria

- Both profile defaults and overrides are testable.
- Shared controls use central roles instead of page-specific styling.
- Both displays preserve loss, malformed, stale, disconnect, and reconnect
  handling.
- Driver and cabin mode/navigation behaviour is deterministic and tested.
- Chart storage is bounded under 60 Hz input.
- No control path, real hardware interface, fabricated lap, or authoritative
  warning logic is introduced.

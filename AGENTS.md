# RXOS Agent Guide

## Mission

Build RXOS incrementally as a reliable Linux-based dual-display vehicle data
and infotainment platform. The current repository is a desktop simulator, not a
production vehicle system.

## Safety boundary

RXOS is read-only against the vehicle. Never add commands for steering,
braking, throttle, airbags, ABS, stability control, immobiliser, engine or
transmission management, or other safety-critical systems. Never invent Mazda
CAN arbitration IDs, offsets, scaling or diagnostic identifiers. Name
unverified values as simulated signals.

Do not open a physical vehicle interface in tests or development defaults.
Future SocketCAN adapters must be receive-only by construction and require the
review gate in `docs/safety/safety-boundaries.md`.

## Architecture

- Rust owns vehicle-facing providers and system services.
- Qt 6/QML owns both automotive display runtimes.
- TypeScript owns shared developer/companion tooling and a reference contract.
- `services/vehicle-gateway` broadcasts complete snapshots. Consumers do not
  merge partial updates.
- The milestone-one protocol is versioned JSON over loopback WebSocket.
- Every consumer validates inputs and independently derives freshness.
- Hardware implementations sit behind interfaces; simulation remains the
  default.

## Coding standards

- TypeScript is strict. Avoid `any`; use `unknown` at trust boundaries and
  validate before narrowing.
- Rust forbids unsafe code. Keep I/O at adapters and deterministic behaviour in
  testable library functions.
- QML must keep safety and freshness states visible. Aesthetic animation must
  not conceal missing data.
- QML pages use `RxTokens` roles and reusable `Rx*` primitives. Do not add
  arbitrary colours, touch sizes, spacing, or motion when a token applies.
- Driver UI is non-touch. Cabin controls preserve the scaled 56×56 minimum,
  visible focus, Escape/Back semantics, and rotary-compatible traversal.
- Warning severity is presentation-only. Do not add Mazda thresholds or make
  acknowledgement imply that a condition was resolved.
- Chart and navigation histories must be explicitly bounded.
- Shared display telemetry parsing belongs in
  `packages/design-system/qml`; do not fork driver and cabin validators.
- Native C++ uses C++20, Qt ownership, bounded test timeouts, and structured
  JSON lifecycle logs. A native test must fail rather than hang.
- Telemetry delivery queues must remain bounded. A slow or disconnected client
  must not delay other clients.
- Use SI/metric units in names (`speedKph`, `oilPressureKpa`) and explicit
  timestamps (`capturedAt`).
- Keep protocol changes additive where possible. Bump `schemaVersion` for a
  breaking change and update Rust, TypeScript, QML and fixtures together.
- Add tests for validation, stale/lost behaviour and provider changes.
- Record architecture or safety trade-offs as ADRs before implementation.

## Commands

```bash
pnpm install
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm demo
pnpm performance:observe
pnpm verify:node

pnpm native:format
pnpm native:format:check
pnpm native:lint
pnpm native:test
pnpm native:verify

pnpm qt:configure
pnpm qt:lint
pnpm qt:build
pnpm qt:test

pnpm verify
```

Run the TypeScript simulator with
`pnpm --filter @rxos/vehicle-simulator dev`. Use `--playback <path>` to replay
an NDJSON fixture. The Rust equivalent is `cargo run -p
rxos-vehicle-gateway`, with the same playback flag.

## Working rules for future agents

1. Read the safety boundary and relevant ADRs before changing a provider or
   telemetry field.
2. Inspect the worktree and preserve unrelated user changes.
3. State uncertain vehicle, hardware and UX assumptions in documentation.
4. Implement the smallest coherent milestone; do not silently add production
   integration.
5. Never represent simulated thresholds or values as verified Mazda behaviour.
6. Run the checks applicable to changed languages. Report unavailable
   toolchains honestly.
7. Update setup docs and fixtures when commands or contracts change.
8. Do not commit secrets, personal location traces or proprietary CAN captures.
9. Keep `.github/workflows/ci.yml` on Ubuntu 24.04 and preserve the exact Node,
   Rust, Clippy, Qt build, `qmllint`, and headless reliability checks.
10. Treat `-D warnings` Clippy failures and `qmllint` failures as blocking.
11. Update the version-one contract manifest, canonical envelope, Rust model,
    TypeScript model, QML validator, and compatibility tests together.
12. For display reliability, test extracted state deterministically and also run
    each complete binary against the controlled WebSocket scenario.
13. Clearly report native commands that did not run because a local toolchain
    is unavailable; authored CI coverage is not a local pass.
14. Run both profile smoke tests and the deterministic reliability scenario
    after changing display composition or shared controls.
15. Treat daylight/night readability, distraction, touch reach, and physical
    display scaling as human-review items until checked on representative
    hardware.

# RXOS Safety Boundaries

## Non-negotiable boundary

RXOS is initially a read-only observer of vehicle data. It must not command,
modify, emulate, suppress or interfere with steering, braking, throttle,
airbags, ABS, stability control, immobiliser, engine management, transmission
control or any other safety-critical system.

Milestone one does not connect to a vehicle.

## Allowed in milestone one

- Generate fictional telemetry in a desktop process.
- Replay repository-owned recordings containing simulated data.
- Render telemetry, warnings and placeholders on desktop Qt displays.
- Store local development settings and simulated trip information.
- Test loss, corruption, latency and staleness handling.

## Prohibited

- Opening a physical CAN, OBD-II, serial or GPIO device.
- Sending CAN frames, diagnostic requests, flow-control frames or wake signals.
- Inventing, guessing or copying unverified Mazda CAN identifiers or scaling.
- Presenting simulated warnings as a certified replacement for factory gauges.
- Disabling, obscuring or physically replacing required factory safety
  indicators during development.
- Treating navigation, telemetry or RXOS warnings as authoritative for safe
  vehicle operation.

## Engineering guardrails

1. Hardware access is hidden behind a receive-only `TelemetryProvider`
   interface.
2. The simulated provider is the only enabled provider by default.
3. Future SocketCAN code must open receive-only and reject transmit operations
   in both API design and tests.
4. Any proposed control capability requires a new safety architecture, hazard
   analysis, explicit owner approval and independent review. It does not belong
   in the read-only gateway.
5. Unknown, invalid or stale data is visibly unavailable; it is never replaced
   with a plausible value.
6. Display failure must not affect the vehicle. Factory systems remain the
   safety authority.

## Data-quality states

- **Live:** a validated sample was captured no more than 1.5 seconds ago.
- **Stale:** the last valid sample is older than 1.5 seconds. The last value may
  remain visible only with a prominent stale indicator.
- **Lost:** transport is disconnected or no valid sample has ever arrived.
  Safety-related values show unavailable state.
- **Invalid:** schema validation, sequence or range checks fail. The sample is
  rejected and logged; the client remains stale or lost.

## Warning semantics

Milestone-one warning thresholds are simulator demonstrations, not vehicle
diagnostic rules. UI labels must make simulated warnings clear. Verified
thresholds, sensor sources, diagnostic coverage and prioritisation require a
separate reviewed specification.

## Future vehicle work gate

Before connecting RXOS to any vehicle:

- identify the exact interface hardware and isolation characteristics;
- document verified signals and provenance;
- prove transmit is physically and logically disabled;
- add capture/replay tests for malformed and high-volume traffic;
- complete electrical, power-state and failure-mode reviews;
- obtain an explicit go/no-go review recorded in a new ADR.

# Milestone One Implementation Plan

## Scope

Deliver a desktop-only vertical slice with deterministic simulated telemetry,
recorded playback, a Rust gateway, two Qt/QML displays, a small browser
developer console, shared typed contracts and automated tests.

## Work packages

1. Establish pnpm/Turborepo and Cargo workspaces plus common formatting and
   linting policy.
2. Define versioned telemetry snapshots and example fixtures without vehicle
   identifiers.
3. Implement the Rust provider abstraction, deterministic simulated provider,
   recording playback provider and WebSocket broadcast gateway.
4. Implement display-side connection, validation and freshness state.
5. Build driver Daily/Track layouts and cabin navigation, media, overview,
   telemetry, diagnostics and settings pages.
6. Add a TypeScript simulator/fixture utility and developer console supporting
   the same contract.
7. Add unit, contract and integration tests, including gateway WebSocket and
   playback paths.
8. Document setup, commands, limitations and safety rules.

## Exit criteria

- Both displays use the same endpoint and contract.
- Every required telemetry field is live in simulation.
- Disconnect and stale states are visible and test-covered.
- A committed recording can be replayed through the gateway.
- TypeScript and Rust checks pass.
- QML modules configure successfully when Qt 6 is installed.
- No physical vehicle access or unverified Mazda identifier exists.

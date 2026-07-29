# ADR-001: Technology Stack

- Status: Accepted for milestone one
- Date: 2026-07-29

## Context

RXOS needs two low-latency automotive displays, hardware-facing services,
shared contracts, developer tooling and future companion applications. The
first deliverable must run safely on a desktop without vehicle integration.

## Decision

- Use a pnpm workspace and Turborepo for the monorepo task graph.
- Use TypeScript for shared contracts, tools, the simulator CLI and companion
  or browser-based supporting applications.
- Use Rust for vehicle-facing services and system daemons.
- Use Qt 6/QML for driver and cabin display runtimes.
- Target Linux; desktop development may run on Linux, macOS or Windows where
  the required tools are available.
- Use versioned JSON WebSocket envelopes as the milestone-one strongly typed IPC
  protocol. Maintain equivalent Rust and TypeScript models and verify them with
  shared contract fixtures.
- Use SQLite for settings, trips and maintenance when those stores are
  implemented.
- Put CAN access behind a provider abstraction. Only simulation and playback
  providers exist in milestone one.
- Use Vitest for TypeScript tests, Cargo tests for Rust, and Playwright for
  browser supporting tools when they gain user flows.
- Use Docker only for optional developer tooling, never for Qt display runtime.

## Rationale

Qt/QML provides a production-suitable embedded graphics path and can consume
WebSockets directly. Rust gives hardware-facing processes memory safety and
predictable native deployment. TypeScript keeps developer and companion tooling
productive. A human-readable JSON protocol shortens the desktop vertical slice
while schema versioning and validation preserve an explicit contract.

## Consequences

- Rust and TypeScript representations require contract tests to prevent drift.
- QML performs defensive runtime validation because it has no generated static
  bindings.
- JSON costs more bandwidth and CPU than a binary protocol; benchmark before
  production.
- Developers need Node.js, pnpm, Rust and Qt 6 to exercise the entire system.
- Services that are only repository placeholders must not be mistaken for
  implemented production functionality.

## Alternatives considered

- **Protocol Buffers immediately:** excellent cross-language typing, but adds
  generated-code and QML bridging work before desktop behaviour can be tested.
  It remains a likely future option.
- **All TypeScript:** simpler initial repository, but does not exercise the
  intended vehicle-service implementation language.
- **Web displays:** convenient tooling, but does not validate the selected
  production display technology.

# ADR-002: Shared static QML module

- Status: Accepted for milestone 1.3
- Date: 2026-07-29

## Context

Milestone 1.2 embeds every design-system QML file separately in both display
modules. This duplicates generated cache compilation and resource payloads,
lengthens builds, obscures the shared import boundary, and makes it harder to
prove that both applications use one component implementation.

## Decision

Build `packages/design-system/qml` once as the static
`Rxos.DesignSystem` QML module. Both display executables import and link that
module. Application-specific QML remains in its application module. QML tests
may import source files directly when testing isolated state, while complete
binary tests exercise the packaged module.

Do not introduce a dynamic binary plugin or installation-time QML dependency.
Both executables remain self-contained desktop artifacts.

## Consequences

- Shared QML cache and resources are generated once per build.
- Imports and `qmllint` discovery become explicit.
- Both applications must link the static QML plugin.
- A packaging regression can affect both displays, so complete binary smoke,
  reliability, capture, and concurrent tests remain required.

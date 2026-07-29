# ADR-004: Mobile companion architecture

- Status: Accepted for milestone 1.7
- Date: 2026-07-29

## Context

RXOS needs an owner-facing companion that remains useful without vehicle
hardware and shares telemetry semantics with the two Qt automotive displays.
QML visual components cannot run as native React Native components, and forcing
cross-framework visual reuse would couple unrelated runtimes.

## Decision

- Use Expo SDK 57, React Native, Expo Router, strict TypeScript, TanStack Query,
  and NativeWind v5 for the mobile application.
- Share contracts and domain logic through TypeScript packages, not UI code.
- Keep mobile design tokens as plain TypeScript values mirrored into the
  NativeWind theme.
- Consume the existing version-one JSON WebSocket telemetry stream directly.
- Derive live, stale, lost, and invalid state independently in the client.
- Use local fixture repositories for trips and garage data until a reviewed
  owner-data service exists.
- Use React context for small local preferences and no global state library.

## Consequences

- QML and React Native implementations intentionally differ while terminology,
  safety semantics, tokens, units, and contracts remain aligned.
- NativeWind preview changes are confined to app styling configuration.
- Simulator WebSocket and fixture mode can be exercised without Qt.
- Historical data is not synchronised between devices in this milestone.

## Alternatives considered

- **Sharing QML components:** impossible in React Native without embedding a
  second UI runtime and would create fragile platform coupling.
- **A web wrapper:** weaker native navigation, accessibility, and offline
  behaviour.
- **Redux or Zustand:** unnecessary for the current local state model.
- **A new mobile backend:** would duplicate the existing protocol and imply
  unsupported remote access.

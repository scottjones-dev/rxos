# Milestone 1.7 plan — mobile companion foundation

## Boundary

RXOS Companion is a simulated, local-network, read-only owner companion. It
does not control the vehicle, connect to CAN or OBD, request location, provide
remote access, or replace factory instrumentation. All warnings and health
language describe validated simulator telemetry only.

## Implementation layers

1. Add framework-independent mobile tokens and API/client domain packages.
2. Build an Expo SDK 57 application with Expo Router, React Query and
   NativeWind v5, using native React Native components rather than QML.
3. Reuse the version-one telemetry envelope and `/telemetry` WebSocket.
4. Add deterministic trips, garage data, and telemetry scenarios for offline
   development and repeatable tests.
5. Persist settings, active vehicle, pairing metadata, and last valid snapshot
   locally. Cached telemetry is always labelled with its age.
6. Implement the five-tab information architecture, nested trip/health routes,
   and a development-only scenario route.
7. Verify the mobile application independently of Qt in Ubuntu CI.

## Assumptions

- Expo SDK 57 is the target runtime. NativeWind v5 is currently a preview, so
  its exact published preview version is pinned and isolated to the app layer.
- The existing simulator remains WebSocket-only. Historical trips are local
  deterministic fixtures in this milestone; no competing HTTP telemetry
  service is introduced.
- On a physical phone, the simulator address is the development computer's LAN
  address. Loopback is suitable only for web and same-host emulators.
- Range and fuel-use values are fixture presentation data, not inferred
  mechanical estimates.

## Verification

- Mobile formatting, lint, strict TypeScript, unit/component tests, Expo config,
  web export, and a deterministic fixture smoke test.
- Existing Node, Rust, and Qt jobs remain unchanged. Mobile CI is a separate
  Ubuntu job and requires no Qt toolchain.

# RXOS Companion

The Milestone 1.7 owner companion is an Expo SDK 57 and React Native
application styled with the pinned NativeWind `5.0.0-preview.4` release.
NativeWind v5 is pre-release software; its configuration is confined to this
application.

RXOS Companion is simulated, local-network, and read-only. It cannot control a
vehicle, use CAN or OBD, unlock doors, start an engine, control climate, track
location, or access RXOS over the internet.

## Prerequisites

- Node.js 22
- pnpm 11.17.0
- Expo Go compatible with SDK 57, or an Android emulator

No Qt, CMake, Ninja, Rust, or Visual Studio Build Tools are required for
fixture mode.

## Start on Windows

```powershell
pnpm install
pnpm mobile:dev
```

Fixture mode is the safe default. Use the in-app development scenarios from
Settings to explore parked, driving, motorway, high-RPM, warning, stale,
disconnected, and invalid states.

Run web directly with `pnpm mobile:web`. Run Android with
`pnpm mobile:android`. iOS requires macOS and Xcode.

## Connect to the simulator

Start the TypeScript simulator:

```powershell
pnpm --filter @rxos/vehicle-simulator dev
```

Then start Expo in live mode:

```powershell
$env:EXPO_PUBLIC_RXOS_FIXTURE_MODE="false"
pnpm mobile:dev
```

On Expo web on the same computer, use `127.0.0.1:8787`. On a physical phone,
open Settings → Simulator address and enter the development computer's private
LAN address and port `8787`. Both devices must be on the same trusted network.
The simulator must be explicitly configured to listen beyond loopback before a
phone can reach it; Milestone 1.7 does not change its safe loopback default.

If Windows Firewall blocks an explicitly configured LAN listener, allow only
Node.js on the private network profile and only for the selected development
port. Never expose the simulator port through a router or public network.

The development pairing payload is non-sensitive JSON:

```json
{
  "host": "192.168.1.20",
  "port": 8787,
  "protocolVersion": 1,
  "simulatorName": "RXOS Simulator"
}
```

Only loopback and RFC 1918 private-network hosts are accepted. QR camera
scanning is intentionally deferred; manual pairing uses the same validator.

## Verification

```powershell
pnpm mobile:lint
pnpm mobile:typecheck
pnpm mobile:test
pnpm --filter @rxos/mobile build
pnpm mobile:verify
```

The web export is the deterministic CI smoke build. Native iOS signing,
Android release compilation, stores, push services, accounts, and remote
access are not part of this milestone.

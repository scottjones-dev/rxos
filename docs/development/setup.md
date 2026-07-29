# Native Developer Setup

## Prerequisites

- Node.js 22
- pnpm 11.17.0 (Corepack is supported)
- Rust stable (`rustup`, `rustc`, `cargo`, `rustfmt`, `clippy`)
- CMake 3.21 or newer
- Ninja
- Qt 6.5 or newer with Quick, Quick Controls 2 and WebSockets modules
- Qt QML tooling, Qt Test, and Qt Quick Test

Linux is the target platform. On Ubuntu-family development systems, use the
distribution's Qt 6 development packages or the Qt online installer. Package
names vary by release, so verify that CMake can find `Qt6Quick`,
`Qt6QuickControls2` and `Qt6WebSockets`.

Docker is not required. Display runtime must not be containerised. The CI
baseline is Ubuntu 24.04 with a pinned Qt 6.8 SDK.

## Node and Rust

```bash
corepack enable
pnpm install --frozen-lockfile
rustup toolchain install stable --profile minimal \
  --component rustfmt --component clippy
```

Rust dependencies are fetched by Cargo on the first Rust build.

## Linux native setup

On Ubuntu 24.04, install the compiler and Qt runtime prerequisites:

```bash
sudo apt-get update
sudo apt-get install --yes \
  build-essential cmake ninja-build \
  libgl1-mesa-dev libegl1-mesa-dev \
  libxkbcommon-dev libxkbcommon-x11-0
```

Install Qt 6.5 or newer with Qt Quick, Quick Controls 2, WebSockets, Test, Quick
Test, and QML tools. The repository CI uses Qt 6.8.3 installed independently of
Ubuntu's distribution Qt packages. Add the selected Qt `bin` directory to
`PATH` and its prefix to `CMAKE_PREFIX_PATH` if CMake cannot find it.

For headless execution:

```bash
export QT_QPA_PLATFORM=offscreen
export QSG_RHI_BACKEND=software
```

## Windows native setup

Install:

- Visual Studio 2022 Build Tools with Desktop development with C++;
- CMake and Ninja;
- Qt 6.5 or newer using an MSVC 2022 kit with Qt WebSockets;
- Rust stable with `rustfmt` and `clippy`;
- Node.js 22 and pnpm 11.17.0.

Use a Developer PowerShell matching the Qt MSVC kit. Example configuration:

```powershell
$env:CMAKE_PREFIX_PATH = "C:\Qt\6.8.3\msvc2022_64"
corepack enable
pnpm install --frozen-lockfile
pnpm qt:configure
pnpm qt:build
```

Do not mix a MinGW Qt kit with an MSVC-configured build directory. Delete only
the specific `build/native` directory and reconfigure when switching kits.

## Run the desktop system

Start one telemetry source:

```bash
pnpm --filter @rxos/vehicle-simulator dev
```

Or use the Rust implementation:

```bash
cargo run -p rxos-vehicle-gateway
```

Do not run both simultaneously; each binds loopback port 8787.

Build and run the Qt displays:

```bash
pnpm qt:configure
pnpm qt:build
./build/native/apps/driver-display/rxos-driver-display
./build/native/apps/cabin-display/rxos-cabin-display
```

Executable paths differ on multi-configuration generators and Windows.

Run the developer console:

```bash
pnpm --filter @rxos/developer-console dev
```

## Playback

The committed demo is entirely simulated and contains no real CAN identifiers:

```bash
cargo run -p rxos-vehicle-gateway -- \
  --playback packages/telemetry-fixtures/recordings/demo-lap.ndjson
```

The TypeScript simulator accepts the same flag and recording format. Each line
is a complete telemetry envelope. Playback restamps sequence and capture time
so freshness behaviour is identical to live simulation.

## Verification

```bash
pnpm verify:node
pnpm native:format:check
pnpm native:lint
pnpm native:test
pnpm qt:configure
pnpm qt:lint
pnpm qt:build
pnpm qt:test
```

Run the complete repository sequence with:

```bash
pnpm verify
```

`qt:test` runs:

- deterministic QML state tests;
- the complete driver display against a controlled telemetry reliability
  scenario;
- the complete cabin display against the same scenario.

The scenario proves valid data, stale data, malformed input, disconnection, and
reconnection. It uses the `offscreen` platform and software Qt Quick backend.

## CI expectations

`.github/workflows/ci.yml` runs on Ubuntu 24.04 for every push and pull request.
Node, Rust, and Qt checks are separate jobs so a failure identifies the relevant
toolchain. CI must not omit native checks merely because Node checks pass.

The required CI commands are:

```text
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
pnpm qt:configure
pnpm qt:lint
pnpm qt:build
pnpm qt:test
```

## Troubleshooting

- Port 8787 in use: stop the other simulator/gateway instance.
- Qt package not found: ensure the correct Qt kit is selected or set
  `CMAKE_PREFIX_PATH` to the Qt installation.
- `qmltestrunner` not found: install Qt Quick Test/QML tooling and ensure the Qt
  host `bin` directory is on `PATH`.
- Offscreen scene-graph failure: confirm Mesa/EGL libraries are installed, then
  try `xvfb-run` as a diagnostic fallback.
- Blank console: confirm the simulator is listening and the browser permits a
  loopback WebSocket connection.
- Stale immediately: verify the system clock and ensure the source is emitting
  at the 100 ms interval.

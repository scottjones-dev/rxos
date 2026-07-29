# Native Developer Setup

## Prerequisites

- Node.js 22
- pnpm 11.17.0 (Corepack is supported)
- Rust stable (`rustup`, `rustc`, `cargo`, `rustfmt`, `clippy`)
- CMake 3.21 or newer
- Ninja
- Qt 6.5 or newer with Quick, Quick Controls 2, WebSockets and Linguist Tools
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
  build-essential cmake ninja-build fonts-noto-core \
  libgl1-mesa-dev libegl1-mesa-dev \
    libxkbcommon-dev libxkbcommon-x11-0 xvfb
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

Display development profiles can be overridden when launching either native
binary:

```text
--width 2560 --height 720 --scale 1.0 --density 170
```

The driver display also accepts `--demo-cycle` for deterministic Daily,
Performance, and Track cycling. Run `pnpm demo` in another terminal for the
normal, high-RPM, warning, stale, disconnect, and recovery scenario.

`pnpm performance:observe` runs the host-side virtual ten-minute 60 Hz
processing and bounded-history observation. It is not a real-time benchmark.

For milestone 1.3 reliability and visual validation:

```bash
pnpm concurrent:launch
pnpm concurrent:test
pnpm localisation:validate
pnpm layout:test
pnpm visual:baseline
pnpm visual:verify
pnpm performance:native:short
pnpm verify:milestone-1.3
```

For milestone 1.4, configure a separate release tree before collecting native
performance evidence:

```bash
pnpm qt:configure:release
pnpm qt:build:release
pnpm performance:native:driver
pnpm performance:native:cabin
pnpm performance:native:concurrent
pnpm performance:native:matrix
pnpm performance:native:frame
pnpm performance:native:chart
pnpm performance:native:10m
pnpm performance:native:soak
```

Short commands run for 60–120 seconds. `performance:native:10m` genuinely runs
for ten minutes and `performance:native:soak` for thirty minutes. Do not report
either as complete without its generated artifact. `performance:native:memory`
is a focused ten-minute cabin observation.

Create a Markdown artifact or check stable invariants with:

```bash
pnpm performance:native:artifact build/performance/native-concurrent-short.json build/performance/native-concurrent-short.md
pnpm performance:native:compare build/performance/native-concurrent-short.json
pnpm performance:native:compare candidate.json baseline.json comparison.json
```

Comparison returns an explicit non-comparable result when environments differ.
The scheduled/manual `Extended native performance` GitHub workflow supplies
10, 30 and 60-minute Linux evidence. Xvfb experiments should use
`QT_QPA_PLATFORM=xcb xvfb-run ...` and must not be compared with offscreen
reports.

Baseline generation is an intentional review action: inspect the generated
gallery before committing changed images. Native tools honour
`RXOS_DRIVER_EXECUTABLE` and `RXOS_CABIN_EXECUTABLE` when a generator places
binaries outside the default paths. Local screenshots can differ from Ubuntu
CI font rasterisation and are not interchangeable with reviewed CI baselines.

Run the complete repository sequence with:

```bash
pnpm verify
```

`qt:test` runs:

- deterministic QML state tests;
- the complete driver display against a controlled telemetry reliability
  scenario;
- the complete cabin display against the same scenario.
- both displays concurrently against one dynamically allocated 60 Hz source.

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
pnpm qt:configure:release
pnpm qt:build:release
```

CI also runs 60-second driver, cabin and concurrent release observations, a
120-second chart stress observation, stable-invariant comparison and artifact
generation.

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

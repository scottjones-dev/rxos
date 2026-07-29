# Milestone 1.3: Hardware-independent validation

## Scope

Milestone 1.3 adds deterministic visual capture, localisation and presentation
formatting, layout invariants, concurrent display testing, Linux development
profiling, shared-QML packaging, content stress scenarios, review checklists,
and a static review gallery.

RXOS remains a desktop-only, simulated, read-only secondary display. It does
not connect to CAN, OBD, GPS, IMU, cameras, navigation, media providers,
mobile applications, OTA infrastructure, persistent databases, or production
hardware.

## Baseline

Commit `15502ea` passed Ubuntu 24.04 CI run `30449405022`, including frozen
Node installation, TypeScript verification, strict Rust verification, QML
lint, both native builds, behavioural tests, both reliability scenarios, and
both profile launches.

## Architecture

1. Package shared controls once as the static `Rxos.DesignSystem` QML module.
2. Add a presentation-only formatter that converts canonical metric telemetry
   to Metric, UK, or US display profiles.
3. Use Qt translation IDs and compiled development translation catalogs.
4. Add explicit deterministic display state and readiness hooks used only by
   capture, layout, concurrency, and profiling tools.
5. Capture fixed scenarios with Qt's software renderer and compare PNGs with a
   small perceptual tolerance.
6. Keep visual baselines and generated review output outside display runtime.
7. Launch simulator and both displays through one process supervisor using
   dynamically allocated loopback ports and cooperative shutdown.
8. Record Linux process observations as JSON artifacts without imposing
   unstable performance thresholds.

## Work packages

1. Shared module packaging and translation catalogs.
2. Unit conversion, locale formatting, pseudo-locales, and presentation tests.
3. Layout geometry hooks and invariant tests.
4. Deterministic scenario injection and native screenshot capture.
5. PNG comparison, diff generation, and static review gallery.
6. Concurrent launcher, independence/backpressure/reconnect test, and process
   cleanup.
7. Short and extended Linux observation tooling.
8. Content stress matrix, human-review checklists, documentation, and CI
   artifacts.

## Assumptions

- Ubuntu CI uses Qt 6.8.3, the software RHI backend, the offscreen platform,
  and an installed Noto Sans font.
- Small rasterisation differences may occur across Qt, FreeType, and runner
  images; comparison therefore permits a documented perceptual tolerance.
- Development translations exercise structure and are not professional
  translations.
- Pseudo-RTL validates mirroring and mixed content but does not substitute for
  review by native speakers or bidirectional-text experts.
- Schema version 1 remains canonical metric data. Missing-value stress is
  injected only after validation or into isolated presentation models because
  version 1 fields remain required.
- Linux hosted-runner CPU and memory observations are useful diagnostics but
  are not stable automotive performance budgets.
- Qt's offscreen software rendering is deterministic enough for development
  regression detection; screenshots still require human review.

## Risks

- Font and antialiasing updates can create benign image differences.
- Translation expansion can expose layouts that need scrolling or elision.
- Large screenshot matrices increase CI time and artifact size.
- Process sampling through `/proc` is Linux-specific development tooling.
- Static QML module linking can affect import discovery; `qmllint`, tests, and
  both complete binaries remain blocking checks.
- Test hooks could accidentally affect normal runtime. They must require
  explicit command-line flags and must never introduce a vehicle interface.

## Explicit exclusions

- Physical usability, daylight, glare, vibration, thermal, mounting, airbag,
  power-loss, and road validation.
- Automotive safety analysis, certification, production readiness, and
  real-time guarantees.
- Professional translation, voice, screen-reader certification, or completed
  human-factors validation.
- Persistent settings, hardware adapters, real services, or control paths.

## Exit criteria

- Existing CI checks remain enabled.
- Deterministic screenshot capture, comparison, gallery generation,
  localisation, formatting, layout, concurrent-runtime, and profiling tooling
  run in Ubuntu CI.
- CI uploads screenshots, diffs, gallery, and performance JSON.
- Both displays still pass stale, malformed, disconnect, and reconnect tests.
- Machine checks, visual review, physical review, and automotive validation are
  clearly distinguished.

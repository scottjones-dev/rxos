# Native performance investigation plan

## Questions

1. Does either display exhibit bounded warm-up, slow growth, a leak-like trend
   or insufficient evidence over 10 and 60 minutes?
2. How do driver, cabin and concurrent CPU observations change at 1, 10, 20,
   30 and 60 Hz?
3. What are the median, p95, p99 and maximum frame-swap intervals, and how many
   intervals exceed 16.7, 33.3, 50 and 100 ms?
4. Does the performance chart copy, retain or render more samples than needed?
5. Do hidden cabin pages or inactive driver layouts perform telemetry-driven
   presentation work?
6. Can non-safety presentation updates be cadence-limited while telemetry
   validation, warnings, freshness and connection state remain immediate?
7. Does a slow or absent display alter simulator or peer-display delivery?
8. Which results reproduce across release offscreen software, release Xvfb,
   default backend and debug variants?

## Scenario matrix

| Topology       | Primary scenario              | Rates                |
| -------------- | ----------------------------- | -------------------- |
| Simulator only | delivery baseline             | 1, 10, 20, 30, 60 Hz |
| Driver only    | Daily                         | 1, 10, 20, 30, 60 Hz |
| Driver only    | Performance                   | 1, 10, 20, 30, 60 Hz |
| Driver only    | Track                         | 1, 10, 20, 30, 60 Hz |
| Cabin only     | Home                          | 1, 10, 20, 30, 60 Hz |
| Cabin only     | Performance/chart             | 1, 10, 20, 30, 60 Hz |
| Cabin only     | page switching                | 20, 60 Hz            |
| Concurrent     | default views                 | 1, 10, 20, 30, 60 Hz |
| Concurrent     | chart plus Driver Performance | 20, 60 Hz            |

The short CI subset runs driver, cabin and concurrent release profiles for
60–120 seconds. The standard profile is ten minutes. The optional soak is
30–60 minutes and is never implied to have run unless an artifact exists.

## Metrics

### Per process

- RSS and virtual memory from `/proc/<pid>/status`
- PSS and private dirty memory from `/proc/<pid>/smaps_rollup`
- CPU from process ticks divided by elapsed wall time
- thread count from `/proc/<pid>/status`
- open file descriptors from `/proc/<pid>/fd`
- process exit and graceful-shutdown duration

### Telemetry and QML

- received, accepted and intentionally skipped/lagged envelopes
- first valid telemetry time and final sequence
- presentation publication count
- immediate warning/freshness state changes
- chart received, retained and published/rendered point counts
- hidden-work counter

### Frames

- frame-swap count
- median, p95, p99 and maximum interval
- counts above 16.7, 33.3, 50 and 100 ms
- sampling start/end and bounded retained interval count

Unsupported metrics are represented by `null` plus a reason in the report.

## Memory classification

Classification uses the latter half of a standard or soak observation after a
documented warm-up:

- **bounded warm-up**: values settle within observed noise and the fitted
  latter-half slope is not materially positive;
- **slow growth**: a repeatable positive slope exists but retained resources
  remain bounded by an understood policy;
- **leak-like**: RSS and private/PSS measures grow persistently with workload,
  without a matching bounded resource explanation;
- **insufficient evidence**: duration, metric support or host variance cannot
  justify another label.

The report includes start, peak, end, latter-half min/max and a simple
least-squares slope. Thresholds used for descriptive labels are documented in
the analysis report and are not automotive acceptance limits.

## Frame analysis

Intervals are captured in native C++ from `QQuickWindow::frameSwapped`, stored
in a fixed-size buffer and summarised on shutdown. Startup intervals are
reported separately or excluded by a declared warm-up. Offscreen and Xvfb
results are not combined.

## Chart experiments

1. Hidden page at 60 Hz: expect no retained or published chart work.
2. Visible page at 1/10/20/30/60 Hz: compare received, retained and published
   points.
3. Capacity stress: exceed history capacity and prove fixed retention.
4. Invalid/stale gap: preserve a discontinuity without interpolating it.
5. Revisit/page switch: prove no duplicate subscriptions or burst replay.
6. Render cap: prove the canvas receives a bounded number of points.

## Cadence experiment

Raw envelopes always pass through validation immediately. Transport, freshness,
warnings and reliability state observe the raw state. A presentation proxy may
publish the newest complete snapshot at a bounded cadence for ordinary numeric
bindings. Gear and warning behaviour are checked explicitly. The proxy must
never build a queue: each tick replaces its pending snapshot with the latest.

## Environment variants

Each report records commit, operating system, architecture, CPU count, build
type, Qt platform plugin, scene-graph backend, screen profile, topology,
scenario, rate, duration and executable identity. Planned variants are:

- release + offscreen + software (stable CI evidence);
- release + Xvfb/xcb + software (scheduled/manual evidence);
- release + default scene-graph backend on representative hardware;
- debug + offscreen for diagnostic comparison only.

## Comparison and blocking policy

Reports are comparable only when build type, platform, architecture, rendering
backend, screen profile, topology, scenario, rate and duration class match.
Environment mismatch returns a clear non-comparable result.

CI initially blocks on deterministic invariants:

- successful startup and shutdown;
- expected telemetry progress;
- bounded chart/history counts;
- zero hidden chart publication in hidden scenarios;
- valid report schema and required metric support on Ubuntu.

CPU, memory and frame thresholds remain observational until repeated runs
establish variance. Any later blocking budget must include evidence, tolerance
and a documented environment key.

## Native dependencies

- Ubuntu 24.04
- Node.js 22 and pnpm 11.17
- CMake, Ninja and a C++20 compiler
- Qt 6.8 with Quick, Quick Controls, WebSockets, LinguistTools, QML tooling and
  the offscreen/xcb platform plugins
- Noto fonts, Mesa software rendering and Xvfb for the Xvfb variant
- Rust stable with rustfmt and Clippy for complete repository verification
- Linux procfs with `status`, `stat`, `smaps_rollup` and `fd` access

## Known limitations

- CI is virtualised and host-sensitive.
- Software rendering does not represent final GPU acceleration.
- The runner cannot measure display luminance, touch latency, thermal
  throttling, boot-from-vehicle power or readability.
- No numerical observation is promoted to a representative-hardware claim.

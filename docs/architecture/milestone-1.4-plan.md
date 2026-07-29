# Milestone 1.4 plan: native performance and representative-display readiness

## Scope

Milestone 1.4 investigates and improves the desktop simulator's native Qt
display performance. It does not add product features or production vehicle
integration. All telemetry remains simulated, loopback-only and read-only.
Factory instrumentation remains the authoritative vehicle display.

The milestone is complete only when the existing verification suite remains
green, short native performance checks run in Linux CI, and at least one
extended native observation has genuinely run on Linux.

## Safety and product constraints

- Do not open a physical CAN or OBD-II interface.
- Do not add vehicle commands, Mazda identifiers, warning thresholds or
  inferred vehicle behaviour.
- Preserve malformed-message, stale-data, disconnect and reconnect handling.
- Telemetry validation, warning propagation and freshness evaluation remain
  immediate even when non-safety presentation work is cadence-limited.
- Measurements describe the observed host and rendering backend only. They are
  not automotive qualification evidence and are not predictions for target
  hardware.

## Current implementation risks

1. The existing native runner measures only the concurrent topology, changes
   once from 1 Hz to 60 Hz, and is too short to classify memory behaviour.
2. RSS and aggregate CPU alone cannot distinguish mapped memory from private
   growth or expose thread and file-descriptor leaks.
3. `frameSwapped` is counted but frame intervals and tail latency are not
   retained.
4. Cabin `StackLayout` children are instantiated together. Hidden pages may
   continue to evaluate telemetry-dependent bindings.
5. Every accepted telemetry snapshot changes the object consumed by display
   bindings. At 60 Hz, presentation work may exceed useful visual cadence even
   though validation and safety state must remain immediate.
6. `BoundedHistory` copies its entire array for each retained point and
   `RxChart` walks every published point for each paint.
7. Offscreen software rendering differs materially from a compositor-backed
   representative display. Debug and release builds also cannot share budgets.
8. The Windows development host does not currently provide the Qt, CMake,
   Ninja or Rust native toolchains used by Linux CI.

These are investigation hypotheses, not established root causes.

## Phases

### Phase 1: measurement foundation

- Generalise the Linux runner for 1, 10, 20, 30 and 60 Hz.
- Support simulator-only, driver-only, cabin-only and concurrent display
  topologies.
- Support short, standard and soak durations with explicit scenario and
  rendering-backend metadata.
- Sample RSS, PSS, virtual memory, private dirty memory, CPU, thread count and
  file-descriptor count where Linux exposes them.
- Capture telemetry, chart and native frame-timing counters.
- Label every unsupported metric rather than manufacturing a value.

### Phase 2: deterministic display instrumentation

- Add bounded native frame-interval collection and percentile summaries.
- Add low-cost QML counters for presentation updates, hidden work and chart
  publication.
- Exercise home/daily, performance/chart and page-switch scenarios without
  disabling the live telemetry connection.
- Add deterministic tests for the instrumentation and report aggregation.

### Phase 3: measured optimisation

- Establish a pre-change reference from milestone 1.3 artifacts and new
  scenario observations.
- Bound chart storage and rendered point counts independently.
- Prevent hidden chart publication and unnecessary invisible-page work.
- If observations support it, separate non-safety presentation cadence from
  immediate telemetry validation, freshness and warnings.
- Re-run like-for-like scenarios and record regressions as well as gains.

### Phase 4: regression policy and hardware readiness

- Add environment-aware report comparison. Incompatible environments produce
  an explicit non-comparable result.
- Block CI only on deterministic, host-stable invariants; retain host-sensitive
  CPU, memory and frame timing as review evidence until variance is known.
- Document display, compute and representative-hardware evaluation
  requirements without recommending untested hardware.

### Phase 5: automation and evidence

- Add root commands for each profile, duration, investigation and comparison.
- Build Qt in release mode in CI and run short driver, cabin and concurrent
  profiles.
- Upload machine-readable reports and human-readable summaries.
- Add a manually dispatched and scheduled extended Linux workflow.
- Run all available local verification, push the implementation, confirm the
  complete CI pipeline, then run and analyse an extended native profile.

## Completion evidence

- Existing TypeScript, Rust, QML, reliability, localisation and visual checks
  remain green.
- Release Qt binaries complete short driver, cabin and concurrent profiles.
- Frame, memory, chart and invisible-work metrics are present or explicitly
  marked unsupported.
- The comparison tool rejects misleading cross-environment comparisons.
- Cabin memory, CPU, frame timing, chart work and invisible work are classified
  from an extended Linux observation, with uncertainty stated.

## Uncertain assumptions

- GitHub-hosted Ubuntu runners expose readable `/proc/<pid>/smaps_rollup` and
  `/proc/<pid>/fd`.
- Qt's offscreen plugin emits `frameSwapped` consistently enough for
  instrumentation tests; Xvfb may be needed for compositor-like scheduling.
- A 20 or 30 Hz presentation cadence is adequate for development UI review,
  while raw telemetry state continues at source cadence.
- QML `StackLayout` visibility prevents painting but not all binding
  reevaluation.
- Host-runner noise will prevent responsible fixed CPU and RSS budgets in this
  milestone.

## Explicit limitations

- No representative 15-inch panel, final GPU, compositor, thermal envelope or
  vehicle power environment is available in CI.
- Frame-swap intervals are application observations, not panel scan-out or
  input-to-photon measurements.
- PSS and private dirty figures are Linux-specific and may be unavailable due
  to kernel permissions.
- The short CI profiles detect gross regressions; they do not establish
  long-run stability.

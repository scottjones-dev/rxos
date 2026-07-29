# Milestone 1.4 performance evidence

Milestone 1.4 replaces the milestone 1.3 eight-second observation with
scenario-aware release profiles. Reports are JSON schema version 2 and always
record topology, source rate, duration, screen profile, build type, Qt platform
and scene-graph backend.

## Evidence tiers

- **Short (60–120 seconds):** CI regression evidence for startup, telemetry
  progress, bounded chart rendering, hidden work and graceful shutdown.
- **Standard (10 minutes):** the minimum evidence used to classify an observed
  memory trend.
- **Soak (30–60 minutes):** optional investigation evidence. It is never
  implied by a short or standard result.

CPU, memory and frame timing remain host-sensitive review metrics. CI blocks
only on stable structural invariants documented in
`docs/testing/performance-regression.md`.

## Baseline

Milestone 1.3's Ubuntu offscreen/software observation recorded approximately
73 MB driver and 83 MB cabin settled RSS before a short 60 Hz phase ended near
74 MB and 194 MB respectively. Final sampled CPU was approximately 43% and
100%. The run was too short to classify either trend, and its total frame
counts were not frame-time measurements.

These observations motivate the cabin, chart and invisible-work investigations
but are not a like-for-like performance budget.

## Milestone 1.4 implementation

- Linux procfs sampling includes RSS, PSS, virtual memory, private dirty
  memory, CPU, threads and file descriptors when supported.
- Native C++ retains a fixed 36,000 frame intervals and reports median, p95,
  p99, maximum and threshold counts.
- Display numeric presentation uses the newest snapshot at no more than 30 Hz.
  Raw validation, warnings, freshness and connection state remain immediate.
- Cabin inactive pages are unloaded.
- Chart retention is capped at 600 samples and published canvas input at 240
  points. Hidden chart pages do not append.
- Environment-aware comparison refuses incompatible reports.

## Results

Populate this section only from checked-in or linked CI artifacts. A locally
unavailable native toolchain is not a pass. Final milestone reporting must name
the exact extended workflow run used for memory classification.

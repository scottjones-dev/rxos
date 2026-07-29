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

The complete Ubuntu CI run
[`30460081609`](https://github.com/scottjones-dev/rxos/actions/runs/30460081609)
passed Node, Rust, QML lint, debug/release Qt builds, native reliability,
reviewed visual baselines, short offscreen profiles, chart stress, Xvfb and
stable-invariant checks.

The manually dispatched ten-minute cabin Performance run
[`30461002292`](https://github.com/scottjones-dev/rxos/actions/runs/30461002292)
genuinely ran for 600 seconds on a four-logical-CPU Ubuntu Azure host using the
release build, offscreen Qt platform and software scene graph.

Observed cabin results:

- latter-half RSS ranged from 87,184 to 87,964 KiB and ended at 87,756 KiB;
- fitted latter-half RSS and private-dirty slopes were approximately
  99 KiB/min, producing the documented `bounded warm-up` classification;
- average CPU was 25.8% of one logical host CPU (25.4% in the latter half);
- threads settled at six and file descriptors at twelve, with no sustained
  resource-count growth visible;
- 37,040 envelopes were accepted with no lagged envelopes;
- 18,236 presentation snapshots were published and 18,804 superseded pending
  snapshots were replaced without queuing;
- the chart held 600 retained samples and 240 rendered points;
- hidden-page work was zero;
- graceful process shutdown took 52 ms.

Frame-swap observations were median 6.786 ms, p95 29.923 ms, p99 40.881 ms and
maximum 51.917 ms. Of the retained 36,000 intervals, 1,057 exceeded 33.3 ms,
two exceeded 50 ms and none exceeded 100 ms. Offscreen swap timing is bursty
and must not be interpreted as panel frame rate.

The milestone 1.3 cabin endpoint of roughly 194 MB RSS and 100% sampled CPU
motivated this work. The milestone 1.4 chart short run ended near 86 MB RSS
with about 30% average CPU, and the extended run ended near 88 MB with about
26% average CPU. This is encouraging directional evidence, but not a strict
before/after benchmark because runner duration, commit and hosted environment
differ.

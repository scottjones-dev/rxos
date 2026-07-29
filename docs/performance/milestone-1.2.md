# Milestone 1.2 performance observations

These observations are development evidence, not target-hardware results,
real-time guarantees, or automotive-grade certification.

## Deterministic host benchmark

On the Windows development host on 2026-07-29:

```text
pnpm --filter @rxos/vehicle-simulator performance:observe
36,000 validated samples (virtual ten minutes at 60 Hz)
69.89 ms host processing time
515,075.99 samples/second
600 / 600 retained chart samples
3,312 byte observed JavaScript heap delta
```

The command generates and validates all samples as fast as the host allows; it
does not claim 60 Hz scheduling precision. Heap delta is sensitive to runtime
garbage collection and should be treated as an observation only. The invariant
is the 600-sample bound.

## Native display instrumentation

Both Qt applications emit structured `startup`, `ui_ready` with `startupMs`,
and `graceful_shutdown` events. Ubuntu CI launches both complete applications
at their default logical resolutions and runs the controlled reliability
scenario offscreen.

Idle resident memory, resident memory after a wall-clock ten-minute 60 Hz run,
and rendered frame responsiveness were not measured on this Windows host
because CMake, Qt, and QML tooling are unavailable locally. They require a
representative Linux graphics stack; offscreen CI is suitable for regression
detection but not visual frame certification.

## Target-hardware measurement plan

When hardware is selected, capture cold and warm startup, proportional set size,
frame presentation percentiles, input latency, telemetry throughput, CPU/GPU
load, and thermal state for both displays concurrently. Include live, stale,
warning-overlay, and chart-heavy states.

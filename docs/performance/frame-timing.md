# Frame-timing method

Each display observes `QQuickWindow::frameSwapped` in native C++. The elapsed
time between consecutive signals is retained in a 36,000-entry circular
buffer. Shutdown logs contain:

- total frames and retained/overwritten intervals;
- median, p95, p99 and maximum interval in milliseconds;
- interval counts above 16.7, 33.3, 50 and 100 milliseconds.
- bounded counts of long frames within the next eight swaps after a UI event
  marker, including page transitions, chart refresh, mode/theme changes and
  warnings.

This instrumentation is intentionally low cost: one monotonic timer read and
one bounded vector write per swap. Sorting occurs only during shutdown.

The metric describes application frame-swap events. It does not measure panel
scan-out, touch-to-photon latency, compositor queuing or driver-display
readability. Offscreen, Xvfb and representative-hardware results must be kept
separate. CPU and frame-time values are observational until repeated
environment-matched runs establish variance.

## Milestone 1.4 observation

In extended run `30461002292`, the cabin Performance page produced 38,807 frame
swap events over approximately 602 seconds. The bounded buffer retained the
latest 36,000 intervals and reported:

- median 6.786 ms;
- p95 29.923 ms;
- p99 40.881 ms;
- maximum 51.917 ms;
- 16,427 intervals above 16.7 ms, 1,057 above 33.3 ms, two above 50 ms and none
  above 100 ms.

The mixture of short and long intervals is consistent with bursty offscreen
swap signalling, so these values establish instrumentation and a host baseline,
not smoothness on a physical display.

Milestone 1.5 adds correlation markers to investigate the milestone 1.4
distribution. They show temporal association, not causation. Shader compilation,
scene-graph synchronisation, compositor scheduling, VSync, screenshot hooks and
GPU behaviour still require external GPU/compositor evidence. Do not optimise
from CI offscreen measurements alone.

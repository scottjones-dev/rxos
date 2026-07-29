# Frame-timing method

Each display observes `QQuickWindow::frameSwapped` in native C++. The elapsed
time between consecutive signals is retained in a 36,000-entry circular
buffer. Shutdown logs contain:

- total frames and retained/overwritten intervals;
- median, p95, p99 and maximum interval in milliseconds;
- interval counts above 16.7, 33.3, 50 and 100 milliseconds.

This instrumentation is intentionally low cost: one monotonic timer read and
one bounded vector write per swap. Sorting occurs only during shutdown.

The metric describes application frame-swap events. It does not measure panel
scan-out, touch-to-photon latency, compositor queuing or driver-display
readability. Offscreen, Xvfb and representative-hardware results must be kept
separate. CPU and frame-time values are observational until repeated
environment-matched runs establish variance.

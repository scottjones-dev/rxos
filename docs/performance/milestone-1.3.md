# Milestone 1.3 performance observations

`pnpm performance:native:short` runs both displays through a 1 Hz idle phase
and a sustained 60 Hz phase for at least eight seconds.
`pnpm performance:native:extended` uses ten minutes. On Linux the tool samples
each display's resident set and process CPU ticks from `/proc`; the JSON result
records platform, rates, duration, sample times, RSS, CPU percentage, screen
profiles, rendering backend, native structured logs, and observed shutdown
time. CI uploads the result without flaky pass/fail thresholds.

Native applications emit startup and UI-ready times, telemetry acceptance
counts, last sequence, and shutdown summaries. Bounded-history QML tests prove
the 600-sample chart cap under a virtual 60 Hz ten-minute stream.

CI uses Ubuntu 24.04, Qt offscreen, the software scene graph, default
2560-by-720 driver and 1920-by-1080 cabin profiles, and Noto fonts. This backend
does not represent target GPU, CPU, memory sharing, physical refresh, input
latency, thermals, or power. Startup time, time to first valid telemetry,
message totals, lagged totals, last sequence, presented-frame count, bounded
chart count, and process uptime are captured from native structured logs.
Presented-frame count is only a coarse responsiveness observation; frame-time
percentiles and dropped render frames are not exposed reliably by the current
offscreen path.

These observations are not real-time guarantees or automotive benchmarks.
Milestone 1.2's virtual host benchmark remains documented separately.

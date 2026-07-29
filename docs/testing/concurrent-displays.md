# Concurrent displays

`pnpm concurrent:launch` starts the TypeScript simulator, waits for its
structured startup event, then launches one driver and one cabin process.
Logs are prefixed by component. SIGINT or SIGTERM cooperatively stops all three
processes; a bounded forced termination is only a cleanup fallback.

`pnpm concurrent:test` uses a dynamically allocated loopback port and a
controlled 60 Hz source. It starts clients in a deterministic order, makes the
driver accept every fourth frame, closes and reconnects the cabin client, and
requires both processes to reach independent message targets. The scenario has
a hard timeout and nonzero failures.

The simulator sends complete snapshots independently and enforces its existing
per-client buffered-byte limit. A slow or disconnected client therefore cannot
create an unbounded queue or stall another client. This is desktop reliability
evidence, not a real-time guarantee.

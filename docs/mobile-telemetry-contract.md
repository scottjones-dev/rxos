# Mobile telemetry contract

RXOS Companion consumes the existing version-one complete-snapshot envelope
from `ws://<local-host>:8787/telemetry`. It does not introduce a second
telemetry protocol or merge partial updates.

Every text message is parsed as JSON and validated by
`@rxos/vehicle-schema`. Invalid JSON, unsupported schema versions, missing
fields, and out-of-range values are rejected. Consumers independently derive:

- **Live:** the latest valid sample arrived no more than 1.5 seconds ago.
- **Stale:** a validated sample exists but is older than 1.5 seconds.
- **Lost:** the socket is disconnected or no valid sample exists.
- **Invalid:** a received sample failed contract validation.

Reconnect delay begins at 500 ms, grows exponentially, and is capped at 30
seconds. The socket and retry timers stop while the app is backgrounded. The
last valid envelope may be cached locally but is always labelled as not live.

Trips, vehicle identity, range, maintenance reminder, and route labels are
deterministic fixtures in Milestone 1.7 and are not part of the telemetry
envelope.

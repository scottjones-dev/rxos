# Telemetry and presentation cadence

`TelemetryStore` validates every received complete snapshot. It immediately
updates transport, schema, warning, stale and reliability state.

`PresentationTelemetry` holds only the newest pending snapshot and publishes
ordinary numeric display values at a maximum of 30 Hz. Replacement is
last-value-wins; there is no queue. This bounds visual binding churn at 60 Hz
without delaying validation or accumulating old samples.

Warning banners read raw telemetry warnings. Connection and freshness status
also bypass presentation cadence. Presentation counters report publications
and replaced pending values so load tests can verify the policy.

Thirty hertz is a desktop-development assumption, not a final human-factors or
representative-hardware requirement. Gear and numeric responsiveness must be
reviewed on representative hardware before production decisions.

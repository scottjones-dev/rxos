# Chart performance

The cabin performance page receives complete telemetry snapshots but retains
only downsampled RPM history. Three limits are independent:

- source acceptance remains immediate and unqueued;
- history retains at most 600 entries;
- the canvas receives at most 240 published points.

Publication occurs less often than retention, and gaps remain explicit `null`
samples. The history lives above the page loader so switching away and back
does not create duplicate subscriptions or replay a burst. Appends occur only
while the performance destination is selected.

Required stress checks cover capacity, render cap, invalid gaps, clear/reset,
hidden-page behaviour and a live 60 Hz performance scenario. This chart is a
development visualisation; no samples or thresholds represent verified Mazda
behaviour.

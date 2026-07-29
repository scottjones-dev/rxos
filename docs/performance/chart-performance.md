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

## Milestone 1.4 observation

The 120-second CI chart stress profile accepted 7,398 envelopes, reached the
600-sample retention cap and exposed exactly 240 canvas points. The ten-minute
profile again ended at 600/240, with 3,087 chart publications. No hidden-page
work was reported.

Average host CPU in the short visible-chart profile was approximately 30%; the
ten-minute profile averaged approximately 26%. The milestone 1.3 short cabin
sample ended near 100%, but this is directional rather than like-for-like
evidence.

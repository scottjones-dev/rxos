# Representative hardware test plan

## Entry criteria

- Exact display and compute candidates are identified.
- Factory instrumentation remains installed and unobstructed.
- RXOS uses only simulated loopback telemetry.
- The release build passes repository verification and short Linux profiles.

## Procedure

1. Record hardware, OS, Qt, compositor, graphics driver, power and ambient
   conditions.
2. Verify both native resolutions, scaling, fonts, focus traversal and cabin
   touch targets.
3. Run driver-only, cabin-only and concurrent profiles at every supported
   source rate.
4. Exercise Daily, Performance, Track, Home, cabin chart and page-switch
   scenarios.
5. Inject stale, malformed, disconnected and reconnected simulator states.
6. Run a ten-minute standard observation, then an approved 30–60-minute soak.
7. Repeat under day/night brightness and representative thermal conditions.
8. Review frame pacing, memory/resource trends, legibility, distraction,
   reachability and factory-instrument visibility with humans.

## Exit evidence

Retain machine-readable reports, screenshots or video where appropriate,
review notes, environment metadata and all deviations. Results qualify only
the tested configuration. They do not establish automotive certification or
authorise vehicle control.

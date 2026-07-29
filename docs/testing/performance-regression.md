# Performance regression testing

Short release profiles run on Ubuntu 24.04 for driver-only, cabin-only and
concurrent topologies. A separate cabin performance scenario stresses the
chart. JSON and Markdown evidence are uploaded on every CI outcome.

## Blocking invariants

- report schema is recognised;
- every requested display reaches structured shutdown;
- every display accepts telemetry;
- hidden-work count is zero;
- rendered chart points never exceed 240.

CPU, RSS, PSS, private dirty memory and frame percentiles are recorded but do
not block CI yet. GitHub-hosted runner variance and offscreen software
rendering make fixed limits premature.

`performance-compare` compares reports only when platform, architecture, build
type, Qt platform, rendering backend and screen profiles match. It also
requires matching topology, scenario, rate and duration. An environment
mismatch is explicitly non-comparable and never converted into a regression.

The extended workflow is scheduled and manually dispatchable for 10, 30 or 60
minutes. Only a genuinely completed artifact may support a memory
classification.

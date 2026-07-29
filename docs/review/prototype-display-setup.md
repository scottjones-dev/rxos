# Prototype display setup review

Status: **open — representative hardware required**.

Use the temporary desk frame only. Keep factory instrumentation present and do
not connect RXOS to CAN, OBD, ignition wiring, lighting circuits, or vehicle
controls.

## Session record

- Automated result: attach display-detection and assignment reports.
- Human observation: record role labels, full-screen placement, cursor policy,
  disconnect/reconnect behaviour, and compositor anomalies.
- Physical measurement: record panel width/height, bezel, safe zones, connector
  labels, resolution, refresh rate, scale, and temporary mounting position.
- Reviewer decision: accept, accept with limits, or reject.
- Open issue: list mismatches and owners.
- Retest requirement: required after profile, cable, GPU driver, compositor, or
  mounting changes.

Wayland is preferred for representative testing; X11 is supported for desktop
development and Xvfb is CI-only. Record the session type and compositor. Never
compare offscreen, Xvfb, and GPU-backed results without naming each environment.

# Concurrent dual-display session

Status: **open — GPU-backed hardware run required**.

- Automated result: attach environment, assignment, boot, frame, CPU/RSS/PSS,
  GPU metrics where available, telemetry acceptance/lag, and shutdown reports.
- Human observation: note stutter, swaps, blanking, compositor effects, cursor
  placement, and independence during disconnect/reconnect.
- Physical measurement: both resolutions, refresh rates, scale, cable path, and
  display dimensions.
- Reviewer decision: accept topology, constrain it, or reject.
- Open issue: identify environment-specific frame spikes and missing GPU data.
- Retest requirement: required after GPU, driver, kernel, Qt, compositor,
  display, cable, or performance-sensitive UI changes.

Compare CI offscreen, CI Xvfb, individual GPU-backed displays, and concurrent
GPU-backed operation as separate environments.

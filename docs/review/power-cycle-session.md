# Simulated power-cycle session

Status: **open — bench process review required; no ignition connection**.

- Automated result: attach simulated state transitions, process readiness,
  shutdown logs, orphan-process check, and interrupted-restart result.
- Human observation: confirm intentional shutdown differs visibly from telemetry
  loss and boot animation never delays usable driver information.
- Physical measurement: process start, window visible, QML ready, first valid
  telemetry, driver essential UI, cabin shell, cabin full application, and
  shutdown times.
- Reviewer decision: accept, adjust ordering/timeouts, or reject.
- Open issue: record orphan processes, partial startup, missing state, or corrupt
  output.
- Retest requirement: required after launcher, startup, shutdown, storage, Qt,
  compositor, or hardware changes.

Forced power loss is process simulation only. Do not wire RXOS to vehicle
ignition in this milestone.

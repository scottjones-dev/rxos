# Milestone 1.5 plan: representative dual-display qualification

## Status and scope

Milestone 1.5 adds software and review tooling for a desk-based or temporary
dual-display Linux prototype. It does not connect RXOS to a vehicle and does
not add product applications.

RXOS remains simulated, read-only, secondary to factory instrumentation and
unable to control vehicle systems. Physical CAN, OBD-II, ignition, lighting and
vehicle input interfaces remain prohibited.

The software portion can be completed in CI. The milestone itself remains
**awaiting representative-hardware validation** until GPU-backed compositor,
physical-display, touch, visibility, brightness and human reviews have
genuinely run.

## Architecture

1. A versioned prototype profile describes candidate display geometries,
   physical measurements, safe areas and role-selection policy.
2. A pure TypeScript display-assignment model chooses driver and cabin outputs
   by explicit identifier, EDID-derived identifier, connector and resolution,
   in that order. Ambiguous or missing roles fail safely.
3. A native Qt startup adapter applies the launcher's explicit screen index,
   geometry, full-screen/windowed and cursor policy. Applications never choose
   arbitrary screens in prototype mode.
4. Development-only QML models provide physical-review geometry, occlusion,
   brightness simulation, rotary actions and power-state sequencing.
5. A TypeScript prototype supervisor detects displays, validates assignments,
   starts the loopback simulator and both displays, observes readiness, captures
   prefixed structured logs and shuts down cooperatively.
6. A diagnostic-bundle writer includes only allow-listed environment,
   configuration, application and screenshot evidence.
7. GPU-backed performance uses the milestone 1.4 runner plus recorded graphics,
   display-server and monitor metadata. Cross-environment comparison remains
   prohibited.

## Phases

### Phase 1: configuration and deterministic selection

- Add development-desktop and prototype-computer profiles.
- Add required driver and cabin candidate geometries.
- Validate physical size, density, bezel, safe zones and optional occlusion.
- Detect Linux displays through a replaceable command adapter.
- Implement explicit safe role selection and tests for missing, ambiguous,
  fallback and hot-plug snapshots.

### Phase 2: native placement and lifecycle

- Add explicit screen-index and screen-identifier arguments.
- Apply borderless full-screen placement and per-role cursor policy.
- Preserve an explicit developer windowed mode.
- Log detected screens, selected role and reason.
- Fail prototype startup when the assigned screen is absent unless an explicit
  development fallback is enabled.
- Add boot-readiness markers and event markers used by frame correlation.

### Phase 3: review and interaction models

- Add millimetre-to-pixel, safe-area and exclusion-overlay calculations.
- Add driver steering-wheel occlusion and critical-region visibility checks.
- Add touch-session event validation and report generation.
- Add rotary actions with focus isolation.
- Add simulated brightness/ambient hysteresis.
- Add a simulated power-state transition model and recovery scenarios.

### Phase 4: launcher, diagnostics and CI

- Replace the development-only dual launcher with a supported prototype
  supervisor while keeping legacy commands working.
- Add development, full-screen, physical-review and performance modes.
- Produce environment, boot, display, log, screenshot and support artifacts.
- Exercise multiple virtual monitor inventories and all pure models in CI.
- Preserve every milestone 1.4 check.

### Phase 5: representative hardware

- Enter measured display dimensions and mounting geometry.
- Run both displays under a real Wayland or X11 compositor with GPU rendering.
- Complete driver visibility, cabin touch, day, night, dual-display and power
  review sessions.
- Record GPU, driver, compositor, refresh, CPU, memory and frame evidence.
- Keep all unperformed checks explicitly open.

## Assumptions

- Linux screen detection can provide connector and resolution through
  compositor-specific tools, but EDID access and physical dimensions may be
  absent or permission-restricted.
- Qt exposes the same monitor inventory to both applications and the launcher.
- A connector name is more stable than a screen index, while a configuration
  override remains necessary for docks and adapters.
- Wayland compositors may restrict programmatic positioning. The launcher must
  report this rather than claiming placement.
- Software brightness simulation can validate presentation logic but cannot
  validate panel luminance.
- Keyboard events can exercise the rotary abstraction without representing a
  production input device.
- Representative hardware is not available in hosted CI or on the current
  Windows development host.

## Risks

- EDID serials may be missing, duplicated or unstable through adapters.
- Wayland window-placement policy may require compositor-specific deployment
  configuration.
- Reported physical dimensions can be incorrect; manual measurement remains
  authoritative for review overlays.
- Overlay calculations can aid review but cannot prove driver visibility,
  airbag clearance, touch reach or safe mounting.
- GPU counters vary by vendor and may require privileged tools. Unsupported
  metrics must be explicit.
- Boot timing from a desktop process does not represent power-on-to-display
  time on a final system.

## Explicit exclusions

- SocketCAN, OBD, real Mazda data, vehicle control and ignition wiring.
- SQLite, GPS, IMU, cameras, routing, media, OTA, mobile and AI functionality.
- Permanent vehicle mounting, vehicle lighting or backlight control.
- Automotive certification, production readiness, road safety validation and
  hard real-time claims.

## Completion gates

The software gate requires green Ubuntu CI, deterministic role assignment,
native placement tests, model tests, launcher recovery and diagnostic
redaction. The hardware gate requires recorded representative computer,
displays, GPU/compositor, measurements and human reviews.

If the software gate passes without hardware evidence, report:
**“Milestone 1.5 software tooling complete; representative-hardware validation
awaiting.”**

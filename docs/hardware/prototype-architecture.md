# Prototype architecture

## Boundary

The milestone 1.5 prototype is a bench or temporary-frame system. It uses one
Linux computer, two independent physical display outputs and loopback simulated
telemetry. It must not be wired to CAN, OBD-II, ignition, lighting, airbags or
any vehicle-control circuit.

```text
simulated power ─┐
simulated input ─┼── prototype launcher ── loopback simulator
profile file ────┘          │
                            ├── driver Qt process ── assigned output A
                            └── cabin Qt process  ── assigned output B + USB touch
```

## Supported host profiles

### Development desktop

- Existing Linux desktop compositor
- Two external displays or a virtual inventory
- Keyboard and mouse
- Windowed operation by default
- Explicit fallback may be enabled for development only

### Prototype dual-display computer

- One Linux computer with two independent outputs
- GPU-backed Qt Quick under Wayland or X11
- Driver display is non-touch and hides the cursor
- Cabin display may use capacitive USB touch
- Keyboard or simulated rotary input is optional
- Ignition and ambient light are simulations
- Full-screen assignment is strict and has no implicit fallback

## Display assignment

Profiles give each role ordered selectors:

1. command-line identifier override;
2. configuration identifier;
3. EDID-derived identifier;
4. connector name;
5. exact resolution fallback when unique.

The driver and cabin roles must resolve to distinct detected displays.
Ambiguity, a missing strict role or both roles resolving to one output is a
startup error. A development fallback is allowed only with an explicit flag and
must be logged as such.

Every assignment report includes all detected screens, connector, identifier,
geometry, refresh, density when available, selected role and reason.

## Window policy

- Prototype full-screen mode uses the launcher's explicit screen selection.
- Driver is borderless, full-screen and cursor-hidden.
- Cabin is borderless, full-screen and cursor-capable for touch review.
- Development mode remains windowed.
- X11 positioning is applied to the assigned screen geometry.
- Wayland placement is compositor-controlled; use compositor output rules when
  direct placement is unavailable and retain launcher validation.
- Xvfb is a CI simulation and never GPU evidence.

Display loss is logged. The launcher keeps the unaffected process isolated,
waits for a bounded recovery interval when configured, and otherwise shuts the
prototype down cooperatively. It does not silently move the driver UI.

## Physical review

Profile measurements are millimetres mapped to pixels using the configured
physical display size. Overlays are opt-in and development-only:

- safe area and bezel;
- steering wheel and driver sightline;
- dashboard edge;
- touch reach;
- airbag, hazard switch, demister and factory-control exclusions.

The geometry model produces review evidence, not a clearance or visibility
certification.

## Input isolation

The driver process exposes no interactive actions. Cabin rotary actions map to
clockwise, anticlockwise, press, back, home, optional menu and favourite.
Adapters are keyboard and simulator-only. A future Linux input-device adapter
is an interface boundary, not an implemented device reader.

## Power and brightness

Power states and ambient light are deterministic simulator models. They do not
read GPIO or control panel backlights. An eventual software-backlight adapter
requires an explicit prototype-only configuration and safe no-op fallback.

## Diagnostics and privacy

Bundles are generated from an allow-list. They contain RXOS version, selected
configuration, environment/display metadata, recent RXOS logs, performance
summary, screenshots and the safety statement. They exclude environment
secrets, authentication tokens, personal files and unrelated system logs.

## Session support

- **Wayland:** preferred for representative desktop testing; compositor output
  placement rules may be required.
- **X11/Xorg:** explicit geometry placement is supported for prototype testing.
- **Xvfb:** supported for virtual CI placement and assignment checks only.

No production compositor decision is made in this milestone.

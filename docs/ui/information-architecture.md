# Information architecture

## Driver display

The driver shell is persistent and non-touch. Connection quality, active
warnings, mode, speed, RPM, and gear occupy stable regions. Keyboard shortcuts
are development aids:

- `1`: Daily
- `2`: Performance
- `3`: Track

Daily prioritises general instrumentation and a navigation placeholder.
Performance expands powertrain telemetry. Track prioritises RPM, shift
presentation, and telemetry while marking lap, previous lap, best lap, and
delta as unavailable until a real approved source exists.

When data is stale, malformed, or disconnected, the shell replaces unreliable
live values with unavailable presentation and explains the state. It does not
present frozen values as current.

## Cabin display

The cabin shell has a persistent top status area, main application region,
bottom application dock, home action, back action, and overlay layer.

The top-level applications are:

1. Home
2. Navigation placeholder
3. Media placeholder
4. Vehicle
5. Performance
6. Diagnostics
7. Settings

Home contains configurable summary widgets. Vehicle groups Engine, Fuel,
Electrical, Tyres, Doors, Lighting, and Maintenance, with unavailable future
inputs distinguished from simulated telemetry. Diagnostics is read-only and
contains no clear-code, write, or ECU command action.

## Navigation behaviour

Top-level app changes update a bounded in-memory history. Back returns to the
previous top-level app; if no history remains it returns Home. Escape invokes
Back. Home always clears history. Tab/Shift+Tab and arrow keys provide visible
focus traversal compatible with desktop and future rotary-style navigation.

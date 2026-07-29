# Display specification

## Logical development profiles

| Profile | Default logical size | Input                                       | Primary role                                          |
| ------- | -------------------: | ------------------------------------------- | ----------------------------------------------------- |
| Driver  |             2560×720 | Non-touch; keyboard in development          | Speed, RPM, gear, warnings, concise navigation prompt |
| Cabin   |            1920×1080 | Capacitive touch; keyboard/rotary emulation | Applications, detail, configuration, telemetry        |

These are configurable simulator profiles. Width, height, nominal pixel
density, and UI scale can be overridden at launch. Layouts use logical pixels,
safe margins, and a profile scale rather than assuming a specific physical
panel.

## Layout rules

- Driver content remains inside a 48 px base safe margin and keeps speed, RPM,
  gear, warning state, and data quality continuously visible.
- Cabin content uses a persistent 96 px top status region, 132 px application
  dock, content safe margins, and an overlay layer.
- The cabin minimum touch target is 56×56 logical px at scale 1.0.
- Text and controls scale together; supported development checks cover 0.8,
  1.0, and 1.25 scale factors.
- Long content must clip, elide, scroll, or reflow; it must not overlap safety
  state.

## Configuration

Development launch options are:

```text
--width <logical pixels>
--height <logical pixels>
--scale <factor>
--density <pixels per inch>
```

Invalid or unsafe command-line values fall back to profile defaults. A future
deployment configuration adapter may supply the same four values without
changing page layout code.

Milestone 1.3 also supports development-only `--locale`, `--units`,
`--telemetry-endpoint`, `--visual-scenario`, and `--capture` options. Supported
scale stress points are 0.8, 1.0, and 1.25. Shared layout predicates check safe
bounds, warning separation, focus order, scrolling, and the scaled 56-by-56
touch minimum. See `docs/testing/layout-invariants.md`.

## Human review

Daylight readability, night glare, colour accuracy, viewing angle, touch
accuracy, driver reach, steering-wheel occlusion, and physical typography size
require evaluation on selected hardware and in a stationary vehicle mock-up.

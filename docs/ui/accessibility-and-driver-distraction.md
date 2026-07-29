# Accessibility and driver distraction

## Baseline

- High text/background contrast in day and night themes.
- Important state is never communicated only by colour.
- Cabin controls use at least 56×56 logical px touch targets.
- Focused controls show a visible focus ring.
- All cabin top-level applications are reachable by touch, keyboard, and
  rotary-style focus traversal.
- Driver display has no touch interaction.
- Reduced-motion mode resolves transitions to immediate changes.
- No looping decorative animation is used.

## Driving-state restraint

While simulated speed is above zero, transitions are immediate or fast and do
not animate large page motion. Warnings are never delayed by animation. Core
driver information is not hidden behind menus. Cabin placeholders do not imply
that routing, media, vehicle control, or camera functions exist.

## Degraded telemetry

Stale and disconnected states remain high contrast and persistent. Unreliable
values render as unavailable rather than current. Malformed samples are
rejected without crashing or replacing the last valid sample. Factory
instruments remain required and authoritative.

## Review still required

Font legibility, colour perception, glare, motion comfort, touch reach, focus
order, screen-reader strategy, localisation expansion, and distraction require
human review on representative hardware. This milestone is not an accessibility
or automotive human-factors certification.

Milestone 1.3 adds expanded and RTL pseudo-locales, explicit layout-invariant
tests, and formal driver, cabin, warning, accessibility, localisation, and
physical-prototype checklists. Automation detects structural regressions; it
does not validate cognition, distraction, reach, readability, or mounting.

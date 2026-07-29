# ADR-003: Typography-led presentation language

- Status: Accepted for milestone 1.6
- Date: 2026-07-29

## Context

The milestone-one UI proved data flow and failure handling but relies on dense
card grids, outlined controls, and gauge-like engineering presentation. It does
not provide the intended premium, calm operating-system experience.

## Decision

Adopt a shared typography-led presentation language implemented in the static
`Rxos.DesignSystem` QML module:

- near-black and graphite foundations with one configurable accent;
- semantic colour reserved for navigation, media, success, caution, and
  critical information;
- large display numerals, compact labels, and generous negative space;
- borderless or hairline floating surfaces with restrained elevation;
- geometric, repository-owned text glyph icons rather than copied assets;
- bounded fades, scale changes, and eased spring-like motion;
- a common cabin shell and three intentionally distinct driver compositions.

Qt compositor-dependent blur is not required. Translucency and layered colour
must degrade predictably under software rendering and CI.

## Safety constraints

The presentation may not hide freshness, disconnection, invalid-data, factory
authority, or simulated-warning meaning. Driver interaction remains disabled.
Critical warnings are not dismissed through the new navigation system.
Unavailable services remain honest placeholders.

## Consequences

- Existing component APIs retain compatibility where practical, but their
  rendering changes substantially.
- Visual baselines are intentionally replaced after review.
- Tests continue to target state and safety invariants rather than pixel layout
  alone.
- Physical legibility, glare, touch reach, distraction, and motion comfort
  remain representative-hardware review items.

# RXOS design system

## Character

RXOS is quiet, direct, and confident. Typography carries hierarchy. Surfaces
organise content without turning the display into a wall of widgets. Colour is
rare and meaningful.

## Foundations

- Background: near-black at night and warm off-white by day.
- Surfaces: graphite layers with subtle translucency.
- Text: off-white primary, cool grey secondary, muted tertiary.
- Accent: one configurable system accent.
- Semantic accents: navigation blue, media violet, success green, warning
  amber, critical red, and performance red.

## Type scale

| Role       | Purpose                                |
| ---------- | -------------------------------------- |
| Micro      | metadata and simulation qualifications |
| Label      | uppercase context labels               |
| Body       | supporting copy and controls           |
| Heading    | page and card titles                   |
| Hero       | speed, gear, artwork title             |
| Instrument | dominant driver numerals               |

Numbers and units are separate elements. Use “52” with “mph” beneath or beside
it, never a dense “Speed 52 MPH” label.

## Layout

The base spacing unit is 4 logical pixels. Compositions use 8, 12, 16, 24, 32,
48, 64, and 96 steps. Driver critical content stays within the configured safe
area. Cabin controls keep the scaled 56×56 minimum.

## Shape and depth

Small, medium, large, and panel radii are shared tokens. Most surfaces have no
outline. Hairlines are reserved for separation and high-contrast mode.
Elevation uses restrained shadow/overlay roles, not glossy gradients or
skeuomorphic material.

## Motion

- Micro: 90 ms for pressed/focus feedback.
- Fast: 140 ms for state fades.
- Standard: 220 ms for page/content transitions.
- Settle: 360 ms for spring-like scale/depth settling.

Motion is non-looping. Reduced motion resolves durations to zero. Warnings,
stale data, and disconnection appear immediately.

## Icons

The initial icon set uses simple repository-owned geometric/text glyphs with
consistent optical size. No manufacturer or third-party assets are included.
Icons support text; they do not replace safety labels.

## Components

Buttons, cards, list rows, navigation destinations, alerts, sheets, inputs,
toggles, sliders, status pills, and tooltips share tokens, focus behaviour, and
motion. Pages should compose these primitives rather than introduce arbitrary
colours, radii, spacing, or animation timings.

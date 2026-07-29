# Milestone 1.6 plan — complete presentation redesign

## Boundary

Milestone 1.6 replaces the visual and interaction language of the driver and
cabin displays. It does not change telemetry models, WebSocket IPC, simulator
behaviour, provider abstractions, warning rules, freshness policy, or vehicle
safety boundaries.

RXOS remains simulated, read-only, secondary to factory instrumentation, and
disconnected from physical CAN and OBD interfaces. Climate, cameras,
navigation, media, service history, and maintenance remain visibly unavailable
placeholders; this redesign does not implement their providers or controls.

## Design objective

Create a calm, typography-led automotive operating-system language with:

- near-monochrome foundations and colour used only for meaning;
- generous spacing, large numeric hierarchy, and minimal chrome;
- quiet floating surfaces with restrained translucency and depth;
- rounded, touch-safe controls and visible keyboard/rotary focus;
- short fade, scale, and eased motion that disappears in reduced-motion mode;
- persistent, high-contrast freshness and simulated-warning states.

No third-party product assets, layouts, icons, or trade dress will be copied.

## Phases

1. Define colour, typography, spacing, radius, elevation, icon, and motion
   tokens while retaining compatibility aliases needed by existing consumers.
2. Rebuild shared cards, buttons, navigation, metrics, alerts, empty states,
   lists, controls, sheets, and supporting primitives.
3. Replace driver Daily/Performance naming and presentation with intentionally
   distinct Road, Sport, and Track compositions. Legacy scenario aliases remain
   accepted by deterministic tests.
4. Replace the cabin shell with a low-chrome side dock, contextual top bar, and
   spacious content canvas. Add presentation-only pages for the requested
   information architecture; unavailable services stay explicit.
5. Add a single resizable Qt desktop-preview executable that composes scaled
   driver and cabin previews beside development controls, without becoming a
   telemetry source.
6. Update deterministic scenarios, QML tests, visual screenshots, review
   documentation, and developer commands.
7. Run local checks, then Ubuntu Qt/QML, reliability, visual, Rust, and Node
   verification. Physical readability and distraction review remain open.

## Uncertain assumptions

- Noto Sans is the available cross-platform development typeface; final
  typeface licensing, hinting, and physical legibility are unresolved.
- Qt Quick opacity and layered surfaces can express depth consistently without
  depending on compositor blur. True background blur is intentionally avoided
  until representative GPU behaviour is measured.
- The desktop preview can embed faithful presentation replicas while the two
  production display processes remain the authoritative reliability targets.
- Requested Climate, Cameras, Service, Navigation, and Media screens are
  navigation destinations only. Their controls must not imply working vehicle
  or provider integration.
- Motion timing is a design hypothesis until reviewed on representative
  displays. Warnings and data loss bypass decorative delay.

## Risks and mitigations

- **Reduced safety-state salience:** stale, disconnected, invalid, and warning
  states retain persistent text, iconography, and semantic colour.
- **Decorative work affecting performance:** animations are bounded,
  non-looping, disabled by reduced motion, and exercised by existing profiles.
- **Touch density regression:** cabin controls retain the scaled 56×56 minimum
  and visible focus.
- **Visual-only feature implication:** every unavailable service is labelled as
  a placeholder or unavailable source.
- **Baseline churn hiding defects:** new baselines are reviewed as a complete
  intentional redesign and retain scenario/invariant coverage.

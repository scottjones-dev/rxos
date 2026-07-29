# Display tokens

`RxTokens.qml` is the executable source of truth. It resolves day and night
themes, optional high contrast, display scale, and reduced motion.

## Roles

- Background, surface, raised surface, and border
- Primary, secondary, and unavailable text
- Accent and positive state
- Information, Advisory, Caution, and Critical severity
- Caption, body, title, and display typography
- 4–48 px base spacing, small/medium/large radii, icon sizes
- 56×56 px minimum cabin touch target at scale 1.0
- 48 px base screen-safe margin
- Immediate (0 ms), fast (100 ms), standard (180 ms), and deliberate (280 ms)
  motion

Reduced motion resolves every transition duration to zero. Red is reserved for
Critical presentation. Important state always includes text or an icon as well
as colour.

Applications pass a shared `RxTokens` instance into controls. Page-local
arbitrary colour, spacing, radius, motion, and touch sizing should not be added
when an existing role applies.

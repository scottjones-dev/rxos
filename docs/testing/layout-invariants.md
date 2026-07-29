# Layout invariants

The shared `LayoutInvariantModel` exposes deterministic geometry predicates for
safe bounds, overlap, scaled 56 by 56 touch targets, complete focus order,
scroll reachability, and warning accessibility. QML tests exercise those
predicates alongside real shared tokens, focus navigation, bounded histories,
formatting, telemetry extremes, and display profile sizes.

Warning checks require a non-overlapping critical region plus title, message,
and icon. This prevents colour-only warning distinction. Screenshot scenarios
then exercise complete compositions for clipping, z-order, persistent chrome,
dialogs, and content expansion.

Geometry tests cannot prove glyph legibility, semantic focus quality, physical
touch reach, steering-wheel visibility, or glare. Those remain checklist items
for human and representative-hardware review.

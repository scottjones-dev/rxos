# Localisation

Milestone 1.3 uses Qt Linguist catalogs embedded in the shared
`Rxos.DesignSystem` module. English (United Kingdom) is the source language.
German, French, and Spanish catalogs are development translations, not
professional translations. `en-XA` expands and accents text; `ar-XB` supplies
delimited right-to-left stress text and mirrors layouts.

Presentation text uses stable `rxos.*` translation IDs. Telemetry property
names, schema fields, structured-log keys, warning IDs, and diagnostics IDs are
machine contracts and are never translated. The locale affects rendering only;
it cannot alter validation or warning state.

Run `pnpm localisation:validate` to prove all six catalogs have the same IDs,
contain no unfinished entries, and retain pseudo-locale delimiters. Screenshot
scenarios cover both pseudo-locales on both displays. Development translations
must be reviewed by professional translators before any production claim.

Critical speed, RPM, gear, freshness, and factory-instrument guidance remain
outside expanding navigation columns. RTL is a layout stress mode; bidi,
font-fallback, and terminology still require human review.

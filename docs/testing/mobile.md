# Mobile testing

Mobile-only verification runs independently from Qt:

```text
pnpm mobile:lint
pnpm mobile:typecheck
pnpm mobile:test
pnpm --filter @rxos/mobile build
```

Unit coverage includes contract parsing, unsupported versions, invalid JSON,
fresh/stale/lost transitions, bounded reconnect delay, local-only pairing
payloads, en-GB date and unit formatting, settings persistence, dashboard mode,
warning priority, touch-target tokens, and deterministic trips.

The Expo web export is a fixture-mode smoke test. Human review remains required
for screen-reader behaviour, large dynamic type, compact and landscape phones,
iOS safe areas, Android gesture navigation, and the NativeWind v5 preview on
representative devices. Visual baselines must not be regenerated solely to
hide a mismatch.

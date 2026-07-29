# Visual regression

`pnpm visual:baseline` captures reviewed baselines. `pnpm visual:capture`
captures current images, `pnpm visual:compare` produces pixel-difference
images, and `pnpm visual:gallery` generates a static review gallery.
`pnpm visual:verify` runs the current capture, comparison, and gallery steps.

Capture uses fixed telemetry, timestamp, sequence, software Qt Quick rendering,
the offscreen platform, reduced motion, and Ubuntu Noto fonts. QML exposes a
`visualReady` state; native capture waits for that state and a rendered frame,
not a fixed screenshot delay. No telemetry server or network is required.

Comparison uses a per-pixel perceptual threshold of 0.1 and permits at most
0.2% changed pixels by default. Override only for investigation with
`RXOS_VISUAL_MAX_DIFFERENCE`; do not raise it to conceal a regression.
Antialiasing and font rasterisation can vary across operating systems, so
committed baselines are authoritative only for the pinned Ubuntu CI image.

The matrix covers every driver layout and cabin application plus freshness,
warning, theme, contrast, motion, scale, units, and pseudo-locales. Screenshot
comparison complements behavioural and invariant tests. A green comparison is
not approval of readability or safety.

# Units and formatting

Canonical telemetry remains metric and is never mutated. The shared
`PresentationFormatter` converts only at the presentation boundary.

| Value       | Metric    | UK        | US        | Precision |
| ----------- | --------- | --------- | --------- | --------- |
| Speed       | km/h      | mph       | mph       | 0         |
| Distance    | km        | mi        | mi        | 1         |
| Temperature | degrees C | degrees C | degrees F | 0         |
| Pressure    | kPa       | psi       | psi       | 0         |
| Voltage     | V         | V         | V         | 1         |
| Fuel        | percent   | percent   | percent   | 0         |

Conversions are `mi = km × 0.621371192`, `mph = km/h × 0.621371192`,
`F = C × 9/5 + 32`, and `psi = kPa × 0.145037738`. Qt locale formatting owns
decimal separators. Durations use `hh:mm:ss` when an hour is present and
`mm:ss` otherwise. Missing or invalid values render an em dash; explicitly
stale values render `STALE`; simulated labels retain a visible simulated
qualifier. Gear values outside the contract render as missing.

Automated tests cover conversion profiles, rounding, zero, large values,
negative temperature, null values, stale values, duration, and a German decimal
separator. These are presentation rules, not Mazda specifications.

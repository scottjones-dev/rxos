# RXOS design system

This package contains the shared QML visual, interaction, telemetry, profile,
warning-presentation, navigation, and bounded-history foundation used by both
displays. Application-specific layouts remain in their Qt applications.

All `Rx*` controls accept a shared `RxTokens` object. `TelemetryState` remains
the sole display trust-boundary parser. `WarningModel` is presentation-only and
must not acquire vehicle thresholds or claim factory warning authority.

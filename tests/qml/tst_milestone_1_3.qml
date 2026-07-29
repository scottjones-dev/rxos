import QtQuick
import QtTest
import "../../packages/design-system/qml" as Design

TestCase {
    name: "MilestoneOneThree"

    function create(component, properties) {
        const object = component.createObject(this, properties || {})
        verify(object)
        return object
    }

    function test_metric_uk_and_us_formatting() {
        const formatter = create(formatterComponent)
        formatter.unitsProfile = "metric"
        verify(formatter.speed(100).includes("km/h"))
        verify(formatter.temperature(20).includes("°C"))
        verify(formatter.pressure(100).includes("kPa"))

        formatter.unitsProfile = "uk"
        verify(formatter.speed(100).includes("mph"))
        verify(formatter.temperature(20).includes("°C"))
        verify(formatter.pressure(100).includes("psi"))

        formatter.unitsProfile = "us"
        verify(formatter.temperature(20).includes("°F"))
        verify(formatter.temperature(-40).includes("-40"))
        verify(formatter.distance(0).startsWith("0"))
        verify(formatter.speed(350).includes("217"))
        compare(formatter.gear("EXTREMELY-LONG-GEAR"), formatter.missingText)
        compare(formatter.duration(3661), "01:01:01")
        compare(formatter.speed(null), formatter.missingText)
        compare(formatter.speed(100, "stale"), formatter.staleText)
        formatter.destroy()
    }

    function test_locale_decimal_separator() {
        const formatter = create(formatterComponent, { localeName: "de-DE" })
        verify(formatter.numeric(12.5, 1).includes(","))
        formatter.destroy()
    }

    function test_safe_bounds_and_warning_priority() {
        const layout = create(layoutComponent)
        const bounds = { x: 0, y: 0, width: 1920, height: 1080 }
        const critical = { x: 40, y: 140, width: 1200, height: 760 }
        const warning = { x: 40, y: 20, width: 1840, height: 96 }
        verify(layout.within(critical, bounds))
        verify(layout.within(warning, bounds))
        verify(layout.warningIsAccessible(
            warning, critical, "Telemetry unavailable",
            "Retain the factory instruments", true))
    }

    function test_touch_focus_and_scroll_invariants() {
        const layout = create(layoutComponent)
        verify(layout.touchTargetIsValid(70, 70, 1.25))
        verify(!layout.touchTargetIsValid(69, 70, 1.25))
        verify(layout.focusOrderIsComplete([0, 1, 2, 3], 4))
        verify(!layout.focusOrderIsComplete([0, 1, 1, 3], 4))
        verify(layout.scrollContentIsReachable(1400, 900, true))
        verify(!layout.scrollContentIsReachable(1400, 900, false))
        layout.destroy()
    }

    function test_content_stress_sequence_is_deterministic() {
        const state = create(telemetryComponent)
        const rates = [1, 10, 20, 60]
        for (let rateIndex = 0; rateIndex < rates.length; rateIndex += 1) {
            for (let sequence = 0; sequence < rates[rateIndex]; sequence += 1) {
                const envelope = JSON.stringify({
                    schemaVersion: 1,
                    sequence,
                    capturedAt: "2026-01-02T12:34:56.000Z",
                    source: "simulation",
                    telemetry: {
                        rpm: sequence % 2 === 0 ? 0 : 12000,
                        speedKph: sequence % 2 === 0 ? 0 : 350,
                        gear: sequence % 2 === 0 ? "N" : "6",
                        throttlePercent: 100,
                        coolantTempC: 180,
                        oilTempC: 200,
                        oilPressureKpa: 1500,
                        fuelPercent: 0,
                        batteryVoltage: 20,
                        warnings: {
                            checkEngine: true,
                            coolantTemperature: true,
                            lowFuel: true,
                            lowOilPressure: true
                        }
                    }
                })
                verify(state.accept(envelope))
            }
        }
        compare(state.acceptedMessages, 91)
        compare(state.lastSequence, 59)
        state.destroy()
    }

    function test_rapid_changes_and_malformed_frame_recovery() {
        const modes = create(modeComponent)
        const settings = create(settingsComponent)
        for (let index = 0; index < 120; index += 1) {
            verify(modes.select(["Daily", "Performance", "Track"][index % 3]))
            settings.themeSelection = index % 2 === 0 ? "day" : "night"
            settings.highContrast = index % 4 === 0
        }
        compare(modes.mode, "Track")
        compare(settings.themeSelection, "night")

        const state = create(telemetryComponent)
        verify(!state.accept("{malformed"))
        compare(state.invalidMessages, 1)
        const valid = JSON.stringify({
            schemaVersion: 1,
            sequence: 999999999,
            capturedAt: "2026-01-02T23:59:59.999Z",
            source: "simulation",
            telemetry: {
                rpm: 12000, speedKph: 350, gear: "6", throttlePercent: 100,
                coolantTempC: 180, oilTempC: 200, oilPressureKpa: 0,
                fuelPercent: 0, batteryVoltage: 20,
                warnings: {
                    checkEngine: true, coolantTemperature: true,
                    lowFuel: true, lowOilPressure: true
                }
            }
        })
        verify(state.accept(valid))
        compare(state.lastSequence, 999999999)
        modes.destroy()
        settings.destroy()
        state.destroy()
    }

    function test_long_duration_and_midnight_formatting() {
        const formatter = create(formatterComponent, { localeName: "en-GB" })
        compare(formatter.duration(359999), "99:59:59")
        verify(formatter.time(Date.parse("2026-01-02T23:59:59.999Z")).length > 0)
        verify(formatter.date(Date.parse("2026-01-03T00:00:00.000Z")).length > 0)
        compare(formatter.pressure(undefined), formatter.missingText)
        formatter.destroy()
    }

    Component { id: formatterComponent; Design.PresentationFormatter {} }
    Component { id: layoutComponent; Design.LayoutInvariantModel {} }
    Component { id: telemetryComponent; Design.TelemetryState {} }
    Component { id: modeComponent; Design.DriverModeState {} }
    Component { id: settingsComponent; Design.DisplaySettings {} }
}

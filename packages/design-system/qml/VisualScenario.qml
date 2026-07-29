import QtQuick

QtObject {
    id: scenarioState

    required property TelemetryStore telemetry
    required property DisplaySettings settings
    property var navigation: null
    property bool active: false
    property string scenario: "normal"
    property bool driver: true
    property bool ready: false
    readonly property double fixedNow: Date.parse("2026-01-02T12:34:56.000Z")

    function warningFlags() {
        return {
            checkEngine: scenario.includes("advisory"),
            coolantTemperature: scenario.includes("caution"),
            lowFuel: scenario.includes("multiple"),
            lowOilPressure: scenario.includes("critical")
        }
    }

    function telemetryData() {
        return {
            rpm: scenario.includes("maximum-rpm") ? 12000 : 6420,
            speedKph: scenario.includes("zero-speed") ? 0
                : (scenario.includes("high-speed") ? 350 : 112),
            gear: "4",
            throttlePercent: 67,
            coolantTempC: scenario.includes("high-coolant") ? 179 : 91,
            oilTempC: scenario.includes("high-oil") ? 199 : 104,
            oilPressureKpa: scenario.includes("low-oil") ? 1 : 412,
            fuelPercent: scenario.includes("low-fuel") ? 1 : 58,
            batteryVoltage: 13.9,
            warnings: warningFlags()
        }
    }

    function envelope(capturedAt) {
        return JSON.stringify({
            schemaVersion: 1,
            sequence: 4242,
            capturedAt,
            source: "simulation",
            telemetry: telemetryData()
        })
    }

    function apply() {
        telemetry.socket.active = false
        telemetry.freshness.running = false
        telemetry.reconnect.stop()
        if (scenario.includes("day"))
            settings.themeSelection = "day"
        else
            settings.themeSelection = "night"
        settings.highContrast = scenario.includes("high-contrast")
        settings.reducedMotion = true

        if (scenario.includes("performance"))
            settings.driverMode = "Performance"
        else if (scenario.includes("track"))
            settings.driverMode = "Track"
        else
            settings.driverMode = "Daily"

        if (navigation) {
            const pages = ["home", "navigation", "media", "vehicle",
                           "performance", "diagnostics", "settings"]
            for (let index = 0; index < pages.length; index += 1) {
                if (scenario.includes(pages[index])) {
                    navigation.currentIndex = index
                    break
                }
            }
        }

        if (scenario.includes("disconnected")) {
            telemetry.telemetryState.setTransportConnected(false)
        } else {
            telemetry.telemetryState.setTransportConnected(true)
            const timestamp = scenario.includes("stale")
                ? "2026-01-02T12:34:50.000Z"
                : "2026-01-02T12:34:56.000Z"
            telemetry.telemetryState.accept(envelope(timestamp))
            telemetry.telemetryState.updateFreshness(fixedNow)
        }
        ready = true
    }

    Component.onCompleted: {
        if (active)
            apply()
        else
            ready = true
    }
}

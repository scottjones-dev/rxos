import QtQuick
import QtTest
import "../../packages/design-system/qml" as Telemetry

TestCase {
    name: "TelemetryState"

    property var state

    function envelope(capturedAt) {
        return JSON.stringify({
            schemaVersion: 1,
            sequence: 7,
            capturedAt: capturedAt,
            source: "simulation",
            telemetry: {
                rpm: 4200,
                speedKph: 96,
                gear: "4",
                throttlePercent: 42,
                coolantTempC: 88,
                oilTempC: 96,
                oilPressureKpa: 350,
                fuelPercent: 65,
                batteryVoltage: 13.9,
                warnings: {
                    checkEngine: false,
                    coolantTemperature: false,
                    lowFuel: false,
                    lowOilPressure: false
                }
            }
        })
    }

    function init() {
        state = telemetryStateComponent.createObject(this)
        verify(state)
    }

    function cleanup() {
        state.destroy()
    }

    function test_valid_envelope_becomes_live() {
        const now = Date.now()
        state.setTransportConnected(true)
        verify(state.accept(envelope(new Date(now).toISOString())))
        state.updateFreshness(now)
        compare(state.status, "LIVE")
        compare(state.data.rpm, 4200)
    }

    function test_stale_envelope_is_detected() {
        const now = Date.now()
        state.setTransportConnected(true)
        verify(state.accept(envelope(new Date(now - 2000).toISOString())))
        state.updateFreshness(now)
        compare(state.status, "STALE")
        verify(state.observedStale)
    }

    function test_malformed_envelope_is_rejected_without_overwriting_data() {
        const now = Date.now()
        state.setTransportConnected(true)
        verify(state.accept(envelope(new Date(now).toISOString())))
        compare(state.data.rpm, 4200)
        verify(!state.accept("{malformed"))
        compare(state.invalidMessages, 1)
        compare(state.data.rpm, 4200)
    }

    function test_disconnect_and_reconnect_are_observable() {
        const now = Date.now()
        state.setTransportConnected(true)
        verify(state.accept(envelope(new Date(now).toISOString())))
        state.setTransportConnected(false)
        compare(state.status, "NO DATA")
        verify(state.observedDisconnected)
        state.setTransportConnected(true)
        verify(state.accept(envelope(new Date(now + 1).toISOString())))
        verify(state.observedReconnect)
    }

    Component {
        id: telemetryStateComponent
        Telemetry.TelemetryState {}
    }
}

import QtQuick
import QtWebSockets

QtObject {
    id: store

    property url endpoint: "ws://127.0.0.1:8787/telemetry"
    property alias status: telemetryState.status
    property alias hasSample: telemetryState.hasSample
    property alias stale: telemetryState.stale
    property alias invalidMessages: telemetryState.invalidMessages
    property alias data: telemetryState.data
    property alias reliabilityComplete: telemetryState.reliabilityComplete

    readonly property double rpm: telemetryState.data.rpm
    readonly property double speedKph: telemetryState.data.speedKph
    readonly property string gear: telemetryState.data.gear
    readonly property double throttlePercent: telemetryState.data.throttlePercent
    readonly property double coolantTempC: telemetryState.data.coolantTempC
    readonly property double oilTempC: telemetryState.data.oilTempC
    readonly property double oilPressureKpa: telemetryState.data.oilPressureKpa
    readonly property double fuelPercent: telemetryState.data.fuelPercent
    readonly property double batteryVoltage: telemetryState.data.batteryVoltage
    readonly property bool checkEngineWarning: telemetryState.data.warnings.checkEngine
    readonly property bool coolantWarning: telemetryState.data.warnings.coolantTemperature
    readonly property bool lowFuelWarning: telemetryState.data.warnings.lowFuel
    readonly property bool lowOilPressureWarning: telemetryState.data.warnings.lowOilPressure

    property TelemetryState telemetryState: TelemetryState {
    }

    property WebSocket socket: WebSocket {
        url: store.endpoint
        active: true
        onTextMessageReceived: message => telemetryState.accept(message)
        onStatusChanged: {
            telemetryState.setTransportConnected(status === WebSocket.Open)
            if (status === WebSocket.Closed || status === WebSocket.Error)
                store.reconnect.start()
        }
    }

    property Timer freshness: Timer {
        interval: 100
        repeat: true
        running: true
        onTriggered: telemetryState.updateFreshness(Date.now())
    }

    property Timer reconnect: Timer {
        interval: 250
        repeat: false
        onTriggered: {
            store.socket.active = false
            store.socket.active = true
        }
    }
}

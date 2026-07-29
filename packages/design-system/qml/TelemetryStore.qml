import QtQuick
import QtWebSockets

QtObject {
    id: store

    property url endpoint: "ws://127.0.0.1:8787/telemetry"
    property alias status: telemetryStateObject.status
    property alias hasSample: telemetryStateObject.hasSample
    property alias stale: telemetryStateObject.stale
    property alias invalidMessages: telemetryStateObject.invalidMessages
    property alias acceptedMessages: telemetryStateObject.acceptedMessages
    property alias lastSequence: telemetryStateObject.lastSequence
    property alias laggedMessages: telemetryStateObject.laggedMessages
    property alias data: telemetryStateObject.data
    property alias reliabilityComplete: telemetryStateObject.reliabilityComplete
    property int acceptEvery: 1
    property int receivedMessages: 0

    readonly property double rpm: telemetryStateObject.data.rpm
    readonly property double speedKph: telemetryStateObject.data.speedKph
    readonly property string gear: telemetryStateObject.data.gear
    readonly property double throttlePercent: telemetryStateObject.data.throttlePercent
    readonly property double coolantTempC: telemetryStateObject.data.coolantTempC
    readonly property double oilTempC: telemetryStateObject.data.oilTempC
    readonly property double oilPressureKpa: telemetryStateObject.data.oilPressureKpa
    readonly property double fuelPercent: telemetryStateObject.data.fuelPercent
    readonly property double batteryVoltage: telemetryStateObject.data.batteryVoltage
    readonly property bool checkEngineWarning: telemetryStateObject.data.warnings.checkEngine
    readonly property bool coolantWarning: telemetryStateObject.data.warnings.coolantTemperature
    readonly property bool lowFuelWarning: telemetryStateObject.data.warnings.lowFuel
    readonly property bool lowOilPressureWarning: telemetryStateObject.data.warnings.lowOilPressure

    property TelemetryState telemetryState: TelemetryState {
        id: telemetryStateObject
    }

    property WebSocket socket: WebSocket {
        url: store.endpoint
        active: true
        onTextMessageReceived: message => {
            store.receivedMessages += 1
            if (store.receivedMessages % Math.max(1, store.acceptEvery) === 0)
                store.telemetryState.accept(message)
            else
                store.telemetryState.laggedMessages += 1
        }
        onStatusChanged: {
            store.telemetryState.setTransportConnected(status === WebSocket.Open)
            if (status === WebSocket.Closed || status === WebSocket.Error)
                store.reconnect.start()
        }
    }

    property Timer freshness: Timer {
        interval: 100
        repeat: true
        running: true
        onTriggered: store.telemetryState.updateFreshness(Date.now())
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

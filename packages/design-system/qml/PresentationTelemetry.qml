import QtQuick

QtObject {
    id: presentation

    required property TelemetryStore source
    property int maximumHz: 30
    property int publicationCount: 0
    property int replacedPendingCount: 0
    property var data: ({
        rpm: 0,
        speedKph: 0,
        gear: "—",
        throttlePercent: 0,
        coolantTempC: 0,
        oilTempC: 0,
        oilPressureKpa: 0,
        fuelPercent: 0,
        batteryVoltage: 0
    })
    property bool pending: false

    // Safety and reliability state intentionally bypasses presentation cadence.
    readonly property string status: source.status
    readonly property bool stale: source.stale
    readonly property bool hasSample: source.hasSample
    readonly property int invalidMessages: source.invalidMessages
    readonly property TelemetryState telemetryState: source.telemetryState

    readonly property double rpm: data.rpm
    readonly property double speedKph: data.speedKph
    readonly property string gear: data.gear
    readonly property double throttlePercent: data.throttlePercent
    readonly property double coolantTempC: data.coolantTempC
    readonly property double oilTempC: data.oilTempC
    readonly property double oilPressureKpa: data.oilPressureKpa
    readonly property double fuelPercent: data.fuelPercent
    readonly property double batteryVoltage: data.batteryVoltage

    function queueLatest() {
        if (pending)
            replacedPendingCount += 1
        pending = true
    }

    function publishLatest() {
        if (!pending)
            return
        data = source.data
        pending = false
        publicationCount += 1
    }

    property Connections sourceConnection: Connections {
        target: presentation.source.telemetryState
        function onDataChanged() {
            presentation.queueLatest()
        }
    }

    property Timer publisher: Timer {
        interval: Math.max(1, Math.round(1000 / Math.max(1, presentation.maximumHz)))
        repeat: true
        running: true
        onTriggered: presentation.publishLatest()
    }

    Component.onCompleted: {
        data = source.data
    }
}

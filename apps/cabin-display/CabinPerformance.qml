import QtQuick
import QtQuick.Layouts

Item {
    id: performance
    required property RxTokens theme
    required property var telemetry
    readonly property bool live: telemetry.status === "LIVE"
    BoundedHistory { id: rpmHistory; capacity: 600; downsampleEvery: 1 }
    Connections {
        target: performance.telemetry.telemetryState
        function onDataChanged() {
            rpmHistory.append(Date.now(), performance.telemetry.rpm, performance.live)
        }
    }
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: performance.theme.safeMargin
        spacing: performance.theme.space4
        RowLayout {
            Layout.fillWidth: true
            Repeater {
                model: [
                    ["RPM", performance.telemetry.rpm, "rpm"],
                    ["THROTTLE", performance.telemetry.throttlePercent, "%"],
                    ["OIL PRESS", performance.telemetry.oilPressureKpa, "kPa"],
                    ["OIL TEMP", performance.telemetry.oilTempC, "°C"],
                    ["COOLANT", performance.telemetry.coolantTempC, "°C"]
                ]
                delegate: RxMetric {
                    id: performanceMetric
                    required property var modelData
                    Layout.fillWidth: true
                    theme: performance.theme
                    label: performanceMetric.modelData[0]
                    value: Math.round(performanceMetric.modelData[1])
                    unit: performanceMetric.modelData[2]
                    available: performance.live
                }
            }
        }
        RxCard {
            Layout.fillWidth: true
            Layout.fillHeight: true
            theme: performance.theme
            heading: "RPM history"
            subtitle: rpmHistory.length + " / " + rpmHistory.capacity + " bounded samples · gaps retained"
            RxChart {
                anchors.fill: parent
                theme: performance.theme
                values: rpmHistory.values
                minimum: 0
                maximum: 10000
                stale: !performance.live
            }
        }
    }
}


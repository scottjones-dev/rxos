import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: performance
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property BoundedHistory history
    readonly property bool live: telemetry.status === "LIVE"
    readonly property int sampleCount: history.length
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
                    value: performanceMetric.modelData[0] === "OIL PRESS"
                        ? performance.formatter.pressure(performanceMetric.modelData[1])
                        : (performanceMetric.modelData[0] === "OIL TEMP"
                            || performanceMetric.modelData[0] === "COOLANT"
                            ? performance.formatter.temperature(performanceMetric.modelData[1])
                            : Math.round(performanceMetric.modelData[1]))
                    unit: performanceMetric.modelData[0] === "RPM"
                        || performanceMetric.modelData[0] === "THROTTLE"
                        ? performanceMetric.modelData[2] : ""
                    available: performance.live
                }
            }
        }
        RxCard {
            Layout.fillWidth: true
            Layout.fillHeight: true
            theme: performance.theme
            heading: "RPM history"
            subtitle: performance.history.length + " / " + performance.history.capacity + " bounded samples · gaps retained"
            RxChart {
                anchors.fill: parent
                theme: performance.theme
                values: performance.history.values
                minimum: 0
                maximum: 10000
                stale: !performance.live
            }
        }
    }
}

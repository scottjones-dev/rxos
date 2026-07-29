import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: track
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property bool live

    RowLayout {
        anchors.fill: parent
        spacing: track.theme.space5
        ColumnLayout {
            Layout.preferredWidth: parent.width * 0.58
            Layout.fillHeight: true
            RxGauge {
                Layout.fillWidth: true
                Layout.fillHeight: true
                theme: track.theme
                label: "RPM · SHIFT PRESENTATION"
                unit: "rpm"
                value: track.telemetry.rpm
                maximum: 10000
                available: track.live
                accentColor: track.telemetry.rpm > 8000 ? track.theme.caution : track.theme.accent
            }
            RowLayout {
                RxMetric { Layout.fillWidth: true; theme: track.theme; label: "SPEED"; value: track.formatter.speed(track.telemetry.speedKph); available: track.live }
                RxMetric { Layout.fillWidth: true; theme: track.theme; label: "GEAR"; value: track.telemetry.gear; available: track.live }
                RxMetric { Layout.fillWidth: true; theme: track.theme; label: "THROTTLE"; value: Math.round(track.telemetry.throttlePercent); unit: "%"; available: track.live }
            }
        }
        GridLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            columns: 2
            rowSpacing: track.theme.space3
            columnSpacing: track.theme.space3
            Repeater {
                model: [
                    ["LAP", "—", "UNAVAILABLE"],
                    ["PREVIOUS", "—", "UNAVAILABLE"],
                    ["BEST", "—", "UNAVAILABLE"],
                    ["DELTA", "—", "UNAVAILABLE"],
                    ["OIL PRESS", Math.round(track.telemetry.oilPressureKpa), "kPa"],
                    ["OIL TEMP", Math.round(track.telemetry.oilTempC), "°C"],
                    ["COOLANT", Math.round(track.telemetry.coolantTempC), "°C"]
                ]
                delegate: RxMetric {
                    id: trackMetric
                    required property var modelData
                    required property int index
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    theme: track.theme
                    label: trackMetric.modelData[0]
                    value: trackMetric.modelData[1]
                    unit: trackMetric.modelData[2]
                    available: trackMetric.index < 4 ? false : track.live
                }
            }
        }
    }
}

import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: performance
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property bool live

    ColumnLayout {
        anchors.fill: parent
        spacing: performance.theme.space4
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            RxGauge {
                Layout.fillWidth: true
                Layout.fillHeight: true
                theme: performance.theme
                label: "ENGINE SPEED · PERFORMANCE"
                unit: "rpm"
                value: performance.telemetry.rpm
                maximum: 10000
                available: performance.live
                accentColor: performance.telemetry.rpm > 8000 ? performance.theme.caution : performance.theme.accent
            }
            RxMetric { theme: performance.theme; label: "SPEED"; value: performance.formatter.speed(performance.telemetry.speedKph); available: performance.live }
            RxMetric { theme: performance.theme; label: "GEAR"; value: performance.telemetry.gear; available: performance.live }
        }
        GridLayout {
            Layout.fillWidth: true
            columns: 5
            columnSpacing: performance.theme.space3
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "THROTTLE"; value: Math.round(performance.telemetry.throttlePercent); unit: "%"; available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "OIL PRESS"; value: performance.formatter.pressure(performance.telemetry.oilPressureKpa); available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "OIL TEMP"; value: performance.formatter.temperature(performance.telemetry.oilTempC); available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "COOLANT"; value: performance.formatter.temperature(performance.telemetry.coolantTempC); available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "BATTERY"; value: performance.formatter.voltage(performance.telemetry.batteryVoltage); available: performance.live }
        }
    }
}

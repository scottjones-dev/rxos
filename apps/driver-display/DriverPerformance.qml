import QtQuick
import QtQuick.Layouts

Item {
    id: performance
    required property RxTokens theme
    required property var telemetry
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
            RxMetric { theme: performance.theme; label: "SPEED"; value: Math.round(performance.telemetry.speedKph); unit: "km/h"; available: performance.live }
            RxMetric { theme: performance.theme; label: "GEAR"; value: performance.telemetry.gear; available: performance.live }
        }
        GridLayout {
            Layout.fillWidth: true
            columns: 5
            columnSpacing: performance.theme.space3
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "THROTTLE"; value: Math.round(performance.telemetry.throttlePercent); unit: "%"; available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "OIL PRESS"; value: Math.round(performance.telemetry.oilPressureKpa); unit: "kPa"; available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "OIL TEMP"; value: Math.round(performance.telemetry.oilTempC); unit: "°C"; available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "COOLANT"; value: Math.round(performance.telemetry.coolantTempC); unit: "°C"; available: performance.live }
            RxMetric { Layout.fillWidth: true; theme: performance.theme; label: "BATTERY"; value: performance.telemetry.batteryVoltage.toFixed(1); unit: "V"; available: performance.live }
        }
    }
}


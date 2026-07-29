import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: daily
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property bool live

    RowLayout {
        anchors.fill: parent
        spacing: daily.theme.space6
        RxCard {
            Layout.preferredWidth: parent.width * 0.23
            Layout.fillHeight: true
            theme: daily.theme
            heading: "NEXT"
            subtitle: "Navigation placeholder"
            Column {
                anchors.centerIn: parent
                spacing: daily.theme.space4
                RxIcon { anchors.horizontalCenter: parent.horizontalCenter; theme: daily.theme; symbol: "↑"; font.pixelSize: 64 * daily.theme.scale }
                RxText { theme: daily.theme; text: "Continue straight"; font.pixelSize: daily.theme.textTitle; font.bold: true }
                RxText { anchors.horizontalCenter: parent.horizontalCenter; theme: daily.theme; text: "450 m · SIMULATED"; color: daily.theme.textSecondary }
            }
        }
        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: daily.theme.space3
            RowLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                RxGauge {
                    Layout.fillWidth: true
                    theme: daily.theme
                    label: "SPEED"
                    unit: daily.formatter.speedUnit
                    value: daily.formatter.speedValue(daily.telemetry.speedKph)
                    maximum: 300
                    available: daily.live
                }
                RxGauge {
                    Layout.fillWidth: true
                    theme: daily.theme
                    label: "ENGINE SPEED · SIMULATED REDLINE MARKER"
                    unit: "rpm"
                    value: daily.telemetry.rpm
                    maximum: 10000
                    available: daily.live
                }
                Column {
                    Layout.preferredWidth: 230 * daily.theme.scale
                    Layout.alignment: Qt.AlignVCenter
                    RxText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        theme: daily.theme
                        text: daily.live ? daily.telemetry.gear : "—"
                        font.pixelSize: 112 * daily.theme.scale
                        font.bold: true
                    }
                    RxText { anchors.horizontalCenter: parent.horizontalCenter; theme: daily.theme; text: "GEAR"; color: daily.theme.textSecondary }
                }
            }
            RowLayout {
                Layout.fillWidth: true
                Repeater {
                    model: [
                        ["FUEL", daily.telemetry.fuelPercent, "%"],
                        ["COOLANT", daily.telemetry.coolantTempC, "°C"],
                        ["OIL TEMP", daily.telemetry.oilTempC, "°C"],
                        ["BATTERY", daily.telemetry.batteryVoltage, "V"]
                    ]
                    delegate: RxMetric {
                        id: dailyMetric
                        required property var modelData
                        Layout.fillWidth: true
                        theme: daily.theme
                        label: dailyMetric.modelData[0]
                        value: dailyMetric.modelData[0] === "FUEL"
                            ? daily.formatter.fuel(dailyMetric.modelData[1])
                            : (dailyMetric.modelData[0] === "BATTERY"
                                ? daily.formatter.voltage(dailyMetric.modelData[1])
                                : daily.formatter.temperature(dailyMetric.modelData[1]))
                        unit: ""
                        available: daily.live
                    }
                }
            }
        }
    }
}

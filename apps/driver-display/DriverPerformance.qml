import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: sport
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property bool live

    ColumnLayout {
        anchors.fill: parent
        spacing: sport.theme.space5

        Row {
            Layout.fillWidth: true
            Layout.preferredHeight: 16 * sport.theme.scale
            spacing: sport.theme.space2
            Repeater {
                model: 18
                Rectangle {
                    required property int index
                    width: (sport.width - 17 * sport.theme.space2) / 18
                    height: index >= 15 ? 16 * sport.theme.scale
                                        : 10 * sport.theme.scale
                    radius: height / 2
                    color: index / 18 <= sport.telemetry.rpm / 10000
                        ? (index >= 15 ? sport.theme.performance : sport.theme.accent)
                        : sport.theme.surfaceRaised
                }
            }
        }

        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: sport.theme.space8
            RxHeroNumber {
                Layout.fillWidth: true
                theme: sport.theme
                value: sport.live ? Math.round(
                    sport.formatter.speedValue(sport.telemetry.speedKph)).toString() : "—"
                unit: sport.formatter.speedUnit
                label: "Speed"
                accentColor: sport.theme.textTertiary
            }
            Column {
                Layout.alignment: Qt.AlignCenter
                spacing: -sport.theme.space4
                RxText {
                    anchors.horizontalCenter: parent.horizontalCenter
                    theme: sport.theme
                    text: sport.live ? sport.telemetry.gear : "—"
                    font.pixelSize: sport.theme.textInstrument
                    font.weight: Font.Light
                }
                RxText {
                    anchors.horizontalCenter: parent.horizontalCenter
                    theme: sport.theme
                    text: "GEAR"
                    color: sport.theme.performance
                    font.pixelSize: sport.theme.textMicro
                    font.bold: true
                    font.letterSpacing: 2 * sport.theme.scale
                }
            }
            RxHeroNumber {
                Layout.fillWidth: true
                theme: sport.theme
                value: sport.live ? Math.round(sport.telemetry.rpm).toString() : "—"
                unit: "rpm"
                label: "Engine speed"
                accentColor: sport.theme.performance
            }
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: sport.theme.space6
            Repeater {
                model: [
                    ["THROTTLE", sport.live ? Math.round(sport.telemetry.throttlePercent) + "%" : "—"],
                    ["OIL PRESSURE", sport.live ? sport.formatter.pressure(sport.telemetry.oilPressureKpa) : "—"],
                    ["OIL TEMP", sport.live ? sport.formatter.temperature(sport.telemetry.oilTempC) : "—"],
                    ["COOLANT", sport.live ? sport.formatter.temperature(sport.telemetry.coolantTempC) : "—"]
                ]
                delegate: ColumnLayout {
                    id: metric
                    required property var modelData
                    Layout.fillWidth: true
                    spacing: sport.theme.space1
                    RxText {
                        Layout.alignment: Qt.AlignHCenter
                        theme: sport.theme
                        text: metric.modelData[1]
                        font.pixelSize: sport.theme.textTitle
                        font.weight: Font.DemiBold
                    }
                    RxText {
                        Layout.alignment: Qt.AlignHCenter
                        theme: sport.theme
                        text: metric.modelData[0]
                        color: sport.theme.textTertiary
                        font.pixelSize: sport.theme.textMicro
                        font.letterSpacing: 1.2 * sport.theme.scale
                    }
                }
            }
        }
    }
}

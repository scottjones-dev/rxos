import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: track
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property bool live

    ColumnLayout {
        anchors.fill: parent
        spacing: track.theme.space4

        Row {
            Layout.fillWidth: true
            Layout.preferredHeight: 22 * track.theme.scale
            spacing: track.theme.space2
            Repeater {
                model: 14
                Rectangle {
                    required property int index
                    width: (track.width - 13 * track.theme.space2) / 14
                    height: 12 * track.theme.scale
                    radius: height / 2
                    color: index / 14 <= track.telemetry.rpm / 10000
                        ? (index >= 11 ? track.theme.performance : track.theme.navigation)
                        : track.theme.surfaceRaised
                }
            }
        }

        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: track.theme.space8

            ColumnLayout {
                Layout.preferredWidth: parent.width * 0.24
                spacing: track.theme.space5
                RxHeroNumber {
                    Layout.fillWidth: true
                    theme: track.theme
                    value: track.live ? Math.round(track.formatter.speedValue(
                        track.telemetry.speedKph)).toString() : "—"
                    unit: track.formatter.speedUnit
                    label: "Speed"
                    accentColor: track.theme.textTertiary
                }
                RxHeroNumber {
                    Layout.fillWidth: true
                    theme: track.theme
                    value: "—"
                    unit: ""
                    label: "Lap unavailable"
                    accentColor: track.theme.unavailable
                }
            }

            Column {
                Layout.alignment: Qt.AlignCenter
                spacing: -track.theme.space6
                RxText {
                    anchors.horizontalCenter: parent.horizontalCenter
                    theme: track.theme
                    text: track.live ? track.telemetry.gear : "—"
                    font.pixelSize: 250 * track.theme.scale
                    font.weight: Font.Light
                }
                RxText {
                    anchors.horizontalCenter: parent.horizontalCenter
                    theme: track.theme
                    text: "GEAR"
                    color: track.theme.performance
                    font.pixelSize: track.theme.textLabel
                    font.bold: true
                    font.letterSpacing: 2.5 * track.theme.scale
                }
            }

            ColumnLayout {
                Layout.preferredWidth: parent.width * 0.24
                spacing: track.theme.space5
                RxHeroNumber {
                    Layout.fillWidth: true
                    theme: track.theme
                    value: track.live
                        ? track.formatter.temperature(track.telemetry.oilTempC) : "—"
                    unit: ""
                    label: "Oil temperature"
                    accentColor: track.theme.caution
                }
                RxHeroNumber {
                    Layout.fillWidth: true
                    theme: track.theme
                    value: track.live
                        ? track.formatter.temperature(track.telemetry.coolantTempC) : "—"
                    unit: ""
                    label: "Coolant"
                    accentColor: track.theme.caution
                }
            }
        }

        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: track.theme.space8
            RxText {
                theme: track.theme
                text: track.live ? Math.round(track.telemetry.rpm) + " rpm" : "—"
                color: track.theme.textSecondary
                font.pixelSize: track.theme.textLabel
            }
            RxText {
                theme: track.theme
                text: track.live
                    ? track.formatter.pressure(track.telemetry.oilPressureKpa) : "—"
                color: track.theme.textSecondary
                font.pixelSize: track.theme.textLabel
            }
            RxText {
                theme: track.theme
                text: "DELTA UNAVAILABLE"
                color: track.theme.unavailable
                font.pixelSize: track.theme.textMicro
                font.letterSpacing: 1.4 * track.theme.scale
            }
        }
    }
}

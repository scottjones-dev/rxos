import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: road
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property bool live

    RowLayout {
        anchors.fill: parent
        spacing: road.theme.space7

        RxInstrumentDial {
            Layout.preferredWidth: Math.min(parent.height, parent.width * 0.29)
            Layout.preferredHeight: Layout.preferredWidth
            theme: road.theme
            value: road.telemetry.speedKph
            maximum: 300
            displayValue: Math.round(road.formatter.speedValue(
                road.telemetry.speedKph)).toString()
            unit: road.formatter.speedUnit
            label: "Road speed"
            secondary: road.live ? "SIMULATED SIGNAL" : "DATA UNAVAILABLE"
            accentColor: road.theme.accent
            available: road.live
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: road.theme.space3

            Item { Layout.fillHeight: true }
            RxText {
                Layout.alignment: Qt.AlignHCenter
                theme: road.theme
                text: "↑"
                color: road.theme.navigation
                font.pixelSize: 62 * road.theme.scale
            }
            RxText {
                Layout.alignment: Qt.AlignHCenter
                theme: road.theme
                text: "Continue straight"
                font.pixelSize: road.theme.textTitle
                font.weight: Font.DemiBold
            }
            RxText {
                Layout.alignment: Qt.AlignHCenter
                theme: road.theme
                text: "450 m  ·  GUIDANCE PREVIEW"
                color: road.theme.textSecondary
                font.pixelSize: road.theme.textCaption
                font.letterSpacing: 1.2 * road.theme.scale
            }
            Rectangle {
                Layout.alignment: Qt.AlignHCenter
                Layout.topMargin: road.theme.space4
                width: 176 * road.theme.scale
                height: 3 * road.theme.scale
                radius: height / 2
                color: road.theme.surfaceRaised
                Rectangle {
                    width: parent.width * 0.62
                    height: parent.height
                    radius: parent.radius
                    color: road.theme.navigation
                }
            }
            Item { Layout.fillHeight: true }
            RowLayout {
                Layout.alignment: Qt.AlignHCenter
                spacing: road.theme.space7
                Column {
                    spacing: road.theme.space1
                    RxText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        theme: road.theme
                        text: road.live ? Math.round(road.telemetry.fuelPercent) + "%" : "—"
                        font.pixelSize: road.theme.textTitle
                        font.weight: Font.DemiBold
                    }
                    RxText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        theme: road.theme
                        text: "FUEL"
                        color: road.theme.textTertiary
                        font.pixelSize: road.theme.textMicro
                        font.letterSpacing: 1.4 * road.theme.scale
                    }
                }
                Column {
                    spacing: road.theme.space1
                    RxText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        theme: road.theme
                        text: road.live
                            ? road.formatter.temperature(road.telemetry.coolantTempC)
                            : "—"
                        font.pixelSize: road.theme.textTitle
                        font.weight: Font.DemiBold
                    }
                    RxText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        theme: road.theme
                        text: "COOLANT"
                        color: road.theme.textTertiary
                        font.pixelSize: road.theme.textMicro
                        font.letterSpacing: 1.4 * road.theme.scale
                    }
                }
            }
            Item { Layout.fillHeight: true }
        }

        RxInstrumentDial {
            Layout.preferredWidth: Math.min(parent.height, parent.width * 0.29)
            Layout.preferredHeight: Layout.preferredWidth
            theme: road.theme
            value: road.telemetry.rpm
            maximum: 10000
            displayValue: road.live ? road.telemetry.gear : "—"
            unit: "GEAR"
            label: road.live
                ? Math.round(road.telemetry.rpm) + " rpm" : "Engine speed"
            secondary: "SIMULATED REDLINE"
            accentColor: road.telemetry.rpm > 8000
                ? road.theme.performance : road.theme.navigation
            available: road.live
        }
    }
}

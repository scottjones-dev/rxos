import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: vehicle
    required property RxTokens theme
    required property var telemetry
    readonly property bool live: telemetry.status === "LIVE"

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: vehicle.theme.safeMargin
        spacing: vehicle.theme.space6

        RxPageHeader {
            Layout.fillWidth: true
            theme: vehicle.theme
            eyebrow: "Vehicle"
            title: "Your RX-8"
            detail: vehicle.live ? "READ-ONLY · SIMULATED" : "TELEMETRY UNAVAILABLE"
        }

        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: vehicle.theme.space7

            Item {
                Layout.preferredWidth: parent.width * 0.42
                Layout.fillHeight: true
                Rectangle {
                    anchors.centerIn: parent
                    width: parent.width * 0.76
                    height: parent.height * 0.43
                    radius: height * 0.35
                    color: vehicle.theme.surfaceRaised
                    border.width: 2
                    border.color: vehicle.theme.textTertiary
                    Rectangle {
                        anchors.horizontalCenter: parent.horizontalCenter
                        anchors.bottom: parent.bottom
                        anchors.bottomMargin: -12 * vehicle.theme.scale
                        width: parent.width * 0.62
                        height: 20 * vehicle.theme.scale
                        radius: height / 2
                        color: vehicle.theme.shadow
                    }
                }
                RxText {
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.bottom: parent.bottom
                    theme: vehicle.theme
                    text: "VEHICLE SILHOUETTE · NOT TO SCALE"
                    color: vehicle.theme.textTertiary
                    font.pixelSize: vehicle.theme.textMicro
                    font.letterSpacing: 1.2 * vehicle.theme.scale
                }
            }

            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: vehicle.theme.space5
                RxText {
                    theme: vehicle.theme
                    text: vehicle.live ? "Simulated signals are current" : "Vehicle status unavailable"
                    color: vehicle.live ? vehicle.theme.navigation : vehicle.theme.caution
                    font.pixelSize: vehicle.theme.textTitle
                    font.weight: Font.DemiBold
                }
                Repeater {
                    model: [
                        ["Fuel", vehicle.live ? Math.round(vehicle.telemetry.fuelPercent) + "%" : "—"],
                        ["Oil temperature", vehicle.live ? Math.round(vehicle.telemetry.oilTempC) + " °C" : "—"],
                        ["Battery", vehicle.live ? vehicle.telemetry.batteryVoltage.toFixed(1) + " V" : "—"],
                        ["Next service", "Unavailable"],
                        ["Tyres and doors", "Unavailable"]
                    ]
                    delegate: RowLayout {
                        id: row
                        required property var modelData
                        Layout.fillWidth: true
                        Layout.preferredHeight: 66 * vehicle.theme.scale
                        RxText {
                            theme: vehicle.theme
                            text: row.modelData[0]
                            color: vehicle.theme.textSecondary
                        }
                        Item { Layout.fillWidth: true }
                        RxText {
                            theme: vehicle.theme
                            text: row.modelData[1]
                            color: text === "Unavailable"
                                ? vehicle.theme.unavailable : vehicle.theme.textPrimary
                            font.pixelSize: vehicle.theme.textTitle
                            font.weight: Font.DemiBold
                        }
                    }
                }
                Item { Layout.fillHeight: true }
                RxText {
                    Layout.fillWidth: true
                    theme: vehicle.theme
                    text: "Factory instrumentation remains authoritative."
                    color: vehicle.theme.textTertiary
                    wrapMode: Text.WordWrap
                    font.pixelSize: vehicle.theme.textCaption
                }
            }
        }
    }
}

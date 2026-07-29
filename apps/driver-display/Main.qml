import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    id: window
    width: 1920
    height: 1080
    visible: true
    color: "#070A0F"
    title: "RXOS Driver Display"

    property bool trackMode: false
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    TelemetryStore { id: telemetry }

    Rectangle {
        anchors.fill: parent
        color: "#070A0F"

        RowLayout {
            anchors {
                fill: parent
                margins: 48
            }
            spacing: 36

            ColumnLayout {
                Layout.preferredWidth: 420
                Layout.fillHeight: true
                spacing: 24

                Text {
                    text: "RXOS  /  " + (window.trackMode ? "TRACK" : "DAILY")
                    color: "#38D6FF"
                    font.pixelSize: 24
                    font.bold: true
                    font.letterSpacing: 3
                }

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 250
                    radius: 20
                    color: "#111722"
                    border.color: "#202B3D"
                    Column {
                        anchors.centerIn: parent
                        spacing: 2
                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: telemetry.hasSample ? Math.round(telemetry.speedKph) : "—"
                            color: "#F4F7FB"
                            font.pixelSize: 126
                            font.bold: true
                        }
                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: "km/h"
                            color: "#8C9AAF"
                            font.pixelSize: 25
                        }
                    }
                }

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 220
                    radius: 20
                    color: "#111722"
                    border.color: "#202B3D"
                    Row {
                        anchors.centerIn: parent
                        spacing: 56
                        Column {
                            Text { text: "GEAR"; color: "#8C9AAF"; font.pixelSize: 20 }
                            Text { text: telemetry.gear; color: "#38D6FF"; font.pixelSize: 100; font.bold: true }
                        }
                        Column {
                            Text { text: "THROTTLE"; color: "#8C9AAF"; font.pixelSize: 20 }
                            Text { text: Math.round(telemetry.throttlePercent) + "%"; color: "#F4F7FB"; font.pixelSize: 52 }
                        }
                    }
                }

                Item { Layout.fillHeight: true }
                Button {
                    text: window.trackMode ? "Switch to Daily" : "Switch to Track"
                    onClicked: window.trackMode = !window.trackMode
                }
            }

            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 24

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 470
                    radius: 26
                    color: "#0C111A"
                    border.color: telemetry.rpm >= 8000 ? "#FF4057" : "#202B3D"

                    Canvas {
                        id: tachometer
                        anchors.fill: parent
                        onPaint: {
                            const context = getContext("2d")
                            context.reset()
                            const cx = width / 2
                            const cy = height * 0.9
                            const radius = Math.min(width * 0.42, height * 0.78)
                            const start = Math.PI * 1.1
                            const span = Math.PI * 0.8
                            context.lineWidth = 28
                            context.strokeStyle = "#202B3D"
                            context.beginPath()
                            context.arc(cx, cy, radius, start, start + span)
                            context.stroke()
                            context.strokeStyle = telemetry.rpm >= 8000 ? "#FF4057" : "#38D6FF"
                            context.beginPath()
                            context.arc(cx, cy, radius, start, start + span * Math.min(telemetry.rpm / 9000, 1))
                            context.stroke()
                        }
                        Connections {
                            target: telemetry
                            function onRpmChanged() { tachometer.requestPaint() }
                        }
                    }
                    Column {
                        anchors.centerIn: parent
                        anchors.verticalCenterOffset: 35
                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: Math.round(telemetry.rpm)
                            color: telemetry.rpm >= 8000 ? "#FF4057" : "#F4F7FB"
                            font.pixelSize: 105
                            font.bold: true
                        }
                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: "RPM   •   REDLINE 9,000"
                            color: "#8C9AAF"
                            font.pixelSize: 22
                        }
                    }
                }

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: window.trackMode ? 260 : 190
                    radius: 20
                    color: "#111722"
                    border.color: "#202B3D"
                    RowLayout {
                        anchors { fill: parent; margins: 30 }
                        ColumnLayout {
                            Layout.fillWidth: true
                            Text { text: window.trackMode ? "TRACK TELEMETRY" : "NAVIGATION"; color: "#38D6FF"; font.pixelSize: 20; font.bold: true }
                            Text { text: window.trackMode ? "Lap timer armed" : "Continue on simulated route"; color: "#F4F7FB"; font.pixelSize: 34 }
                            Text { text: window.trackMode ? "No GPS/IMU source connected" : "Next instruction  —  450 m"; color: "#8C9AAF"; font.pixelSize: 22 }
                        }
                        Text { text: window.trackMode ? "00:00.000" : "↑"; color: "#F4F7FB"; font.pixelSize: 64; font.bold: true }
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    Repeater {
                        model: [
                            ["COOLANT", Math.round(telemetry.coolantTempC) + "°C"],
                            ["OIL TEMP", Math.round(telemetry.oilTempC) + "°C"],
                            ["OIL PRESS", Math.round(telemetry.oilPressureKpa) + " kPa"],
                            ["FUEL", Math.round(telemetry.fuelPercent) + "%"],
                            ["BATTERY", telemetry.batteryVoltage.toFixed(1) + " V"]
                        ]
                        delegate: Rectangle {
                            required property var modelData
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            radius: 15
                            color: "#111722"
                            Column {
                                anchors.centerIn: parent
                                spacing: 12
                                Text { anchors.horizontalCenter: parent.horizontalCenter; text: modelData[0]; color: "#8C9AAF"; font.pixelSize: 16 }
                                Text { anchors.horizontalCenter: parent.horizontalCenter; text: modelData[1]; color: "#F4F7FB"; font.pixelSize: 27; font.bold: true }
                            }
                        }
                    }
                }
            }
        }

        Row {
            anchors { top: parent.top; right: parent.right; margins: 22 }
            spacing: 10
            Repeater {
                model: [
                    ["ENGINE", telemetry.checkEngineWarning],
                    ["COOLANT", telemetry.coolantWarning],
                    ["FUEL", telemetry.lowFuelWarning],
                    ["OIL", telemetry.lowOilPressureWarning]
                ]
                delegate: Rectangle {
                    required property var modelData
                    visible: modelData[1]
                    width: 118
                    height: 38
                    radius: 8
                    color: "#FF4057"
                    Text { anchors.centerIn: parent; text: modelData[0]; color: "white"; font.bold: true }
                }
            }
            Rectangle {
                width: 120
                height: 38
                radius: 19
                color: telemetry.status === "LIVE" ? "#173B32" : "#5A1C28"
                Text { anchors.centerIn: parent; text: telemetry.status; color: telemetry.status === "LIVE" ? "#43E09D" : "#FFFFFF"; font.bold: true }
            }
        }

        Rectangle {
            visible: telemetry.status !== "LIVE"
            anchors.fill: parent
            color: "#99070A0F"
            z: 10
            Column {
                anchors.centerIn: parent
                spacing: 18
                Text { anchors.horizontalCenter: parent.horizontalCenter; text: telemetry.status; color: "#FF4057"; font.pixelSize: 76; font.bold: true }
                Text { text: "Telemetry is unavailable. Values are not authoritative."; color: "#F4F7FB"; font.pixelSize: 26 }
            }
        }
    }
}

import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    id: window
    width: 1920
    height: 1080
    visible: true
    color: "#070A0F"
    title: "RXOS Cabin Display"

    property int currentPage: 0
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    readonly property var pages: ["Navigation", "Media", "Vehicle", "Telemetry", "Diagnostics", "Settings"]
    TelemetryStore { id: telemetry }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.preferredWidth: 290
            Layout.fillHeight: true
            color: "#0C111A"
            ColumnLayout {
                anchors { fill: parent; margins: 28 }
                spacing: 12
                Text { text: "RXOS"; color: "#38D6FF"; font.pixelSize: 36; font.bold: true; Layout.bottomMargin: 30 }
                Repeater {
                    model: window.pages
                    delegate: Button {
                        required property string modelData
                        required property int index
                        Layout.fillWidth: true
                        Layout.preferredHeight: 70
                        text: modelData
                        highlighted: window.currentPage === index
                        onClicked: window.currentPage = index
                    }
                }
                Item { Layout.fillHeight: true }
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 50
                    radius: 25
                    color: telemetry.status === "LIVE" ? "#173B32" : "#5A1C28"
                    Text { anchors.centerIn: parent; text: telemetry.status; color: "white"; font.bold: true }
                }
            }
        }

        StackLayout {
            currentIndex: window.currentPage
            Layout.fillWidth: true
            Layout.fillHeight: true

            PagePanel {
                heading: "Navigation"
                subtitle: "Map and routing provider placeholder"
                Rectangle {
                    anchors { fill: parent; margins: 80 }
                    radius: 24; color: "#111722"; border.color: "#202B3D"
                    Text { anchors.centerIn: parent; text: "MAP\n\nContinue on simulated route  •  450 m"; horizontalAlignment: Text.AlignHCenter; color: "#F4F7FB"; font.pixelSize: 34 }
                }
            }
            PagePanel {
                heading: "Media"
                subtitle: "Local media session placeholder"
                Row {
                    anchors.centerIn: parent; spacing: 50
                    Rectangle { width: 330; height: 330; radius: 24; color: "#202B3D"; Text { anchors.centerIn: parent; text: "ALBUM\nART"; color: "#8C9AAF"; font.pixelSize: 40; horizontalAlignment: Text.AlignHCenter } }
                    Column { anchors.verticalCenter: parent.verticalCenter; spacing: 24; Text { text: "No media playing"; color: "#F4F7FB"; font.pixelSize: 46; font.bold: true }; Text { text: "Bluetooth and audio integration arrive in a later phase"; color: "#8C9AAF"; font.pixelSize: 24 }; Row { spacing: 20; Button { text: "◀" }; Button { text: "▶" }; Button { text: "▶▶" } } }
                }
            }
            PagePanel {
                heading: "Vehicle overview"
                subtitle: "Shared live telemetry"
                Grid {
                    anchors.centerIn: parent; columns: 3; spacing: 22
                    Repeater {
                        model: [["SPEED", Math.round(telemetry.data.speedKph) + " km/h"], ["ENGINE", Math.round(telemetry.data.rpm) + " rpm"], ["GEAR", telemetry.data.gear], ["FUEL", Math.round(telemetry.data.fuelPercent) + "%"], ["COOLANT", Math.round(telemetry.data.coolantTempC) + "°C"], ["BATTERY", telemetry.data.batteryVoltage.toFixed(1) + " V"]]
                        delegate: MetricCard { required property var modelData; label: modelData[0]; value: modelData[1] }
                    }
                }
            }
            PagePanel {
                heading: "Telemetry"
                subtitle: "Simulator source • 10 Hz target"
                Grid {
                    anchors.centerIn: parent; columns: 3; spacing: 22
                    Repeater {
                        model: [["RPM", Math.round(telemetry.data.rpm)], ["SPEED", telemetry.data.speedKph.toFixed(1) + " km/h"], ["THROTTLE", telemetry.data.throttlePercent.toFixed(1) + "%"], ["COOLANT", telemetry.data.coolantTempC.toFixed(1) + "°C"], ["OIL TEMP", telemetry.data.oilTempC.toFixed(1) + "°C"], ["OIL PRESS", Math.round(telemetry.data.oilPressureKpa) + " kPa"], ["FUEL", telemetry.data.fuelPercent.toFixed(1) + "%"], ["BATTERY", telemetry.data.batteryVoltage.toFixed(2) + " V"], ["GEAR", telemetry.data.gear]]
                        delegate: MetricCard { required property var modelData; label: modelData[0]; value: modelData[1] }
                    }
                }
            }
            PagePanel {
                heading: "Diagnostics"
                subtitle: "Display-only simulated status; not a factory diagnostic tool"
                Column {
                    anchors.centerIn: parent; spacing: 20
                    Repeater {
                        model: [["Check engine", telemetry.data.warnings.checkEngine], ["Coolant temperature", telemetry.data.warnings.coolantTemperature], ["Low fuel", telemetry.data.warnings.lowFuel], ["Low oil pressure", telemetry.data.warnings.lowOilPressure]]
                        delegate: Rectangle {
                            required property var modelData
                            width: 900; height: 90; radius: 16; color: "#111722"; border.color: modelData[1] ? "#FF4057" : "#202B3D"
                            RowLayout { anchors { fill: parent; margins: 24 }; Text { text: modelData[0]; color: "#F4F7FB"; font.pixelSize: 28; Layout.fillWidth: true }; Text { text: modelData[1] ? "SIMULATED WARNING" : "OK"; color: modelData[1] ? "#FF4057" : "#43E09D"; font.bold: true; font.pixelSize: 22 } }
                        }
                    }
                }
            }
            PagePanel {
                heading: "Settings"
                subtitle: "Desktop milestone settings are local UI placeholders"
                Column {
                    anchors.centerIn: parent; spacing: 26
                    Switch { text: "Metric units"; checked: true }
                    Switch { text: "High contrast instruments"; checked: true }
                    Switch { text: "Share simulated diagnostics"; checked: false }
                    Text { text: "Driver profile: Development"; color: "#F4F7FB"; font.pixelSize: 28 }
                    Text { text: "OTA updates are not configured"; color: "#8C9AAF"; font.pixelSize: 22 }
                }
            }
        }
    }

    component PagePanel: Item {
        property string heading
        property string subtitle
        Column {
            anchors { top: parent.top; left: parent.left; margins: 48 }
            Text { text: heading; color: "#F4F7FB"; font.pixelSize: 44; font.bold: true }
            Text { text: subtitle; color: "#8C9AAF"; font.pixelSize: 22 }
        }
    }

    component MetricCard: Rectangle {
        property string label
        property var value
        width: 360; height: 170; radius: 18; color: "#111722"; border.color: "#202B3D"
        Column {
            anchors.centerIn: parent; spacing: 14
            Text { anchors.horizontalCenter: parent.horizontalCenter; text: label; color: "#8C9AAF"; font.pixelSize: 18; font.letterSpacing: 2 }
            Text { anchors.horizontalCenter: parent.horizontalCenter; text: value; color: "#F4F7FB"; font.pixelSize: 38; font.bold: true }
        }
    }

    Rectangle {
        visible: telemetry.status !== "LIVE"
        anchors { top: parent.top; right: parent.right; margins: 24 }
        width: 420; height: 64; radius: 12; color: "#5A1C28"; z: 10
        Text { anchors.centerIn: parent; text: telemetry.status + " — VALUES NOT AUTHORITATIVE"; color: "white"; font.bold: true }
    }
}

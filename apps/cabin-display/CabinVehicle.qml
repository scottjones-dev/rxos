import QtQuick
import QtQuick.Layouts

Item {
    id: vehicle
    required property RxTokens theme
    required property var telemetry
    readonly property bool live: telemetry.status === "LIVE"

    GridLayout {
        anchors.fill: parent
        anchors.margins: vehicle.theme.safeMargin
        columns: 4
        rowSpacing: vehicle.theme.space4
        columnSpacing: vehicle.theme.space4
        Repeater {
            model: [
                ["Engine", vehicle.live ? Math.round(vehicle.telemetry.rpm) + " rpm" : "Unavailable", "Simulated telemetry"],
                ["Fuel", vehicle.live ? Math.round(vehicle.telemetry.fuelPercent) + "%" : "Unavailable", "Simulated telemetry"],
                ["Electrical", vehicle.live ? vehicle.telemetry.batteryVoltage.toFixed(1) + " V" : "Unavailable", "Simulated telemetry"],
                ["Tyres", "Unavailable", "Future input"],
                ["Doors", "Unavailable", "Future input"],
                ["Lighting", "Unavailable", "Future input"],
                ["Maintenance", "Unavailable", "No local store"],
                ["Authority", "Factory vehicle", "RXOS is secondary"]
            ]
            delegate: RxCard {
                id: vehicleSection
                required property var modelData
                Layout.fillWidth: true
                Layout.fillHeight: true
                theme: vehicle.theme
                heading: vehicleSection.modelData[0]
                subtitle: vehicleSection.modelData[2]
                RxText {
                    anchors.centerIn: parent
                    theme: vehicle.theme
                    text: vehicleSection.modelData[1]
                    font.pixelSize: vehicle.theme.textTitle
                    font.bold: true
                    color: vehicleSection.modelData[1] === "Unavailable"
                        ? vehicle.theme.unavailable : vehicle.theme.textPrimary
                }
            }
        }
    }
}


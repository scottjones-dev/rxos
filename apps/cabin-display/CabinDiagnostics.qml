import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: diagnostics
    required property RxTokens theme
    required property var telemetry
    GridLayout {
        anchors.fill: parent
        anchors.margins: diagnostics.theme.safeMargin
        columns: 2
        rowSpacing: diagnostics.theme.space3
        columnSpacing: diagnostics.theme.space3
        Repeater {
            model: [
                ["Connection", diagnostics.telemetry.status],
                ["Telemetry source", diagnostics.telemetry.telemetryState.source],
                ["Schema version", diagnostics.telemetry.telemetryState.schemaVersion || "—"],
                ["Accepted messages", diagnostics.telemetry.telemetryState.acceptedMessages],
                ["Message rate", "Observed by simulator"],
                ["Last valid timestamp", diagnostics.telemetry.telemetryState.capturedAtMs ? new Date(diagnostics.telemetry.telemetryState.capturedAtMs).toISOString() : "—"],
                ["Malformed frames", diagnostics.telemetry.invalidMessages],
                ["Dropped / lagged", diagnostics.telemetry.telemetryState.laggedMessages + " observed"],
                ["Simulator state", "Read-only simulated source"],
                ["Gateway controls", "None · diagnostics are read-only"]
            ]
            delegate: RxListItem {
                id: diagnosticItem
                required property var modelData
                Layout.fillWidth: true
                theme: diagnostics.theme
                title: diagnosticItem.modelData[0]
                trailing: diagnosticItem.modelData[1]
            }
        }
    }
}

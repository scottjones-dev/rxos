import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: home
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property DisplaySettings settings
    required property WarningModel warnings
    readonly property bool live: telemetry.status === "LIVE"

    GridLayout {
        anchors.fill: parent
        anchors.margins: home.theme.safeMargin
        columns: 3
        rowSpacing: home.theme.space4
        columnSpacing: home.theme.space4
        RxCard {
            Layout.fillWidth: true; Layout.fillHeight: true
            visible: home.settings.showNavigationWidget
            theme: home.theme; heading: "Navigation"; subtitle: "Placeholder"
            RxEmptyState { anchors.centerIn: parent; theme: home.theme; title: "Continue straight"; message: "450 m · simulated" }
        }
        RxCard {
            Layout.fillWidth: true; Layout.fillHeight: true
            visible: home.settings.showMediaWidget
            theme: home.theme; heading: "Media"; subtitle: "Placeholder"
            RxEmptyState { anchors.centerIn: parent; theme: home.theme; title: "No media"; message: "Provider unavailable" }
        }
        RxCard {
            Layout.fillWidth: true; Layout.fillHeight: true
            visible: home.settings.showHealthWidget
            theme: home.theme; heading: "Vehicle health"; subtitle: "Simulated telemetry"
            Column {
                anchors.centerIn: parent; spacing: home.theme.space3
                RxStatusChip { anchors.horizontalCenter: parent.horizontalCenter; theme: home.theme; text: home.warnings.activeWarnings.length + " ACTIVE"; severity: home.warnings.mostSevere.severity }
                RxText { theme: home.theme; text: home.live ? "Telemetry current" : "Values unavailable"; color: home.theme.textSecondary }
            }
        }
        RxCard {
            Layout.fillWidth: true; Layout.fillHeight: true
            visible: home.settings.showTripWidget
            theme: home.theme; heading: "Recent trip"; subtitle: "Placeholder"
            RxEmptyState { anchors.centerIn: parent; theme: home.theme; title: "No trip data"; message: "Trip storage is outside milestone 1.2" }
        }
        RxCard {
            Layout.fillWidth: true; Layout.fillHeight: true
            theme: home.theme; heading: "Fuel and range"; subtitle: "Range is a simulated estimate"
            Column {
                anchors.centerIn: parent; spacing: home.theme.space3
                RxText { anchors.horizontalCenter: parent.horizontalCenter; theme: home.theme; text: home.live ? home.formatter.fuel(home.telemetry.fuelPercent) : "—"; font.pixelSize: home.theme.textTitle; font.bold: true }
                RxText { anchors.horizontalCenter: parent.horizontalCenter; theme: home.theme; text: home.live ? "EST. " + home.formatter.distance(home.telemetry.fuelPercent * 3.2) : "UNAVAILABLE"; color: home.theme.textSecondary }
            }
        }
        RxCard {
            Layout.fillWidth: true; Layout.fillHeight: true
            theme: home.theme; heading: "Current telemetry"; subtitle: home.telemetry.status
            Grid {
                anchors.centerIn: parent; columns: 2; spacing: home.theme.space4
                RxText { theme: home.theme; text: home.live ? home.formatter.speed(home.telemetry.speedKph) : "—"; font.bold: true }
                RxText { theme: home.theme; text: home.live ? Math.round(home.telemetry.rpm) + " rpm" : "—"; font.bold: true }
                RxText { theme: home.theme; text: home.live ? "Gear " + home.telemetry.gear : "Gear —"; font.bold: true }
                RxText { theme: home.theme; text: home.live ? home.formatter.temperature(home.telemetry.coolantTempC) : "—"; font.bold: true }
            }
        }
    }
}

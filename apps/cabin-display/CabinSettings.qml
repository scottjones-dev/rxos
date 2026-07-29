import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: page
    required property RxTokens theme
    required property DisplaySettings settings
    Flickable {
        anchors.fill: parent
        contentHeight: settingsColumn.implicitHeight + page.theme.safeMargin * 2
        clip: true
        ColumnLayout {
            id: settingsColumn
            width: parent.width - page.theme.safeMargin * 2
            x: page.theme.safeMargin
            y: page.theme.safeMargin
            spacing: page.theme.space4
            RxText { theme: page.theme; text: "Visual settings · in memory only"; font.pixelSize: page.theme.textTitle; font.bold: true }
            RxText { theme: page.theme; text: "Theme"; color: page.theme.textSecondary }
            RowLayout {
                RxButton { theme: page.theme; text: "Day"; highlighted: page.settings.themeSelection === "day"; onClicked: page.settings.themeSelection = "day" }
                RxButton { theme: page.theme; text: "Night"; highlighted: page.settings.themeSelection === "night"; onClicked: page.settings.themeSelection = "night" }
                RxButton { theme: page.theme; text: "Automatic placeholder"; highlighted: page.settings.themeSelection === "automatic"; onClicked: page.settings.themeSelection = "automatic" }
            }
            RxText { theme: page.theme; text: "Display scale " + page.settings.displayScale.toFixed(2); color: page.theme.textSecondary }
            RxSlider { Layout.fillWidth: true; theme: page.theme; from: 0.8; to: 1.25; stepSize: 0.05; value: page.settings.displayScale; onMoved: page.settings.displayScale = value }
            RxToggle { theme: page.theme; text: "High contrast"; checked: page.settings.highContrast; onToggled: page.settings.highContrast = checked }
            RxToggle { theme: page.theme; text: "Reduced motion"; checked: page.settings.reducedMotion; onToggled: page.settings.reducedMotion = checked }
            RxToggle { theme: page.theme; text: "Navigation home widget"; checked: page.settings.showNavigationWidget; onToggled: page.settings.showNavigationWidget = checked }
            RxToggle { theme: page.theme; text: "Media home widget"; checked: page.settings.showMediaWidget; onToggled: page.settings.showMediaWidget = checked }
            RxToggle { theme: page.theme; text: "Vehicle-health home widget"; checked: page.settings.showHealthWidget; onToggled: page.settings.showHealthWidget = checked }
            RxToggle { theme: page.theme; text: "Recent-trip placeholder widget"; checked: page.settings.showTripWidget; onToggled: page.settings.showTripWidget = checked }
            RxToggle { theme: page.theme; text: "Deterministic demo data"; checked: page.settings.demoDataEnabled; onToggled: page.settings.demoDataEnabled = checked }
            RxText { theme: page.theme; text: "Driver display mode"; color: page.theme.textSecondary }
            RowLayout {
                Repeater {
                    model: ["Daily", "Performance", "Track"]
                    delegate: RxButton {
                        id: modeButton
                        required property string modelData
                        theme: page.theme
                        text: modeButton.modelData
                        highlighted: page.settings.driverMode === modeButton.modelData
                        onClicked: page.settings.driverMode = modeButton.modelData
                    }
                }
            }
            RxText { theme: page.theme; text: "Units: Metric (additional unit conversion is outside this milestone)"; color: page.theme.textSecondary }
        }
    }
}

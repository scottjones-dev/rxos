import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Rxos.DesignSystem

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
            y: page.theme.space5
            spacing: page.theme.space5

            RxPageHeader {
                Layout.fillWidth: true
                theme: page.theme
                eyebrow: "Preferences"
                title: "Settings"
                detail: "IN MEMORY ONLY"
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: page.theme.touchTarget
                radius: page.theme.radiusPill
                color: page.theme.surfaceRaised
                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: page.theme.space5
                    anchors.rightMargin: page.theme.space5
                    RxText {
                        theme: page.theme
                        text: "⌕"
                        color: page.theme.textTertiary
                        font.pixelSize: page.theme.textTitle
                    }
                    RxText {
                        Layout.fillWidth: true
                        theme: page.theme
                        text: "Search settings"
                        color: page.theme.textTertiary
                    }
                    RxText {
                        theme: page.theme
                        text: "UNAVAILABLE"
                        color: page.theme.unavailable
                        font.pixelSize: page.theme.textMicro
                    }
                }
            }

            RxCard {
                Layout.fillWidth: true
                Layout.preferredHeight: 176 * page.theme.scale
                theme: page.theme
                heading: "Appearance"
                subtitle: "Applied to both display previews"
                RowLayout {
                    anchors.fill: parent
                    spacing: page.theme.space3
                    RxButton {
                        theme: page.theme
                        text: "Day"
                        highlighted: page.settings.themeSelection === "day"
                        onClicked: page.settings.themeSelection = "day"
                    }
                    RxButton {
                        theme: page.theme
                        text: "Night"
                        highlighted: page.settings.themeSelection === "night"
                        onClicked: page.settings.themeSelection = "night"
                    }
                    RxButton {
                        theme: page.theme
                        text: "Automatic preview"
                        highlighted: page.settings.themeSelection === "automatic"
                        onClicked: page.settings.themeSelection = "automatic"
                    }
                    Item { Layout.fillWidth: true }
                    RxToggle {
                        theme: page.theme
                        text: "High contrast"
                        checked: page.settings.highContrast
                        onToggled: page.settings.highContrast = checked
                    }
                    RxToggle {
                        theme: page.theme
                        text: "Reduced motion"
                        checked: page.settings.reducedMotion
                        onToggled: page.settings.reducedMotion = checked
                    }
                }
            }

            RxCard {
                Layout.fillWidth: true
                Layout.preferredHeight: 168 * page.theme.scale
                theme: page.theme
                heading: "Driver display"
                subtitle: "Presentation mode"
                RowLayout {
                    anchors.fill: parent
                    spacing: page.theme.space3
                    Repeater {
                        model: [
                            ["Road", "Daily"],
                            ["Sport", "Performance"],
                            ["Track", "Track"]
                        ]
                        delegate: RxButton {
                            id: modeButton
                            required property var modelData
                            Layout.fillWidth: true
                            theme: page.theme
                            text: modeButton.modelData[0]
                            highlighted: page.settings.driverMode === modeButton.modelData[1]
                            onClicked: page.settings.driverMode = modeButton.modelData[1]
                        }
                    }
                }
            }

            RxCard {
                Layout.fillWidth: true
                Layout.preferredHeight: 260 * page.theme.scale
                theme: page.theme
                heading: "Home"
                subtitle: "Choose what appears on the welcome screen"
                GridLayout {
                    anchors.fill: parent
                    columns: 2
                    columnSpacing: page.theme.space6
                    RxToggle { theme: page.theme; text: "Navigation"; checked: page.settings.showNavigationWidget; onToggled: page.settings.showNavigationWidget = checked }
                    RxToggle { theme: page.theme; text: "Media"; checked: page.settings.showMediaWidget; onToggled: page.settings.showMediaWidget = checked }
                    RxToggle { theme: page.theme; text: "Vehicle health"; checked: page.settings.showHealthWidget; onToggled: page.settings.showHealthWidget = checked }
                    RxToggle { theme: page.theme; text: "Recent trip placeholder"; checked: page.settings.showTripWidget; onToggled: page.settings.showTripWidget = checked }
                }
            }

            RxText {
                Layout.fillWidth: true
                theme: page.theme
                text: "Vehicle integrations remain read-only. Factory controls and instrumentation are authoritative."
                color: page.theme.textTertiary
                wrapMode: Text.WordWrap
                font.pixelSize: page.theme.textCaption
            }
        }
    }
}

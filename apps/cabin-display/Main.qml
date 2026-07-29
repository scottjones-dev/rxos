import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    id: window

    DisplayProfiles { id: profile; profile: "cabin" }
    DisplaySettings { id: settings }
    RxTokens {
        id: visualTokens
        themeName: settings.resolvedTheme()
        highContrast: settings.highContrast
        reducedMotion: settings.reducedMotion
        scale: profile.scale * settings.displayScale
    }
    readonly property RxTokens theme: visualTokens
    TelemetryStore { id: telemetry }
    WarningModel {
        id: warningModel
        telemetryWarnings: telemetry.data.warnings
        timestamp: new Date(telemetry.telemetryState.capturedAtMs).toISOString()
    }

    width: profile.width
    height: profile.height
    visible: true
    color: theme.background
    title: "RXOS Cabin Display"
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    readonly property var applications: ["Home", "Navigation", "Media", "Vehicle", "Performance", "Diagnostics", "Settings"]
    NavigationState { id: navigation; destinationCount: window.applications.length }
    readonly property int currentApplication: navigation.currentIndex
    readonly property var navigationHistory: navigation.history

    function navigate(index) {
        navigation.navigate(index)
    }

    function goHome() {
        navigation.home()
    }

    function goBack() {
        navigation.back()
    }

    Shortcut { sequence: "Escape"; onActivated: window.goBack() }
    Shortcut { sequence: "Alt+Left"; onActivated: window.goBack() }
    Shortcut { sequence: "Ctrl+H"; onActivated: window.goHome() }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 96 * theme.scale
            color: theme.surface
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: theme.safeMargin
                anchors.rightMargin: theme.safeMargin
                spacing: theme.space4
                RxIconButton { theme: window.theme; iconText: "←"; enabled: window.currentApplication !== 0 || window.navigationHistory.length > 0; onClicked: window.goBack() }
                RxIconButton { theme: window.theme; iconText: "⌂"; onClicked: window.goHome() }
                RxText {
                    theme: window.theme
                    text: window.applications[window.currentApplication]
                    font.pixelSize: theme.textTitle
                    font.bold: true
                }
                Item { Layout.fillWidth: true }
                RxText { theme: window.theme; text: "SIMULATED · READ ONLY"; color: theme.textSecondary; font.pixelSize: theme.textCaption }
                RxStatusChip {
                    theme: window.theme
                    text: telemetry.status
                    severity: telemetry.status === "LIVE" ? "Information" : "Caution"
                }
            }
        }

        StackLayout {
            currentIndex: window.currentApplication
            Layout.fillWidth: true
            Layout.fillHeight: true
            CabinHome { theme: window.theme; telemetry: telemetry; settings: settings; warnings: warningModel }
            CabinPlaceholder { theme: window.theme; title: "Navigation"; message: "Map rendering and route guidance are unavailable in this milestone."; symbol: "↑" }
            CabinPlaceholder { theme: window.theme; title: "Media"; message: "No media provider is connected. Playback controls are visual placeholders."; symbol: "♪" }
            CabinVehicle { theme: window.theme; telemetry: telemetry }
            CabinPerformance { theme: window.theme; telemetry: telemetry }
            CabinDiagnostics { theme: window.theme; telemetry: telemetry }
            CabinSettings { theme: window.theme; settings: settings }
        }

        RxNavigationRail {
            Layout.fillWidth: true
            Layout.preferredHeight: 108 * theme.scale
            Layout.leftMargin: theme.space4
            Layout.rightMargin: theme.space4
            Layout.bottomMargin: theme.space4
            theme: window.theme
            destinations: window.applications
            currentIndex: window.currentApplication
            vertical: false
            onActivated: index => window.navigate(index)
        }
    }

    RxWarningBanner {
        anchors {
            top: parent.top
            topMargin: 108 * theme.scale
            horizontalCenter: parent.horizontalCenter
        }
        width: Math.min(parent.width - theme.safeMargin * 2, 1100 * theme.scale)
        z: 100
        visible: warningModel.activeWarnings.length > 0 && telemetry.status === "LIVE"
        theme: window.theme
        severity: warningModel.mostSevere.severity
        title: warningModel.mostSevere.title + " · SIMULATED"
        message: warningModel.mostSevere.message
    }
}

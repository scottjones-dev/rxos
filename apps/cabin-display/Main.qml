import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Rxos.DesignSystem

ApplicationWindow {
    id: window

    DisplayProfiles { id: profile; profile: "cabin" }
    DisplaySettings { id: settings }
    RxStrings { id: strings; localeName: profile.option("--locale") || "en-GB" }
    PresentationFormatter {
        id: formatter
        localeName: strings.localeName
        unitsProfile: profile.option("--units") || "metric"
    }
    RxTokens {
        id: visualTokens
        themeName: settings.resolvedTheme()
        highContrast: settings.highContrast
        reducedMotion: settings.reducedMotion
        scale: profile.scale * settings.displayScale
    }
    readonly property RxTokens theme: visualTokens
    TelemetryStore {
        id: telemetry
        endpoint: profile.option("--telemetry-endpoint") || "ws://127.0.0.1:8787/telemetry"
        acceptEvery: Number(profile.option("--accept-every") || 1)
    }
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
    LayoutMirroring.enabled: strings.rightToLeft
    LayoutMirroring.childrenInherit: true
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    readonly property int acceptedMessages: telemetry.acceptedMessages
    readonly property int receivedMessages: telemetry.receivedMessages
    readonly property int laggedMessages: telemetry.laggedMessages
    readonly property double lastSequence: telemetry.lastSequence
    readonly property int chartSampleCount: performancePage.sampleCount
    readonly property string requestedScenario: profile.option("--visual-scenario") || ""
    readonly property bool visualReady: requestedScenario.length === 0 || visualScenario.ready
    readonly property var applications: [
        strings.home,
        strings.navigation,
        strings.media,
        strings.vehicle,
        strings.performance,
        strings.diagnostics,
        strings.settings
    ]
    NavigationState { id: navigation; destinationCount: window.applications.length }
    readonly property int currentApplication: navigation.currentIndex
    readonly property var navigationHistory: navigation.history
    VisualScenario {
        id: visualScenario
        telemetry: telemetry
        settings: settings
        navigation: navigation
        active: window.requestedScenario.length > 0
        scenario: window.requestedScenario || "home"
        driver: false
    }

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
                RxText { theme: window.theme; text: strings.simulatedSecondary; color: theme.textSecondary; font.pixelSize: theme.textCaption }
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
            CabinHome { theme: window.theme; telemetry: telemetry; formatter: formatter; settings: settings; warnings: warningModel }
            CabinPlaceholder { theme: window.theme; title: strings.navigation; message: qsTr("Map rendering and route guidance are unavailable in this milestone."); symbol: "↑" }
            CabinPlaceholder { theme: window.theme; title: strings.media; message: qsTr("No media provider is connected. Playback controls are visual placeholders."); symbol: "♪" }
            CabinVehicle { theme: window.theme; telemetry: telemetry }
            CabinPerformance { id: performancePage; theme: window.theme; telemetry: telemetry; formatter: formatter }
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

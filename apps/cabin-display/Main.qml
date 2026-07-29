import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Rxos.DesignSystem

ApplicationWindow {
    id: window

    DisplayProfiles { id: profile; profile: "cabin" }
    DisplaySettings { id: settings }
    BrightnessModel {
        id: brightness
        manualLevel: Number(profile.option("--cabin-brightness") || 0.8)
        ambientLevel: Number(profile.option("--ambient-level") || 1)
        automatic: profile.hasFlag("--automatic-theme")
        onThemeNameChanged: settings.themeSelection = themeName
    }
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
    readonly property DisplaySettings appSettings: settings
    readonly property PresentationFormatter appFormatter: formatter
    TelemetryStore {
        id: telemetry
        endpoint: profile.option("--telemetry-endpoint") || "ws://127.0.0.1:8787/telemetry"
        acceptEvery: Number(profile.option("--accept-every") || 1)
    }
    PresentationTelemetry {
        id: presentationTelemetry
        source: telemetry
        maximumHz: Number(profile.option("--presentation-hz") || 30)
    }
    readonly property TelemetryStore rawTelemetry: telemetry
    readonly property PresentationTelemetry displayTelemetry: presentationTelemetry
    BoundedHistory {
        id: rpmHistory
        capacity: 600
        downsampleEvery: Math.max(1,
            Math.round(Number(profile.option("--source-hz") || 60) / 10))
        publishEvery: 2
        maximumRenderedPoints: 240
    }
    Connections {
        target: telemetry.telemetryState
        function onDataChanged() {
            if (window.currentApplication === 4)
                rpmHistory.append(Date.now(), telemetry.rpm,
                    telemetry.status === "LIVE")
        }
    }
    WarningModel {
        id: warningModel
        telemetryWarnings: telemetry.data.warnings
        timestamp: new Date(telemetry.telemetryState.capturedAtMs).toISOString()
    }
    readonly property WarningModel appWarnings: warningModel

    width: profile.width
    height: profile.height
    visible: !profile.nativePlacement
    color: theme.background
    title: "RXOS Cabin Display"
    PhysicalReviewOverlay {
        anchors.fill: parent
        reviewEnabled: profile.physicalReview
        safeInset: Number(profile.option("--review-safe-inset") || profile.safeMargin)
        physicalWidthMm: Number(profile.option("--physical-width-mm") || 0)
        physicalHeightMm: Number(profile.option("--physical-height-mm") || 0)
        showTouchReach: true
    }
    Rectangle {
        anchors.fill: parent
        z: 9000
        visible: profile.brightnessSimulation
        enabled: false
        color: "#000000"
        opacity: (1 - brightness.effectiveLevel) * 0.75
    }
    RotaryController {
        id: rotary
        focusCount: window.applications.length
        onActivated: index => window.navigate(index)
        onBackRequested: window.goBack()
        onHomeRequested: window.goHome()
    }
    Shortcut { sequence: "Right"; onActivated: rotary.dispatch("clockwise", "cabin") }
    Shortcut { sequence: "Left"; onActivated: rotary.dispatch("anticlockwise", "cabin") }
    Shortcut { sequence: "Return"; onActivated: rotary.dispatch("press", "cabin") }
    Shortcut {
        sequence: "Ctrl+]"
        onActivated: brightness.manualLevel = Math.min(1,
            brightness.manualLevel + 0.05)
    }
    Shortcut {
        sequence: "Ctrl+["
        onActivated: brightness.manualLevel = Math.max(0,
            brightness.manualLevel - 0.05)
    }
    LayoutMirroring.enabled: strings.rightToLeft
    LayoutMirroring.childrenInherit: true
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    readonly property int acceptedMessages: telemetry.acceptedMessages
    readonly property int receivedMessages: telemetry.receivedMessages
    readonly property int laggedMessages: telemetry.laggedMessages
    readonly property double lastSequence: telemetry.lastSequence
    readonly property int chartSampleCount: rpmHistory.length
    readonly property int chartPublishedCount: rpmHistory.publishedCount
    readonly property int chartRenderedPointCount: rpmHistory.values.length
    readonly property int presentationUpdateCount: presentationTelemetry.publicationCount
    readonly property int presentationReplacementCount: presentationTelemetry.replacedPendingCount
    readonly property int loadedPageCount:
        (homeLoader.item ? 1 : 0)
        + (navigationLoader.item ? 1 : 0)
        + (mediaLoader.item ? 1 : 0)
        + (vehicleLoader.item ? 1 : 0)
        + (performanceLoader.item ? 1 : 0)
        + (diagnosticsLoader.item ? 1 : 0)
        + (settingsLoader.item ? 1 : 0)
    readonly property int hiddenWorkCount: Math.max(0, loadedPageCount - 1)
    property int profileEventSequence: 0
    property string profileEventName: "qml-ready"
    readonly property string requestedScenario: profile.option("--visual-scenario") || ""
    readonly property string requestedProfileScenario: profile.option("--profile-scenario") || "home"
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
    Connections {
        target: visualScenario
        function onReadyChanged() {
            if (visualScenario.ready)
                presentationTelemetry.publishLatest()
        }
    }

    function navigate(index) {
        markProfileEvent("page-transition")
        navigation.navigate(index)
    }

    function markProfileEvent(name) {
        profileEventName = name
        profileEventSequence += 1
    }

    Connections {
        target: rpmHistory
        function onPublishedCountChanged() {
            window.markProfileEvent("chart-refresh")
        }
    }
    Connections {
        target: settings
        function onThemeSelectionChanged() { window.markProfileEvent("theme-change") }
    }
    Connections {
        target: warningModel
        function onActiveWarningsChanged() { window.markProfileEvent("warning-overlay") }
    }

    function goHome() {
        navigation.home()
    }

    function goBack() {
        navigation.back()
    }

    Component.onCompleted: {
        brightness.updateAmbient(brightness.ambientLevel)
        if (requestedProfileScenario === "performance")
            navigate(4)
        else
            navigate(0)
    }

    Timer {
        property int pageIndex: 0
        interval: 1000
        repeat: true
        running: window.requestedProfileScenario === "page-switch"
        onTriggered: {
            const pages = [0, 3, 4, 5]
            pageIndex = (pageIndex + 1) % pages.length
            window.navigate(pages[pageIndex])
        }
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
            Loader {
                id: homeLoader
                active: window.currentApplication === 0
                sourceComponent: CabinHome {
                    theme: window.theme
                    telemetry: window.displayTelemetry
                    formatter: window.appFormatter
                    settings: window.appSettings
                    warnings: window.appWarnings
                }
            }
            Loader {
                id: navigationLoader
                active: window.currentApplication === 1
                sourceComponent: CabinPlaceholder {
                    theme: window.theme
                    title: strings.navigation
                    message: qsTr("Map rendering and route guidance are unavailable in this milestone.")
                    symbol: "↑"
                }
            }
            Loader {
                id: mediaLoader
                active: window.currentApplication === 2
                sourceComponent: CabinPlaceholder {
                    theme: window.theme
                    title: strings.media
                    message: qsTr("No media provider is connected. Playback controls are visual placeholders.")
                    symbol: "♪"
                }
            }
            Loader {
                id: vehicleLoader
                active: window.currentApplication === 3
                sourceComponent: CabinVehicle {
                    theme: window.theme
                    telemetry: window.displayTelemetry
                }
            }
            Loader {
                id: performanceLoader
                active: window.currentApplication === 4
                sourceComponent: CabinPerformance {
                    theme: window.theme
                    telemetry: window.displayTelemetry
                    formatter: window.appFormatter
                    history: rpmHistory
                }
            }
            Loader {
                id: diagnosticsLoader
                active: window.currentApplication === 5
                sourceComponent: CabinDiagnostics {
                    theme: window.theme
                    telemetry: window.rawTelemetry
                }
            }
            Loader {
                id: settingsLoader
                active: window.currentApplication === 6
                sourceComponent: CabinSettings {
                    theme: window.theme
                    settings: window.appSettings
                }
            }
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

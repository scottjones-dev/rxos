import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Rxos.DesignSystem

ApplicationWindow {
    id: window

    DisplayProfiles { id: profile; profile: "driver" }
    DisplaySettings { id: settings }
    BrightnessModel {
        id: brightness
        manualLevel: Number(profile.option("--driver-brightness") || 0.8)
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
    DriverModeState { id: modeState; mode: settings.driverMode }
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
    PresentationTelemetry {
        id: presentationTelemetry
        source: telemetry
        maximumHz: Number(profile.option("--presentation-hz") || 30)
    }
    WarningModel {
        id: warningModel
        telemetryWarnings: telemetry.data.warnings
        timestamp: new Date(telemetry.telemetryState.capturedAtMs).toISOString()
    }

    width: profile.width
    height: profile.height
    visible: !profile.nativePlacement
    color: theme.background
    title: "RXOS Driver Display"
    PhysicalReviewOverlay {
        anchors.fill: parent
        reviewEnabled: profile.physicalReview
        safeInset: Number(profile.option("--review-safe-inset") || profile.safeMargin)
        physicalWidthMm: Number(profile.option("--physical-width-mm") || 0)
        physicalHeightMm: Number(profile.option("--physical-height-mm") || 0)
        wheelDiameter: Number(profile.option("--wheel-diameter-px") || 0)
        wheelCentreX: Number(profile.option("--wheel-centre-x-px") || window.width / 2)
        wheelCentreY: Number(profile.option("--wheel-centre-y-px") || window.height)
    }
    Rectangle {
        anchors.fill: parent
        z: 9000
        visible: profile.brightnessSimulation
        enabled: false
        color: "#000000"
        opacity: (1 - brightness.effectiveLevel) * 0.75
    }
    LayoutMirroring.enabled: strings.rightToLeft
    LayoutMirroring.childrenInherit: true
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    readonly property int acceptedMessages: telemetry.acceptedMessages
    readonly property int receivedMessages: telemetry.receivedMessages
    readonly property int laggedMessages: telemetry.laggedMessages
    readonly property double lastSequence: telemetry.lastSequence
    readonly property int chartSampleCount: 0
    readonly property int chartPublishedCount: 0
    readonly property int chartRenderedPointCount: 0
    readonly property int presentationUpdateCount: presentationTelemetry.publicationCount
    readonly property int presentationReplacementCount: presentationTelemetry.replacedPendingCount
    readonly property int hiddenWorkCount: 0
    readonly property string requestedScenario: profile.option("--visual-scenario") || ""
    readonly property string requestedProfileScenario: profile.option("--profile-scenario") || "daily"
    readonly property bool visualReady: requestedScenario.length === 0 || visualScenario.ready
    readonly property bool live: telemetry.status === "LIVE"
    property int profileEventSequence: 0
    property string profileEventName: "qml-ready"
    readonly property string profileWarningSignature:
        warningModel.activeWarnings.map(item => item.identifier).join(",")
    onProfileWarningSignatureChanged: markProfileEvent("warning-overlay")
    readonly property string currentMode: settings.driverMode
    VisualScenario {
        id: visualScenario
        telemetry: telemetry
        settings: settings
        active: window.requestedScenario.length > 0
        scenario: window.requestedScenario || "normal"
        driver: true
    }
    Connections {
        target: visualScenario
        function onReadyChanged() {
            if (visualScenario.ready)
                presentationTelemetry.publishLatest()
        }
    }

    function setMode(mode) {
        if (modeState.select(mode)) {
            settings.driverMode = mode
            markProfileEvent("driver-mode-" + mode.toLowerCase())
        }
    }

    function markProfileEvent(name) {
        profileEventName = name
        profileEventSequence += 1
    }

    Connections {
        target: settings
        function onThemeSelectionChanged() { window.markProfileEvent("theme-change") }
    }
    Component.onCompleted: {
        brightness.updateAmbient(brightness.ambientLevel)
        if (requestedProfileScenario === "performance")
            setMode("Performance")
        else if (requestedProfileScenario === "track")
            setMode("Track")
        else
            setMode("Daily")
    }

    Timer {
        property int demoIndex: 0
        interval: 1600
        repeat: true
        running: Qt.application.arguments.includes("--demo-cycle")
        onTriggered: {
            demoIndex = (demoIndex + 1) % modeState.modes.length
            window.setMode(modeState.modes[demoIndex])
        }
    }

    Shortcut { sequence: "1"; onActivated: window.setMode("Daily") }
    Shortcut { sequence: "2"; onActivated: window.setMode("Performance") }
    Shortcut { sequence: "3"; onActivated: window.setMode("Track") }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: theme.safeMargin
        spacing: theme.space4

        RowLayout {
            Layout.fillWidth: true
            Layout.preferredHeight: 44 * theme.scale
            spacing: theme.space4
            RxText {
                theme: window.theme
                text: "RXOS"
                color: theme.accent
                font.pixelSize: theme.textTitle
                font.bold: true
            }
            RxStatusChip {
                theme: window.theme
                text: window.currentMode.toUpperCase()
                severity: "Information"
            }
            Item { Layout.fillWidth: true }
            RxText {
                theme: window.theme
                text: strings.simulatedSecondary
                color: theme.textSecondary
                font.pixelSize: theme.textCaption
            }
            RxStatusChip {
                theme: window.theme
                text: telemetry.status
                severity: window.live ? "Information" : "Caution"
            }
        }

        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true

            DriverDaily {
                anchors.fill: parent
                visible: window.currentMode === "Daily"
                theme: window.theme
                telemetry: presentationTelemetry
                formatter: formatter
                live: window.live
            }
            DriverPerformance {
                anchors.fill: parent
                visible: window.currentMode === "Performance"
                theme: window.theme
                telemetry: presentationTelemetry
                formatter: formatter
                live: window.live
            }
            DriverTrack {
                anchors.fill: parent
                visible: window.currentMode === "Track"
                theme: window.theme
                telemetry: presentationTelemetry
                formatter: formatter
                live: window.live
            }
        }

        RxWarningBanner {
            Layout.fillWidth: true
            visible: warningModel.activeWarnings.length > 0 && window.live
            theme: window.theme
            severity: warningModel.mostSevere.severity
            title: warningModel.mostSevere.title + " · SIMULATED"
            message: warningModel.mostSevere.message
        }

        RxWarningBanner {
            Layout.fillWidth: true
            visible: !window.live
            theme: window.theme
            severity: "Caution"
            title: telemetry.status === "STALE"
                ? strings.telemetryStale
                : strings.telemetryUnavailable
            message: strings.factoryAuthority
        }
    }
}

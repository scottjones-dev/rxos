import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Rxos.DesignSystem

ApplicationWindow {
    id: window

    DisplayProfiles { id: profile; profile: "driver" }
    DisplaySettings { id: settings }
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
    WarningModel {
        id: warningModel
        telemetryWarnings: telemetry.data.warnings
        timestamp: new Date(telemetry.telemetryState.capturedAtMs).toISOString()
    }

    width: profile.width
    height: profile.height
    visible: true
    color: theme.background
    title: "RXOS Driver Display"
    LayoutMirroring.enabled: strings.rightToLeft
    LayoutMirroring.childrenInherit: true
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    readonly property int acceptedMessages: telemetry.acceptedMessages
    readonly property int receivedMessages: telemetry.receivedMessages
    readonly property int laggedMessages: telemetry.laggedMessages
    readonly property double lastSequence: telemetry.lastSequence
    readonly property int chartSampleCount: 0
    readonly property string requestedScenario: profile.option("--visual-scenario") || ""
    readonly property bool visualReady: requestedScenario.length === 0 || visualScenario.ready
    readonly property bool live: telemetry.status === "LIVE"
    readonly property string currentMode: settings.driverMode
    VisualScenario {
        id: visualScenario
        telemetry: telemetry
        settings: settings
        active: window.requestedScenario.length > 0
        scenario: window.requestedScenario || "normal"
        driver: true
    }

    function setMode(mode) {
        if (modeState.select(mode))
            settings.driverMode = mode
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
                telemetry: telemetry
                formatter: formatter
                live: window.live
            }
            DriverPerformance {
                anchors.fill: parent
                visible: window.currentMode === "Performance"
                theme: window.theme
                telemetry: telemetry
                formatter: formatter
                live: window.live
            }
            DriverTrack {
                anchors.fill: parent
                visible: window.currentMode === "Track"
                theme: window.theme
                telemetry: telemetry
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

import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    id: window

    DisplayProfiles { id: profile; profile: "driver" }
    DisplaySettings { id: settings }
    DriverModeState { id: modeState; mode: settings.driverMode }
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
    title: "RXOS Driver Display"
    readonly property bool reliabilityComplete: telemetry.reliabilityComplete
    readonly property bool live: telemetry.status === "LIVE"
    readonly property string currentMode: settings.driverMode

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
                text: "SIMULATED · SECONDARY DISPLAY"
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
                live: window.live
            }
            DriverPerformance {
                anchors.fill: parent
                visible: window.currentMode === "Performance"
                theme: window.theme
                telemetry: telemetry
                live: window.live
            }
            DriverTrack {
                anchors.fill: parent
                visible: window.currentMode === "Track"
                theme: window.theme
                telemetry: telemetry
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
                ? "Telemetry stale"
                : "Telemetry unavailable"
            message: "Live values are withheld. Use the vehicle's factory instruments."
        }
    }
}

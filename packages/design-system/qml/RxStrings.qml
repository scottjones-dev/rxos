import QtQuick

QtObject {
    property string localeName: "en-GB"
    readonly property bool rightToLeft: localeName === "ar-XB"

    readonly property string home: qsTrId("rxos.home")
    readonly property string navigation: qsTrId("rxos.navigation")
    readonly property string media: qsTrId("rxos.media")
    readonly property string vehicle: qsTrId("rxos.vehicle")
    readonly property string performance: qsTrId("rxos.performance")
    readonly property string diagnostics: qsTrId("rxos.diagnostics")
    readonly property string settings: qsTrId("rxos.settings")
    readonly property string simulatedSecondary: qsTrId("rxos.simulated-secondary")
    readonly property string telemetryStale: qsTrId("rxos.telemetry-stale")
    readonly property string telemetryUnavailable: qsTrId("rxos.telemetry-unavailable")
    readonly property string factoryAuthority: qsTrId("rxos.factory-authority")
    readonly property string unavailable: qsTrId("rxos.unavailable")
    readonly property string placeholder: qsTrId("rxos.placeholder")
    readonly property string reducedMotion: qsTrId("rxos.reduced-motion")
    readonly property string highContrast: qsTrId("rxos.high-contrast")
}


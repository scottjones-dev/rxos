import QtQuick

QtObject {
    property real manualLevel: 0.8
    property real ambientLevel: 1
    property real minimumLevel: 0.15
    property real maximumLevel: 1
    property real nightThreshold: 0.25
    property real dayThreshold: 0.4
    property bool automatic: false
    property string themeName: "day"
    readonly property real effectiveLevel: Math.max(minimumLevel,
        Math.min(maximumLevel, manualLevel))

    function updateAmbient(value) {
        ambientLevel = Math.max(0, Math.min(1, value))
        if (!automatic)
            return
        if (themeName === "day" && ambientLevel <= nightThreshold)
            themeName = "night"
        else if (themeName === "night" && ambientLevel >= dayThreshold)
            themeName = "day"
    }
}

import QtQuick

QtObject {
    id: profiles

    property string profile: "driver"
    property var arguments: Qt.application.arguments
    readonly property int defaultWidth: profile === "driver" ? 2560 : 1920
    readonly property int defaultHeight: profile === "driver" ? 720 : 1080
    readonly property real defaultDensity: 170
    readonly property int width: integerOption("--width", defaultWidth, 640, 7680)
    readonly property int height: integerOption("--height", defaultHeight, 360, 4320)
    readonly property real density: realOption("--density", defaultDensity, 72, 600)
    readonly property real scale: realOption("--scale", 1.0, 0.75, 2.0)
    readonly property bool touchEnabled: profile === "cabin"
    readonly property int safeMargin: Math.round(48 * scale)

    function option(name) {
        const index = arguments.indexOf(name)
        return index >= 0 && index + 1 < arguments.length
            ? arguments[index + 1]
            : undefined
    }

    function integerOption(name, fallback, minimum, maximum) {
        const value = Number(option(name))
        return Number.isInteger(value) && value >= minimum && value <= maximum
            ? value
            : fallback
    }

    function realOption(name, fallback, minimum, maximum) {
        const value = Number(option(name))
        return isFinite(value) && value >= minimum && value <= maximum
            ? value
            : fallback
    }
}


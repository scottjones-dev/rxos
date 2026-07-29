import QtQuick

QtObject {
    id: tokens

    property string themeName: "night"
    property bool highContrast: false
    property bool reducedMotion: false
    property real scale: 1.0

    readonly property bool day: themeName === "day"
    readonly property color background: day ? "#EDF2F5" : "#070A0F"
    readonly property color surface: day ? "#FFFFFF" : "#101722"
    readonly property color surfaceRaised: day ? "#E3EAF0" : "#172130"
    readonly property color border: highContrast
        ? (day ? "#17212B" : "#DCE9F3")
        : (day ? "#B8C5CF" : "#263447")
    readonly property color textPrimary: day ? "#101820" : "#F4F7FB"
    readonly property color textSecondary: highContrast
        ? textPrimary
        : (day ? "#52616D" : "#9AA9B8")
    readonly property color accent: day ? "#006D87" : "#38D6FF"
    readonly property color positive: day ? "#08784F" : "#43E09D"
    readonly property color information: accent
    readonly property color advisory: day ? "#6A55C9" : "#A99AFF"
    readonly property color caution: day ? "#8A5600" : "#FFB020"
    readonly property color critical: day ? "#B00020" : "#FF4057"
    readonly property color unavailable: day ? "#6E7C87" : "#708090"

    readonly property int space1: Math.round(4 * scale)
    readonly property int space2: Math.round(8 * scale)
    readonly property int space3: Math.round(12 * scale)
    readonly property int space4: Math.round(16 * scale)
    readonly property int space5: Math.round(24 * scale)
    readonly property int space6: Math.round(32 * scale)
    readonly property int space7: Math.round(48 * scale)
    readonly property int radiusSmall: Math.round(8 * scale)
    readonly property int radiusMedium: Math.round(14 * scale)
    readonly property int radiusLarge: Math.round(22 * scale)
    readonly property int iconSmall: Math.round(20 * scale)
    readonly property int iconMedium: Math.round(28 * scale)
    readonly property int iconLarge: Math.round(40 * scale)
    readonly property int touchTarget: Math.round(56 * scale)
    readonly property int safeMargin: Math.round(48 * scale)
    readonly property int textCaption: Math.round(14 * scale)
    readonly property int textBody: Math.round(18 * scale)
    readonly property int textTitle: Math.round(28 * scale)
    readonly property int textDisplay: Math.round(64 * scale)
    readonly property int motionImmediate: 0
    readonly property int motionFast: reducedMotion ? 0 : 100
    readonly property int motionStandard: reducedMotion ? 0 : 180
    readonly property int motionDeliberate: reducedMotion ? 0 : 280

    function severityColor(severity) {
        if (severity === "Critical") return critical
        if (severity === "Caution") return caution
        if (severity === "Advisory") return advisory
        return information
    }
}


import QtQuick

QtObject {
    property string themeSelection: "night"
    property real displayScale: 1.0
    property string units: "metric"
    property string driverMode: "Daily"
    property bool showNavigationWidget: true
    property bool showMediaWidget: true
    property bool showHealthWidget: true
    property bool showTripWidget: true
    property bool reducedMotion: false
    property bool highContrast: false
    property bool demoDataEnabled: true

    function resolvedTheme() {
        return themeSelection === "day" ? "day" : "night"
    }
}


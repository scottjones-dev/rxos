import QtQuick

Item {
    id: gauge
    property RxTokens theme: RxTokens {}
    property real value: 0
    property real minimum: 0
    property real maximum: 100
    property string label: ""
    property string unit: ""
    property bool available: true
    property color accentColor: theme.accent
    implicitWidth: 360 * theme.scale
    implicitHeight: 180 * theme.scale
    Column {
        anchors.fill: parent
        spacing: gauge.theme.space3
        RxText {
            anchors.horizontalCenter: parent.horizontalCenter
            theme: gauge.theme
            text: gauge.available ? Math.round(gauge.value).toString() : "—"
            font.pixelSize: gauge.theme.textDisplay
            font.bold: true
        }
        RxText {
            anchors.horizontalCenter: parent.horizontalCenter
            theme: gauge.theme
            text: gauge.label + (gauge.available && gauge.unit ? " · " + gauge.unit : "")
            color: gauge.theme.textSecondary
        }
        RxProgressBar {
            width: parent.width
            theme: gauge.theme
            value: gauge.available
                ? (gauge.value - gauge.minimum) / (gauge.maximum - gauge.minimum)
                : 0
            accentColor: gauge.accentColor
        }
    }
}


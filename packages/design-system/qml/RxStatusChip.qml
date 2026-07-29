import QtQuick

Rectangle {
    id: chip
    property RxTokens theme: RxTokens {}
    property string text: ""
    property string severity: "Information"
    implicitWidth: label.implicitWidth + theme.space5
    implicitHeight: 36 * theme.scale
    radius: height / 2
    color: Qt.alpha(theme.severityColor(severity), 0.14)
    border.color: "transparent"
    border.width: 0
    RxText {
        id: label
        anchors.centerIn: parent
        theme: chip.theme
        text: chip.text
        color: chip.theme.severityColor(chip.severity)
        font.pixelSize: chip.theme.textMicro
        font.bold: true
        font.letterSpacing: 1.1 * chip.theme.scale
    }
}

import QtQuick

Rectangle {
    property RxTokens theme: RxTokens {}
    property string heading: ""
    property string subtitle: ""
    default property alias content: body.data
    radius: theme.radiusLarge
    color: theme.surface
    border.color: theme.border
    border.width: 1
    implicitWidth: 320 * theme.scale
    implicitHeight: 190 * theme.scale

    Column {
        anchors.fill: parent
        anchors.margins: theme.space5
        spacing: theme.space3
        RxText {
            theme: parent.parent.theme
            text: parent.parent.heading
            font.pixelSize: parent.parent.theme.textTitle
            font.bold: true
            visible: text.length > 0
        }
        RxText {
            theme: parent.parent.theme
            text: parent.parent.subtitle
            color: parent.parent.theme.textSecondary
            visible: text.length > 0
        }
        Item {
            id: body
            width: parent.width
            height: Math.max(0, parent.height - y)
        }
    }
}


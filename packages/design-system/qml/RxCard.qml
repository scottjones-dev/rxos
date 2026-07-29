import QtQuick

Rectangle {
    id: card
    property RxTokens theme: RxTokens {}
    property string heading: ""
    property string subtitle: ""
    property color accentColor: "transparent"
    property bool outlined: false
    default property alias content: body.data
    radius: theme.radiusPanel
    color: theme.surfaceGlass
    border.color: outlined ? theme.border : "transparent"
    border.width: outlined ? 1 : 0
    implicitWidth: 320 * theme.scale
    implicitHeight: 190 * theme.scale

    Column {
        anchors.fill: parent
        anchors.margins: theme.space6
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

    Rectangle {
        visible: card.accentColor.a > 0
        anchors.left: parent.left
        anchors.leftMargin: card.theme.space6
        anchors.bottom: parent.bottom
        anchors.bottomMargin: card.theme.space5
        width: 40 * card.theme.scale
        height: 3 * card.theme.scale
        radius: height / 2
        color: card.accentColor
    }
}

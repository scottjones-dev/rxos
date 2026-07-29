import QtQuick

Rectangle {
    property RxTokens theme: RxTokens {}
    property bool focused: false
    anchors.fill: parent
    anchors.margins: -theme.space1
    radius: theme.radiusMedium
    color: "transparent"
    border.width: focused ? 3 : 0
    border.color: theme.accent
    visible: focused
}


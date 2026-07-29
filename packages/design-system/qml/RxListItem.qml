import QtQuick

Rectangle {
    id: item
    property RxTokens theme: RxTokens {}
    property string title: ""
    property string subtitle: ""
    property string trailing: ""
    signal activated()
    implicitWidth: 520 * theme.scale
    implicitHeight: Math.max(theme.touchTarget, 72 * theme.scale)
    radius: theme.radiusLarge
    color: activeFocus ? theme.surfaceRaised : "transparent"
    border.color: "transparent"
    border.width: 0
    activeFocusOnTab: true
    Keys.onReturnPressed: item.activated()
    Keys.onSpacePressed: item.activated()
    MouseArea { anchors.fill: parent; onClicked: item.activated() }
    Row {
        anchors.fill: parent
        anchors.margins: item.theme.space4
        spacing: item.theme.space4
        Column {
            width: parent.width - trailingLabel.implicitWidth - parent.spacing
            RxText { theme: item.theme; text: item.title; font.weight: Font.DemiBold }
            RxText { theme: item.theme; text: item.subtitle; color: item.theme.textSecondary; font.pixelSize: item.theme.textCaption }
        }
        RxText { id: trailingLabel; theme: item.theme; text: item.trailing; color: item.theme.textSecondary }
    }
    RxFocusRing { theme: item.theme; focused: item.activeFocus }
}

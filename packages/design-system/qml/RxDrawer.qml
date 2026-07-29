import QtQuick
import QtQuick.Controls

Drawer {
    id: drawer
    property RxTokens theme: RxTokens {}
    edge: Qt.RightEdge
    width: Math.min(parent ? parent.width * 0.45 : 560, 640 * theme.scale)
    background: Rectangle {
        color: drawer.theme.surface
        border.color: drawer.theme.border
    }
}


import QtQuick
import QtQuick.Controls

Dial {
    id: dial
    property RxTokens theme: RxTokens {}
    implicitWidth: 120 * theme.scale
    implicitHeight: implicitWidth
    focusPolicy: Qt.StrongFocus
    background: Rectangle {
        x: dial.width / 2 - width / 2
        y: dial.height / 2 - height / 2
        width: Math.min(dial.availableWidth, dial.availableHeight)
        height: width
        radius: width / 2
        color: dial.theme.surface
        border.color: dial.activeFocus ? dial.theme.accent : dial.theme.border
        border.width: dial.activeFocus ? 4 : 2
    }
    handle: Rectangle {
        x: dial.background.x + dial.background.width / 2 - width / 2
        y: dial.background.y + dial.background.height / 2 - height / 2
        width: 12 * dial.theme.scale
        height: dial.background.height / 2 - dial.theme.space3
        radius: width / 2
        color: dial.theme.accent
        antialiasing: true
        transform: Rotation {
            origin.x: dial.handle.width / 2
            origin.y: dial.handle.height
            angle: dial.angle
        }
    }
}


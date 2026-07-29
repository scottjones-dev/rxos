import QtQuick
import QtQuick.Controls

Slider {
    id: slider
    property RxTokens theme: RxTokens {}
    implicitHeight: theme.touchTarget
    focusPolicy: Qt.StrongFocus
    background: Rectangle {
        x: slider.leftPadding
        y: slider.topPadding + slider.availableHeight / 2 - height / 2
        width: slider.availableWidth
        height: 8 * slider.theme.scale
        radius: height / 2
        color: slider.theme.surfaceRaised
        Rectangle {
            width: slider.visualPosition * parent.width
            height: parent.height
            radius: parent.radius
            color: slider.theme.accent
        }
    }
    handle: Rectangle {
        x: slider.leftPadding + slider.visualPosition * (slider.availableWidth - width)
        y: slider.topPadding + slider.availableHeight / 2 - height / 2
        width: 28 * slider.theme.scale
        height: width
        radius: width / 2
        color: slider.theme.textPrimary
        border.color: slider.theme.accent
        border.width: slider.activeFocus ? 4 : 2
    }
}


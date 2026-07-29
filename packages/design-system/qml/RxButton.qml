import QtQuick
import QtQuick.Controls

Button {
    id: control
    property RxTokens theme: RxTokens {}
    property string iconText: ""
    implicitWidth: Math.max(theme.touchTarget, contentItem.implicitWidth + theme.space6)
    implicitHeight: theme.touchTarget
    focusPolicy: Qt.StrongFocus
    contentItem: RxText {
        theme: control.theme
        text: (control.iconText ? control.iconText + "  " : "") + control.text
        color: !control.enabled ? control.theme.unavailable
            : (control.highlighted ? control.theme.background : control.theme.textPrimary)
        font.weight: control.highlighted ? Font.DemiBold : Font.Normal
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
    }
    background: Rectangle {
        radius: control.theme.radiusPill
        color: control.highlighted
            ? control.theme.accent
            : (control.down ? control.theme.surfaceRaised : "transparent")
        border.color: "transparent"
        border.width: 0
        scale: control.down ? 0.97 : 1
        Behavior on scale {
            NumberAnimation { duration: control.theme.motionFast }
        }
        RxFocusRing {
            theme: control.theme
            focused: control.activeFocus
        }
    }
}

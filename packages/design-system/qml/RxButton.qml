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
        color: control.enabled ? control.theme.textPrimary : control.theme.unavailable
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
    }
    background: Rectangle {
        radius: control.theme.radiusMedium
        color: control.down ? control.theme.surfaceRaised : control.theme.surface
        border.color: control.highlighted ? control.theme.accent : control.theme.border
        border.width: control.highlighted ? 2 : 1
        RxFocusRing {
            theme: control.theme
            focused: control.activeFocus
        }
    }
}


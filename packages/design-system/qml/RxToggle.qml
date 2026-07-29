import QtQuick
import QtQuick.Controls

Switch {
    id: toggle
    property RxTokens theme: RxTokens {}
    implicitHeight: Math.max(theme.touchTarget, 44 * theme.scale)
    focusPolicy: Qt.StrongFocus
    contentItem: RxText {
        theme: toggle.theme
        text: toggle.text
        leftPadding: toggle.indicator.width + toggle.theme.space3
        verticalAlignment: Text.AlignVCenter
    }
    indicator: Rectangle {
        x: 0
        anchors.verticalCenter: parent.verticalCenter
        implicitWidth: 52 * toggle.theme.scale
        implicitHeight: 30 * toggle.theme.scale
        radius: height / 2
        color: toggle.checked ? toggle.theme.accent : toggle.theme.surfaceRaised
        border.color: toggle.theme.border
        Rectangle {
            x: toggle.checked ? parent.width - width - 4 : 4
            anchors.verticalCenter: parent.verticalCenter
            width: 22 * toggle.theme.scale
            height: width
            radius: width / 2
            color: toggle.theme.textPrimary
            Behavior on x { NumberAnimation { duration: toggle.theme.motionFast } }
        }
    }
}


import QtQuick

Item {
    id: progress
    property RxTokens theme: RxTokens {}
    property real value: 0
    property color accentColor: theme.accent
    implicitWidth: 260 * theme.scale
    implicitHeight: 12 * theme.scale
    Rectangle {
        anchors.fill: parent
        radius: height / 2
        color: progress.theme.surfaceRaised
    }
    Rectangle {
        width: parent.width * Math.max(0, Math.min(1, progress.value))
        height: parent.height
        radius: height / 2
        color: progress.accentColor
        Behavior on width {
            NumberAnimation { duration: progress.theme.motionFast }
        }
    }
}


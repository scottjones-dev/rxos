import QtQuick

Rectangle {
    property RxTokens theme: RxTokens {}
    implicitWidth: 220 * theme.scale
    implicitHeight: 24 * theme.scale
    radius: theme.radiusSmall
    color: theme.surfaceRaised
}


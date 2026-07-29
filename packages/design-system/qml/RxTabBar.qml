import QtQuick
import QtQuick.Controls

TabBar {
    id: tabs
    property RxTokens theme: RxTokens {}
    spacing: theme.space2
    background: Rectangle { color: "transparent" }
}


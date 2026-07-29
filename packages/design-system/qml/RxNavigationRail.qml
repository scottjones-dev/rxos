import QtQuick

Rectangle {
    id: rail
    property RxTokens theme: RxTokens {}
    property var destinations: []
    property int currentIndex: 0
    property bool vertical: true
    signal activated(int index)
    color: theme.surfaceGlass
    radius: theme.radiusPanel
    implicitWidth: vertical ? 112 * theme.scale : 700 * theme.scale
    implicitHeight: vertical ? 700 * theme.scale : 96 * theme.scale

    ListView {
        id: list
        anchors.fill: parent
        anchors.margins: rail.theme.space2
        spacing: rail.theme.space2
        orientation: rail.vertical ? ListView.Vertical : ListView.Horizontal
        model: rail.destinations
        currentIndex: rail.currentIndex
        delegate: RxButton {
            id: destinationButton
            required property var modelData
            required property int index
            theme: rail.theme
            width: rail.vertical ? list.width
                : Math.max(100 * rail.theme.scale,
                    (list.width - Math.max(0, list.count - 1) * list.spacing)
                    / Math.max(1, list.count))
            height: rail.theme.touchTarget
            text: destinationButton.modelData
            highlighted: destinationButton.index === rail.currentIndex
            KeyNavigation.tab: list.itemAtIndex((destinationButton.index + 1) % list.count)
            onClicked: rail.activated(destinationButton.index)
        }
    }
}

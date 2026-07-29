import QtQuick

Column {
    id: empty
    property RxTokens theme: RxTokens {}
    property string title: "Nothing to show"
    property string message: ""
    spacing: theme.space3

    RxText {
        anchors.horizontalCenter: parent.horizontalCenter
        theme: empty.theme
        text: empty.title
        font.pixelSize: empty.theme.textTitle
        font.weight: Font.DemiBold
    }
    RxText {
        anchors.horizontalCenter: parent.horizontalCenter
        theme: empty.theme
        text: empty.message
        color: empty.theme.textSecondary
        font.pixelSize: empty.theme.textLabel
    }
}

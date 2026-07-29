import QtQuick

Column {
    id: empty
    property RxTokens theme: RxTokens {}
    property string title: "Nothing to show"
    property string message: ""
    spacing: theme.space3
    RxIcon { anchors.horizontalCenter: parent.horizontalCenter; theme: empty.theme; symbol: "—" }
    RxText { anchors.horizontalCenter: parent.horizontalCenter; theme: empty.theme; text: empty.title; font.bold: true }
    RxText { anchors.horizontalCenter: parent.horizontalCenter; theme: empty.theme; text: empty.message; color: empty.theme.textSecondary }
}


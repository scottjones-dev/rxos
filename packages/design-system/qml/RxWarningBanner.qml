import QtQuick

Rectangle {
    id: banner
    property RxTokens theme: RxTokens {}
    property string severity: "Information"
    property string title: ""
    property string message: ""
    implicitHeight: 82 * theme.scale
    radius: theme.radiusLarge
    color: Qt.alpha(theme.severityColor(severity), 0.22)
    border.color: "transparent"
    border.width: 0
    Row {
        anchors.fill: parent
        anchors.margins: banner.theme.space4
        spacing: banner.theme.space4
        RxIcon {
            theme: banner.theme
            symbol: banner.severity === "Critical" ? "!" : "i"
            color: banner.theme.severityColor(banner.severity)
        }
        Column {
            width: parent.width - parent.children[0].width - parent.spacing
            RxText {
                theme: banner.theme
                text: banner.severity.toUpperCase() + " · " + banner.title
                color: banner.theme.severityColor(banner.severity)
                font.weight: Font.DemiBold
            }
            RxText {
                width: parent.width
                theme: banner.theme
                text: banner.message
                color: banner.theme.textPrimary
            }
        }
    }
}

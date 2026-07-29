import QtQuick

Rectangle {
    id: banner
    property RxTokens theme: RxTokens {}
    property string severity: "Information"
    property string title: ""
    property string message: ""
    implicitHeight: 82 * theme.scale
    radius: theme.radiusMedium
    color: Qt.alpha(theme.severityColor(severity), 0.18)
    border.color: theme.severityColor(severity)
    border.width: severity === "Critical" ? 3 : 1
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
                font.bold: true
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


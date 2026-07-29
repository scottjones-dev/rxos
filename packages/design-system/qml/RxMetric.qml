import QtQuick

RxCard {
    id: metric
    property string label: ""
    property string value: "—"
    property string unit: ""
    property bool available: true
    property color valueColor: theme.textPrimary
    implicitWidth: 280 * theme.scale
    implicitHeight: 150 * theme.scale
    Column {
        anchors.fill: parent
        spacing: metric.theme.space2
        RxText {
            theme: metric.theme
            text: metric.label.toUpperCase()
            color: metric.theme.textSecondary
            font.pixelSize: metric.theme.textCaption
            font.bold: true
        }
        Row {
            spacing: metric.theme.space2
            RxText {
                theme: metric.theme
                text: metric.available ? metric.value : "—"
                color: metric.available ? metric.valueColor : metric.theme.unavailable
                font.pixelSize: metric.theme.textTitle
                font.bold: true
            }
            RxText {
                theme: metric.theme
                text: metric.available ? metric.unit : "UNAVAILABLE"
                color: metric.theme.textSecondary
                font.pixelSize: metric.theme.textCaption
                anchors.baseline: parent.children[0].baseline
            }
        }
    }
}


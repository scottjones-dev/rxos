import QtQuick
import QtQuick.Layouts

RowLayout {
    id: header
    property RxTokens theme: RxTokens {}
    property string eyebrow: ""
    property string title: ""
    property string detail: ""
    spacing: theme.space4
    implicitHeight: 72 * theme.scale

    ColumnLayout {
        spacing: theme.space1
        RxText {
            theme: header.theme
            text: header.eyebrow.toUpperCase()
            visible: text.length > 0
            color: header.theme.accent
            font.pixelSize: header.theme.textMicro
            font.bold: true
            font.letterSpacing: 1.5 * header.theme.scale
        }
        RxText {
            theme: header.theme
            text: header.title
            font.pixelSize: header.theme.textHeading
            font.weight: Font.DemiBold
        }
    }
    Item { Layout.fillWidth: true }
    RxText {
        theme: header.theme
        text: header.detail
        visible: text.length > 0
        color: header.theme.textSecondary
        font.pixelSize: header.theme.textLabel
    }
}

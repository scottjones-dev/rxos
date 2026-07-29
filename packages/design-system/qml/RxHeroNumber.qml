import QtQuick

Item {
    id: hero
    property RxTokens theme: RxTokens {}
    property string value: "—"
    property string unit: ""
    property string label: ""
    property color accentColor: theme.accent
    implicitWidth: 320 * theme.scale
    implicitHeight: 210 * theme.scale

    Column {
        anchors.centerIn: parent
        spacing: -hero.theme.space2
        Row {
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: hero.theme.space2
            RxText {
                id: valueLabel
                theme: hero.theme
                text: hero.value
                font.pixelSize: hero.theme.textHero
                font.weight: Font.Light
            }
            RxText {
                anchors.baseline: valueLabel.baseline
                theme: hero.theme
                text: hero.unit
                color: hero.theme.textSecondary
                font.pixelSize: hero.theme.textLabel
            }
        }
        RxText {
            anchors.horizontalCenter: parent.horizontalCenter
            theme: hero.theme
            text: hero.label.toUpperCase()
            color: hero.accentColor
            font.pixelSize: hero.theme.textMicro
            font.bold: true
            font.letterSpacing: 1.8 * hero.theme.scale
        }
    }
}

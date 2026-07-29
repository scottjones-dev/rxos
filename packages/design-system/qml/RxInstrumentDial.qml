import QtQuick

Item {
    id: dial
    property RxTokens theme: RxTokens {}
    property real value: 0
    property real maximum: 100
    property string displayValue: Math.round(value).toString()
    property string unit: ""
    property string label: ""
    property string secondary: ""
    property color accentColor: theme.accent
    property bool available: true
    implicitWidth: 410 * theme.scale
    implicitHeight: implicitWidth

    Canvas {
        id: canvas
        anchors.fill: parent
        antialiasing: true
        property real progress: dial.available && dial.maximum > 0
            ? Math.max(0, Math.min(1, dial.value / dial.maximum)) : 0
        onProgressChanged: requestPaint()
        onWidthChanged: requestPaint()
        onPaint: {
            const context = getContext("2d")
            context.clearRect(0, 0, width, height)
            const centre = width / 2
            const lineWidth = Math.max(5, 10 * dial.theme.scale)
            const radius = Math.min(width, height) / 2 - lineWidth
            const start = Math.PI * 0.72
            const span = Math.PI * 1.56
            context.lineCap = "round"
            context.lineWidth = lineWidth
            context.strokeStyle = dial.theme.surfaceRaised
            context.beginPath()
            context.arc(centre, height / 2, radius, start, start + span)
            context.stroke()
            context.strokeStyle = dial.accentColor
            context.beginPath()
            context.arc(centre, height / 2, radius, start,
                        start + span * progress)
            context.stroke()
        }
    }

    Rectangle {
        anchors.centerIn: parent
        width: parent.width * 0.71
        height: width
        radius: width / 2
        color: dial.theme.surfaceQuiet
        border.width: 1
        border.color: dial.theme.surfaceRaised
    }

    Column {
        anchors.centerIn: parent
        spacing: dial.theme.space1
        RxText {
            anchors.horizontalCenter: parent.horizontalCenter
            theme: dial.theme
            text: dial.available ? dial.displayValue : "—"
            font.pixelSize: dial.theme.textHero
            font.weight: Font.Light
        }
        RxText {
            anchors.horizontalCenter: parent.horizontalCenter
            theme: dial.theme
            text: dial.unit
            color: dial.theme.textSecondary
            font.pixelSize: dial.theme.textLabel
        }
        RxText {
            anchors.horizontalCenter: parent.horizontalCenter
            theme: dial.theme
            text: dial.label.toUpperCase()
            color: dial.accentColor
            font.pixelSize: dial.theme.textMicro
            font.bold: true
            font.letterSpacing: 1.4 * dial.theme.scale
        }
        RxText {
            anchors.horizontalCenter: parent.horizontalCenter
            theme: dial.theme
            text: dial.secondary
            visible: text.length > 0
            color: dial.theme.textTertiary
            font.pixelSize: dial.theme.textMicro
        }
    }
}

import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: navigation
    required property RxTokens theme
    property string title: ""
    property string message: ""
    property string symbol: ""

    Rectangle {
        anchors.fill: parent
        color: navigation.theme.surfaceQuiet
    }

    Canvas {
        anchors.fill: parent
        opacity: 0.45
        onPaint: {
            const context = getContext("2d")
            context.lineCap = "round"
            context.lineWidth = 4
            context.strokeStyle = navigation.theme.surfaceRaised
            const roads = [[-.1,.2,1.1,.72],[.12,1,.44,-.1],
                [.68,1,.84,-.1],[-.1,.78,1.1,.34]]
            for (let road of roads) {
                context.beginPath()
                context.moveTo(width * road[0], height * road[1])
                context.lineTo(width * road[2], height * road[3])
                context.stroke()
            }
            context.strokeStyle = navigation.theme.navigation
            context.lineWidth = 12
            context.beginPath()
            context.moveTo(width * .5, height * 1.05)
            context.lineTo(width * .5, height * .64)
            context.lineTo(width * .69, height * .47)
            context.lineTo(width * .69, height * .24)
            context.stroke()
        }
    }

    RxCard {
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.margins: navigation.theme.space6
        width: Math.min(parent.width * 0.43, 620 * navigation.theme.scale)
        height: 180 * navigation.theme.scale
        theme: navigation.theme
        heading: "↑  Continue straight"
        subtitle: "450 m · GUIDANCE PREVIEW"
        accentColor: navigation.theme.navigation
        RxText {
            anchors.left: parent.left
            anchors.bottom: parent.bottom
            theme: navigation.theme
            text: "Routing and map data are unavailable"
            color: navigation.theme.textTertiary
            font.pixelSize: navigation.theme.textCaption
        }
    }

    Column {
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        anchors.rightMargin: navigation.theme.space6
        spacing: navigation.theme.space3
        Repeater {
            model: ["+", "−", "◎"]
            delegate: Rectangle {
                id: mapButton
                required property string modelData
                width: navigation.theme.touchTarget
                height: width
                radius: width / 2
                color: navigation.theme.surfaceGlass
                RxText {
                    anchors.centerIn: parent
                    theme: navigation.theme
                    text: mapButton.modelData
                    font.pixelSize: navigation.theme.textTitle
                }
            }
        }
    }
}

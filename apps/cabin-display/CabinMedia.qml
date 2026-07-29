import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: media
    required property RxTokens theme
    property string title: ""
    property string message: ""
    property string symbol: ""

    RowLayout {
        anchors.fill: parent
        anchors.margins: media.theme.safeMargin
        spacing: media.theme.space8

        Rectangle {
            Layout.preferredWidth: Math.min(parent.height * 0.72, parent.width * 0.42)
            Layout.preferredHeight: Layout.preferredWidth
            radius: media.theme.radiusPanel
            color: media.theme.surfaceRaised
            Rectangle {
                anchors.fill: parent
                anchors.margins: media.theme.space6
                radius: media.theme.radiusLarge
                gradient: Gradient {
                    GradientStop { position: 0; color: media.theme.media }
                    GradientStop { position: 1; color: media.theme.surfaceQuiet }
                }
                RxText {
                    anchors.centerIn: parent
                    theme: media.theme
                    text: "♪"
                    font.pixelSize: 128 * media.theme.scale
                    color: media.theme.textPrimary
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: media.theme.space4
            Item { Layout.fillHeight: true }
            RxText {
                theme: media.theme
                text: "Nothing playing"
                font.pixelSize: media.theme.textHeading
                font.weight: Font.DemiBold
            }
            RxText {
                theme: media.theme
                text: "No media provider connected"
                color: media.theme.textSecondary
                font.pixelSize: media.theme.textTitle
            }
            Rectangle {
                Layout.fillWidth: true
                Layout.topMargin: media.theme.space5
                height: 4 * media.theme.scale
                radius: height / 2
                color: media.theme.surfaceRaised
            }
            RowLayout {
                Layout.fillWidth: true
                Layout.topMargin: media.theme.space5
                spacing: media.theme.space7
                Item { Layout.fillWidth: true }
                Repeater {
                    model: ["‹", "▶", "›"]
                    delegate: Rectangle {
                        id: transport
                        required property string modelData
                        width: transport.modelData === "▶"
                            ? 88 * media.theme.scale : media.theme.touchTarget
                        height: width
                        radius: width / 2
                        color: transport.modelData === "▶"
                            ? media.theme.textPrimary : media.theme.surfaceRaised
                        opacity: 0.48
                        RxText {
                            anchors.centerIn: parent
                            theme: media.theme
                            text: transport.modelData
                            color: transport.modelData === "▶"
                                ? media.theme.background : media.theme.textSecondary
                            font.pixelSize: media.theme.textTitle
                        }
                    }
                }
                Item { Layout.fillWidth: true }
            }
            RxText {
                Layout.alignment: Qt.AlignHCenter
                Layout.topMargin: media.theme.space5
                theme: media.theme
                text: "CONTROLS UNAVAILABLE · VISUAL PREVIEW"
                color: media.theme.unavailable
                font.pixelSize: media.theme.textMicro
                font.letterSpacing: 1.3 * media.theme.scale
            }
            Item { Layout.fillHeight: true }
        }
    }
}

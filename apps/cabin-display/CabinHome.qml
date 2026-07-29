import QtQuick
import QtQuick.Layouts
import Rxos.DesignSystem

Item {
    id: home
    required property RxTokens theme
    required property var telemetry
    required property PresentationFormatter formatter
    required property DisplaySettings settings
    required property WarningModel warnings
    readonly property bool live: telemetry.status === "LIVE"

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: home.theme.safeMargin
        spacing: home.theme.space5

        RxPageHeader {
            Layout.fillWidth: true
            theme: home.theme
            eyebrow: "RXOS"
            title: "Welcome back"
            detail: home.live ? "SIMULATED TELEMETRY CURRENT" : "VEHICLE DATA UNAVAILABLE"
        }

        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: home.theme.space5

            RxCard {
                Layout.preferredWidth: parent.width * 0.58
                Layout.fillHeight: true
                theme: home.theme
                heading: "Where to?"
                subtitle: "Navigation preview · routing unavailable"
                accentColor: home.theme.navigation

                Item {
                    anchors.fill: parent
                    Rectangle {
                        anchors.fill: parent
                        color: home.theme.surfaceQuiet
                        radius: home.theme.radiusLarge
                        opacity: 0.75
                    }
                    Canvas {
                        anchors.fill: parent
                        opacity: 0.38
                        onPaint: {
                            const context = getContext("2d")
                            context.strokeStyle = home.theme.textTertiary
                            context.lineWidth = 2
                            const lines = [[0,.22,1,.55],[.08,1,.46,0],
                                [.62,1,.7,0],[0,.72,1,.35]]
                            for (let line of lines) {
                                context.beginPath()
                                context.moveTo(width * line[0], height * line[1])
                                context.lineTo(width * line[2], height * line[3])
                                context.stroke()
                            }
                        }
                    }
                    Column {
                        anchors.left: parent.left
                        anchors.bottom: parent.bottom
                        anchors.margins: home.theme.space6
                        spacing: home.theme.space2
                        RxText {
                            theme: home.theme
                            text: "↑  Continue straight"
                            font.pixelSize: home.theme.textTitle
                            font.weight: Font.DemiBold
                        }
                        RxText {
                            theme: home.theme
                            text: "450 m · GUIDANCE PREVIEW"
                            color: home.theme.navigation
                            font.pixelSize: home.theme.textMicro
                            font.bold: true
                            font.letterSpacing: 1.2 * home.theme.scale
                        }
                    }
                }
            }

            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: home.theme.space5
                RxCard {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    theme: home.theme
                    heading: "Now playing"
                    subtitle: "No media provider connected"
                    accentColor: home.theme.media
                    Row {
                        anchors.centerIn: parent
                        spacing: home.theme.space4
                        Rectangle {
                            width: 92 * home.theme.scale
                            height: width
                            radius: home.theme.radiusMedium
                            color: home.theme.surfaceRaised
                            RxText {
                                anchors.centerIn: parent
                                theme: home.theme
                                text: "♪"
                                color: home.theme.media
                                font.pixelSize: home.theme.textHeading
                            }
                        }
                        Column {
                            anchors.verticalCenter: parent.verticalCenter
                            spacing: home.theme.space2
                            RxText {
                                theme: home.theme
                                text: "Media unavailable"
                                font.pixelSize: home.theme.textTitle
                                font.weight: Font.DemiBold
                            }
                            RxText {
                                theme: home.theme
                                text: "Playback controls are a visual preview"
                                color: home.theme.textSecondary
                            }
                        }
                    }
                }
                RxCard {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 150 * home.theme.scale
                    theme: home.theme
                    heading: "Your RX-8"
                    subtitle: home.live
                        ? (home.warnings.activeWarnings.length === 0
                            ? "No simulated alerts" : home.warnings.activeWarnings.length + " simulated alerts")
                        : "Status unavailable"
                    accentColor: home.warnings.activeWarnings.length > 0
                        ? home.theme.caution : home.theme.navigation
                    RowLayout {
                        anchors.fill: parent
                        RxText {
                            theme: home.theme
                            text: home.live ? home.formatter.fuel(
                                home.telemetry.fuelPercent) : "—"
                            font.pixelSize: home.theme.textTitle
                            font.weight: Font.DemiBold
                        }
                        Item { Layout.fillWidth: true }
                        RxText {
                            theme: home.theme
                            text: home.live ? home.formatter.temperature(
                                home.telemetry.oilTempC) : "—"
                            color: home.theme.textSecondary
                            font.pixelSize: home.theme.textTitle
                        }
                    }
                }
            }
        }
    }
}

import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Rxos.DesignSystem

ApplicationWindow {
    id: window
    width: 1680
    height: 980
    minimumWidth: 1120
    minimumHeight: 720
    visible: true
    title: "RXOS · Desktop Preview"
    color: tokens.background

    property real previewSpeed: 72
    property real previewRpm: 4200
    property string previewGear: "4"
    property int driverMode: 0
    RxTokens { id: tokens; scale: Math.max(0.72, Math.min(1, window.width / 1680)) }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: tokens.space5
        spacing: tokens.space4

        RowLayout {
            Layout.fillWidth: true
            RxText {
                theme: tokens
                text: "RXOS  /  DESIGN PREVIEW"
                font.pixelSize: tokens.textLabel
                font.weight: Font.DemiBold
                font.letterSpacing: 1.6
            }
            Item { Layout.fillWidth: true }
            RxText {
                theme: tokens
                text: "PRESENTATION CONTROLS · NO VEHICLE CONNECTION"
                color: tokens.textTertiary
                font.pixelSize: tokens.textMicro
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.min(340 * tokens.scale, window.height * 0.34)
            radius: tokens.radiusPanel
            color: tokens.surfaceQuiet
            border.width: 1
            border.color: tokens.surfaceRaised
            clip: true

            RowLayout {
                anchors.fill: parent
                anchors.margins: tokens.space6
                spacing: tokens.space6
                RxInstrumentDial {
                    Layout.preferredWidth: parent.height
                    Layout.preferredHeight: parent.height
                    theme: tokens
                    value: window.previewSpeed
                    maximum: 300
                    displayValue: Math.round(window.previewSpeed).toString()
                    unit: "km/h"
                    label: "Road speed"
                    accentColor: tokens.accent
                }
                ColumnLayout {
                    Layout.fillWidth: true
                    RxText {
                        Layout.alignment: Qt.AlignHCenter
                        theme: tokens
                        text: "↑"
                        color: tokens.navigation
                        font.pixelSize: tokens.textHeading
                    }
                    RxText {
                        Layout.alignment: Qt.AlignHCenter
                        theme: tokens
                        text: window.driverMode === 0 ? "Continue straight"
                            : (window.driverMode === 1 ? "SPORT" : "TRACK")
                        font.pixelSize: tokens.textTitle
                        font.weight: Font.DemiBold
                    }
                    RxText {
                        Layout.alignment: Qt.AlignHCenter
                        theme: tokens
                        text: window.driverMode === 0 ? "450 m · GUIDANCE PREVIEW"
                            : Math.round(window.previewRpm) + " rpm"
                        color: window.driverMode === 0
                            ? tokens.textSecondary : tokens.performance
                        font.pixelSize: tokens.textMicro
                    }
                }
                RxInstrumentDial {
                    Layout.preferredWidth: parent.height
                    Layout.preferredHeight: parent.height
                    theme: tokens
                    value: window.previewRpm
                    maximum: 10000
                    displayValue: window.previewGear
                    unit: "GEAR"
                    label: Math.round(window.previewRpm) + " rpm"
                    accentColor: window.previewRpm > 8000
                        ? tokens.performance : tokens.navigation
                }
            }
        }

        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: tokens.space4

            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                radius: tokens.radiusPanel
                color: tokens.surfaceQuiet
                clip: true

                Canvas {
                    anchors.fill: parent
                    opacity: 0.42
                    onPaint: {
                        const context = getContext("2d")
                        context.strokeStyle = tokens.surfaceRaised
                        context.lineWidth = 4
                        context.beginPath()
                        context.moveTo(0, height * .7)
                        context.lineTo(width, height * .22)
                        context.stroke()
                        context.strokeStyle = tokens.navigation
                        context.lineWidth = 10
                        context.beginPath()
                        context.moveTo(width * .5, height)
                        context.lineTo(width * .5, height * .58)
                        context.lineTo(width * .7, height * .42)
                        context.stroke()
                    }
                }
                RxCard {
                    anchors.left: parent.left
                    anchors.top: parent.top
                    anchors.margins: tokens.space5
                    width: parent.width * 0.52
                    height: 140 * tokens.scale
                    theme: tokens
                    heading: "↑  Continue straight"
                    subtitle: "450 m · GUIDANCE PREVIEW"
                    accentColor: tokens.navigation
                }
                RxNavigationRail {
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.bottom: parent.bottom
                    anchors.margins: tokens.space4
                    height: 74 * tokens.scale
                    theme: tokens
                    destinations: ["Home", "Navigation", "Media", "Vehicle", "Settings"]
                    currentIndex: 1
                    vertical: false
                }
            }

            RxCard {
                Layout.preferredWidth: Math.max(320 * tokens.scale, window.width * 0.24)
                Layout.fillHeight: true
                theme: tokens
                heading: "Preview controls"
                subtitle: "Local presentation values only"
                ColumnLayout {
                    anchors.fill: parent
                    spacing: tokens.space3
                    RxText { theme: tokens; text: "Speed  " + Math.round(window.previewSpeed) + " km/h"; color: tokens.textSecondary }
                    Slider { Layout.fillWidth: true; from: 0; to: 240; value: window.previewSpeed; onMoved: window.previewSpeed = value }
                    RxText { theme: tokens; text: "Engine  " + Math.round(window.previewRpm) + " rpm"; color: tokens.textSecondary }
                    Slider { Layout.fillWidth: true; from: 0; to: 10000; value: window.previewRpm; onMoved: window.previewRpm = value }
                    RxText { theme: tokens; text: "Driver layout"; color: tokens.textSecondary }
                    RowLayout {
                        Repeater {
                            model: ["Road", "Sport", "Track"]
                            delegate: RxButton {
                                id: mode
                                required property string modelData
                                required property int index
                                Layout.fillWidth: true
                                theme: tokens
                                text: mode.modelData
                                highlighted: window.driverMode === mode.index
                                onClicked: window.driverMode = mode.index
                            }
                        }
                    }
                    RxText {
                        Layout.fillWidth: true
                        theme: tokens
                        text: "Telemetry, routing, media, climate, cameras and vehicle controls are not provided by this preview."
                        color: tokens.textTertiary
                        wrapMode: Text.WordWrap
                        font.pixelSize: tokens.textCaption
                    }
                    Item { Layout.fillHeight: true }
                }
            }
        }
    }
}

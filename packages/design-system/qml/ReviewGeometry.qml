import QtQuick

QtObject {
    property real pixelWidth: 1920
    property real pixelHeight: 1080
    property real physicalWidthMm: 0
    property real physicalHeightMm: 0
    property real scaleFactor: 1

    function xPixels(millimetres) {
        return physicalWidthMm > 0
            ? millimetres / physicalWidthMm * pixelWidth * scaleFactor
            : 0
    }

    function yPixels(millimetres) {
        return physicalHeightMm > 0
            ? millimetres / physicalHeightMm * pixelHeight * scaleFactor
            : 0
    }
}

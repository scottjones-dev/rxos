import QtQuick

Item {
    id: overlay
    property bool reviewEnabled: false
    property real safeInset: 48
    property real physicalWidthMm: 0
    property real physicalHeightMm: 0
    property real safeInsetMm: 0
    property real wheelDiameter: 0
    property real wheelDiameterMm: 0
    property real wheelCentreX: width / 2
    property real wheelCentreY: height
    property bool showTouchReach: false
    property var dashboardEdgeMm: null
    property var driverSightlineMm: null
    property var bezelMm: null
    property var airbagExclusionMm: null
    property var hazardSwitchExclusionMm: null
    property var demisterAirflowExclusionMm: null
    property var factoryControlExclusionMm: null
    readonly property var zones: [
        { label: "dashboard edge", value: dashboardEdgeMm, color: "#ff9500" },
        { label: "driver sightline", value: driverSightlineMm, color: "#64d2ff" },
        { label: "bezel", value: bezelMm, color: "#bf5af2" },
        { label: "airbag exclusion", value: airbagExclusionMm, color: "#ff375f" },
        { label: "hazard switch", value: hazardSwitchExclusionMm, color: "#ffd60a" },
        { label: "demister airflow", value: demisterAirflowExclusionMm, color: "#5ac8fa" },
        { label: "factory control", value: factoryControlExclusionMm, color: "#ff453a" }
    ]
    readonly property real resolvedSafeInset: safeInsetMm > 0
        ? geometry.xPixels(safeInsetMm) : safeInset
    readonly property real resolvedWheelDiameter: wheelDiameterMm > 0
        ? geometry.xPixels(wheelDiameterMm) : wheelDiameter
    visible: reviewEnabled
    enabled: false
    z: 10000

    ReviewGeometry {
        id: geometry
        pixelWidth: overlay.width
        pixelHeight: overlay.height
        physicalWidthMm: overlay.physicalWidthMm
        physicalHeightMm: overlay.physicalHeightMm
    }

    Rectangle {
        anchors.fill: parent
        color: "transparent"
        border.color: "#ff3b30"
        border.width: 3
    }
    Rectangle {
        x: overlay.resolvedSafeInset
        y: overlay.resolvedSafeInset
        width: Math.max(0, parent.width - overlay.resolvedSafeInset * 2)
        height: Math.max(0, parent.height - overlay.resolvedSafeInset * 2)
        color: "transparent"
        border.color: "#34c759"
        border.width: 2
    }
    Rectangle {
        visible: overlay.resolvedWheelDiameter > 0
        x: overlay.wheelCentreX - width / 2
        y: overlay.wheelCentreY - height / 2
        width: overlay.resolvedWheelDiameter
        height: overlay.resolvedWheelDiameter
        radius: width / 2
        color: "#33000000"
        border.color: "#ffcc00"
        border.width: 3
    }
    Repeater {
        model: overlay.zones
        delegate: Rectangle {
            required property var modelData
            visible: modelData.value !== null
            x: visible ? geometry.xPixels(modelData.value.x) : 0
            y: visible ? geometry.yPixels(modelData.value.y) : 0
            width: visible ? geometry.xPixels(modelData.value.width) : 0
            height: visible ? geometry.yPixels(modelData.value.height) : 0
            color: "transparent"
            border.color: modelData.color
            border.width: 2
            Text {
                color: parent.border.color
                text: modelData.label
            }
        }
    }
    Rectangle {
        visible: overlay.showTouchReach
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        width: parent.width * 0.45
        height: parent.height * 0.7
        radius: width
        color: "#2240a9ff"
        border.color: "#40a9ff"
    }
    Text {
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.margins: 8
        color: "#ffffff"
        text: "DEVELOPMENT PHYSICAL REVIEW — NOT A SAFETY VALIDATION"
    }
}

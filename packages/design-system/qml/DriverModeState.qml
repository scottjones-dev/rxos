import QtQuick

QtObject {
    property string mode: "Daily"
    readonly property var modes: ["Daily", "Performance", "Track"]

    function select(nextMode) {
        if (!modes.includes(nextMode))
            return false
        mode = nextMode
        return true
    }
}


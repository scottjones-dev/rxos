import QtQuick

QtObject {
    property string state: "off"
    readonly property var allowed: ({
        "off": ["accessory"],
        "accessory": ["ignition-on", "off"],
        "ignition-on": ["cranking", "shutdown-requested"],
        "cranking": ["running", "forced-power-loss"],
        "running": ["shutdown-requested", "forced-power-loss"],
        "shutdown-requested": ["graceful-shutdown", "forced-power-loss"],
        "graceful-shutdown": ["off"],
        "forced-power-loss": ["recovery"],
        "recovery": ["accessory", "off"]
    })

    function transition(next) {
        if (!allowed[state] || !allowed[state].includes(next))
            return false
        state = next
        return true
    }
}

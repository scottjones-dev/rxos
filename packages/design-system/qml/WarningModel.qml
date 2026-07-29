import QtQuick

QtObject {
    id: warningModel

    property var telemetryWarnings: ({})
    property string timestamp: new Date().toISOString()
    readonly property var warnings: [
        warning("sim.check-engine", "Advisory", "Engine status",
                "Simulated engine warning flag is active.", "Acknowledge",
                Boolean(telemetryWarnings.checkEngine)),
        warning("sim.coolant", "Caution", "Coolant status",
                "Simulated coolant warning flag is active.", "Acknowledge",
                Boolean(telemetryWarnings.coolantTemperature)),
        warning("sim.low-fuel", "Information", "Fuel status",
                "Simulated low-fuel flag is active.", "Acknowledge",
                Boolean(telemetryWarnings.lowFuel)),
        warning("sim.oil-pressure", "Critical", "Oil pressure status",
                "Simulated oil-pressure warning flag is active.", "Condition clears only",
                Boolean(telemetryWarnings.lowOilPressure))
    ]
    readonly property var activeWarnings: warnings.filter(item => item.active)
    readonly property var mostSevere: activeWarnings.reduce((current, item) =>
        rank(item.severity) > rank(current.severity) ? item : current,
        warning("none", "Information", "", "", "None", false))

    function warning(identifier, severity, title, message, acknowledgementPolicy, active) {
        return {
            identifier,
            severity,
            title,
            message,
            acknowledgementPolicy,
            source: "simulated telemetry",
            timestamp,
            active
        }
    }

    function rank(severity) {
        return ["Information", "Advisory", "Caution", "Critical"].indexOf(severity)
    }
}


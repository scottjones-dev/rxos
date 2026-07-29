import QtQuick

QtObject {
    id: state

    readonly property int staleAfterMs: 1500
    property bool transportConnected: false
    property bool hasSample: false
    property bool stale: true
    property int invalidMessages: 0
    property int acceptedMessages: 0
    property double lastSequence: -1
    property int laggedMessages: 0
    property int schemaVersion: 0
    property string source: "none"
    property double capturedAtMs: 0
    property var data: ({
        rpm: 0,
        speedKph: 0,
        gear: "—",
        throttlePercent: 0,
        coolantTempC: 0,
        oilTempC: 0,
        oilPressureKpa: 0,
        fuelPercent: 0,
        batteryVoltage: 0,
        warnings: {
            checkEngine: false,
            coolantTemperature: false,
            lowFuel: false,
            lowOilPressure: false
        }
    })

    property bool observedLive: false
    property bool observedStale: false
    property bool observedDisconnected: false
    property bool observedReconnect: false

    readonly property string status: !transportConnected
        ? "NO DATA"
        : (!hasSample ? "CONNECTING" : (stale ? "STALE" : "LIVE"))
    readonly property bool reliabilityComplete: observedLive
        && observedStale
        && invalidMessages > 0
        && observedDisconnected
        && observedReconnect

    signal structuredLog(string payload)

    function log(event, details) {
        const entry = Object.assign({
            component: "display-telemetry",
            event: event
        }, details || {})
        const payload = JSON.stringify(entry)
        structuredLog(payload)
        console.log(payload)
    }

    function numberInRange(value, minimum, maximum) {
        return typeof value === "number"
            && isFinite(value)
            && value >= minimum
            && value <= maximum
    }

    function warningsAreValid(warnings) {
        return warnings
            && typeof warnings.checkEngine === "boolean"
            && typeof warnings.coolantTemperature === "boolean"
            && typeof warnings.lowFuel === "boolean"
            && typeof warnings.lowOilPressure === "boolean"
    }

    function telemetryIsValid(value) {
        return value
            && numberInRange(value.rpm, 0, 12000)
            && numberInRange(value.speedKph, 0, 350)
            && ["R", "N", "1", "2", "3", "4", "5", "6"].includes(value.gear)
            && numberInRange(value.throttlePercent, 0, 100)
            && numberInRange(value.coolantTempC, -50, 180)
            && numberInRange(value.oilTempC, -50, 200)
            && numberInRange(value.oilPressureKpa, 0, 1500)
            && numberInRange(value.fuelPercent, 0, 100)
            && numberInRange(value.batteryVoltage, 0, 20)
            && warningsAreValid(value.warnings)
    }

    function accept(message) {
        let envelope
        try {
            envelope = JSON.parse(message)
        } catch (error) {
            invalidMessages += 1
            log("malformed_message", { reason: "invalid_json" })
            return false
        }

        const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        const parsedCapturedAt = Date.parse(envelope.capturedAt)
        if (envelope.schemaVersion !== 1
                || !Number.isSafeInteger(envelope.sequence)
                || envelope.sequence < 0
                || typeof envelope.capturedAt !== "string"
                || !timestampPattern.test(envelope.capturedAt)
                || !isFinite(parsedCapturedAt)
                || !["simulation", "playback"].includes(envelope.source)
                || !telemetryIsValid(envelope.telemetry)) {
            invalidMessages += 1
            log("malformed_message", { reason: "contract_validation" })
            return false
        }

        data = envelope.telemetry
        schemaVersion = envelope.schemaVersion
        source = envelope.source
        capturedAtMs = parsedCapturedAt
        lastSequence = envelope.sequence
        acceptedMessages += 1
        hasSample = true
        stale = false
        observedLive = true
        if (observedDisconnected) {
            observedReconnect = true
            log("client_reconnected", {})
        }
        return true
    }

    function setTransportConnected(connected) {
        if (transportConnected === connected)
            return
        transportConnected = connected
        if (connected) {
            log("client_connection", {})
        } else {
            if (hasSample)
                observedDisconnected = true
            log("client_disconnection", {})
        }
    }

    function updateFreshness(nowMs) {
        const nextStale = !hasSample || nowMs - capturedAtMs > staleAfterMs
        if (nextStale && !stale) {
            observedStale = true
            log("stale_telemetry", { ageMs: nowMs - capturedAtMs })
        }
        stale = nextStale
    }
}

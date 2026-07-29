import QtQuick

QtObject {
    id: formatter

    property string unitsProfile: "metric"
    property string localeName: "en-GB"
    property string missingText: "—"
    property string staleText: "STALE"

    readonly property bool imperialDistance: unitsProfile === "uk" || unitsProfile === "us"
    readonly property bool fahrenheit: unitsProfile === "us"

    function numeric(value, decimals) {
        if (value === null || value === undefined || !isFinite(value))
            return missingText
        return Number(value).toLocaleString(Qt.locale(localeName), "f", decimals)
    }

    function valueWithUnit(value, unit, decimals, state) {
        if (state === "stale")
            return staleText
        const rendered = numeric(value, decimals)
        return rendered === missingText ? rendered : rendered + " " + unit
    }

    function speed(kph, state) {
        const value = imperialDistance && kph !== null ? kph * 0.621371192 : kph
        return valueWithUnit(value, imperialDistance ? "mph" : "km/h", 0, state)
    }

    function distance(kilometres, state) {
        const value = imperialDistance && kilometres !== null
            ? kilometres * 0.621371192
            : kilometres
        return valueWithUnit(value, imperialDistance ? "mi" : "km", 1, state)
    }

    function temperature(celsius, state) {
        const value = fahrenheit && celsius !== null ? celsius * 9 / 5 + 32 : celsius
        return valueWithUnit(value, fahrenheit ? "°F" : "°C", 0, state)
    }

    function pressure(kpa, state) {
        const value = imperialDistance && kpa !== null ? kpa * 0.145037738 : kpa
        return valueWithUnit(value, imperialDistance ? "psi" : "kPa", 0, state)
    }

    function voltage(volts, state) {
        return valueWithUnit(volts, "V", 1, state)
    }

    function fuel(percent, state) {
        return percentage(percent, 0, state)
    }

    function percentage(percent, decimals, state) {
        return valueWithUnit(percent, "%", decimals, state)
    }

    function gear(value) {
        return ["R", "N", "1", "2", "3", "4", "5", "6"].includes(value)
            ? value
            : missingText
    }

    function time(timestamp) {
        if (timestamp === null || timestamp === undefined)
            return missingText
        return new Date(timestamp).toLocaleTimeString(Qt.locale(localeName), "HH:mm")
    }

    function date(timestamp) {
        if (timestamp === null || timestamp === undefined)
            return missingText
        return new Date(timestamp).toLocaleDateString(Qt.locale(localeName), Locale.ShortFormat)
    }

    function duration(totalSeconds) {
        if (totalSeconds === null || totalSeconds === undefined || !isFinite(totalSeconds))
            return missingText
        const seconds = Math.max(0, Math.round(totalSeconds))
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainder = seconds % 60
        return (hours > 0 ? hours.toString().padStart(2, "0") + ":" : "")
            + minutes.toString().padStart(2, "0") + ":"
            + remainder.toString().padStart(2, "0")
    }

    function simulated(value) {
        return value + " · " + qsTrId("rxos.simulated")
    }
}

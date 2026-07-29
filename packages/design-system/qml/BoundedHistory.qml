import QtQuick

QtObject {
    id: history

    property int capacity: 600
    property int downsampleEvery: 1
    property var values: []
    property int receivedCount: 0
    readonly property int length: values.length

    function append(timestamp, value, valid) {
        receivedCount += 1
        if ((receivedCount - 1) % Math.max(1, downsampleEvery) !== 0)
            return
        const next = values.slice()
        next.push({
            timestamp,
            value: valid && typeof value === "number" && isFinite(value) ? value : null
        })
        if (next.length > capacity)
            next.splice(0, next.length - capacity)
        values = next
    }

    function clear() {
        values = []
        receivedCount = 0
    }
}


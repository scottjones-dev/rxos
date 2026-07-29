import QtQuick

QtObject {
    id: history

    property int capacity: 600
    property int downsampleEvery: 1
    property int publishEvery: 1
    property int maximumRenderedPoints: 240
    property var values: []
    property int receivedCount: 0
    property int retainedCount: 0
    property int retainedAppendCount: 0
    property int publishedCount: 0
    property var retainedValues: []
    readonly property int length: retainedCount

    function renderable(source) {
        const limit = Math.max(2, maximumRenderedPoints)
        if (source.length <= limit)
            return source.slice()
        const result = []
        const binSize = source.length / limit
        for (let outputIndex = 0; outputIndex < limit; outputIndex += 1) {
            const start = Math.floor(outputIndex * binSize)
            const end = Math.max(start + 1,
                Math.floor((outputIndex + 1) * binSize))
            let selected = source[Math.min(start, source.length - 1)]
            for (let index = start; index < Math.min(end, source.length); index += 1) {
                if (source[index].value === null) {
                    selected = source[index]
                    break
                }
            }
            result.push(selected)
        }
        return result
    }

    function publish() {
        values = renderable(retainedValues)
        publishedCount += 1
    }

    function append(timestamp, value, valid) {
        receivedCount += 1
        if ((receivedCount - 1) % Math.max(1, downsampleEvery) !== 0)
            return
        const next = retainedValues.slice()
        next.push({
            timestamp,
            value: valid && typeof value === "number" && isFinite(value) ? value : null
        })
        if (next.length > capacity)
            next.splice(0, next.length - capacity)
        retainedValues = next
        retainedCount = next.length
        retainedAppendCount += 1
        if ((retainedAppendCount - 1) % Math.max(1, publishEvery) === 0)
            publish()
    }

    function clear() {
        retainedValues = []
        values = []
        receivedCount = 0
        retainedCount = 0
        retainedAppendCount = 0
        publishedCount = 0
    }
}

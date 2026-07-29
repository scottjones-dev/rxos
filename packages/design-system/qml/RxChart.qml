import QtQuick

Canvas {
    id: chart
    property RxTokens theme: RxTokens {}
    property var values: []
    property real minimum: 0
    property real maximum: 100
    property bool stale: false
    implicitWidth: 520 * theme.scale
    implicitHeight: 220 * theme.scale
    onValuesChanged: requestPaint()
    onStaleChanged: requestPaint()
    onPaint: {
        const context = getContext("2d")
        context.reset()
        context.fillStyle = theme.surface
        context.fillRect(0, 0, width, height)
        context.strokeStyle = theme.border
        context.strokeRect(0, 0, width, height)
        if (values.length < 2)
            return
        context.strokeStyle = stale ? theme.unavailable : theme.accent
        context.lineWidth = 2
        context.beginPath()
        let drawing = false
        for (let index = 0; index < values.length; index += 1) {
            const sample = values[index]
            if (sample.value === null) {
                drawing = false
                continue
            }
            const x = index * width / Math.max(1, values.length - 1)
            const normalized = Math.max(0, Math.min(1,
                (sample.value - minimum) / Math.max(1, maximum - minimum)))
            const y = height - normalized * height
            if (drawing)
                context.lineTo(x, y)
            else {
                context.moveTo(x, y)
                drawing = true
            }
        }
        context.stroke()
    }
}


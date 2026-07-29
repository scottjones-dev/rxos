import QtQuick

QtObject {
    property int destinationCount: 1
    property int currentIndex: 0
    property var history: []

    function navigate(index) {
        if (!Number.isInteger(index)
                || index < 0
                || index >= destinationCount
                || index === currentIndex)
            return false
        const next = history.slice()
        next.push(currentIndex)
        if (next.length > 16)
            next.shift()
        history = next
        currentIndex = index
        return true
    }

    function home() {
        currentIndex = 0
        history = []
    }

    function back() {
        if (history.length === 0) {
            home()
            return false
        }
        const next = history.slice()
        currentIndex = next.pop()
        history = next
        return true
    }
}


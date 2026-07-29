import QtQuick

QtObject {
    property int currentIndex: 0

    function move(delta, count) {
        if (count <= 0)
            return -1
        currentIndex = (currentIndex + delta + count) % count
        return currentIndex
    }
}


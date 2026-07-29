import QtQuick

QtObject {
    property int focusIndex: 0
    property int focusCount: 1
    property string focusedDisplay: "cabin"
    signal activated(int index)
    signal backRequested()
    signal homeRequested()
    signal menuRequested()
    signal favouriteRequested()

    function dispatch(action, displayRole) {
        if (displayRole !== focusedDisplay || focusedDisplay !== "cabin")
            return false
        if (action === "clockwise")
            focusIndex = (focusIndex + 1) % Math.max(1, focusCount)
        else if (action === "anticlockwise")
            focusIndex = (focusIndex - 1 + Math.max(1, focusCount))
                % Math.max(1, focusCount)
        else if (action === "press")
            activated(focusIndex)
        else if (action === "back")
            backRequested()
        else if (action === "home")
            homeRequested()
        else if (action === "menu")
            menuRequested()
        else if (action === "favourite")
            favouriteRequested()
        else
            return false
        return true
    }
}

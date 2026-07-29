import QtQuick

RxText {
    id: icon
    property string iconName: ""
    property string symbol: ""
    text: symbol.length > 0 ? symbol : glyph(iconName)
    font.pixelSize: theme.iconMedium
    font.family: "Noto Sans Symbols 2"
    horizontalAlignment: Text.AlignHCenter
    verticalAlignment: Text.AlignVCenter

    function glyph(name) {
        const icons = {
            "home": "⌂",
            "back": "←",
            "navigation": "↑",
            "media": "♪",
            "vehicle": "◇",
            "climate": "°",
            "camera": "◉",
            "settings": "⚙",
            "health": "♡",
            "service": "⌁",
            "diagnostics": "!",
            "search": "⌕",
            "more": "•••"
        }
        return icons[name] || "•"
    }
}

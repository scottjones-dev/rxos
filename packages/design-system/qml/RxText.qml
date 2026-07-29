import QtQuick

Text {
    property RxTokens theme: RxTokens {}
    color: theme.textPrimary
    font.pixelSize: theme.textBody
    font.family: "Noto Sans"
    renderType: Text.NativeRendering
    elide: Text.ElideRight
}


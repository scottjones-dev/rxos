import QtQuick
import QtQuick.Controls

Popup {
    id: modal
    property RxTokens theme: RxTokens {}
    property string title: ""
    property string message: ""
    modal: true
    focus: true
    closePolicy: Popup.CloseOnEscape
    padding: theme.space6
    width: 560 * theme.scale
    background: Rectangle {
        radius: modal.theme.radiusLarge
        color: modal.theme.surface
        border.color: modal.theme.border
    }
    contentItem: Column {
        spacing: modal.theme.space4
        RxText { theme: modal.theme; text: modal.title; font.pixelSize: modal.theme.textTitle; font.bold: true }
        RxText { width: parent.width; theme: modal.theme; text: modal.message; wrapMode: Text.WordWrap }
        RxButton { anchors.right: parent.right; theme: modal.theme; text: "Close"; onClicked: modal.close() }
    }
}


import QtQuick
import Rxos.DesignSystem

Item {
    id: placeholder
    required property RxTokens theme
    property string title: ""
    property string message: ""
    property string symbol: "—"
    RxEmptyState {
        anchors.centerIn: parent
        theme: placeholder.theme
        title: placeholder.title + " placeholder"
        message: placeholder.message
    }
}

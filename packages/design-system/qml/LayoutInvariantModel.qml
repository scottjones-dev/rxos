import QtQuick

QtObject {
    function within(rect, bounds) {
        return rect.x >= bounds.x
            && rect.y >= bounds.y
            && rect.x + rect.width <= bounds.x + bounds.width
            && rect.y + rect.height <= bounds.y + bounds.height
    }

    function overlaps(first, second) {
        return first.x < second.x + second.width
            && first.x + first.width > second.x
            && first.y < second.y + second.height
            && first.y + first.height > second.y
    }

    function touchTargetIsValid(width, height, scale) {
        return width >= 56 * scale && height >= 56 * scale
    }

    function focusOrderIsComplete(order, count) {
        if (!Array.isArray(order) || order.length !== count)
            return false
        const unique = {}
        for (let index = 0; index < order.length; index += 1) {
            if (order[index] < 0 || order[index] >= count || unique[order[index]])
                return false
            unique[order[index]] = true
        }
        return true
    }

    function scrollContentIsReachable(contentHeight, viewportHeight, interactive) {
        return contentHeight <= viewportHeight || interactive
    }

    function warningIsAccessible(warning, critical, title, message, hasIcon) {
        return !overlaps(warning, critical)
            && title.length > 0
            && message.length > 0
            && hasIcon
    }
}

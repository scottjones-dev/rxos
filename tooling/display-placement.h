#pragma once

#include <QCursor>
#include <QGuiApplication>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QQuickWindow>
#include <QScreen>
#include <QStringList>

inline QString rxosOptionValue(const QStringList &arguments, const QString &name)
{
    const qsizetype index = arguments.indexOf(name);
    return index >= 0 && index + 1 < arguments.size() ? arguments.at(index + 1) : QString();
}

inline QJsonObject rxosScreenDescription(const QScreen *screen, int index)
{
    const QRect geometry = screen->geometry();
    const QSizeF physical = screen->physicalSize();
    return {
        {QStringLiteral("index"), index},
        {QStringLiteral("name"), screen->name()},
        {QStringLiteral("x"), geometry.x()},
        {QStringLiteral("y"), geometry.y()},
        {QStringLiteral("width"), geometry.width()},
        {QStringLiteral("height"), geometry.height()},
        {QStringLiteral("refreshHz"), screen->refreshRate()},
        {QStringLiteral("logicalDpi"), screen->logicalDotsPerInch()},
        {QStringLiteral("physicalWidthMm"), physical.width()},
        {QStringLiteral("physicalHeightMm"), physical.height()},
    };
}

inline void rxosLogScreens(const QString &component)
{
    QJsonArray screens;
    const QList<QScreen *> available = QGuiApplication::screens();
    for (qsizetype index = 0; index < available.size(); ++index)
        screens.append(rxosScreenDescription(available.at(index), static_cast<int>(index)));
    qInfo().noquote()
        << QJsonDocument(QJsonObject{{QStringLiteral("component"), component},
                                    {QStringLiteral("event"), QStringLiteral("display_inventory")},
                                    {QStringLiteral("displays"), screens}})
               .toJson(QJsonDocument::Compact);
}

inline bool rxosPlaceWindow(QQuickWindow *window, const QStringList &arguments,
                            const QString &component, bool hideCursor)
{
    if (!window)
        return false;
    const bool nativePlacement = arguments.contains(QStringLiteral("--native-placement"));
    if (!nativePlacement) {
        window->show();
        return true;
    }

    const QString requestedName = rxosOptionValue(arguments, QStringLiteral("--screen-connector"));
    const QString requestedId = rxosOptionValue(arguments, QStringLiteral("--screen-id"));
    bool indexOkay = false;
    const int requestedIndex =
        rxosOptionValue(arguments, QStringLiteral("--screen-index")).toInt(&indexOkay);
    QScreen *selected = nullptr;
    QString reason;
    const QList<QScreen *> screens = QGuiApplication::screens();
    for (QScreen *screen : screens) {
        if ((!requestedName.isEmpty() && screen->name() == requestedName)
            || (!requestedId.isEmpty() && screen->name() == requestedId)) {
            selected = screen;
            reason = QStringLiteral("explicit-name");
            break;
        }
    }
    if (!selected && indexOkay && requestedIndex >= 0 && requestedIndex < screens.size()) {
        selected = screens.at(requestedIndex);
        reason = QStringLiteral("validated-index");
    }
    if (!selected) {
        qCritical().noquote()
            << QJsonDocument(QJsonObject{
                                 {QStringLiteral("component"), component},
                                 {QStringLiteral("event"), QStringLiteral("display_assignment_failed")},
                                 {QStringLiteral("requestedId"), requestedId},
                                 {QStringLiteral("requestedConnector"), requestedName},
                                 {QStringLiteral("requestedIndex"), requestedIndex},
                             })
                   .toJson(QJsonDocument::Compact);
        return false;
    }

    window->setScreen(selected);
    if (arguments.contains(QStringLiteral("--windowed"))) {
        const int width = rxosOptionValue(arguments, QStringLiteral("--width")).toInt();
        const int height = rxosOptionValue(arguments, QStringLiteral("--height")).toInt();
        window->setGeometry(selected->geometry().topLeft().x(), selected->geometry().topLeft().y(),
                            width > 0 ? width : selected->geometry().width(),
                            height > 0 ? height : selected->geometry().height());
        window->show();
    } else {
        window->setGeometry(selected->geometry());
        window->showFullScreen();
    }
    if (hideCursor)
        window->setCursor(QCursor(Qt::BlankCursor));
    qInfo().noquote()
        << QJsonDocument(QJsonObject{
                             {QStringLiteral("component"), component},
                             {QStringLiteral("event"), QStringLiteral("display_assigned")},
                             {QStringLiteral("selectedName"), selected->name()},
                             {QStringLiteral("reason"), reason},
                             {QStringLiteral("fullscreen"),
                              !arguments.contains(QStringLiteral("--windowed"))},
                             {QStringLiteral("cursorHidden"), hideCursor},
                         })
               .toJson(QJsonDocument::Compact);
    return true;
}

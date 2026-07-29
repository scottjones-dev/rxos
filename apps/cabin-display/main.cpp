#include <QGuiApplication>
#include <QLoggingCategory>
#include <QQmlApplicationEngine>
#include <QTimer>

int main(int argc, char *argv[])
{
    QGuiApplication application(argc, argv);
    application.setApplicationName(QStringLiteral("RXOS Cabin Display"));
    qInfo().noquote() << R"({"component":"cabin-display","event":"startup"})";

    QQmlApplicationEngine engine;
    engine.loadFromModule("Rxos.CabinDisplay", "Main");
    if (engine.rootObjects().isEmpty())
        return -1;

    const bool reliabilityTest =
        application.arguments().contains(QStringLiteral("--reliability-test"));
    QTimer poll;
    QTimer timeout;
    if (reliabilityTest) {
        poll.setInterval(50);
        QObject::connect(&poll, &QTimer::timeout, &application, [&application, &engine]() {
            const QObject *root = engine.rootObjects().constFirst();
            if (root->property("reliabilityComplete").toBool())
                application.exit(0);
        });
        timeout.setSingleShot(true);
        timeout.setInterval(15'000);
        QObject::connect(&timeout, &QTimer::timeout, &application, [&application]() {
            qCritical().noquote()
                << R"({"component":"cabin-display","event":"reliability_timeout"})";
            application.exit(2);
        });
        poll.start();
        timeout.start();
    }

    const int result = application.exec();
    qInfo().noquote() << R"({"component":"cabin-display","event":"graceful_shutdown"})";
    return result;
}

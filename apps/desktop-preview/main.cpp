#include <QGuiApplication>
#include <QLoggingCategory>
#include <QQmlApplicationEngine>
#include <QTimer>

int main(int argc, char *argv[])
{
    QGuiApplication application(argc, argv);
    application.setApplicationName(QStringLiteral("RXOS Desktop Preview"));
    qInfo().noquote() << R"({"component":"desktop-preview","event":"startup"})";

    QQmlApplicationEngine engine;
    engine.loadFromModule("Rxos.DesktopPreview", "Main");
    if (engine.rootObjects().isEmpty())
        return 1;

    qInfo().noquote() << R"({"component":"desktop-preview","event":"ui_ready"})";
    if (application.arguments().contains(QStringLiteral("--smoke-test")))
        QTimer::singleShot(300, &application, &QCoreApplication::quit);

    QObject::connect(&application, &QCoreApplication::aboutToQuit, [] {
        qInfo().noquote()
            << R"({"component":"desktop-preview","event":"graceful_shutdown"})";
    });
    return application.exec();
}

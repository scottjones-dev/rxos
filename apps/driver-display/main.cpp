#include <QElapsedTimer>
#include <QDir>
#include <QFileInfo>
#include <QFont>
#include <QGuiApplication>
#include <QLoggingCategory>
#include <QQmlApplicationEngine>
#include <QQuickWindow>
#include <QTimer>
#include <QTranslator>
#include <csignal>

namespace {
volatile std::sig_atomic_t shutdownRequested = 0;

void requestShutdown(int)
{
    shutdownRequested = 1;
}

QString optionValue(const QStringList &arguments, const QString &name)
{
    const qsizetype index = arguments.indexOf(name);
    return index >= 0 && index + 1 < arguments.size() ? arguments.at(index + 1) : QString();
}
}

int main(int argc, char *argv[])
{
    QGuiApplication application(argc, argv);
    application.setApplicationName(QStringLiteral("RXOS Driver Display"));
    application.setFont(QFont(QStringLiteral("Noto Sans")));
    std::signal(SIGINT, requestShutdown);
    std::signal(SIGTERM, requestShutdown);
    const QStringList arguments = application.arguments();
    QString localeName = optionValue(arguments, QStringLiteral("--locale"));
    if (localeName.isEmpty())
        localeName = QStringLiteral("en-GB");
    localeName.replace(QLatin1Char('-'), QLatin1Char('_'));
    QTranslator translator;
    if (translator.load(QStringLiteral(":/i18n/rxos_%1.qm").arg(localeName)))
        application.installTranslator(&translator);
    application.setLayoutDirection(
        localeName == QStringLiteral("ar_XB") ? Qt::RightToLeft : Qt::LeftToRight);
    qInfo().noquote() << R"({"component":"driver-display","event":"startup"})";

    QElapsedTimer startupTimer;
    startupTimer.start();
    QQmlApplicationEngine engine;
    engine.loadFromModule("Rxos.DriverDisplay", "Main");
    if (engine.rootObjects().isEmpty())
        return -1;
    QObject *rootObject = engine.rootObjects().constFirst();
    auto *rootWindow = qobject_cast<QQuickWindow *>(rootObject);
    quint64 renderedFrames = 0;
    if (rootWindow) {
        QObject::connect(rootWindow, &QQuickWindow::frameSwapped, &application,
                         [&renderedFrames]() { ++renderedFrames; });
    }
    qInfo().noquote() << QStringLiteral(
        R"({"component":"driver-display","event":"ui_ready","startupMs":%1})")
                             .arg(startupTimer.elapsed());

    const bool reliabilityTest = arguments.contains(QStringLiteral("--reliability-test"));
    const bool smokeTest = arguments.contains(QStringLiteral("--smoke-test"));
    const QString capturePath = optionValue(arguments, QStringLiteral("--capture"));
    const int exitAfter = optionValue(arguments, QStringLiteral("--exit-after")).toInt();
    if (smokeTest)
        QTimer::singleShot(250, &application, [&application]() { application.exit(0); });
    QTimer poll;
    QTimer timeout;
    QTimer signalPoll;
    signalPoll.setInterval(50);
    QObject::connect(&signalPoll, &QTimer::timeout, &application, [&application]() {
        if (shutdownRequested != 0)
            application.quit();
    });
    signalPoll.start();
    QTimer telemetryInstrumentation;
    telemetryInstrumentation.setInterval(25);
    QObject::connect(&telemetryInstrumentation, &QTimer::timeout, &application,
                     [&telemetryInstrumentation, rootObject, &startupTimer]() {
        if (rootObject->property("acceptedMessages").toInt() > 0) {
            qInfo().noquote()
                << QStringLiteral(R"({"component":"driver-display","event":"first_telemetry","startupMs":%1,"sequence":%2})")
                       .arg(startupTimer.elapsed())
                       .arg(rootObject->property("lastSequence").toDouble(), 0, 'f', 0);
            telemetryInstrumentation.stop();
        }
    });
    telemetryInstrumentation.start();
    if (reliabilityTest || !capturePath.isEmpty() || exitAfter > 0) {
        poll.setInterval(50);
        QObject::connect(&poll, &QTimer::timeout, &application,
                         [&application, &engine, reliabilityTest, capturePath, exitAfter, &poll]() {
            QObject *root = engine.rootObjects().constFirst();
            if (reliabilityTest && root->property("reliabilityComplete").toBool()) {
                application.exit(0);
                return;
            }
            if (exitAfter > 0 && root->property("acceptedMessages").toInt() >= exitAfter) {
                qInfo().noquote()
                    << QStringLiteral(R"({"component":"driver-display","event":"telemetry_summary","accepted":%1,"lastSequence":%2})")
                           .arg(root->property("acceptedMessages").toInt())
                           .arg(root->property("lastSequence").toDouble(), 0, 'f', 0);
                application.exit(0);
                return;
            }
            if (!capturePath.isEmpty() && root->property("visualReady").toBool()) {
                poll.stop();
                auto *window = qobject_cast<QQuickWindow *>(root);
                if (!window) {
                    application.exit(3);
                    return;
                }
                QDir().mkpath(QFileInfo(capturePath).absolutePath());
                const bool saved = window->grabWindow().save(capturePath);
                qInfo().noquote()
                    << QStringLiteral(R"({"component":"driver-display","event":"visual_capture","saved":%1,"path":"%2"})")
                           .arg(saved ? QStringLiteral("true") : QStringLiteral("false"),
                                capturePath);
                application.exit(saved ? 0 : 3);
            }
        });
        timeout.setSingleShot(true);
        timeout.setInterval(15'000);
        QObject::connect(&timeout, &QTimer::timeout, &application, [&application]() {
            qCritical().noquote()
                << R"({"component":"driver-display","event":"reliability_timeout"})";
            application.exit(2);
        });
        poll.start();
        timeout.start();
    }

    QObject::connect(&application, &QCoreApplication::aboutToQuit, &application,
                     [rootObject, &startupTimer, &renderedFrames]() {
        qInfo().noquote()
            << QStringLiteral(R"({"component":"driver-display","event":"shutdown_summary","uptimeMs":%1,"accepted":%2,"received":%3,"lagged":%4,"lastSequence":%5,"renderedFrames":%6,"chartSamples":%7})")
                   .arg(startupTimer.elapsed())
                   .arg(rootObject->property("acceptedMessages").toInt())
                   .arg(rootObject->property("receivedMessages").toInt())
                   .arg(rootObject->property("laggedMessages").toInt())
                   .arg(rootObject->property("lastSequence").toDouble(), 0, 'f', 0)
                   .arg(renderedFrames)
                   .arg(rootObject->property("chartSampleCount").toInt());
    });
    const int result = application.exec();
    qInfo().noquote() << R"({"component":"driver-display","event":"graceful_shutdown"})";
    return result;
}

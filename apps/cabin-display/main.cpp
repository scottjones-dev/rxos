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
#include "display-placement.h"
#include "native-performance.h"

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
    application.setApplicationName(QStringLiteral("RXOS Cabin Display"));
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
    qInfo().noquote() << R"({"component":"cabin-display","event":"startup"})";

    QElapsedTimer startupTimer;
    startupTimer.start();
    QQmlApplicationEngine engine;
    engine.loadFromModule("Rxos.CabinDisplay", "Main");
    if (engine.rootObjects().isEmpty())
        return -1;
    QObject *rootObject = engine.rootObjects().constFirst();
    auto *rootWindow = qobject_cast<QQuickWindow *>(rootObject);
    rxosLogScreens(QStringLiteral("cabin-display"));
    if (!rxosPlaceWindow(rootWindow, arguments, QStringLiteral("cabin-display"), false))
        return 4;
    const QString assignedScreenName = rootWindow && rootWindow->screen()
                                           ? rootWindow->screen()->name()
                                           : QString();
    if (rootWindow) {
        QObject::connect(rootWindow, &QWindow::screenChanged, &application,
                         [rootWindow, assignedScreenName](QScreen *screen) {
            if (screen && screen->name() != assignedScreenName) {
                rootWindow->hide();
                qCritical().noquote()
                    << R"({"component":"cabin-display","event":"assigned_display_migrated","action":"hidden"})";
            }
        });
    }
    QObject::connect(&application, &QGuiApplication::screenRemoved, &application,
                     [rootWindow](QScreen *screen) {
        if (rootWindow && rootWindow->screen() == screen) {
            rootWindow->hide();
            qCritical().noquote()
                << R"({"component":"cabin-display","event":"assigned_display_disconnected"})";
        }
    });
    QObject::connect(&application, &QGuiApplication::screenAdded, &application,
                     [rootWindow, arguments](QScreen *) {
        rxosLogScreens(QStringLiteral("cabin-display"));
        if (rootWindow && !rootWindow->isVisible())
            rxosPlaceWindow(rootWindow, arguments, QStringLiteral("cabin-display"), false);
    });
    FrameTimingProbe frameTiming;
    bool firstFrame = true;
    if (rootWindow) {
        QObject::connect(rootWindow, &QQuickWindow::frameSwapped, &application,
                         [&frameTiming, &firstFrame, &startupTimer]() {
            frameTiming.recordFrame();
            if (firstFrame) {
                firstFrame = false;
                qInfo().noquote()
                    << QStringLiteral(R"({"component":"cabin-display","event":"window_visible","startupMs":%1})")
                           .arg(startupTimer.elapsed());
            }
        });
    }
    qInfo().noquote() << QStringLiteral(
        R"({"component":"cabin-display","event":"ui_ready","startupMs":%1})")
                             .arg(startupTimer.elapsed());
    qInfo().noquote()
        << QStringLiteral(R"({"component":"cabin-display","event":"shell_ready","startupMs":%1})")
               .arg(startupTimer.elapsed());
    QTimer::singleShot(0, &application, [&startupTimer]() {
        qInfo().noquote()
            << QStringLiteral(R"({"component":"cabin-display","event":"full_application_ready","startupMs":%1})")
                   .arg(startupTimer.elapsed());
    });
    int lastProfileEventSequence = -1;
    QTimer profileInstrumentation;
    profileInstrumentation.setInterval(10);
    QObject::connect(&profileInstrumentation, &QTimer::timeout, &application,
                     [rootObject, &frameTiming, &lastProfileEventSequence]() {
        const int sequence = rootObject->property("profileEventSequence").toInt();
        if (sequence == lastProfileEventSequence)
            return;
        lastProfileEventSequence = sequence;
        frameTiming.markEvent(rootObject->property("profileEventName").toString());
    });
    profileInstrumentation.start();

    const bool reliabilityTest = arguments.contains(QStringLiteral("--reliability-test"));
    const bool smokeTest = arguments.contains(QStringLiteral("--smoke-test"));
    const bool captureContinue = arguments.contains(QStringLiteral("--capture-continue"));
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
                << QStringLiteral(R"({"component":"cabin-display","event":"first_telemetry","startupMs":%1,"sequence":%2})")
                       .arg(startupTimer.elapsed())
                       .arg(rootObject->property("lastSequence").toDouble(), 0, 'f', 0);
            telemetryInstrumentation.stop();
        }
    });
    telemetryInstrumentation.start();
    if (reliabilityTest || !capturePath.isEmpty() || exitAfter > 0) {
        poll.setInterval(50);
        QObject::connect(&poll, &QTimer::timeout, &application,
                         [&application, &engine, reliabilityTest, capturePath, captureContinue, exitAfter, &poll]() {
            QObject *root = engine.rootObjects().constFirst();
            if (reliabilityTest && root->property("reliabilityComplete").toBool()) {
                application.exit(0);
                return;
            }
            if (exitAfter > 0 && root->property("acceptedMessages").toInt() >= exitAfter) {
                qInfo().noquote()
                    << QStringLiteral(R"({"component":"cabin-display","event":"telemetry_summary","accepted":%1,"lastSequence":%2})")
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
                    << QStringLiteral(R"({"component":"cabin-display","event":"visual_capture","saved":%1,"path":"%2"})")
                           .arg(saved ? QStringLiteral("true") : QStringLiteral("false"),
                                capturePath);
                if (!captureContinue || !saved)
                    application.exit(saved ? 0 : 3);
            }
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

    QObject::connect(&application, &QCoreApplication::aboutToQuit, &application,
                     [rootObject, &startupTimer, &frameTiming]() {
        qInfo().noquote()
            << QStringLiteral(R"({"component":"cabin-display","event":"shutdown_summary","uptimeMs":%1,"accepted":%2,"received":%3,"lagged":%4,"lastSequence":%5,"renderedFrames":%6,"chartSamples":%7,"chartPublished":%8,"chartRenderedPoints":%9,"presentationUpdates":%10,"presentationReplacements":%11,"hiddenWork":%12})")
                   .arg(startupTimer.elapsed())
                   .arg(rootObject->property("acceptedMessages").toInt())
                   .arg(rootObject->property("receivedMessages").toInt())
                   .arg(rootObject->property("laggedMessages").toInt())
                   .arg(rootObject->property("lastSequence").toDouble(), 0, 'f', 0)
                   .arg(frameTiming.frameCount())
                   .arg(rootObject->property("chartSampleCount").toInt())
                   .arg(rootObject->property("chartPublishedCount").toInt())
                   .arg(rootObject->property("chartRenderedPointCount").toInt())
                   .arg(rootObject->property("presentationUpdateCount").toInt())
                   .arg(rootObject->property("presentationReplacementCount").toInt())
                   .arg(rootObject->property("hiddenWorkCount").toInt());
        qInfo().noquote() << frameTiming.summary(QStringLiteral("cabin-display"));
    });
    const int result = application.exec();
    qInfo().noquote() << R"({"component":"cabin-display","event":"graceful_shutdown"})";
    return result;
}

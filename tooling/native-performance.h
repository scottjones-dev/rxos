#pragma once

#include <QElapsedTimer>
#include <QHash>
#include <QJsonDocument>
#include <QJsonObject>
#include <QString>
#include <QVector>
#include <algorithm>
#include <cmath>

class FrameTimingProbe final
{
public:
    static constexpr qsizetype MaximumIntervals = 36'000;

    void recordFrame()
    {
        ++frameCount_;
        if (!timer_.isValid()) {
            timer_.start();
            return;
        }
        const qint64 intervalUs = timer_.nsecsElapsed() / 1'000;
        timer_.restart();
        if (intervalUs > 16'700 && !currentEvent_.isEmpty())
            ++correlatedLongFrames_[currentEvent_];
        if (intervalsUs_.size() < MaximumIntervals) {
            intervalsUs_.append(intervalUs);
        } else {
            intervalsUs_[writeIndex_] = intervalUs;
            writeIndex_ = (writeIndex_ + 1) % MaximumIntervals;
            ++overwrittenIntervals_;
        }
    }

    [[nodiscard]] quint64 frameCount() const { return frameCount_; }

    void markEvent(const QString &event) { currentEvent_ = event.left(80); }

    [[nodiscard]] QString summary(const QString &component) const
    {
        QVector<qint64> sorted = intervalsUs_;
        std::sort(sorted.begin(), sorted.end());
        const auto percentileMs = [&sorted](double percentile) {
            if (sorted.isEmpty())
                return 0.0;
            const qsizetype index = static_cast<qsizetype>(
                std::ceil(percentile * static_cast<double>(sorted.size() - 1)));
            return static_cast<double>(sorted.at(index)) / 1'000.0;
        };
        const auto thresholdCount = [&sorted](qint64 thresholdUs) {
            return std::count_if(sorted.cbegin(), sorted.cend(),
                                 [thresholdUs](qint64 value) { return value > thresholdUs; });
        };
        const double maximumMs =
            sorted.isEmpty() ? 0.0 : static_cast<double>(sorted.constLast()) / 1'000.0;
        return QStringLiteral(
                   R"({"component":"%1","event":"frame_timing_summary","frames":%2,"retainedIntervals":%3,"overwrittenIntervals":%4,"medianMs":%5,"p95Ms":%6,"p99Ms":%7,"maximumMs":%8,"over16_7Ms":%9,"over33_3Ms":%10,"over50Ms":%11,"over100Ms":%12,"correlatedLongFrames":%13})")
            .arg(component)
            .arg(frameCount_)
            .arg(sorted.size())
            .arg(overwrittenIntervals_)
            .arg(percentileMs(0.50), 0, 'f', 3)
            .arg(percentileMs(0.95), 0, 'f', 3)
            .arg(percentileMs(0.99), 0, 'f', 3)
            .arg(maximumMs, 0, 'f', 3)
            .arg(thresholdCount(16'700))
            .arg(thresholdCount(33'300))
            .arg(thresholdCount(50'000))
            .arg(thresholdCount(100'000))
            .arg(correlationJson());
    }

private:
    QElapsedTimer timer_;
    QVector<qint64> intervalsUs_;
    qsizetype writeIndex_ = 0;
    quint64 frameCount_ = 0;
    quint64 overwrittenIntervals_ = 0;
    QString currentEvent_ = QStringLiteral("startup");
    QHash<QString, quint64> correlatedLongFrames_;

    [[nodiscard]] QString correlationJson() const
    {
        QJsonObject result;
        for (auto iterator = correlatedLongFrames_.cbegin();
             iterator != correlatedLongFrames_.cend(); ++iterator)
            result.insert(iterator.key(), static_cast<qint64>(iterator.value()));
        return QString::fromUtf8(QJsonDocument(result).toJson(QJsonDocument::Compact));
    }
};

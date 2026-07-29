import { performance } from "node:perf_hooks";
import { simulatedEnvelope } from "@rxos/telemetry-fixtures";
import { isTelemetryEnvelope } from "@rxos/vehicle-schema";

const RATE_HZ = 60;
const DURATION_SECONDS = 10 * 60;
const MESSAGE_COUNT = RATE_HZ * DURATION_SECONDS;
const HISTORY_CAPACITY = 600;
const history: Array<number | null> = [];
const memoryBefore = process.memoryUsage().heapUsed;
const started = performance.now();

for (let sequence = 0; sequence < MESSAGE_COUNT; sequence += 1) {
  const envelope = simulatedEnvelope(
    sequence / RATE_HZ,
    sequence,
    new Date(sequence * (1000 / RATE_HZ)).toISOString(),
  );
  if (!isTelemetryEnvelope(envelope))
    throw new Error(`Generated invalid envelope at ${sequence}`);
  history.push(sequence % 997 === 0 ? null : envelope.telemetry.rpm);
  if (history.length > HISTORY_CAPACITY)
    history.splice(0, history.length - HISTORY_CAPACITY);
}

const elapsedMs = performance.now() - started;
const memoryAfter = process.memoryUsage().heapUsed;
console.log(
  JSON.stringify({
    component: "rxos-performance-observer",
    event: "virtual_ten_minute_60hz_complete",
    messageCount: MESSAGE_COUNT,
    elapsedMs: Math.round(elapsedMs * 100) / 100,
    messagesPerSecond:
      Math.round((MESSAGE_COUNT / (elapsedMs / 1000)) * 100) / 100,
    historyCapacity: HISTORY_CAPACITY,
    historyLength: history.length,
    heapDeltaBytes: memoryAfter - memoryBefore,
    note: "Host-side deterministic processing benchmark; not real-time or automotive certification.",
  }),
);

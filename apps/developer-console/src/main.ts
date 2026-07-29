import {
  DEFAULT_TELEMETRY_URL,
  parseTelemetryMessage,
  telemetryStatus,
} from "@rxos/ipc";
import type { TelemetryEnvelope } from "@rxos/vehicle-schema";

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

const statusElement = requiredElement<HTMLSpanElement>("#status");
const metricsElement = requiredElement<HTMLElement>("#metrics");
const rawElement = requiredElement<HTMLElement>("#raw");

const fields = [
  ["speedKph", "Speed", "km/h"],
  ["rpm", "Engine", "rpm"],
  ["gear", "Gear", ""],
  ["throttlePercent", "Throttle", "%"],
  ["coolantTempC", "Coolant", "°C"],
  ["oilTempC", "Oil temp", "°C"],
  ["oilPressureKpa", "Oil pressure", "kPa"],
  ["fuelPercent", "Fuel", "%"],
  ["batteryVoltage", "Battery", "V"],
] as const;

let connected = false;
let latest: TelemetryEnvelope | undefined;

function render(): void {
  const status = telemetryStatus(latest, connected);
  statusElement.textContent = status.toUpperCase();
  statusElement.className = `status ${status}`;
  if (!latest) return;
  metricsElement.replaceChildren(
    ...fields.map(([key, label, unit]) => {
      const card = document.createElement("article");
      card.innerHTML = `<span>${label}</span><strong>${latest?.telemetry[key]}</strong><small>${unit}</small>`;
      return card;
    }),
  );
  rawElement.textContent = JSON.stringify(latest, null, 2);
}

const socket = new WebSocket(DEFAULT_TELEMETRY_URL);
socket.addEventListener("open", () => {
  connected = true;
  render();
});
socket.addEventListener("close", () => {
  connected = false;
  render();
});
socket.addEventListener("error", () => {
  connected = false;
  render();
});
socket.addEventListener("message", (event) => {
  try {
    latest = parseTelemetryMessage(String(event.data));
  } catch (error) {
    console.error("Rejected invalid telemetry", error);
  }
  render();
});

setInterval(render, 250);
render();

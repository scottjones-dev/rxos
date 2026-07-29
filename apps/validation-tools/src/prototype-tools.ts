import type {
  Circle,
  DisplayRole,
  Rectangle,
  SimulatedPowerState,
} from "@rxos/config";
import {
  circleIntersectsRectangle,
  millimetresToPixels,
  transitionPowerState,
} from "@rxos/config";

export interface OcclusionInput {
  readonly displayWidthPx: number;
  readonly displayHeightPx: number;
  readonly physicalWidthMm: number;
  readonly physicalHeightMm: number;
  readonly wheelDiameterMm: number;
  readonly wheelCentreXmm: number;
  readonly wheelCentreYmm: number;
  readonly eyePointPreset?: string;
  readonly driverHeightPreset?: string;
  readonly mountingPosition?: string;
  readonly criticalRegions: Readonly<Record<string, Rectangle>>;
}

export interface OcclusionReport {
  readonly wheel: Circle;
  readonly configuration: {
    readonly eyePointPreset: string;
    readonly driverHeightPreset: string;
    readonly mountingPosition: string;
  };
  readonly regions: readonly {
    readonly name: string;
    readonly rectangle: Rectangle;
    readonly occluded: boolean;
  }[];
  readonly physicallyVerified: false;
}

export function createOcclusionReport(input: OcclusionInput): OcclusionReport {
  if (
    !input.criticalRegions ||
    Array.isArray(input.criticalRegions) ||
    typeof input.criticalRegions !== "object"
  )
    throw new Error("Critical regions must be a named object");
  const wheel: Circle = {
    centreX: millimetresToPixels(
      input.wheelCentreXmm,
      input.physicalWidthMm,
      input.displayWidthPx,
    ),
    centreY: millimetresToPixels(
      input.wheelCentreYmm,
      input.physicalHeightMm,
      input.displayHeightPx,
    ),
    radius:
      millimetresToPixels(
        input.wheelDiameterMm,
        input.physicalWidthMm,
        input.displayWidthPx,
      ) / 2,
  };
  return {
    wheel,
    configuration: {
      eyePointPreset: input.eyePointPreset ?? "unmeasured",
      driverHeightPreset: input.driverHeightPreset ?? "unmeasured",
      mountingPosition: input.mountingPosition ?? "unmeasured",
    },
    regions: Object.entries(input.criticalRegions).map(([name, rectangle]) => ({
      name,
      rectangle,
      occluded: circleIntersectsRectangle(wheel, rectangle),
    })),
    physicallyVerified: false,
  };
}

export interface TouchTarget {
  readonly id: string;
  readonly bounds: Rectangle;
}

export interface TouchObservation {
  readonly targetId: string;
  readonly x: number;
  readonly y: number;
  readonly durationMs: number;
  readonly activatedTargetId: string | null;
}

export interface TouchResult extends TouchObservation {
  readonly hit: boolean;
  readonly missDistancePx: number;
  readonly accidentalAdjacentActivation: boolean;
}

function distanceToRectangle(
  x: number,
  y: number,
  rectangle: Rectangle,
): number {
  const dx = Math.max(rectangle.x - x, 0, x - (rectangle.x + rectangle.width));
  const dy = Math.max(rectangle.y - y, 0, y - (rectangle.y + rectangle.height));
  return Math.hypot(dx, dy);
}

export function analyseTouchSession(
  targets: readonly TouchTarget[],
  observations: readonly TouchObservation[],
): readonly TouchResult[] {
  const targetsById = new Map(targets.map((target) => [target.id, target]));
  return observations.map((observation) => {
    const target = targetsById.get(observation.targetId);
    if (!target)
      throw new Error(`Unknown touch target: ${observation.targetId}`);
    const missDistancePx = distanceToRectangle(
      observation.x,
      observation.y,
      target.bounds,
    );
    return {
      ...observation,
      hit:
        missDistancePx === 0 &&
        observation.activatedTargetId === observation.targetId,
      missDistancePx,
      accidentalAdjacentActivation:
        observation.activatedTargetId !== null &&
        observation.activatedTargetId !== observation.targetId,
    };
  });
}

export function simulatePowerCycle(
  transitions: readonly SimulatedPowerState[],
): readonly SimulatedPowerState[] {
  if (transitions.length === 0 || transitions[0] !== "off")
    throw new Error("A simulated power cycle must begin in off");
  const states: SimulatedPowerState[] = ["off"];
  for (const next of transitions.slice(1))
    states.push(
      transitionPowerState(states.at(-1) as SimulatedPowerState, next),
    );
  return states;
}

export function svgReviewOverlay(
  role: DisplayRole,
  width: number,
  height: number,
  report?: OcclusionReport,
): string {
  const circle = report
    ? `<circle cx="${report.wheel.centreX}" cy="${report.wheel.centreY}" r="${report.wheel.radius}" fill="none" stroke="#ffb020" stroke-width="4"/>`
    : "";
  const regions = (report?.regions ?? [])
    .map(
      (region) =>
        `<rect x="${region.rectangle.x}" y="${region.rectangle.y}" width="${region.rectangle.width}" height="${region.rectangle.height}" fill="${region.occluded ? "#ff334455" : "#22cc8855"}" stroke="#ffffff"/><text x="${region.rectangle.x + 6}" y="${region.rectangle.y + 20}" fill="#ffffff">${region.name}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#070a0f"/><rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#35b6ff" stroke-dasharray="12 8"/><text x="36" y="54" fill="#ffffff">RXOS ${role} physical review · simulated overlay · not physically verified</text>${circle}${regions}</svg>`;
}

export function redactDiagnosticValue(value: unknown, key = ""): unknown {
  if (/token|secret|password|authorization|cookie|credential/iu.test(key))
    return "[REDACTED]";
  if (Array.isArray(value))
    return value.map((entry) => redactDiagnosticValue(entry));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>).map(
        ([entryKey, entryValue]) => [
          entryKey,
          redactDiagnosticValue(entryValue, entryKey),
        ],
      ),
    );
  return value;
}

export function redactDiagnosticText(value: string): string {
  return value
    .replace(/\bBearer\s+\S+/giu, "Bearer [REDACTED]")
    .replace(
      /\b(token|password|secret|authorization|cookie)\s*[:=]\s*\S+/giu,
      "$1=[REDACTED]",
    );
}

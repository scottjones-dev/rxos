export type DisplayRole = "driver" | "cabin";
export type PrototypeMode =
  "development" | "fullscreen" | "physical-review" | "performance";

export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface DisplayDescriptor {
  readonly index: number;
  readonly connector: string;
  readonly identifier: string;
  readonly edidId?: string;
  readonly width: number;
  readonly height: number;
  readonly refreshHz: number | null;
  readonly densityPpi: number | null;
  readonly physicalWidthMm: number | null;
  readonly physicalHeightMm: number | null;
  readonly x: number;
  readonly y: number;
}

export interface DisplaySelector {
  readonly identifier?: string;
  readonly edidId?: string;
  readonly connector?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface PhysicalDisplayProfile {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly physicalWidthMm: number | null;
  readonly physicalHeightMm: number | null;
  readonly densityPpi: number;
  readonly safeAreaMm: Insets;
  readonly bezelMm: Insets;
}

export interface PrototypeProfile {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly mode: PrototypeMode;
  readonly allowDevelopmentFallback: boolean;
  readonly roles: Readonly<Record<DisplayRole, DisplaySelector>>;
  readonly displays: Readonly<Record<DisplayRole, PhysicalDisplayProfile>>;
}

export interface RoleAssignment {
  readonly role: DisplayRole;
  readonly display: DisplayDescriptor;
  readonly reason:
    | "identifier"
    | "edid"
    | "connector"
    | "resolution"
    | "explicit-development-fallback";
}

export interface AssignmentResult {
  readonly assignments: readonly RoleAssignment[];
  readonly errors: readonly string[];
}

export interface DisplayWindowPolicy {
  readonly fullscreen: boolean;
  readonly borderless: boolean;
  readonly cursor: "hidden" | "touch-or-pointer";
  readonly geometry: Rectangle;
}

export function displayWindowPolicy(
  role: DisplayRole,
  mode: PrototypeMode,
  display: DisplayDescriptor,
): DisplayWindowPolicy {
  const fullscreen = mode !== "development";
  return {
    fullscreen,
    borderless: fullscreen,
    cursor: role === "driver" ? "hidden" : "touch-or-pointer",
    geometry: {
      x: display.x,
      y: display.y,
      width: display.width,
      height: display.height,
    },
  };
}

export const driverCandidateGeometries = [
  { width: 1920, height: 720 },
  { width: 2560, height: 720 },
  { width: 1920, height: 480 },
] as const;

export const cabinCandidateGeometries = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 2560, height: 1600 },
] as const;

const zeroInsets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const developmentDesktopProfile: PrototypeProfile = {
  schemaVersion: 1,
  name: "development-desktop",
  mode: "development",
  allowDevelopmentFallback: true,
  roles: {
    driver: { width: 2560, height: 720 },
    cabin: { width: 1920, height: 1080 },
  },
  displays: {
    driver: {
      widthPx: 2560,
      heightPx: 720,
      physicalWidthMm: null,
      physicalHeightMm: null,
      densityPpi: 170,
      safeAreaMm: zeroInsets,
      bezelMm: zeroInsets,
    },
    cabin: {
      widthPx: 1920,
      heightPx: 1080,
      physicalWidthMm: null,
      physicalHeightMm: null,
      densityPpi: 170,
      safeAreaMm: zeroInsets,
      bezelMm: zeroInsets,
    },
  },
};

export const prototypeDualDisplayProfile: PrototypeProfile = {
  ...developmentDesktopProfile,
  name: "prototype-dual-display",
  mode: "fullscreen",
  allowDevelopmentFallback: false,
};

function matches(
  displays: readonly DisplayDescriptor[],
  predicate: (display: DisplayDescriptor) => boolean,
): readonly DisplayDescriptor[] {
  return displays.filter(predicate);
}

function uniqueMatch(
  role: DisplayRole,
  reason: RoleAssignment["reason"],
  candidates: readonly DisplayDescriptor[],
): RoleAssignment | string | undefined {
  if (candidates.length === 1)
    return { role, reason, display: candidates[0] as DisplayDescriptor };
  if (candidates.length > 1)
    return `${role} display selector ${reason} is ambiguous (${candidates.length} matches)`;
  return undefined;
}

function assignRole(
  role: DisplayRole,
  selector: DisplaySelector,
  displays: readonly DisplayDescriptor[],
  allowDevelopmentFallback: boolean,
): RoleAssignment | string {
  const attempts: readonly [
    RoleAssignment["reason"],
    string | undefined,
    (display: DisplayDescriptor, value: string) => boolean,
  ][] = [
    [
      "identifier",
      selector.identifier,
      (display, value) => display.identifier === value,
    ],
    ["edid", selector.edidId, (display, value) => display.edidId === value],
    [
      "connector",
      selector.connector,
      (display, value) => display.connector === value,
    ],
  ];
  for (const [reason, value, predicate] of attempts) {
    if (value === undefined) continue;
    const result = uniqueMatch(
      role,
      reason,
      matches(displays, (display) => predicate(display, value)),
    );
    if (result !== undefined) return result;
  }
  if (selector.width !== undefined && selector.height !== undefined) {
    const result = uniqueMatch(
      role,
      "resolution",
      matches(
        displays,
        (display) =>
          display.width === selector.width &&
          display.height === selector.height,
      ),
    );
    if (result !== undefined) return result;
  }
  if (allowDevelopmentFallback && displays.length > 0)
    return {
      role,
      display: displays[
        role === "driver" ? 0 : Math.min(1, displays.length - 1)
      ] as DisplayDescriptor,
      reason: "explicit-development-fallback",
    };
  return `${role} display is missing; no implicit fallback is permitted`;
}

export function assignDisplayRoles(
  displays: readonly DisplayDescriptor[],
  selectors: Readonly<Record<DisplayRole, DisplaySelector>>,
  allowDevelopmentFallback: boolean,
): AssignmentResult {
  const assignments: RoleAssignment[] = [];
  const errors: string[] = [];
  for (const role of ["driver", "cabin"] as const) {
    const result = assignRole(
      role,
      selectors[role],
      displays,
      allowDevelopmentFallback,
    );
    if (typeof result === "string") errors.push(result);
    else assignments.push(result);
  }
  if (
    assignments.length === 2 &&
    assignments[0]?.display.identifier === assignments[1]?.display.identifier
  )
    errors.push("driver and cabin roles resolved to the same display");
  return {
    assignments: errors.length === 0 ? assignments : [],
    errors,
  };
}

export function millimetresToPixels(
  millimetres: number,
  physicalMillimetres: number,
  pixels: number,
): number {
  if (
    !Number.isFinite(millimetres) ||
    !Number.isFinite(physicalMillimetres) ||
    !Number.isFinite(pixels) ||
    physicalMillimetres <= 0 ||
    pixels <= 0
  )
    throw new Error(
      "Physical dimensions and pixel dimensions must be positive",
    );
  return (millimetres / physicalMillimetres) * pixels;
}

export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Circle {
  readonly centreX: number;
  readonly centreY: number;
  readonly radius: number;
}

export function circleIntersectsRectangle(
  circle: Circle,
  rectangle: Rectangle,
): boolean {
  const closestX = Math.max(
    rectangle.x,
    Math.min(circle.centreX, rectangle.x + rectangle.width),
  );
  const closestY = Math.max(
    rectangle.y,
    Math.min(circle.centreY, rectangle.y + rectangle.height),
  );
  return (
    (circle.centreX - closestX) ** 2 + (circle.centreY - closestY) ** 2 <=
    circle.radius ** 2
  );
}

export type RotaryAction =
  | "rotate-clockwise"
  | "rotate-anticlockwise"
  | "press"
  | "back"
  | "home"
  | "menu"
  | "favourite";

export interface RotaryState {
  readonly focusedDisplay: DisplayRole;
  readonly focusIndex: number;
  readonly focusCount: number;
  readonly activatedIndex: number | null;
  readonly requestedAction: "back" | "home" | "menu" | "favourite" | null;
}

export function applyRotaryAction(
  state: RotaryState,
  action: RotaryAction,
): RotaryState {
  if (state.focusedDisplay !== "cabin") return state;
  const count = Math.max(1, state.focusCount);
  if (action === "rotate-clockwise")
    return { ...state, focusIndex: (state.focusIndex + 1) % count };
  if (action === "rotate-anticlockwise")
    return { ...state, focusIndex: (state.focusIndex - 1 + count) % count };
  if (action === "press") return { ...state, activatedIndex: state.focusIndex };
  return { ...state, requestedAction: action };
}

export type SimulatedPowerState =
  | "off"
  | "accessory"
  | "ignition-on"
  | "cranking"
  | "running"
  | "shutdown-requested"
  | "graceful-shutdown"
  | "forced-power-loss"
  | "recovery";

const allowedPowerTransitions: Readonly<
  Record<SimulatedPowerState, readonly SimulatedPowerState[]>
> = {
  off: ["accessory", "ignition-on"],
  accessory: ["ignition-on", "shutdown-requested", "forced-power-loss"],
  "ignition-on": [
    "cranking",
    "running",
    "shutdown-requested",
    "forced-power-loss",
  ],
  cranking: ["running", "ignition-on", "forced-power-loss"],
  running: ["shutdown-requested", "forced-power-loss"],
  "shutdown-requested": ["graceful-shutdown", "forced-power-loss"],
  "graceful-shutdown": ["off"],
  "forced-power-loss": ["recovery", "off"],
  recovery: ["accessory", "off"],
};

export function transitionPowerState(
  current: SimulatedPowerState,
  next: SimulatedPowerState,
): SimulatedPowerState {
  if (!allowedPowerTransitions[current].includes(next))
    throw new Error(
      `Invalid simulated power transition: ${current} -> ${next}`,
    );
  return next;
}

export interface BrightnessState {
  readonly theme: "day" | "night";
  readonly brightness: number;
}

export function updateSimulatedBrightness(
  state: BrightnessState,
  ambientLux: number,
  options: {
    readonly lowLux: number;
    readonly highLux: number;
    readonly minimum: number;
    readonly maximum: number;
  },
): BrightnessState {
  if (options.lowLux >= options.highLux)
    throw new Error("Brightness hysteresis requires lowLux < highLux");
  const theme =
    state.theme === "day"
      ? ambientLux < options.lowLux
        ? "night"
        : "day"
      : ambientLux > options.highLux
        ? "day"
        : "night";
  const normalized = Math.max(0, Math.min(1, ambientLux / options.highLux));
  return {
    theme,
    brightness: Math.max(
      options.minimum,
      Math.min(
        options.maximum,
        options.minimum + normalized * (options.maximum - options.minimum),
      ),
    ),
  };
}

export function bootReadinessIsOrdered(
  markers: Readonly<Record<string, number>>,
): boolean {
  const order = [
    "processStart",
    "windowVisible",
    "qmlReady",
    "essentialUiReady",
    "firstTelemetry",
  ];
  return order.every(
    (key, index) =>
      typeof markers[key] === "number" &&
      (index === 0 ||
        (markers[key] as number) >=
          (markers[order[index - 1] as string] as number)),
  );
}

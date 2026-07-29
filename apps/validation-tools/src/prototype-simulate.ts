import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  applyRotaryAction,
  bootReadinessIsOrdered,
  type RotaryState,
  type RotaryAction,
  type SimulatedPowerState,
} from "@rxos/config";
import { simulatePowerCycle } from "./prototype-tools.js";

const scenario = process.argv[2];
const output = resolve(
  process.argv[3] ?? `build/prototype-${scenario ?? "simulation"}.json`,
);
let result: unknown;
if (scenario === "rotary") {
  const actions: readonly RotaryAction[] = [
    "rotate-clockwise",
    "rotate-clockwise",
    "press",
    "back",
    "home",
  ];
  let state: RotaryState = {
    focusedDisplay: "cabin" as const,
    focusIndex: 0,
    focusCount: 7,
    activatedIndex: null as number | null,
    requestedAction: null as "back" | "home" | "menu" | "favourite" | null,
  };
  const states = [state];
  for (const action of actions) {
    state = applyRotaryAction(state, action);
    states.push(state);
  }
  result = { component: "prototype-simulation", scenario, actions, states };
} else if (scenario === "power") {
  const graceful: readonly SimulatedPowerState[] = [
    "off",
    "accessory",
    "ignition-on",
    "cranking",
    "running",
    "shutdown-requested",
    "graceful-shutdown",
    "off",
  ];
  const interrupted: readonly SimulatedPowerState[] = [
    "off",
    "accessory",
    "ignition-on",
    "cranking",
    "running",
    "forced-power-loss",
    "recovery",
    "accessory",
  ];
  result = {
    component: "prototype-simulation",
    scenario,
    graceful: simulatePowerCycle(graceful),
    interrupted: simulatePowerCycle(interrupted),
    localStatePersistence: "none; no persistent store exists in this milestone",
  };
} else if (scenario === "boot") {
  const driverMarkers = {
    processStart: 0,
    windowVisible: 25,
    qmlReady: 40,
    essentialUiReady: 45,
    firstTelemetry: 125,
  };
  const cabinMarkers = {
    processStart: 0,
    windowVisible: 30,
    qmlReady: 50,
    essentialUiReady: 60,
    firstTelemetry: 130,
    shellReady: 60,
    fullApplicationReady: 90,
  };
  result = {
    component: "prototype-simulation",
    scenario,
    driver: {
      markers: driverMarkers,
      ordered: bootReadinessIsOrdered(driverMarkers),
    },
    cabin: {
      markers: cabinMarkers,
      ordered:
        bootReadinessIsOrdered(cabinMarkers) &&
        cabinMarkers.shellReady <= cabinMarkers.fullApplicationReady,
    },
    synthetic: true,
  };
} else throw new Error("Usage: prototype-simulate rotary|power|boot [output]");
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

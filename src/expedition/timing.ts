// Evacuation / lift timings. Values come from FX_PARAMS (mechaniki §2.9 / §2.16) so they
// cannot drift from the FX table. Tests lock the spec numbers (2000, 1000, 5/7/9, …).
import { FX_PARAMS } from '../data/fx-params';

function fxNumber(
  key:
    | 'LIFT_RIDE_MS'
    | 'LIFT_DEPART_MS'
    | 'LIFT_RIDE_SKIP_AFTER_MS'
    | 'EVAC_CALL_HOLD_MS'
    | 'EVAC_HOLD_S'
    | 'EVAC_RECALL_COOLDOWN_S'
    | 'EVAC_ALERT_RADIUS',
): number {
  const value = FX_PARAMS[key].value;
  if (typeof value !== 'number') throw new Error(`FX_PARAMS.${key} is not a number`);
  return value;
}

export const LIFT_RIDE_MS = fxNumber('LIFT_RIDE_MS');
export const LIFT_DEPART_MS = fxNumber('LIFT_DEPART_MS');
export const LIFT_RIDE_SKIP_AFTER_MS = fxNumber('LIFT_RIDE_SKIP_AFTER_MS');
export const EVAC_CALL_HOLD_MS = fxNumber('EVAC_CALL_HOLD_MS');
export const EVAC_HOLD_MS = fxNumber('EVAC_HOLD_S') * 1000;
export const EVAC_RECALL_COOLDOWN_MS = fxNumber('EVAC_RECALL_COOLDOWN_S') * 1000;
export const EVAC_ALERT_RADIUS = fxNumber('EVAC_ALERT_RADIUS');

export type ZoneDepth = 1 | 2 | 3;

export function isZoneDepth(value: number): value is ZoneDepth {
  return value === 1 || value === 2 || value === 3;
}

/** Travel time of the evac lift, in ms, by the depth it was called from. */
export function evacArriveMs(depth: ZoneDepth): number {
  const table = FX_PARAMS.EVAC_ARRIVE_S.value;
  if (typeof table === 'number' || typeof table === 'string' || typeof table === 'boolean') {
    throw new Error('FX_PARAMS.EVAC_ARRIVE_S is not a depth table');
  }
  const seconds = table[depth];
  if (typeof seconds !== 'number') throw new Error(`No evac arrive time for depth ${depth}`);
  return seconds * 1000;
}

// English lines for the Power Lines window and the network-progress texts it surfaces.
// Copied from docs/fabula/teksty-m1-en.md (approved GD 25.10.2026). Section 11 wins where
// an earlier line was shortened (M1_TERM_OK, M1_TERM_FAIL, M1_TERM_LOW, names, tips).
import type { ElementId } from '../puzzles/power-lines/types';

export const TERM_COPY = {
  M1_SYS_04: 'Enemies nearby. Fight first.',
  M1_UI_ROTATE_TERMINAL: 'Turn your phone to use the terminal.',
  M1_BASE_08:
    'Power to the bunker is back. The lights above the base are on. You can see them from the zone now.',
  M1_BASE_09: 'Line restored. A new part of Sector 1 is on the map. Good work.',
  M1_BASE_17: 'The lift stops at depth 2 now. The Vat prints better Issue gear for you.',
  M1_BOSS_DEFEAT:
    'The rail guard is down. The depot line is free. You can now restore the last part of Sector 1.',

  M1_TERM_HEADER:
    'BASE ORDER: POWER LINES — LINE 1. Send power to the right places. Do not overload the lines.',
  M1_TERM_RETUNE: 'BASE ORDER: This line works again, but it needs new numbers.',
  M1_TERM_DONE: 'This line is on. Nothing to do here.',

  M1_TERM_01:
    'This box sent power from the solar farm to the town. Now the farm is dark, and the town is dark too.',
  M1_TERM_02:
    'This pump station gave water to every house in Ashfield. The pumps are still, and the pipes are dry.',
  M1_TERM_03:
    'This box powered the lights and doors in the rail hall. Without it, the trains sleep in the dark.',
  M1_TERM_04:
    'Power for forty homes went through this box. Someone wrote on it: "Please fix soon."',
  M1_TERM_05:
    'The service drones charged here every night. Some still come back and wait for power.',
  M1_TERM_06:
    'This box ran the lights and gates at the rail crossing. The gates are down, and they will not go up.',
  M1_TERM_07:
    'A small shop used this box for its fridges and lights. The sign still says "OPEN 24 HOURS".',
  M1_TERM_08:
    'This line goes down to your bunker. Fix it, and BASE can turn on the lights above the base.',

  M1_TERM_01_NAME: 'Solar Farm',
  M1_TERM_02_NAME: 'Pump Station',
  M1_TERM_03_NAME: 'Rail Hall',
  M1_TERM_04_NAME: 'Houses',
  M1_TERM_05_NAME: 'Drone Dock',
  M1_TERM_06_NAME: 'Rail Crossing',
  M1_TERM_07_NAME: 'Corner Shop',
  M1_TERM_08_NAME: 'Bunker Line',

  M1_TERM_OK: 'Line restored. Power is flowing. Map updated.',
  M1_TERM_OK_RETUNE: 'Line restored. Power is flowing. Good work.',
  M1_TERM_LOW: 'Not enough power. Some devices are still off.',
  M1_TERM_FAIL: 'Overload. The line is off for now.',
  M1_TERM_TRIP: 'Bad split. {box_power} does not split into {box_lines} equal parts.',
  M1_TERM_FUSE: 'Over the limit. Only {fuse_max} can go through here.',
  M1_TERM_SHORT: 'Closed ring. Power goes round and round. Nothing works.',

  M1_TERM_BTN_SEND: 'SEND',
  M1_TERM_BTN_RESET: 'RESET',
  M1_TERM_BTN_EXIT: 'EXIT',
  M1_TERM_BTN_HELP: '?',
  M1_TERM_BTN_WAIT: 'WAIT',
  M1_TERM_BTN_NEXT: 'NEXT',
  M1_TERM_BTN_MORE: 'MORE',
  M1_TERM_HELP_TITLE: 'HELP',
  M1_TERM_TAG_NEW: 'NEW',
  M1_TERM_TAG_TIP: 'TIP',
  M1_TERM_TAG_TIP_N: 'TIP {n}/3',

  M1_TERM_LEG_SOURCE: 'All power starts here. The number is how much.',
  M1_TERM_LEG_CABLE: 'Power goes along the wire.',
  M1_TERM_LEG_JUNCTION: 'A box splits power into equal parts. One part for each open wire.',
  M1_TERM_LEG_SWITCH: 'Tap a switch to turn it on or off. = is on. / is off.',
  M1_TERM_LEG_CONSUMER:
    'The number is the power this device needs. More burns it. Less leaves it off.',
  M1_TERM_LEG_GROUND: 'Ground takes any power. Send extra power here.',
  M1_TERM_LEG_FUSE:
    'Only this much power can go through. Count all of it, also power for the ground.',
  M1_TERM_LEG_SUM: 'Two or more wires can feed one device. The power adds up.',
  M1_TERM_LEG_PASS: 'A device on the way takes what it needs. The rest goes on.',
  M1_TERM_LEG_RING: 'Never make a ring. Power goes round and round, and nothing works.',

  M1_TERM_04_TIP_1: 'Power from two wires adds up in one device.',
  M1_TERM_04_TIP_2: 'One wire is not enough. Add a second wire so the sum is just right.',
  M1_TERM_04_TIP_3: 'Keep the left wire ON. Add each other POWER IN to it. Which sum is right?',
  M1_TERM_07_TIP_1: 'The biggest number is not always the best.',
  M1_TERM_07_TIP_2: 'Count each device on its own. Which wires add up to just its need?',
  M1_TERM_07_TIP_3: 'Left device: leave the top POWER IN OFF. Right device: add a small extra.',
  M1_TERM_08_TIP_1: 'Sometimes you need three wires, not two.',
  M1_TERM_08_TIP_2: 'No two wires give the big device its need. Try three wires.',
  M1_TERM_08_TIP_3:
    'Big device: one big POWER IN must go OFF. The small device needs just one more.',
  M1_TERM_05_TIP_1: 'Too much power? Send some of it into the ground.',
  M1_TERM_05_TIP_2: 'The top box needs three ON ways out to give each device the right part.',
  M1_TERM_05_TIP_3: 'Power both devices. The grounds below take one part. It must split evenly.',
  M1_TERM_01_TIP_1: 'One box gives power to the next box. Count each box on its own.',
  M1_TERM_01_TIP_2:
    'Start with the device right of the first box. How many parts must that box make?',
  M1_TERM_01_TIP_3:
    'The first box needs three parts, so the top ground helps. And the lower ground?',
  M1_TERM_02_TIP_1: 'Never make a ring. A device gets a different part from a different box.',
  M1_TERM_02_TIP_2:
    'The middle device can get power from the top or bottom box. Try the other one.',
  M1_TERM_02_TIP_3: 'Each right box gets half to split. The ground by POWER IN is a trap.',
  M1_TERM_06_TIP_1:
    '{source_power} cannot split into three equal parts. Something must take power first.',
  M1_TERM_06_TIP_2:
    'Use one way: past the top device or the left one. The other is then at the end.',
  M1_TERM_06_TIP_3: 'Let the top device take its part first. Then the next box needs three parts.',
  M1_TERM_03_TIP_1: 'Start from the limit and count back.',
  M1_TERM_03_TIP_2:
    'The first device on the wire takes its part. How many parts does the box need?',
  M1_TERM_03_TIP_3:
    'Go the long way to the bottom device, past the small one. Only one ground is ON.',
} as const;

export type TermTextId = keyof typeof TERM_COPY;

/** Screen-reader name for the `?` button (teksty §11.1: the glyph stays `?`). */
export const TERM_HELP_ARIA = 'Help';

/** Panel row format `M1_UI_TERM_RCV_ROW`: `{receiver} {got}/{need}`. */
export function consumerCounter(id: string, got: number | null, need: number): string {
  return `${id} ${got === null ? '–' : got}/${need}`;
}

export function termLine(
  id: TermTextId,
  tokens?: Readonly<Record<string, string | number>>,
): string {
  const raw: string = TERM_COPY[id];
  if (!tokens) return raw;
  return raw.replace(/\{([a-z0-9_]+)\}/gi, (full, key: string) => {
    const value = tokens[key];
    return value === undefined ? full : String(value);
  });
}

/** Legend label beside each `M1_TERM_LEG_*` line (teksty §11.3). */
export const TERM_LEGEND: Readonly<Record<ElementId, { label: string; textId: TermTextId }>> = {
  source: { label: 'POWER IN', textId: 'M1_TERM_LEG_SOURCE' },
  multi_source: { label: 'ADD UP', textId: 'M1_TERM_LEG_SUM' },
  cable: { label: 'WIRE', textId: 'M1_TERM_LEG_CABLE' },
  junction: { label: 'BOX', textId: 'M1_TERM_LEG_JUNCTION' },
  switch: { label: 'SWITCH', textId: 'M1_TERM_LEG_SWITCH' },
  consumer: { label: 'DEVICE', textId: 'M1_TERM_LEG_CONSUMER' },
  ground: { label: 'GROUND', textId: 'M1_TERM_LEG_GROUND' },
  fuse: { label: 'LIMIT', textId: 'M1_TERM_LEG_FUSE' },
  pass_through: { label: 'ON THE WAY', textId: 'M1_TERM_LEG_PASS' },
  ring: { label: 'RING', textId: 'M1_TERM_LEG_RING' },
};

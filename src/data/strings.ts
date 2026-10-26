// All in-game text (English). Lore / Dialogue department owns the wording.
export const STRINGS = {
  paused: 'PAUSED',
  pausedAuto: 'Paused automatically. Progress saved.',
  pausedMenu: 'Progress saved.',
  /** §1.11 trigger D – shown above pausedMenu. */
  hitWhileAway: 'You were hit while away.',
  resume: 'RESUME',
  pauseButton: 'Pause (Esc)',
  exportFile: 'Export save (.json)',
  importFile: 'Import save (.json)',
  copyCode: 'Copy save code',
  importCode: 'Load save code',
  codePlaceholder: 'Paste a save code here',
  saved: 'Saved',
  codeCopied: 'Save code copied',
  codeShown: 'Save code below – copy it manually',
  imported: 'Save loaded',
  importFailed: 'Could not load save',
  hint: 'WASD: move · Arrows / mouse: aim · Space / J: attack · LMB: attack · Esc / P: pause',
  resumeHint: 'Esc · P · Enter',
  // HUD, touch controls, text window (PROG / UI i Menu; wording: Dialogue / Lore)
  hpLabel: 'HP',
  hpAria: 'Health',
  attackAria: 'Attack',
  joystickAria: 'Move',
  aimStickAria: 'Aim',
  autoAimOn: 'Auto-aim: on',
  autoAimOff: 'Auto-aim: off',
  skillDash: 'DASH',
  skillPulse: 'PULSE',
  skillDrone: 'DRONE',
  textNext: 'NEXT',
  textClose: 'CLOSE',
  textCloseHint: 'Esc: close',
  textPage: 'Page',
  countdownAria: 'Resuming',
  // Death screen (fabula/teksty-m1-en.md; M1_DEATH_01/02/BTN texts come from fx_death_screen)
  /** M1_BASE_04 */
  deathTitle: 'Signal lost. Hunter 47 is down. Starting a new print.',
  /** Boss name (teksty §6) – not in FX_GLYPHS_M1 enemies. */
  bossName: 'Rail Guardian',
  /** LOST line (ui-m1 §11.10) – shown only when the inventory provides the loss. */
  deathLost: 'Lost: {cr} cr · {items} items',
  deathNextAria: 'Continue',
  // Lift, descent confirm, evacuation (fabula/teksty-m1-en.md). Tokens stay as written.
  /** M1_RISK_01 */
  riskDescend: 'Go deeper? You can lose {at_risk} cr.',
  /** M1_RISK_01_YES */
  riskDescendYes: 'GO DOWN',
  /** M1_RISK_01_NO */
  riskDescendNo: 'STAY',
  /** M1_RISK_01B */
  riskGate: 'Fight the boss? You can lose {at_risk} cr.',
  /** M1_RISK_01B_YES */
  riskGateYes: 'GO IN',
  /** M1_RISK_SETTING */
  riskSetting: 'Ask before going deeper',
  /** M1_BASE_05 */
  liftWelcome: 'Welcome back, Hunter 47. Syncing memory. Please do not move during the sync.',
  /** M1_BASE_06 */
  liftHere: 'The lift is here. I can hold it for 10 seconds. Please be fast.',
  /** M1_BASE_07 */
  liftLeft: 'The lift is going down. I cannot hold it longer. Call again when you can.',
  /** M1_SYS_05 */
  liftLoud: 'The lift is loud. Enemies are coming.',
  /** M1_UI_LIFT_COMING */
  liftComing: 'LIFT {s}',
  /** M1_UI_LIFT_HERE */
  liftGetIn: 'GET IN {s}',
  /** M1_UI_BTN_LIFT */
  liftButton: 'LIFT',
  /** M1_UI_CALL */
  liftCall: 'CALL',
  /** M1_GEAR_ISSUE_TOPUP. `{MEDPATCH_COUNT}` is the bag count after the refill. */
  medpatchTopUp: 'I refilled your Med-Patches. You have {MEDPATCH_COUNT} now.',
  /** Short names from the M1_LOC_D1–D3 headings (ui-m1 §3.6). */
  depthName1: 'Outskirts',
  depthName2: 'Solar Fields',
  depthName3: 'Rail Depot',
  /** Picker row. `{n}` is the depth. */
  liftDepth: 'DEPTH {n}',
} as const;

/** Replace `{token}` placeholders. Unknown tokens are left as written. */
export function fillString(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (full, key: string) => {
    const value = vars[key];
    return value === undefined ? full : String(value);
  });
}

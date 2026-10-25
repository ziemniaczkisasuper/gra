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
  hint: 'WASD: move · Arrows / mouse: aim · Space / J: attack · Esc / P: pause',
  resumeHint: 'Esc · P · Enter',
  // HUD, touch controls, text window (PROG / UI i Menu; wording: Dialogue / Lore)
  hpLabel: 'HP',
  hpAria: 'Health',
  attackAria: 'Attack',
  joystickAria: 'Move',
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
} as const;

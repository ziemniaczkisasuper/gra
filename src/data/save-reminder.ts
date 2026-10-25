// Export reminder thresholds (save protection on iOS Safari & co.). Engine data, tune here.
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const EXPORT_REMINDER = {
  /** 'interval': at least this long since the last export… */
  intervalMs: 3 * DAY,
  /** …and at least this much playtime since the last export (also for 'neverExported'). */
  minPlaytimeSinceExportMs: 30 * MIN,
  /** snoozeExportReminder(): no export reasons for this long. */
  snoozeMs: 24 * HOUR,
  /** dismissIosHint(): no 'iosNotStandalone' reason for this long. */
  iosHintHideMs: 7 * DAY,
} as const;

export const DAY_MS = DAY;

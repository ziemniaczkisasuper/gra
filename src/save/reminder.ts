import { DAY_MS, EXPORT_REMINDER } from '../data/save-reminder';

/** Save-protection bookkeeping (stored as optional top-level fields of save v3). */
export interface SaveMeta {
  /** Total unpaused playtime (sum of simulation ticks). */
  playtimeMs: number;
  /** Unpaused playtime since the last export (= playtimeMs if never exported). */
  playtimeSinceExportMs: number;
  lastExportAt: number | null;
  exportReminderSnoozedUntil: number | null;
  iosHintHiddenUntil: number | null;
}

export function freshSaveMeta(): SaveMeta {
  return {
    playtimeMs: 0,
    playtimeSinceExportMs: 0,
    lastExportAt: null,
    exportReminderSnoozedUntil: null,
    iosHintHiddenUntil: null,
  };
}

export type ExportReminderReason = 'interval' | 'neverExported' | 'iosNotStandalone';

/** Payload of `save:exportReminder` (contract agreed with PROG / UI i Menu). */
export interface ExportReminder {
  reasons: ExportReminderReason[];
  daysSinceExport: number | null;
  playtimeSinceExportMs: number;
}

/**
 * Pure decision (injected clock + environment):
 * - 'neverExported': never exported and playtimeSinceExport >= 30 min,
 * - 'interval': >= 3 days since the last export and playtimeSinceExport >= 30 min,
 *   (both suppressed while snoozed: now < exportReminderSnoozedUntil),
 * - 'iosNotStandalone': iOS browser tab, unless dismissed (now < iosHintHiddenUntil) –
 *   independent of the export snooze.
 * Returns null when there is no reason.
 */
export function evaluateExportReminder(
  meta: SaveMeta,
  now: number,
  iosNotStandalone: boolean,
  cfg: typeof EXPORT_REMINDER = EXPORT_REMINDER,
): ExportReminder | null {
  const reasons: ExportReminderReason[] = [];
  const snoozed = meta.exportReminderSnoozedUntil !== null && now < meta.exportReminderSnoozedUntil;
  const enoughPlay = meta.playtimeSinceExportMs >= cfg.minPlaytimeSinceExportMs;
  if (!snoozed && enoughPlay) {
    if (meta.lastExportAt === null) reasons.push('neverExported');
    else if (now - meta.lastExportAt >= cfg.intervalMs) reasons.push('interval');
  }
  const iosHidden = meta.iosHintHiddenUntil !== null && now < meta.iosHintHiddenUntil;
  if (iosNotStandalone && !iosHidden) reasons.push('iosNotStandalone');
  if (reasons.length === 0) return null;
  return {
    reasons,
    daysSinceExport:
      meta.lastExportAt === null
        ? null
        : Math.max(0, Math.floor((now - meta.lastExportAt) / DAY_MS)),
    playtimeSinceExportMs: meta.playtimeSinceExportMs,
  };
}

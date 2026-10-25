// Browser-only helpers (DOM). Kept out of schema/codec so those stay unit-testable.
import { parseSaveText, saveToJson } from './codec';
import type { SaveData } from './schema';

export function downloadSaveFile(data: SaveData): void {
  const blob = new Blob([saveToJson(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date(data.savedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `gra-save-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens a file picker; resolves with the parsed save or rejects (SaveError) / null if cancelled. */
export function pickSaveFile(): Promise<SaveData | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then((t) => {
        try {
          resolve(parseSaveText(t));
        } catch (e) {
          reject(e);
        }
      }, reject);
    });
    input.click();
  });
}

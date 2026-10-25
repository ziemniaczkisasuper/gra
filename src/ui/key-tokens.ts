// Key-name tokens {KEY_*} for texts (prog/ui-m1.md: "Tokeny klawiszy podstawia UI").
// 25.10.2026 (twin-stick, Lore confirmed): arrows aim, movement only WASD.
// GRAF to confirm: the key frame next to @ for movement shows W A S D (arrows = aiming).
// Shown short (≤ 5 chars per key) in the hint bar; full names here.

export const KEY_TOKENS = {
  KEY_MOVE: 'WASD',
  KEY_AIM: 'arrows / mouse',
  KEY_USE: 'E',
  KEY_HEAL: 'Q',
  KEY_PAUSE: 'Esc',
  KEY_SKILL1: '1',
  KEY_SKILL2: '2',
  KEY_SKILL3: '3',
} as const;

export type KeyToken = keyof typeof KEY_TOKENS;

/** Replace {KEY_*} tokens; unknown tokens stay as they are (visible in QA). */
export function fillKeyTokens(
  text: string,
  map: Readonly<Record<string, string>> = KEY_TOKENS,
): string {
  return text.replace(/\{(KEY_[A-Z0-9_]+)\}/g, (m, k: string) => map[k] ?? m);
}

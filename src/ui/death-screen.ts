// Death screen M1 (mechaniki-m1 v0.5.2 §2.14a, assety-m1 v1.3 §15 fx_death_screen,
// prog/ui-m1.md §11.10). Owner: PROG / UI i Menu. DOM only; the respawn itself is NOT done
// here – `onNext` is a callback for the owner of the death sequence (Gameplay / main.ts).
import { COMBAT_EXTRAS, COMBAT_STRINGS } from '../data/combat-m0';
import { FX } from '../data/fx';
import type { FxLine } from '../data/fx';
import { FX_GLYPHS_M1_DATA } from '../data/fx-m1';
import { STRINGS } from '../data/strings';
import { ENEMY_GLYPHS } from '../data/style';
import type { DeathCause } from '../combat/state';
import { el } from './dom';

const DEF = FX.fx_death_screen!;
/** 1500 / 5000 ms from data/combat-m0.ts (fx_death_screen.params carries the same values). */
export const DEATH_MIN_MS = COMBAT_EXTRAS.DEATH_SCREEN_MIN_MS;
export const DEATH_AUTO_MS = COMBAT_EXTRAS.DEATH_SCREEN_AUTO_MS;
/** Shape of fx_death_screen.input (assety v1.3 §15; same as data/fx.ts FxInput). */
export interface DeathInput {
  accept: readonly string[];
  reject: readonly string[];
  edgeOnly: boolean;
}
/** Used only until the FX import carrying `input` lands (mechaniki v0.5.2 §2.14a). */
const SPEC_INPUT: DeathInput = {
  accept: ['tap', 'Enter'],
  reject: ['Space', 'J', 'ATK'],
  edgeOnly: true,
};
/** Accepted / rejected inputs straight from fx_death_screen.input (no own key lists). */
export const DEATH_INPUT: DeathInput = (DEF as { input?: DeathInput }).input ?? SPEC_INPUT;

const lines = (DEF.frames?.[DEF.frames.length - 1]?.lines ?? []) as readonly FxLine[];
const lineText = (id: string, fallback: string) =>
  (lines.find((l) => l.textId === id)?.text as string | undefined) ?? fallback;

/** KeyboardEvent.code values for the accepted keys ('Enter' → both Enter keys). */
export function acceptedCodes(input: DeathInput = DEATH_INPUT): string[] {
  const out: string[] = [];
  for (const a of input.accept) if (a === 'Enter') out.push('Enter', 'NumpadEnter');
  return out;
}
export const acceptsTap = (input: DeathInput = DEATH_INPUT) => input.accept.includes('tap');

export interface DeathLossView {
  cr: number;
  items: number;
}

export interface DeathScreenData {
  /** null = killer unknown → the M1_DEATH_01 line is hidden. */
  killerName: string | null;
  /** Damage of the last ≤ 3 hits, oldest first (last = killing blow); [] hides the line. */
  lastHits: number[];
  /** Only when the inventory module provides it (not in M1 code yet). */
  lost?: DeathLossView | null;
}

/** Name of an enemy type (teksty §6 via FX_GLYPHS_M1); boss and M0 crawler included. */
export function enemyName(type: string): string | null {
  if (type === 'railGuardian') return STRINGS.bossName;
  if (type === 'crawler') return COMBAT_STRINGS.enemyName;
  const g = (ENEMY_GLYPHS as Record<string, { glyph: string } | undefined>)[type]?.glyph;
  const e = g
    ? (FX_GLYPHS_M1_DATA.enemies as Record<string, { name: string } | undefined>)[g]
    : undefined;
  return e?.name ?? null;
}

/** Screen data from Gameplay's getCombatDeath(state). */
export function deathScreenData(
  cause: DeathCause | null,
  lost?: DeathLossView | null,
): DeathScreenData {
  return {
    killerName: cause?.killer ? enemyName(cause.killer.enemyType) : null,
    lastHits: (cause?.lastHits ?? []).slice(-3).map((h) => h.dmg),
    lost: lost ?? null,
  };
}

/** 'Killed by: Curfew Guard' or null (line hidden). */
export function killedByText(name: string | null): string | null {
  return name
    ? lineText('M1_DEATH_01', 'Killed by: {enemy_name}').replace('{enemy_name}', name)
    : null;
}

/** 'Last hits: -6 · -9 · -18'; empty slots drop with their separator; [] → null. */
export function lastHitsText(hits: readonly number[]): string | null {
  if (!hits.length) return null;
  const tpl = lineText('M1_DEATH_02', 'Last hits: {hit_1} · {hit_2} · {hit_3}');
  const sep = (lines.find((l) => l.textId === 'M1_DEATH_02')?.separator as string) ?? ' · ';
  const head = tpl.slice(0, tpl.indexOf('{hit_1}'));
  return (
    head +
    hits
      .slice(-3)
      .map((d) => `-${Math.round(d)}`)
      .join(sep)
  );
}

export type DeathExit = 'next' | 'auto';

export interface DeathScreenOptions {
  /** Pause-aware clock: loop.activeMs() (stops in 'auto' / 'menu' pauses and in a hidden tab). */
  clock: () => number;
  /** Leave the screen → respawn / base print (owner: Gameplay). */
  onExit: (why: DeathExit) => void;
  doc?: Document;
}

export interface DeathScreen {
  show(data: DeathScreenData): void;
  /** Call every frame (render): enables NEXT after MIN, leaves after AUTO. */
  update(): void;
  hide(): void;
  readonly isOpen: boolean;
  /** ms of the screen on the pause-aware clock. */
  readonly elapsed: number;
  readonly element: HTMLElement;
}

/**
 * Full-screen death overlay. NEXT (M1_DEATH_BTN) only by tap/click or Enter, only a NEW press
 * that starts after DEATH_MIN_MS (keys already down – even with OS repeats lacking the repeat
 * flag – count only after keyup). Space / J / ATK never continue. Leaves by itself after
 * DEATH_AUTO_MS. Both clocks run on `clock` (loop.activeMs()), so auto-pause stops them.
 */
export function createDeathScreen(root: HTMLElement, o: DeathScreenOptions): DeathScreen {
  const doc = o.doc ?? document;
  const codes = acceptedCodes();
  const title = el('div', { className: 'death-title', textContent: STRINGS.deathTitle });
  const killed = el('div', { className: 'death-line death-killer' });
  const hits = el('div', { className: 'death-line death-hits' });
  const lost = el('div', { className: 'death-line death-lost' });
  const next = el('button', {
    type: 'button',
    className: 'death-next',
    textContent: lineText('M1_DEATH_BTN', 'NEXT'),
    tabIndex: -1,
  });
  next.setAttribute('aria-label', STRINGS.deathNextAria);
  const panel = el('div', { className: 'death-panel' }, [title, killed, hits, lost, next]);
  panel.setAttribute('role', 'alertdialog');
  const element = el('div', { className: 'death-screen' }, [panel]);
  root.append(element);

  let open = false;
  let start = 0;
  const down = new Set<string>();
  const elapsed = () => o.clock() - start;
  const unlocked = () => elapsed() >= DEATH_MIN_MS;
  const leave = (why: DeathExit) => {
    if (!open) return;
    api.hide();
    o.onExit(why);
  };

  doc.addEventListener(
    'keydown',
    (e) => {
      const fresh = !e.repeat && !down.has(e.code);
      down.add(e.code); // tracked always: a key held from before the screen never counts
      if (!open) return;
      if (!codes.includes(e.code)) return; // Space, J, … do nothing here (game input is frozen)
      e.preventDefault();
      e.stopPropagation(); // Enter must not reach the pause menu / game
      if (fresh && unlocked()) leave('next');
    },
    true,
  );
  doc.addEventListener('keyup', (e) => down.delete(e.code), true);
  // Tap/click: pointerdown ON the button, which is only interactive after MIN – so the
  // press necessarily started after 1500 ms (a finger already on the screen does not count).
  next.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (open && acceptsTap() && unlocked()) leave('next');
  });
  // Swallow everything else (the hidden ATK button / joystick under the overlay).
  element.addEventListener('pointerdown', (e) => e.stopPropagation());

  const setLine = (node: HTMLElement, text: string | null) => {
    node.textContent = text ?? '';
    node.hidden = text === null;
  };

  const api: DeathScreen = {
    element,
    show(data) {
      setLine(killed, killedByText(data.killerName));
      const ht = lastHitsText(data.lastHits);
      setLine(hits, null);
      if (ht) {
        // Label in text colour, damage values in the enemy colour (fx tokenFg 'enemy').
        const cut = ht.indexOf('-');
        hits.replaceChildren(
          ht.slice(0, cut),
          el('span', { className: 'death-dmg', textContent: ht.slice(cut) }),
        );
        hits.hidden = false;
      }
      setLine(
        lost,
        data.lost
          ? STRINGS.deathLost
              .replace('{cr}', String(data.lost.cr))
              .replace('{items}', String(data.lost.items))
          : null,
      );
      start = o.clock();
      open = true;
      element.classList.add('visible');
      element.classList.remove('unlocked');
      next.disabled = true;
    },
    update() {
      if (!open) return;
      if (unlocked() && next.disabled) {
        next.disabled = false;
        element.classList.add('unlocked');
      }
      if (elapsed() >= DEATH_AUTO_MS) leave('auto');
    },
    hide() {
      open = false;
      element.classList.remove('visible', 'unlocked');
    },
    get isOpen() {
      return open;
    },
    get elapsed() {
      return open ? elapsed() : 0;
    },
  };
  return api;
}

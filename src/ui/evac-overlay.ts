// Evacuation HUD: CALL hold bar, LIFT {s} / GET IN {s}, arrival and recall lines.
import type { GameState } from '../core/game';
import { fillString, STRINGS } from '../data/strings';
import { medPatchCountOf } from '../inventory/inventory';
import type { InventoryState } from '../inventory/types';
import { evacHoldBar, holdProgress, peekExpedition, type ExpeditionHud } from '../expedition';
import { el } from './dom';
import './expedition.css';

const NOTICE: Record<string, string> = {
  M1_BASE_05: STRINGS.liftWelcome,
  M1_BASE_06: STRINGS.liftHere,
  M1_BASE_07: STRINGS.liftLeft,
  M1_SYS_05: STRINGS.liftLoud,
};

export interface EvacOverlayView {
  root: HTMLElement;
  sync(state: GameState): void;
}

function patchCount(state: GameState): number {
  const raw = state.sections.inventory;
  if (!raw || typeof raw !== 'object' || !('bag' in raw)) return 0;
  return medPatchCountOf(raw as InventoryState);
}

function hudLine(hud: ExpeditionHud): string {
  const template = hud.textId === 'M1_UI_LIFT_HERE' ? STRINGS.liftGetIn : STRINGS.liftComing;
  return fillString(template, { s: hud.seconds });
}

export function mountEvacOverlay(parent: HTMLElement): EvacOverlayView {
  const root = el('div', { className: 'exp-layer exp-evac' });
  const panel = el('div', { className: 'exp-hud' });
  const call = el('p', { className: 'exp-bar' });
  call.dataset.textId = 'M1_UI_CALL';
  const line = el('p', { className: 'exp-line' });
  const notices = el('div', { className: 'exp-notices' });
  panel.append(call, line, notices);
  root.append(panel);
  parent.append(root);

  function sync(state: GameState): void {
    const ex = peekExpedition(state);
    const phase = ex?.evac.phase;
    const show =
      phase === 'calling' || phase === 'arriving' || phase === 'open' || phase === 'cooldown';
    root.hidden = !show || !ex;
    if (!show || !ex) return;
    if (phase === 'calling') {
      const bar = evacHoldBar(holdProgress(state), 10);
      call.hidden = false;
      call.textContent = `${STRINGS.liftCall} [${bar}]`;
    } else {
      call.hidden = true;
      call.textContent = '';
    }
    if (ex.hud && (phase === 'arriving' || phase === 'open')) {
      line.hidden = false;
      line.dataset.textId = ex.hud.textId;
      line.textContent = hudLine(ex.hud);
    } else if (phase === 'cooldown') {
      line.hidden = false;
      line.dataset.textId = 'M1_UI_LIFT_COMING';
      line.textContent = fillString(STRINGS.liftComing, {
        s: Math.max(0, Math.ceil(ex.evac.msLeft / 1000)),
      });
    } else {
      line.hidden = true;
      line.textContent = '';
      delete line.dataset.textId;
    }
    notices.replaceChildren();
    for (const id of ex.notices) {
      const row = el('p', { className: 'exp-notice' });
      row.dataset.textId = id;
      row.textContent =
        id === 'M1_GEAR_ISSUE_TOPUP'
          ? fillString(STRINGS.medpatchTopUp, { MEDPATCH_COUNT: patchCount(state) })
          : (NOTICE[id] ?? id);
      notices.append(row);
    }
  }

  root.hidden = true;
  return { root, sync };
}

// Descent confirm (ui-m1 §11.9). Focus starts on STAY. Enter and Space act on the
// focused button. Esc is always STAY. There is no GO DOWN shortcut.
import type { GameState } from '../core/game';
import { fillString, STRINGS } from '../data/strings';
import { peekExpedition, setDescentFocus } from '../expedition';
import { button, el } from './dom';
import './expedition.css';

export interface DescentConfirmActions {
  /** Enter / Space: the focused button. */
  onAccept: () => void;
  /** Esc, or a tap on STAY. */
  onStay: () => void;
  /** Tap on GO DOWN / GO IN. */
  onGo: () => void;
}

export interface DescentConfirmView {
  root: HTMLElement;
  sync(state: GameState): void;
  onKey(code: string): boolean;
}

export function mountDescentConfirm(
  parent: HTMLElement,
  actions: DescentConfirmActions,
): DescentConfirmView {
  const root = el('div', { className: 'exp-layer exp-confirm' });
  const panel = el('div', { className: 'exp-modal' });
  const message = el('p', { className: 'exp-line' });
  const hp = el('p', { className: 'exp-hp' });
  const stayBtn = button(STRINGS.riskDescendNo, () => actions.onStay());
  const goBtn = button(STRINGS.riskDescendYes, () => actions.onGo());
  stayBtn.dataset.textId = 'M1_RISK_01_NO';
  goBtn.dataset.textId = 'M1_RISK_01_YES';
  const row = el('div', { className: 'exp-actions' });
  row.append(stayBtn, goBtn);
  const setting = el('p', { className: 'exp-setting', textContent: STRINGS.riskSetting });
  setting.dataset.textId = 'M1_RISK_SETTING';
  panel.append(message, hp, row, setting);
  root.append(panel);
  parent.append(root);

  let state: GameState | null = null;

  function sync(next: GameState): void {
    state = next;
    const confirm = peekExpedition(next)?.confirm ?? null;
    root.hidden = confirm === null;
    if (!confirm) return;
    message.dataset.textId = confirm.textId;
    message.textContent = fillString(
      confirm.textId === 'M1_RISK_01B' ? STRINGS.riskGate : STRINGS.riskDescend,
      { at_risk: confirm.atRisk },
    );
    hp.textContent = `HP ${confirm.hp}/${confirm.maxHp} · + ${confirm.patches}`;
    goBtn.textContent = confirm.kind === 'gate' ? STRINGS.riskGateYes : STRINGS.riskDescendYes;
    goBtn.dataset.textId = confirm.yesId;
    stayBtn.classList.toggle('is-focused', confirm.focus === 'stay');
    goBtn.classList.toggle('is-focused', confirm.focus === 'go');
  }

  function onKey(code: string): boolean {
    if (!state) return false;
    const confirm = peekExpedition(state)?.confirm;
    if (!confirm) return false;
    if (code === 'ArrowLeft' || code === 'ArrowUp') {
      setDescentFocus(state, 'stay');
      sync(state);
      return true;
    }
    if (code === 'ArrowRight' || code === 'ArrowDown') {
      setDescentFocus(state, 'go');
      sync(state);
      return true;
    }
    if (code === 'Tab') {
      setDescentFocus(state, confirm.focus === 'go' ? 'stay' : 'go');
      sync(state);
      return true;
    }
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') {
      actions.onAccept();
      return true;
    }
    if (code === 'Escape') {
      actions.onStay();
      return true;
    }
    return false;
  }

  root.hidden = true;
  return { root, sync, onKey };
}

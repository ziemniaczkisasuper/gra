// Base LIFT button, stop picker (ui-m1 §3.6), and the ride screen.
// Outbound ride is not skippable. The ride back to base (M1_BASE_05) skips after 500 ms.
import type { GameState } from '../core/game';
import { fillString, STRINGS } from '../data/strings';
import {
  cancelLiftPicker,
  chooseLiftStop,
  getExpedition,
  peekExpedition,
  setLiftFocus,
  skipReturnRide,
  useBaseLift,
  type ZoneDepth,
} from '../expedition';
import { button, el } from './dom';
import './expedition.css';

const DEPTH_NAME: Record<ZoneDepth, string> = {
  1: STRINGS.depthName1,
  2: STRINGS.depthName2,
  3: STRINGS.depthName3,
};

export interface LiftRideView {
  root: HTMLElement;
  sync(state: GameState): void;
  /** Base / picker / return-ride keys. `paused` blocks the base LIFT shortcut. */
  onKey(code: string, paused: boolean): boolean;
}

export function mountLiftRide(parent: HTMLElement): LiftRideView {
  const root = el('div', { className: 'exp-layer exp-lift' });
  const liftBtn = button(STRINGS.liftButton, () => pressLift());
  liftBtn.dataset.textId = 'M1_UI_BTN_LIFT';
  liftBtn.classList.add('exp-lift-btn');
  const picker = el('div', { className: 'exp-modal' });
  const pickerTitle = el('p', { className: 'exp-line', textContent: STRINGS.liftButton });
  const stopsEl = el('div', { className: 'exp-stops' });
  const goBtn = button('GO', () => pressGo());
  goBtn.classList.add('exp-go');
  goBtn.dataset.action = 'go';
  picker.append(pickerTitle, stopsEl, goBtn);
  const ride = el('div', { className: 'exp-ride' });
  const rideText = el('p', { className: 'exp-line' });
  ride.append(rideText);
  ride.addEventListener('click', () => pressRide());
  root.append(liftBtn, picker, ride);
  parent.append(root);

  let state: GameState | null = null;

  function pressLift(): void {
    if (!state || state.mode !== 'base') return;
    useBaseLift(state);
    sync(state);
  }

  function pressGo(): void {
    if (!state) return;
    const focus = getExpedition(state).lift.focus;
    chooseLiftStop(state, focus);
    sync(state);
  }

  function pressRide(): void {
    if (!state) return;
    if (skipReturnRide(state)) sync(state);
  }

  function sync(next: GameState): void {
    state = next;
    const ex = peekExpedition(next);
    const pickerOn = ex?.lift.phase === 'picker';
    const outbound = ex?.lift.phase === 'ride' && ex.lift.toZone === true;
    const returning = ex?.evac.phase === 'ride';
    liftBtn.hidden = next.mode !== 'base' || pickerOn || outbound || returning;
    picker.hidden = !pickerOn;
    ride.hidden = !outbound && !returning;
    if (pickerOn && ex) {
      stopsEl.replaceChildren();
      for (const depth of ex.stops) {
        const row = button(
          `${fillString(STRINGS.liftDepth, { n: depth })}  ${DEPTH_NAME[depth]}`,
          () => {
            if (!state) return;
            setLiftFocus(state, depth);
            sync(state);
          },
        );
        row.classList.add('exp-stop');
        row.dataset.stop = String(depth);
        row.classList.toggle('is-focused', ex.lift.focus === depth);
        stopsEl.append(row);
      }
      goBtn.classList.toggle('is-focused', true);
    }
    if (outbound && ex) {
      rideText.dataset.textId = '';
      rideText.textContent = `${fillString(STRINGS.liftDepth, { n: ex.lift.destination })}  ${DEPTH_NAME[ex.lift.destination]}`;
    } else if (returning) {
      rideText.dataset.textId = 'M1_BASE_05';
      rideText.textContent = STRINGS.liftWelcome;
    }
  }

  function onKey(code: string, paused: boolean): boolean {
    if (!state) return false;
    const ex = peekExpedition(state);
    if (ex?.lift.phase === 'picker') {
      const stops = ex.stops;
      const index = Math.max(0, stops.indexOf(ex.lift.focus));
      if (code === 'ArrowUp' || code === 'ArrowLeft') {
        const depth = stops[(index - 1 + stops.length) % stops.length] ?? stops[0]!;
        setLiftFocus(state, depth);
        sync(state);
        return true;
      }
      if (code === 'ArrowDown' || code === 'ArrowRight') {
        const depth = stops[(index + 1) % stops.length] ?? stops[0]!;
        setLiftFocus(state, depth);
        sync(state);
        return true;
      }
      if (code === 'Enter' || code === 'NumpadEnter') {
        pressGo();
        return true;
      }
      if (code === 'Escape') {
        cancelLiftPicker(state);
        sync(state);
        return true;
      }
      return false;
    }
    if (ex?.evac.phase === 'ride' && (code === 'Enter' || code === 'NumpadEnter')) {
      pressRide();
      return true;
    }
    if (paused || state.mode !== 'base') return false;
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'KeyL') {
      pressLift();
      return true;
    }
    return false;
  }

  liftBtn.hidden = true;
  picker.hidden = true;
  ride.hidden = true;
  return { root, sync, onKey };
}

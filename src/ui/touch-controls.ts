import { STRINGS } from '../data/strings';
import { UI_GLYPHS } from '../data/style';
import { JOYSTICK } from '../input/joystick';
import type { TouchSource, TouchView } from '../input/touch';
import { el } from './dom';
import type { UiSettings } from './settings';

export interface TouchControls {
  readonly element: HTMLElement;
  readonly visible: boolean;
  setVisible(v: boolean): void;
  /** M1 hooks: hidden placeholders that keep their place in the layout. */
  readonly reserved: { use: HTMLElement; skills: HTMLElement; medPatch: HTMLElement };
}

/**
 * Touch controls layer (sterowanie.md §2): floating joystick in the left half, fixed ATK
 * bottom-right, mirrored when left-handed. Pointer Events only; each pointerId tracked by
 * TouchSource. `touch-action: none` only on the control zones (style.css).
 * Shown on coarse pointers / first touch; hidden after keyboard use (unless ?touch=1).
 */
export function createTouchControls(
  root: HTMLElement,
  source: TouchSource,
  settings: UiSettings,
  onActivity: () => void = () => {},
): TouchControls {
  const R = JOYSTICK.radius;
  const zone = el('div', { className: 'stick-zone' });
  zone.setAttribute('aria-label', STRINGS.joystickAria);

  const marks = UI_GLYPHS.stickMarks.map((ch, i) => {
    const m = el('span', { className: 'stick-mark', textContent: ch });
    const a = (i * Math.PI) / 4;
    const r = R - 12;
    m.style.left = `${R + Math.cos(a) * r}px`;
    m.style.top = `${R + Math.sin(a) * r}px`;
    return m;
  });
  const base = el('div', { className: 'stick-base' }, marks);
  base.style.width = base.style.height = `${2 * R}px`;
  const knob = el('div', { className: 'stick-knob', textContent: UI_GLYPHS.stickKnob });

  const atk = el('div', { className: 'ctl-btn atk-btn', textContent: UI_GLYPHS.attack });
  atk.setAttribute('role', 'button');
  atk.setAttribute('aria-label', STRINGS.attackAria);

  // M1 placeholders (not interactive in M0): USE above ATK, 3 fixed skill slots in an arc,
  // Med-Patch [+] above the slots.
  const hide = (e: HTMLElement) => ((e.hidden = true), e);
  const use = hide(el('div', { className: 'ctl-btn use-btn', textContent: 'USE' }));
  const skills = hide(
    el(
      'div',
      { className: 'skill-slots' },
      [1, 2, 3].map((n) =>
        el('div', { className: `ctl-btn skill-btn s${n}`, textContent: String(n) }),
      ),
    ),
  );
  const medPatch = hide(el('div', { className: 'ctl-btn med-btn', textContent: '[+]' }));

  const element = el('div', { className: 'touch-controls' }, [
    zone,
    base,
    knob,
    skills,
    medPatch,
    use,
    atk,
  ]);
  element.classList.toggle('left-handed', settings.leftHanded);
  root.append(element);

  const capture = (t: HTMLElement, id: number) => {
    try {
      t.setPointerCapture(id);
    } catch {
      /* synthetic pointer – window listeners below still track it */
    }
  };

  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (source.stickDown(e.pointerId, e.clientX, e.clientY)) capture(zone, e.pointerId);
    onActivity();
  });
  atk.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    source.buttonDown(e.pointerId, 'attack');
    capture(atk, e.pointerId);
    onActivity();
  });
  window.addEventListener('pointermove', (e) =>
    source.pointerMove(e.pointerId, e.clientX, e.clientY),
  );
  for (const t of ['pointerup', 'pointercancel'] as const)
    window.addEventListener(t, (e) => source.pointerUp(e.pointerId));
  element.addEventListener('lostpointercapture', (e) => source.pointerUp(e.pointerId));
  element.addEventListener('contextmenu', (e) => e.preventDefault());

  const draw = (v: TouchView) => {
    base.classList.toggle('active', v.stickActive);
    knob.classList.toggle('active', v.stickActive);
    if (v.stickActive) {
      base.style.transform = `translate(${v.baseX - R}px, ${v.baseY - R}px)`;
      knob.style.transform = `translate(${v.knobX}px, ${v.knobY}px) translate(-50%, -50%)`;
    }
    marks.forEach((m, i) => m.classList.toggle('on', v.sector === i));
    atk.classList.toggle('held', v.held.has('attack'));
  };
  source.onChange = draw;
  draw(source.view);

  let visible = false;
  const setVisible = (v: boolean) => {
    visible = v;
    element.classList.toggle('visible', v);
    if (!v) source.reset();
  };
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  setVisible(settings.forceTouch || coarse);
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch' && !visible) setVisible(true);
    },
    true,
  );
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    if (visible && !settings.forceTouch) setVisible(false);
  });

  return {
    element,
    get visible() {
      return visible;
    },
    setVisible,
    reserved: { use, skills, medPatch },
  };
}

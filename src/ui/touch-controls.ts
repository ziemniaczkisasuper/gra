import { STRINGS } from '../data/strings';
import { UI_GLYPHS } from '../data/style';
import { setAimStick } from '../input/aim';
import { JOYSTICK, Joystick, type JoystickConfig } from '../input/joystick';
import type { TouchButton, TouchSource, TouchView } from '../input/touch';
import { el } from './dom';
import { subscribeAutoAim, type UiSettings } from './settings';

export interface TouchControls {
  readonly element: HTMLElement;
  readonly visible: boolean;
  setVisible(v: boolean): void;
  /** M1 hooks: hidden placeholders that keep their place in the layout. */
  readonly reserved: { use: HTMLElement; skills: HTMLElement; medPatch: HTMLElement };
}

/** Visual dead-zone ring only. The vector passed to setAimStick is offset/radius, not quantised. */
const AIM_DEAD_FRACTION = 0.35;
const AIM_KNOB = 40;

const clamp1 = (v: number) => (v > 1 ? 1 : v < -1 ? -1 : v);

function aimRadius(): number {
  const h = typeof window !== 'undefined' ? window.innerHeight : 0;
  return h > 0 && h <= 360 ? 48 : 60;
}

const SKILL_BUTTONS: readonly { n: 1 | 2 | 3; action: TouchButton; label: string }[] = [
  { n: 1, action: 'skill1', label: STRINGS.skillDash },
  { n: 2, action: 'skill2', label: STRINGS.skillPulse },
  { n: 3, action: 'skill3', label: STRINGS.skillDrone },
];

/**
 * Touch controls layer (sterowanie.md §2, wariant-twin-stick §12): floating move joystick in
 * the left half (right half when left-handed), floating aim stick in the other half, skill
 * buttons in an arc. Pointer Events only; each pointerId is independent. `touch-action: none`
 * only on the control zones (style.css). Shown on coarse pointers / first touch; hidden after
 * keyboard use (unless ?touch=1).
 * ATK is hidden unless Auto-aim is on (then it sits in the aim-stick corner and the aim zone
 * is ignored).
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

  const aimCfg: JoystickConfig = {
    radius: aimRadius(),
    deadZone: AIM_DEAD_FRACTION,
    holdBelow: 1,
    hysteresisDeg: 0,
  };
  const aimJoy = new Joystick(aimCfg);
  const aimZone = el('div', { className: 'aim-zone' });
  aimZone.setAttribute('aria-label', STRINGS.aimStickAria);
  const aimDead = el('div', { className: 'aim-dead' });
  aimDead.style.width = aimDead.style.height = `${AIM_DEAD_FRACTION * 200}%`;
  const aimBase = el('div', { className: 'aim-base' }, [aimDead]);
  const aimKnob = el('div', { className: 'aim-knob', textContent: UI_GLYPHS.stickKnob });
  aimKnob.style.width = aimKnob.style.height = `${AIM_KNOB}px`;

  const atk = el('div', { className: 'ctl-btn atk-btn', textContent: UI_GLYPHS.attack });
  atk.setAttribute('role', 'button');
  atk.setAttribute('aria-label', STRINGS.attackAria);
  atk.hidden = true;

  // USE and Med-Patch stay hidden placeholders. Skill slots are live (DASH / PULSE / DRONE).
  const hide = (e: HTMLElement) => ((e.hidden = true), e);
  const use = hide(el('div', { className: 'ctl-btn use-btn', textContent: 'USE' }));
  const skillBtns = SKILL_BUTTONS.map(({ n, label }) => {
    const b = el('div', { className: `ctl-btn skill-btn s${n}`, textContent: label });
    b.setAttribute('role', 'button');
    b.setAttribute('aria-label', label);
    return b;
  });
  const skills = el('div', { className: 'skill-slots' }, skillBtns);
  const medPatch = hide(el('div', { className: 'ctl-btn med-btn', textContent: '[+]' }));

  const element = el('div', { className: 'touch-controls' }, [
    zone,
    base,
    knob,
    aimZone,
    aimBase,
    aimKnob,
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

  let aimId: number | null = null;
  /** After input reset the held aim finger is ignored until it lifts (same rule as TouchSource). */
  let aimStale = false;
  let autoOn = false;

  const hideAimGfx = () => {
    aimBase.classList.remove('active');
    aimKnob.classList.remove('active');
  };
  const placeAim = () => {
    const r = aimCfg.radius;
    aimBase.classList.add('active');
    aimKnob.classList.add('active');
    aimBase.style.width = aimBase.style.height = `${2 * r}px`;
    aimBase.style.transform = `translate(${aimJoy.baseX - r}px, ${aimJoy.baseY - r}px)`;
    aimKnob.style.transform = `translate(${aimJoy.knobX}px, ${aimJoy.knobY}px) translate(-50%, -50%)`;
  };
  const aimVector = () => {
    const r = aimCfg.radius || 1;
    return {
      x: clamp1((aimJoy.knobX - aimJoy.baseX) / r),
      y: clamp1((aimJoy.knobY - aimJoy.baseY) / r),
    };
  };
  const releaseAim = () => {
    aimId = null;
    aimStale = false;
    hideAimGfx();
    setAimStick(null);
  };
  const moveAim = (x: number, y: number) => {
    aimJoy.move(x, y);
    placeAim();
    setAimStick(aimVector());
  };

  const syncAimSize = () => {
    aimCfg.radius = aimRadius();
    aimBase.style.width = aimBase.style.height = `${2 * aimCfg.radius}px`;
  };
  syncAimSize();
  window.addEventListener('resize', syncAimSize);

  const applyAuto = (on: boolean) => {
    const was = autoOn;
    autoOn = on;
    element.classList.toggle('auto-aim', on);
    atk.hidden = !on;
    aimZone.hidden = on;
    if (on && !was) releaseAim();
  };
  subscribeAutoAim(applyAuto);

  // Pause / focus loss calls TouchSource.reset via InputManager. Drop the aim finger the same
  // way: the stick hides and stays dead until that pointer lifts, then a new press works.
  const origReset = source.reset.bind(source);
  source.reset = () => {
    origReset();
    if (aimId !== null) aimStale = true;
    hideAimGfx();
    setAimStick(null);
  };

  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (source.stickDown(e.pointerId, e.clientX, e.clientY)) capture(zone, e.pointerId);
    onActivity();
  });
  const pressButton = (e: PointerEvent, button: TouchButton, node: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();
    source.buttonDown(e.pointerId, button);
    capture(node, e.pointerId);
    onActivity();
  };
  atk.addEventListener('pointerdown', (e) => pressButton(e, 'attack', atk));
  skillBtns.forEach((node, i) => {
    const action = SKILL_BUTTONS[i]!.action;
    node.addEventListener('pointerdown', (e) => pressButton(e, action, node));
  });
  aimZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (autoOn) return;
    if (aimId !== null && (!aimStale || e.pointerId === aimId)) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('.ctl-btn')) return;
    aimStale = false;
    aimId = e.pointerId;
    aimJoy.start(e.clientX, e.clientY);
    placeAim();
    setAimStick(aimVector());
    capture(aimZone, e.pointerId);
    onActivity();
  });
  window.addEventListener('pointermove', (e) => {
    source.pointerMove(e.pointerId, e.clientX, e.clientY);
    if (e.pointerId === aimId && !aimStale) moveAim(e.clientX, e.clientY);
  });
  const endPointer = (id: number) => {
    source.pointerUp(id);
    if (id === aimId) releaseAim();
  };
  for (const t of ['pointerup', 'pointercancel'] as const)
    window.addEventListener(t, (e) => endPointer(e.pointerId));
  element.addEventListener('lostpointercapture', (e) => endPointer(e.pointerId));
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
    skillBtns.forEach((node, i) =>
      node.classList.toggle('held', v.held.has(SKILL_BUTTONS[i]!.action)),
    );
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

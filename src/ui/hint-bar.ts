// Bottom-centre hint line (ui-m1 §11). Pointer events pass through to the game.
// The camera keeps the player off this rectangle (`setCameraRect('hintBar')`).
import './hint-bar.css';
import { setCameraRect } from '../render/camera';
import { el } from './dom';

export interface HintBar {
  setText(text: string | null): void;
  destroy(): void;
  readonly element: HTMLElement;
}

export function mountHintBar(root: HTMLElement): HintBar {
  const element = el('div', { className: 'hint-bar' });
  element.dataset.slot = 'hint-bar';
  element.hidden = true;
  element.setAttribute('aria-live', 'polite');
  root.append(element);

  const report = () => {
    if (element.hidden) {
      setCameraRect('hintBar', null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setCameraRect('hintBar', {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  };

  return {
    element,
    setText(text) {
      const show = text !== null && text.length > 0;
      element.hidden = !show;
      element.textContent = show ? text : '';
      report();
    },
    destroy() {
      setCameraRect('hintBar', null);
      element.remove();
    },
  };
}

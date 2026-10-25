/** Tiny DOM helper shared by the UI modules. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
}

/** Non-focusable button (focus would steal Space/Enter from the game). */
export function button(label: string, onClick: () => void, cls = ''): HTMLButtonElement {
  const b = el('button', { type: 'button', className: cls, textContent: label, tabIndex: -1 });
  b.addEventListener('click', (ev) => {
    ev.preventDefault();
    b.blur();
    onClick();
  });
  return b;
}

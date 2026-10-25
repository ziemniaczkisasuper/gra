// @vitest-environment jsdom
// QA-M0-006 regression: auto-pause after a hit while away shows "You were hit while away.".
import { describe, expect, it } from 'vitest';
import { AwayHitTracker } from '../src/core/away';
import { EventBus, type GameEvents } from '../src/core/events';
import { GameLoop } from '../src/core/loop';
import { STRINGS } from '../src/data/strings';
import { TouchSource } from '../src/input/touch';
import { createUi } from '../src/ui/overlay';

function overlay() {
  document.body.innerHTML = '<div id="ui"></div>';
  const root = document.getElementById('ui')!;
  const noop = () => {};
  const ui = createUi(
    root,
    {
      onPause: noop,
      onResume: noop,
      onExportFile: noop,
      onImportFile: noop,
      onCopyCode: async () => '',
      onImportCode: noop,
    },
    { touch: new TouchSource(), settings: { leftHanded: false, forceTouch: false } },
  );
  const bus = new EventBus<GameEvents>();
  const loop = new GameLoop({ events: bus, update: () => {}, render: () => {} });
  bus.on('paused', ({ reason, detail }) => ui.showPaused(reason, detail)); // = main.ts
  const text = () => root.textContent ?? '';
  return { ui, loop, text };
}

describe('QA-M0-006: "You were hit while away."', () => {
  it('trigger D (hit while away) → overlay shows the line', () => {
    const o = overlay();
    o.loop.pause('auto', 'hitWhileAway');
    expect(o.ui.overlayVisible).toBe(true);
    expect(o.text()).toContain(STRINGS.hitWhileAway);
    expect(STRINGS.hitWhileAway).toBe('You were hit while away.');
  });

  it('other auto-pauses and the menu do not show it', () => {
    const o = overlay();
    o.loop.pause('auto');
    expect(o.text()).not.toContain(STRINGS.hitWhileAway);
    expect(o.text()).toContain(STRINGS.pausedAuto);
    o.loop.resume({ countdown: false });
    o.loop.pause('menu');
    expect(o.text()).not.toContain(STRINGS.hitWhileAway);
  });

  it('paused event carries the detail', () => {
    const bus = new EventBus<GameEvents>();
    const got: unknown[] = [];
    bus.on('paused', (p) => got.push(p));
    const loop = new GameLoop({ events: bus, update: () => {}, render: () => {} });
    loop.pause('auto', 'hitWhileAway');
    expect(got).toEqual([{ reason: 'auto', detail: 'hitWhileAway' }]);
  });

  it('idle trigger E: detail only if a hit came while away (no input in that tick)', () => {
    const t = new AwayHitTracker();
    t.update(50, false);
    expect(t.detail).toBeUndefined();
    t.update(0, true); // hit while the player is pressing keys → not "away"
    t.update(50, false);
    expect(t.detail).toBeUndefined();
    t.update(100, true); // hit while idle
    t.update(59_950, false);
    expect(t.detail).toBe('hitWhileAway');
    t.update(0, false); // input again → cleared
    expect(t.detail).toBeUndefined();
  });
});

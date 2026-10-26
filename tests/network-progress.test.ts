import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game';
import { DEPTHS, TERMINAL_VARIANTS, type Depth } from '../src/data/contracts-m1';
import { DEFAULT_SEED } from '../src/data/game';
import {
  ISSUE_POLE_ITEM_ID,
  ISSUE_SUIT_ITEM_ID,
  STASH_SLOTS_BY_LIGHTS,
} from '../src/data/inventory-m1';
import {
  announceMk2,
  buyLights,
  copperAward,
  createNetworkProgress,
  fragments,
  getNetworkProgress,
  gridPct,
  issueMk2Grant,
  lightsCableSegments,
  lightsEffects,
  mk2Announcement,
  nextVariantId,
  noteBossFragment,
  setNetworkProgress,
  solveVariant,
  VARIANT_SEQUENCE,
  type NetworkProgress,
} from '../src/progress/network';
import { deserializeNetworkProgress, serializeNetworkProgress } from '../src/progress/save';
import { gameFromSave, parseSave, SaveError, snapshot } from '../src/save';

const ALL_VARIANTS = DEPTHS.flatMap((depth) => VARIANT_SEQUENCE[depth]);

function solvedThrough(depth: Depth, count: number): NetworkProgress {
  let progress = createNetworkProgress();
  for (const id of VARIANT_SEQUENCE[depth].slice(0, count)) progress = solveVariant(progress, id);
  return progress;
}

describe('nextVariantId', () => {
  it('follows §2.15: depth 1 is 04 → 07 → 08', () => {
    expect(nextVariantId(1, [])).toBe('M1_TERM_04');
    expect(nextVariantId(1, ['M1_TERM_04'])).toBe('M1_TERM_07');
    expect(nextVariantId(1, ['M1_TERM_04', 'M1_TERM_07'])).toBe('M1_TERM_08');
    expect(nextVariantId(1, ['M1_TERM_07', 'M1_TERM_04'])).toBe('M1_TERM_08');
    expect(nextVariantId(1, ['M1_TERM_04', 'M1_TERM_07', 'M1_TERM_08'])).toBeNull();
  });

  it('follows §2.15: depth 2 is 05 → 01 → 02, depth 3 is 06 → 03', () => {
    expect(VARIANT_SEQUENCE).toEqual(TERMINAL_VARIANTS);
    expect(nextVariantId(2, [])).toBe('M1_TERM_05');
    expect(nextVariantId(2, ['M1_TERM_05'])).toBe('M1_TERM_01');
    expect(nextVariantId(2, ['M1_TERM_05', 'M1_TERM_01'])).toBe('M1_TERM_02');
    expect(nextVariantId(2, ['M1_TERM_05', 'M1_TERM_01', 'M1_TERM_02'])).toBeNull();
    expect(nextVariantId(3, [])).toBe('M1_TERM_06');
    expect(nextVariantId(3, ['M1_TERM_06'])).toBe('M1_TERM_03');
    expect(nextVariantId(3, ['M1_TERM_06', 'M1_TERM_03'])).toBeNull();
  });
});

describe('lift stops and Issue Mk2', () => {
  it('stop 1 is always unlocked; depth 1 does not add a stop', () => {
    const start = createNetworkProgress();
    expect(start.stops).toEqual([1]);
    const depth1 = solvedThrough(1, 3);
    expect(depth1.stops).toEqual([1]);
    expect(issueMk2Grant(depth1)).toBeNull();
    expect(mk2Announcement(depth1)).toBeNull();
  });

  it('the first depth-2 terminal unlocks stop 2 and Issue Mk2 (10–15 damage, armor 6)', () => {
    const first = solveVariant(createNetworkProgress(), 'M1_TERM_05');
    expect(first.stops).toEqual([1, 2]);
    const again = solveVariant(first, 'M1_TERM_01');
    expect(again.stops).toEqual([1, 2]);
    const grant = issueMk2Grant(first);
    expect(grant).not.toBeNull();
    expect(grant?.pole.itemId).toBe(ISSUE_POLE_ITEM_ID);
    expect(grant?.pole.dmgMin).toBe(10);
    expect(grant?.pole.dmgMax).toBe(15);
    expect(grant?.suit.itemId).toBe(ISSUE_SUIT_ITEM_ID);
    expect(grant?.suit.armor).toBe(6);
    expect(mk2Announcement(first)).toBe('M1_BASE_17');
    const told = announceMk2(first);
    expect(told.mk2Announced).toBe(true);
    expect(mk2Announcement(told)).toBeNull();
    const beforeStop = createNetworkProgress();
    expect(announceMk2(beforeStop)).toBe(beforeStop);
  });

  it('the first depth-3 terminal unlocks stop 3', () => {
    const only3 = solveVariant(createNetworkProgress(), 'M1_TERM_06');
    expect(only3.stops).toEqual([1, 3]);
    expect(issueMk2Grant(only3)).toBeNull();
    const both = solveVariant(only3, 'M1_TERM_05');
    expect(both.stops).toEqual([1, 2, 3]);
    expect(solveVariant(both, 'M1_TERM_03').stops).toEqual([1, 2, 3]);
  });

  it('does not mutate the input progress', () => {
    const start = createNetworkProgress();
    const next = solveVariant(start, 'M1_TERM_04');
    expect(start.solved).toEqual([]);
    expect(next.solved).toEqual(['M1_TERM_04']);
    expect(solveVariant(next, 'M1_TERM_04')).toBe(next);
  });
});

describe('fragments, copper, and Lights', () => {
  it('counts 10 per terminal and 20 for the boss (8×10+20=100)', () => {
    let progress = createNetworkProgress();
    expect(gridPct(progress)).toBe(0);
    ALL_VARIANTS.forEach((id, index) => {
      progress = solveVariant(progress, id);
      expect(gridPct(progress)).toBe((index + 1) * 10);
    });
    expect(gridPct(progress)).toBe(80);
    progress = noteBossFragment(progress);
    expect(gridPct(progress)).toBe(100);
    expect(fragments(progress).map((f) => f.pct)).toEqual([10, 10, 10, 10, 10, 10, 10, 10, 20]);
    expect(noteBossFragment(progress)).toBe(progress);
    expect(gridPct(solveVariant(progress, 'M1_TERM_04'))).toBe(100);
  });

  it('awards 10 Copper only for M1_TERM_08', () => {
    expect(copperAward('M1_TERM_08')).toBe(10);
    expect(copperAward('M1_TERM_04')).toBe(0);
    expect(copperAward('M1_TERM_03')).toBe(0);
  });

  it('Lights I needs M1_TERM_08 and 150 kr + 10 Copper, then stash 40 and top-up 3', () => {
    const fresh = createNetworkProgress();
    const blocked = buyLights(fresh, { credits: 150, copper: 10 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe('gate');

    const gated = solveVariant(fresh, 'M1_TERM_08');
    expect(buyLights(gated, { credits: 149, copper: 10 }).ok).toBe(false);
    expect(buyLights(gated, { credits: 150, copper: 9 }).ok).toBe(false);
    const bought = buyLights(gated, { credits: 150, copper: 10 });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.cost).toEqual({ credits: 150, copper: 10 });
    expect(bought.progress.lights).toBe(1);
    expect(bought.effects.stashSlots).toBe(40);
    expect(bought.effects.stashSlots).toBe(STASH_SLOTS_BY_LIGHTS[1]);
    expect(bought.effects.patchTopUp).toBe(3);
    expect(lightsEffects(1)).toMatchObject({
      stashSlots: 40,
      patchTopUp: 3,
      shelf: 3,
      shelfR3Pct: 10,
    });
    expect(lightsEffects(0)).toMatchObject({ stashSlots: 30, patchTopUp: 2, shelf: 3 });

    const second = buyLights(bought.progress, { credits: 600, copper: 25 });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.progress.lights).toBe(2);
    expect(lightsEffects(2)).toMatchObject({
      stashSlots: 50,
      patchTopUp: 3,
      shelf: 4,
      shelfR3Pct: 10,
    });

    const third = buyLights(second.progress, { credits: 1500, copper: 40 });
    expect(third.ok).toBe(true);
    if (!third.ok) return;
    expect(third.progress.lights).toBe(3);
    expect(lightsEffects(3)).toMatchObject({
      stashSlots: 60,
      patchTopUp: 3,
      shelf: 4,
      shelfR3Pct: 20,
    });
    expect(buyLights(third.progress, { credits: 9999, copper: 9999 }).ok).toBe(false);
  });

  it('lights cable segments from level-m1 §4 and styl-ascii §12, cumulative', () => {
    expect(lightsCableSegments(0)).toEqual([]);
    expect(lightsCableSegments(1)).toEqual(['row1', 'lockerWall']);
    expect(lightsCableSegments(2)).toEqual(['row1', 'lockerWall', 'hallSideCol0', 'hallSideCol28']);
    expect(lightsCableSegments(3)).toEqual([
      'row1',
      'lockerWall',
      'hallSideCol0',
      'hallSideCol28',
      'hallBottomRow6',
    ]);
  });
});

describe('progress save section', () => {
  it('round-trips solved variants, stops, lights, fragments, and mk2Announced', () => {
    let progress = createNetworkProgress();
    for (const id of ALL_VARIANTS) progress = solveVariant(progress, id);
    progress = noteBossFragment(progress);
    progress = announceMk2(progress);
    const lights1 = buyLights(progress, { credits: 150, copper: 10 });
    if (!lights1.ok) throw new Error('lights 1');
    const lights2 = buyLights(lights1.progress, { credits: 600, copper: 25 });
    if (!lights2.ok) throw new Error('lights 2');
    progress = lights2.progress;

    const game = createGame({ seed: 3 });
    setNetworkProgress(game, progress);
    const raw = JSON.parse(JSON.stringify(snapshot(game, 1_700_000_000_000))) as {
      progress: Record<string, unknown>;
    };
    expect(raw.progress.riskExplainerSeen).toBe(false);
    expect(raw.progress.prologue).toBe(true);
    expect(raw.progress.prologueBuilt).toBe(false);
    expect(raw.progress.tutSeen).toEqual([]);

    const loaded = gameFromSave(parseSave(raw, { seed: DEFAULT_SEED }));
    expect(getNetworkProgress(loaded)).toEqual(progress);
    expect(gridPct(getNetworkProgress(loaded))).toBe(100);
    expect(getNetworkProgress(loaded).stops).toEqual([1, 2, 3]);
    expect(getNetworkProgress(loaded).lights).toBe(2);
    expect(getNetworkProgress(loaded).mk2Announced).toBe(true);
  });

  it('keeps riskExplainerSeen and rejects a bad section', () => {
    const saved = serializeNetworkProgress(solveVariant(createNetworkProgress(), 'M1_TERM_04'));
    const dirty = { ...saved, riskExplainerSeen: true, prologue: false };
    const back = deserializeNetworkProgress(dirty);
    expect(back.riskExplainerSeen).toBe(true);
    expect(back.prologue).toBe(false);
    expect(serializeNetworkProgress(back).riskExplainerSeen).toBe(true);
    expect(back.solved).toEqual(['M1_TERM_04']);
    const legacy = { ...saved };
    delete (legacy as { riskExplainerSeen?: boolean }).riskExplainerSeen;
    delete (legacy as { prologue?: boolean }).prologue;
    delete (legacy as { prologueBuilt?: boolean }).prologueBuilt;
    delete (legacy as { tutSeen?: string[] }).tutSeen;
    const old = deserializeNetworkProgress(legacy);
    expect(old.riskExplainerSeen).toBe(false);
    expect(old.prologue).toBe(false);
    expect(old.tutSeen).toEqual([]);

    expect(() => deserializeNetworkProgress({ ...saved, solved: ['M1_TERM_NOPE'] })).toThrow(
      SaveError,
    );
    expect(() => deserializeNetworkProgress({ ...saved, lights: 4 })).toThrow(SaveError);
    expect(() => deserializeNetworkProgress({ ...saved, stops: [2] })).toThrow(SaveError);
  });
});

import { describe, expect, it } from 'vitest';
import { advanceExpedition, LIFT_RIDE_MS, useBaseLift } from '../src/expedition';
import { getNetworkProgress } from '../src/progress/network';
import '../src/progress/save';
import { startNewGame } from '../src/save';
import { TUT_COPY } from '../src/tutorial/copy';
import {
  createHintState,
  reduceHint,
  requestPrologue,
  type HintState,
} from '../src/tutorial/hints';
import { setHintsEnabled } from '../src/ui/settings';

function play(start: HintState): HintState {
  let hint = requestPrologue(start);
  hint = reduceHint(hint, { type: 'enterZone' });
  hint = reduceHint(hint, { type: 'idle', ms: 4000 });
  return hint;
}

describe('prologue hints', () => {
  it('walks T01 through the evacuation hint without a document', () => {
    let hint = createHintState();
    hint = requestPrologue(hint);
    expect(hint.prologueAsked).toBe(true);

    hint = reduceHint(hint, { type: 'enterZone' });
    hint = reduceHint(hint, { type: 'idle', ms: 4000 });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_01K);

    hint = reduceHint(hint, { type: 'walk' });
    hint = reduceHint(hint, { type: 'walk' });
    hint = reduceHint(hint, { type: 'walk' });
    expect(hint.passed).toContain('T01');
    expect(hint.bar).toBeNull();

    hint = reduceHint(hint, { type: 'enemyAdjacent', ms: 6000 });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_03K);
    hint = reduceHint(hint, { type: 'killed', kind: 'scrapper' });
    expect(hint.bar).toBeNull();

    hint = reduceHint(hint, { type: 'telegraph' });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_04);
    expect(hint.freeze).toBe(true);
    hint = reduceHint(hint, { type: 'dodged' });
    hint = reduceHint(hint, { type: 'dodged' });
    expect(hint.freeze).toBe(false);
    expect(hint.passed).toContain('T04');

    hint = reduceHint(hint, { type: 'lowHp' });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_05K);
    hint = reduceHint(hint, { type: 'usedPatch' });

    hint = reduceHint(hint, { type: 'crowded' });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_06K);
    hint = reduceHint(hint, { type: 'dashed' });

    hint = reduceHint(hint, { type: 'pickedUp' });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_07);
    hint = reduceHint(hint, { type: 'nearTerminal' });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_09K);
    hint = reduceHint(hint, { type: 'terminalSolved' });
    expect(hint.bar).toBe(TUT_COPY.M1_TUT_11);
    expect(hint.passed).toContain('T09');
  });

  it('hides the bar and does not freeze when hints are off', () => {
    let hint = createHintState({ hintsOn: false });
    hint = play(hint);
    expect(hint.bar).toBeNull();
    hint = reduceHint(hint, { type: 'walk' });
    hint = reduceHint(hint, { type: 'walk' });
    hint = reduceHint(hint, { type: 'walk' });
    hint = reduceHint(hint, { type: 'enemyAdjacent', ms: 6000 });
    hint = reduceHint(hint, { type: 'killed', kind: 'scrapper' });
    hint = reduceHint(hint, { type: 'telegraph' });
    expect(hint.bar).toBeNull();
    expect(hint.freeze).toBe(false);
    expect(hint.passed).toContain('T01');
    expect(hint.passed).toContain('T03');
  });

  it('asks the prologue generator on the first zone', () => {
    setHintsEnabled(true, null);
    const game = startNewGame({ seed: 4 });
    expect(getNetworkProgress(game).prologue).toBe(true);
    expect(getNetworkProgress(game).prologueBuilt).toBe(false);
    useBaseLift(game);
    advanceExpedition(game, LIFT_RIDE_MS);
    const progress = getNetworkProgress(game);
    expect(progress.prologue).toBe(false);
    expect(progress.prologueBuilt).toBe(true);
  });
});

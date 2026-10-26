import { describe, expect, it } from 'vitest';
import type { Cell, FlowResult } from '../src/puzzles/power-lines/types';
import {
  gridForMask,
  maskAfterTaps,
  powerLinesLine1,
  preview,
  puzzleFromGrid,
  puzzleFromVariant,
  simulate,
  startMask,
  type PuzzleState,
} from '../src/puzzles/power-lines/rules';
import { solve } from '../src/puzzles/power-lines/solver';
import rawExpected from './fixtures/power-lines-expected.json';

/** Shape written by scripts/power-lines-fixture.py (validate.py results). */
interface FixtureResult {
  status: string;
  cell: number[] | null;
  got: Record<string, number | null>;
  lit: Record<string, boolean>;
  flow: Record<string, number | null>;
  through: number[][];
  tokens: Record<string, number>;
  panel: { id: string; at: number[]; x: number | null; y: number; lit: boolean }[];
}

interface FixtureMask {
  mask: number;
  simulate: FixtureResult;
  preview: FixtureResult;
}

interface FixtureVariant {
  id: string;
  switches: number[][];
  start: number;
  solution_mask: number;
  solution_grid: string[];
  wins: number[];
  dist: Record<string, number>;
  min_moves: number;
  solver_mask: number;
  results: FixtureMask[];
}

interface FixtureSelftest {
  grid: string[];
  sources: { at: number[]; power: number }[];
  fuses: { at: number[]; max: number }[];
  start: number;
  results: FixtureMask[];
}

interface FixtureFile {
  data_version: string;
  selftest_ok: boolean;
  selftest: FixtureSelftest[];
  variants: FixtureVariant[];
}

function loadFixture(raw: unknown): FixtureFile {
  return raw as FixtureFile;
}

const expected = loadFixture(rawExpected);

function referenceView(result: FlowResult) {
  return {
    status: result.status,
    cell: result.cell === null ? null : [result.cell[0], result.cell[1]],
    got: result.got,
    lit: result.lit,
    flow: result.flow,
    through: result.through.map((p) => [p[0], p[1]]),
    tokens: { ...result.tokens },
    panel: result.panel.map((row) => ({
      id: row.id,
      at: [row.at[0], row.at[1]],
      x: row.x,
      y: row.y,
      lit: row.lit,
    })),
  };
}

function tapsBetween(puzzle: PuzzleState, from: number, to: number): Cell[] {
  const taps: Cell[] = [];
  let diff = (from ^ to) >>> 0;
  let index = 0;
  while (diff !== 0) {
    if ((diff & 1) !== 0) {
      const sw = puzzle.switches[index];
      if (!sw) throw new Error(`bit ${index} is not a switch`);
      taps.push([sw[0], sw[1]]);
    }
    diff >>>= 1;
    index += 1;
  }
  return taps;
}

function variantById(id: string) {
  const variant = powerLinesLine1.variants.find((entry) => entry.id === id);
  if (!variant) throw new Error(`missing variant ${id}`);
  return variant;
}

describe('power lines', () => {
  it('loads all 8 variants from the JSON', () => {
    expect(expected.selftest_ok).toBe(true);
    expect(powerLinesLine1.version).toBe(expected.data_version);
    expect(powerLinesLine1.schema_version).toBe(2);
    expect(powerLinesLine1.variants.map((variant) => variant.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(powerLinesLine1.variants.map((variant) => variant.id)).toEqual(
      expected.variants.map((variant) => variant.id),
    );
  });

  it('matches validate.py on every selftest grid and mask', () => {
    expect(expected.selftest.length).toBeGreaterThan(0);
    for (const gridCase of expected.selftest) {
      const puzzle = puzzleFromGrid(gridCase.grid, gridCase.sources, gridCase.fuses);
      expect(startMask(puzzle)).toBe(gridCase.start);
      for (const row of gridCase.results) {
        expect(referenceView(simulate(puzzle, row.mask))).toEqual(row.simulate);
        expect(referenceView(preview(puzzle, row.mask))).toEqual(row.preview);
      }
    }
  });

  it('matches validate.py on every stored variant mask', () => {
    for (const fix of expected.variants) {
      const puzzle = puzzleFromVariant(variantById(fix.id));
      expect(puzzle.switches.map((p) => [p[0], p[1]])).toEqual(fix.switches);
      expect(startMask(puzzle)).toBe(fix.start);
      for (const row of fix.results) {
        expect(referenceView(simulate(puzzle, row.mask)), `${fix.id} simulate ${row.mask}`).toEqual(
          row.simulate,
        );
        expect(referenceView(preview(puzzle, row.mask)), `${fix.id} preview ${row.mask}`).toEqual(
          row.preview,
        );
      }
    }
  });

  it('census of every mask matches the reference win list', () => {
    for (const fix of expected.variants) {
      const puzzle = puzzleFromVariant(variantById(fix.id));
      const dist: Record<string, number> = {};
      const wins: number[] = [];
      const limit = 1 << puzzle.switches.length;
      for (let mask = 0; mask < limit; mask++) {
        const status = simulate(puzzle, mask).status;
        dist[status] = (dist[status] ?? 0) + 1;
        if (status === 'WIN') wins.push(mask);
      }
      expect(wins, fix.id).toEqual(fix.wins);
      expect(dist, fix.id).toEqual(fix.dist);
    }
  });

  it('authored taps simulate to the reference solution', () => {
    for (const fix of expected.variants) {
      const variant = variantById(fix.id);
      const puzzle = puzzleFromVariant(variant);
      const mask = maskAfterTaps(puzzle, variant.solution.taps);
      expect(mask, fix.id).toBe(fix.solution_mask);
      expect(gridForMask(puzzle, mask), fix.id).toEqual(fix.solution_grid);
      expect(gridForMask(puzzle, mask), fix.id).toEqual([...variant.solution.final_grid]);
      const sent = simulate(puzzle, mask);
      // Base terminals are not retune instances, so the win status is WIN.
      expect(sent.status, fix.id).toBe('WIN');
      const stored = fix.results.find((row) => row.mask === mask);
      if (!stored) throw new Error(`${fix.id} solution mask is not in the fixture`);
      expect(referenceView(sent), fix.id).toEqual(stored.simulate);
      expect(referenceView(preview(puzzle, mask)), fix.id).toEqual(stored.preview);
      expect(sent.panel.every((row) => row.lit)).toBe(true);
    }
  });

  it('BFS solver finds a minimum WIN for every variant', () => {
    for (const fix of expected.variants) {
      const puzzle = puzzleFromVariant(variantById(fix.id));
      const solved = solve(puzzle);
      expect(solved, fix.id).not.toBeNull();
      if (!solved) continue;
      expect(solved.mask, fix.id).toBe(fix.solver_mask);
      expect(solved.taps, fix.id).toHaveLength(fix.min_moves);
      expect(maskAfterTaps(puzzle, solved.taps), fix.id).toBe(solved.mask);
      expect(simulate(puzzle, solved.mask).status, fix.id).toBe('WIN');
    }
  });

  it('known bad tap sequences match the reference failures', () => {
    const cases = [
      ['M1_TERM_04', 'OVERLOAD'],
      ['M1_TERM_05', 'TRIP'],
      ['M1_TERM_02', 'SHORT'],
      ['M1_TERM_03', 'FUSE'],
    ] as const;
    for (const [id, status] of cases) {
      const fix = expected.variants.find((variant) => variant.id === id);
      if (!fix) throw new Error(`missing fixture ${id}`);
      const sample =
        fix.results.find((row) => row.simulate.status === status && row.mask !== fix.start) ??
        fix.results.find((row) => row.simulate.status === status);
      if (!sample) throw new Error(`${id} has no ${status} mask in the fixture`);
      const puzzle = puzzleFromVariant(variantById(id));
      const taps = tapsBetween(puzzle, fix.start, sample.mask);
      expect(taps.length, id).toBeGreaterThan(0);
      const mask = maskAfterTaps(puzzle, taps);
      expect(mask, id).toBe(sample.mask);
      const sent = simulate(puzzle, mask);
      expect(sent.status, id).toBe(status);
      expect(sent.status, id).not.toBe('WIN');
      expect(referenceView(sent), id).toEqual(sample.simulate);
      expect(referenceView(preview(puzzle, mask)), id).toEqual(sample.preview);
    }
  });

  it('SHORT lists the ring cells and leaves feeder tails out', () => {
    const gridCase = expected.selftest.find((entry) => entry.grid[0] === '*-+-+');
    if (!gridCase) throw new Error('ring selftest grid is missing');
    const puzzle = puzzleFromGrid(gridCase.grid, gridCase.sources, gridCase.fuses);
    const closed = gridCase.results.find((row) => row.simulate.status === 'SHORT');
    const open = gridCase.results.find((row) => row.simulate.status !== 'SHORT');
    if (!closed || !open) throw new Error('ring selftest masks are missing');
    const ring = [
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 2],
      [1, 4],
      [2, 2],
      [2, 3],
      [2, 4],
    ];
    const sent = simulate(puzzle, closed.mask);
    const live = preview(puzzle, closed.mask);
    expect(sent.ringCells).toEqual(ring);
    expect(live.ringCells).toEqual(ring);
    expect(simulate(puzzle, open.mask).ringCells).toBeUndefined();
    expect(preview(puzzle, open.mask).ringCells).toBeUndefined();
  });
});

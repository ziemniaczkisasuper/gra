// M1 zone loop: floor pickups, chest and enemy loot, base board, death latch.
// Screens live in m1-ui.ts. This module does not touch the document.
import { getCombatDeath, peekCombat } from '../combat/combat';
import { feedContracts } from './contracts';
import { boardAtBase, settleContractsOnEvac } from '../contracts/run';
import { contractsRng, getContracts } from '../contracts/save';
import type { ContractInputEvent, ContractOutputEvent } from '../contracts/types';
import { enterMode, registerSystem, type GameState } from '../core/game';
import { CONTRACT_DEFS } from '../data/contracts-m1';
import { CREDIT_PILE_KR } from '../data/loot-m1';
import {
  COPPER_ITEM_ID,
  ISSUE_POLE_ITEM_ID,
  ISSUE_SUIT_ITEM_ID,
  ITEM_DEFS,
} from '../data/inventory-m1';
import { contractEnemyId, floorContractId } from '../expedition/level';
import {
  clearFloorMemory,
  clearFloorOffer,
  getFloorOffer,
  isChestOpened,
  markChestOpened,
  setFloorOffer,
} from '../expedition/save';
import { engagedThreat, getExpedition, peekExpedition, setLiftStops } from '../expedition';
import type { ActionState } from '../input/actions';
import { rollShelf, type ExchangeShelf } from '../inventory/exchange';
import {
  addCredits,
  collectFloor,
  getInventory,
  getRunInventory,
  inventoryHudModel,
  medPatchCountOf,
  pickupItem,
  setInventory,
  setLockerSize,
  snapshotAtDeath,
} from '../inventory/inventory';
import type { FloorOffer } from '../inventory/inventory';
import type { DeathLoss, InvItem, InventoryState } from '../inventory/types';
import { enemyLootable, rollChest, rollEnemyDrop } from '../loot/roll';
import type { EnemyLootClass, LootDepth, LootDrop } from '../loot/types';
import {
  announceMk2,
  buyLights,
  getNetworkProgress,
  gridPct,
  issueMk2Grant,
  mk2Announcement,
  setNetworkProgress,
  type NetworkProgress,
} from '../progress/network';
import { hintBarText, hintFreezes, hintStateOf, pushHint } from '../tutorial/hints';
import { hintsEnabled } from '../ui/settings';
import { M1_COPY } from '../ui/m1-copy';

export interface SessionOrderLine {
  title: string;
  result: string;
}

export interface SessionNumbers {
  outcome: 'evac' | 'death';
  timeMs: number;
  depth: number;
  itemsBroughtBack: number | null;
  itemsLeftInZone: number | null;
  creditsGained: number | null;
  creditsLost: number | null;
  gridPct: number | null;
  gridDeltaPct: number | null;
  kills: number | null;
  killedBy: string | null;
  orders: SessionOrderLine[];
  permanentChanges: string[];
  atRisk: number;
  itemsLost: number;
  crLost: number;
  riskSeen: boolean;
}

export interface TerminalGrant {
  depth: LootDepth;
  variantId: string;
  firstSolve: boolean;
  copper: number;
  progress: NetworkProgress;
  /** True when this solve is the one that unlocks Issue Mk2. */
  mk2: boolean;
}

interface RunSession {
  boarded: boolean;
  settled: boolean;
  deathHandled: boolean;
  outcome: 'evac' | 'death' | null;
  baseCr: number | null;
  gridAtDepart: number | null;
  killsAtDepart: number;
  playtimeAtDepart: number;
  loss: DeathLoss | null;
  orders: SessionOrderLine[];
  nonce: number | null;
  prevUse: boolean;
  lastCell: string;
  stuckCell: string;
  looted: Set<number>;
  shelf: ExchangeShelf | null;
  visits: number;
  terminal: { depth: LootDepth; enemiesAlert: boolean } | null;
  introShown: boolean;
  mk2Shown: boolean;
  froze: boolean;
  patches: number;
  telegraph: boolean;
  liftHinted: boolean;
  zoneHinted: boolean;
  modeEdge: string;
}

const sessions = new WeakMap<GameState, RunSession>();

function session(state: GameState): RunSession {
  let log = sessions.get(state);
  if (!log) {
    log = {
      boarded: false,
      settled: false,
      deathHandled: false,
      outcome: null,
      baseCr: null,
      gridAtDepart: null,
      killsAtDepart: 0,
      playtimeAtDepart: 0,
      loss: null,
      orders: [],
      nonce: null,
      prevUse: false,
      lastCell: '',
      stuckCell: '',
      looted: new Set(),
      shelf: null,
      visits: 1,
      terminal: null,
      introShown: false,
      mk2Shown: false,
      froze: false,
      patches: -1,
      telegraph: false,
      liftHinted: false,
      zoneHinted: false,
      modeEdge: '',
    };
    sessions.set(state, log);
  }
  return log;
}

let emitContracts: ((event: ContractOutputEvent) => void) | null = null;
let toastFn: ((message: string) => void) | null = null;

export function setM1Toast(fn: ((message: string) => void) | null): void {
  toastFn = fn;
}

/** HUD numbers. Same value as `computeAtRisk` when the inventory section is present. */
export function atRiskHud(state: GameState): number {
  return inventoryHudModel(state).atRisk;
}

export function syncInventoryHud(
  hud: {
    setInventory(view: { atRisk: number; bagUsed: number; bagMax: number }): void;
    slots: { atRisk: { hidden: boolean | string }; backpack: { hidden: boolean | string } };
  },
  state: GameState,
): void {
  if (state.mode === 'base') {
    hud.slots.atRisk.hidden = true;
    hud.slots.backpack.hidden = true;
    return;
  }
  hud.setInventory(inventoryHudModel(state));
}

export function exchangeShelf(state: GameState): ExchangeShelf | null {
  return session(state).shelf;
}

export function setExchangeShelf(state: GameState, shelf: ExchangeShelf): void {
  session(state).shelf = shelf;
}

export function takeTerminalRequest(
  state: GameState,
): { depth: LootDepth; enemiesAlert: boolean } | null {
  const log = session(state);
  const request = log.terminal;
  log.terminal = null;
  return request;
}

export function hintLine(state: GameState): string | null {
  return hintBarText(state);
}

export function hintShouldFreeze(state: GameState): boolean {
  return hintFreezes(state);
}

export function markHintFreeze(state: GameState, frozen: boolean): boolean {
  const log = session(state);
  const edge = frozen && !log.froze;
  log.froze = frozen;
  return edge;
}

function storedProgress(state: GameState): NetworkProgress | null {
  const raw = state.sections.progress;
  if (!raw || typeof raw !== 'object' || !('stops' in raw)) return null;
  return raw as NetworkProgress;
}

function lootDepth(depth: number): LootDepth {
  return depth === 2 || depth === 3 ? depth : 1;
}

function paint(state: GameState, x: number, y: number, ch: string): void {
  state.map.setTile(x, y, ch);
  const ex = peekExpedition(state);
  const row = ex?.rows?.[y];
  if (!ex?.rows || row === undefined || x < 0 || x >= row.length) return;
  ex.rows[y] = row.slice(0, x) + ch + row.slice(x + 1);
}

function emitFed(state: GameState, inputs: Parameters<typeof feedContracts>[1]): void {
  if (!emitContracts) {
    feedContracts(state, inputs);
    return;
  }
  for (const event of feedContracts(state, inputs)) emitContracts(event);
}

function tryOffer(state: GameState, offer: FloorOffer, how: 'step' | 'use'): FloorOffer | null {
  if (!state.sections.inventory) return offer;
  const res = collectFloor(getInventory(state), offer, how);
  if (res.reason === 'bagFull' && res.taken === 0) toastFn?.(M1_COPY.M1_SYS_06);
  if (res.taken > 0) {
    setInventory(state, res.state);
    if (res.contractEvents?.length) emitFed(state, res.contractEvents);
    pushHint(state, { type: 'pickedUp' });
  }
  if (res.left > 0) {
    if (offer.glyph === '$') return offer;
    return { ...offer, count: res.left };
  }
  return res.ok ? null : offer;
}

function offerFromDrop(drop: LootDrop): FloorOffer {
  if (drop.kind === 'gear') {
    return {
      glyph:
        drop.slot === 'weapon'
          ? '/'
          : drop.slot === 'armor'
            ? '['
            : drop.slot === 'module'
              ? '"'
              : '(',
      itemId: drop.itemId,
      count: 1,
      gear: {
        slot: drop.slot,
        rarity: drop.rarity,
        ilvl: drop.ilvl,
        nameId: drop.nameId,
        affixes: drop.affixes.map((affix) => ({ id: affix.id, value: affix.value })),
        base: { id: drop.base.id, value: drop.base.value },
        ...(drop.slot === 'weapon' ? { weaponKind: drop.weaponKind } : {}),
      },
    };
  }
  if (drop.kind === 'medPatch') return { glyph: '+', itemId: drop.itemId, count: drop.count };
  return { glyph: ':', itemId: drop.itemId, count: drop.count };
}

function placeOffers(state: GameState, x: number, y: number, offers: readonly FloorOffer[]): void {
  const left: FloorOffer[] = [];
  for (const offer of offers) {
    const rest = tryOffer(state, offer, 'use');
    if (rest) left.push(rest);
  }
  const first = left[0];
  if (!first) {
    clearFloorOffer(state, x, y);
    if (state.map.tile(x, y) !== '#' && state.map.tile(x, y) !== '<') paint(state, x, y, '.');
    return;
  }
  setFloorOffer(state, x, y, first);
  paint(state, x, y, first.glyph);
}

function standingOffer(state: GameState, x: number, y: number, glyph: string): FloorOffer {
  const stored = getFloorOffer(state, x, y);
  if (stored) return stored;
  if (glyph === '$') {
    const [lo, hi] = CREDIT_PILE_KR;
    const credits = state.rng.stream('loot').int(lo, hi);
    return { glyph, credits };
  }
  if (glyph === '§') {
    const contractId = floorContractId(state, x, y);
    return contractId === null ? { glyph } : { glyph, contractId };
  }
  return { glyph };
}

function lootClass(contract: boolean, summoned: boolean): EnemyLootClass {
  if (contract) return 'contract';
  if (summoned) return 'bossDrone';
  return 'pool';
}

function onKills(state: GameState): void {
  const combat = peekCombat(state);
  if (!combat) return;
  const log = session(state);
  const depth = lootDepth(peekExpedition(state)?.depth ?? getExpedition(state).depth);
  for (const event of combat.events) {
    if (event.type === 'playerDied' && !log.deathHandled) {
      log.deathHandled = true;
      log.outcome = 'death';
      if (state.mode === 'zone') enterMode(state, 'death');
    }
    if (event.type !== 'enemyKilled' || log.looted.has(event.enemyId)) continue;
    log.looted.add(event.enemyId);
    const ec = combat.enemies.get(event.enemyId);
    const contract = event.contract === true || ec?.contract === true;
    const drops = rollEnemyDrop(state.rng.stream('loot'), {
      depth,
      lootable: enemyLootable(lootClass(contract, ec?.summoned === true)),
    });
    const contractId = contractEnemyId(state, event.enemyId);
    if (contractId !== null) emitFed(state, [{ type: 'contractEnemyKilled', contractId }]);
    const body = state.entities.find((entity) => entity.id === event.enemyId);
    const x = body?.x ?? state.player.x;
    const y = body?.y ?? state.player.y;
    if (drops.length > 0) placeOffers(state, x, y, drops.map(offerFromDrop));
    if (event.enemyType === 'scrapper') pushHint(state, { type: 'killed', kind: 'scrapper' });
    else if (event.enemyType) pushHint(state, { type: 'killed', kind: event.enemyType });
  }
}

const AUTO = new Set(['$', ':', '+']);
const USE_GLYPH = new Set(['§', '/', '[', '"', '(']);

function facedCell(state: GameState): { x: number; y: number } {
  const sx = Math.sign(state.player.facing.x);
  const sy = Math.sign(state.player.facing.y);
  return { x: state.player.x + sx, y: state.player.y + sy };
}

function onFloor(state: GameState, actions: ActionState): void {
  const log = session(state);
  const x = state.player.x;
  const y = state.player.y;
  const key = `${x},${y}`;
  const glyph = state.map.tile(x, y);
  if (log.lastCell !== key) {
    log.lastCell = key;
    log.stuckCell = '';
  }
  if (AUTO.has(glyph) && log.stuckCell !== key) {
    const offer = standingOffer(state, x, y, glyph);
    const rest = tryOffer(state, offer, 'step');
    if (rest) {
      setFloorOffer(state, x, y, rest);
      log.stuckCell = key;
    } else {
      clearFloorOffer(state, x, y);
      paint(state, x, y, '.');
    }
  }
  const edge = actions.use && !log.prevUse;
  log.prevUse = actions.use;
  if (!edge) return;
  const spots = [{ x, y }, facedCell(state)];
  for (const spot of spots) {
    const ch = state.map.tile(spot.x, spot.y);
    if (ch === '■' && !isChestOpened(state, spot.x, spot.y)) {
      markChestOpened(state, spot.x, spot.y);
      const depth = lootDepth(peekExpedition(state)?.depth ?? 1);
      const rolled = rollChest(state.rng.stream('loot'), depth).map(offerFromDrop);
      placeOffers(state, spot.x, spot.y, rolled);
      return;
    }
    if (ch === '&') {
      log.terminal = {
        depth: lootDepth(peekExpedition(state)?.depth ?? 1),
        enemiesAlert: engagedThreat(state),
      };
      return;
    }
    if (!USE_GLYPH.has(ch)) continue;
    const offer = standingOffer(state, spot.x, spot.y, ch);
    const rest = tryOffer(state, offer, 'use');
    if (rest) setFloorOffer(state, spot.x, spot.y, rest);
    else {
      clearFloorOffer(state, spot.x, spot.y);
      paint(state, spot.x, spot.y, '.');
    }
    return;
  }
}

function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

function noteHints(state: GameState, actions: ActionState, dtMs: number): void {
  const on = hintsEnabled();
  if (hintStateOf(state).hintsOn !== on) pushHint(state, { type: 'setHints', on });
  const log = session(state);
  const moved = actions.move.x !== 0 || actions.move.y !== 0;
  if (moved) pushHint(state, { type: 'walk' });
  else if (dtMs > 0) pushHint(state, { type: 'idle', ms: dtMs });
  const combat = peekCombat(state);
  if (!combat) return;
  let near = 0;
  for (const enemy of combat.enemies.values()) {
    if (enemy.ai === 'dead') continue;
    const body = state.entities.find((entity) => entity.id === enemy.id);
    if (!body) continue;
    const dist = chebyshev(state.player.x, state.player.y, body.x, body.y);
    if (dist <= 1) {
      near += 1;
      pushHint(state, { type: 'enemyAdjacent', ms: dtMs });
    }
    if (enemy.ai === 'attack' && !log.telegraph) {
      log.telegraph = true;
      pushHint(state, { type: 'telegraph' });
    }
  }
  if (near >= 3) pushHint(state, { type: 'crowded' });
  if (combat.player.hp * 4 < combat.player.maxHp) pushHint(state, { type: 'lowHp' });
  for (const event of combat.events) {
    if (event.type === 'playerDodged') pushHint(state, { type: 'dodged' });
    if (event.type === 'dash') pushHint(state, { type: 'dashed' });
  }
  if (state.sections.inventory) {
    const patches = medPatchCountOf(getInventory(state));
    if (log.patches >= 0 && patches < log.patches) pushHint(state, { type: 'usedPatch' });
    log.patches = patches;
    const bag = getRunInventory(state);
    if (bag.slotsMax > 0 && bag.usedSlots >= bag.slotsMax - 3)
      pushHint(state, { type: 'bagAlmostFull' });
  }
  if (nearGlyph(state, '&')) pushHint(state, { type: 'nearTerminal' });
  if (nearGlyph(state, '<')) pushHint(state, { type: 'nearShaft' });
}

function nearGlyph(state: GameState, ch: string): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (state.map.tile(state.player.x + dx, state.player.y + dy) === ch) return true;
    }
  }
  return false;
}

function countCopper(inv: InventoryState): number {
  let n = 0;
  for (const stack of inv.bag) if (stack?.itemId === COPPER_ITEM_ID) n += stack.count;
  for (const stack of inv.locker) if (stack?.itemId === COPPER_ITEM_ID) n += stack.count;
  return n;
}

function spendCopper(inv: InventoryState, count: number): InventoryState | null {
  if (countItemSafe(inv) < count) return null;
  const next: InventoryState = {
    ...inv,
    bag: inv.bag.map((item) => (item ? { ...item } : null)),
    locker: inv.locker.map((item) => (item ? { ...item } : null)),
    gear: { ...inv.gear },
  };
  let left = count;
  for (const box of [next.bag, next.locker]) {
    for (let i = 0; i < box.length && left > 0; i++) {
      const item = box[i];
      if (!item || item.itemId !== COPPER_ITEM_ID) continue;
      const used = Math.min(item.count, left);
      left -= used;
      box[i] = used === item.count ? null : { ...item, count: item.count - used };
    }
  }
  return left === 0 ? next : null;
}

function countItemSafe(inv: InventoryState): number {
  return countCopper(inv);
}

/** Buy the next Lights level from the base. The wallet moves; the shelf does not roll itself. */
export function purchaseLights(state: GameState): { ok: boolean; text: string } {
  if (!state.sections.inventory || !state.sections.progress) {
    return { ok: false, text: '' };
  }
  const progress = getNetworkProgress(state);
  const inv = getInventory(state);
  const bought = buyLights(progress, { credits: inv.baseCr, copper: countCopper(inv) });
  if (!bought.ok) return { ok: false, text: bought.reason };
  const paid = addCredits(inv, -bought.cost.credits);
  if (!paid.ok) return { ok: false, text: 'credits' };
  const spent = bought.cost.copper > 0 ? spendCopper(paid.state, bought.cost.copper) : paid.state;
  if (!spent) return { ok: false, text: 'copper' };
  setNetworkProgress(state, bought.progress);
  setInventory(state, setLockerSize(spent, bought.progress.lights));
  const line =
    bought.progress.lights >= 3
      ? M1_COPY.M1_BASE_16
      : bought.progress.lights === 2
        ? M1_COPY.M1_BASE_15
        : M1_COPY.M1_BASE_08;
  return { ok: true, text: line };
}

export function noteContractInputs(state: GameState, inputs: readonly ContractInputEvent[]): void {
  if (inputs.length === 0) return;
  emitFed(state, inputs);
}

/** Put a bag drop back on the player's cell so USE / step can pick it up again. */
export function dropOnFloor(state: GameState, item: InvItem): void {
  const glyph = ITEM_DEFS[item.itemId]?.glyph ?? ':';
  const offer: FloorOffer = { glyph, itemId: item.itemId, count: item.count };
  if (item.contractId !== undefined) offer.contractId = item.contractId;
  if (item.gear) {
    const { uid: _uid, ...gear } = item.gear;
    offer.gear = gear;
  }
  setFloorOffer(state, state.player.x, state.player.y, offer);
  paint(state, state.player.x, state.player.y, glyph);
}

export function grantTerminal(state: GameState, grant: TerminalGrant): void {
  setNetworkProgress(state, grant.progress);
  setLiftStops(state, grant.progress.stops);
  if (grant.copper > 0 && state.sections.inventory) {
    const picked = pickupItem(getInventory(state), { itemId: COPPER_ITEM_ID, count: grant.copper });
    if (picked.ok) setInventory(state, picked.state);
  }
  if (grant.mk2) grantIssueMk2(state);
  emitFed(state, [
    {
      type: 'terminalSolved',
      depth: grant.depth,
      variant: grant.variantId,
      firstSolve: grant.firstSolve,
    },
  ]);
  pushHint(state, { type: 'terminalSolved' });
}

function grantIssueMk2(state: GameState): void {
  if (!state.sections.inventory) return;
  if (!issueMk2Grant(getNetworkProgress(state))) return;
  const inv = getInventory(state);
  const gear = { ...inv.gear };
  const weapon = gear.weapon;
  const armor = gear.armor;
  if (!weapon || weapon.itemId === ISSUE_POLE_ITEM_ID) {
    gear.weapon = { itemId: ISSUE_POLE_ITEM_ID, count: 1 };
  }
  if (!armor || armor.itemId === ISSUE_SUIT_ITEM_ID) {
    gear.armor = { itemId: ISSUE_SUIT_ITEM_ID, count: 1 };
  }
  setInventory(state, { ...inv, gear });
}

const CONTRACT_TITLE: Record<string, string> = {
  M1_CONTR_01: 'Restore a Relay (depth {depth})',
  M1_CONTR_02: 'Recover the Data Core (depth 2)',
  M1_CONTR_03: 'Clear the Path to the Lift',
};

export function baseOrders(state: GameState): SessionOrderLine[] {
  return getContracts(state)
    .base.filter((slot) => slot !== null)
    .map((slot) => ({
      title: (CONTRACT_TITLE[slot.defId] ?? CONTRACT_DEFS[slot.defId].textId).replace(
        '{depth}',
        String(slot.depth),
      ),
      result: slot.progress.met ? 'done' : 'open',
    }));
}

/** True once, when the base should show M1_BASE_01/02. */
export function takeIntro(state: GameState): boolean {
  const progress = storedProgress(state);
  const log = session(state);
  if (!progress?.prologue && progress?.prologueBuilt !== true) return false;
  if (log.introShown || progress.tutSeen.includes('intro')) return false;
  log.introShown = true;
  if (!progress.tutSeen.includes('intro')) progress.tutSeen = [...progress.tutSeen, 'intro'];
  return progress.prologueBuilt || progress.tutSeen.includes('intro');
}

/** M1_BASE_17 once, the first base entry after stop 2 unlocks. */
export function takeMk2Announcement(state: GameState): 'M1_BASE_17' | null {
  const progress = storedProgress(state);
  if (!progress) return null;
  const line = mk2Announcement(progress);
  if (!line) return null;
  const log = session(state);
  if (log.mk2Shown) return null;
  log.mk2Shown = true;
  setNetworkProgress(state, announceMk2(progress));
  return line;
}

export function buildSessionNumbers(state: GameState): SessionNumbers {
  const log = session(state);
  const progress = storedProgress(state);
  const ex = peekExpedition(state) ?? getExpedition(state);
  const grid = progress ? gridPct(progress) : null;
  const gained =
    log.outcome !== 'death' && log.baseCr !== null && state.sections.inventory
      ? getInventory(state).baseCr - log.baseCr
      : null;
  const killed = getCombatDeath(state)?.killer?.enemyType ?? null;
  const kills = peekCombat(state) ? peekCombat(state)!.stats.kills - log.killsAtDepart : null;
  const brought =
    log.outcome === 'death' || !state.sections.inventory ? null : getRunInventory(state).usedSlots;
  const changes: string[] = [];
  if (log.gridAtDepart !== null && grid !== null && grid > log.gridAtDepart)
    changes.push(M1_COPY.M1_BASE_09);
  if (gained !== null && gained > 0) changes.push(`Credits kept: ${gained} cr`);
  if (changes.length === 0) changes.push(M1_COPY.M1_BASE_13);
  return {
    outcome: log.outcome === 'death' ? 'death' : 'evac',
    timeMs: Math.max(0, state.meta.playtimeMs - log.playtimeAtDepart),
    depth: ex.depth,
    itemsBroughtBack: brought,
    itemsLeftInZone: log.outcome === 'death' ? (log.loss?.items.length ?? 0) : 0,
    creditsGained: log.outcome === 'death' ? null : gained,
    creditsLost: log.outcome === 'death' ? (log.loss?.totalCr ?? 0) : null,
    gridPct: grid,
    gridDeltaPct: grid !== null && log.gridAtDepart !== null ? grid - log.gridAtDepart : null,
    kills,
    killedBy: killed,
    orders: log.orders.length > 0 ? log.orders : baseOrders(state),
    permanentChanges: changes,
    atRisk: log.loss?.totalCr ?? 0,
    itemsLost: log.loss?.items.length ?? 0,
    crLost: log.loss?.totalCr ?? 0,
    riskSeen: progress?.riskExplainerSeen === true,
  };
}

/** Mode edges: one contract board per base entry, one evac settlement, departure numbers. */
export function noteExpeditionFrame(state: GameState): void {
  const log = session(state);
  const ex = peekExpedition(state);
  if (ex && log.nonce !== null && log.nonce !== ex.nonce) {
    clearFloorMemory(state);
    log.looted.clear();
    log.deathHandled = false;
    log.outcome = null;
    log.orders = [];
    log.telegraph = false;
  }
  if (ex) log.nonce = ex.nonce;
  if (state.mode === 'lift' && log.modeEdge !== 'lift' && ex?.lift.toZone) {
    log.outcome = null;
    log.deathHandled = false;
    log.settled = false;
    log.orders = [];
    if (state.sections.inventory) log.baseCr = getInventory(state).baseCr;
    const progress = storedProgress(state);
    log.gridAtDepart = progress ? gridPct(progress) : null;
    log.killsAtDepart = peekCombat(state)?.stats.kills ?? 0;
    log.playtimeAtDepart = state.meta.playtimeMs;
  }
  log.modeEdge = state.mode;
  if (state.mode === 'base') {
    if (!log.boarded) {
      const progress = storedProgress(state);
      boardAtBase(state, contractsRng(state), {
        unlockedStops: progress?.stops ?? [],
        solvedVariants: progress?.solved ?? [],
      });
      if (progress) setLiftStops(state, progress.stops);
      const lights = progress?.lights ?? 0;
      log.shelf = rollShelf(state.rng.stream('exchange'), log.visits, {
        lights,
        afterDeath: log.outcome === 'death',
      });
      log.visits += 1;
      log.boarded = true;
      log.settled = false;
      log.mk2Shown = false;
      pushHint(state, { type: 'baseTick' });
    }
  } else if (state.mode === 'lift' || state.mode === 'zone') {
    log.boarded = false;
  }
  if (state.mode === 'base') {
    log.liftHinted = false;
    log.zoneHinted = false;
  } else if (state.mode === 'lift' && !log.liftHinted) {
    log.liftHinted = true;
    pushHint(state, { type: 'choseLift' });
  }
  if (state.mode === 'zone' && ex?.active && !log.zoneHinted) {
    log.zoneHinted = true;
    pushHint(state, { type: 'enterZone' });
  }
  if (state.mode === 'report' && !log.settled) {
    if (log.outcome !== 'death' && state.sections.contracts) {
      const settled = settleContractsOnEvac(state);
      log.orders = [];
      for (const event of settled.events) {
        if (event.type === 'contract:completed') {
          log.orders.push({ title: event.payload.defId, result: 'done' });
        }
        if (event.type === 'contract:failed') {
          log.orders.push({ title: event.payload.defId, result: 'failed' });
        }
      }
      for (const event of settled.events) emitContracts?.(event);
      log.outcome = 'evac';
    }
    if (log.outcome === 'death')
      log.orders = baseOrders(state).map((line) => ({ ...line, result: 'failed' }));
    log.settled = true;
    pushHint(state, { type: 'evacuated' });
  }
}

function playerPhase(state: GameState): void {
  if (!state.sections.inventory) return;
  const log = session(state);
  if (!log.deathHandled) log.loss = snapshotAtDeath(getInventory(state));
}

/** Registers the pickup / loot / death systems. Call after `installContracts`. */
export function installM1Loop(emit?: (event: ContractOutputEvent) => void): () => void {
  emitContracts = emit ?? null;
  const offPlayer = registerSystem((state) => playerPhase(state), 'player');
  const offWorld = registerSystem((state, actions, dt) => {
    onKills(state);
    if (state.mode !== 'zone') return;
    onFloor(state, actions);
    noteHints(state, actions, dt);
  }, 'world');
  return () => {
    offPlayer();
    offWorld();
  };
}

// DOM for the M1 loop. Mounted from main.ts. The rules live in m1-loop.ts.
import { enterMode, type GameState } from '../core/game';
import type { PauseReason } from '../core/events';
import { MEDPATCH_MAX } from '../data/inventory-m1';
import { STRINGS } from '../data/strings';
import { engagedThreat, finishReport, getExpedition, useBaseLift } from '../expedition';
import { getCredits, getInventory, medPatchCountOf, setInventory } from '../inventory/inventory';
import type { ExchangeShelf } from '../inventory/exchange';
import type { InventoryState } from '../inventory/types';
import { gridPct, issueMk2Grant } from '../progress/network';
import type { ExportReminder } from '../save/reminder';
import { mountBaseHub, type BaseHub } from '../ui/base-hub';
import { createDeathScreen, deathScreenData, type DeathScreen } from '../ui/death-screen';
import { mountExchangeScreen, type ExchangeScreen } from '../ui/exchange-screen';
import { mountHintBar, type HintBar } from '../ui/hint-bar';
import { mountInventoryScreen, type InventoryScreen } from '../ui/inventory-screen';
import { mountLockerScreen, type LockerScreen } from '../ui/locker-screen';
import { M1_COPY } from '../ui/m1-copy';
import { mountReportScreen, type ReportScreen, type SessionReportData } from '../ui/report-screen';
import {
  markSeen,
  mountRiskExplainer,
  shouldShowRiskExplainer,
  type RiskExplainer,
} from '../ui/risk-explainer';
import { setHintsEnabled, hintsEnabled } from '../ui/settings';
import { mountTerminalScreen, type TerminalScreen } from '../ui/terminal-screen';
import { TERM_COPY } from '../ui/terminal-copy';
import {
  baseOrders,
  buildSessionNumbers,
  dropOnFloor,
  exchangeShelf,
  grantTerminal,
  hintLine,
  hintShouldFreeze,
  markHintFreeze,
  noteContractInputs,
  purchaseLights,
  setExchangeShelf,
  setM1Toast,
  takeIntro,
  takeMk2Announcement,
  takeTerminalRequest,
} from './m1-loop';
import { getNetworkProgress, setNetworkProgress } from '../progress/network';
import { getCombatDeath } from '../combat/combat';

export interface M1UiHost {
  root: HTMLElement;
  getState(): GameState;
  loop: {
    pause(reason: PauseReason): void;
    resume(opts?: { countdown?: boolean }): void;
    readonly paused: boolean;
    readonly pauseReason: PauseReason | null;
    activeMs(): number;
  };
  toast(message: string): void;
  showText(pages: readonly string[]): void;
  checkExportReminder(): ExportReminder | null;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function reportData(state: GameState): SessionReportData {
  const numbers = buildSessionNumbers(state);
  return {
    outcome: numbers.outcome,
    timeInZone: formatTime(numbers.timeMs),
    depth: numbers.depth,
    itemsBroughtBack: numbers.itemsBroughtBack,
    itemsLeftInZone: numbers.itemsLeftInZone,
    creditsGained: numbers.creditsGained,
    creditsLost: numbers.creditsLost,
    gridPct: numbers.gridPct,
    gridDeltaPct: numbers.gridDeltaPct,
    kills: numbers.kills,
    killedBy: numbers.killedBy,
    orders: numbers.orders,
    permanentChanges: numbers.permanentChanges,
  };
}

function commitInv(state: GameState, next: InventoryState): void {
  setInventory(state, next);
}

export function attachM1Ui(host: M1UiHost): { sync(): void; destroy(): void } {
  setM1Toast((message) => host.toast(message));
  const hintBar: HintBar = mountHintBar(host.root);
  let hub: BaseHub | null = null;
  let exchange: ExchangeScreen | null = null;
  let locker: LockerScreen | null = null;
  let gear: InventoryScreen | null = null;
  let gearPlace: 'base' | 'zone' | null = null;
  let report: ReportScreen | null = null;
  let explainer: RiskExplainer | null = null;
  let death: DeathScreen | null = null;
  let terminal: TerminalScreen | null = null;
  let bound: GameState | null = null;
  let deathPhase: 'explainer' | 'death' | null = null;

  const destroyHub = () => {
    hub?.destroy();
    hub = null;
  };
  const destroyExchange = () => {
    exchange?.destroy();
    exchange = null;
  };
  const destroyLocker = () => {
    locker?.destroy();
    locker = null;
  };
  const destroyGear = () => {
    gear?.destroy();
    gear = null;
    gearPlace = null;
  };
  const destroyReport = () => {
    report?.destroy();
    report = null;
  };
  const destroyDeath = () => {
    explainer?.destroy();
    explainer = null;
    death?.hide();
    deathPhase = null;
  };

  const ensureTerminal = () => {
    if (terminal) return terminal;
    terminal = mountTerminalScreen(host.root, {
      onPause: (paused) => {
        if (paused) host.loop.pause('text');
        else if (host.loop.pauseReason === 'text') host.loop.resume({ countdown: false });
      },
      onBlocked: () => host.toast(TERM_COPY.M1_SYS_04),
      onSolved: (event) => {
        const state = host.getState();
        const depth = getExpedition(state).depth;
        grantTerminal(state, {
          depth: depth === 2 || depth === 3 ? depth : 1,
          variantId: event.variantId,
          firstSolve: event.firstSolve,
          copper: event.copper,
          progress: event.progress,
          mk2: event.mk2 !== null,
        });
      },
      onProgress: (progress) => setNetworkProgress(host.getState(), progress),
    });
    return terminal;
  };

  const showDeath = () => {
    const state = host.getState();
    const numbers = buildSessionNumbers(state);
    deathPhase = 'death';
    if (!death) {
      death = createDeathScreen(host.root, {
        clock: () => host.loop.activeMs(),
        onExit: () => {
          death?.hide();
          enterMode(host.getState(), 'report');
          deathPhase = null;
        },
      });
    }
    const lost = { cr: numbers.crLost, items: numbers.itemsLost };
    death.show(deathScreenData(getCombatDeath(state), lost));
  };

  const openExplainerOrDeath = () => {
    if (deathPhase) return;
    const state = host.getState();
    const numbers = buildSessionNumbers(state);
    if (shouldShowRiskExplainer({ seen: numbers.riskSeen, atRisk: numbers.atRisk })) {
      deathPhase = 'explainer';
      explainer = mountRiskExplainer(host.root, {
        itemsLost: numbers.itemsLost,
        crLost: numbers.crLost,
        now: () => host.loop.activeMs(),
        onOk: () => {
          const current = host.getState();
          const progress = getNetworkProgress(current);
          const seen = markSeen({ seen: progress.riskExplainerSeen });
          setNetworkProgress(current, { ...progress, riskExplainerSeen: seen.seen });
          explainer?.destroy();
          explainer = null;
          deathPhase = null;
          showDeath();
        },
      });
      return;
    }
    showDeath();
  };

  const showReport = () => {
    if (report) return;
    const state = host.getState();
    report = mountReportScreen(host.root, reportData(state), {
      now: () => host.loop.activeMs(),
      onContinue: () => {
        finishReport(host.getState());
        destroyReport();
        const reminder = host.checkExportReminder();
        if (reminder) host.loop.pause('menu');
      },
    });
    const reminder = host.checkExportReminder();
    if (reminder) {
      const note = document.createElement('p');
      note.dataset.slot = 'export-reminder';
      note.textContent = STRINGS.exportFile;
      report.exportSlot.append(note);
    }
  };

  const addLights = (parent: HTMLElement) => {
    if (parent.querySelector('[data-action="lights"]')) return;
    const button = document.createElement('div');
    button.dataset.action = 'lights';
    button.className = 'm1-chip';
    button.setAttribute('role', 'button');
    button.tabIndex = -1;
    button.textContent = 'LIGHTS';
    button.addEventListener('click', () => {
      const result = purchaseLights(host.getState());
      if (result.ok && result.text) host.showText([result.text]);
      else if (!result.ok && result.text) host.toast(result.text);
      hub?.refresh();
      exchange?.refresh();
    });
    parent.append(button);
  };

  const inventoryOptions = (place: 'base' | 'zone') => {
    const state = host.getState();
    const armor = issueMk2Grant(getNetworkProgress(state))?.suit.armor ?? 0;
    return {
      getState: () => getInventory(host.getState()),
      commit: (next: InventoryState) => commitInv(host.getState(), next),
      inCombat: false,
      onPause: (paused: boolean) => {
        if (place === 'base') return;
        if (paused) host.loop.pause('text');
        else if (host.loop.pauseReason === 'text') host.loop.resume({ countdown: false });
      },
      place,
      issueArmor: armor,
      onDrop: (dropped: Parameters<typeof dropOnFloor>[1]) => dropOnFloor(host.getState(), dropped),
      onContractEvents: (events: Parameters<typeof noteContractInputs>[1]) =>
        noteContractInputs(host.getState(), events),
    };
  };

  const showHub = () => {
    if (hub || exchange || locker || (gear && gearPlace === 'base')) return;
    const state = host.getState();
    if (takeIntro(state)) host.showText([M1_COPY.M1_BASE_01, M1_COPY.M1_BASE_02]);
    const mk2 = takeMk2Announcement(host.getState());
    if (mk2) host.showText([M1_COPY[mk2]]);
    hub = mountBaseHub(host.root, {
      getData: () => {
        const current = host.getState();
        const progress = getNetworkProgress(current);
        const inv = getInventory(current);
        return {
          credits: getCredits(inv),
          gridPct: gridPct(progress),
          medPatches: medPatchCountOf(inv),
          medPatchMax: MEDPATCH_MAX,
          stops: getExpedition(current).stops.length,
          lights: progress.lights,
          orders: baseOrders(current).map((line, index) => ({
            id: `${line.title}-${index}`,
            title: line.title,
            detail: line.result,
          })),
        };
      },
      onLift: () => {
        destroyHub();
        useBaseLift(host.getState());
      },
      onOrders: () => hub?.refresh(),
      onExchange: () => {
        destroyHub();
        openExchange();
      },
      onLocker: () => {
        destroyHub();
        openLocker();
      },
      onGear: () => {
        destroyHub();
        openGear('base');
      },
      onSettings: () => host.loop.pause('menu'),
    });
    addLights(hub.element);
    addHints(hub.element);
  };

  const openExchange = () => {
    const state = host.getState();
    const shelf = exchangeShelf(state);
    exchange = mountExchangeScreen(host.root, {
      getState: () => getInventory(host.getState()),
      commit: (next) => commitInv(host.getState(), next),
      getShelf: () => exchangeShelf(host.getState()) ?? emptyShelf(shelf),
      setShelf: (next: ExchangeShelf) => setExchangeShelf(host.getState(), next),
      rng: host.getState().rng.stream('exchange'),
      onBack: () => {
        destroyExchange();
        showHub();
      },
    });
    addLights(exchange.element);
  };

  const openLocker = () => {
    locker = mountLockerScreen(host.root, {
      getState: () => getInventory(host.getState()),
      commit: (next) => commitInv(host.getState(), next),
      onBack: () => {
        destroyLocker();
        showHub();
      },
    });
  };

  const openGear = (place: 'base' | 'zone') => {
    destroyGear();
    gear = mountInventoryScreen(host.root, inventoryOptions(place));
    gearPlace = place;
    if (place === 'base') gear.open();
  };

  const sync = () => {
    const state = host.getState();
    if (bound !== state) {
      destroyHub();
      destroyExchange();
      destroyLocker();
      destroyGear();
      destroyReport();
      destroyDeath();
      terminal?.destroy();
      terminal = null;
      bound = state;
    }
    const line = hintLine(state);
    hintBar.setText(hintsEnabled() ? line : null);
    const freeze = hintsEnabled() && hintShouldFreeze(state);
    if (markHintFreeze(state, freeze) && !host.loop.paused) host.loop.pause('tutorial');
    if (!freeze && host.loop.pauseReason === 'tutorial') host.loop.resume();

    const request = takeTerminalRequest(state);
    if (request) {
      const screen = ensureTerminal();
      const progress = getNetworkProgress(state);
      screen.open({ ...request, progress });
    }

    if (state.mode === 'death') {
      destroyHub();
      openExplainerOrDeath();
      explainer?.refresh();
      death?.update();
      return;
    }
    if (deathPhase) destroyDeath();

    if (state.mode === 'report') {
      destroyHub();
      showReport();
      report?.refresh();
      return;
    }
    if (report) destroyReport();

    if (state.mode === 'base') {
      if (gear && gearPlace === 'zone') destroyGear();
      if (gear && gearPlace === 'base' && !gear.isOpen) {
        destroyGear();
        showHub();
      }
      if (!exchange && !locker && !(gear && gearPlace === 'base')) showHub();
      return;
    }

    destroyHub();
    destroyExchange();
    destroyLocker();
    if (state.mode === 'zone') {
      if (!gear || gearPlace !== 'zone') openGear('zone');
      gear?.setInCombat(engagedThreat(state));
    } else if (gear && gearPlace === 'zone') {
      destroyGear();
    }
  };

  return {
    sync,
    destroy() {
      setM1Toast(null);
      hintBar.destroy();
      destroyHub();
      destroyExchange();
      destroyLocker();
      destroyGear();
      destroyReport();
      destroyDeath();
      terminal?.destroy();
    },
  };
}

function emptyShelf(current: ExchangeShelf | null): ExchangeShelf {
  return (
    current ?? {
      visitSeed: 0,
      lights: 0,
      ilvl: 1,
      afterDeath: false,
      offers: [],
      refreshesUsed: 0,
    }
  );
}

function addHints(parent: HTMLElement): void {
  if (parent.querySelector('[data-action="hints"]')) return;
  const button = document.createElement('div');
  button.dataset.action = 'hints';
  button.className = 'm1-chip';
  button.setAttribute('role', 'button');
  button.tabIndex = -1;
  const paint = () => {
    button.textContent = hintsEnabled() ? 'HINTS ON' : 'HINTS OFF';
  };
  paint();
  button.addEventListener('click', () => {
    setHintsEnabled(!hintsEnabled());
    paint();
  });
  parent.append(button);
}

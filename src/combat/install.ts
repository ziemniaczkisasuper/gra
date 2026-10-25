import { registerSystem } from '../core/game';
import { combatPlayerPhase, combatWorldPhase, setCombatBus, type CombatBusEmit } from './combat';
import './save'; // registers the 'combat' save section (save v3) at import time

/**
 * Registers combat in the engine tick (call once at boot). Returns an uninstall function.
 * `emit` (optional) = the game bus: 'combat:event' + boss FX triggers (walka-m1.md §8).
 */
export function installCombat(emit?: CombatBusEmit): () => void {
  if (emit) setCombatBus(emit);
  const offPlayer = registerSystem(combatPlayerPhase, 'player');
  const offWorld = registerSystem(combatWorldPhase, 'world');
  return () => {
    offPlayer();
    offWorld();
    if (emit) setCombatBus(null);
  };
}

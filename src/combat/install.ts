import { registerSystem } from '../core/game';
import { combatPlayerPhase, combatWorldPhase } from './combat';

/** Registers combat in the engine tick (call once at boot). Returns an uninstall function. */
export function installCombat(): () => void {
  const offPlayer = registerSystem(combatPlayerPhase, 'player');
  const offWorld = registerSystem(combatWorldPhase, 'world');
  return () => {
    offPlayer();
    offWorld();
  };
}

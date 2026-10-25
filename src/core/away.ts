import type { PauseDetail } from './events';

/**
 * QA-M0-006 (§1.11): remembers whether the player was hit while away (no input in that tick)
 * since their last input. Trigger D always reports it; the idle trigger E reports it only if
 * such a hit happened during the idle time.
 */
export class AwayHitTracker {
  private hit = false;

  /** Once per tick after stepGame. `idleMs` = 0 when there was input in this tick. */
  update(idleMs: number, playerHitThisTick: boolean): void {
    if (idleMs === 0) this.hit = false;
    else if (playerHitThisTick) this.hit = true;
  }

  /** Detail for an idle (E) auto-pause. */
  get detail(): PauseDetail | undefined {
    return this.hit ? 'hitWhileAway' : undefined;
  }

  reset(): void {
    this.hit = false;
  }
}

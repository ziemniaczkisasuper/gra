# combat/ – PROG / Gameplay

Combat M0 (design/mechaniki-m1.md part 1). Full description: `/workspace/GRA/prog/walka-m0.md`.

| File | What |
|---|---|
| `combat.ts` | the two tick systems (`combatPlayerPhase`, `combatWorldPhase`), AI, blows, death, respawn, regen, visuals-as-data; `getCombat()`, `getCombatHud()`, `takeAutoPauseRequest()` |
| `install.ts` | `installCombat()` – registers the systems ('player' + 'world' phase) |
| `state.ts` | plain-data types (`CombatData`, `EnemyCombat`, events) |
| `grid.ts` | line of sight (Bresenham), melee reach, BFS first step |
| `timing.ts` | ms → ticks (`computeTicks`) |
| `overlay.ts` | canvas overlay: floating numbers, `!`, SIGNAL LOST, fallback HP line |

Numbers: `src/data/combat-m0.ts` (spreads table 1.14 from `data/mechanics-m0.ts` + extras).
Glyphs/colours: `COMBAT_STYLE` in `src/data/style.ts`.

Rules: logic never touches DOM/canvas; combat state per `GameState` lives in a WeakMap
(`getCombat(state)`), positions and the counters moveCooldown / attackWindup / attackCooldown on
the engine's `Entity`.

# combat/ – PROG / Gameplay

Combat M0 + M1 rules behind config flags (design/mechaniki-m1.md v0.5). Full description: `/workspace/GRA/prog/walka-m0.md` (M0) and `/workspace/GRA/prog/walka-m1.md` (M1: enemies, tokens, skills, save v2, APIs).

| File | What |
|---|---|
| `combat.ts` | tick systems (`combatPlayerPhase`, `combatWorldPhase`), AI, blows, bump (§2.6), depth/armour (§2.11), 4 M1 enemies, attack tokens (§2.10), skills Dash / Shock Pulse / Buddy Drone (§2.5), evacuation tile `<` (§2.9), death, respawn, M0 regen, visuals-as-data; `getCombat`, `setCombatProfile`, `spawnEnemy`, `combatRng`, `getCombatHud`, `getCombatDeath`, `getBossChargeLane`, `isPlayerEvacuated`, `mapSpawn`, `takeAutoPauseRequest`, `setCombatReduceMotion` |
| `install.ts` | `installCombat()` – registers the systems ('player' + 'world'); imports `save.ts` |
| `save.ts` | save v3 section `combat` (`CombatSave` v2, migration v1→v2): serialize / deserialize (throws `SaveError`) / fresh / apply |
| `state.ts` | plain-data types (`CombatData`, `EnemyCombat`, events) |
| `grid.ts` | line of sight (Bresenham), melee reach, BFS first step |
| `timing.ts` | ms → ticks (`computeTicks`), fractional tick accumulator (`accumulateTicks`, §2.5) |
| `overlay.ts` | canvas overlay: floating numbers, `!` (ALERT grey / wind-up yellow), SIGNAL LOST (HP / kills / deaths: DOM HUD via `getCombatHud`) |

Numbers: `src/data/combat-m0.ts` (profiles `COMBAT_M0` / `COMBAT_M1`, `ENEMY_TYPES`; table 1.14 itself lives in `data/mechanics-m0.ts`).
Glyphs/colours: `src/data/style.ts` – `ENEMY_GLYPHS`, `ENEMY_SIGNALS` (LUZ / Pracownik 4) and the `COMBAT_STYLE` block (Gameplay).
Randomness: only `combatRng(state)` = `state.rng.stream('combat')`.

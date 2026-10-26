# Walka M1 – PROG / Gameplay (stan po rundzie 25.10.2026)

Źródła: `design/mechaniki-m1.md` **v0.5** (nadrzędna), `design/balans-m1.md` **v1.1**, `prog/sterowanie.md`. Kod: `prog/game/src/combat/`, liczby: `src/data/combat-m0.ts` (tabela 1.14 w `src/data/mechanics-m0.ts`). M0 opisuje `walka-m0.md`.

## 1. Profil i głębokość
- Profile `COMBAT_M0` (domyślny) i `COMBAT_M1` = M0 + `PLAYER_REGEN_PER_S 0`, `BUMP_ATTACK_ENABLED`, `SKILLS_ENABLED`, `ATTACK_TOKENS_ENABLED`, `ENEMY_RESPAWN_ENABLED false` (v0.5, Z5).
- `setCombatProfile(state, 'm0'|'m1', depth 1|2|3, { playerSpawn? })` – Silnik woła przy wejściu do strefy i zaraz po `gameFromSave`. Idempotentne, **bez losowań**. Przed pierwszym tickiem zapamiętuje opcje dla leniwej inicjalizacji. Wrogowie zachowują statystyki z chwili spawnu; mnożnik obrażeń głębokości działa od wywołania. Profil i głębokość **nie są** w CombatSave.

## 2. Wrogowie (§2.11, wartości głęb. 1; HP ×1/1,5/2,2, obrażenia ×1/1,25/1,5 round)
| Typ | Glif | HP | Obr. | Zapowiedź / odnow. | Ruch prosto / skos | Wykrycie | Uwagi |
|---|---|---|---|---|---|---|---|
| crawler (tylko M0) | c | 80 | M0 | 500 / 700 | 200 / 300 | 7 | szablon M0 |
| panelDrone | d | 40 | 8–12 | **450** / 600 | 200 / **300** | 8 | pary (alarm grupy) |
| curfewGuard | h | 120 | 14–20 | 600 / 900 | 250 / 400 [R] | 7 | |
| scrapper | s | 30 | 4–6 | **450** / 600 | 200 / 300 [R] | 7 | grupy (alarm grupy), **bez kradzieży łupu** (§2.8) |
| lineSentry | t | 70 | 10–15 | 700 / 1500 | nieruchomy | 7 | dystans 6 + LOS, strzał w zamrożone pole, żeton „strzał” |
- Reguła GD: zapowiedź − 1 tick ≥ 400 ms → `ENEMY_WINDUP_MIN_MS` 450 egzekwowane w `enemyTicks()` (niższa wartość z danych jest podnoszona), nie skraca się z głębokością. Test po wszystkich typach.
- Pancerz ma tylko gracz. Kolejność obrażeń: rzut → kryt ×1,5 (floor) → [Momentum ×1,5 floor] → ×głębokość (round) → pancerz floor, min 1.
- M1: brak odradzania (wrak zostaje, także po respawnie gracza).
- Kontrakty: `spawnEnemy(state, type, cell, { contract: true })` → `EnemyCombat.contract`, zdarzenie `enemyKilled.contract`. `CONTRACT_ENEMY_LOOT` = 0 w danych; łup losuje LUZ.
- Boss Rail Guardian: **tylko dane** (`RAIL_GUARDIAN` w combat-m0.ts), AI w następnej rundzie.

## 3. Żetony (§2.10)
Żeton = trwająca zapowiedź. Gracz: 2 wręcz + 1 strzał, drona: 2 dowolne; odstęp 150 ms na cel. Prośby z fazy AI sortowane po odległości, potem kolejności AI. Wróg bez żetonu obok gracza czeka (nie cofa się), dalszy podchodzi do odl. 2. `!` nad każdym wrogiem w zapowiedzi (overlay).

## 4. Umiejętności (§2.5; klawisze 1/2/3 lub K/L/; – `ActionState.skill1..3`)
- **Dash** (sk1): do 3 pól w jednym ticku, stop przed ścianą/aktorem, bez ścinania rogów; i-frames 200 ms; Momentum 1500 ms (+50% następnego ciosu); odnow. 4 s; ślad `·` 150 ms.
- **Shock Pulse** (sk2): zapowiedź 150 ms, promień 2 (Czebyszew) z LOS, 15–20 obr., przerywa zapowiedź (żeton wraca, pełne odnowienie), Shock 2 s: krok ×2 dłuższy [R], strzały drona ×2; odnow. 8 s.
- **Buddy Drone** (sk3, nazwa `BUDDY_DRONE_NAME`): zapowiedź 200 ms, pole obok gracza (`facing`, potem zgodnie z zegarem, nie na `<`), 40 HP, 8 s, strzał 5–7 co 500 ms zasięg 5 z LOS; mapa odległości r 6 (3/4) liczona raz; wrogowie w promieniu 4 z LOS celują w drona; odnow. 18 s. Brak wolnego pola → `skillFailed`, bez odnowienia.
- Bufor umiejętności 150 ms jak ATK. HUD: `getCombatHud(state).skills[]` + `.drone`.

## 5. Ewakuacja `<` (§2.9)
`<` (`EVAC_TILE`) jest ścianą dla wrogów, ich BFS i mapy drona; dron tam nie staje. Gracz na `<` (`isPlayerEvacuated`) jest nietykalny, wrogowie tracą cel (RETURN / wieżyczka IDLE), brak ataków i umiejętności. Otwieranie szybu i wyjście z poziomu: Silnik / LUZ.

## 6. DIAG_GRACE (§1.2 v0.5, Silnik)
Bump nie startuje z kierunku skośnego w oknie, w którym Silnik może zamienić krok prosty na skos (`inDiagGrace`). Zapowiedź wroga zostaje na zamrożonym polu sprzed zamiany → pudło. Testy w `tests/combat-m1-round.test.ts`.

## 7. CombatSave v2 (sekcja `combat`, migracja v1→v2)
Nowe: umiejętności gracza (`slots`, `skillCd`, `cast`, `skillQueue`, `prevSkill`, `iframes`, `momentum`), wróg `shock`, `contract`, `attack.target`, dron (pozycja, HP, czas życia, timer strzału; mapa odległości liczona od nowa), `tokenTick`, `recentHits`, `deathCause`. Usunięte: `profile`, `depth`. v1: domyślne „nic się nie dzieje”.
- QA-M0-003: test storage (writeSave → readSave → gameFromSave), także w SIGNAL LOST.
- QA-M0-004: punkt respawnu = `@` z definicji mapy (`mapSpawn`, dopasowanie TileMap do `MAPS`), nie pozycja z zapisu.

## 8. API dla FX / UI
- `getCombatDeath(state): DeathCause | null` (S12) – `{ killer: PlayerHitInfo | null, lastHits: PlayerHitInfo[] (≤3) }`, `PlayerHitInfo = { enemyType, enemyIndex, from, aim, dmg, tick }`; od ticku śmierci do respawnu, w zapisie. Też w zdarzeniu `playerDied.cause`.
- `getBossChargeLane(state): BossChargeLane | null` (S14) – `{ dir, cells (pola przed bossem, przejechane wypadają), phase: 'windup'|'charging', ticksLeft }`; na razie zawsze `null`.
- Zdarzenia (`getCombat(state).events`, co tick): `dash`, `shockPulse`, `telegraphInterrupted`, `droneDeployed`, `droneShot`, `droneHit`, `droneGone`, `skillUsed`, `skillFailed`, `playerDodged` + M0.

## Runda v0.5.2 + boss (25.10.2026, PROG / Gameplay)
- **v0.5.2:** Shock: kroki rozpoczęte w trakcie trwają ×`SHOCK_MOVE_MULT` (2), liczone akumulatorem (`ec.moveCarry`). Krok już trwający się nie zmienia. Wzór obrażeń: rzut → kryt. ×1,5 → Momentum → ×głęb. (tylko wrogowie) → jeden `round` → pancerz. Budzenie grupy: `spawnEnemy(..., { group })`, promień `ENEMY_GROUP_WAKE_RADIUS` 4, LOS, bez łańcucha. Cooldowny liczone od wciśnięcia (`SKILL_COOLDOWN_FROM` 'press'). `skillFailed` ('blocked' przy Dash bez ruchu, 'noCell' przy dronie) nie zużywa cooldownu (`SKILL_FAIL_REFUND`). Skos wroga liczony przez `enemyDiagMs(moveMs, tick)` = ceil(1,5×) do ticka: h 400, s/d 300, boss 450. `~` jest przechodnia i nie zadaje obrażeń.
- **Boss Rail Guardian** (`combat/boss.ts`, dane `RAIL_GUARDIAN`, arena `data/arena-m1.ts` = LD `ARENA_M1`): `spawnBoss(state, anchor, { arena })`. Zamach 3×3 800/1200 ms. Co 4. atak boss idzie na najbliższy tor `=`, potem zapowiedź 900 ms (cały tor), szarża pozioma w stronę kolumny gracza (przy remisie w stronę dalszej ściany), 2 ticki na pole, trafia raz. Ściana daje ogłuszenie 2 s i `R` ×2. Przy ≤ 50% HP jednorazowe przywołanie (600 ms) 2 Panel Drone z głęb. 3, ≥ 4 pola od gracza, aktywacja 500 ms. Boss zajmuje 1 żeton wręcz. Wyjście poza prostokąt areny wywołuje `resetBossArena` (pełne HP, drony znikają, przywołanie i licznik szarży od nowa), a powrót wysyła zdarzenie `bossArenaReenter { textId: 'M1_RISK_01B' }`. `getBossChargeLane` działa naprawdę (zapowiedź: cały tor, przejazd: pola przed bossem). HUD: `getCombatHud().boss`.
- **CombatSave v3** (migracja v2→v3): stan bossa, a u wrogów `group`/`moveCarry`/`depth`/`summoned`. Cel ataku gracza na część bossa jest zapisywany jako indeks n + część.
- [R] robocze: `BOSS_DETECT_RADIUS` 14. Shock Pulse rani bossa raz i bez Shock. Szarżę zatrzymaną przez inną postać kończy recovery bez ogłuszenia. Respawn gracza resetuje bossa. Zamach nie rani drona.
- Pominięte (cięcie zakresu): zdarzenia walki na busie i podpięcie FX. W kodzie są nieużywane haki `setCombatBus` / `installCombat(emit)` i `setCombatFxActive`, nic ich nie wywołuje.

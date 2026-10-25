# Wariant v0.6 twin-stick

Dział DESIGN / Mechaniki · 25.10.2026 · status: **wariant do wdrożenia** (kierunek zatwierdzony przez GD, liczby oznaczone [R] są robocze, do Balansu).
Baza: `design/mechaniki-m1.md` v0.5.2 (tego pliku ten wariant nie zmienia; scalenie do §1.3 / §2.5 / §2.6 / §2.16 po akceptacji GD).
Kod sprawdzony na: `/workspace/GRA/prog/game` HEAD `2963c22`, boss w `50674da`.

Konwencja w całym pliku: siatka komórek, **x w prawo, y w dół** (tak jak `DIRS8` w `src/combat/grid.ts:12`, „y grows downwards”). Dir8 = `{x,y}` z `x,y ∈ {-1,0,1}`. Tick = 50 ms. [R] = wartość robocza do strojenia.

## 1. Sterowanie (USTALONE)

**Telefon.** Lewa gałka = ruch (bez zmian: pływająca, martwa strefa 15%, 8 sektorów, histereza 10°, próg 25%). Prawa gałka = kierunek ataku: pływająca w prawej połowie ekranu, wychylenie poza martwą strefę **`AIM_DEADZONE` = 0,35** [R] = atak w tempie broni w kierunku gałki (Dir8, te same sektory i histereza co ruch). Puszczenie = koniec ataku (rozpoczęty zamach się kończy). Większa martwa strefa niż ruchu, bo wychylenie = strzał; drgnięcie kciuka nie może atakować.

**PC.** Ruch tylko WASD (`{KEY_MOVE}`). Celowanie `{KEY_AIM}` = strzałki albo mysz.
- **Strzałki:** 8 kierunków (dwie strzałki = skos, okno `DIAG_GRACE` jak przy ruchu). **Trzymanie strzałki = celowanie + atak** (jak prawa gałka).
- **Mysz:** samo wskazanie **tylko celuje** (kursor zawsze gdzieś jest, więc samo wskazanie nie może strzelać). **Atak = trzymanie LPM** albo Space / J (dotychczasowy ATK). Decyzja: LPM, nie samo wskazanie.
- **Kolizja mysz + strzałki: ostatnie użyte wejście wygrywa.** „Użycie” = wciśnięcie strzałki albo ruch myszy o ≥ 1 komórkę / klik. Dopóki strzałka jest trzymana i mysz się nie ruszyła, wygrywają strzałki. Po puszczeniu strzałek celuje mysz (jeśli jest nad canvasem). To zastępuje obecny priorytet „strzałki > mysz” (`digitalAim`).
- Brak celowania (gałka puszczona, brak myszy, brak strzałek) + ATK = cios w `facing` (jak dziś tap bez celu).

**Bump-attack usunięty:** `BUMP_ATTACK_ENABLED = false` także w profilu M1. **Wejście we wroga = stoisz** (krok się nie wykonuje, `facing` obraca się w stronę wroga, nie ma ciosu ani bufora bumpa). Zasada 3 z §2.6 („trzymanie kierunku na wroga = ciągły atak”) przestaje obowiązywać.

## 2. Issue Pole – zamach łukiem (USTALONE)

Broń startowa **Issue Pole** (nazwa zatwierdzona). Mk2 **Issue Pole II** (po odblokowaniu przystanku g2): **ten sam zasięg i kształt**, obrażenia **10–15** (słowo „longer” w opisie to tylko flavor, zasięg się nie zmienia).

- Zamach w kierunku celowania (Dir8), **zasięg 2** (Czebyszew), **zawsze 8 pól**, granica ±45° należy do łuku. Trafia **wszystkich** wrogów w obszarze (każdą encję raz: boss 3×2 w kilku polach łuku obrywa raz).
- Czasy [R]: **`SWING_WINDUP_MS` = 100** (2 ticki, blokuje krok, cios pada na końcu), **`SWING_CYCLE_MS` = 400** (start→start, czyli odnowienie 300 ms; 2,5 zamachu/s), **`SWING_FX_MS` = 150** (podświetlenie 8 pól łuku, niezależnie od trafień).
- Obrażenia [R]: Issue Pole **8–12** (jak obecne `PLAYER_DMG_MIN/MAX`), krytyk 10% ×1,5 → **26,25 DPS na 1 cel**, czyli tyle co obecne Issue. Przy 2 celach 52,5, przy 3 celach 78,75 DPS łącznie. Pole II 10–15 → ~32,8 DPS na cel (Balans v1.2).
- Momentum (po Dash) działa na **cały pierwszy zamach** (wszystkie trafione cele).

### 2.1 Tablice offsetów `ARC_OFFSETS` (dx, dy; y w dół)

Kolejność: najpierw 3 pola w odległości 1, potem 5 w odległości 2 (od lewej do prawej względem kierunku zamachu).

| Dir | d = 1 | d = 2 |
|---|---|---|
| N (0,-1) | (-1,-1) (0,-1) (1,-1) | (-2,-2) (-1,-2) (0,-2) (1,-2) (2,-2) |
| NE (1,-1) | (0,-1) (1,-1) (1,0) | (0,-2) (1,-2) (2,-2) (2,-1) (2,0) |
| E (1,0) | (1,-1) (1,0) (1,1) | (2,-2) (2,-1) (2,0) (2,1) (2,2) |
| SE (1,1) | (1,0) (1,1) (0,1) | (2,0) (2,1) (2,2) (1,2) (0,2) |
| S (0,1) | (1,1) (0,1) (-1,1) | (2,2) (1,2) (0,2) (-1,2) (-2,2) |
| SW (-1,1) | (0,1) (-1,1) (-1,0) | (0,2) (-1,2) (-2,2) (-2,1) (-2,0) |
| W (-1,0) | (-1,1) (-1,0) (-1,-1) | (-2,2) (-2,1) (-2,0) (-2,-1) (-2,-2) |
| NW (-1,-1) | (-1,0) (-1,-1) (0,-1) | (-2,0) (-2,-1) (-2,-2) (-1,-2) (0,-2) |

Kierunki proste: pełny bok kwadratu 5×5 + 3 pola przy graczu. Skosy: narożnik 3 pól + „L” 5 pól pierścienia 2. Obrót o 90° zgodnie z zegarem przy y w dół: `(x, y) → (-y, x)`; tabelę wpisz na sztywno (bez liczenia w runtime).

### 2.2 Ściany i rogi

Dla każdego pola łuku w kolejności z tabeli:
1. Pole-ściana (nieprzechodnie dla gracza) **nie obrywa** i blokuje swoich „dzieci”.
2. **Skos w odległości 1** (dx ≠ 0 i dy ≠ 0) jest odcięty, gdy **oba** pola ortogonalne `(dx,0)` i `(0,dy)` są ścianami (ta sama reguła co „bez ścinania rogów” przy ruchu).
3. Pole w odległości 2 obrywa tylko wtedy, gdy jego **rodzic** `(sign(dx), sign(dy))` jest przechodni **i** sam nie jest odcięty przez p. 2. Przykład E: (2,-1) i (2,-2) mają rodzica (1,-1); (2,0) ma (1,0); (2,1) i (2,2) mają (1,1).
4. Encje (wrogowie, dron, beczki) **nie blokują** łuku (to broń obszarowa). Buddy Drone nigdy nie obrywa od gracza.

Wynik `cells` w zdarzeniu = pola po odcięciu (FX rysuje tylko je), `hitIds` = trafione encje.

### 2.3 Zdarzenie

`playerSwing { entityId, dir: Dir8, cells: Cell[], hitIds: number[] }` – emitowane w ticku rozstrzygnięcia (koniec windup), także gdy `hitIds` jest puste. Po nim osobno `enemyHit` dla każdego trafionego (jak dziś). Konwencja pól zgodna z `fx_common.payloadConvention` (Assety).

## 3. Broń dystansowa (USTALONE: drugi typ broni)

Drugi **typ** broni w slocie `weapon`, nie zamiana Issue. Do zdobycia już na **głęb. 1** (drop z wroga / skrzyni albo półka automatu). Robocza nazwa typu: **Rail Pistol** (glif `/`, jak w balans-m1.md §3). Wymiana broni = wybór buildu: **wręcz = obszar i ryzyko**, **dystans = bezpieczeństwo i niższe DPS na cel**.

- Atak = **widoczny pocisk z lotem**, tor **Bresenham** od pola gracza do pola celu, maks. **`RANGED_RANGE` = 7** pól [R] (Czebyszew). Kierunek bez celu (brak auto-celu): punkt docelowy = gracz + Dir8 × 7.
- Pocisk zatrzymuje się na **ścianie** i na **rogu** (krok po skosie, gdy oba ortogonalne są ścianami) i **trafia pierwszego wroga** na torze (dowolne pole bryły bossa). Dron gracza jest przezroczysty.
- Prędkość [R]: **`RANGED_PROJ_MS_PER_CELL` = 100** (10 pól/s; 7 pól = 700 ms). Ruch pocisku w fazie po ruchu wrogów. Trafienie, gdy po ruchu pocisku wróg stoi w jego polu **albo** wróg wszedł w pole, w którym pocisk stoi (brak „przenikania” przy mijance).
- Czasy [R]: **`RANGED_WINDUP_MS` = 100**, **`RANGED_CYCLE_MS` = 500** (2 strzały/s). Na planszy naraz maks. `RANGED_MAX_PROJECTILES` = 3 pociski gracza.
- Obrażenia [R]: **8–12** dla ilvl 1 (krytyk jak wręcz) → **21 DPS na cel** = **80% Issue Pole na 1 cel** i znacznie mniej niż zamach przy ≥ 2 celach. Skalowanie ilvl/rzadkości: Balans (dawne wiersze Rail Pistol w §3 balansu do przeliczenia).
- Momentum: pierwszy **strzał** po Dash +50%.
- Zdarzenia: `projectileFired { entityId, projectileId, dir: Dir8, from: Cell, cells: Cell[] }` (cały przewidywany tor do ściany/zasięgu) i `projectileHit { entityId, projectileId, cell: Cell, hitId: number | null }` (`hitId = null` = ściana / koniec zasięgu). Glif pocisku gracza: nowy `playerProjectile` (np. `·`/`-`, kolor gracza, do GRAF), **nie** `projectile` wroga (`•`).

## 4. Auto-cel i opcja „Auto-aim”

**Pomoc w celowaniu (domyślnie włączona):** po ustaleniu kierunku Dir8 z wejścia szukamy wroga w stożku **`AIM_ASSIST_CONE_DEG` = ±22,5°** [R] wokół kierunku, w **zasięgu broni** (wręcz 2, dystans 7) i z linią wzroku. Wybór: najmniejsza odległość Czebyszewa, remis = mniejszy kąt do osi, potem kolejność zegarowa `DIRS8` (jak `pickTarget`).
- **Dystans:** pocisk leci Bresenhamem **do pola tego wroga** (nie wzdłuż Dir8). To jest główna korzyść: wrogowie poza 8 prostymi liniami są trafialni.
- **Wręcz:** łuk ±45° już pokrywa stożek, więc dla zamachu pomoc nic nie zmienia (kierunek zostaje z wejścia). Bez „przyciągania” do innego sektora.
- **Mysz:** jeśli pod kursorem stoi wróg w zasięgu i z linią wzroku, celem jest **dokładnie to pole** (pomoc pomijana).

**Opcja dostępności „Auto-aim”** (ustawienia, domyślnie wyłączona, `M1_SET_AUTOAIM`): prawa gałka niepotrzebna; **trzymanie ATK** = atak w najbliższego wroga w zasięgu broni z linią wzroku (wręcz: Dir8 w jego stronę, dystans: pocisk do jego pola). Brak wroga = cios/strzał w `facing`. Na telefonie przy Auto-aim wraca przycisk ATK w miejscu prawej gałki. Ręczne celowanie (gałka/strzałki/mysz) zawsze ma pierwszeństwo.

## 5. Kiting – kara za ruch w trakcie ataku

Problem: gracz robi krok co 150 ms (~6,7 pola/s), wróg co 200 ms (5 pól/s). Z niezależnym celowaniem dałoby się iść tyłem i strzelać bez końca.

Rozwiązanie [R]:
- **`KITE_MOVE_MULT` = 1,35**: każdy krok **rozpoczęty w trakcie cyklu ataku** (od startu windup do końca odnowienia) trwa ×1,35 (prosto 150 → 202,5 ms, skos 200 → 270 ms), przez istniejący akumulator ułamków ticka (`ACTION_TICK_ACCUMULATOR`, tak jak Shock). Przy ciągłym ataku gracz jest więc **wolniejszy od wroga** (202,5 vs 200 ms) i nie ucieknie, strzelając.
- Dla broni dystansowej **`RANGED_KITE_MOVE_MULT` = 1,5** (225 ms): strzelec traci dystans ok. 0,5 pola na każde 2 s ucieczki.
- Shock i kara mnożą się (krok ×2 × 1,35 tylko w Shocku gracza, jeśli kiedyś powstanie; wrogów kara nie dotyczy).
- Ucieczka bez ataku zostaje możliwa (zasada spójności §1.14: `ENEMY_MOVE_MS` > `PLAYER_MOVE_MS`). Dash nie podlega karze.
- Opcja zapasowa, domyślnie **wyłączona**: `ENEMY_CHASE_HASTE_MULT` = 0,85 (krok wroga ×0,85 po 3 s nieprzerwanego CHASE bez kontaktu). Włączyć tylko, jeśli pomiar QA pokaże kiting mimo kary.

Żetony ataku (§2.10): **`TOKEN_WAIT_DIST` 2 → 3** [R], bo czekający wróg w odległości 2 stałby w zasięgu łuku i obrywał za darmo. Wróg bez żetonu trafiony przez gracza **dostaje żeton jako pierwszy w kolejce** (`TOKEN_PRIORITY_ON_HIT` = true), więc ostrzeliwanie czekających z dystansu ściąga ich na gracza. Limit 2 wręcz + 1 strzelec bez zmian.

## 6. Reguła zapowiedzi ≥ 450 ms (sprawdzenie)

Reguła zostaje bez zmian (`ENEMY_WINDUP_MIN_MS` = 450). Sprawdzone elementy wariantu:
- Łuk, pociski gracza, auto-cel: nie skracają żadnej zapowiedzi wroga. OK.
- Boss: szarża 900 ms, drony 450 ms – bez zmian. OK.
- **Ryzyko:** przy ciągłym ataku gracz jest prawie zawsze w windup (100 ms blokuje krok). Najgorszy przypadek: zapowiedź 450 − 50 ms (tick) − 100 ms (windup) = **300 ms** okna na reakcję. Tak było też przy dotychczasowym ATK, ale twin-stick zachęca do ataku non stop. Decyzja: **krok wciśnięty w trakcie windup jest buforowany i wykonuje się w ticku rozstrzygnięcia ciosu** (krok zmienia pozycję od razu na starcie, §1.2), a **Dash przerywa windup** (zamach przepada bez odnowienia). Kara `KITE_MOVE_MULT` wydłuża tylko **następny** krok, nie pierwszy unik. QA A4: zmierzyć udział uników przy ciągłym ataku; jeśli < 50% przy 450 ms, ustawić `SWING_WINDUP_BLOCKS_MOVE` = false.

## 7. Umiejętności

- **Dash:** kierunek = **gałka ruchu**; bez ruchu = **kierunek celowania**; bez obu = `facing`. Reszta bez zmian (do 3 pól, nietykalność 200 ms, `skillFailed` przy 0 pól bez odnowienia). Dash przerywa windup (p. 6).
- **Momentum:** +50% dla **pierwszego zamachu** (wszystkie cele łuku) **albo pierwszego strzału** w ciągu 1,5 s po Dash. Zużywa się przy rozstrzygnięciu (zamach) / wystrzale (pocisk niesie flagę).
- **Shock Pulse:** bez zmian.
- **Buddy Drone:** bez zmian; ×2 na Shock nie działa na bossa (boss nie dostaje Shock).

## 8. Boss Rail Guardian – odpowiedzi dla Gameplay (POTWIERDZONE)

1. Wykrywanie gracza w promieniu **14**.
2. **Shock Pulse** rani bossa **raz** (15–20) i **nie nakłada** Shock (więc nie ma ×2 drona ani spowolnienia).
3. Szarża zatrzymana przez wroga (np. własnego drona bossa na torze) **kończy się bez ogłuszenia**.
4. **Buddy Drone** nie jest przeszkodą dla szarży (szarża przez niego przejeżdża) ani celem zamachu bossa.
5. **Respawn gracza resetuje bossa:** pełne HP, przywołane drony znikają, przywołanie znów dostępne.
6. **Kierunek szarży** jest blokowany w chwili, gdy boss staje na torze (start zapowiedzi 900 ms), w stronę **kolumny gracza**; przy remisie (gracz w kolumnie bossa) w stronę **dalszej ściany**.
7. Nowe w v0.6: łuk trafia bossa **raz na zamach** niezależnie od liczby pól bryły w łuku; pocisk trafia dowolne pole bryły.
8. Walka 60–90 s dla **obu typów broni**: przelicza Balans (p. 13). Do czasu przeliczenia `BOSS_HP` = 2400 bez zmian.

## 9. Wdrożenie w kodzie (najważniejsze)

Sprawdzone `rg` w `/workspace/GRA/prog/game/src` (HEAD `2963c22`). Numery linii z HEAD.

### 9.1 Co już jest

| Symbol | Gdzie | Stan |
|---|---|---|
| `ActionState.aim: Dir8 \| null` | `src/input/actions.ts:19` (+ `digitalAim` l.27) | **jest** (uwaga: pole jest w `actions.ts`, nie w `aim.ts`; nazwa `actions.aim` = `ActionState.aim`) |
| scalanie celowania, priorytet strzałek | `src/input/actions.ts:141` (`aimHold`), l.152–154 (`keyAim ??=` / `otherAim ??=`), `aimOf()` l.178, `out.aim` l.245–246 | jest; **zmienić** na „ostatnie użyte wygrywa” |
| `aimTowards()`, `MouseAimSource`, `AimStickSource`, `aimStick`, `setAimStick()` | `src/input/aim.ts:21 / 28 / 59 / 86 / 89` | jest; martwa strefa gałki = `M0.MOVE_DEADZONE` (l.75) → zmienić na `AIM_DEADZONE` |
| strzałki = aim | `src/input/keyboard.ts:14–18`, `:148–151` | jest |
| podpięcie źródeł | `src/main.ts:9`, `:111–113` | jest |
| druga gałka w UI | `src/ui/touch-controls.ts` (`createTouchControls`, l.63) | **brak**: `setAimStick` nie jest nigdzie wołane z `ui/` |
| `BUMP_ATTACK_ENABLED` | `src/data/combat-m0.ts:19` (`COMBAT_EXTRAS`, false) i **`:105` (`COMBAT_M1`, true)** | jest; ustawić `false` w l.105 |
| wywołanie bumpa | `src/combat/combat.ts:603–604` (`combatPlayerPhase`), `bumpAttack()` l.662 | jest; po fladze martwe, później usunąć |
| logika celu | `src/combat/combat.ts:613–624` (`queued ?? pickTarget`, tap bez celu → `facing`), `pickTarget()` l.733 (zasięg `PLAYER_ATK_RANGE`, klucz: odległość, `facing`, kąt zegarowy) | jest; **zastąpić** celowaniem + auto-celem |
| start / rozstrzygnięcie ciosu | `startPlayerAttack()` l.628, `playerAttackTicks()` l.643, `resolvePlayerBlow()` ~l.1435 (Momentum l.1443–1444), `damageHostile()` l.707 | jest; jeden cel → łuk |
| Dash / Momentum | `dashPath()` l.845, `dash()` l.859 (`pc.momentum` l.870); `SK1_MOMENTUM_*` `src/data/combat-m0.ts:48–49` | jest |
| wzór obrażeń | `computeDamage()` `src/combat/combat.ts:310` | jest, bez zmian |
| liczby gracza | `src/data/mechanics-m0.ts:21–29` (`PLAYER_MOVE_MS`, `PLAYER_ATK_RANGE/WINDUP/COOLDOWN`, `PLAYER_DMG_MIN/MAX`, `PLAYER_CRIT_CHANCE`), `MOVE_DEADZONE` l.45 | jest |
| `DIRS8` (y w dół) | `src/combat/grid.ts:12` | jest |
| zapis ataku | `src/combat/save.ts:69–72, 99` (`attack {target, aim}`, kolejka bumpa) | jest; CombatSave v3 |
| FX | `src/render/fx-layer.ts` (zdarzenia wroga), `src/data/fx-m1.ts:1362` (już wymienia `playerSwing`) | częściowo |
| glif pocisku | `src/data/style.ts:501` (`projectile` = wróg `•`) | brak glifu gracza |
| broń w ekwipunku | `src/data/inventory-m1.ts:99` `ISSUE_BATON_ITEM_ID`, l.176 `nameId: 'M1_GEAR_ISSUE_BATON'` (stare ID), `gearDef('weapon')` l.196 | **brak typu broni** (melee/ranged); brak broni dystansowej w kodzie |

### 9.2 Kolejność kroków

1. **Stałe** (p. 9.3) w `src/data/combat-m0.ts` (`COMBAT_EXTRAS`), `ARC_OFFSETS` jako tablica 8 × 8 indeksowana kolejnością `DIRS8` (N, NE, E, SE, S, SW, W, NW). `COMBAT_M1.BUMP_ATTACK_ENABLED = false` (l.105).
2. **Wejście:** `AimStickSource.poll()` → `toDir8(vec, AIM_DEADZONE)`; w `InputManager` zamienić priorytet `keyAim ??` na znacznik czasu ostatniego użycia (`lastAimSource: 'keys' | 'mouse' | 'stick'`, aktualizowany przy wciśnięciu strzałki / ruchu myszy o ≥ 1 komórkę / kliknięciu / wychyleniu gałki). Dodać `ActionState.aimCell?: Cell` (mysz: pole pod kursorem) i `ActionState.aimFire: boolean` (gałka poza strefą albo strzałka trzymana = atak). LPM → `attack` w `MouseAimSource` (`pointerdown`/`pointerup`, `button === 0`).
3. **`combatPlayerPhase`** (l.563): usunąć gałąź bump (l.603–604) spod flagi; krok we wroga: engine nie wykonuje kroku, ustawia tylko `facing`. Atak gdy `actions.attack || actions.aimFire`; kierunek = `actions.aim ?? autoAim ?? p.facing`.
4. **Zamach:** nowa `arcCells(map, from, dir): Cell[]` w `src/combat/grid.ts` (reguły p. 2.2) i `resolveSwing()` zamiast jednocelowego `resolvePlayerBlow()`: dla każdej encji wroga (dedupe po id) w `arcCells` → `computeDamage` (Momentum raz na zamach) → `damageHostile`. Emit `playerSwing`. `PLAYER_ATK_RANGE` = 2 tylko dla łuku (Pulse/dron go nie używają).
5. **Typ broni:** w `src/data/inventory-m1.ts` pole `weaponType: 'melee' | 'ranged'` w definicji broni (Issue = melee; przy okazji ID `ISSUE_BATON` → `ISSUE_POLE` wg tekstów Lore); `combat` czyta typ z założonej broni.
6. **Pociski:** `src/combat/projectiles.ts` (nowy): `PlayerProjectile { id, cells (Bresenham do ściany/zasięgu), idx, momentum, dmgRoll }`, krok co `RANGED_PROJ_MS_PER_CELL`, faza po ruchu wrogów, reguła mijanki z p. 3. Zdarzenia `projectileFired` / `projectileHit`. Bresenham z odcinaniem rogów: użyć istniejącej funkcji linii wzroku z `grid.ts`, jeśli liczy pola; inaczej dodać `bresenham(from, to)`.
7. **Auto-cel:** `pickAimTarget(state, c, dir, range)` obok `pickTarget()` (l.733), stożek `AIM_ASSIST_CONE_DEG`; `pickTarget` zostaje dla trybu „Auto-aim”, z zasięgiem broni zamiast `PLAYER_ATK_RANGE`.
8. **Kiting:** w miejscu, gdzie engine liczy czas kroku gracza (`src/core/game.ts:123`, `toDir8(actions.move)`) mnożnik `KITE_MOVE_MULT`/`RANGED_KITE_MOVE_MULT`, gdy `attackWindup > 0 || attackCooldown > 0`; przez akumulator ułamków ticka. Bufor kroku w windup (p. 6).
9. **Dash:** kierunek `move ?? aim ?? facing`; Dash kasuje `pc.attack` i `attackWindup` (bez odnowienia).
10. **Żetony:** `TOKEN_WAIT_DIST` = 3, `TOKEN_PRIORITY_ON_HIT`.
11. **Boss** (`src/combat/boss.ts`): punkty 8.1–8.7 (dedupe trafień, Pulse raz bez Shock itd.).
12. **Zapis:** pociski gracza **nie są zapisywane** (zapis między ticki gubi lecące pociski); `attack` w `save.ts` dostaje `dir` zamiast `target`. Podbić CombatSave v3 → v4 z migracją (`target` → `dir` z `aim`).
13. **UI:** druga gałka + ustawienie Auto-aim (p. 15), `setAimStick()` z `touch-controls.ts`.
14. **FX:** `playerSwing` (8 pól, 150 ms), pocisk gracza, `projectileHit`.

### 9.3 Nowe i zmienione stałe

| Stała | Wartość | Plik | Uwagi |
|---|---|---|---|
| `BUMP_ATTACK_ENABLED` | **false** (M0 i M1) | combat-m0.ts:19, :105 | USTALONE |
| `ARC_OFFSETS` | tabela p. 2.1 | combat-m0.ts | 8 × 8 pól, kolejność `DIRS8` |
| `SWING_RANGE` | 2 | combat-m0.ts | zastępuje `PLAYER_ATK_RANGE` 1 dla łuku |
| `SWING_WINDUP_MS` | 100 [R] | | = obecne `PLAYER_ATK_WINDUP_MS` |
| `SWING_CYCLE_MS` | 400 [R] | | odnowienie = 300 |
| `SWING_FX_MS` | 150 [R] | fx | |
| `SWING_WINDUP_BLOCKS_MOVE` | true [R] | | false, jeśli QA A4 < 50% uników |
| `ISSUE_POLE_DMG` / `_2_DMG` | 8–12 / 10–15 [R] | inventory/balans | |
| `AIM_DEADZONE` | 0,35 [R] | mechanics-m0.ts | gałka celowania |
| `AIM_ASSIST_CONE_DEG` | 22,5 [R] | | ± od osi Dir8 |
| `AIM_ASSIST_ENABLED` | true | | |
| `AUTO_AIM_DEFAULT` | false | ui/settings.ts | opcja dostępności |
| `RANGED_RANGE` | 7 [R] | | 6–8 |
| `RANGED_PROJ_MS_PER_CELL` | 100 [R] | | 10 pól/s |
| `RANGED_WINDUP_MS` | 100 [R] | | |
| `RANGED_CYCLE_MS` | 500 [R] | | 2 strzały/s |
| `RANGED_DMG` (ilvl 1) | 8–12 [R] | | 21 DPS na cel |
| `RANGED_MAX_PROJECTILES` | 3 | | |
| `KITE_MOVE_MULT` | 1,35 [R] | | wręcz |
| `RANGED_KITE_MOVE_MULT` | 1,5 [R] | | dystans |
| `ENEMY_CHASE_HASTE_MULT` | 0,85, **wyłączone** [R] | | zapas |
| `TOKEN_WAIT_DIST` | 2 → **3** [R] | combat-m0.ts:40 | |
| `TOKEN_PRIORITY_ON_HIT` | true [R] | | |

### 9.4 Kryteria akceptacji (ręcznie)

1. Telefon: prawa gałka wychylona > 35% → zamach co 400 ms w jej kierunku; puszczona → brak nowych zamachów. Lewa gałka rusza niezależnie.
2. PC: WASD rusza, strzałki nie ruszają; trzymanie strzałki = ciągły zamach; dwie strzałki = skos.
3. PC: mysz nad mapą obraca celowanie bez ataku; LPM/Space trzymane = atak w stronę kursora. Strzałka po ruchu myszy przejmuje celowanie, ruch myszy o ≥ 1 pole oddaje je myszy.
4. Wejście we wroga: gracz stoi, nie zadaje obrażeń (log/float bez `-N`).
5. Zamach E na pustej sali: podświetla dokładnie 8 pól z tabeli przez ~150 ms; dla każdego z 8 kierunków kształt zgodny z p. 2.1.
6. Ściany: wróg za ścianą (pole d = 1 ściana, wróg na jego „dziecku” w d = 2) nie obrywa; skos przy dwóch ścianach ortogonalnych nie obrywa.
7. Trzech Scrapperów w łuku → wszyscy obrywają jednym zamachem; boss w 2 polach łuku obrywa raz.
8. Broń dystansowa: pocisk widocznie leci pole po polu (~10 pól/s), staje na ścianie i na rogu, trafia pierwszego wroga, nie trafia za 7. polem.
9. Pomoc w celowaniu: wróg w (5, 2) od gracza przy celowaniu E zostaje trafiony pociskiem; przy celowaniu N nie.
10. Kiting: ciągły atak + ucieczka od Scrappera w CHASE → wróg dogania (dystans nie rośnie). Bez ataku gracz ucieka.
11. Dash bez ruchu leci w kierunku celowania; pierwszy zamach po Dash pokazuje obrażenia ×1,5 na wszystkich trafionych.
12. Boss: Shock Pulse rani raz i nie spowalnia; Buddy Drone na torze szarży nie zatrzymuje jej; śmierć gracza → boss z pełnym HP i bez dronów.

## 10. Lista zmian (v0.5.2 → v0.6)

1. Twin-stick: prawa gałka / strzałki / mysz = kierunek ataku, niezależny od ruchu; ruch na PC tylko WASD.
2. Bump-attack usunięty (`BUMP_ATTACK_ENABLED` = false), wejście we wroga = stoisz.
3. Issue Pole: zamach łukiem 8 pól, zasięg 2, trafia wszystkich; cykl 400 ms, 8–12 (Pole II 10–15).
4. Reguły ściany/rogu dla łuku (rodzic d = 1, odcięcie skosu).
5. Nowy typ broni: dystansowa z widocznym pociskiem (7 pól, 10 pól/s, 2 strzały/s, ~21 DPS), dostępna od głęb. 1.
6. Pomoc w celowaniu ±22,5° (dla pocisków) + opcja dostępności Auto-aim.
7. Kara za kiting: krok ×1,35 (wręcz) / ×1,5 (dystans) w trakcie cyklu ataku.
8. Żetony: czekanie w odległości 3, trafiony wróg dostaje żeton pierwszy.
9. Krok buforowany w windup, Dash przerywa windup; reguła 450 ms bez zmian.
10. Dash: kierunek ruchu, w zastępstwie kierunek celowania; Momentum na cały zamach / pierwszy strzał.
11. Boss: 6 odpowiedzi dla Gameplay potwierdzone + jedno trafienie na zamach.
12. Nowe zdarzenia: `playerSwing`, `projectileFired`, `projectileHit`.

## 11. Do Balansu

- Przeliczyć **obie bronie** pod bossa 60–90 s (zamach trafia bossa raz, więc wręcz na bossie = 26,25 DPS bazowo; dystans 21 DPS, ale większy udział bicia, bo bezpieczniej). Czy `BOSS_HP` 2400 zostaje dla obu?
- Poziomy g1–g3: zamach obszarowy zwiększa DPS na grupy (2–3 cele) → strata HP na poziom (82/188/285) i czas czyszczenia spadną; ewentualnie HP grup / `DEPTH_HP_MULT`.
- Skalowanie broni dystansowej (ilvl, rzadkość, afiksy) i jej udział w dropach i na półce g1.
- `KITE_MOVE_MULT` 1,35 / 1,5 i `TOKEN_WAIT_DIST` 3: model ucieczki ze strzelaniem.
- Czy Pole II 10–15 nie jest za mocne przy obszarze (DPS grupowy ~65–98).

## 12. Do UI (568 × 320, tryb kompaktowy ≤ 360 px)

- Lewa połowa: gałka ruchu bez zmian. **Prawa połowa: pływająca gałka celowania** (promień 48 px w kompakcie, 60 px normalnie, gałka 40 px), pojawia się pod kciukiem, wychylenie → `setAimStick({x,y})`, puszczenie → `setAimStick(null)`. Pierścień pokazuje martwą strefę 35%.
- **Przyciski umiejętności** DASH / PULSE / DRONE: łuk nad strefą prawej gałki, przy prawej krawędzi, 48 px (min. dotyk), odstęp 8 px, margines 16 px + safe-area. Szkic:
  ```
  |[||]                                         [DASH] |
  |                                       [PULSE]      |
  |                                [DRONE]             |
  |   ( (o) ) ruch                      ( (+) ) cel    |
  ```
  Dotyk w strefę przycisku nie startuje gałki celowania (przyciski mają pierwszeństwo, śledzenie po `pointerId`).
- Przycisk ATK znika; wraca tylko przy włączonym **Auto-aim** (w miejscu gałki celowania).
- Na mapie: linia/znacznik celowania (8 kierunków) przy graczu, gdy celowanie aktywne; FX łuku 150 ms.
- Ustawienie `M1_SET_AUTOAIM` „Auto-aim” w menu pauzy; tekst podpowiedzi sterowania PC w `src/data/strings.ts:20` już mówi „Arrows / mouse: aim”, dopisać „LMB: attack”.
- ui-m1.md: zostaje zgłoszona przez QA poprawka „Enter = GO DOWN” (R29).

## 13. Otwarte

1. Liczby [R] całego wariantu – Balans (p. 11), potem pomiar QA (A4 uniki przy ciągłym ataku, D7 boss, kiting).
2. `SWING_WINDUP_BLOCKS_MOVE` true/false – po pomiarze QA A4.
3. Nazwa i glif broni dystansowej oraz pocisku gracza – Lore / GRAF (roboczo Rail Pistol, `/`).
4. Czy LPM ma też działać jako „przytrzymaj = auto-ogień” bez ruchu myszy (dziś: tak) – potwierdzenie UI.
5. `ENEMY_CHASE_HASTE_MULT` – włączyć tylko po pomiarze.
6. Samouczek (T03–T05 o ataku) i teksty walki – Lore po v0.6.
7. Scalenie wariantu do `mechaniki-m1.md` (§1.3, §2.5, §2.6, §2.10, §2.16) po akceptacji GD.

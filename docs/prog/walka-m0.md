# Walka M0 (+ reguły M1 za flagami) – PROG / Gameplay (25.10.2026, runda v0.4)

Status: **ZROBIONE lokalnie** (bez repo, bez push, bez deployu). Spec: `design/mechaniki-m1.md` **v0.4** (część 1 + wybrane punkty części 2) i `graf/styl-ascii.md` §9 v1.1.
Kod: `/workspace/GRA/prog/game` (szkielet PROG / Silnik: TS + Vite, tick 50 ms).
Zrzut `prog/walka-m0-screenshot.png` jest z rundy v0.2 (jeszcze z `C`) – telegraf wygląda teraz inaczej (§0).

## 0. Zmiany w rundzie v0.4 (25.10.2026, ok. 21:10 czasu polskiego)
| Co | Jak | Testy |
|---|---|---|
| Telegraf (1.7, GRAF §9) | zamiast `c`→`C`: **jeden glif** wroga w **odwróconej komórce** (tło magenta, glif w kolorze tła), **żółty `!`** nad wrogiem przez całą zapowiedź (szary `!` = ALERT), pole celu = **`x` magenta na ciemnej magencie `#4A1240`**, miga 100 ms / 50 ms w ostatnich 150 ms; „Reduce motion” → `x` stałe (`setCombatReduceMotion()` dla UI). Glify i kolory z `ENEMY_GLYPHS` / `ENEMY_SIGNALS` w `style.ts` (Pracownik 4), błysk trafienia (biały) w `COMBAT_STYLE` | `combat-m1.test.ts` › telegraph look |
| `ARENA_SIZE` | `ARENA_COLS` 40 / `ARENA_ROWS` 20 w `data/combat-m0.ts`; test sprawdza, że `ARENA_M0` ma ten rozmiar | config |
| `MAX_STEPS_PER_FRAME` | **stała Silnika, wartość 5** (= do 250 ms nadrabiania na klatkę), w `data/mechanics-m0.ts`, używana tylko przez pętlę w `main.ts`. Walka jej nie czyta (dostaje pojedyncze ticki), więc nie przenoszę | – |
| Numeracja punktów | komentarze w `combat/*` i `data/combat-m0.ts` sprawdzone pod v0.4 (1.1–1.17, 2.5, 2.6, 2.11, 2.13, 2.16) | – |
| „Hunter 47” | `hunterName(n)` usunięte, stała `COMBAT_STRINGS.hunterTitle = 'HUNTER 47'` | config |
| Profile | `COMBAT_M0` (domyślny) i `COMBAT_M1` = M0 + nadpisania z 2.16 (`BUMP_ATTACK_ENABLED: true`, `PLAYER_REGEN_PER_S: 0`); wybór przez `getCombat(state, { cfg })` | config |
| Bump attack (2.6) | krok na wroga = atak na **tego** wroga (nadpisuje autocel i trzymany ATK), bez `moveCooldown`, `facing` = kierunek; w odnowieniu stoi, bump w ostatnich 150 ms idzie do bufora ATK (z własnym celem); trzymanie kierunku = ciągły atak w tempie broni; skos przez róg nie atakuje. Rozstrzygany w fazie gracza przed `tryStep` (zgodnie z 2.10). M0: wyłączony | bump attack (7 testów) |
| Brak regeneracji (2.13) | profil M1 ma `PLAYER_REGEN_PER_S` = 0; w M0 regen zostaje jako pomoc testowa (1.4) | no regeneration |
| Panel Drone (2.11 `d`) | to **typ wroga** (szybki, wręcz, w parach): 40 HP, 8–12, zapowiedź 400 / odnowienie 600 ms, **ruch 200 ms**, wykrycie 8. `ENEMY_TYPES.panelDrone`, `spawnEnemy(state, 'panelDrone', cell)`. Skos 300 ms – założenie (×1,5 jak M0), pytanie do Mechaniki | Panel Drone |
| Mnożniki głębokości (2.11) | `DEPTH_HP_MULT` [1; 1,5; 2,2], `DEPTH_DMG_MULT` [1; 1,25; 1,5]; HP = round(baza × mnożnik), obrażenia = round(rzut × mnożnik); boss (`ignoresDepth`) ×1; głębokość: `getCombat(state, { depth })` | depth multipliers |
| Pancerz (2.11) | `DR = A/(A+100)`, max 60%, po redukcji w dół, min 1 (`ARMOR_DR_K`, `ARMOR_DR_CAP`, `ARMOR_MIN_DMG`); kolejność: rzut → głębokość → pancerz | armour |
| Akumulator ułamków ticka (2.5) | `timing.accumulateTicks(ms, tick, carry)`: `exact = ms/50 + carry; ticki = max(1, round(exact)); carry = exact − ticki` (|carry| ≤ 0,5). Gracz: `attackTimeMod` / `moveTimeMod` (−0,10 = −10%), osobny carry dla ataku (przygotowanie + odnowienie) i ruchu. Flaga `ACTION_TICK_ACCUMULATOR` | −10% z 400 ms = dokładnie 7,2 ticka średnio (1000 akcji = 7200), w pętli gry 7,2 ±0,02; ruch 150 ms −10% = 2,7 ticka |
| RNG (Silnik) | wszystkie losowania walki przez `combatRng(state)` = `state.rng.stream('combat')`; walka nie ma własnego `Rng` | combat RNG |
| Zapis (save v3) | sekcja `combat` w `combat/save.ts` (rejestrowana przy imporcie przez `install.ts`) – §6a | `combat-save.test.ts` (6 testów, prawdziwy save/load Silnika) |


## 1. Co działa
- **Wróg Scrap Crawler** (`c`) w miejscu markera `E` na mapie (silnik tworzy tam „dummy”, walka zamienia go w Crawlera przy pierwszym ticku).
- **AI wg 1.6:** IDLE (wędrówka co 2–4 s, maks. 3 pola od spawnu) → wykrycie 7 pól + linia wzroku (Bresenham) → ALERT 300 ms (`!` nad wrogiem) → CHASE (BFS 8 kierunków, bez ścinania rogów, promień 20, liczony przy każdym kroku, pamięta ostatnią widzianą pozycję) → ATTACK (zamrożone pole celu, zapowiedź 500 ms, cios w to pole, 700 ms odnowienia w miejscu) → RETURN (dystans > 12 albo 3 s bez linii wzroku; 1 s „głuchy”; na spawnie pełne HP) → IDLE. Obrażenia budzą wroga od razu (CHASE).
- **Atak gracza wg 1.3:** zasięg 1 (8 sąsiadów, nie przez róg ściany), automatyczny cel (najbliższy → w kierunku `facing` → zgodnie z zegarem od północy), cel zamrażany na start. Przygotowanie 100 ms (blokuje ruch), odnowienie 300 ms → 2,5 ciosu/s. Obrażenia 8–12, kryt. 10% ×1,5 (w dół). Trzymanie ATK = autoatak tylko z celem; tap bez celu = cios w `facing` (pudło, jeśli pusto). Bufor ATK w ostatnich 150 ms odnowienia.
- **HP i obrażenia:** gracz 100, wróg 80; wróg 12–18 na cios. Remis w ticku: najpierw cios gracza, wróg zabity w tym ticku nie uderza.
- **Śmierć wroga (1.9):** encja wroga staje się wrakiem `%` (przechodni), `+1 kill`; respawn po 5 s na spawnie, tylko gdy gracz ≥ 8 pól od spawnu; wrak znika.
- **Śmierć gracza (1.8):** zatrzymanie świata 0,5 s → `HUNTER 47 – SIGNAL LOST / Reprinting…` 3 s → start z pełnym HP, wróg zresetowany (pełne HP, IDLE), zwłoki `%` w miejscu śmierci (tylko ostatnie). Postać to zawsze „Hunter 47” (GD). Liczniki zabójstw/śmierci w małym panelu debug.
- **Telegraf (1.7, GRAF §9):** glif wroga w odwróconej komórce + żółty `!` nad nim; zamrożone pole `x` na ciemnej magencie; gdy gracz na nim stoi, glif gracza miga z `x` co 100 ms, w ostatnich 150 ms co 50 ms; po zejściu `x` zostaje do końca zapowiedzi. Moment ciosu `*` 100 ms. Trafiony wróg miga odwrócony 100 ms, trafiony gracz – aureola w kolorze wroga. Liczby `-11` / krytyk `-16!` / `miss` unoszą się 600 ms.
- **Regeneracja (tylko profil M0):** 5 HP/s po 5 s bez zadania/otrzymania obrażeń i gdy żaden wróg nie jest w CHASE/ATTACK (całkowite HP, akumulator).
- **Auto-pauza D:** cios w gracza przy ≥ 2 s bez wejścia → `main.ts` wywołuje istniejące `autoPause()` (pauza + reset wejścia + zapis). A, B, C, E i odliczanie 3·2·1 robi Silnik.
- **Tymczasowy HUD:** linia `HP [########--] 80/100` (kolor zielony/żółty/czerwony) na canvasie w lewym górnym rogu – do zastąpienia HUD-em UI (`getCombatHud()`, opcja `fallbackHud: false`).

## 2. Pliki
Nowe (moje):
| Plik | Zawartość |
|---|---|
| `src/data/combat-m0.ts` | **jedyny punkt importu liczb walki**: rozkłada całą tabelę 1.14 z `data/mechanics-m0.ts` (Silnik trzyma ją tam jednym miejscu) + `COMBAT_EXTRAS` (liczby z prozy specu, których nie ma w 1.14) + robocze teksty EN |
| `src/combat/combat.ts` | systemy ticka (`combatPlayerPhase`, `combatWorldPhase`), AI, ciosy, śmierć, respawn, regen, wizualizacja jako dane; `getCombat`, `pickTarget`, `getCombatHud`, `takeAutoPauseRequest` |
| `src/combat/install.ts` | `installCombat()` – rejestruje systemy w fazach `'player'` i `'world'` |
| `src/combat/state.ts` | typy danych (czyste dane, JSON-owalne) |
| `src/combat/grid.ts` | linia wzroku, zasięg wręcz (zasada rogów z `world/collision.canStep`), BFS |
| `src/combat/timing.ts` | ms → ticki (`round`, min 1; 0 = wyłączone), akumulator ułamków ticka |
| `src/combat/save.ts` | sekcja zapisu `combat` (`CombatSave` v1) |
| `src/combat/overlay.ts` | nakładka canvas: liczby, `!`, `miss`, ekran SIGNAL LOST, tymczasowy HUD |
| `src/combat/README.md` | opis modułu (zastąpił pusty placeholder) |
| `tests/combat.test.ts` | 23 testy M0 |
| `tests/combat-m1.test.ts` | 25 testów rundy v0.4 |
| `tests/combat-save.test.ts` | 6 testów zapisu |

Zmiany w cudzych plikach (minimalne, dopisane, nic nie usunięte):
- `src/data/style.ts` (Silnik/GRAF/Pracownik 4): ruszam **tylko blok `COMBAT_STYLE`** (+ funkcje `combatEnemyGlyph`, `combatEnemyTelegraphGlyph`, `combatEnemyFlashGlyph` w tym bloku). Glify wrogów i kolory telegrafu biorę z `ENEMY_GLYPHS` / `ENEMY_SIGNALS` (Pracownik 4); są zadeklarowane niżej w pliku, więc czytam je leniwie (gettery/funkcje), bez TDZ.
- `src/main.ts` (Silnik, bez zmian w tej rundzie): 3 importy, `installCombat()`, po `stepGame` jedna linia z wyzwalaczem D, w `render` dodane `renderCombatOverlay(...)` po `renderScene(...)`.
- Nie ruszałem: `core/`, `entities/`, `input/`, `render/`, `save/`, `world/`, `ui/`. Walka korzysta z ich API: `registerSystem` (fazy), `isOccupied`, `tryStep` (ruch wroga tymi samymi zasadami co gracz), `canStep`, `setCell`, `createEntity`, `Rng`, `visualPos`, `computeCamera`.

## 3. Jak uruchomić i przetestować
```bash
cd /workspace/GRA/prog/game
npm install
npm run dev            # http://localhost:5173 (telefon w tej samej sieci: npm run dev -- --host)
npx tsc --noEmit       # typecheck (osobnego skryptu nie ma; robi to też npm run build)
npm run lint
npm test
npm run build
```
Wyniki (25.10.2026, ok. 21:10 czasu polskiego): typecheck (`tsc --noEmit`) OK, lint OK, **testy 224/224** (15 plików, w tym 54 walki: 23 M0 + 25 v0.4 + 6 zapisu), build OK.

**Klawiatura (profil M0 – domyślny):** WASD/strzałki – ruch (skosy dwoma klawiszami), Spacja lub J – atak (tap = jeden cios, trzymanie = autoatak na cel w zasięgu), Esc/P – pauza. Arena 40×20: gracz startuje w lewym pokoju, wróg w prawej części za korytarzem. Idź w prawo przez korytarz (wiersz 10) → wróg pokazuje `!`, podchodzi i pokazuje żółty `!`, odwraca swoją komórkę i zaznacza `x` na twoim polu. Zejdź z pola w trakcie zapowiedzi (unik → `miss`), wróć obok i bij. Żeby zobaczyć śmierć: stój i nie unikaj (ok. 7 ciosów). Po 2 s bez dotykania klawiszy pierwszy cios wroga pauzuje grę (wyzwalacz D).
**Profil M1 w grze:** na razie tylko w testach (`getCombat(state, { cfg: COMBAT_M1, depth })`); wybór profilu w `main.ts` / menu debug – do ustalenia z Silnikiem. Z profilem M1 krok strzałką w wroga atakuje.
**Dotyk:** logika walki czyta tylko `ActionState` (`move`, `attack`), więc joystick i ATK UI działają bez zmian (bump = wychylenie joysticka w stronę wroga).
**Testy jednostkowe (`tests/combat.test.ts`):** przeliczenie ticków; linia wzroku, róg, BFS; trafienie po 100 ms; zakres obrażeń i ~10% krytyków (300 ziaren); autoatak co 8 ticków (cooldown); blokada ruchu w przygotowaniu; trzymanie bez celu / tap w `facing`; bufor ATK i zbyt wczesne wciśnięcie; remis celu → `facing`; wykrycie + ALERT 300 ms + pościg + zapowiedź; brak wykrycia przez ścianę; trafienie w zamrożone pole i unik krokiem; cykl wroga 24 ticki; RETURN i leczenie na spawnie; śmierć wroga, wrak, respawn tylko przy ≥ 8; śmierć gracza (zamrożenie, zwłoki, respawn, reset wroga); remis w ticku; determinizm (to samo ziarno = te same zdarzenia); wyzwalacz D; regeneracja.

## 4. Mapowanie parametrów → DESIGN
Wszystkie liczby z tabeli **1.14** są w `data/mechanics-m0.ts` (`M0`) i trafiają do walki przez `COMBAT` w `data/combat-m0.ts`:
| Sekcja | Parametry |
|---|---|
| 1.1 | `TICK_MS` |
| 1.3 | `PLAYER_ATK_RANGE`, `PLAYER_ATK_WINDUP_MS`, `PLAYER_ATK_COOLDOWN_MS`, `PLAYER_DMG_MIN/MAX`, `PLAYER_CRIT_CHANCE`, `PLAYER_CRIT_MULT`, `ATK_QUEUE_MS` |
| 1.4 | `PLAYER_HP`, `ENEMY_HP`, `ENEMY_MOVE_MS`, `ENEMY_MOVE_DIAG_MS`, `ENEMY_ATK_RANGE`, `ENEMY_ATK_WINDUP_MS`, `ENEMY_ATK_COOLDOWN_MS`, `ENEMY_DMG_MIN/MAX`, `PLAYER_REGEN_DELAY_MS`, `PLAYER_REGEN_PER_S` |
| 1.6 | `ENEMY_DETECT_RADIUS`, `ENEMY_ALERT_MS`, `ENEMY_LEASH_RADIUS`, `ENEMY_LOST_LOS_MS`, `ENEMY_RETURN_DEAF_MS`, `ENEMY_PATH_RADIUS`, `ENEMY_WANDER_INTERVAL_MIN/MAX_MS`, `ENEMY_WANDER_RADIUS` |
| 1.7 | `TELEGRAPH_BLINK_MS`, `TELEGRAPH_FAST_LAST_MS`, `FLOAT_TEXT_MS`, `HIT_FLASH_MS` |
| 1.8 / 1.9 | `PLAYER_RESPAWN_MS`, `ENEMY_RESPAWN_MS`, `ENEMY_RESPAWN_MIN_DIST` |
| 1.10 / 1.14 | `ARENA_COLS`, `ARENA_ROWS` (`ARENA_SIZE` 40 × 20) |
| 1.11 | `AUTOPAUSE_IDLE_HIT_MS` (D) |
| 2.5 / 2.16 | `ACTION_TICK_ACCUMULATOR` |
| 2.6 / 2.16 | `BUMP_ATTACK_ENABLED` (M0 false / M1 true), `ATK_QUEUE_MS` |
| 2.11 / 2.16 | `DEPTH_HP_MULT`, `DEPTH_DMG_MULT`, `ARMOR_DR_K`, `ARMOR_DR_CAP`, `ARMOR_MIN_DMG`, `ENEMY_TYPES.panelDrone` (`PANEL_DRONE_STEP_MS` 200 / `_WINDUP_MS` 400) |
| 2.13 | `PLAYER_REGEN_PER_S` = 0 w `COMBAT_M1` |
| Silnik | `PLAYER_MOVE_MS`, `PLAYER_MOVE_DIAG_MS`, `DIAG_GRACE_MS`, `INPUT_TAP_BUFFER_MS`, `AUTOPAUSE_IDLE_MS`, `RESUME_*` (ruch, wejście, pauza) |

`COMBAT_EXTRAS` (w prozie specu, brak w 1.14 – proszę Mechaniki o dopisanie do tabeli): `PLAYER_DEATH_FREEZE_MS` 500 (1.8), `TELEGRAPH_FAST_BLINK_MS` 50 (1.7 pkt 3), `STRIKE_FX_MS` 100 (1.7 pkt 4), `HIT_VIBRATE_MS` 20 (1.7 pkt 4, dla UI), `MOVE_DEADZONE` 0,15 (zabezpieczenie; martwa strefa joysticka należy do UI). `PLAYER_IFRAMES_ON_HIT_MS` = 0 – tylko liczba, logiki nie ma (M1).
Zmiana liczby = edycja jednego pliku danych, bez zmian w logice (kryterium 1.15 pkt 11).

## 5. Odstępstwa od specyfikacji i decyzje implementacyjne
1. **Kodowanie przygotowania na liczniku silnika:** start ataku ustawia `attackWindup = ticki_przygotowania + 1`, a cios rozstrzyga się w fazie 4 ticka, w którym licznik = 1. Czasy są dokładnie jak w specu (cios gracza po 100 ms, wroga po 500 ms, cykle 400 / 1200 ms – testy), a dodatkowo gracz **nie może zrobić kroku także w ticku swojego ciosu** (inaczej silnikowe `tryStep` puściłoby krok przed rozstrzygnięciem i cios mógłby spudłować przez własny ruch).
2. **Punkt respawnu gracza** = pole gracza przy pierwszym ticku walki (w nowej grze to `@`). Po wczytaniu zapisu to zapisana pozycja, bo `GameState` nie przechowuje spawnów mapy (pytanie do Silnika).
3. **Stan walki jest zapisywany** w sekcji `combat` (save v3, §6a). Kosmetyka (liczby, `*`, znaczniki `x`) nie – odbudowuje się w następnym ticku.
3a. Panel Drone: skos 300 ms i odnowienie 600 ms – skos nie jest w spec (założenie ×1,5).
3b. Wróg w telegrafie: komórka odwrócona; gdy w tym samym ticku został trafiony, wygrywa biały błysk (100 ms).
4. Komunikat `You were hit while away.` (D) nie jest wyświetlany – UI ma tylko powód `auto`. Walka zgłasza osobne zdarzenie `autoPauseRequest` / `hitWhileAway`, UI może to pokazać.
5. „Ostatnie wejście” dla D liczę w walce z `ActionState` (ruch ≠ 0 lub dowolny przycisk), czyli tą samą regułą co `InputManager.idleMs` Silnika. Systemy dostają tylko `ActionState`, więc nie czytam `idleMs` wprost.
6. `miss` pokazuje się też przy pudle gracza (cel uciekł) – spec wymienia `miss` tylko przy pudle wroga.
7. Telegraf rysowany z dokładnością ticka (20 Hz): miganie 100 ms = 2 ticki, szybkie 50 ms = 1 tick.
8. Kolory telegrafu wg GRAF §9 (z `ENEMY_SIGNALS`). Wibracja 20 ms – nie zrobiona (UI; zdarzenie `playerHit` jest dostępne).
9. Glif wroga z `ENEMY_GLYPHS` (`c` Crawler, `d` Panel Drone); wielkie litery tylko dla elit (GRAF).
10. Nieudany losowy krok wędrówki (ściana / poza promieniem 3) jest pomijany do następnego interwału.
11. Tymczasowy HUD HP na canvasie (lewy górny róg) do czasu HUD-u UI.

## 6. Odpowiedzi PROG/Gameplay dla Mechaniki
**Runda v0.4 – wiadomość gotowa do wysłania Mechanikom:**
> PROG/Gameplay → DESIGN/Mechanika, v0.4 wdrożona w kodzie (profil M0 domyślny, reguły M1 w profilu `COMBAT_M1`). Telegraf wg GRAF §9: jeden glif, odwrócona komórka, żółty `!`, `x` na `#4A1240`, Reduce motion = stałe `x`. Bump (2.6) zgodnie ze wszystkimi punktami 1–4 i 8, rozstrzygany w fazie gracza przed `tryStep` – potwierdzam analizę z 2.10 (brak kroku w ticku startu bumpa, bufor w ostatnich 150 ms z celem z bumpa). Brak regeneracji w M1. Panel Drone 200/400 ms (typ wroga `d`). Mnożniki ×1/1,5/2,2 HP i ×1/1,25/1,5 obrażeń (boss ×1). Pancerz A/(A+100), max 60%, floor, min 1. Akumulator ułamków ticka: reszta z zaokrąglenia przechodzi na następną akcję; −10% cyklu 400 ms daje dokładnie 7,2 ticka średnio (test: 1000 akcji = 7200 ticków; w pętli gry 7,2 ±0,02), ruch 150 ms −10% = 2,7 ticka. Prosimy o decyzje: (1) skos Panel Drone – przyjęliśmy 300 ms; (2) kolejność zaokrągleń: rzut → ×głębokość (round) → pancerz (floor, min 1); (3) `ARENA_SIZE` i `MAX_STEPS_PER_FRAME`: arena w danych walki, `MAX_STEPS_PER_FRAME` = 5 to stała pętli Silnika (`data/mechanics-m0.ts`), nie walki – w spec jej nie ma i nie musi być.

Nazwy umiejętności M1 (do kodu w kolejnej rundzie): Dash, Shock Pulse, **Buddy Drone** (nazwa zatwierdzona w spec v0.4 i `sterowanie.md`, ID `M1_SKILL_03_NAME`; „Helper Drone” nie występuje w dokumentach).

**(1) Kolejność w ticku – POTWIERDZAM.** Dokładnie zaimplementowana kolejność (jeden tick = 50 ms):
1. `InputManager.sample()` (Silnik): akcje z bufora tapnięć 2 ticki; `pause` → pauza zamiast ticka.
2. Faza `'player'` (walka): zapis „ostatniego wejścia”, zbocze ATK (tap), bufor ATK, **start ataku gracza** (cel zamrożony; przygotowanie blokuje ruch).
   Potem **krok gracza** (Silnik, `tryStep`; zablokowany w przygotowaniu i w ticku ciosu).
3. Faza `'world'` (walka): **AI wrogów** w kolejności listy encji – wykrycie, ALERT, krok BFS albo **start zapowiedzi** (pole celu = pole gracza po jego kroku z punktu 2).
4. **Rozstrzygnięcie ciosów:** najpierw gracz, potem wrogowie; wróg zabity w 4a nie zadaje ciosu (remis wygrywa gracz).
5. Śmierć/respawn wroga, śmierć gracza (start 0,5 s zatrzymania), regeneracja, zgłoszenie auto-pauzy D (pauza wchodzi po tym ticku – następny tick się nie wykona).
6. Odliczenie liczników: timery walki (ALERT, wędrówka, głuchota, respawn, błyski, liczby), potem silnik: `moveCooldown`, `attackWindup`, `attackCooldown` wszystkich encji; `tick++`.
Skutek dla gracza: krok gracza jest zawsze przed rozstrzygnięciem ciosu wroga w tym samym ticku, więc okno uniku to pełne 10 ticków zapowiedzi (500 ms minus opóźnienie wejścia ≤ 50 ms). Wyjątek w zapisie: „windup doszedł do 0” jest kodowany jako licznik = 1 (odstępstwo 5.1) – czasy bez zmian.

**(2) Żetony ataku: maks. 2 zapowiedzi wręcz + 1 strzał wieżyczki – OK technicznie i dla czytelności, z 3 zastrzeżeniami.**
- Technicznie tanie: pula żetonów w danych walki, pobierana przy starcie zapowiedzi, zwracana przy rozstrzygnięciu, śmierci wroga, przerwaniu (Shock Pulse) i wyjściu z ATTACK. Przydział deterministyczny: w kolejności aktualizacji AI (lista encji), przy remisie bliższy wróg, potem niższe id. Parametry `ATTACK_TOKENS_MELEE` / `ATTACK_TOKENS_RANGED` trafią do danych.
- Czytelność: 2 wrogów wręcz zamraża zwykle **to samo pole** (pole gracza), więc jeden krok unika obu – dobrze. Ryzyko: oba ciosy w tym samym ticku = jedna podwójna strata HP (do ~36+). **Proponuję parametr `ATTACK_TOKEN_STAGGER_MS` = 150 ms**: drugi żeton można wziąć najwcześniej 150 ms po pierwszym, żeby ciosy padały osobno i każdy miał swój `*` / liczbę.
- Bez wielkiej litery w M1 (2.17/14) przy 3 zapowiedziach gracz musi widzieć, **który** wróg zapowiada. Proponuję `!` nad każdym wrogiem w zapowiedzi (GRAF) plus tło pola celu; wieżyczka: inny kolor tła pola (dystans) – do GRAF/UI.
- „Okrążenie” na dystansie 2: wróg bez żetonu, który już stoi obok gracza (gracz do niego podszedł), **czeka w miejscu** (nie cofa się) – prościej i czytelniej. Do potwierdzenia.

**(3) Osobna mała mapa odległości dla drona – TAK, pasuje do architektury.**
- Dron = zwykła encja w `state.entities` (`kind 'drone'`, `solid`, HP w danych walki), więc blokuje ruch i można go trafić tym samym kodem co gracza. W AI zamiast „cel = gracz” wprowadzę funkcję `targetOf(wróg)` zwracającą gracza albo drona (wspólny interfejs: pole + HP).
- Mapa: Dijkstra od pola drona, wagi 3/4 (jak flow field), promień 6 → maks. 13×13 = 169 pól, liczona **raz przy postawieniu** (dron stoi, ściany w M1 się nie zmieniają). Trzymana w danych walki jako `Int16Array`, usuwana, gdy dron zniknie (8 s / 0 HP) – wtedy wrogowie wracają na flow field gracza. Zajętość pól sprawdzana przy kroku, nie w mapie (jak w 2.9).
- Prowokacja: wróg w promieniu 4 (Czebyszew) od drona → cel = dron, krok po mapie drona, zapowiedź zamraża pole drona. Proponuję też linię wzroku do drona (spójnie z wykrywaniem gracza) – decyzja Mechaniki.
- Pytanie zwrotne: czy ataki na drona zużywają żetony gracza? Proponuję **osobną pulę na cel** (gracz 2, dron 2) – zapowiedzi na drona nie grożą graczowi, a limit gracza zostaje czytelny.

**Odpowiedzi do części 1 (1.17), dla porządku z perspektywy Gameplay:**
- BFS przy każdym kroku (M0) – zaimplementowany (promień 20, 8 kierunków, bez rogów, deterministyczna kolejność sąsiadów N→NW zgodnie z zegarem). Flow field Silnika w M1 – OK; walka potrzebuje tylko funkcji „najlepszy następny krok”, więc zamiana nie zmienia AI.
- Zapis co do ticka: po stronie walki wykonalne – cały stan to czyste dane (HP, stany AI, timery, zamrożone pola, stan PRNG walki; pozycje i liczniki są w encjach). Brakuje schematu zapisu v3 u Silnika; dostarczę `serializeCombat` / `restoreCombat`, gdy Silnik ustali format.
- `lastInputTick` (D): dziś liczony w walce z `ActionState` tą samą regułą co `InputManager`; mogę przejść na wartość z `InputManager`, jeśli Silnik przekaże ją systemom.

## 6a. Zapis walki – sekcja `combat` (dla PROG / Silnik)
Zaimplementowane w `src/combat/save.ts` wg README Silnika („Zapis v3”): `registerSaveSection('combat', { serialize, deserialize, fresh, apply })` na górnym poziomie modułu, import z `combat/install.ts`. Błędy → `SaveError` z `save/schema.ts`.
- **Format `CombatSave` v1** (`v: 1`): `profile` ('m0' | 'm1'; inny → profil domyślny), `depth`, `player` {hp, maxHp, armor, attackTimeMod, moveTimeMod, atkCarry, moveCarry, spawn, attack {target: indeks wroga | null, aim}, atkQueued, queuedTarget, prevAttack, lastCombatTick, regenAcc, hitFlash, **moveCooldown, attackWindup, attackCooldown** gracza}, `enemies[]` w kolejności AI {type, x, y, facing, hp, maxHp, ai, spawn, stateTimer, attack {aim} | null, lastSeen, lostLosTicks, wanderTimer, deafTimer, respawnTimer, hitFlash, liczniki encji}, `death` {freezeLeft, respawnLeft} | null, `lastInputTick`, `stats`, `corpse` {x, y} | null.
- **Brak stanu RNG** (strumień `combat` zapisuje Silnik w `rngState`), brak id encji (nie są stałe między uruchomieniami → indeksy listy), brak kosmetyki.
- „Walka jeszcze nie ruszyła” = `{ v: 1, empty: true }` (sekcja musi być obiektem) → po wczytaniu leniwa inicjalizacja jak w nowej grze. `fresh()` = to samo.
- `apply` buduje dane walki **bez losowania** (usuwa „dummy” z mapy i stawia zapisanych wrogów), więc przywrócony strumień `combat` zostaje nietknięty.
- Zapis w środku walki: test round-trip `snapshot → saveToJson → parseSaveText → gameFromSave` w trakcie zapowiedzi wroga i odnowienia gracza, potem 600 ticków tych samych wejść → **identyczne zdarzenia i stan co do ticka** (także w trakcie sekwencji śmierci). Złe dane (wersja, typy, stan AI, typ wroga, indeks celu, ujemne liczniki) → `SaveError`, cały zapis odrzucony.
- Nowa wersja formatu = podbicie `COMBAT_SAVE_VERSION` + migracja w `deserializeCombat` (dziś odrzuca inne `v`).

## 7. Otwarte pytania
**Do PROG / Silnik:** (a) przechowywanie spawnów mapy w `GameState` (respawn gracza po wczytaniu nowej gry z zapisu sprzed walki), (b) wybór profilu walki (M0/M1) i głębokości w `main.ts` – kto i skąd, (c) przekazywanie metadanych wejścia (`idleMs`, `pressed`) do systemów albo akceptacja wyliczania ich w walce, (d) powód pauzy dla D (`You were hit while away.`), (e) README szkieletu nadal mówi „combat/ pusty, atak bez efektu” – do aktualizacji przez Was.
**Do PROG / UI:** HUD HP z `getCombatHud(state)` (wtedy `renderCombatOverlay(..., { fallbackHud: false })`); wibracja na zdarzenie `playerHit` (`getCombat(state).events` po każdym ticku, ewentualnie przeniesiemy na event bus); kontrolki dotykowe – walka jest na nie gotowa.
**Do GRAF:** wrak wroga vs zwłoki gracza (dziś: szary `%` vs biały bold `%` na aureoli); `!` rysuję nad komórką wroga (nakładka canvas), nie w sąsiedniej komórce.
**Do PROG / UI:** przełącznik „Reduce motion” → `setCombatReduceMotion(on)`.
**Do Mechaniki:** (1) skos Panel Drone – przyjąłem 300 ms (×1,5); (2) kolejność zaokrągleń obrażeń: rzut → ×głębokość (round) → pancerz (floor, min 1) – OK?; (3) krytyk gracza a pancerz wroga – wrogowie M1 nie mają pancerza w 2.11, więc pancerz liczę tylko dla gracza; (4) przy „minimum 1 tick” akcji krótszych niż 25 ms dług akumulatora przepada (carry ≥ −0,5) – w M1 nie występuje.

## 8. Ryzyka
- Szkielet był przepisywany przez Silnika w trakcie mojej pracy (mapy, wejście, główna pętla). Integracja jest celowo mała, ale kolejne zmiany API (`registerSystem` z fazami, `tryStep`, `isOccupied`, `visualPos`) mogą wymagać poprawek w `combat.ts`.
- Komfort na telefonie nie jest sprawdzony (brak kontrolek dotykowych) – główny cel M0.
- Zapis w środku walki traci stan walki (odstępstwo 3).
- Telegraf zależy od koloru tła + migania glifu; bez wielkiej litery (M1) czytelność przy kilku wrogach trzeba sprawdzić w QA.

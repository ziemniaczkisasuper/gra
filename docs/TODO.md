# TODO dla Cursora

Każde zadanie to osobny prompt w Cursorze. Wklej: „Zrób zadanie Tn z docs/TODO.md” i dołącz plik `docs/design/wariant-twin-stick.md`.
Po każdym zadaniu: `npm test` zielone, `npm run dev` i sprawdzenie ręczne. Odhacz `[x]` i zrób commit.

Numery linii są z commita 2963c22 i mogą się przesunąć. Szukaj po nazwie symbolu.

## Etap A – demo sterowania (najpierw)

- [x] **T1. Wyłącz bump-attack.** `src/data/combat-m0.ts:105` w `COMBAT_M1` ustaw `BUMP_ATTACK_ENABLED: false`. W `combatPlayerPhase` (`src/combat/combat.ts`, ok. l.603) wejście we wroga tylko obraca `facing`, bez kroku i bez obrażeń.
  Gotowe, gdy: wejście we wroga nie zadaje obrażeń (kryterium 4 z §9.4).
- [x] **T2. Stałe zamachu.** W `src/data/combat-m0.ts` dodaj `ARC_OFFSETS` (tabela 8×8 z §2.1, kolejność `DIRS8`), `SWING_RANGE = 2`, `SWING_CYCLE_MS = 400`, `SWING_FX_MS = 150`, `SWING_WINDUP_BLOCKS_MOVE = true`. W `src/data/mechanics-m0.ts` dodaj `AIM_DEADZONE = 0.35`.
  Gotowe, gdy: test jednostkowy sprawdza, że każdy kierunek ma 8 pól zgodnych z §2.1.
- [x] **T3. Wejście celowania.** `src/input/aim.ts`: gałka używa `AIM_DEADZONE`. `src/input/actions.ts`: zamiast priorytetu strzałek obowiązuje zasada „ostatnio użyte źródło wygrywa” (`lastAimSource`), do tego `aimFire: boolean` (gałka wychylona albo strzałka trzymana) i `aimCell` dla myszy. LPM = atak.
  Gotowe, gdy: działają kryteria 2 i 3 z §9.4.
- [x] **T4. Zamach łukiem.** Dodaj `arcCells(map, from, dir)` w `src/combat/grid.ts` z regułami ścian z §2.2. Dodaj `resolveSwing()` zamiast jednocelowego `resolvePlayerBlow()`: trafia każdego wroga w łuku raz (dedupe po id, boss raz), Momentum liczy się raz na zamach. Wysyła zdarzenie `playerSwing`. Atak jest wtedy, gdy `attack || aimFire`, w kierunku `aim ?? facing`.
  Gotowe, gdy: działają kryteria 5, 6 i 7 z §9.4, a do tego są testy jednostkowe `arcCells` dla 8 kierunków i dla ścian.
- [x] **T5. Druga gałka na telefonie.** W `src/ui/touch-controls.ts` prawa połowa ekranu dostaje pływającą gałkę (promień 48 px w trybie kompaktowym, 60 px normalnie), która woła `setAimStick({x,y})` / `setAimStick(null)`. Przycisk ATK znika. Przyciski DASH/PULSE/DRONE układają się łukiem nad gałką i mają pierwszeństwo dotyku (śledzenie po `pointerId`). Szczegóły w §12.
  Gotowe, gdy: działa kryterium 1 na prawdziwym telefonie.
- [x] **T6. FX zamachu i znacznik celowania.** Podświetl 8 pól łuku przez 150 ms i pokaż znacznik kierunku celowania przy graczu.
- [x] **T7. Dash.** Kierunek to `move ?? aim ?? facing`, a Dash przerywa windup. Gotowe, gdy działa kryterium 11.
- [ ] **T8. Publikacja demo.** Uruchom `npx vite build --base=/gra/` i wrzuć `dist` z `.nojekyll` na gałąź `gh-pages` (opis w `START-CURSOR.md`). Sprawdź na telefonie: https://ziemniaczkisasuper.github.io/gra/

## Etap B – po demo

- [x] **T9. Kiting.** W `src/core/game.ts` (ok. l.123) w trakcie cyklu ataku krok trwa ×1,35 przy broni wręcz i ×1,5 przy broni dystansowej (§5). Do tego `TOKEN_WAIT_DIST = 3` i `TOKEN_PRIORITY_ON_HIT`. Kryterium 10.
- [x] **T10. Typ broni.** W `src/data/inventory-m1.ts` dodaj `weaponType: 'melee' | 'ranged'`. Zmień ID `ISSUE_BATON` na `ISSUE_POLE` (l.99, 175, 176, 208, migracja zapisu). Walka czyta typ z założonej broni.
- [x] **T11. Broń dystansowa i pociski.** Nowy plik `src/combat/projectiles.ts` według §3 i kroku 6 z §9.2: 7 pól, 10 pól/s, 2 strzały/s, maksymalnie 3 pociski. Robocza nazwa broni to Rail Pistol, glif `/`. Kryterium 8.
- [x] **T12. Pomoc w celowaniu i opcja Auto-aim.** Dodaj `pickAimTarget` ze stożkiem ±22,5° oraz ustawienie `M1_SET_AUTOAIM` w menu pauzy (gdy jest włączone, wraca przycisk ATK). Kryterium 9.
- [x] **T13. Boss.** Zmiany 8.1–8.7 w `src/combat/boss.ts`. Kryterium 12.
- [x] **T14. Zapis v4.** `attack` dostaje `dir` zamiast `target`. Pociski nie są zapisywane. Dodaj migrację z wersji v3.
- [x] **T15. Podpowiedzi sterowania.** W `src/data/strings.ts:20` dopisz „LMB: attack”.

## Otwarte decyzje (nie dla Cursora)

- Liczby oznaczone [R] trzeba jeszcze sprawdzić w grze (§11, §13).
- `SWING_WINDUP_BLOCKS_MOVE` true czy false: rozstrzygnąć po testach.
- Nazwa i glif broni dystansowej.

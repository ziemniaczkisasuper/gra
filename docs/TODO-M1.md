# TODO dla Cursora – M1: pełna pętla wyprawy

Każde zadanie to osobny prompt w Cursorze. Wklej: „Zrób zadanie Tn z docs/TODO-M1.md” i dołącz pliki podane w zadaniu (zawsze `docs/design/mechaniki-m1.md`).
Po każdym zadaniu: `npm test` zielone, `npm run dev` i sprawdzenie ręczne. Odhacz `[x]` i zrób commit.

Stan na commicie 1cdc09f: twin-stick (T1–T15) gotowy. W kodzie są już walka M1 (4 wrogów, boss, umiejętności), `src/inventory/` (plecak, AT RISK, śmierć, skrytka – niewpięte w `main.ts`), `src/contracts/` (wpięte bez bazy), dane Power Lines (`src/puzzles/power-lines/`, sama logika na gałęzi `wip/boty-niedokonczone`). Brakuje: bazy, windy, generatora poziomów, łupu, ekranów i postępu sieci. Szukaj po nazwie symbolu, nie po numerze linii.

Cel M1 (`docs/plan-produkcji.md`, „Zakres M1”): baza → winda → głęb. 1–3 (+ boss) → ewakuacja albo śmierć → raport sesji → baza.

## Etap C – szkielet pętli (najpierw)

- [x] **T16. Tryby gry.** W `GameState` dodaj `mode: 'base' | 'lift' | 'zone' | 'death' | 'report'` i przejścia między nimi (`src/core/game.ts`, `src/main.ts`). Baza to menu-hub bez ticków (mechaniki §2.14a M4): w trybie `base` pętla nie liczy ticków i auto-pauza nic nie robi. Zapis pamięta tryb (w strefie: co do ticka, jak dziś).
  Gotowe, gdy: nowa gra startuje w bazie, a test przechodzi `base → lift → zone → report → base` bez DOM.
- [x] **T17. Generator poziomu – układ.** Przenieś `docs/design/tools/levelgen_m1.py` do `src/world/levelgen/` (TS) według `docs/design/level-m1.md` §2: ziarno `expSeed`, strumienie `layout/objects/enemies/contracts/loot` przez `streamSeed` z `core/rng.ts`, motywy g1/g2/g3, korekta 40–50% pól przechodnich, `GENERATOR_VERSION = 1`, maks. 20 prób, potem mapa awaryjna (`fixed_maps_m1.py`).
  Gotowe, gdy: test na 1000 ziaren × 3 głębokości przechodzi walidację §2.4, a ziarna z `docs/design/tools/przyklad-d1.txt`–`d3.txt` dają te same mapy co prototyp w Pythonie.
- [x] **T18. Generator poziomu – obiekty.** Kroki 3–10 z `level-m1.md` §2.2 i §3: wejście W, szyb `<`, zejście `>` / brama areny (głęb. 3), terminal `&`, nory, obiekty kontraktów (`contractSpawns` z `src/contracts/board.ts`), pula wrogów (mechaniki §2.11: 8–10 / 12–14 / 14–16, skład wg głębokości, mnożniki HP i obrażeń), skrzynie `■`, `$`, notatki. Wrogowie startują przez istniejące API walki.
  Gotowe, gdy: działają kryteria z `level-m1.md` §8 (odległości, brak wrogów 10 pól od W i `<`, `<` nigdy w korytarzu szer. 1).
- [x] **T19. Winda z bazy i zejście `>`.** USE na windzie w bazie → ekran przejścia `LIFT_RIDE_MS` = 2000 ms → głęb. 1 albo wybór przystanku (ui-m1 §3.6; gdy jest tylko głęb. 1, bez okna). Wejście na `>` → nowe ziarno, głębokość +1. Przy `AT RISK` > 0 okno `M1_RISK_01` (GO DOWN / STAY, fokus na STAY, pauza, zerowanie wejść, STAY nie cofa gracza), na bramie areny `M1_RISK_01B` (mechaniki §2.7a pkt 1, ui-m1 §4.3, §11.9). Ustawienie „Ask before going deeper”, domyślnie ON.
  Gotowe, gdy: da się zejść 1 → 2 → 3 → arena, a okno działa według §2.7a.
- [x] **T20. Ewakuacja.** Procedura z mechaniki §2.9: przytrzymanie USE 1,0 s przy `<` (przerywa ruch, atak, umiejętność, puszczenie; obrażenia nie), dojazd 5 / 7 / 9 s z odliczaniem w HUD (`M1_UI_LIFT_COMING`), w chwili przyjazdu alarm w promieniu 12 pól BFS (`liftArrived`, `M1_BASE_06`, `M1_SYS_05`), okno 10 s, wejście na `<` = kabina (nietykalność, wypadnięcie z symulacji), `LIFT_DEPART_MS` 1000 ms, zjazd 2000 ms (`M1_BASE_05`, pominięcie po 500 ms), cooldown ponownego wezwania 5 s (`M1_BASE_07`). Po arenie bossa otwiera się dodatkowy szyb.
  Gotowe, gdy: działają kryteria ewakuacji z mechaniki §2.17, a pierścień przytrzymania wygląda jak w ui-m1 §11.7.
- [x] **T21. Wpięcie ekwipunku.** Zarejestruj sekcję zapisu `inventory` w `main.ts` (jak `contracts/save`), podłącz `onEvacuated()` (kredyty ze strefy na konto, plecak bezpieczny), `issueTopUp()` przy każdym wyjeździe windą (2 patche, od Lights I 3), Issue Pole / Issue Suit przy wydruku, `START_CREDITS = 50`. HUD pokazuje `AT RISK: {cr}` i zajętość plecaka (ui-m1 §2.1).
  Gotowe, gdy: `AT RISK` w HUD równa się `computeAtRisk()` w każdym ticku (test), a po ewakuacji kredyty są na koncie.
- [x] **T22. Śmierć i wydruk.** Połącz istniejący `src/ui/death-screen.ts` z `onDeath()`: przepada plecak, założony sprzęt poza Issue, kredyty ze strefy, aktywny kontrakt BASE wraca na tablicę (mechaniki §2.7). Zwłoki `%` na polu śmierci. Przy pierwszej śmierci z `AT RISK` > 0 dwustronicowy panel `M1_RISK_04` (NEXT po 1500 ms, OK po 500 ms, flaga `riskExplainerSeen`). Potem wydruk `M1_BASE_03` i raport ze stopką `M1_BASE_14`.
  Gotowe, gdy: liczby straty w raporcie równają się ostatniemu `AT RISK` (test), a panel pokazuje się tylko raz na zapis.
- [x] **T23. Raport sesji.** Ekran SESSION REPORT z ui-m1 §3.7 (`M1_BASE_11`–`M1_BASE_14`) po ewakuacji i po wydruku. Zawsze co najmniej jedna trwała zmiana (filar 6, mechaniki §2.2). Liczby zawsze prawdziwe. Po raporcie przypomnienie o eksporcie zapisu (ui-m1 §6, `src/save/reminder.ts`).
  Gotowe, gdy: działa przepływ z diagramu ui-m1 §3.0 od strefy do bazy w obu gałęziach (ewakuacja i śmierć).

## Etap D – łup i baza

- [x] **T24. Losowanie łupu.** Nowy plik `src/loot/roll.ts`: rzadkość wg głębokości (80/18/2, 65/30/5, 50/38/12%), wartości bazowe wg `ilvl` i 12 właściwości `M1_AFFIX_01–12` z `docs/design/balans-m1.md` §3, ceny sprzedaży (mechaniki §2.12). Tylko strumień `loot`, nigdy `Math.random`. Zrzut z wrogów (~20%, Scrap 2–4), skrzynie (1–2 przedmioty, Med-Patch ~30%, Copper z głęb. 2+). Wrogowie kontraktów i drony bossa nie upuszczają łupu.
  Gotowe, gdy: test na 20 000 poziomów daje średnio ok. 6,3 / 8,6 / 9,0 przedmiotu na poziom (mechaniki §2.12).
- [x] **T25. Podnoszenie i plecak w strefie.** `$`, `:` i `+` automatycznie po wejściu na pole, sprzęt i `§` przez USE (`pickupItem`). Pełny plecak → `M1_SYS_06`. Med-Patch: Q / przycisk `[+]` z licznikiem, +40 HP w 2 s, cooldown 4 s, maks. 6 (mechaniki §2.13). Statystyki założonego sprzętu (obrażenia, pancerz, afiksy) trafiają do walki; kolejność liczenia obrażeń wg mechaniki §2.11 „Pancerz”.
  Gotowe, gdy: założona broń z łupu zmienia obrażenia w walce, a pancerz redukuje ciosy wrogów (testy).
- [x] **T26. Ekran ekwipunku.** Ui-m1 §3.4 i §2.6: 4 sloty + plecak 12, klawisze I / F / X, znacznik „can be lost” (`M1_RISK_02`, Issue: `M1_RISK_03`), porównanie DR z 1 miejscem po przecinku. W strefie poza walką pauza, w walce bez pauzy z paskiem `M1_UI_INV_COMBAT` (mechaniki §2.14).
  Gotowe, gdy: działa na telefonie poziomo (667×375) i na PC.
- [x] **T27. Baza – hub.** Ekran bazy z ui-m1 §3.1 i §11.11: tablica kontraktów i przycisk windy widoczne od razu po wczytaniu, skróty 1–5. Mapa bazy z `level-m1.md` §4 jako tło.
  Gotowe, gdy: mediana wizyty w bazie mieści się w 40 s (sprawdzenie ręczne: start → winda w ≤ 3 tapnięciach).
- [x] **T28. Exchange i skrytka.** Sklep ui-m1 §3.2: sprzedaż wszystkiego poza Issue i Med-Patchami, Med-Patch za 25 kr, półka 3 przedmiotów ×4 ceny (slot 1: 10% na r3 za ×5), losowana po każdej wyprawie. Skrytka ui-m1 §3.3: `STASH_SLOTS` 30 / 40 / 50 / 60 (`moveToLocker`, `moveFromLocker`). Kupione rzeczy trafiają do skrytki. Druga zgoda przy sprzedaży r3.
  Gotowe, gdy: działa cykl kup → załóż → zgiń → odkup, a ceny zgadzają się z balans-m1 §4.
- [x] **T29. Kontrakty w pętli.** Tablica kontraktów (ui-m1 §3.5) na `refillContractsAtBase`, obiekty kontraktów z T18 na mapie, rozliczenie przy ewakuacji (`applyContractReward`), utrata przy śmierci. Opis modułu: `docs/prog/kontrakty-m1.md`.
  Gotowe, gdy: Restore Relay, Data Core i Clear the Path dają się ukończyć i wypłacają nagrody z balans-m1 §5.

## Etap E – terminal i trwały postęp

- [x] **T30. Logika Power Lines.** Przenieś z gałęzi `wip/boty-niedokonczone` dane i typy (`src/puzzles/power-lines/`, `scripts/power-lines-fixture.py`, `tests/fixtures/power-lines-expected.json`). Dopisz solver przepływu według `docs/design/zagadki-m1/power-lines-line1.md` §4–§7a. Bez kodu FX z tej gałęzi (4 testy FX tam nie przechodzą).
  Gotowe, gdy: wszystkie 8 wariantów jest rozwiązywalnych, a wyniki zgadzają się z fixture z `validate.py`.
- [x] **T31. Okno terminala.** Ui-m1 §5 i styl-ascii §11: układ 2-kolumnowy, przełączniki 48×48, SEND / `?` / RESET / EXIT, odbiorniki A–D z licznikami `x/y`. Otwarcie tylko bez wrogów w CHASE/ATTACK (`M1_SYS_04`), okno pauzuje świat, auto-pauza jako nakładka. Wariant na poziom wg mechaniki §2.15 (głęb. 1: 04 → 07 → 08, głęb. 2: 05 → 01 → 02, głęb. 3: 06 → 03).
  Gotowe, gdy: rozwiązanie wariantu zapisuje się na stałe, a na 568×320 pojawia się `M1_UI_ROTATE_TERMINAL` zamiast za małej siatki.
- [x] **T32. Przystanki windy i Issue Mk2.** Pierwszy rozwiązany terminal na głęb. 2 / 3 odblokowuje przystanek. Odblokowany przystanek na głęb. 2 → Issue Pole II i Issue Suit II (mechaniki §2.3, linia `M1_BASE_17` przy pierwszym wyjeździe).
  Gotowe, gdy: po rozwiązaniu terminala na głęb. 2 winda oferuje 2 przystanki, a Issue ma 10–15 obrażeń i pancerz 6.
- [x] **T33. Mapa sektora i Lights.** 10 fragmentów (8 terminali po 10% + boss 20%, `M1_BOSS_DEFEAT`), `grid_pct` w raporcie (`M1_BASE_09`). Ulepszenie „Lights Above the Base” (`M1_BASE_08`) w 3 poziomach z kosztami z mechaniki §2.15 (bramka Lights I = `M1_TERM_08`, który daje też 10 Copper). Każdy poziom zapala odcinki kabla na mapie bazy i zmienia skrytkę, uzupełnianie patchy i półkę.
  Gotowe, gdy: zakup Lights I zmienia skrytkę na 40 i uzupełnianie na 3, a mapa bazy pokazuje zapalony kabel.
- [x] **T34. Prolog i podpowiedzi.** Nowa gra: `M1_BASE_01`–`02`, poziom Prologu (`level-m1.md` §3.6), kroki T01–T13 z mechaniki §2.19, pasek podpowiedzi na dole (ui-m1 §11.1–11.8), przełącznik „Hints”.
  Gotowe, gdy: nowy gracz bez instrukcji dochodzi do pierwszej ewakuacji (sprawdzenie ręczne na telefonie).
- [x] **T35. Zapis v5 i publikacja.** Jedna wersja zapisu dla całej pętli (tryb, baza, skrytka, postęp sieci, przystanki, terminale, `riskExplainerSeen`, flagi Prologu) z migracją z v4. Eksport / import działa po pełnej wyprawie. Na koniec publikacja jak w T8 (`docs/START-CURSOR.md`).
  Gotowe, gdy: zapis z dowolnego trybu wczytuje się bez utraty, a demo na https://ziemniaczkisasuper.github.io/gra/ przechodzi pętlę baza → strefa → baza.

## Decyzje GD (26.10.2026), obowiązują w zadaniach powyżej

- **Bramka Lights I** = `M1_TERM_08` (ten terminal daje 10 Copper potrzebne do zakupu). Jeśli w testach blokuje postęp, zmienić na „dowolne 3 fragmenty” (mechaniki §2.15).
- **HP bossa** = 2400 na start (przy ~26 DPS walka trwa ok. 90 s, w normie 60–90 s). Korekta po pierwszych grach właściciela.
- **Płatne odświeżenie półki**: 25 / 50 / 100 kr, maks. 3 razy na wizytę (balans-m1 v1.2 §7).
- **Kalibracja (NEW STATS)**: koszt 2 × cena sprzedaży × 1,5^n. Gracz wybiera stare albo nowe statystyki, opłata przepada także przy KEEP OLD.

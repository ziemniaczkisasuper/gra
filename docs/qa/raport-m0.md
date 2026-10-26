# Raport QA – prototyp M0 (QA / Tester 1)

Data: 25.10.2026, 20:54–21:15 CET. Zlecenie: Producent. Spec: `design/mechaniki-m1.md` v0.4, §1.15 (12 kryteriów) oraz §1.1–1.11 i §1.17.

**Testowana wersja:** commit `45e6a81` („M0 baseline”, 21:03 CET), zamrożona kopia w `qa/testy/snapshot-45e6a81/`.
W trakcie testów kod w `prog/game/` zmieniał się na żywo, m.in. zapis v2 przeszedł na v3. Wszystkie wyniki poniżej pochodzą z tej kopii. Ruch i walkę uruchomiłem też wcześniej na żywym drzewie i wyniki były identyczne.

**Środowisko:** Linux, Google Chrome 156 headless (Playwright-core), serwer `vite` (dev, potrzebny dla `window.__gra`), Node 20, Vitest 4.
**Nie sprawdzone:** Firefox, Chrome Android, iOS Safari, prawdziwe urządzenia. Dotyk to zaślepka, zgodnie ze zleceniem.

## Podsumowanie

| | Liczba | Kryteria |
|---|---|---|
| **PASS** | 7 | 1, 2, 3, 4, 6, 8, 9 |
| **FAIL** | 2 | 5 (unik krokiem prostym z klawiatury), 11 (parametr `MOVE_DEADZONE` ignorowany, dane w 2 plikach) |
| **NIE DA SIĘ SPRAWDZIĆ** | 3 | 7 (wymaga testerów-ludzi i telefonu), 10 (dotyk to zaślepka), 12 (ankieta, min. 3 osoby) |

- PASS oznacza: spełnione na desktop Chrome z klawiaturą. Formalnie M0 wymaga też Firefoksa, Androida i iOS, a tych nie testowałem.
- Zapis i eksport/import (poza 12 kryteriami, wg §1.11/§1.17 i `m0-status.md`): eksport/import i odporność na złe dane są dobre. Są jednak 3 błędy: brak zapisu stanu walki, nadpisywanie zapisu z nowszej wersji i brak limitu `tick`.
- **Błędy: 9** (krytyczne 0, wysokie 1, średnie 4, niskie 4). Silnik: 6, Gameplay: 3.
- Testy gry na snapshot: `vitest` 12 plików / 199 testów zielone, `tsc --noEmit` OK, `eslint` bez błędów. Testy QA: 132 automatyczne przypadki (wyniki w `qa/testy/wyniki-*.txt`).

## Metoda
- Grę uruchamiałem w headless Chrome. Pętlę przełączyłem w tryb ręczny (`loop.stop()` + `loop.frame(t += 50 ms)`), więc każdy test steruje dokładnymi tickami. Wejście to prawdziwe zdarzenia klawiatury Playwright (`keydown`/`keyup`). Stan odczytywałem przez `window.__gra` i moduł walki (`peekCombat`).
- Ustawienia sytuacji testowych, np. teleport gracza/wroga albo ustawienie HP, robiłem w pamięci strony. **Kodu gry nie zmieniałem.**
- Zachowanie w czasie rzeczywistym (tempo ticków, brak skoku czasu po pauzie) sprawdziłem na zwykłej pętli rAF.
- Kryterium 6 i rozkład obrażeń sprawdziłem symulacją prawdziwą logiką gry (`createGame` + `installCombat` + `stepGame`) dla 20 i 1000 ziaren.
- Kryterium 11 sprawdziłem na osobnej kopii w `/tmp`: zmieniłem wartości w plikach danych i sprawdziłem efekt. Test: `qa/testy/k11-zmiana-parametrow.test.ts.txt`; kopiuje się go do `tests/` kopii gry z podmienionymi wartościami.
- Skrypty: `qa/testy/` (`run-all.sh` uruchamia wszystko). Zrzut: `qa/zrzut-m0-zapowiedz-unik-szarosc.png`.

## Tabela kryteriów §1.15

| # | Kryterium (skrót) | Status | Dowód |
|---|---|---|---|
| 1 | Stały tick 50 ms; czasy zgodne z 1.14 (±1 tick) | **PASS** | Czas rzeczywisty 19,98 ticku/s (C9). Krok prosto 3 t, skos 4 t (R1, R2). Cios gracza 2 t po starcie, cykl 8 t (W1a/b). Zapowiedź wroga 10 t, cykl wroga 24 t. Respawn wroga 100 t (W9d). Śmierć gracza: 10 t + 60 t (W8a). E po 1200 t. Testy jednostkowe gry zielone. „Logu debug” nie oceniałem. |
| 2 | Ruch 8 kier., 150/200 ms, marsz, ściany/wróg blokują, brak ścinania rogów, skos bez schodka | **PASS** (klawiatura) | R1–R7, R10, R11 PASS. Uwaga: krótki tap kierunku w trakcie cooldownu ginie (QA-M0-001, wymóg z §1.2, nie z treści kryterium). Przeciwne klawisze: QA-M0-009. |
| 3 | Atak: zasięg 1, auto-cel, 2,5/s, 8–12 / kryt 12–18 jako liczby, hold tylko z celem, tap w `facing` | **PASS** | W1a–c, W2a/b, W3 (brak ciosu przez róg). Symulacja 7500 ciosów: 8–12 równomiernie, kryt 9,8% (12/13/15/16/18). Liczby `-11` / `-16!` jako napisy nad celem (`combat/overlay.ts`). |
| 4 | AI IDLE→ALERT→CHASE→ATTACK→RETURN, LOS, utrata śladu, powrót z HP | **PASS** | W4a: ALERT 6 t, potem CHASE i ATTACK. W4b: dystans 8 = brak wykrycia. W4c: filar zasłania. W4d: RETURN po 60 t bez LOS. W4e: dystans 13 daje RETURN, głuchota 20 t, na spawnie 80 HP. W4f: obrażenia budzą wroga. |
| 5 | Zapowiedź czytelna bez koloru; zejście z pola zawsze = pudło, pozostanie = trafienie | **FAIL** | Czytelność bez koloru OK: odwrócona komórka + `!` + `x` (zrzut w skali szarości). Pozostanie = trafienie 10/10 (W5b). Krok skosem w każdym z 10 ticków = pudło 10/10 (W5a). **Krok prosty z miejsca (A/D/W/S) wciśnięty w ostatnim ticku zapowiedzi (≤ 50 ms przed ciosem) = trafienie** (U1, QA-M0-002). |
| 6 | 1 na 1 bez uników, 20 prób: 7–9 ciosów, 2–4 s, strata 18–54 HP | **PASS** | 20 ziaren: śr. 8,1 ciosu, 2,99 s (2,55–3,35 s), strata śr. 33,2 HP (25–49). 1000 ziaren: mediana 8 ciosów (6–9), strata 24–53 HP. Sprawdzone automatyczną symulacją, nie przez ręczne próby testerów. |
| 7 | Tester po 5 min unika ≥ 70% zapowiedzi (telefon i klawiatura) | **NIE DA SIĘ SPRAWDZIĆ** | Wymaga testerów-ludzi i telefonu. |
| 8 | Śmierć gracza: SIGNAL LOST, respawn po 3 s, reset wroga, `%`. Śmierć wroga: `%`, respawn po 5 s przy dystansie ≥ 8 | **PASS** (nowa gra) | W8a/b: zamrożenie 0,5 s, SIGNAL LOST, respawn po 3 s, 100 HP na (3,3), wróg 80 HP/IDLE na spawnie, `%` w miejscu śmierci. W9a–d, W10: wrak `%` przechodni, brak respawnu przy dystansie < 8, respawn po 100 t, wrak znika. Remis w ticku: wróg ginie, gracz żyje (W11). Zastrzeżenie: po wczytaniu zapisu respawn w złym miejscu (QA-M0-004). |
| 9 | Auto-pauza A–E, wejścia zerowane, brak samoczynnego wznowienia, odliczanie 1 s, liczniki zachowane, bez skoku dt | **PASS** | A: blur, visibilitychange, pagehide, freeze (A1–A3). B: resize. C: Esc/P/`||`. D: pauza w ticku 1. ciosu po ≥ 2 s bez wejścia, aktywny gracz bez pauzy (D, D3). E: po 1200 t. Wejścia wyzerowane (A1b). Po focus/visible gra stoi (A1, A2b). Odliczanie 20×50 ms bez ticków; Esc/blur je przerywa; klawisz wciśnięty w trakcie działa w 1. ticku (C3–C6). Liczniki wroga identyczne po pauzie 10 min (C7). +1 tick po odliczaniu, a w czasie rzeczywistym ~9 ticków zamiast ~90 (C7b, C8). Uwagi: A zasymulowane zdarzeniami (prawdziwej zmiany karty headless nie wykrywa, A4). Brak napisu `You were hit while away.` (QA-M0-006). |
| 10 | Joystick + ATK jednocześnie (wielodotyk), gesty zablokowane | **NIE DA SIĘ SPRAWDZIĆ** | Dotyk to zaślepka (zlecenie). Tylko uwaga. |
| 11 | Wszystkie parametry 1.14 w jednym pliku danych; zmiana bez zmiany logiki | **FAIL** | Zmiana `PLAYER_MOVE_MS` 150→300 i `ENEMY_ATK_WINDUP_MS` 500→1000 działa (6 t/krok, 20 t zapowiedzi). **`MOVE_DEADZONE` 0,15→0,9 nie ma efektu** (wektor 0,5 nadal daje ruch). Wiersze 1.14 są w dwóch plikach: `data/mechanics-m0.ts` i `COMBAT_EXTRAS` w `data/combat-m0.ts` (QA-M0-008). |
| 12 | Ankieta „walka jest przyjemna” ≥ 4/5 | **NIE DA SIĘ SPRAWDZIĆ** | Wymaga ankiety z min. 3 osobami. |

### Zapis i eksport/import (dodatkowo)
| Obszar | Wynik | Dowód |
|---|---|---|
| Zapis przy pauzie/auto-pauzie, odtworzenie po przeładowaniu (pozycja, facing, tick) | PASS | S1, A1 (zapis v3 w `gra.save.v1`) |
| Uszkodzony / nietypowy localStorage (śmieci, `""`, `null`, `[]`, `{}`, v1, v2, wersja `"3"`, v99, ściana, pole wroga, poza mapą, ułamki, stringi, zły facing/seed/rngState, nieznane sekcje, `__proto__`) | PASS (22/22) | S3: brak wyjątków, nowa gra albo poprawna migracja |
| Kod tekstowy `GRA1z.`: eksport → import, kod z odstępami/nowymi liniami | PASS | S5, S5b (kod 168 znaków) |
| Złe kody (pusty, spacje, tekst, sam prefiks, zły base64, obcięty, `{}`, v99, nie-JSON, małe litery) | PASS (10/10) | S6: komunikat „Could not load save”, stan bez zmian, brak błędów konsoli |
| Eksport pliku .json / import (poprawny, pusty, binarny, v1, tablica, v99, 5 MB, BOM) | PASS (9/9) | S7, S8 |
| localStorage zablokowany (tryb prywatny) | PASS | S9 |
| Stan walki w zapisie (HP, wróg, śmierć) | **FAIL** | S2, S10: QA-M0-003 |
| Zapis z nowszej wersji / uszkodzony nie jest chroniony przed nadpisaniem | **FAIL** | S4: QA-M0-005 |
| `tick` bez górnej granicy | **FAIL** | S3b, S3c, O3: QA-M0-007 |

## Lista błędów

### QA-M0-001 – Krótkie tapnięcie kierunku w trakcie cooldownu kroku jest gubione
- **Ważność:** średni · **Obszar:** ruch / wejście (klawiatura) · **Przypisanie:** PROG / Silnik
- **Kroki:** 1) Gracz stoi. Tap D (< 1 tick) daje krok w prawo i cooldown 3 ticki. 2) W ticku 1 cooldownu wcisnąć S na 1 tick (50 ms) albo na 2 ticki (100 ms) i puścić. 3) Odczekać 8 ticków. Wariant: dwa szybkie tapnięcia D (D 1 tick, przerwa 1 tick, D 1 tick).
- **Oczekiwane (§1.2):** „Zmiana kierunku w trakcie cooldownu jest buforowana… Krótkie tapnięcie (≥ 1 tick) daje dokładnie 1 krok.” Krok w dół po końcu cooldownu. Podwójny tap = 2 kroki.
- **Faktyczne:** krok w dół nie następuje, nie zmienia się nawet `facing` (R8, R8b). Podwójny tap daje 1 krok (R8c).
- **Gdzie:** `input/actions.ts:24` (bufor tapnięć tylko dla przycisków, nie dla `move`), `input/keyboard.ts:160` (`latched.clear()` przy każdym `poll`), `entities/movement.ts:28` (`'cooldown'` odrzuca kierunek bez kolejkowania).

### QA-M0-002 – DIAG_GRACE skraca okno uniku: krok prosty z miejsca w ostatnich ~50 ms zapowiedzi nie ratuje
- **Ważność:** średni · **Obszar:** ruch / wejście ↔ walka (kryterium 5) · **Przypisanie:** PROG / Silnik (do decyzji z Mechaniką)
- **Kroki:** 1) Gracz stoi obok wroga, wróg zaczyna zapowiedź (10 ticków). 2) Przed tickiem nr 10 zapowiedzi (≤ 50 ms przed ciosem) wcisnąć A (krok prosty, z pola nie przy ścianie).
- **Oczekiwane (§1.1, kryt. 5):** zejście z pola w trakcie 500 ms zawsze daje pudło. Opóźnienie wejścia ≤ 50 ms.
- **Faktyczne:** trafienie (U1: k=1..9 pudło, k=10 trafienie). Ten sam moment ze skosem (A+S) daje pudło (W5a). Przyczyna: przy ruszaniu z miejsca krok prosty czeka 1 tick na drugi klawisz (DIAG_GRACE), więc efektywne okno dla kroku prostego to 450 ms minus kwantyzacja.
- **Gdzie:** `input/keyboard.ts:146` (grace przy ruszaniu z miejsca). Sprzeczność w specu: §1.2 DIAG_GRACE vs §1.1 „≤ 50 ms”. Potrzebna decyzja: np. brak grace, gdy gracz stoi na zamrożonym polu, albo akceptacja i zmiana kryterium.

### QA-M0-003 – Stan walki nie jest zapisywany: przeładowanie w walce leczy gracza i resetuje wroga
- **Ważność:** wysoki · **Obszar:** zapis / walka · **Przypisanie:** PROG / Gameplay (rejestracja sekcji `combat` przez `registerSaveSection`; infrastruktura Silnika gotowa). Znane odstępstwo z `walka-m0.md` §5.3 i `m0-status.md` pkt 13.
- **Kroki:** 1) W walce: gracz 23 HP, wróg 11 HP. 2) Auto-pauza (blur), zapis do localStorage. 3) Przeładować stronę. Wariant: auto-pauza w trakcie ekranu SIGNAL LOST, potem przeładowanie.
- **Oczekiwane (§1.17, ustalenie Silnika):** „Zapis przy auto-pauzie odtwarza pełny stan co do ticka (…liczniki, stany AI)”. Gracz 23 HP, wróg 11 HP w tym samym stanie AI. Po śmierci: dalej respawn.
- **Faktyczne:** zapis ma tylko `version, savedAt, seed, tick, rngState, player`. Po przeładowaniu gracz ma 100 HP, wróg 80 HP na spawnie (S2). Wariant ze śmiercią: gracz żyje w miejscu śmierci z pełnym HP i pomija respawn (S10). Daje to exploit (przeładowanie = pełne leczenie) i utratę stanu po każdej auto-pauzie A z zamknięciem karty.
- **Gdzie:** `save/index.ts` (`snapshot` – brak zarejestrowanych sekcji), `combat/combat.ts` (brak `serialize`/`deserialize`).

### QA-M0-004 – Po wczytaniu zapisu gracz odradza się w zapisanej pozycji, a nie na starcie mapy
- **Ważność:** średni · **Obszar:** walka / zasady śmierci · **Przypisanie:** PROG / Gameplay (zależność: Silnik musi trzymać spawny mapy w `GameState`). Znane odstępstwo z `walka-m0.md` §5.2.
- **Kroki:** 1) Zapis z pozycją gracza (25,11), obok spawnu wroga (27,10). 2) Wczytać grę. 3) Dać się zabić.
- **Oczekiwane (§1.8):** respawn „na punkcie startu” (3,3).
- **Faktyczne:** respawn na (25,11), tuż obok zresetowanego wroga (S11). Grozi to pętlą śmierci przy zapisie obok wroga.
- **Gdzie:** `combat/combat.ts:80` (`defaultSpawn` = pole gracza przy pierwszym ticku walki).

### QA-M0-005 – Zapis z nowszej wersji (lub nieczytelny) jest po cichu ignorowany i nadpisywany przy pierwszej pauzie
- **Ważność:** średni · **Obszar:** zapis / IO · **Przypisanie:** PROG / Silnik
- **Kroki:** 1) W localStorage `gra.save.v1` zapis `version: 4`, gracz (30,15) (np. po powrocie z nowszej wersji gry albo z innej karty). 2) Otworzyć grę: start nowej gry na (3,3), w konsoli tylko `console.warn`. 3) Blur albo Esc.
- **Oczekiwane:** zapis nowszej wersji nie zostaje zniszczony. Gracz dostaje komunikat, a gra trzyma kopię albo nie nadpisuje bez potwierdzenia.
- **Faktyczne:** przy pierwszej auto-pauzie zapis v4 zostaje nadpisany zapisem v3 nowej gry na (3,3) (S4). Tak samo każdy uszkodzony zapis znika bez śladu (S4b).
- **Gdzie:** `save/storage.ts:26–37` (`readSave` zwraca `null`), `main.ts:57` (`fromSave` → nowa gra), `main.ts:112–115` (`save` nadpisuje klucz).

### QA-M0-006 – Brak komunikatu „You were hit while away.” przy auto-pauzie D
- **Ważność:** niski · **Obszar:** auto-pauza · **Przypisanie:** PROG / Silnik (powód pauzy dla D; wyświetla UI). Znane odstępstwo z `walka-m0.md` §5.4.
- **Kroki:** 1) 3 s bez wejścia. 2) Wróg trafia gracza, gra się pauzuje.
- **Oczekiwane (§1.11):** `PAUSED` + `You were hit while away.`
- **Faktyczne:** „PAUSED | Paused automatically. Progress saved.” bez informacji o trafieniu (D2).
- **Gdzie:** `main.ts` (`autoPause()` bez powodu D), `ui/overlay.ts:127`. Walka emituje `autoPauseRequest {reason:'hitWhileAway'}` (`combat/combat.ts:650`).

### QA-M0-007 – Walidacja zapisu nie ogranicza `tick`: przy 2^53 symulacja przestaje liczyć ticki
- **Ważność:** niski · **Obszar:** zapis / IO (przepełnienie) · **Przypisanie:** PROG / Silnik
- **Kroki:** zaimportować zapis (localStorage, kod albo plik) z `tick: 9007199254740992` (2^53) albo `1e300`.
- **Oczekiwane:** odrzucenie zapisu (np. `tick > Number.MAX_SAFE_INTEGER` albo rozsądny limit) albo poprawna dalsza praca.
- **Faktyczne:** zapis przyjęty, `state.tick` stoi w miejscu (`tick++` nic nie zmienia) (S3b, S3c). Skutek: auto-pauza D przestaje działać (O3); zależy też od tego regeneracja po walce i animacja kroku. Ruch działa (O1).
- **Gdzie:** `save/schema.ts:90` (tylko `Number.isInteger && >= 0`).

### QA-M0-008 – `MOVE_DEADZONE` z pliku danych nie działa; parametry 1.14 są w dwóch plikach
- **Ważność:** niski · **Obszar:** dane / parametry (kryterium 11) · **Przypisanie:** PROG / Silnik (`toDir8` / `stepGame`). Rozbicie plików do uzgodnienia z Gameplay.
- **Kroki:** w kopii gry zmienić `MOVE_DEADZONE` w `data/combat-m0.ts` z 0,15 na 0,9 i podać ruch wektorem 0,5.
- **Oczekiwane:** brak kroku (wektor poniżej martwej strefy). Wszystkie wiersze 1.14 w jednym pliku.
- **Faktyczne:** gracz robi kroki (K11: `ruchPrzyWektorze05: 2`). `toDir8` ma martwą strefę na sztywno, a `stepGame` nie przekazuje parametru. `PLAYER_DEATH_FREEZE_MS`, `TELEGRAPH_FAST_BLINK_MS`, `STRIKE_FX_MS`, `HIT_VIBRATE_MS`, `MOVE_DEADZONE` i `ARENA_*` są w `data/combat-m0.ts`, reszta w `data/mechanics-m0.ts`.
- **Gdzie:** `input/actions.ts:57` (`deadZone = 0.15`), `core/game.ts:95`.

### QA-M0-009 – Przeciwne klawisze: D trzymane + A zatrzymuje postać zamiast iść w ostatni kierunek
- **Ważność:** niski · **Obszar:** ruch / wejście (klawiatura) · **Przypisanie:** PROG / Silnik (do potwierdzenia z Mechaniką)
- **Kroki:** trzymać D (marsz w prawo), potem wcisnąć i trzymać A, nie puszczając D.
- **Oczekiwane (§1.2):** „obowiązuje ostatni trzymany kierunek”, czyli marsz w lewo.
- **Faktyczne:** postać staje, bo oba kierunki się znoszą (R9).
- **Gdzie:** `input/keyboard.ts:136–137`.

## Uwagi (nie błędy)
- Dotyk to zaślepka. Kryterium 10 i telefonowe części 2, 5, 7 i 12 są niesprawdzone. Z kodu: `input/touch.ts` i `ui/touch-controls.ts` istnieją, ale ich nie testowałem.
- Prawdziwej zmiany karty w headless Chrome nie da się wykryć (`visibilityState` zostaje `visible`, A4). Wyzwalacz A sprawdziłem zdarzeniami `blur`, `visibilitychange`, `pagehide` i `freeze`. Do potwierdzenia ręcznie na urządzeniu.
- Klawisz trzymany od przed pauzy nie działa po wznowieniu, dopóki go nie puścić i nie wcisnąć ponownie (A1b). Klawisz wciśnięty w trakcie odliczania działa w 1. ticku (C6). Zgodne z README, ale §1.11 można czytać szerzej („trzymane w momencie końca odliczania”). Warto potwierdzić z Mechaniką.
- Pierwsza klatka po wznowieniu ma delta 0, więc odliczanie trwa ok. 1 klatkę dłużej niż 1000 ms (≈ 16 ms przy 60 Hz). Bez znaczenia.
- Klawisze spoza mapowania (np. Shift) nie liczą się jako aktywność dla wyzwalacza E (E2). Wydaje się to zamierzone.
- Przytrzymanie ATK bez celu daje dokładnie 1 cios w `facing` (pierwszy tick to zbocze = tap), potem nic (W2a). Zgodne z §1.3.
- `walka-m0.md` wciąż opisuje zapowiedź jako `c`→`C`. W grze jest odwrócona komórka `c`, zgodnie z v0.3. Dokument do aktualizacji.
- Kod zmieniał się w trakcie testu, więc przed retestem warto zamrozić wersję (tag lub commit).

---

## Retest 25.10.2026 (CET), HEAD 7ecc65c04e5b4de6a8ff8b46edc23aeebf408fdc

Zakres: QA-M0-003 i QA-M0-004 (Gameplay) oraz regresja zapisu, eksportu i importu. HEAD zawiera 4ff045e (poprawki Gameplay) i 7ecc65c (naprawa `src/data/style.ts`).

### Środowisko
- `qa/testy/snapshot-7ecc65c/`: czysty HEAD. **Nie buduje się** (zob. QA-M0-010):
  - `tsc` zwraca błędy;
  - `vite build` przerywa się;
  - w vitest 1 plik nie przechodzi (308 testów zaliczonych).
- `qa/testy/snapshot-7ecc65c-plus2/`: HEAD plus 2 niezacommitowane pliki z drzewa roboczego (`src/ui/settings.ts` i `src/contracts/save.ts`, hashe w `QA-DOLOZONE-PLIKI.txt`).
  - Wynik: `tsc` OK, vitest 315/315 (w tym `tests/combat-m1-round.test.ts`), `vite build` OK.
  - **Wszystkie testy retestu uruchomiono na tej kopii.**
- Skrypty:
  - `t-retest-003-004.mjs` → `wyniki-retest-003-004.txt`;
  - `t-retest-start.mjs` → `wyniki-retest-start.txt`;
  - `run-all.sh` (sparametryzowany zmiennymi SNAP, PORT i OUT) → `retest-7ecc65c/`;
  - `unit/walka-sim-7ecc65c.test.ts`.
- Metoda: ręczne sterowanie pętlą, tick po ticku. Po wczytaniu porównuję ślad stanu ze śladem referencyjnym tick po ticku.

### Statusy
| Błąd | Status | Uzasadnienie |
|---|---|---|
| QA-M0-003 (przeładowanie leczy, pomija śmierć, gubi walkę) | **NAPRAWIONY** (rdzeń) | Szczegóły pod tabelą. Pozostałe problemy w okolicy to nowe błędy QA-M0-011 i QA-M0-012. |
| QA-M0-004 (respawn w miejscu wczytania) | **NAPRAWIONY** | Szczegóły pod tabelą. |

**QA-M0-003.** Zaliczone przypadki:
- R3a: śmierć, potem blur na SIGNAL LOST (po 30 t) i w fazie zamrożenia (po 3 t), potem przeładowanie.
  - Gracz nadal jest martwy.
  - Respawn następuje dokładnie po pozostałych tickach (40 i 67), na (3,3), ze 100 HP.
  - Wróg jest zresetowany, wrak odtworzony.
- R3b: zapis w walce w punktach przed zapowiedzią, przy aw=10/6/2/1 i w cooldownie. Stan po wczytaniu jest identyczny jak przed zapisem, a kolejne 80 ticków też.
- R3c: HP 23 / wróg 11 zostaje bez leczenia; regeneracja przebiega identycznie.
- R3d: wrak i licznik respawnu wroga są zachowane.
- R3g: gracz stojący na wraku.

**QA-M0-004.** Zaliczone przypadki:
- R4a: zapis na (25,11), przeładowanie, śmierć. Respawn na (3,3).
- R4b: to samo dla zapisu v3 bez sekcji `combat` i dla zapisu v2.

**Uwaga o R3b „tick ciosu+0”:** jedyna różnica w śladzie to efekt `*` (`combat-fx`) przez 1 klatkę po ciosie. Efekt nie jest zapisywany. HP, pozycje i stan AI są identyczne. To kosmetyka, nie błąd.

### Regresja zapisu, eksportu i importu
- R4c: migracja sekcji combat v1 → v2 zachowuje HP i pozycje. PASS.
- R4d: uszkodzona sekcja combat odrzuca cały zapis i tworzy kopię zapasową. PASS.
- R4e: kod eksportu (977 znaków) zrobiony w trakcie walki importuje się poprawnie. PASS.
- `run-all.sh`:
  - M0: 114 PASS / 11 FAIL;
  - retest: **126 PASS / 3 FAIL**.
- Teraz przechodzą S2, S3b, S3c, S4, S10, S11, O3, D2, R8/R8b/R8c i U1. Odpowiadają im QA-M0-001/002/003/004/005/006 i inne.
  - Statusów błędów Silnika nie oceniam formalnie, bo nie były zlecone do retestu.
- Pozostałe 3 FAIL to nie błędy gry:
  - A4: ograniczenie headless (zmiana karty niewykrywalna), tak samo jak w M0.
  - S3 „pozycja ułamkowa” i S3 „combat {hp:5}”: walidacja jest teraz ścisła, więc gra odrzuca zapis (nowa gra plus kopia zapasowa) zamiast go zaokrąglać lub ignorować. To zamierzona zmiana polityki, a test ma nieaktualne oczekiwanie.
- Symulacja walki 1 na 1 (K6) na nowym kodzie: 3/3 PASS.
- Brak błędów w konsoli.

### Nowe błędy

**QA-M0-010: HEAD 7ecc65c nie buduje się. Silnik, priorytet wysoki.**
- Kroki: `git checkout 7ecc65c` w czystym klonie, potem `npx tsc --noEmit`, `npx vite build` i `npx vitest run`.
- Oczekiwane: build i testy przechodzą.
- Faktyczne:
  - `src/main.ts:43` importuje `reduceMotion` z `./ui/settings`, ale ten eksport istnieje tylko w niezacommitowanej zmianie `settings.ts` (commit 435c648);
  - `tests/contracts-integration.test.ts` importuje nieśledzony plik `src/contracts/save.ts` (commit 135e9ad);
  - skutek: błędy `tsc`, `vite build` się przerywa, 1 plik testów nie przechodzi.
- Rozwiązanie: zacommitować oba pliki.

**QA-M0-011: po wczytaniu zapisu z trwającą walką gra rusza od razu, bez pauzy i odliczania. Silnik, priorytet wysoki.**
- Kroki: walka przy 50 HP, wróg 3 ticki przed ciosem. Utrata fokusu (auto-pauza i zapis). Przeładowanie strony bez żadnego wejścia.
- Oczekiwane: gra po wczytaniu startuje w pauzie (albo z odliczaniem 3-2-1), więc gracz nie traci HP, zanim cokolwiek zrobi.
- Faktyczne:
  - `loop.mode` ma wartość `running` od około 280 ms po załadowaniu;
  - nie ma nakładki;
  - po około 2 s gracz ma 16 HP zamiast 50 (2 ciosy).
  - Auto-pauza D nie zadziałała, bo od wczytania nie minęło jeszcze 2 s.
- Uwaga: przed poprawką QA-M0-003 problem był niewidoczny, bo walka nie była zapisywana. W M1 (permadeath) może zabić postać przy ponownym otwarciu gry.
- Test: `t-retest-start.mjs` ST1.

**QA-M0-012: gracz zapisany na polu spawnu wroga (E) ląduje po wczytaniu na starcie mapy (3,3). Silnik, priorytet średni (uwaga dla Gameplay).**
- Kroki: wróg goni gracza. Gracz staje na polu E (27,10), wróg jest na (25,10), HP 60. Zapis (blur) zawiera `player {x:27,y:10}`. Przeładowanie.
- Oczekiwane: gracz na (27,10).
- Faktyczne:
  - gracz pojawia się na (3,3) z 60 HP;
  - wróg jest odtworzony na (26,9) w stanie `attack`.
  - Daje to darmową teleportację ucieczki przez przeładowanie.
- Przyczyna: w `gameFromSave` (`src/save/index.ts:74`) `placePlayer` sprawdza zajętość pola wobec atrapy wroga z mapy, zanim `applySections` i `applyCombat` (linia 87) ją usuną.
- Test: `t-retest-003-004.mjs` R3f.

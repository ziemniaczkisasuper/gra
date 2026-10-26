# Plan testów M1: perspektywa gracza (QA / Tester 2)

Autor: [GRA][QA] Tester 2. Status: **v0.4.1, PROPOZYCJA** dla Producenta i Game Directora.
Zakres: grywalność, balans, trudność i czytelność M1 z perspektywy gracza.

## Dziennik zmian
- **2026-10-25, v0.4.1:** weryfikacja `mechaniki-m1.md` v0.5.2 (stan ~22:00), Power Lines **v0.5.1**, `balans-m1.md` v1.2 i zmiana kierunku walki.
  - **Błąd QA w v0.4 usunięty:** rozjazd „ID przycisków Skip tutorial” w R33 był czytany z wcześniejszej wersji. Mech v0.5.2 ma dwa różne okna: „Skip tutorial” (`M1_TUT_SKIP_PROLOGUE_YES` „SKIP” / `_NO` „PLAY”, fokus i Esc = PLAY) i **po SKIP** „Show hints?” (`M1_TUT_SKIP_YES` / `_NO`, fokus i Esc = YES); po PLAY drugiego okna nie ma. Zgodne z tekstami. D0 krok 8 testuje oba okna w kolejności.
  - **TIP-y:** 24 × `M1_TERM_xx_TIP_1/2/3` zatwierdzone przez GD; po podstawieniu tokenów z JSON v0.5.1 (jedyny token `{source_power}` w `M1_TERM_06_TIP_1`, 13 × skala maks. 2 = 26) **maks. 80 znaków** (`M1_TERM_01_TIP_2`, `M1_TERM_03_TIP_3`), limit UI 90. Uwaga w C7 zamknięta.
  - **Power Lines v0.5.1 (LUZ / Pracownik 1):** `validate.py` WYNIK OK (2 uwagi „szybciej niż cel” dla 05 i 01), uwagi o starych ID `_TIP` **zniknęły** (JSON ma `hint.text_ids`); `--selftest` 17/17 OK; `--gen-test 1000 --seed 2026`: wynik w B3 krok 1. Pułapka [4,5] w 03 usunięta, czasy z heurystyki LUZ w limitach. **R27 i B3 odblokowane** (B3 = pomiar kalibrujący M-P4, do akceptacji GD).
  - **Zamknięte (zweryfikowane w mech v0.5.2):** R28 (`TUT_HINT_HIDE_ON_THREAT`, 14 px jako wyjątek < 360 px i w pionie), R29 (Enter i Spacja na fokus, domyślnie STAY, brak skrótu GO DOWN), R30 (`RISK_EXPLAINER_PAGE_LOCK_MS` 1500 / 500), R31 (`EVAC_CALL_INTERRUPT_ON_DAMAGE` = false), R32 (2400 HP; 2600 tylko przy medianie D7 < 65 s w paśmie 44–52 DPS), R33 w większości (kod FX, `fx-params.ts`, teksty §2.19, odesłanie D7 poprawione). Zostają drobne resztki (R33).
  - **Nowe ryzyko R34:** wezwanie windy bez przerywania przez obrażenia jako „przycisk ucieczki” (A7 scenariusz nadużycia).
  - **Balans v1.2:** `START_CREDITS` = 50 (R16 zamknięte), `STASH_SLOTS` 30 / 40 / 50 / 60, Issue Mk2 po przystanku g2 i broń r1 na półce po śmierci (R20 obniżone). Nowy test pojemności skrytki (D4a).
  - **Zmiana kierunku (właściciel):** broń dystansowa i twin-stick, specyfikacja się zmieni. Testy komfortu walki wręcz i sterowania (R10, A5, C4, część R11 o sterowaniu) **WSTRZYMANE** do nowej specyfikacji; dopisane pytania QA na przyszłość (§6a). A4 (reguła zapowiedzi na danych) zostaje, bo dotyczy każdego ataku, także pocisków.
  - Poprawiona nazwa pola: `consumers[].consumer_type` (było `consumers[].consumer_type`).
- **2026-10-25, v0.4:** retest po `mechaniki-m1.md` **v0.5.2** (R25–R28, R6 wariant A, ekran śmierci, boss).
  - **Zamknięte:** R25 (STAY zostawia na `>`), R26 (T04: zapowiedź − 100 ms, auto-pauza ma pierwszeństwo). **R6:** GD wybrał wariant A; ryzyko obniżone do średniego, zostaje dla gracza ściganego (R31).
  - **Otwarte:** R27 (zablokowane: `zagadki-m1/` nadal v0.4 z „60–120 s” i pułapką [4,5] w `M1_TERM_03`); R28 częściowo (pasek na dole chroni tylko promień 3 od `@`, a Line Sentry zapowiada z 6 pól).
  - **Rozjazdy v0.5.2 z kodem i dokumentami (R30, R33):** `fx-m1.ts` `fx_death_screen` przyjmuje ATK (Spacja) jako NEXT; `fx-params.ts` ma `DEATH_SCREEN_AUTO_MS` jako „stale, auto removed”; `ui-m1.md` ma „Enter = przycisk z fokusem” i CONTINUE; tabela T01–T13 w §2.19 ma stare teksty; §2.7a „2 krótkie zdania” zamiast 2 stron; ID przycisków „Skip tutorial” różne w mech i tekstach; reguła bossa w mech/Balansie odsyła do „QA B1” zamiast D7.
  - **Boss (D7, policzone):** `boss_v05.py` Balansu (bez zmian w pliku, uruchomione z `/tmp/boss_qa.py`, 3000 walk na punkt). 2400 HP, 48 DPS: 70 / 68 / 62 s przy wykorzystaniu wręcz 0,5 / 0,6 / 0,7; 38 DPS (przeciętny po 1 h): 75–86 s; 58 DPS (dobry po 1 h): 53–60 s. **< 65 s wychodzi przy 48 DPS tylko przy wykorzystaniu 0,7 i przy każdym DPS ≥ ~52.** Nowe ryzyko R32 (decyzja 2600 HP zależy od założenia 0,6 i od tego, kto dochodzi do bossa).
  - **Nowe ryzyka:** R29 (Enter = GO DOWN przy fokusie na STAY), R30 (ekran śmierci: auto 5 s i NEXT przenoszony na wyjaśnienie), R31 (R6 A nie ratuje gracza ściganego z niskim HP), R32 (reguła 2600 HP), R33 (rozjazdy danych v0.5.2).
  - Zaktualizowane: A1, A3, A7, B1, B3, D0, D7, W9, pytania i załącznik.
- **2026-10-25, v0.3.1:** teksty Dialogów i Lore dla zagadki, śmierci, ryzyka i Prologu (`fabula/teksty-m1-en.md` §11.5 i §12, **wszystko do akceptacji GD**).
  - **Podpowiedzi stopniowane:** każdy wariant ma `M1_TERM_xx_TIP_1/2/3` (24 ID) odsłaniane przyciskiem `M1_TERM_BTN_MORE`; dawne pojedyncze `M1_TERM_xx_TIP` nie istnieją. B3 krok 7 sprawdza stopnie; dotyczy też `M1_TERM_03` i `M1_TERM_06` (wcześniejsza uwaga v0.3 o ich braku jest nieaktualna).
  - **Braki zamknięte:** teksty `M1_TUT_*` i `M1_RISK_*` są w §12. Pytania 22 i 23 zamknięte (do akceptacji GD); wiersz w załączniku zamknięty.
  - **Porównanie ID z mech §2.7a i §2.19:** wszystkie ID z Mechanik mają tekst. Rozjazdy (nowe ID, zmiany treści, ID bez pokrycia w mech) zebrane w nowym scenariuszu **C9**; najważniejsze: `M1_RISK_01B` na bramie bossa, `M1_RISK_04` ma 3 zdania / 38 słów przy limicie 2 zdań, `M1_TUT_04` opiera unik na kolorze („Yellow !”).
  - **Limity słów:** wszystkie podpowiedzi `M1_TUT_*` ≤ 8 słów (zgodne z §2.19); 13 z 24 podpowiedzi `TIP` > 90 znaków (do 135 zn., pytanie 21 tekstów do UI).
  - **A2:** nowe teksty nie obiecują odzysku. `M1_RISK_04` wprost mówi „You cannot get them back from your body.” A2 dostaje wyjątek dla zaprzeczeń i wzorzec „go back for” zamiast samego „go back” (`M1_TUT_11` „Now go back to the lift.”).
  - Specyfikacja Power Lines jest już w **v0.4** (osobne ID tekstu dla każdego wyniku, tokeny z symulacji); źródła zaktualizowane.
  - **Uwaga dla LUZ / Pracownik 1 (bez zmiany `validate.py`):** przyczyna ostrzeżeń `validate.py` (B3 krok 1, pytanie 14a).
- **2026-10-25, v0.3:** Balans odblokowany, specyfikacja zagadki dostępna, test na iPhonie.
  - **Balans** (`design/balans-m1.md` v1.0, propozycja do akceptacji GD): D2 i D6 rozpisane w pełni na danych, policzone wskaźniki pierwszej godziny (§3d). Zaktualizowane:
    - R4 (strata i odbudowa, półka sklepu);
    - R13 (nagrody kontraktów);
    - R15 (12 właściwości i Narzędzie zdefiniowane);
    - R16 (**kredytów startowych nadal brak** w `balans-m1.md`);
    - W6 (budżet HP z symulacji grupowej);
    - W9 (boss).

    **Wartości bossa i sklepu mogą się jeszcze zmienić po decyzjach GD** (pytania 1, 2 i 5 w `balans-m1.md`).
  - **Nowe ryzyka balansu R18–R24:**
    - R18: Lights poza pierwszą godziną (Copper);
    - R19: g2 → g3 bez powrotu jako pułapka;
    - R20: odbudowa zależna od „zapasu w skrytce” i półki ×4;
    - R21: nadmiar kredytów i pułap DPS;
    - R22: konflikt definicji `M1_AFFIX_11`;
    - R23: rozjazd danych między dokumentami i kodem;
    - R24: bonus Narzędzia zerowany przez zaokrąglenie w dół.
  - **A4 (stan końcowy v0.3, po synchronizacji o ~21:20):** reguła v0.5 to `ENEMY_WINDUP_MIN_MS` = 450 ms (9 ticków), czyli „zapowiedź − tick ≥ 400 ms” z `zespol.md` (450 − 50 = 400, spójne). Tabele mech 2.11/2.16, `balans-m1.md` v1.1 §2 i kod (`combat-m0.ts`: `d` 450, `s` 450) mają już 450 ms. **Wszyscy wrogowie ZGODNI, R3 zamknięte** (A4 zostaje jako test regresji). Dodany test przywołania bossa (600 ms, bez `!`, bez obrażeń).
  - **Mechaniki v0.5 jako podstawa planu:** testy podpięte pod nowe sekcje: budżet krótkiej sesji §2.2 (B1, B3), zabezpieczenia przed stratą §2.7a (A3, R4), nauka gry w Prologu §2.19 (D0, R5), pakiet R6 w 2.9 (A7).
  - **Nowe ryzyka z sekcji v0.5:** R25 (STAY w potwierdzeniu zejścia cofa gracza na pole zapowiedzi), R26 (zamrożenie T04: „zostaje 350 ms” nie zgadza się z zapowiedzią Curfew Guarda 600 ms), R27 (budżet §2.2 zakłada zagadkę 30–90 s, a specyfikacja Power Lines 60–120 s i `M1_TERM_03` 2–3 min; każdy wariant gracz rozwiązuje tylko raz), R28 (pasek podpowiedzi u góry a HUD i strefa bezpieczna kamery).
  - **`balans-m1.md` v1.1:** boss 2400 HP / 20–32 / 800 / 1200 ms potwierdzony przez GD; półka ×4 [GD]; `CONTRACT_ENEMY_LOOT` = 0 [GD]; nowe ujścia kredytów §7 (do decyzji GD); progresja §6 przeliczona (wariant C). D2 i D7 uzupełnione o v1.1. R23 w większości zamknięte.
  - **Pytanie 6.1 zamknięte:** `zespol.md` linia 25 zawiera „od otwarcia gry do podsumowania, mediana ≤ 3 min, p80 ≤ 4 min” (sprawdzone). Zakres 30 s–3 min zostaje tylko w wizji jako opis doświadczenia, nie próg. Zamknięte też pytanie o czas wyjazdu windy (`LIFT_RIDE_MS` = 2 s, mech v0.5).
  - **B3 rozpisany** na specyfikacji LUZ / Pracownik 1 (`design/zagadki-m1/`, propozycja v0.1, czeka na Mechaniki i GD). `validate.py` przechodzi (8/8 wariantów).
  - **Nowy test B7:** prawdziwy iPhone po publikacji, wykonuje właściciel (Safari, kilka dni bez wizyty, ekran główny, przypomnienie o eksporcie). R7: w kodzie są już `navigator.storage.persist()` i przypomnienia (`src/save/`, `data/save-reminder.ts`).
- **2026-10-25, v0.2:** aktualizacja po decyzjach Producenta i Game Directora (`zespol.md`).
  - **Metody bez ludzkich testerów (GD):** usunięte playtesty z testerami, think-aloud i ankiety dla testerów. Testy to symulacja, boty QA i granie właściciela z krótkim kwestionariuszem (§4).
  - **Kryteria (GD):** progi [QA] są tylko **wskaźnikami**, nie kryteriami zaliczenia. Wyjście z M1 to:
    - testy techniczne: zapis działa w 100%, brak obrażeń od niewidocznego wroga;
    - potwierdzenie właściciela po zagraniu, że chce grać dalej (§2.1).
  - **Krótka sesja:** mierzona od otwarcia gry do podsumowania, mediana ≤ 3 min, p80 ≤ 4 min (decyzja GD przekazana 25.10.2026). **Zastępuje** wcześniejsze rozstrzygnięcie Producenta „30 s–3 min na czynność / kontrakt BASE 1,5–3 min”. R8 rozstrzygnięte.
  - **Zapowiedź ciosu (GD):** obowiązuje reguła „zapowiedź minus tick ≥ 400 ms”. R3 nie jest zablokowany. Dodany test reguły dla każdego wroga (A4). Panel Drone i Scrapper (400 ms) są oznaczone jako **NIEZGODNE**, dopóki Mechaniki nie zmienią wartości.
  - **R1:** teksty M1_BASE_03 i M1_BASE_14 poprawione przez Dialogi i Lore, czekają na akceptację GD. Dodany test regresji (A2).
  - **R2, R4:** GD przyjął przyczynę śmierci na ekranie śmierci i w podsumowaniu oraz informacyjne zabezpieczenia przed stratą. Dodane testy wdrożenia (A1, A3).
  - **R5:** właściciele nauki gry: Mechaniki z UI i Menu, teksty Dialogi i Lore, wplecione w Prolog. Dodany scenariusz D0 (nauka gry w Prologu).
  - **Braki w toku z właścicielami:**
    - zagadka Power Lines: LUZ / Pracownik 1;
    - właściwości i kredyty startowe: Balans i Ekonomia;
    - ekrany M1: PROG / UI i Menu.
  - Źródła: `styl-ascii.md` jest już **ZATWIERDZONY** (v1.2, v1.3 = nazwa drona). Rzadkości Salvaged / Tuned / Grid-Grade są ostateczne.
- **2026-10-25, v0.1:** pierwsza wersja (ryzyka, cele, scenariusze, metody z testerami, szablon, pytania).

**Źródła:**
- `plan-produkcji.md`;
- `design/mechaniki-m1.md` **v0.5** (tabele 2.11/2.16 zsynchronizowane z regułą 450 ms; nowe §2.2 budżet sesji, §2.7a, §2.19);
- `design/balans-m1.md` **v1.1** (propozycja do akceptacji GD; boss, półka i `CONTRACT_ENEMY_LOOT` już z decyzją GD) + `design/balans-m1-review.md` §6;
- `design/zagadki-m1/` (Power Lines, **propozycja v0.4**, LUZ / Pracownik 1);
- `graf/styl-ascii.md` (v1.3, zatwierdzony);
- `zespol.md` (decyzje Producenta i GD z 25.10.2026).

**Kontekst:** `wizja-gry.md`, `design/balans-m1-review.md` i `design/balans-sim/`, `design/level-design-m1.md`, `prog/sterowanie.md`, `prog/m0-status.md`, `prog/zrzuty/`, `fabula/zakres-m1.md`, `fabula/teksty-m1-en.md`.

**Oznaczenia:**
- **[D: źródło]**: liczba lub zasada z dokumentu projektu albo z decyzji. Przykład: [D: mech 2.4] = `mechaniki-m1.md` §2.4; [D: GD] = decyzja Game Directora 25.10.2026.
- **[QA]**: wskaźnik zaproponowany przez QA. Nie jest kryterium zaliczenia (decyzja GD). Przekroczenie oznacza zgłoszenie i informację dla działu, a nie blokadę M1.
- **Wykonawca scenariusza:**
  - **[SYM]**: symulacja (skrypty Balansu lub headless symulacja logiki gry na danych z `src/data/`);
  - **[BOT]**: bot QA (Tester 1 / Tester 2), czyli automatyczna gra w przeglądarce headless, pomiary i przegląd zrzutów;
  - **[WŁ]**: granie właściciela.
- „(przeliczenie QA)” oznacza wartość wyliczoną z liczb z dokumentów.

---

## 1. Ryzyka dla grywalności widoczne w dokumentach

| # | Ryzyko | Priorytet | Status | Właściciel |
|---|---|---|---|---|
| R1 | Teksty po śmierci obiecywały odzysk, którego w M1 nie ma | wysoki | **poprawione w tekstach, czeka na akceptację GD**; test regresji A2 | Dialogi i Lore → GD |
| R2 | Brak przyczyny śmierci na ekranie śmierci i w podsumowaniu | wysoki | **decyzja GD: wdrożyć**; mech v0.5.2 §2.7: `M1_DEATH_01/02`, NEXT od 1500 ms, auto po 5000 ms; czas czytania w R30; test A1 | UI i Menu (ekrany), Dialogi i Lore (teksty) |
| R3 | Zapowiedź 400 ms (Panel Drone, Scrapper) łamała regułę „zapowiedź − tick ≥ 400 ms” | wysoki | **ZAMKNIĘTE (v0.3):** `ENEMY_WINDUP_MIN_MS` = 450 w mech v0.5, Balansie v1.1 i kodzie; wszyscy wrogowie ZGODNI; A4 jako regresja | — (regresja: Mechaniki, PROG / Gameplay) |
| R4 | Pełna utrata bez łagodzenia: pierwsza duża strata może wypchnąć z gry | wysoki | **decyzja GD, zaprojektowane w mech §2.7a** (`M1_RISK_01–04`, domyślnie ON); teksty i UI do zrobienia; trudność bez zmian. Odbudowa: półka ×4 [GD] i zapas w skrytce; testy A3, D4; zob. R25 | UI i Menu, Dialogi i Lore |
| R5 | Brak projektu nauki gry w M1 | wysoki | **projekt dostarczony (mech §2.19, T01–T13)**; teksty `M1_TUT_*` dostarczone (teksty §12.3, do akceptacji GD); brak elementów UI; testy D0, C9; zob. R26, R28 | Mechaniki + UI i Menu, teksty Dialogi i Lore |
| R6 | Ewakuacja przy niskim HP może być pułapką | średni (było wysoki) | **GD: wariant A** (mech v0.5.2 2.9, kod `fx-m1.ts` zgodny): alarm przy przyjeździe, wezwanie 1,0 s, ponowne po 5 s; zostaje przypadek ściganego gracza (R31); test A7 | Mechaniki |
| R7 | Zapis na iOS Safari może zniknąć po kilku dniach | wysoki | środki w kodzie (`persist()`, przypomnienia o eksporcie, podpowiedź iOS); **do weryfikacji na iPhonie**: B6, B7 (E1) | PROG / Silnik i Narzędzia |
| R8 | Niespójny cel długości krótkiej sesji | średni | **ROZSTRZYGNIĘTE (GD):** otwarcie gry → podsumowanie, mediana ≤ 3 min, p80 ≤ 4 min; test B1 | — |
| R9 | Restore Relay zależy od zagadki | średni | **specyfikacja v0.1 dostarczona** (czeka na Mechaniki i GD); B3 rozpisany | LUZ / Pracownik 1 |
| R10 | Bump attack a unik na joysticku | średni | **WSTRZYMANE (v0.4.1):** zmiana kierunku na broń dystansową i twin-stick, czeka na nową specyfikację; A5 wstrzymany | Mechaniki + UI i Menu |
| R11 | Telefon: tłok kontrolek, mapa pod kciukami i HUD-em, niski ekran poziomo | średni | **w toku** (ekrany M1); testy A6, C4, C5 | PROG / UI i Menu |
| R12 | Rozróżnialność symboli | średni | otwarte (styl zatwierdzony, pary do pomiaru); test C3 | GRAF / Concept i Styl |
| R13 | Słabe nagrody kontraktów dostępnych w 1. godzinie | średni | Balans potwierdził wartości (Clear the Path g1 = 1 patch); otwarte jako wskaźnik; test B4 | Balans i Ekonomia |
| R14 | Niski kontrast terenu w słońcu | niski | otwarte; test C2 | GRAF / Concept i Styl |
| R15 | Slot Narzędzie i właściwości bez funkcji | niski | **zdefiniowane** (`balans-m1.md` §3); test D6; pozostają R22, R24 | Balans i Ekonomia |
| R16 | Brak kredytów startowych i stanu startowego | niski | **ZAMKNIĘTE (v0.4.1):** `START_CREDITS` = 50, pusta skrytka, Issue + 2 Med-Patche, przystanek g1 (`balans-m1.md` v1.2, mech 2.16) | — |
| R17 | Boss i głęb. 3 poza pierwszą godziną | niski | Balans: boss u przeciętnego gracza po ~3 h; wartości bossa czekają na GD; test D7 | Balans i Ekonomia, Mechaniki |
| R18 | Ulepszenie „Lights” (widoczny postęp) wypada poza pierwszą godziną | średni | **nowe**; D2 | Balans i Ekonomia |
| R19 | Zejście g2 → g3 bez powrotu: ~91% śmierci u przeciętnego gracza | średni | **nowe**; A3, A8 | Mechaniki + UI i Menu (treść potwierdzenia), Balans |
| R20 | Odbudowa po śmierci bez zapasu w skrytce | niski (było średni) | **Balans v1.2:** Issue Mk2 po przystanku g2 (DPS ~32,8 ≥ 30) + broń r1 na półce po śmierci; odbudowa bez zapasu 2 wyprawy (p80 3); skrytka 30 slotów wystarcza na zapas (D4a) | Balans i Ekonomia |
| R21 | Nadmiar kredytów od ~90 min, pułap DPS 70–75 skraca bossa do ~40 s | niski (poza 1. godziną) | **nowe**, czeka na GD; D7 | Balans i Ekonomia → GD |
| R22 | `M1_AFFIX_11`: Balans „−% kanałowania”, a LUZ proponuje inny efekt | niski | **nowe**; D6 | Balans + Mechaniki + LUZ / Pracownik 1 |
| R23 | Rozjazd danych między dokumentami i kodem | niski | **w większości zamknięte (v0.3):** `d`/`s` 450 ms i boss 20–32 / 1200 ms zgodne w mech, Balansie i kodzie; testy dalej liczą z `src/data/`; A4, D6, D7 | Mechaniki, Balans, PROG / Gameplay |
| R24 | Bonus Narzędzia (+10–20% Scrap, zaokrąglenie w dół) daje 0 przy zrzutach 2–4 Scrap | niski | **nowe**; D6 | Balans i Ekonomia |
| R25 | STAY w potwierdzeniu zejścia cofał gracza na pole zapowiedzi | średni | **ZAMKNIĘTE (v0.4):** mech v0.5.2 §2.7a, §2.14a, §2.17 pkt 20: STAY zostawia na `>`, okno wraca po ponownym wejściu albo USE; A3 jako regresja | — |
| R26 | Zamrożenie T04: „zostaje 350 ms” nie pasowało do Curfew Guarda | niski | **ZAMKNIĘTE (v0.4):** mech §2.19 T04 i 2.16: zapowiedź − 100 ms (Guard 500 ms), auto-pauza ma pierwszeństwo; D0 | — |
| R27 | Czas zagadki a budżet sesji | średni → **odblokowane, do pomiaru** | **v0.4.1:** Power Lines v0.5.1 zgodne z mech v0.5.2 (03 bez [4,5]); heurystyka: g3 06 64 / 94 s, 03 69 / 99 s ≤ 75 / 105; Relay g3 ≈ 148 / 218 s ≤ 180 / 240; potwierdzić pomiarem B3 | LUZ / Pracownik 1 + QA |
| R28 | Pasek podpowiedzi a HUD i widoczność wrogów | niski | **ZAMKNIĘTE (v0.4.1):** mech v0.5.2 `TUT_HINT_HIDE_ON_THREAT` (fade 150 ms nad wrogiem ALERT/CHASE/ATTACK, zapowiedzią, pasem szarży); 14 px tylko < 360 px wysokości i w pionie; regresja D0 krok 5, A6 | — |
| R29 | Okno przy `>`: Enter a fokus | średni | **ZAMKNIĘTE (v0.4.1):** Enter i Spacja na przycisk z fokusem, domyślnie STAY, brak skrótu GO DOWN (mech §2.7a); resztka w `ui-m1.md` (R33) | — |
| R30 | Ekran śmierci i wyjaśnienie `M1_RISK_04` | średni | **ZAMKNIĘTE (v0.4.1):** `RISK_EXPLAINER_PAGE_LOCK_MS` 1500 (strona 1) / 500 (strona 2); kod FX: NEXT tylko tap / Enter, nowe naciśnięcie; A1 kroki 4–6 jako regresja | — |
| R31 | R6 wariant A a gracz ścigany | średni | **ZAMKNIĘTE (v0.4.1):** `EVAC_CALL_INTERRUPT_ON_DAMAGE` = false (mech 2.9, 2.16, 2.17 pkt 7); nowe ryzyko nadużycia R34 | — |
| R32 | Reguła 2600 HP | niski | **ZAMKNIĘTE (v0.4.1):** `BOSS_HP` = 2400, cel 65–75 s przy 48 DPS (model 68 s); 2600 to wartość zapasowa, gdy mediana D7 < 65 s w paśmie 44–52 DPS przy zmierzonym udziale bicia | — |
| R33 | Rozjazdy v0.5.2 | niski | **w większości zamknięte (v0.4.1):** kod FX, `fx-params.ts`, teksty §2.19, odesłanie D7, ID „Skip tutorial” (był błąd QA); zostają: `ui-m1.md` (Enter = GO DOWN w opisie okna `>`), mech 2.9 tabela R6 „przerywane jak dotąd”, wiersz `BOSS_HP` w 2.16 bez pasma 44–52 | UI i Menu, Mechaniki |
| R34 | Wezwanie windy, którego nie przerywają obrażenia, jako „przycisk ucieczki” | średni | **nowe (v0.4.1)**; A7 scenariusz 6 | Mechaniki |
| R35 | Zmiana kierunku walki (broń dystansowa, twin-stick): testy sterowania i walki wręcz nieaktualne | wysoki (dla planu) | **nowe (v0.4.1)**; testy WSTRZYMANE, pytania §6a | Producent, Mechaniki, UI i Menu |

### R1. Teksty po śmierci a brak odzysku (wysoki, poprawione, czeka na GD)
- **Było:**
  - M1_BASE_03 *„Your body and your gear are still in the zone.”*;
  - M1_BASE_14 *„Your gear is still out there.”*;
  - a mech 2.7 mówi: pełna utrata, bez odzysku i bez zwłok w następnych wyprawach.
- **Jest** (`teksty-m1-en.md` §1, oznaczone „poprawione 25.10 … QA R1”):
  - M1_BASE_03 *„Hunter 47. Print complete. Your old body and your gear are lost, but your memory is here.”*;
  - M1_BASE_14 *„All data is saved. Everything you carried is lost.”*
- **Dlaczego to było ryzyko:** gracz szukałby sprzętu, którego nie ma, i uznałby grę za nieuczciwą.
- **Dalej:** akceptacja GD. Po niej test regresji A2 przy każdej zmianie tekstów i buildu. Stare linie mogą wrócić dopiero w M2 (Recovery Beacon).

### R2. Brak przyczyny śmierci (wysoki, decyzja GD: wdrożyć)
- **Źródła:**
  - M1_BASE_04 *„Signal lost. Hunter 47 is down. Starting a new print.”*;
  - podsumowanie M1_BASE_12 bez przyczyny śmierci;
  - mech 1.8 i 2.7.
- **Dlaczego:** przy pełnej utracie gracz musi wiedzieć, co zrobił źle. Przy 2 zapowiedziach wręcz i 1 strzale naraz [D: mech 2.10] trudno to odtworzyć z pamięci.
- **Decyzja GD:** ekran śmierci i podsumowanie pokazują, kto zabił, i ostatnie trafienia. Podsumowania są zawsze prawdziwe.
- **Właściciele:** UI i Menu (ekrany), Dialogi i Lore (teksty po ID).
- **Test:** A1.

### R3. Zapowiedź ciosu: reguła 400 ms (ZAMKNIĘTE w v0.3)
- **Reguła:** GD „zapowiedź minus tick ≥ 400 ms” (`zespol.md`). W mech v0.5 zapisana jako `ENEMY_WINDUP_MIN_MS` = **450 ms (9 ticków)**: 450 − 50 = 400 ms, więc obie wersje są spójne [D: mech 1.14 i 2.11]. Obejmuje wszystkich wrogów M1, także drony przywołane przez bossa; zapowiedzi nie skracają się z głębokością.
- **Stan danych (sprawdzone 2026-10-25 ~21:20):** 450 ms dla `d` i `s` jest w tabeli 2.11, w 2.16 (`PANEL_DRONE_..._WINDUP_MS` 450, `SCRAPPER_WINDUP_MS` 450), w `balans-m1.md` v1.1 §2 i w kodzie `prog/game/src/data/combat-m0.ts` (`windupMs: 450` dla `d` i `s`).
- **Wynik:** wszyscy wrogowie **ZGODNI** (tabela A4). R3 zamknięte. A4 zostaje jako test regresji przy każdej zmianie danych, a A5 sprawdza, czy dłuższa zapowiedź realnie podnosi % uników (Balans v1.1 zakłada to w modelu, ale nie mierzy).
- **Dlaczego było ryzykiem:** okno 350 ms przy parach i grupach (2 żetony naraz) dawało śmierci od najsłabszych wrogów, odbierane jako nieuczciwe.

### R4. Pełna utrata bez siatki bezpieczeństwa (wysoki, decyzja GD)
- **Źródła:**
  - mech 2.3/2.7: przepada plecak, założony sprzęt poza Issue i kredyty ze strefy;
  - mech 2.13: bez regeneracji;
  - Z-GD2;
  - `AT RISK` ≈ 580 kr po głęb. 2 [D: mech 2.1];
  - głęb. 1 ≈ 20 kr/min [D: mech 2.12].
- **Decyzja GD (tylko informacja, trudność bez zmian):**
  - potwierdzenie przy `>` z `AT RISK`, z opcją wyłączenia w ustawieniach;
  - znacznik „can be lost” przy przedmiotach;
  - jednorazowe wyjaśnienie zasady przy pierwszej śmierci z łupem.
- **Właściciele:** UI i Menu, Dialogi i Lore.
- **Projekt (mech §2.7a, v0.5):**
  1. potwierdzenie zejścia `M1_RISK_01` („Go deeper? You can lose {at_risk} cr.” + `HP {hp}/{max} · + {patches}`) na `>` i na bramie areny bossa, gdy `AT RISK` > 0; okno pauzuje grę, fokus na STAY, Esc = STAY, STAY cofa krok; ustawienie `M1_RISK_SETTING`, domyślnie ON;
  2. znacznik „can be lost” (`M1_RISK_02`) na każdym przedmiocie ryzykownym, Issue ma `M1_RISK_03`, skrytka bez znacznika;
  3. jednorazowe wyjaśnienie `M1_RISK_04` z `{items_lost}` i `{cr_lost}` przy pierwszej śmierci z `AT RISK` > 0 (flaga `riskExplainerSeen` w zapisie).
- **Stan (v0.3.1):** teksty `M1_RISK_*` są w `fabula/teksty-m1-en.md` §12.2, **do akceptacji GD**; w kodzie jeszcze brak. Rozjazdy z §2.7a (brama bossa `M1_RISK_01B`, długość `M1_RISK_04`, „Ask” zamiast „Confirm”) w C9. Pytanie 8b (HP i patche w oknie) rozwiązane przez projekt: okno pokazuje HP i patche. Nowe ryzyko R25 (STAY).
- **Dane Balansu (`balans-m1.md` §4, §6; review 6.1):**
  - EV zejścia g1 → g2 ≈ +398 kr (P(śmierć) ~1–2%);
  - g3 z przystanku ≈ +670 kr (~6–7%);
  - g2 → g3 bez powrotu u przeciętnego gracza ≈ −800 kr (~91% śmierci, R19);
  - odbudowa „≤ 2 wyprawy” spełniona **tylko** przy polityce „zapas w skrytce” [Z Balansu]; bez zapasu odbudowę daje półka sklepu (R20).
- **Przeliczenie QA (D4):** śmierć w połowie g2 = ~780 kr wartości sprzedaży (580 `AT RISK` + ~200 założonego sprzętu [Z Balansu]), czyli **~15 min g2** (52 kr/min) albo **~37 min g1** (21 kr/min). Odkupienie broni i pancerza ilvl 2 r2 w sklepie kosztuje 2 × 240 = 480 kr, czyli ~9 min g2 brutto. Przeciętny gracz ma po 1 h 501 kr (`balans-m1.md` §6).
- **Test:** A3 (wdrożenie), A8 i D4 (symulacja straty i odbudowy).

### R5. Nauka gry w M1 (wysoki, projekt dostarczony, do wdrożenia)
- **Było:** żaden dokument nie opisywał, jak gracz uczy się zapowiedzi i uniku, bump attacku, Dash, przytrzymania USE przy szybie, alarmu windy, `AT RISK` i zasady utraty.
- **Decyzja Producenta:** naukę projektują Mechaniki z UI i Menu, teksty pisze Dialogi i Lore, w Prologu, bez osobnego samouczka.
- **Projekt (mech §2.19, v0.5):** Prolog = od `M1_BASE_01` do pierwszego powrotu po First Light, cel 10–15 min (≈ 6–10 min bez śmierci). Stała kolejność wstawek na ścieżce do terminala 04 (Scrapper → Curfew Guard → skrzynia z Med-Patchem → para Scrapperów → terminal), bez zmiany statystyk. 13 kroków T01–T13 z warunkiem zaliczenia, podpowiedzią T/K (maks. 8 słów, 4 s, maks. 2 pokazy), jednorazowym zamrożeniem przy pierwszej zapowiedzi (T04), strzałką do szybu i pierścieniem przytrzymania USE (T10). Śmierć w Prologu = pełna utrata (stawka ~0–170 kr).
- **Pokrycie listy QA 1–7:** unik T04, bump T03, Dash T06, USE i przytrzymanie T02/T08/T10, utrata T07/T11 + §2.7a, terminal poza walką T08 (`M1_SYS_04`). **Alarm windy (`M1_SYS_05`, umiejętność 5) nie ma osobnego kroku**: T10 uczy przytrzymania, ale nie tego, że wezwanie ściąga wrogów. Do uzupełnienia albo do decyzji, że uczy go sama sytuacja (pyt. 3).
- **Stan (v0.3.1):** teksty `M1_TUT_*` są w `teksty-m1-en.md` §12.3, **do akceptacji GD**, wszystkie ≤ 8 słów; kilka zmian treści względem §2.19 (C9). 10 elementów UI do uzgodnienia z UI i Menu, w tym etykiety slotów DASH / PULSE / DRONE (`M1_HUD_SK1–3`), od których zależą teksty T. Nowe ryzyka R26, R28.
- **Test:** D0 (rozpisany na T01–T13).

### R6. Ewakuacja jako pułapka przy niskim HP (wysoki)
- **Źródła (mech 2.9):**
  - wezwanie to przytrzymanie USE 1,5 s, przerywane obrażeniami;
  - alarm dla wrogów w promieniu 12 pól;
  - dojazd 5/7/9 s, okno 10 s, ponowne wezwanie po 15 s.
- **Dlaczego:** gra karze rozsądną decyzję „wracam, bo mam mało HP”. Spóźnienie w oknie kosztuje ok. 22–26 s (przeliczenie QA).
- **Propozycje QA (v0.1):** pokazać, których wrogów ściągnął alarm; alarm przy przyjeździe windy zamiast przy wezwaniu.
- **Odpowiedź Mechaników (mech 2.9, v0.5), czeka na GD:** pakiet R6 = alarm przy przyjeździe (promień 12) + szary `!` ALERT nad ściągniętymi + odliczanie dojazdu w HUD, wezwanie 1,0 s, ponowne wezwanie po 5 s. Alternatywy: (B) alarm przy wezwaniu w promieniu 8, (C) tylko informacja (Mechaniki same szacują ≥ 20% śmierci w ewakuacji). Tabela 2.16 ma do decyzji wartości bieżące (1,5 s, 15 s, `EVAC_ALERT_MOMENT` = `call`).
- **Decyzja GD (mech v0.5.2):** **wariant A**. `EVAC_ALERT_MOMENT` = arrival, `EVAC_CALL_HOLD_MS` = 1000, `EVAC_RECALL_COOLDOWN_S` = 5, szary `!` nad ściągniętymi, odliczanie dojazdu `M1_UI_LIFT_COMING`; ponowny przyjazd znowu alarmuje (tylko wrogów bez alarmu albo w IDLE). Kod `fx-m1.ts` / `fx-params.ts` ma te wartości. Krok nauki T10a (`M1_TUT_18` „Enemies come to the lift. Stay close.”).
- **Ocena QA (v0.4):** A realnie ratuje gracza, który **odszedł od wrogów i czeka przy szybie**: wsiada w ≤ 1 s od przyjazdu, a ściągnięty wróg z ≥ 10 pól potrzebuje ≥ 2 s (Mechaniki: ~0–18 HP zamiast ~17–70 na g2). **Nie ratuje gracza, który jest ścigany** (R31).
- **Właściciel:** Mechaniki.
- **Test:** A7 (wariant A vs dawny bieżący na tych samych ziarnach + scenariusz pościgu).

### R7. Trwałość zapisu na iOS Safari (wysoki, do weryfikacji)
- **Źródła:** zapis w `localStorage` [D: m0-status]; filar 6 wizji (trwały postęp).
- **Dlaczego:** WebKit usuwa dane zapisane skryptem dla stron bez interakcji przez kilka dni (wg mojej wiedzy 7 dni, poza aplikacją z ekranu głównego). To bezpośrednio dotyczy kryterium wyjścia „zapis 100%”.
- **Propozycje:**
  - `navigator.storage.persist()`;
  - zachęta do „Add to Home Screen”;
  - przypomnienie o eksporcie w podsumowaniu.
- **Stan kodu (2026-10-25):** `src/save/storage-env.ts` wywołuje `navigator.storage.persist()`. `src/save/reminder.ts` ma przypomnienia `neverExported` (≥ 30 min gry bez eksportu), `interval` (≥ 3 dni i ≥ 30 min gry od eksportu) i `iosNotStandalone` (karta Safari, ukrywane na 7 dni) [D: `data/save-reminder.ts`]. Działanie na prawdziwym iPhonie jest niesprawdzone.
- **Właściciel:** PROG / Silnik i Narzędzia.
- **Test:** B6, **B7 (iPhone, właściciel)**.

### R8. Cel długości krótkiej sesji (ROZSTRZYGNIĘTE)
- **Było:** niespójne liczby:
  - wizja i plan: 30 s–3 min;
  - brief: 1,5–3 min;
  - mech 2.2 i 2.17: 1–3 min;
  - szacunki bez czasu bazy (30–90 s) i wyjazdu windy.
- **Rozstrzygnięcie (GD, 25.10.2026):** krótka sesja jest mierzona **od otwarcia gry do podsumowania**, mediana **≤ 3 min**, p80 **≤ 4 min**. To zastępuje wcześniejsze rozstrzygnięcie Producenta (30 s–3 min na czynność, kontrakt BASE 1,5–3 min).
- **`zespol.md` linia 25 (sprawdzone v0.3):** „mierzymy całość od otwarcia gry do podsumowania, mediana ≤ 3 min, p80 ≤ 4 min; kontrakt mieści się w tym”. Pytanie 6.1 zamknięte. Zakres **30 s–3 min** zostaje tylko w wizji jako opis doświadczenia (np. pojedyncza walka, transakcja, zagadka), nie jako próg testu.
- **Test:** B1. Czasy kontraktów z mech 2.4 i 2.17 pkt 2 (1–3 min) QA raportuje dalej jako wskaźnik (B2).

### R9. Restore Relay zależy od zagadki (średni, specyfikacja v0.1)
- **Źródła:** `design/zagadki-m1/power-lines-line1.md` + `.json` + `validate.py` (LUZ / Pracownik 1, propozycja v0.1, czeka na Mechaniki i GD).
  - 8 wariantów, siatka ≤ 9×9, tylko tapnięcia + SEND / RESET / EXIT;
  - porażka = 1,5 s blokady SEND, przełączniki zostają;
  - cel 60–120 s na wariant, finał `M1_TERM_03` szacowany na 2–3 min (pyt. M5 LUZ).
- **Ryzyka dla gracza:**
  - (a) `M1_TERM_03` może przekroczyć budżet krótkiej sesji (Z1), jeśli gracz robi go jako kontrakt; budżet mech §2.2 zakłada krótszą zagadkę niż specyfikacja (R27);
  - (b) w poziomie komórka siatki 26–30 px przy 9 wierszach (pyt. M7), mniej niż 48 dp dla kontrolek (R11), z „tap snap” do najbliższego przełącznika w promieniu 1,5 komórki;
  - (c) gracz może trafić na wariant g2 bez nauki z g1 (pyt. M9);
  - (d) znaki `*` `!` `=` mają w oknie terminala inne znaczenie niż w świecie (R12).
- **Właściciel:** LUZ / Pracownik 1 (z Mechanikami, akceptacja GD).
- **Test:** B3.

### R10. Bump attack a unik na joysticku (średni)
- **Źródła:**
  - mech 2.6 pkt 7: trzymanie kierunku na wroga trzyma gracza w miejscu;
  - `sterowanie`: poniżej 25% wychylenia joystick trzyma poprzedni kierunek, histereza 10°.
- **Dlaczego:** żeby uniknąć ciosu, trzeba wyraźnie przestawić kciuk na inny sektor w oknie 350–550 ms.
- **Propozycja:** przy aktywnej zapowiedzi na polu gracza strefa 15–25% nie trzyma kierunku bumpa.
- **Właściciele:** Mechaniki + UI i Menu (LUZ / Pracownik 3).
- **Test:** A5. **WSTRZYMANE (v0.4.1):** właściciel zmienia kierunek na broń dystansową i twin-stick; bez rozbudowy do nowej specyfikacji (R35, §6a).

### R11. Telefon: kontrolki, HUD, niski ekran (średni, w toku)
- **Źródła:**
  - `sterowanie` §2: ATK, sk1–3, USE i `[+]` pod prawym kciukiem;
  - HUD M1: `AT RISK` i plecak pod paskiem HP;
  - zrzuty `prog/zrzuty/m0-ui-*`: joystick i ATK zasłaniają mapę;
  - `m0-status` pkt 5: < ~330 px wysokości nie mieści 17 wierszy;
  - `m0-status` pkt 10: `@` pod przyciskiem `||`.
- **Dlaczego:** wróg pod kciukiem lub HUD-em to atak „znikąd”. Dotyczy to kryterium wyjścia E2.
- **Właściciel:** PROG / UI i Menu (ekrany i układ M1).
- **Test:** A6, C4, C5. **v0.4.1:** część o sterowaniu (joystick, ATK, sk1–3 pod kciukiem, C4) **WSTRZYMANA** do specyfikacji twin-stick (R35); A6 i C5 (E2, zasłanianie mapy) zostają, bo dotyczą każdego układu.

### R12. Rozróżnialność symboli (średni)
- **Źródła** (`styl-ascii` §4, §5, §9, zatwierdzony). Pary i problemy do pomiaru:
  - `:` / `;`;
  - `'` / `"`;
  - `,` / `.`;
  - `*` w trzech rolach: strzał gracza, cios, błysk Grid-Grade;
  - efekt Szumu zamienia wroga w `% & # ?` (kształty terenu i obiektów);
  - boss `[=]` na torach `=`;
  - żółty i szary `!` różnią się kolorem i czasem;
  - **tło pola celu wieżyczki nie jest zdefiniowane** (mech 2.10 odsyła do GRAF/UI, a w stylu go nie ma);
  - nie wiadomo, czy strzał wieżyczki leci jako pocisk `•`.
- **Właściciel:** GRAF / Concept i Styl. Pytanie o strzał wieżyczki: Mechaniki.
- **Test:** C3.

### R13. Nagrody kontraktów w 1. godzinie (średni)
- **Źródła:** na starcie są tylko kontrakty głęb. 1. Clear the Path na głęb. 1 daje 1 Med-Patch [D: mech 2.4], a Issue i tak uzupełnia patche do 2 [D: mech 2.3].
- **Dlaczego:** ryzyko odczucia „nic nie dostałem”.
- **Balans (`balans-m1.md` §5):**
  - wartości potwierdzone: Clear the Path g1 = 1 Med-Patch (~23 kr/min), Relay 40 kr + fragment (20 kr/min), zestrojenie 30 kr + 2 Cu;
  - **wrogowie kontraktu nie upuszczają łupu**, co dodatkowo osłabia odczucie nagrody za walkę z 6 wrogami;
  - na g3 jedyny kontrakt BASE to Relay lub zestrojenie (pyt. 4 Balansu: Clear the Path g3).
- **Przeliczenie QA:** Clear the Path g1 nie daje kredytów, więc w drodze do pierwszego zakupu liczą się tylko Relay i wyprawy (D2).
- **Właściciel:** Balans i Ekonomia.
- **Test:** B4.

### R14. Niski kontrast terenu (niski)
- **Źródła:** podłoga 2,0, tory 3,0, pola zapamiętane −50%, tryb wysokiego kontrastu [D: `styl-ascii` §3, §4, §6].
- **Właściciel:** GRAF.
- **Test:** C2.

### R15. Slot Narzędzie i właściwości (niski, zdefiniowane)
- **Źródła:** `balans-m1.md` §3.1–3.2: 12 właściwości `M1_AFFIX_01–12` z zakresami r1/r2/r3, slotami, wagami i limitami łącznymi. Narzędzie ma bazę `TOOL_SALVAGE_PCT` +10/+15/+20% Scrapu, a właściwości T: 03, 07, 09, 10, 11, 12.
- **Pozostałe ryzyka:**
  - R22 (definicja `M1_AFFIX_11`);
  - R24 (zaokrąglenie bonusu Narzędzia);
  - `M1_AFFIX_12` daje +1 na r1 i r2, więc r2 nie jest lepsze od r1 (drobne);
  - `teksty` 7.3: motyw AFFIX_06 nadal „regeneracja” (Dialogi i Lore).
- **Właściciel:** Balans i Ekonomia.
- **Test:** D6.

### R16. Stan startowy (ZAMKNIĘTE w v0.4.1)
- `balans-m1.md` v1.2 i mech 2.16: `START_CREDITS` = **50 kr**, pusta skrytka, Issue Baton + Issue Suit, 2 Med-Patche z Issue, przystanek g1. D2 liczony dotąd przy 0 kr: 50 kr przyspiesza pierwszy zakup (2 Med-Patche albo 1 przedmiot r1 z półki ilvl 1), reszta wskaźników bez istotnej zmiany.

### R17. Boss i głęb. 3 poza pierwszą godziną (niski)
- **Źródła (`balans-m1.md` §2, §6, pyt. 1, 5, 6):**
  - boss 2400 HP, obrażenia **20–32** (było 25–40), zamach 800 / **1200 ms**;
  - walka ~57–61 s przy 48 DPS i ~62–70 s przy 35 DPS;
  - boss u przeciętnego gracza po ~3 h (v1.1: 64% po 3 h), u dobrego po 60–90 min.
- **Wartości bossa potwierdzone przez GD** (`balans-m1.md` v1.1) i wpisane w tabelę mech 2.16. Szarża i przywołanie mogą się jeszcze zmienić.
- **Test:** D7 (symulacja).

### R18. Lights poza pierwszą godziną (średni, nowe)
- **Źródła:**
  - Lights = 200 kr + 15 Cu + rozwiązany `M1_TERM_08` (3. wariant g1) [D: mech 2.15, `balans-m1.md` §4];
  - Copper jest tylko ze skrzyń od g2 (~8 na poziom g2), z Data Core (3 Cu, g2) i z zestrojenia (2 Cu) [D: `balans-m1.md` §4–5, review 3.5];
  - model progresji: Lights u **23%** przeciętnych graczy po 1 h, 57% po 1,5 h; u dobrych 54% po 1 h, bo omijają g1 i `M1_TERM_08` [D: `balans-m1.md` §6].
- **Przeliczenie QA:** gracz grający tylko na g1 zdobywa Copper wyłącznie z zestrojeń po wyczerpaniu 3 wariantów g1: 15 Cu = 8 zestrojeń × ~2 min ≈ 16 min samych kontraktów.
- **Dlaczego:** „światła nad bazą” to pierwszy namacalny znak, że Sieć wraca (`zakres-m1` §3; plan M1 pkt 1). W pierwszej godzinie większość graczy go nie zobaczy.
- **Propozycja:** do decyzji Balansu, np. mała ilość Copper na g1 albo w nagrodzie za `M1_TERM_08`.
- **Test:** D2 (wskaźnik „Lights w 1. godzinie”).

### R19. g2 → g3 bez powrotu jako pułapka (średni, nowe)
- **Źródła:** review 6.1: P(śmierć) ~91% u przeciętnego gracza (50% uników) przy zejściu g2 → g3 bez powrotu, EV ≈ −800 kr. Z przystanku g3 jest to tylko ~6–7%.
- **Dlaczego:** potwierdzenie przy `>` (decyzja GD) pokazuje tylko `AT RISK`. Gracz z pełnym plecakiem i 1–2 patchami nie dostaje informacji o stanie zapasów, a to one decydują o przeżyciu.
- **Propozycja:** w potwierdzeniu `>` pokazać także HP i liczbę Med-Patchy, np. `AT RISK: 580 cr · HP 64/100 · [+]x1` (UI i Menu, bez zmiany trudności).
- **Test:** A3, A8.

### R20. Odbudowa po śmierci: zapas w skrytce i półka ×4 (średni, nowe)
- **Źródła:**
  - `balans-m1.md` §6: „odbudowa ≤ 2 wyprawy” spełniona przy polityce „zapas w skrytce” [Z];
  - §4: półka 3 przedmiotów r1–r2 po ×4 ceny sprzedaży (ilvl 2 r2 = 240 kr, ilvl 3 r2 = 320 kr).
- **Dlaczego:** nowy gracz nie wie, że warto trzymać zapasowy sprzęt w skrytce (nie uczy tego plan nauki gry R5). Bez zapasu wraca na Issue (DPS 26 < progu zejścia na g2 = 30 w modelu Balansu) albo płaci ×4.
- **Propozycja:**
  - jednorazowe wyjaśnienie przy 1. śmierci z łupem (decyzja GD) może zawierać zdanie o zapasie w skrytce (Dialogi i Lore);
  - półka sklepu jako jawna droga odbudowy.
- **Balans v1.2 §8.3 (stan v0.4.1):** Issue Mk2 po przystanku g2 (Baton 10–15, DPS ~32,8 ≥ 30; Suit pancerz 6) i broń r1 na półce po śmierci (40–80 kr). Odbudowa bez zapasu: 2 wyprawy (p80 3) zamiast 3 (p80 4–5). Skrytka: `STASH_SLOTS` 30 / 40 / 50 / 60 (Lights 0 / I / II / III).
- **Ocena QA skrytki w 1. godzinie:** zapas = 4 sloty sprzętu (pełny zestaw) + 1–3 sloty materiałów (stos 20; Copper do Lights I to 10 Cu = 1 slot) ≈ 5–7 z 30 slotów. Pojemność wystarcza z dużym zapasem; ograniczeniem jest zachowanie gracza (sprzedaje stary sprzęt, bo nikt nie mówi, że warto go trzymać), nie liczba slotów. Ryzyko obniżone do niskiego.
- **Test:** D4, D4a.

### R21. Nadmiar kredytów i pułap DPS (niski, nowe, poza 1. godziną)
- **Źródła:** `balans-m1.md` Podsumowanie pkt 8 i pyt. 5: od ~90 min kredyty rosną szybciej niż wydatki (mediana 2,4 tys. kr po 3 h). Pułap DPS ~70–75 daje bossa w ~40 s (cel 60–90 s).
- **Dlaczego:** po pierwszej godzinie kredyty przestają motywować, a finał może być za krótki.
- **Właściciel:** Balans → GD.
- **Test:** D7, D2 (kredyty po 60 min).

### R22. Konflikt definicji `M1_AFFIX_11` (niski, nowe)
- **Źródła:** `balans-m1.md` §3.2: „−% czasu kanałowania (wezwanie windy, USE)” 10–35%, limit 50%. `zagadki-m1` pyt. M6 (LUZ) proponuje „liczby na węzłach po SEND” albo „darmową podpowiedź”. Nazwa „Clever / of the Open Door” pasuje do obu.
- **Dlaczego:** dwie definicje = ryzyko, że tooltip powie co innego, niż robi gra. Przy limicie 50% wezwanie windy trwa 0,75 s (z 1,5 s), co łagodzi R6. Trzeba to uwzględnić w A7.
- **Właściciele:** Balans + Mechaniki + LUZ / Pracownik 1.

### R23. Rozjazd danych między dokumentami i kodem (niski, w większości zamknięte)
- **Było (v0.3, przed synchronizacją):** changelog mech v0.5 mówił 450 ms dla `d`/`s` i boss 20–32 / 1200 ms, a tabele mech, `balans-m1.md` §2 i kod miały 400 ms oraz boss 25–40 / 900 ms.
- **Stan (~21:20):** tabele mech 2.11/2.16 (`BOSS_DMG` 20–32, `BOSS_SWING_..._RECOVERY_MS` 800 / 1200, windupy 450), `balans-m1.md` v1.1 i `combat-m0.ts` są zgodne.
- **Co zostaje:** testy QA dalej liczą z `src/data/` buildu, a nie z dokumentów (gracz dostaje to, co jest w kodzie). Walidacja danych powinna odrzucać atak poniżej `ENEMY_WINDUP_MIN_MS` (A4).
- **Test:** A4, D6, D7.

### R24. Bonus Narzędzia zerowany przez zaokrąglenie (niski, nowe)
- **Źródła:** `TOOL_SALVAGE_PCT` +10 / +15 / +20% „% Scrap z wrogów i skrzyń (zaokr. w dół)” [D: `balans-m1.md` §3.1]. Scrap 2–4 z wroga [D: mech 2.12].
- **Przeliczenie QA:** jeśli bonus liczy się dla pojedynczego zrzutu, to floor(2 × 1,2) = 2, floor(3 × 1,2) = 3, floor(4 × 1,2) = 4. **Przy wszystkich ilvl bonus z wroga wynosi 0.** Działa tylko przy większych stosach (skrzynie).
- **Propozycja:** liczyć bonus z akumulatorem ułamków albo jako szansę na +1. Do Balansu.
- **Test:** D6.

### R25. STAY w potwierdzeniu zejścia (ZAMKNIĘTE w v0.4)
- **Było:** STAY cofał gracza na poprzednie pole, które mogło być celem zapowiedzi.
- **v0.5.2 (§2.7a, §2.14a M5, §2.17 pkt 20):** STAY nie cofa; gracz zostaje na `>` i nie schodzi; okno pauzuje i zeruje trzymane wejścia; wznowienie od razu albo z odliczaniem 1,0 s przy wrogu w CHASE/ATTACK; okno wraca po zejściu z pola i ponownym wejściu albo po USE na `>`; brama areny tak samo (`M1_RISK_01B`).
- **Retest z perspektywy gracza:** zapowiedź na polu, z którego gracz przyszedł, już go nie trafia. Zapowiedź na samym `>` gracz widzi w oknie, a po STAY ma tyle samo czasu co przed oknem (pauza nie zużywa ticków), tylko musi ponownie wcisnąć kierunek (wejścia wyzerowane). To akceptowalne. **Zamknięte**; A3 krok 7 jako regresja.
- Nowe ryzyko z tej samej sekcji: R29 (Enter).

### R26. Zamrożenie T04 (ZAMKNIĘTE w v0.4)
- **v0.5.2 (§2.19 T04, 2.16 `TUT_TELEGRAPH_FREEZE_AT_MS`):** po wznowieniu zostaje zapowiedź − 100 ms (Curfew Guard 500 ms, wróg 450 ms → 350 ms); `@` i wróg bez przyciemnienia; auto-pauza ma pierwszeństwo, po RESUME i odliczaniu 1,0 s zamrożenie wraca w tym samym stanie, bez nowego licznika.
- **Retest:** liczby spójne z 2.11; 500 ms przy reakcji 250–300 ms + 50 ms opóźnienia wejścia daje ≥ 150 ms zapasu. **Zamknięte**; D0 krok 3 mierzy pozostały czas co do ticka.
- Uwaga tekstowa: tabela T04 w mech nadal cytuje „Yellow ! hits the x. Step off.”, a zatwierdzony tekst Lore to „Yellow ! means attack. Step off the x.” (R33). Opieranie sygnału na kolorze zostaje uwagą C9.

### R27. Czas zagadki a budżet sesji (odblokowane w v0.4.1, do pomiaru)
- **Mech v0.5.2:** mediana 30–60 s (g1), 60–90 s (g2–3), p80 ≤ 120 s; g3 (06, 03): mediana ≤ 75 s, p80 ≤ 105 s; Relay g3: strefa = zagadka + ~36 / ~49 s, całość = strefa + narzut 43 / 70 s; cel ≤ 180 / ≤ 240 s.
- **Power Lines v0.5.1 (LUZ / Pracownik 1, `power-lines-line1.md` §8, heurystyka do kalibracji M-P4):**

| Wariant | Głęb. | Mediana / p80 (heurystyka) | Limit | Relay: całość med / p80 |
|---|---|---|---|---|
| 04 Houses | 1 | 52 / 82 s | 30–60 / 120 ✓ | ≈ 131 / 201 s ✓ |
| 07 Corner Shop | 1 | 54 / 84 s | ✓ | ≈ 133 / 203 s ✓ |
| 08 Bunker Line | 1 | 58 / 88 s | ✓ | ≈ 137 / 207 s ✓ |
| 05 Drone Dock | 2 | 36 / 66 s | 60–90 / 120: szybciej niż cel | ≈ 115 / 185 s ✓ |
| 01 Solar Farm | 2 | 37 / 67 s | szybciej niż cel | ≈ 116 / 186 s ✓ |
| 02 Pump Station | 2 | 60 / 90 s | ✓ | ≈ 139 / 209 s ✓ |
| 06 Rail Crossing | 3 | **64 / 94 s** | ≤ 75 / ≤ 105 ✓ | **≈ 143 / 213 s** ✓ |
| 03 Rail Hall | 3 | **69 / 99 s** | ≤ 75 / ≤ 105 ✓ | **≈ 148 / 218 s** ✓ |

  Całość liczona tak jak mech §2.2 (zagadka + 36 / 49 s strefy + 43 / 70 s narzutu, dla wszystkich głębokości ten sam szacunek QA). **R27 mieści się w budżecie: Relay g3 ≈ 148 s mediany (≤ 180) i ≈ 218 s p80 (≤ 240), zapas 32 / 22 s.**
- **Zastrzeżenia:** to heurystyka (mediana = 10 s + 5 s × nowy element + 5 s × ruch + 4 s × log2(2^k / wygrane), p80 = mediana + 30 s), a nie pomiar; p80 ma stały odstęp +30 s. Zapas 03 do limitu mediany to tylko 6 s. 05 i 01 są szybsze niż dolna granica celu (pytanie LUZ M-P2, dla gracza to nie problem). Warianty g1 są nowe (sumowanie mocy z kilku źródeł) i ich nauka w Prologu (T08, wariant 04) opiera się na nowym mechanizmie.
- **Status:** odblokowane; zamknięcie po pomiarze B3 (do akceptacji GD).

### R28. Pasek podpowiedzi (ZAMKNIĘTE w v0.4.1)
- Mech v0.5.2 §2.19 i 2.16: pasek na dole, środek; `TUT_HINT_HIDE_ON_THREAT` = true (fade 150 ms, gdy pod paskiem jest wróg w ALERT / CHASE / ATTACK, jego zapowiedź albo pas szarży); `TUT_HINT_BAR_FONT` 16 px / 2 linie, 14 px tylko przy wysokości < 360 px (3 linie) i w pionie (1 linia) jako świadomy wyjątek od 16 px (decyzja Mechanik).
- Retest: strzelec pod paskiem jest teraz widoczny w chwili zapowiedzi (E2), 14 px tylko tam, gdzie inaczej się nie mieści. Zamknięte; regresja D0 krok 5 i A6.

### R29. Enter w oknie przy `>` (ZAMKNIĘTE w v0.4.1)
- Mech v0.5.2 §2.7a: domyślny fokus STAY, **Enter i Spacja działają na przycisk z fokusem**, Esc = STAY, bezpośredniego skrótu GO DOWN nie ma. Resztka: opis okna w `prog/ui-m1.md` nadal ma „Enter = GO DOWN” jako [Z] (R33). Regresja A3 krok 8.

### R30. Ekran śmierci i wyjaśnienie (ZAMKNIĘTE w v0.4.1)
- Mech v0.5.2 §2.7a, 2.16: `RISK_EXPLAINER_PAGE_LOCK_MS` = 1500 (NEXT strony 1) / 500 (OK strony 2). Kod `fx-m1.ts` `fx_death_screen`: NEXT tylko tap albo Enter, nowe naciśnięcie po 1500 ms, auto po 5000 ms. Zabójca jest też w podsumowaniu. Regresja A1 kroki 4–6.

### R31. Wezwanie windy przy pościgu (ZAMKNIĘTE w v0.4.1)
- Mech v0.5.2 2.9 pkt 1, 2.16 `EVAC_CALL_INTERRUPT_ON_DAMAGE` = false, 2.17 pkt 7: wezwanie przerywa puszczenie USE, ruch, atak (także bump) i umiejętność; obrażenia nie. Ścigany gracz może wezwać windę, ale płaci HP przez dojazd. Resztka: tabela pakietu R6 w 2.9 ma jeszcze „przerywane jak dotąd” (R33). Nowe ryzyko nadużycia R34.

### R32. Reguła 2600 HP (ZAMKNIĘTE w v0.4.1)
- Mech v0.5.2 (changelog, 2.17 pkt 17): `BOSS_HP` = 2400, cel 65–75 s przy 48 DPS (model i pomiar QA: 68 s); 2600 to wartość zapasowa tylko przy medianie D7 < 65 s **w paśmie 44–52 DPS** i przy zmierzonym udziale bicia. Wiersz 2.16 `BOSS_HP` nie wspomina pasma (R33, kosmetyka).

### R33. Rozjazdy v0.5.2 (w większości zamknięte)
- **Poprawione (sprawdzone ~22:00):** `fx-m1.ts` (NEXT tylko tap / Enter), `fx-params.ts` (`DEATH_SCREEN_AUTO_MS` status ok), mech §2.19 teksty T01–T13 wg Lore, §2.7a „2 strony” i „Ask before going deeper”, odesłanie bossa B1 → D7.
- **Wycofane jako błąd QA:** „ID przycisków Skip tutorial” — mech v0.5.2 i teksty mają dwa okna z osobnymi ID (D0 krok 8).
- **Zostaje (niski):** `prog/ui-m1.md` opis okna `>` z „Enter = GO DOWN” [Z] (UI i Menu); mech 2.9, tabela pakietu R6: „przerywane jak dotąd” przy `EVAC_CALL_HOLD_MS` (Mechaniki); wiersz `BOSS_HP` w 2.16 bez pasma 44–52 DPS (Mechaniki).

### R34. Wezwanie windy jako „przycisk ucieczki” (średni, nowe)
- **Źródło:** R31 rozwiązane przez `EVAC_CALL_INTERRUPT_ON_DAMAGE` = false. Dojazd 5 / 7 / 9 s, wsiadanie bez czasu, od ticku wejścia do kabiny nietykalność.
- **Dlaczego:** gracz może stanąć przy szybie obok wroga, przytrzymać USE mimo ciosów, a potem przeczekać dojazd z leczeniem. Przy jednym wrogu: ok. 30–50 HP na g2 (R31), a Med-Patch daje 40 HP / 2 s co 4 s (~10 HP/s), czyli więcej niż ~5,8 HP/s od Curfew Guarda przy 50% uników. Ewakuacja przy jednym ścigającym staje się prawie pewna kosztem 1–2 patchy, co osłabia decyzję „dalej czy wracać” i karę za zwlekanie. Przy 2–3 wrogach i alarmie przy przyjeździe koszt rośnie.
- **Nie musi to być błąd:** R6 miało właśnie dać szansę rozsądnemu odwrotowi. QA mierzy, czy koszt jest zauważalny, a decyzję zostawia Mechanikom.
- **Propozycja (jeśli pomiar pokaże „za tanio”):** bez zmiany zasad wezwania, np. alarm przy przyjeździe obejmuje też wroga w CHASE (dodatkowy żeton) albo dojazd przyspiesza tylko bez wroga w promieniu 3. Mechaniki.
- **Test:** A7 scenariusz 6.

### R35. Zmiana kierunku walki (wysoki dla planu, nowe)
- **Źródło:** decyzja właściciela (przekazana 25.10.2026 ~22:00): broń dystansowa i sterowanie twin-stick; specyfikacja walki i sterowania się zmieni.
- **Skutek dla planu:** testy komfortu walki wręcz i sterowania dotykowego są **WSTRZYMANE** bez rozbudowy: R10 (bump a joystick), A5 (wykonalność uniku z bumpem i joystickiem; reguła reakcji zostaje do przeniesienia), C4 (geometria kontrolek pod jeden joystick + ATK), część R11 o sterowaniu. **Nie wstrzymujemy:** A4 (reguła zapowiedzi na danych, dotyczy też pocisków), A6 / E2 (niewidoczny wróg), C1–C3, C5 (czytelność, zasłanianie mapy).
- **Pytania QA na przyszłość:** §6a.

---

## 2. Cele testów M1, kryteria wyjścia i wskaźniki

**Cel:** sprawdzić pełną pętlę M1 w małej skali: ryzyko i powrót, krótkie sesje, czytelność na telefonie i balans pierwszej godziny. Ograniczenie (GD): bez ludzkich testerów, czyli symulacja, boty QA i granie właściciela.

### 2.1 Kryteria wyjścia z M1 (decyzja GD, jedyne kryteria zaliczenia)
| ID | Kryterium | Jak sprawdzamy | Próg |
|---|---|---|---|
| **E1** | Zapis działa w 100% | B5 (przerwania A–E, zamknięcie karty, przeładowanie), B6 (trwałość, iOS/Android), **B7 (prawdziwy iPhone, właściciel)**, fuzz zapisu [BOT]: zapis w losowym ticku → odczyt → porównanie skrótu stanu (tick, PRNG, liczniki, AI, plecak, trwały postęp) | **100%** zgodności, 0 utrat trwałego postępu [D: GD] |
| **E2** | Brak obrażeń od niewidocznego wroga | A6 [BOT]: każde `damage_taken` porównane z widocznością źródła w chwili startu zapowiedzi lub strzału (w widoku, nie pod HUD-em ani kontrolką) | **0** przypadków na wszystkich badanych rozdzielczościach [D: GD] |
| **E3** | Właściciel po zagraniu chce grać dalej | kwestionariusz właściciela, pytanie W-K1 (§4.3) | odpowiedź „tak” [D: GD] |

### 2.2 Wymagania z decyzji (zgodność, zgłaszane jako błędy)
Nie są osobnymi kryteriami wyjścia, ale niezgodność z decyzją GD lub Producenta to błąd do poprawy przez właściciela obszaru.

| ID | Wymaganie | Źródło | Test |
|---|---|---|---|
| Z1 | Krótka sesja (otwarcie gry → podsumowanie): mediana ≤ 3 min, p80 ≤ 4 min | [D: GD] | B1 |
| Z2 | Każdy wróg: zapowiedź − tick ≥ 400 ms, czyli `ENEMY_WINDUP_MIN_MS` = 450 ms (9 ticków) | [D: GD, mech v0.5 1.14] | A4 |
| Z3 | Ekran śmierci i podsumowanie pokazują zabójcę i ostatnie trafienia, zgodne z telemetrią | [D: GD] | A1 |
| Z4 | Potwierdzenie przy `>` i bramie bossa z `AT RISK` (domyślnie ON, z opcją wyłączenia), znacznik „can be lost”, jednorazowe wyjaśnienie przy 1. śmierci z łupem | [D: GD, mech §2.7a] | A3 |
| Z5 | Teksty po śmierci nie obiecują odzysku (po akceptacji GD) | [D: teksty §1, R1] | A2 |
| Z6 | Strata w podsumowaniu = ostatni `AT RISK` co do kredytu | [D: mech 2.17 pkt 5] | A1 |
| Z7 | Nauka gry w Prologu bez osobnego samouczka, wg kroków T01–T13 | [D: Producent, mech §2.19] | D0 |

### 2.3 Wskaźniki (informacja dla działów, nie kryteria)
| ID | Wskaźnik | Metryka | Wartość odniesienia |
|---|---|---|---|
| W1 | Unik jest wykonalny | % unikniętych zapowiedzi przez bota z modelem reakcji 250–300 ms [D: mech 1.5] | ≥ 70% [D: mech 1.15 pkt 7, cel M0]; różnica `d`/`s` vs `h` ≤ 15 p.p. [QA] |
| W2 | Kontrakt (wyjazd windą → ewakuacja) | mediana na typ | 1–3 min BASE, < 45 s Exchange [D: mech 2.17 pkt 2] |
| W3 | Czytelność symboli | odróżnialność par glifów (C3) | patrz C3 [QA] |
| W4 | Dotyk | kontrolki ≥ 48 dp, odstęp ≥ 8 dp, brak nakładania pól trafienia | [D: `sterowanie` §2] |
| W5 | Tempo 1. godziny | czas do kamieni milowych (D2) | tabela osi czasu w 3d [D] |
| W6 | Koszt poziomu w HP | HP stracone na poziom przy 50% uników | **82 / 188 / 285** (model grupowy, `balans-m1.md` v1.1 z 450 ms; v1.0: 82 / 187 / 287) [D: review 6.1, mech v0.5]; 1v1: 79 / 169 / 254 jako dolna granica |
| W7 | Ekonomia kontraktów | kr/min kontraktu ≤ kr/min wyprawy tej głęb. | [D: mech 2.17 pkt 16] |
| W8 | Odczucia właściciela | oceny 1–5 w kwestionariuszu | „decyzja dalej/wracać” ≥ 4, „utrata bolała, ale uczciwa” ≥ 3,5, „bump nie przeszkadzał” ≥ 3,5 [D: mech 2.17 pkt 18; tu ocenia właściciel zamiast min. 3 osób] |
| W9 | Boss | mediana walki | **65–75 s przy typowym sprzęcie g3 (~48 DPS)**; < 65 s → `BOSS_HP` 2600 [D: mech v0.5.2 2.11, 2.17 pkt 17]; model Balansu 86 / 68 / 46 s przy 35 / 48 / 72 DPS; przeliczenie QA w D7 (R32) |
| W10 | Pierwsza godzina (D2) | wskaźniki z §3d D2 | tabela D2 [D: `balans-m1.md` §4–6 + przeliczenia QA] |

---

## 3. Obszary testów i scenariusze

Format: **Wykonawca → Kroki → Obserwujemy → Metryka → Próg** (E = kryterium wyjścia, Z = wymaganie z decyzji, W/[QA] = wskaźnik).

### 3a. Ryzyko i śmierć

**A1. Przyczyna śmierci na ekranie i w podsumowaniu (R2, R30, Z3, Z6)**: [BOT] + [WŁ]. Według mech v0.5.2 §2.7 pkt 3.
- Kroki [BOT]:
  1. Bot ginie co najmniej 5 razy od każdego źródła: `d`, `s`, `h`, `t`, boss (zapis startowy z areny), mieszanka `d`+`t`. Zabójca, który zginął w tym samym ticku: podświetla się pole, z którego padł cios.
  2. Ekran śmierci: `M1_BASE_04`, `M1_DEATH_01` („Killed by: {enemy_name}”), `M1_DEATH_02` (3 ostatnie trafienia po pancerzu) zgodne z telemetrią `death` i `damage_taken`; strata w podsumowaniu = ostatni `AT RISK`; `M1_DEATH_01` także w podsumowaniu.
  3. Zatrzymanie 500 ms z podświetleniem zabójcy (boss: 6 komórek; Reduce motion: stałe odwrócenie bez błysków).
  4. **Zegary:** przez 1500 ms tap, Enter i Spacja nic nie robią; od 1500 ms NEXT działa na tap i Enter; **Spacja / ATK nie działa nigdy** (dziś kod FX przyjmuje ATK, R33); bez wejścia przejście po 5000 ms (±1 tick); auto-pauza zatrzymuje oba zegary i po RESUME liczą dalej.
  5. **Przytrzymany atak:** bot trzyma Spację / ATK w chwili śmierci i dalej: ekran nie przechodzi przed 5000 ms.
  6. **Przejście na wyjaśnienie (R30):** tap NEXT dwa razy w odstępie 100 ms i przytrzymany Enter w chwili 1500 ms: strona 1 `M1_RISK_04` musi zostać widoczna (nie może być przeskoczona wejściem z ekranu śmierci); auto-przejście nie dotyczy panelu wyjaśnienia.
- Kroki [WŁ]: pierwsza śmierć z łupem bez przygotowania; pytanie W-S2 z dopiskiem v0.4 „Czy zdążyłeś to przeczytać przed przejściem ekranu?”.
- Metryka: % zgodnych śmierci; % śmierci, w których gracz dotknął NEXT przed 3 s [QA, informacja].
- Próg: **100%** zgodności (Z3, Z6), kroki 4–6 zgodne. Każda niezgodność to błąd.

**A2. Regresja tekstów po śmierci (R1, Z5)**: [BOT], przy każdym buildzie i każdej zmianie `teksty-m1-en.md`
- Kroki:
  1. Wyszukać w tekstach gry i w buildzie frazy obiecujące odzysk (np. „still in the zone”, „still out there”, „recover”, „go back for”, „get … back”) w liniach używanych w M1. **Wyjątki (v0.3.1):** zdania przeczące są dozwolone (`M1_RISK_04`: „You cannot get them back from your body.” to właśnie brak obietnicy); samo „go back” bez „for” nie jest trafieniem (`M1_TUT_11` „Now go back to the lift.”). Zakres skanu obejmuje nowe §11.5 i §12 (stan 2026-10-25: 0 trafień).
  1a. Teksty przy śmierci bez straty: `M1_BASE_03` / `M1_BASE_14` mówią „Your gear is gone.”, co jest nieprawdą przy `{items_lost}` = 0 (np. Prolog). Dialogi i Lore proponują `M1_BASE_03B` / `M1_BASE_14B` (pytanie 24 tekstów, do GD). Po decyzji: śmierć z `AT RISK` = 0 → wariant B.
  2. Sprawdzić, że M1_BASE_03 i M1_BASE_14 w buildzie mają treść zatwierdzoną przez GD (obecnie poprawione wersje z `teksty` §1).
  3. Śmierć z łupem → ekran wydruku i stopka podsumowania: odczyt tekstu z DOM.
  4. Następna wyprawa: brak zwłok gracza i zwłok-dekoracji [D: mech 2.7, 2.17 pkt 5].
  5. M1_NOTE_47_BODY nieosiągalny w M1 [D: mech 2.7].
- Metryka: liczba trafień fraz i niezgodnych ID.
- Próg: **0** (Z5). Do akceptacji GD test raportuje stan bez blokowania.

**A3. Informacyjne zabezpieczenia przed stratą (R4, R25, Z4)**: [BOT] + [WŁ]. Według mech §2.7a (v0.5) i tekstów §12.2 (do akceptacji GD). Bot sprawdza ID i podstawione tokeny (`{at_risk}`, `{hp}`, `{max}`, `{patches}`, `{items_lost}`, `{cr_lost}`); na bramie areny bossa ID zależy od decyzji o `M1_RISK_01B` (C9).
- Kroki [BOT]:
  1. **Potwierdzenie:** wejście na `>` z `AT RISK` > 0 → okno `M1_RISK_01`; `{at_risk}` = `AT RISK` w HUD co do kredytu; pod spodem `HP {hp}/{max} · + {patches}` zgodne ze stanem. To samo na bramie areny bossa (g3). Przy `AT RISK` = 0 okna nie ma.
  2. **Pauza i wybór (v0.5.2):** okno pojawia się w ticku wejścia na `>`, zatrzymuje ticki i zeruje trzymane wejścia; domyślny fokus STAY; Esc = STAY; Spacja nic; GO DOWN schodzi; **STAY zostawia gracza na `>`** bez zejścia; wznowienie od razu, a z odliczaniem 1,0 s przy wrogu w CHASE/ATTACK; okno wraca tylko po zejściu z pola i ponownym wejściu albo po USE na `>`; stanie na `>` nie wywołuje okna co tick. Brama areny: `M1_RISK_01B` „Fight the boss?…” + `M1_RISK_01B_YES` „GO IN”, STAY = `M1_RISK_01_NO`.
  3. **Ustawienie:** `M1_RISK_SETTING` domyślnie ON na nowym zapisie; po wyłączeniu okna nie ma; ustawienie przetrwa przeładowanie.
  4. **Znacznik:** każdy przedmiot ryzykowny (plecak, założony poza Issue) ma `M1_RISK_02` w tooltipie i znacznik na slocie; Issue ma `M1_RISK_03`; przedmiot w skrytce bez znacznika; przeniesienie skrytka → postać dodaje znacznik od razu.
  5. **Wyjaśnienie (v0.5.2: 2 strony):** pierwsza śmierć z `AT RISK` > 0 pokazuje `M1_RISK_04` między wydrukiem a podsumowaniem: strona 1 (co przepadło, `{items_lost}`, `{cr_lost}` zgodne z podsumowaniem, Z6) z NEXT, strona 2 (co zostaje) z OK (`M1_RISK_04_OK`); bez auto-przejścia; flaga `riskExplainerSeen` zapisuje się **po OK** (zamknięcie gry na stronie 1 → wyjaśnienie wraca przy następnej śmierci z łupem); druga śmierć i przeładowanie po OK już go nie pokazują. Wejście z ekranu śmierci nie przeskakuje strony 1 (A1 krok 6).
  6. **Śmierć bez łupu** (`AT RISK` = 0) nie zużywa wyjaśnienia (w Prologu zamiast tego `M1_TUT_14`, D0 T11).
  7. **R25 (regresja):** wejście na `>` w ucieczce, gdy wróg ma trwającą zapowiedź na polu, z którego gracz przyszedł → STAY. Oczekiwane: gracz stoi na `>`, zapowiedź na poprzednim polu pudłuje, pozostały czas zapowiedzi na `>` (jeśli jest) jest taki sam jak przed oknem.
  8. **R29 (Enter):** fokus na STAY + Enter. Oczekiwane wg QA: STAY (Enter = przycisk z fokusem). Dziś mech mówi Enter = GO DOWN, a `ui-m1.md` Enter = fokus: do czasu decyzji test raportuje oba zachowania jako niezgodność dokumentów.
- Kroki [WŁ]:
  - pytanie W-S3 w kwestionariuszu;
  - telemetria: liczba okien, odsetek STAY, czy właściciel wyłączył ustawienie i po ilu oknach.
- Próg: kroki [BOT] 1–7 zgodne (Z4, mech 2.17 pkt 20). Krok 8 zależy od decyzji R29. Wskaźnik zmęczenia oknem [QA]: jeśli właściciel wyłącza potwierdzenie w pierwszej godzinie, zgłaszamy do UI i Menu (okno pojawia się przy prawie każdym zejściu, bo po Prologu `AT RISK` rzadko jest 0).

**A4. Reguła zapowiedzi ciosu dla każdego wroga (R3, Z2)**: [SYM] na danych z `src/data/` + test jednostkowy. Regresja przy każdej zmianie danych.
- **Reguła (mech v0.5, 1.14 i 2.11):** `ENEMY_WINDUP_MIN_MS` = **450 ms (9 ticków)** dla każdego ciosu wroga M0–M1, także bossa i dronów przywołanych przez bossa; nie skraca się z głębokością. To ta sama reguła co „zapowiedź minus tick ≥ 400 ms” w `zespol.md` (450 − 50 = 400 ms), więc dokumenty są spójne.
- **Kroki:**
  1. Dla każdej encji wroga i każdego jej ataku policzyć zapowiedź w tickach (`round(ms/50)`) i sprawdzić: ticki ≥ 9 oraz `windup_ms − TICK_MS` ≥ 400. Test iteruje po wszystkich definicjach w `src/data/`, nie po stałej liście, więc obejmie też przyszłych wrogów i elity.
  2. To samo po mnożnikach głębokości (g1/g2/g3) i ze statusami (Shock): czas zapowiedzi bez zmian.
  3. Odstęp żetonów 150 ms nie powoduje rozstrzygnięcia drugiej zapowiedzi wcześniej niż po pełnym czasie.
  4. Walidacja danych odrzuca każdy atak poniżej `ENEMY_WINDUP_MIN_MS`.
  5. **Przywołanie bossa** (`BOSS_SUMMON_MS` 600 ms, `|R|`): to nie jest cios. Sprawdzamy w symulacji co do ticka, że **nie ma `!`** nad bossem i **gracz nie dostaje obrażeń** w żadnym ticku animacji, nawet stojąc obok bossa; drony pojawiają się ≥ 4 pola (BFS) od gracza, stoją 500 ms z szarym `!` ALERT (300 ms, to nie jest zapowiedź ciosu), a pierwszy cios drona pada najwcześniej ≥ 2,35 s od startu przywołania [D: mech 2.11].
- **Stan na 2026-10-25 ~21:20 (v0.3).** Źródła: tabele mech v0.5 2.11/2.16, `balans-m1.md` v1.1 §2, kod `combat-m0.ts`:

| Wróg / atak | Zapowiedź | Ticki | Minus tick | Wynik wg v0.5 |
|---|---|---|---|---|
| `d` Panel Drone | 450 ms (kod: `windupMs: 450`) | 9 | 400 ms | **ZGODNY** |
| Panel Drone przywołany przez bossa | 450 ms | 9 | 400 ms | **ZGODNY** |
| `s` Scrapper | 450 ms (kod: `windupMs: 450`) | 9 | 400 ms | **ZGODNY** |
| `h` Curfew Guard | 600 ms | 12 | 550 ms | **ZGODNY** |
| `t` Line Sentry | 700 ms | 14 | 650 ms | **ZGODNY** |
| Rail Guardian, zamach | 800 ms | 16 | 750 ms | **ZGODNY** |
| Rail Guardian, szarża (cała linia) | 900 ms | 18 | 850 ms | **ZGODNY** |
| `c` Scrap Crawler (tylko M0) | 500 ms | 10 | 450 ms | **ZGODNY** |
| Rail Guardian, przywołanie | 600 ms | 12 | — | **nie jest ciosem**: test kroku 5 (brak `!`, brak obrażeń) |

- **Wniosek:** wszyscy wrogowie ZGODNI, R3 zamknięte. Najmniejszy zapas ma `d`/`s` (dokładnie na progu): każda zmiana ich tempa wymaga powtórzenia A4 i A5.
- Próg: **100% ataków zgodnych** (Z2), liczone z `src/data/` buildu, i krok 5 bez `!` i bez obrażeń. Każda niezgodność to błąd danych (Mechaniki + PROG / Gameplay).

**A5. Wykonalność uniku: bot z modelem reakcji (R3, R10, W1)**: [SYM] + [BOT] + [WŁ]. **WSTRZYMANE (v0.4.1, R35):** część o bump attacku i joysticku czeka na specyfikację twin-stick; po niej scenariusz zostanie przepisany (model reakcji 250–300 ms + wejście zostaje).
- Kroki:
  1. [SYM/BOT] Bot reaguje na start zapowiedzi z opóźnieniem 250 / 300 ms [D: mech 1.5, typowy czas reakcji] plus opóźnienie wejścia ≤ 50 ms [D: mech 1.1], krokiem z pola albo Dash.
  2. Wariant „telefon”: dodatkowo czas przestawienia sektora joysticka; założenie 100 ms [QA], do kalibracji na graniu właściciela.
  3. Starcia: `s`×3, `d`×2, `h`, `t`, `d`+`t`. Atak przez ATK albo bump (R10: trzymanie kierunku na wroga).
  4. [WŁ] Właściciel gra te same starcia (zapis testowy) 5 min na telefonie; telemetria `telegraph_resolve`.
- Metryka: % unikniętych zapowiedzi wg wroga, sposobu ataku i wejścia.
- Wskaźnik:
  - ≥ 70% [D: mech 1.15 pkt 7];
  - `d`/`s` vs `h` różnica ≤ 15 p.p. [QA];
  - bump vs ATK spadek ≤ 10 p.p. [QA].
- Porównanie 400 ms (stare dane) vs 450 ms (v0.5) dla `d`/`s` na tych samych ziarnach: Balans v1.1 przyjmuje, że dłuższa zapowiedź działa przez wyższy realny % uników, ale tego nie mierzy. A5 podaje ten przyrost.

**A6. Obrażenia od niewidocznego wroga (R11, E2)**: [BOT]
- Kroki: boty grają po min. 30 poziomów na każdą głębokość [QA] (losowe ziarna) na rozdzielczościach:
  - 360×640 i 640×360;
  - 375×667 i 667×375;
  - 568×320;
  - 412×915;
  - 1280×720;
  - w obu orientacjach i w trybie leworęcznym.

  W każdej klatce startu zapowiedzi lub strzału zapisujemy pozycję źródła względem widoku i prostokątów UI (HUD, `||`, joystick w aktualnej pozycji, ATK, sk1–3, USE, `[+]`, nakładki tekstów).
- Obserwujemy też:
  - wykrycie przez wroga spoza widoku (zasięg 7, `d` 8 [D: mech 2.11]; widok min. 31×17 / 17×21 [D: mech 1.10]);
  - wroga za krawędzią przy kamerze przy ścianie;
  - wroga pod HUD-em `AT RISK`.
- Metryka: liczba `damage_taken`, których źródło w chwili startu zapowiedzi nie było widoczne.
- Próg: **0** (E2). Każdy przypadek to błąd krytyczny ze zrzutem klatki.

**A7. Ewakuacja przy niskim HP (R6, R31)**: [SYM] + [BOT]. Według mech v0.5.2 2.9 (wariant A, decyzja GD).
- **Zgodność z danymi:** `EVAC_CALL_HOLD_MS` 1000, `EVAC_RECALL_COOLDOWN_S` 5, `EVAC_ALERT_MOMENT` arrival, promień 12 (BFS); wezwanie nie wywołuje alarmu; w ticku przyjazdu `M1_BASE_06`, `M1_SYS_05` i szary `!` nad każdym ściągniętym wrogiem; ponowny przyjazd alarmuje tylko wrogów bez alarmu albo w IDLE; nietykalność od ticku wejścia do kabiny; `<` nieprzechodnie dla wrogów.
- **Scenariusze** (HP 20 / 40 / 60%, głęb. 1–3, losowe rozmieszczenie, bot broni się i używa patchy, te same ziarna dla A i dawnego wariantu „call / 1,5 s / 15 s” jako punkt odniesienia):
  1. **„Wracam z wyprzedzeniem”:** bot dochodzi do szybu bez wroga w CHASE, wzywa, czeka przy szybie.
  2. **„Pościg” (R31):** bot zaczyna wezwanie, mając 1 Curfew Guarda albo 2 Panel Drone w CHASE w odległości 2–6 pól; warianty: bez Dash, z Dash, z Shock Pulse.
  3. **„Spóźnienie”:** bot odchodzi od szybu w trakcie dojazdu i wraca po oknie (koszt 11–15 s wg mech).
  4. Każdy wariant bez `M1_AFFIX_11` i z jego limitem 50% (R22).
  5. ~~Wariant propozycji R31~~ obowiązuje od v0.5.2 (`EVAC_CALL_INTERRUPT_ON_DAMAGE` = false): test, że trafienie w trakcie przytrzymania nie zeruje pierścienia, a puszczenie USE, ruch, atak, bump i umiejętność zerują.
  6. **Nadużycie (R34):** bot stoi przy szybie obok 1 wroga (`s`, `d`, `h`; g1–3), wzywa windę mimo ciosów, przez dojazd 5 / 7 / 9 s broni się i leczy, wsiada w oknie. Warianty: 0 / 2 / 6 Med-Patchy, 1 / 2 wrogów, z alarmem przy przyjeździe. Metryka: % udanych ucieczek, HP i Med-Patche zużyte. Wskaźnik [QA]: ucieczka od 1 wroga z ≥ 2 patchami nie powinna być „pewna i darmowa”: raport, jeśli sukces ≥ 95% przy koszcie < 1 patcha na g2–3.
- Metryka: % śmierci w sekwencji ewakuacji (od wezwania do kabiny); HP stracone od alarmu i od pościgu osobno; liczba przerwanych wezwań; % spóźnionych okien; czas „decyzja → bezpieczeństwo”.
- Wskaźnik:
  - śmierci w ewakuacji ≤ 20% wszystkich śmierci [QA];
  - scenariusz 1: HP od alarmu w zakresie ~0–18 na g2 [D: mech 2.9];
  - scenariusz 2: raport % śmierci przy 40% HP; > 30% [QA] = zgłoszenie R31;
  - spóźnione okna ≤ 10% [QA].

**A8. Dalej/wracać i wartość straty (R4)**: [SYM]
- Kroki: symulacja wypraw z politykami bota: „wracaj po każdym poziomie”, „wracaj przy pełnym plecaku”, „wracaj przy < 2 patchach”, „zawsze dalej”.
- Metryka:
  - `AT RISK` w chwili śmierci i ewakuacji;
  - oczekiwany zysk/min każdej polityki;
  - % śmierci.
- Wskaźnik [QA]: żadna polityka skrajna („zawsze dalej” ani „zawsze po 1 poziomie”) nie jest wyraźnie najlepsza. Inaczej decyzja jest pozorna (W8: „decyzja odczuwalna”).

**A9. Gra „leniwa” (filar 3)**: [SYM]
- Kroki: bot bez uników, przytrzymany ATK lub bump, głęb. 1 na Issue.
- Wskaźnik: ~1,7 patcha na poziom [D: `balans` 2.1], odchyłka ≤ 50% [QA]. Głęb. 1 przechodnia na Issue [D: mech 2.3].

### 3b. Krótkie sesje

**B1. Krótka sesja: otwarcie gry → podsumowanie (R8, Z1)**: [WŁ] (główne) + [BOT] (dolna granica)
- Kroki:
  - [WŁ] właściciel robi krótkie sesje tak, jak by grał naprawdę: otwarcie gry, jedna czynność lub kontrakt, podsumowanie. Min. 10 sesji [QA], w tym min. 1 z każdym typem kontraktu i 3 bez kontraktu (walka, handel, zagadka);
  - [BOT] bot wykonuje każdy kontrakt 20× ze skryptowaną ścieżką.
- Telemetria i rozbicie na fazy:
  - ładowanie gry;
  - baza;
  - wyjazd windą;
  - dojście do celu;
  - walka;
  - zagadka;
  - ewakuacja (wezwanie, dojazd, okno);
  - podsumowanie.
- Metryka: mediana i p80 czasu „otwarcie gry → podsumowanie”.
- Próg: **mediana ≤ 3 min, p80 ≤ 4 min** (Z1) na danych właściciela. Czasy bota to dolna granica: jeśli już bot przekracza próg, to błąd projektu, a nie gracza.
- **Porównanie z budżetem mech §2.2 (v0.5)** na fazę (mediana / p80): wczytanie 3 / 5 s, baza 35 / 60 s, wyjazd 2 s, odjazd i zjazd 3 s, narzut poza strefą ≈ 43 / 70 s. Całość: Relay g1 118 / 175 s, Relay g3 154 / 209 s, Data Core g2 128 / 180 s, Clear the Path g1–2 108–118 / 150–165 s, Exchange ≈ 35 / 55 s.
- **Warunki budżetu sprawdzane osobno** [D: mech §2.2]:
  - tablica kontraktów i przycisk windy widoczne od razu po wczytaniu (wymóg dla UI) [BOT];
  - mediana wizyty w bazie ≤ 40 s [WŁ];
  - czas zagadki w sesjach Relay mieści się w 30–60 s (g1) / 60–90 s (g2–3), p80 ≤ 120 s (**wiążące**, mech v0.5.2 `PUZZLE_TIME_TARGET`); na g3 (06, 03) mediana ≤ 75 s, p80 ≤ 105 s (`PUZZLE_TIME_LIMIT_D3`); jeśli nie, zgłoszenie R27 z podziałem na wariant `M1_TERM_xx`;
  - baza to menu-hub bez ticków (mech 2.14a M4): czas w bazie liczymy z zegara ściennego, nie z ticków; przy jednym przystanku LIFT jedzie bez okna wyboru (`LIFT_SINGLE_STOP_AUTO`).
- **Sesja Relay g3 (budżet mech §2.2 v0.5.2):** przy limicie zagadki całość ≤ 154 / ≤ 224 s. Przekroczenie p80 ≤ 240 s przy wariancie 03 = R27.
- Faza przekraczająca budżet o > 30% [QA] = zgłoszenie do właściciela fazy, nawet gdy całość mieści się w Z1. Prolog i sesje średnie/długie nie są krótką sesją i nie wchodzą do B1 [D: mech §2.2].

**B2. Czas kontraktu i faz (W2)**: [BOT] + [WŁ], z tych samych danych co B1
- Metryka: wyjazd windą → ewakuacja, na typ kontraktu.
- Wskaźnik:
  - 1–3 min BASE, < 45 s Exchange [D: mech 2.17 pkt 2];
  - porównanie z szacunkami Relay 75–170 s, Data Core 60–110 s, Clear the Path 45–80 s [D: mech 2.4];
  - czas w bazie ≤ 60 s [QA] (mech 2.1 podaje 30–90 s).

**B3. Restore Relay: zagadka Power Lines (R9, R27)**: [BOT] + [WŁ]. **Odblokowany.** Rozpisany na specyfikacji v0.1, sprawdzony z **v0.4** (`design/zagadki-m1/`: zasady, 8 wariantów `M1_TERM_01–08`, solver `validate.py`). **Specyfikacja może się jeszcze zmienić** (czeka na Mechaników i GD); wyniki są ważne dla wersji podanej w raporcie, a po zmianach test trzeba powtórzyć.
- **Kroki [BOT]:**
  1. **Dane i reguły:** `python3 validate.py` i `--selftest`. Wymagane wyjście 0. Stan 2026-10-25: OK, 8/8 wariantów, krzywa rośnie (indeks 2,00 → 15,00). **v0.4.1 (Power Lines v0.5.1, ~22:00):** `python3 validate.py`: WYNIK OK („warianty rozwiązywalne, reguły głębokości, odstępy, czasy i teksty zgodne”), 2 uwagi: 05 (36 s) i 01 (37 s) szybciej niż dolna granica celu g2; **uwag o starych ID `_TIP` nie ma** (JSON `hint.text_ids`). `--selftest`: 17/17 OK. `--gen-test 1000 --seed 2026`: 8000/8000 OK (8 wariantów × 1000 zestrojeń; ruchy i skale ×1 / ×2 w rozkładzie, 0 przypadków bez części TIP). Historia: ponowne uruchomienie ~21:35 (v0.3.1): **WYNIK OK**, ale 8 uwag „brak `M1_TERM_xx_TIP` w pliku tekstów” dla wszystkich wariantów. **Przyczyna:** `power-lines-line1.json` ma w `variants[].hint.text_id` stare pojedyncze ID `M1_TERM_xx_TIP`, a teksty §11.5 mają już tylko `M1_TERM_xx_TIP_1/2/3`; `check_texts()` szuka dokładnego ID w wierszach tabeli, więc nie znajduje żadnego. Skutek uboczny: kontrola tokenów podpowiedzi jest pomijana (np. `{source_power}` w `M1_TERM_06_TIP_1` nie jest sprawdzany względem `hint.tokens`). To nie jest błąd zagadki ani tekstów, tylko nieaktualne ID w danych. **Uwaga dla LUZ / Pracownik 1** (pytanie 14a); QA nie zmienia `validate.py`. Do poprawki uwagi są oczekiwane i nie blokują B3.
  2. **Zgodność portu TS:** dla każdego wariantu stan startowy, `final_grid` i 50 losowych stanów przełączników dają w grze ten sam wynik (WIN / DARK / OVERLOAD / FUSE / TRIP / SHORT) co `Puzzle.simulate()` w Pythonie.
  3. **Kolejność i zapis:**
     - poziom dostaje pierwszy nierozwiązany wariant swojej głębokości (g1: 04 → 07 → 08; g2: 05 → 01 → 02; g3: 06 → 03) [D: LD §1];
     - rozwiązany wariant zostaje rozwiązany po przeładowaniu (zapis po ID);
     - po wyczerpaniu wariantów pojawia się zestrojenie: skala liczb z `retune.scales`, losowy start z min. ruchów ≥ `min_moves_at_least`, rozwiązanie istnieje.
  4. **Interakcja:**
     - terminal otwiera się tylko poza walką (`M1_SYS_04`) i pauzuje świat;
     - SEND pokazuje `dostał/potrzebuje` i komórkę problemu;
     - po porażce SEND jest zablokowany dokładnie 1,5 s, a przełączniki zostają;
     - RESET wraca do startu;
     - EXIT zachowuje ustawienie do opuszczenia poziomu;
     - przy Reduce motion wynik pojawia się od razu, bez migania.
  5. **Telefon:**
     - komórki ~38 px w pionie na 360 px;
     - w poziomie 26–30 px przy 9 wierszach (`M1_TERM_03`);
     - tap snap trafia w zamierzony przełącznik dla każdego przełącznika każdego wariantu (bot klika środek i brzegi komórki);
     - SEND / RESET / EXIT ≥ 44 px wysokości [D: spec §5];
     - legenda pod `?` pokazuje tylko elementy wariantu i znacznik NEW;
     - brak liter w siatce.
  6. **Nagroda:**
     - pierwsze rozwiązanie wariantu daje +10% sieci, 40 kr i przystanek windy (pierwszy terminal na głębokości);
     - `M1_TERM_08` odblokowuje Lights;
     - zestrojenie daje 30 kr + 2 Cu [D: `balans-m1.md` §5];
     - podsumowanie pokazuje zmianę (Z6, filar 6).
  7. **Podpowiedzi stopniowane (teksty §11.5, do akceptacji GD):** `?` jest dostępne od startu; pierwsze otwarcie pokazuje tylko `TIP_1`; `M1_TERM_BTN_MORE` odsłania `TIP_2`, potem `TIP_3`, po kolei, nigdy wszystkie naraz; po `TIP_3` MORE znika. Dla każdego z 8 wariantów: 3 ID istnieją, żaden stopień nie zawiera gotowego ustawienia przełączników (porównanie z `solution.taps`, przegląd QA), brak literalnych liczb poza tokenami. `M1_TERM_06`: `TIP_1` ma `{source_power}`; przy zestrojeniu ×2 (26) tekst jest prawdziwy, a flaga `hint_off_when_invalid` decyduje, czy się pokazuje (pytanie do LUZ w tekstach §11.5). Telemetria [WŁ]: stopień podpowiedzi użyty przed rozwiązaniem, na wariant (wskaźnik [QA]: `TIP_3` u właściciela w ≤ 2 z 8 wariantów; częściej = wariant za trudny albo podpowiedzi za słabe).
- **Kroki [WŁ]:** właściciel rozwiązuje warianty w kolejności gry, bez czytania spoilerów (sekcja 8 specyfikacji). Telemetria `terminal_*`: czas, liczba SEND, porzucenia.
- **Metryka:** czas rozwiązania na wariant, liczba SEND, porzucenia, czas całego kontraktu Restore Relay w B1.
- **Stan v0.4.1: ODBLOKOWANY** na Power Lines **v0.5.1** (JSON `"version": "0.5.1"`, `schema_version` 2; nagłówek `.md` i README ta sama wersja). 03 bez [4,5], maks. 4 odbiorniki A–D, przełączniki w odległości Czebyszewa ≥ 2, `consumers[].consumer_type` (`"mid"` od g3), `hint.text_ids` (3 stopnie). **Do akceptacji GD.** Poniższy akapit z v0.4 tylko dla historii.
- ~~**Stan v0.4 (R27): blokada.** Mech v0.5.2 każe mierzyć `M1_TERM_03` **bez pułapki [4,5]**, a `zagadki-m1/` jest nadal v0.4 z pułapką. Pomiar 03 i całego g3 czeka na nową wersję od LUZ / Pracownik 1. Pozostałe warianty mierzymy, ale wyniki g3 (06) z nową regułą `consumers[].consumer_type` = `"mid"` (od g3, `POWER_LINES_MID_FROM_DEPTH`) też czekają na opis tej reguły w `zagadki-m1/`.~~
- **Pomiar kalibrujący M-P4 (prośba LUZ / Pracownik 1, heurystyka czasu z §8 specyfikacji):**
  - **Kto:** (a) **[WŁ] właściciel**: jedyny „pierwszy kontakt” człowieka z wariantem (GD: bez ludzkich testerów); każdy wariant raz, w kolejności gry (04 → 07 → 08 → 05 → 01 → 02 → 06 → 03), bez czytania spoilerów, na telefonie w poziomie; (b) **[BOT] bot QA**: dolna i górna granica, nie zastępuje człowieka: „planujący” (ruchy z solvera, opóźnienie 1,5 s na decyzję) i „zgadujący” (losowe tapnięcia + SEND, kara 1,5 s), po **200 prób na wariant** z różnymi ziarnami; (c) zestrojenia (retune) po wyczerpaniu wariantów: właściciel i bot, ten sam protokół.
  - **Ile:** właściciel ma 1 pierwsze podejście na wariant (8 pomiarów), więc mediany i p80 dla jednej osoby nie da się policzyć. Liczymy: czas właściciela na wariant vs heurystyka (odchylenie %), a medianę i p80 **odchyleń** z 8 wariantów (np. „właściciel +20%, p80 +45%”); kalibrujemy jeden współczynnik i, jeśli trzeba, odstęp p80 (dziś stałe +30 s). Do tego zestrojenia: min. 5 na głębokość [QA], tu już mediana i p80 na głębokość. Bot podaje rozkład (mediana, p80) na wariant jako widełki.
  - **Jak liczymy czas:** od otwarcia okna terminala (`terminal_open`) do rozwiązania (`terminal_solve`), **bez** czasu w auto-pauzie i z nakładką `PAUSED`; EXIT i ponowne otwarcie: czasy sumujemy (porzucenie po EXIT bez powrotu liczymy osobno); kara 1,5 s wchodzi w czas; telemetria: istniejące `terminal_open` / `terminal_blocked` / `terminal_fail` / `terminal_solve` / `terminal_abandon` (§4) + nowe pola [QA]: liczba SEND, najwyższy odsłonięty stopień TIP, czas w pauzie.
  - **Wynik dla LUZ:** tabela wariant × (heurystyka med / p80, właściciel, bot planujący med / p80, bot zgadujący med / p80, stopień TIP użyty przez właściciela), proponowany współczynnik i ocena limitów (g3 ≤ 75 / ≤ 105 s; Relay g3 ≤ 180 s mediany całej sesji w B1).
  - **Próg:** wiążące limity mech v0.5.2; przekroczenie przez właściciela przy 06 albo 03 = zgłoszenie do LUZ (uproszczenie wariantu), 05 i 01 poniżej celu = informacja (M-P2).
- **Progi wiążące (mech v0.5.2):** mediana 30–60 s (g1: 04, 07, 08), 60–90 s (g2: 05, 01, 02), p80 ≤ 120 s; g3 (06, 03): mediana ≤ 75 s, p80 ≤ 105 s. Przekroczenie = zgłoszenie do LUZ / Pracownik 1 (uproszczenie wariantu), nie tylko informacja.
- **Układ i dotyk (mech 2.14a):** 2 kolumny (siatka 272 px + panel 288 px), komórka 28 px (awaryjnie 26), przełącznik klikalny w polu 48×48 (wygrywa najbliższy), litery odbiorników A–D w siatce i panelu z `x/y` na bieżąco, maks. 4 odbiorniki, poniżej ~256 px wysokości `M1_UI_ROTATE_TERMINAL`; auto-pauza w terminalu: nakładka PAUSED / RESUME, po EXIT odliczanie tylko przy wrogu w CHASE/ATTACK.
- **Czas rozwiązania vs budżet sesji (R27):** model QA dla każdego wariantu: liczba SEND bota „planującego” (min. ruchów z solvera) i „zgadującego” (losowe przełączenia do WIN) × 1,5 s kary + czas tapnięć; dla [WŁ] czas pierwszego podejścia. Wynik porównujemy z założeniem mech §2.2 (30–60 s g1, 60–90 s g2–3) i ze specyfikacją (60–120 s, `M1_TERM_03` 2–3 min). Każdy wariant gracz widzi tylko raz, więc liczy się czas pierwszego podejścia, a nie wyćwiczony.
- **Kara za przeciążenie:** OVERLOAD / TRIP / FUSE / SHORT → tekst wyniku z właściwym ID (`M1_TERM_FAIL` tylko dla OVERLOAD), komórka problemu w odwróconej magencie, SEND zablokowany dokładnie 1,5 s (30 ticków czasu rzeczywistego, świat stoi), przełączniki zostają, brak utraty HP, łupu i postępu [D: spec §6]. Wskaźnik [QA]: kara nie zabiera więcej niż 15% czasu zagadki u bota „zgadującego”; jeśli tak, to kara przestaje być „minimalna” (filar 3).
- **Rozwiązywalność:** `validate.py` dla wszystkich 8 wariantów: rozwiązanie istnieje, start nie jest wygraną, liczba wygranych stanów i min. ruchów zgodna z JSON, krzywa trudności rośnie. Każda zmiana specyfikacji = ponowne uruchomienie i wersja w raporcie B3.
- **Próg i wskaźniki:**
  - kroki [BOT] 1–6 zgodne (wymaganie dla LUZ / PROG);
  - wskaźnik: mediana ≤ 120 s na wariant 1–7 [D: mech 2.4, spec §1];
  - `M1_TERM_03` ≤ 3 min [D: szacunek spec §1, pyt. M5];
  - sesja z Restore Relay (otwarcie gry → podsumowanie) mieści się w Z1. Jeśli `M1_TERM_03` jako kontrakt łamie p80 ≤ 4 min, to zgłoszenie do LUZ i Mechaników (pyt. M5).

**B4. Satysfakcja z nagród kontraktów (R13)**: [SYM] + [WŁ]
- Kroki:
  - [SYM] wartość nagrody i trwałego efektu na typ (kr, patche, fragment, biegłość) vs czas z B2;
  - [WŁ] pytanie W-S4.
- Wskaźnik:
  - każdy kontrakt BASE daje co najmniej jedną widoczną trwałą zmianę w podsumowaniu [D: mech 2.2, filar 6];
  - kr/min ≤ wyprawa (W7).

**B5. Przerwanie i wznowienie (E1)**: [BOT]
- Kroki: w losowych tickach (w tym w trakcie zapowiedzi wroga, okna terminala, notatki, dojazdu windy, odliczania 3·2·1) wywołać:
  - A: `visibilitychange`, `blur`, `pagehide`, `freeze`;
  - B: obrót, `resize`;
  - C: `||`, Esc;
  - D: trafienie bez wejścia przez 2 s;
  - E: 60 s bez wejścia;
  - zamknięcie karty i ponowne otwarcie;
  - przeładowanie strony.
- Obserwujemy:
  - stan po wznowieniu;
  - brak automatycznego wznowienia;
  - Spacja nie wznawia;
  - odliczanie 1 s;
  - przy D komunikat *„You were hit while away.”*.
- Metryka: % zgodnych skrótów stanu przed i po; obrażenia w czasie pauzy.
- Próg: **100%** zgodności, 0 obrażeń w pauzie (E1) [D: mech 1.11, GD].

**B6. Trwałość zapisu w czasie (R7, E1)**: [BOT] + PROG / [WŁ] na prawdziwym urządzeniu
- Kroki:
  - zapis na iOS Safari (karta i aplikacja z ekranu głównego) i Chrome Android;
  - powrót po 1, 3 i 8 dniach bez otwierania;
  - eksport i import pliku oraz kodu na drugim urządzeniu;
  - zapis z poprzedniej wersji buildu (migracja).
- Próg: **100%** zachowanego trwałego postępu (kredyty, skrytka, sieć, przystanki, biegłość, ulepszenie, przeczytane notatki) (E1). Na urządzeniu z iOS potrzebny jest właściciel lub PROG.

**B7. Prawdziwy iPhone po publikacji (R7, E1)**: [WŁ], wykonuje właściciel na własnym iPhonie, po publikacji na GitHub Pages
- **Kroki:**
  1. **Safari, karta:** otwórz grę, zagraj ≥ 5 min (zrób jedną ewakuację), zapamiętaj kredyty, % sieci i jeden przedmiot w skrytce. Zamknij kartę, otwórz ponownie: wszystko jest takie samo.
  2. **Przerwanie:** w trakcie wyprawy przełącz na inną aplikację i wróć, potem zablokuj ekran i odblokuj. Gra stoi na `PAUSED`, sama nie rusza, a po RESUME jest odliczanie 3·2·1.
  3. **Kilka dni bez wizyty:** nie otwieraj gry w Safari przez **≥ 8 dni** (dłużej niż 7-dniowy limit WebKit, R7). Potem otwórz: postęp z kroku 1 jest zachowany.
  4. **Ekran główny:** w Safari „Udostępnij → Do ekranu początkowego”. Uruchom grę z ikony:
     - gra działa na pełnym ekranie;
     - podpowiedź iOS (`iosNotStandalone`) już się nie pokazuje;
     - **sprawdź, czy postęp z karty jest widoczny w trybie ekranu głównego**. Na iOS to może być osobny magazyn danych; jeśli postępu nie ma, przenieś go eksportem i importem (krok 6).
  5. **Zapis w trybie ekranu głównego:** zagraj ≥ 5 min, zamknij aplikację (przesuń w przełączniku aplikacji), uruchom ponownie: postęp zachowany. Powtórz po ≥ 8 dniach bez uruchamiania.
  6. **Przypomnienie o eksporcie:**
     - na świeżym zapisie po ≥ 30 min gry pojawia się przypomnienie `neverExported` [D: `data/save-reminder.ts`];
     - wykonaj eksport (plik albo kod) i import na drugim urządzeniu lub w drugim trybie (karta ↔ ekran główny): ten sam stan;
     - „przypomnij później” ukrywa przypomnienie na 24 h.
- **Co zapisać:** wersję iOS, model, datę każdego kroku i zrzut ekranu przy każdej niezgodności (wystarczy krótka notatka do QA).
- **Zaliczone, gdy:** kroki 1, 2, 3, 5 bez utraty postępu, krok 4 z poprawnym działaniem (postęp widoczny albo przeniesiony importem bez strat), a krok 6 pokazuje przypomnienie i eksport/import działa. Każda utrata trwałego postępu = **E1 niezaliczone**, błąd krytyczny dla PROG / Silnik i Narzędzia.

### 3c. Czytelność na telefonie
Rozdzielczości jak w A6. Orientacja pozioma (główna) i pionowa (obsługiwana) [D: mech 1.12].

**C1. Rozmiar znaków i siatka**: [BOT]
- Kroki: pomiar w DOM i canvasie dla 3 stopni czcionki [D: `styl-ascii` §6].
- Metryka:
  - glif w px CSS;
  - komórka;
  - liczba widocznych pól vs 31×17 / 17×21 [D: mech 1.10];
  - nakładki liczb.
- Próg:
  - glif ≥ 16 px [D: `styl-ascii` §2];
  - komórka ≥ 20 px [D: `sterowanie`];
  - nakładki ≥ 12 px z obrysem [D: mech 1.17].

  Niespełnienie przy < 330 px wysokości jest znane (`m0-status` pkt 5): raportowane jako wskaźnik, z decyzją UI.

**C2. Kontrast (R14)**: [BOT] + [WŁ]
- Kroki:
  - [BOT] kontrast WCAG każdego koloru palety względem tła `#0B0F14`, także w wersji „zapamiętane −50%” i w trybie wysokiego kontrastu;
  - zrzuty z symulacją jasnego otoczenia (obniżony kontrast ekranu) [QA];
  - [WŁ] właściciel gra 5 min na zewnątrz: pytanie W-S6.
- Wskaźnik:
  - elementy interaktywne i groźne ≥ 4,5:1 [QA; GRAF podaje wartości w §3];
  - teren świadomie niżej [D: `styl-ascii` §3].

**C3. Rozróżnialność symboli (R12)**: [BOT]
- Kroki:
  - render par glifów w komórce 20 px, czcionka JetBrains Mono, zwykła i bold;
  - miara różnicy obrazu (np. odsetek różnych pikseli lub SSIM) dla par:
    - `:`/`;`, `'`/`"`, `,`/`.`;
    - `*` (strzał / cios / błysk Grid-Grade);
    - `!` żółty / szary;
    - `[=]` na `=`;
    - `§` / `&` / Grid-Grade;
    - pole celu wręcz / wieżyczki (po zdefiniowaniu przez GRAF);
  - to samo po symulacji protanopii, deuteranopii i tritanopii (§8 GRAF);
  - sprawdzenie, że efekt Szumu nie używa `#` `&` `%`, gdy Reduce motion jest wyłączony.
- Wskaźnik [QA]: każda para słabsza niż `.`/`,` (punkt odniesienia) to zgłoszenie do GRAF z wariantem poprawki.

**C4. Dotyk: geometria kontrolek (R11)**: [BOT] + [WŁ]. **WSTRZYMANE (v0.4.1, R35):** układ kontrolek zmieni się na twin-stick; bez rozbudowy do nowej specyfikacji.
- Kroki:
  - [BOT] dla każdej rozdzielczości i trybu leworęcznego: rozmiary kontrolek, odstępy, nakładanie pól trafienia (ATK, sk1–3, USE, `[+]`, `||`), odległość od safe area;
  - [WŁ] pytanie W-S5 o pomyłki;
  - telemetria `input_tap` z heurystyką pomyłki (cofnięcie w < 300 ms) [QA].
- Wskaźnik: ≥ 48 dp, odstęp ≥ 8 dp, brak nakładania [D: `sterowanie` §2]; pomyłki ≤ 5% [QA].

**C5. Zasłanianie mapy (R11)**: [BOT]
- Metryka:
  - % komórek widoku pod kontrolkami i HUD-em na rozdzielczość;
  - czy `@` może trafić pod `||` lub HUD (`m0-status` pkt 10);
  - pasek podpowiedzi Prologu (mech §2.19) jako dodatkowy prostokąt UI: czy zasłania `@`, wroga albo `AT RISK` (R28).
- Wskaźnik: `@` nigdy pod UI [D: kamera, `CAMERA_SAFE_TOP_ROWS`]. Udział zasłoniętych komórek raportowany dla UI. Twardy próg obrażeń jest w A6 (E2).

**C6. Pion vs poziom**: [BOT] + [WŁ]
- Kroki:
  - [BOT] A5 i A6 w obu orientacjach;
  - [WŁ] pytanie W-S7.
- Wskaźnik: uniki bota w pionie ≥ 90% wyniku z poziomu [QA].

**C7. Teksty EN na telefonie**: [BOT]
- Kroki: każdy tekst po ID wyświetlony w oknie tekstu na 360×640 i 568×320.
- Metryka: liczba zdań na fragment, mieszczenie się bez przycinania, przyciski NEXT/CLOSE ≥ 48 dp.
- Próg: ≤ 2–3 zdania na fragment [D: `teksty`, zasady]; 0 przyciętych tekstów [QA].
- ~~Podpowiedzi TIP > 90 znaków~~ **ZAMKNIĘTE (v0.4.1):** 24 TIP-y zatwierdzone przez GD, po podstawieniu tokenów z JSON v0.5.1 maks. **80 znaków** (`M1_TERM_01_TIP_2`, `M1_TERM_03_TIP_3`; `M1_TERM_06_TIP_1` z `{source_power}` = 26 przy skali 2: 60 zn.), limit UI 90 (4 linie × 27 zn. w panelu 270 px, `ui-m1.md` §13). Regresja [BOT]: przy każdej zmianie tekstów lub JSON przeliczyć długość po podstawieniu maks. tokenu (skala z `retune.scales`).

**C9. Teksty śmierci, ryzyka, Prologu i zagadki: ID, limity, zgodność z mech (teksty §11.5, §12)**: [BOT] (kontrola plików i buildu) + przegląd QA. **Wszystkie teksty mają status „do akceptacji GD”**; wyniki C9 raportujemy bez blokowania do decyzji GD.
- **Kroki:**
  1. Każde ID z mech §2.7a i §2.19 ma wiersz w tekstach i jest użyte w buildzie; każde ID z tekstów §12 ma wyzwalacz w mech albo w UI.
  2. Limity: podpowiedzi `M1_TUT_*` ≤ 8 słów, 1 linia, bez pauzy (token = 1 słowo) [D: mech §2.19]; panele i okna ≤ 2 zdania [D: teksty §12; mech §2.7a „2 krótkie zdania” dla `M1_RISK_04`].
  3. Tokeny klawiszy `{KEY_*}` renderują się po przemapowaniu; tokeny `{at_risk}`, `{items_lost}`, `{cr_lost}` mają prawdziwe wartości (A3, Z6).
  4. A2: 0 obietnic odzysku (z wyjątkami z A2).
  5. Kolor nie jest jedynym sygnałem w tekście (filar czytelności, `styl-ascii.md`: kolor drugorzędny po kształcie).
- **Stan na 2026-10-25 ~21:35 (sprawdzone skryptem na `teksty-m1-en.md`):**
  - **Pokrycie:** wszystkie 7 ID z §2.7a i wszystkie ID z §2.19 (`M1_TUT_01T`–`M1_TUT_17`, `M1_TUT_SETTING`, `M1_TUT_SKIP`) mają tekst.
  - **Limity:** wszystkie `M1_TUT_*` z paska mają 2–8 słów (zgodne). Panele `M1_TUT_14` i `M1_TUT_15` mają po 2 zdania (zgodne). **`M1_RISK_04` ma 3 zdania i 38 słów** (228 zn.): niezgodne z limitem 2 zdań z §2.7a i z zasadą samych tekstów §12.
  - **A2:** 0 trafień.

| ID | Mech (§2.7a / §2.19) | Teksty (§12) | Rodzaj rozjazdu | Uwagi QA / do kogo |
|---|---|---|---|---|
| `M1_RISK_01B`, `M1_RISK_01B_YES` | brama areny używa `M1_RISK_01` („Go deeper?” / GO DOWN) | nowe: „Fight the guard? You can lose {at_risk} cr.” / GO IN | nowe ID, brak w mech | sensowne (na g3 nie ma „deeper”). „guard” może się mylić z Curfew Guard; proponuję nazwę bossa albo „the boss”. Mechaniki + GD (pyt. 26 tekstów) |
| `M1_RISK_02_TAG` | znacznik na slocie (wygląd: GRAF) | opcjonalne „AT RISK” | nowe ID, opcjonalne | zależne od GRAF (ikona czy tekst) |
| `M1_RISK_04` (+ alias `M1_UI_DEATH_RULE`) | „2 krótkie zdania A2” | 3 zdania, 38 słów | limit | do skrócenia albo podział na 2 strony panelu; alias = dwa ID na jeden tekst, A2 i A3 muszą sprawdzać oba. Dialogi i Lore |
| `M1_RISK_04_OK` | „przycisk OK” bez ID | OK | nowe ID | bez uwag |
| `M1_RISK_SETTING` | „Confirm before going deeper” | „Ask before going deeper” | zmiana treści | OK (A2 prostsze); mech do aktualizacji |
| `M1_TUT_02T/K` | „Tap USE.” | „Tap USE to take the lift.” | zmiana treści | OK, ≤ 8 słów |
| `M1_TUT_04` | „Yellow ! hits the x. Step off.” | „Yellow ! means attack. Step off the x.” | zmiana treści | **ryzyko czytelności:** oba warianty opierają sygnał na kolorze; przy daltonizmie / Reduce color gracz nie ma „żółtego”. Proponuję „! means attack. Step off the x.” (7 słów). Dialogi i Lore + GRAF |
| `M1_TUT_04B`, `M1_TUT_06K`, `M1_TUT_13`, `M1_TUT_17` | robocze z §2.19 | drobne zmiany sensu („away”, „Stand still and keep holding.”, „Each takes”) | zmiana treści | OK; `M1_TUT_13` mówi tylko o ruchu, a wezwanie przerywa też atak i obrażenia (świadomie, wg tekstów) |
| `M1_TUT_11` | BASE: „Line is on. Go back to the lift.” | „Now go back to the lift.” | zmiana treści | OK (uniknięcie powtórzenia `M1_BASE_09`); A2 nie liczy „go back to” |
| `M1_TUT_14` | „You are printed again. Base, grid and skills are safe.” | „New print complete. Your base, grid and skills are safe.” | zmiana treści | OK |
| `M1_TUT_SKIP` | „Show hints?” | „You know the start. Show hints?” | zmiana treści | OK |
| `M1_TUT_SETTING_DESC`, `M1_TUT_SKIP_YES/NO` | brak | nowe | nowe ID | do listy UI (§2.19 pkt 8) |
| `M1_HUD_SK1–3` (DASH / PULSE / DRONE) | brak; §2.19 zakłada nazwy w tekstach T | nowe | nowe ID, **warunek** | jeśli UI da same ikony, teksty `M1_TUT_06T/10T/16T` trzeba zmienić. UI i Menu |
| `M1_TERM_FAIL` w T08 | §2.19 T08: błąd = `M1_TERM_FAIL` | FAIL tylko dla OVERLOAD; TRIP / FUSE / SHORT mają własne ID | niespójność w mech | do poprawki w §2.19 (pyt. 25 tekstów) |
| `M1_DEATH_BTN` | §2.7: „CONTINUE” | „NEXT” | zmiana treści | OK (spójne z terminalem); A1 sprawdza ID |
| `M1_TERM_xx_TIP` → `_TIP_1/2/3`, `M1_TERM_BTN_MORE` | spec Power Lines i JSON: jedno `M1_TERM_xx_TIP` | 3 stopnie + MORE | zmiana ID | JSON i `validate.py` jeszcze na starym ID (B3 krok 1, pyt. 14a) |

- **Próg:** pokrycie ID 100%, limity zgodne, 0 trafień A2. Rozjazdy treści to informacja dla Mechanik (aktualizacja §2.7a / §2.19 po akceptacji GD), a nie błąd.


**C8. Reduce motion**: [BOT]
- Kroki: włączyć Reduce motion, nagrać zapowiedzi, ewakuację, łup Grid-Grade i Zbieracza.
- Próg: brak migania i pulsowania, a pole celu ma stałe `x` [D: `styl-ascii` §9, mech 1.7].

### 3d. Balans pierwszej godziny

Oczekiwana oś czasu:

| Moment | Oczekiwane | Źródło |
|---|---|---|
| sk1 Dash | od pierwszego wydruku | [D: mech 2.5] |
| 1. fragment sieci, sk2 Shock Pulse | ~10–15 min | [D: mech 2.5] |
| sk3 Buddy Drone | 1. dotarcie na głęb. 2 | [D: mech 2.5] |
| przystanek g2 | ~15 min (44%), ~30 min (63%) u przeciętnego gracza | [D: `balans-m1.md` §6] |
| DPS ~35–37 | ~30 min (przeciętny), ~15 min (dobry) | [D: `balans-m1.md` §6] |
| plecak pełny | w połowie głęb. 2 | [D: mech 2.12] |
| 1. śmierć | ~1 h (przeciętny) | [D: `balans-m1.md` §6] |
| Lights | 23% po 1 h, 57% po 1,5 h, 84% po 2 h (przeciętny); 54% po 1 h (dobry) | [D: `balans-m1.md` §6]; R18 |
| 1. podejście do bossa | v1.1 (wariant C): boss pokonany u 6% przeciętnych po 1 h, 42% po 2 h, 64% po 3 h; u dobrych 37% po 1 h, 94% po 1,5 h. Wartości bossa potwierdzone przez GD | [D: `balans-m1.md` v1.1 §6]; zastępuje ~1,5 h z review 3.5 |

**D0. Nauka gry w Prologu (R5, R26, R28, Z7)**: [BOT] + [WŁ]. Według mech §2.19 (v0.5) i tekstów §12.3 (do akceptacji GD; rozjazdy treści w C9). Elementy UI jeszcze nie istnieją. Bot sprawdza ID, warunki i limit 8 słów w buildzie.
- Właściciele projektu: Mechaniki + UI i Menu, teksty Dialogi i Lore.
- **Kroki [BOT] (czysty zapis, osobno wejście dotykowe i klawiatura):**
  1. **Układ Prologu:** poziom g1 z generatora z terminalem 04 i wstawkami w kolejności na ścieżce BFS wejście → terminal: Scrapper IDLE 12–18 pól, Curfew Guard w pomieszczeniu ≥ 5×5 20–30 pól, skrzynia za nim (Med-Patch + 1 r1), para Scrapperów 30–40 pól, terminal 04. Statystyki wrogów bez zmian (Z-GD2). Układ zależy od braku First Light, a nie od liczby śmierci (po śmierci bez First Light ten sam układ, po First Light zwykły poziom). 100 ziaren [QA].
  2. **Kroki T01–T13:** dla każdego: wyzwalacz, warunek zaliczenia, podpowiedź po czasie (T01 4 s, T02 3 s, T03 6 s) albo przy sytuacji, wariant T/K wg ostatniego urządzenia wejścia, tokeny klawiszy po przemapowaniu, maks. 1 podpowiedź naraz, znika po zaliczeniu albo 4 s (`TUT_HINT_MS`), maks. 2 pokazy bez zaliczenia (`TUT_HINT_MAX_SHOWS`), po zaliczeniu `tutSeen` i nie wraca (także po przeładowaniu).
  3. **T04 zamrożenie (v0.5.2):** raz na zapis, 100 ms po starcie pierwszej zapowiedzi na gracza; `@` i wróg z zapowiedzią bez przyciemnienia, reszta przyciemniona; wznowienie dowolnym kierunkiem ruchu, krok w tym samym ticku; po wznowieniu zostaje **zapowiedź − 100 ms** (Curfew Guard: 500 ms, co do ticka). **Auto-pauza w trakcie zamrożenia:** po RESUME i odliczaniu 1,0 s zamrożenie wraca w tym samym stanie, bez powtórzenia i bez nowego licznika (pozostały czas nadal 500 ms). Zaliczenie = 2 uniki.
  4. **Podpowiedzi nie pauzują gry** (poza T04): licznik ticków rośnie podczas widocznej podpowiedzi.
  5. **Pasek podpowiedzi (v0.5.2):** dół, środek, między joystickiem a przyciskami; 16 px / 2 linie (667×375), 14 px / 3 linie (568×320), 14 px / 1 linia (pion); nie zasłania `AT RISK` ani pól w promieniu 3 od `@` (kamera dostaje prostokąt); alarm windy, niskie HP i `AT RISK` chowają pasek, a potem wraca ta sama podpowiedź; przerwana podpowiedź liczy się do limitu tylko po ≥ 2 s; tap w pasek zamyka podpowiedź. Dodatkowo (R28): żaden wróg w zapowiedzi albo z linią strzału nie jest pod paskiem.
  5a. **Kolejność baza → strefa (v0.5.2):** T02 (puls LIFT w menu bazy) przed T01 (ruch przy wejściu na g1); T10a (`M1_TUT_18`) przy pierwszym udanym wezwaniu windy.
  6. **T10 ewakuacja:** strzałka do szybu aktywna do pierwszej ewakuacji, pierścień przytrzymania USE, odliczanie dojazdu; przerwane wezwanie → `M1_TUT_13`; spóźnienie → `M1_BASE_07` i strzałka dalej aktywna.
  7. **T11 śmierć:** z łupem → `M1_RISK_04` (A3), bez łupu → `M1_TUT_14`; rozwiązany terminal 04 i Shock Pulse zostają po śmierci przed ewakuacją; kontrakt Relay zostaje z postępem 0.
  8. **Pominięcie (v0.5.2, dwa okna w kolejności):** przełącznik „Hints” (`M1_TUT_SETTING`, domyślnie ON). Nowy zapis przy `DEVICE_PROLOGUE_DONE` = true:
     - **okno 1 „Skip tutorial”** (`M1_TUT_SKIP_PROLOGUE`, przyciski `M1_TUT_SKIP_PROLOGUE_YES` „SKIP” / `M1_TUT_SKIP_PROLOGUE_NO` „PLAY”, fokus i Esc = PLAY);
     - **PLAY** → Prolog normalnie, **drugiego okna nie ma**;
     - **SKIP** → stan identyczny jak po Prologu (porównanie zapisów pole po polu poza czasem gry i statystykami, mech 2.17 pkt 21), potem **okno 2 „Show hints?”** (`M1_TUT_SKIP`, przyciski `M1_TUT_SKIP_YES` / `M1_TUT_SKIP_NO`, fokus i Esc = YES); YES → podpowiedzi T12, T13 i pozostałe po Prologu włączone, NO → wyłączone (`M1_TUT_SETTING` = OFF);
     - bez flagi urządzenia żadne okno się nie pokazuje; flaga urządzenia jest poza zapisem (nowy zapis jej nie kasuje);
     - Esc w oknie 1 i w oknie 2 daje wybór domyślny (PLAY, YES), Enter / Spacja przycisk z fokusem.
  9. **Pokrycie listy QA** przed pierwszą sytuacją, w której brak umiejętności może zabić albo kosztować łup: (1) unik T04, (2) bump T03, (3) Dash T06, (4) USE i przytrzymanie T02/T08/T10, (5) alarm windy **T10a** (`M1_TUT_18`, v0.5.2), (6) utrata T07/T11 + A3, (7) terminal poza walką T08.
- **Kroki [WŁ]:**
  - właściciel przechodzi Prolog na telefonie **bez pomocy** i bez czytania dokumentów projektu;
  - telemetria: zaliczenie każdego T, liczba pokazów podpowiedzi, czas do zaliczenia, czas Prologu;
  - po Prologu pytanie W-S1 („Czego gra cię nauczyła?”);
  - właściciel zna wizję gry, więc wynik jest optymistyczny. Bot uzupełnia go sprawdzeniem pokrycia.
- Metryka:
  - pokrycie umiejętności 1–7 [BOT];
  - czas Prologu i czas do pierwszej ewakuacji;
  - podpowiedzi pokazane 2× bez zaliczenia (miejsca, gdzie nauka nie działa);
  - śmierci, których przyczyna to nieznana mechanika (wg A1 i kwestionariusza).
- Próg i wskaźniki:
  - kroki [BOT] 1–8 zgodne z §2.19 v0.5.2 (Z7, mech 2.17 pkt 21); pokrycie **7/7**;
  - czas Prologu 10–15 min, bez śmierci ≈ 6–10 min [D: mech §2.19];
  - pierwsza ewakuacja ≤ 10 min gry [QA, przyjęte w mech §2.19 jako wskaźnik QA; tam błędnie jako „D1”, u nas D0];
  - ≤ 1 śmierć z niewiedzy [QA].

**D1. Krzywa trudności głęb. 1 → 3**: [SYM]
- Kroki: symulacja poziomów (generator M1 + skład wrogów) z botem przy 0 / 50 / 70% uników i sprzętem „na wejściu” i „docelowym”, także walki grupowe z żetonami (symulacja Balansu liczy 1v1 jako dolną granicę, `balans` 2.3).
- Wskaźnik:
  - HP na poziom vs 82 / 188 / 285 (model grupowy, Balans v1.1; W6) i 79 / 169 / 254 (1v1, dolna granica) [D];
  - budżet z mech 2.13;
  - odchylenie dla walk grupowych raportowane do Balansu.

**D2. Tempo nagród i progresji w pierwszej godzinie (W5, W10)**: [SYM] + [WŁ]
**Dane:** `balans-m1.md` v1.0, uzupełnione o v1.1 (niżej). **Całość nadal jest propozycją do akceptacji GD:** boss i półka ×4 mają już decyzję GD, ale ujścia kredytów §7 (miejsce r3 ×5, odświeżenie półki, kalibracja, Lights II/III) czekają na GD, więc ceny i wskaźniki mogą się zmienić. Kredyty startowe: nadal brak w v1.1 (R16), więc założenie QA **0 kr**.

**Aktualizacja `balans-m1.md` v1.1 §6 (`progresja2.py`, wariant C = półka + ujścia, rekomendacja Balansu):** przeciętny gracz po 30 min: DPS 38, 358 kr, przystanek g2, pierwszy zakup z półki (160–240 kr); po 1 h: g3 20%, boss 6%, DPS 38, **384 kr**, średni stopień Lights 0,3, pierwsza śmierć i odbudowa z półki; po 1,5 h Lights I. Dobry gracz po 1 h: g3 90%, boss 37%, DPS 58, 633 kr. Wnioski dla wskaźników QA niżej: Lights w 1. godzinie nadal NIE (R18); odkupienie broni + pancerza ilvl 2 r2 (480 kr) jest powyżej salda przeciętnego gracza po 1 h (384 kr), więc odbudowa opiera się na zapasie w skrytce (R20). Tabela osi czasu niżej pochodzi z v1.0 i zostaje jako punkt odniesienia; [SYM] liczymy na v1.1.

- **Kroki [SYM]:**
  1. Uruchomić model `progresja2.py` Balansu (v1.1, wariant C; 200 graczy na profil) **na danych z `src/data/` buildu** (R23). Profile: przeciętny (50% uników), dobry (70%), „tylko kontrakty g1”, „zawsze dalej”.
  2. Zapisać czasy kamieni milowych i porównać z tabelą niżej.
  3. Policzyć wskaźniki ekonomiczne pierwszej godziny (tabela „Wskaźniki QA”).
- **Kroki [WŁ]:** z telemetrii właściciela (pierwsza godzina na czystym zapisie) te same kamienie milowe, jako punkt kontrolny dla modelu.

**Oś czasu z modelu Balansu** [D: `balans-m1.md` §6]:

| Czas | Przeciętny (50% uników) | Dobry (70%) |
|---|---|---|
| 15 min | g1 (44% ma przystanek g2), DPS 31, 230 kr, sieć 30% | g2 (66%), DPS 37, 352 kr, sieć 30% |
| 30 min | g2 (63%), DPS 37, 373 kr, 7 Cu | g2 (90%), DPS 40, 424 kr |
| 60 min | g2 (88%), g3 14%, DPS 38, 501 kr, 10 Cu, sieć 50%, Lights 23%, 1 śmierć | g3 (89%), DPS 55, 1122 kr, sieć 70%, Lights 54%, boss 40% |

**Wskaźniki QA** (przeliczenia z `balans-m1.md` §2–5; start 0 kr [QA]):

| Wskaźnik | Wartość | Jak policzone |
|---|---|---|
| Kontrakty do 1. zakupu Med-Patcha (25 kr) | **1 Restore Relay** (40 kr) albo ~1,2 min wyprawy g1 | Clear the Path g1 daje patcha, a nie kredyty, więc się nie liczy |
| Kontrakty do 1. przedmiotu z półki, ilvl 1 r1 (10 × 4 = 40 kr) | **1 Relay** | `SHOP_ITEM_PRICE_MULT` = 4 |
| … ilvl 1 r2 (40 × 4 = 160 kr) | **4 Relay** (~8 min kontraktów) albo ~7,6 min wyprawy g1 (21 kr/min) | |
| … ilvl 2 r2 (60 × 4 = 240 kr, po przystanku g2) | **6 Relay** albo ~4,6 min wyprawy g2 (52 kr/min) | |
| Lights: kredyty (200 kr) | 5 Relay albo ~9,5 min g1 | Copper jest wąskim gardłem (R18) |
| Lights: Copper (15 Cu) | ~2 poziomy g2 (~8 Cu na poziom) albo 5 × Data Core (3 Cu) albo 8 zestrojeń (2 Cu, tylko po wyczerpaniu wariantów) | |
| Odrobienie straty po śmierci na końcu g1 (~170 kr `AT RISK`) | **~8 min** (1 poziom g1) | 170 / 21 kr/min |
| Odrobienie straty po śmierci w połowie g2 (~580 + ~200 sprzęt = ~780 kr) | **~15 min g2** albo **~37 min g1** | 780 / 52 i 780 / 21 kr/min; sprzęt [Z Balansu, review 6.1] |
| Odkupienie broni + pancerza ilvl 2 r2 w sklepie | 480 kr ≈ **9 min g2 brutto**; przeciętny gracz ma 501 kr po 1 h | R20 |
| Udział kosztu patchy w EV zejścia | ≤ 13% | review 6.1 |

**Wskaźniki [QA] dla pierwszej godziny** (informacja, nie kryteria):
- 1. fragment sieci ≤ 15 min u przeciętnego gracza [D: mech 2.5]; model daje sieć 30% po 15 min, więc OK;
- przystanek g2 u ≥ 60% przeciętnych graczy po 30 min [QA]; model: 63%;
- **Lights po 60 min u ≥ 50% przeciętnych graczy [QA]; model: 23%, więc NIE (R18)**;
- ≤ 1 śmierć w pierwszej godzinie u przeciętnego gracza [QA]; model: 1;
- czas odrobienia straty g2 ≤ 2 wyprawy [D: mech 2.18 pkt 3] tylko z zapasem w skrytce; bez zapasu ~15 min g2, a gracz na Issue nie przekracza progu DPS 30 do zejścia (R20);
- kredyty po 60 min > koszt Lights + 2 przedmioty z półki ilvl 2 r2 (680 kr) [QA]: model 501 kr. Ujście kredytów w 1. godzinie działa (nadmiar dopiero od ~90 min, R21).
- **Metryka [WŁ]:** te same kamienie i wskaźniki z telemetrii właściciela; odchylenie > 30% od modelu [QA] = zgłoszenie do Balansu.

**D3. Ekonomia kontraktów (W7)**: [SYM]
- Wskaźnik: mediana kr/min każdego kontraktu BASE ≤ wyprawa tej głębokości [D: mech 2.17 pkt 16].

**D4. Duża strata i odbudowa (R4)**: [SYM]
- Kroki: od stanu z `AT RISK` ≈ 400–600 kr [D: mech 2.12] → śmierć → odbudowa na Issue.
- Metryka: liczba wypraw do odzyskania wartości sprzętu.
- Warianty: (a) z zapasem w skrytce [Z Balansu]; (b) bez zapasu, odbudowa z łupu; (c) bez zapasu, z zakupami z półki ×4 (R20); (d) v1.2: Issue Mk2 po przystanku g2 + broń r1 na półce po śmierci (`ISSUE_TIER_BY_STOP`, `SHOP_DEATH_WEAPON`); oczekiwane 2 wyprawy (p80 3) [D: Balans v1.2 §8.3].
- Wskaźnik: ≤ 2 wyprawy na tej samej głębokości [D: mech 2.18 pkt 3; Balans: spełnione w wariancie (a)]. Raport dla (b) i (c): wyprawy i minuty do odzyskania DPS ≥ 30 (próg zejścia na g2 w modelu Balansu).

**D4a. Pojemność skrytki i zapas na odbudowę (R20)**: [BOT] + [SYM]. Dane: `STASH_SLOTS` 30 / 40 / 50 / 60 (Lights 0 / I / II / III), stos materiałów 20, Med-Patche niesprzedawalne, `START_CREDITS` 50, pusta skrytka na starcie [D: `balans-m1.md` v1.2 §1, §4.1; mech 2.16].
- Kroki [BOT]:
  1. Nowy zapis: skrytka ma 30 slotów i jest pusta; zakup Lights I / II / III podnosi do 40 / 50 / 60 natychmiast, w UI i w zapisie, i przetrwa przeładowanie.
  2. Wypełnienie skrytki do pełna: przeniesienie z plecaka blokuje się z komunikatem, nic nie znika; stosy materiałów łączą się do 20.
  3. Skrytka nie przepada przy śmierci (A3 krok 4), przedmioty w skrytce bez znacznika „can be lost”.
  4. Teksty podają pojemność tylko tokenem `{STASH_SLOTS}` z poprawną wartością dla poziomu Lights.
- Kroki [SYM] (model progresji Balansu, polityka „zapas w skrytce”): liczba zajętych slotów skrytki po 15 / 30 / 60 min u przeciętnego gracza.
- Wskaźniki [QA]:
  - zapas na odbudowę (pełny zestaw 4 sloty + materiały) mieści się w 30 slotach w pierwszej godzinie: oczekiwane ~5–7 / 30 (ocena QA, R20);
  - skrytka pełna w pierwszej godzinie u ≤ 10% graczy [QA]; więcej = zgłoszenie do Balansu;
  - [WŁ] po pierwszej śmierci: czy właściciel miał zapas w skrytce (telemetria) i czy go użył; odbudowa ≤ 2 wyprawy [D: Balans v1.2 §8.3].

**D5. Momenty frustracji i nudy**: [BOT] (analiza telemetrii) + [WŁ]
- [BOT] wzorce w telemetrii właściciela i botów:
  - > 60 s marszu bez zdarzenia [QA];
  - powtórzone M1_SYS_04 lub M1_SYS_06;
  - spóźnione okno windy;
  - porzucony terminal;
  - śmierć z dużym `AT RISK`;
  - koniec sesji tuż po śmierci.
- [WŁ] pytanie W-S8.
- Wskaźnik: raport częstości dla działów, bez progu.

**D6. Łup, właściwości i plecak (R15, R22, R24)**: [SYM] + [BOT]
**Dane:** `balans-m1.md` §3 (propozycja do akceptacji GD), liczone z `src/data/` buildu (R23).
- **Kroki [SYM/BOT]: generator łupu** (100 000 przedmiotów na głębokość):
  1. liczba właściwości = rzadkość (1 / 2 / 3); brak powtórzeń w przedmiocie; tylko właściwości dozwolone w slocie (tabela niżej); rozkład wag zgodny z kolumną „Waga” (±2 p.p. [QA]);
  2. wartości całkowite w zakresie rzadkości;
  3. bazy: broń wręcz 8–12 / 10–15 / 13–19, dystans 8–11 / 10–14 / 13–18, pancerz 6–10 / 13–19 / 20–28, moduł +5 / +10 / +15 HP, Narzędzie +10 / +15 / +20% Scrap;
  4. rzadkości 80/18/2, 65/30/5, 50/38/12%; P(≥ 1 Grid-Grade na poziom) 12 / 36 / 68%;
  5. ceny sprzedaży 10/40/150 × (1 + 0,5·(ilvl−1)); półka = ×4, r1 70% / r2 30%, bez r3, ilvl = najgłębszy przystanek.
- **Kroki [BOT]: efekt każdej właściwości w grze** (przedmiot z maksimum zakresu r3, pomiar przed i po):

| ID | Efekt | Sloty | r1 / r2 / r3 | Limit | Co mierzy bot |
|---|---|---|---|---|---|
| 01 | +% obrażeń ataku | W, M | 5–8 / 9–14 / 15–20 | 50% | średnie obrażenia ciosu |
| 02 | +% szybkości ataku | W, M | 4–6 / 7–10 / 11–15 | 30% | średni cykl w tickach (akumulator, np. −10% = 7,2 ticka, a nie 7) |
| 03 | +p.p. krytyka | W, M, T | 3–5 / 5–8 / 8–12 | +25 p.p. | częstość krytyków |
| 04 | +maks. HP | A, M | 6–10 / 11–18 / 19–28 | +60 HP | maks. HP w HUD |
| 05 | +pancerz | A, M | 2–4 / 4–7 / 7–10 | DR cap 60% | DR w tooltipie = A/(A+100) |
| 06 | +% leczenia patchy | A, M | 10–15 / 16–25 / 26–35 | 60% | HP z patcha (40 → maks. 64) |
| 07 | +% szybkości ruchu | A, T | 3–5 / 6–8 / 9–12 | 20% | pola/s (akumulator) |
| 08 | +% obrażeń umiejętności | W, M | 10–15 / 16–25 / 26–35 | 60% | Shock Pulse, Buddy Drone |
| 09 | −% odnowienia umiejętności | M, T | 4–6 / 7–10 / 11–15 | 30% | odnowienie (mnożone z biegłością) |
| 10 | +% szansy na łup | T | 5–8 / 9–12 / 13–18 | 40% | zrzut względnie do 0,20 |
| 11 | −% kanałowania | T | 10–15 / 16–25 / 26–35 | 50% | wezwanie windy (1,5 s → maks. 0,75 s); **definicja sporna (R22)** |
| 12 | +pola podnoszenia | A, T | +1 / +1 / +2 | +2 | promień auto-podnoszenia |

  Dodatkowo:
  - limity łączne obcinane przy sumie z kilku przedmiotów;
  - Narzędzie: bonus Scrapu na pojedynczym zrzucie 2–4 Scrap (R24: oczekiwane 0 przy zaokrągleniu w dół).
- **Kroki [BOT]: DPS kontrolny** (cel Balansu):
  - broń ilvl 2 r2 (+11% obr., +8% szyb.) ≈ 37;
  - ilvl 3 r2 ≈ 48;
  - ilvl 3 r3 + moduł r3 ofensywny ≈ 70–75 (pułap, R21).
- **Kroki [BOT]: tooltip i plecak na 360×640 i 640×360:**
  - nazwa z prefiksem i sufiksem, rzadkość z `◆` / `◆◆` i ramką (sygnał bez koloru);
  - wartości po zaokrągleniu, porównanie z założonym przedmiotem (różnica DPS, DR „−x%”, HP);
  - znacznik „can be lost” (Z4);
  - plecak 12 slotów: pełny blokuje podnoszenie (`M1_SYS_06`);
  - ekwipunek w walce nie pauzuje [D: mech 2.14].
- **Kroki [SYM]: decyzja w plecaku.** Bot z prostą heurystyką (porównanie DPS / eHP) porównany z wyborem „najwyższa cena sprzedaży”. Raport: jak często tooltip wskazuje inny wybór niż wartość w kr.
- **Próg:**
  - generator i limity 100% zgodne z tabelą (wymaganie dla Balansu i PROG);
  - **0 właściwości bez mierzalnego efektu** (R24 i R22 jako znane wyjątki do decyzji);
  - 0 przyciętych tooltipów.
- **Wskaźniki [QA]:** DPS kontrolny ± 10% od celu Balansu; czytelność tooltipu oceniana w C1/C3.

**D7. Boss (R17, R21, R32, W9)**: [SYM] + [BOT]. **R32 zamknięte (v0.4.1):** `BOSS_HP` = 2400, cel 65–75 s przy 48 DPS (model 68 s); 2600 to wartość zapasowa, gdy mediana z pomiaru D7 < 65 s w paśmie 44–52 DPS przy zmierzonym udziale bicia. Boss 2400 / 20–32 / 800 / 1200 ms potwierdzony przez GD; reguła v0.5.2: mediana 65–75 s przy typowym sprzęcie g3 (~48 DPS), **< 65 s → `BOSS_HP` 2600** [D: mech 2.11, 2.16, 2.17 pkt 17].
- Dane: szarża co 4. atak (900 ms, 2 ticki na pole, pas świeci stale, S14), ogłuszenie 2 s, słaby punkt ×2; przywołanie 600 ms (bez `!`, A4 krok 5), 2 drony g3 (88 HP, 12–18, 450 ms), aktywacja 500 ms; boss zajmuje 1 żeton.
- **Przeliczenie QA (v0.4)** modelem Balansu `design/balans-sim/boss_v05.py` (bez zmian w pliku; QA wywołuje `fight()` z innym DPS i wykorzystaniem wręcz; start 100 HP, 6 patchy; 3000 walk na punkt; DR wg sprzętu 7–25%). Mediana wygranych walk [s] / % wygranych przy 50% uników:

| DPS (kto) | wykorzystanie 0,5 | 0,6 (założenie Balansu) | 0,7 | 2600 HP przy 0,6 |
|---|---|---|---|---|
| 32 (Issue + r1, 15–30 min) | 99 / 25% | 91 / 38% | 87 / 42% | 101 / 25% |
| 38 (przeciętny po 1 h, `balans` §6) | 86 / 69% | 79 / 81% | 75 / 82% | 87 / 68% |
| 44 (próg „na bossa” w modelu progresji) | 79 / 89% | 71 / 94% | 68 / 96% | 79 / 89% |
| **48 (typowy sprzęt g3)** | **70** / 98% | **68** / 99% | **62** / 99% | 71 / 98% |
| 58 (dobry po 1 h) | 60 / 100% | 57 / 100% | 53 / 100% | 60 / 100% |
| 72 (pułap) | 50 / 100% | 46 / 100% | 46 / 100% | 50 / 100% |

  Przy 70% uników czasy są te same (model liczy czas prawie tylko z DPS), a wygrane rosną do 97–100%. Wynik przy 48 / 0,6 (68 s) zgadza się z Balansem i mech.
- **Wniosek dla reguły 2600 HP:** przy typowym sprzęcie (48 DPS) **nie wychodzi < 65 s** przy założeniu 0,6 (68 s) ani 0,5 (70 s); **wychodzi 62 s przy 0,7**. Każdy gracz z ≥ ~52 DPS (dobry gracz po 1 h: 58 DPS) daje < 65 s. Przeciętny gracz pierwszej godziny (38 DPS) ma 75–86 s, czyli powyżej celu. Rozrzut modelu jest nierealnie wąski (p20–p80 ~1,5 s). R32.
- **Kroki:**
  1. [SYM] tabela wyżej na danych z `src/data/` buildu (powtórzyć po każdej zmianie bossa);
  2. [BOT] walki z botem na pasach DPS 38 / 44–52 / 58 / 72, start z przystanku g3 i pełna wyprawa 1 → 3; telemetria: **wykorzystanie wręcz w fazie zamachu** (% ticków w zasięgu 1 przy aktywnym oknie bicia), obrażenia w oknie przywołania, liczba szarż;
  3. [WŁ] walki właściciela z tą samą telemetrią.
- **Wskaźniki:**
  - mediana na pasie **44–52 DPS** w 65–75 s; decyzja 2600 HP tylko na tym pasie i przy zmierzonym wykorzystaniu (R32);
  - pozostałe pasy raportowane osobno (oczekiwane: 38 DPS ~75–86 s, 72 DPS ~46–50 s; pułap zaakceptowany przez GD);
  - wyprawa „na bossa” (48 DPS, 50% uników): ~53% [D: mech 2.11], przy 2600 ~44%;
  - budżet HP 82 / 188 / 285 [D: Balans v1.1].

---

## 4. Metody (bez ludzkich testerów, decyzja GD)

### 4.1 Symulacja [SYM]
- Podstawa: skrypty Balansu (`design/balans-sim/`: `sim_m1.py`, `wyprawa.py`, `boss.py`, `ekonomia.py`) oraz headless symulacja logiki gry (TypeScript, Vitest/Node) na **tych samych danych** z `src/data/`. Dzięki temu test reguł (A4) i balans liczą się z danych buildu, a nie z kopii liczb.
- Stałe ziarna, wyniki powtarzalne. Każdy raport podaje wersję danych i liczbę prób.
- Modele zachowania bota:
  - uniki 0 / 50 / 70%;
  - reakcja 250 / 300 ms [D: mech 1.5];
  - polityki dalej/wracać (A8);
  - polityka „rozsądna” dla pierwszej godziny (D2).

### 4.2 Boty QA [BOT]
- Wykonawcy: QA / Tester 1 i QA / Tester 2.
- Narzędzia: Chrome headless + Playwright (już używane przez PROG w M0, `m0-status`) na buildzie z flagą telemetrii.
- Zakres:
  - gra skryptowana i losowa (A1–A7, B1–B6);
  - pomiary geometrii, rozmiarów i kontrastu (C1–C8);
  - zrzuty ekranu na każdej rozdzielczości;
  - przegląd zrzutów przez bota (opis tego, co widać, porównanie z wymaganiami GRAF i UI).
- Ograniczenie: bot nie ocenia przyjemności ani uczciwości. Te oceny daje tylko właściciel (W8, E3).

### 4.3 Granie właściciela [WŁ] i kwestionariusz
- **Kiedy:**
  - po każdej rundzie z grywalnym buildem, krótkie sesje na telefonie (B1) plus jedna dłuższa (głęb. 1→2);
  - Prolog na czystym zapisie (D0) raz, przed poznaniem projektu nauki.
- **Jak:** właściciel gra jak gracz. Telemetria zbiera się lokalnie, a po sesji właściciel eksportuje plik (jak eksport zapisu) i przekazuje QA. Bez nagrywania i bez moderatora.
- **Kwestionariusz po sesji** (2–3 min; oceny 1–5 albo krótka odpowiedź):
  - W-S1. Czego gra cię nauczyła sama, a czego musiałeś się domyślić? (po Prologu)
  - W-S2. Czy wiedziałeś, co cię zabiło i co mogłeś zrobić inaczej? Czy zdążyłeś to przeczytać przed przejściem ekranu? (tak/nie, przy każdej śmierci, jeśli była; R30)
  - W-S3. Utrata łupu bolała, ale była uczciwa. (1–5) Decyzja „dalej czy wracać” była odczuwalna. (1–5)
  - W-S4. Kontrakt był wart mojego czasu. (1–5, który kontrakt)
  - W-S5. Bump attack nie przeszkadzał mi w unikach. (1–5) Czy zdarzyło się wcisnąć nie ten przycisk? (nie / raz / kilka razy)
  - W-S6. Czy coś na ekranie było nieczytelne (znak, kolor, tekst, w słońcu)? (otwarte)
  - W-S7. W której orientacji grało się lepiej? (pion / poziom / bez różnicy)
  - W-S8. Najnudniejszy i najbardziej frustrujący moment. (otwarte)
- **Pytanie końcowe M1 (kryterium wyjścia E3):**
  - W-K1. Zagrałeś w M1. Czy chcesz grać dalej? (tak/nie, co by to zmieniło)

### 4.4 Telemetria
Budżet 0 zł i brak serwera [D: plan]: **lokalny dziennik zdarzeń** w buildzie testowym (flaga), eksport JSON. Ten sam format dla botów i właściciela. Każde zdarzenie ma `t` (tick), `wallclock`, `sessionId`, `source` (BOT/WŁ/SYM), `device` (CSS px, orientacja, wejście) i `buildVersion`.

| Zdarzenie | Pola | Do czego |
|---|---|---|
| `app_open` / `session_end` | powód końca | B1 (Z1) |
| `pause` / `resume` | wyzwalacz A–E/menu/tekst, czas, stan walki, skrót stanu | B5 (E1) |
| `save_write` / `save_load` / `save_load_fail` / `save_export` / `save_import` | skrót stanu, wersja zapisu | B5, B6 (E1) |
| `orientation_change` / `settings_change` | czcionka, reduce motion, kontrast, leworęczny, potwierdzenie `>` | C1–C8, A3 |
| `base_enter` / `base_leave` | czas w bazie, zakupy | B1, B2 |
| `contract_accept` / `contract_complete` / `contract_fail` | typ, głęb., czasy faz, nagroda | B1–B4, D3 |
| `lift_depart` | głęb., `AT RISK`, plecak, patche, HP | A8, D2 |
| `level_enter` / `level_exit` | głęb., ziarno, sposób wyjścia, czas | D1, D2 |
| `descend_confirm_shown` / `descend` / `descend_cancel` | `AT RISK` w potwierdzeniu i w HUD | A3 (Z4), A8 |
| `hint_shown` / `skill_first_success` | ID podpowiedzi lub umiejętności (lista D0) | D0 (Z7) |
| `enemy_alert` | typ, dystans, widoczność | A6 |
| `telegraph_start` | typ, atak, `windup_ticks`, cel, żetony, **widoczność źródła i pola celu** (w widoku / pod UI) | A4, A5, A6 (E2) |
| `telegraph_resolve` | trafiony / unik krokiem / Dash / przerwany Shock; ATK / bump | A5 |
| `damage_taken` | źródło, obrażenia przed i po pancerzu, HP po, była zapowiedź?, **źródło widoczne?** | A1, A6 (E2), D1 |
| `death` | zabójca, ostatnie 5 trafień, **tekst pokazany na ekranie śmierci**, `AT RISK`, strata w podsumowaniu, faza (walka/ewakuacja/eksploracja) | A1 (Z3, Z6), A2 |
| `death_explainer_shown` | czy pierwszy raz | A3 (Z4) |
| `evac_call_start` / `evac_call_interrupt` (powód) / `evac_arrive` / `evac_enter` / `evac_missed` | wrogowie z alarmu, HP | A7 |
| `terminal_open` / `terminal_blocked` / `terminal_fail` / `terminal_solve` / `terminal_abandon` | wariant, czas (bez pauzy), próby SEND, stopień TIP (v0.4.1) | B3 (kalibracja M-P4) |
| `medpatch_use` / `skill_use` / `bump_attack` | kontekst | A5, A9 |
| `input_tap` | kontrolka, wykonana?, cofnięcie < 300 ms | C4 |
| `loot_pickup` / `bag_full` / `inventory_open` | rzadkość, wartość, w walce? | D2, D6 |
| `grid_fragment` / `skill_unlock` / `upgrade_built` | czas gry | D2 |
| `summary_shown` | tekst stopki (ID), wiersze | A1, A2, B1 |
| `perf_sample` | FPS co 10 s, encje | kontekst (mech 2.17 pkt 12) |

### 4.5 Rundy
| Runda | Kiedy | Kto | Zakres |
|---|---|---|---|
| T0 | od razu, na danych | [SYM] | A4 (reguła zapowiedzi), A8, A9, D1, D2 (model), D3, D4, D6 (generator), D7, B3 krok 1 (`validate.py`) |
| T1 | pierwszy build M1 z pętlą | [BOT] | A1–A3, A5–A7, B1–B2, B5, C1–C8, telemetria działa |
| T2 | po poprawkach T1 | [BOT] + [WŁ] | D0 (Prolog właściciela), B1 (sesje właściciela), kwestionariusz, A5 kalibracja |
| T3 | przed zamknięciem M1 i po publikacji | [BOT] + [WŁ] | regresja (A2, A4, A6, B5), B6 (dni), **B7 (iPhone, właściciel)**, D2, D6, B3, **E1–E3** |

### 4.6 Checklisty
**Przed rundą [BOT]**
- [ ] build z flagą telemetrii, wersja zapisana;
- [ ] lista rozdzielczości i orientacji z A6;
- [ ] czyste zapisy + zapisy startowe (głęb. 2 z łupem, arena bossa, zapis z poprzedniej wersji);
- [ ] stałe ziarna zapisane w raporcie.

**Przed sesją właściciela**
- [ ] build na GitHub Pages / link testowy działa na telefonie właściciela;
- [ ] telemetria włączona, instrukcja eksportu pliku (1 zdanie);
- [ ] kwestionariusz (§4.3) dołączony.

**Każdy ekran** (strefa, baza, Exchange, skrytka, plecak, terminal, notatka, podsumowanie, ekran śmierci, pauza, potwierdzenie `>`)
- [ ] widok w poziomie i pionie na 360 px i 375 px wysokości;
- [ ] HUD nie zasłania `@` ani wrogów;
- [ ] glif ≥ 16 px, nakładki ≥ 12 px z obrysem;
- [ ] przyciski ≥ 48 dp, odstęp ≥ 8 dp;
- [ ] każda informacja ma drugi sygnał poza kolorem;
- [ ] Reduce motion wyłącza miganie, a znaczenie zostaje.

**Śmierć**
- [ ] zabójca i ostatnie trafienia zgodne z telemetrią (Z3);
- [ ] strata = ostatni `AT RISK` (Z6);
- [ ] teksty bez obietnicy odzysku (Z5);
- [ ] wyjaśnienie zasady tylko przy 1. śmierci z łupem (Z4);
- [ ] podsumowanie pokazuje ≥ 1 trwałą zmianę [D: mech 2.2].

**Zapis (E1)**
- [ ] przerwania A–E, zamknięcie karty, przeładowanie: stan zgodny;
- [ ] wznowienie tylko świadome, odliczanie 1 s, Spacja nie wznawia;
- [ ] eksport/import między urządzeniami;
- [ ] trwałość po dniach (iOS, Android).

---

## 5. Szablon zgłoszenia problemu grywalności

```
ID: GRA-QA-M1-###           Data:            Build:
Tytuł: [obszar] krótki opis problemu z perspektywy gracza
Obszar: ryzyko/śmierć | krótkie sesje | czytelność | balans 1. godziny | sterowanie | zapis | inne
Typ: KRYTERIUM WYJŚCIA (E1–E3) | WYMAGANIE Z DECYZJI (Z1–Z7) | WSKAŹNIK (W/[QA])
Priorytet: wysoki / średni / niski
  wysoki = łamie E1–E3, powoduje nieuczciwą śmierć albo utratę trwałego postępu
  średni = łamie Z1–Z7 albo wyraźnie odbiega od wskaźnika
  niski = drobna niejasność, kosmetyka
Źródło danych: SYM / BOT / WŁ (właściciel)
Częstość: X z N przebiegów / sesji
Urządzenie / rozdzielczość / orientacja / wejście:
Scenariusz (np. A6) i kroki odtworzenia (ziarno, zapis startowy):
  1.
  2.
Co gracz (bot/właściciel) chciał zrobić / czego się spodziewał:
Co się stało:
Dowód: zrzut / klip, wycinek telemetrii (zdarzenia, tick), komentarz właściciela (jeśli jest)
Metryka i próg: wynik vs próg (np. A4: Panel Drone 350 ms vs ≥ 400 ms [D: GD])
Odniesienie do dokumentu: (plik §sekcja, cytat)
Prawdopodobna przyczyna (hipoteza QA):
Propozycja poprawki lub pytanie:
Właściciel: (dział wg zespol.md)   Status: nowe / w analizie / poprawione / zweryfikowane / odrzucone (powód)
```

---

## 6. Otwarte pytania (z właścicielami)

**ZARZ / Producent**
1. ~~Zapis decyzji o długości sesji w `zespol.md`~~ **ZAMKNIĘTE (v0.3):** linia 25 zawiera „od otwarcia gry do podsumowania, mediana ≤ 3 min, p80 ≤ 4 min”. 30 s–3 min zostaje tylko w wizji jako opis doświadczenia.

**DESIGN / Mechaniki**
2. ~~Synchronizacja 450 ms~~ **ZAMKNIĘTE (v0.3):** tabele mech, Balans v1.1 i kod mają 450 ms. (R3, R23)
3. ~~Alarm windy w nauce~~ **ZAMKNIĘTE (v0.5.2):** krok T10a, `M1_TUT_18`. (R5)
3a. ~~T04: 350 ms~~ **ZAMKNIĘTE (v0.5.2):** zapowiedź − 100 ms. (R26)
3b. ~~STAY cofa~~ **ZAMKNIĘTE (v0.5.2):** STAY zostawia na `>`. (R25)
3d. ~~Enter w oknie `>`~~ **ZAMKNIĘTE (v0.5.2):** Enter i Spacja na fokus, domyślnie STAY. (R29)
3e. ~~Obrażenia a wezwanie~~ **ZAMKNIĘTE (v0.5.2):** `EVAC_CALL_INTERRUPT_ON_DAMAGE` = false. (R31)
3f. Resztki R33: tabela pakietu R6 w 2.9 („przerywane jak dotąd”), wiersz `BOSS_HP` w 2.16 bez pasma 44–52 DPS. (R33)
3g. Czy ucieczka windą od 1 wroga kosztem 1–2 patchy jest zamierzona? Decyzja po A7 scenariusz 6. (R34)
3c. ~~Czas zagadki~~ **ZAMKNIĘTE (v0.5.2 + Power Lines v0.5.1):** czasy wiążące, 03 bez pułapki; pomiar B3. (R27)
4. ~~Czas wyjazdu windy~~ **ZAMKNIĘTE:** `LIFT_RIDE_MS` = 2 s (mech v0.5).
5. Wieżyczka: strzał natychmiastowy w pole czy pocisk `•`? (R12)
6. ~~Alarm windy~~ **Odpowiedziane w 2.9 (pakiet R6), decyzja po stronie GD** (pyt. 26a). (R6)
7. Bump i joystick przy aktywnej zapowiedzi na polu gracza (z UI i Menu / LUZ Pracownik 3). (R10)
8. ~~Slot Narzędzie~~ **ZAMKNIĘTE:** `TOOL_SALVAGE_PCT` (Balans §3.1). Zostaje R24 (zaokrąglenie).
8a. Zasady zagadki Power Lines (pyt. M1–M9 LUZ), szczególnie M5 (czas `M1_TERM_03`), M7 (komórka w poziomie) i M9 (kolejność odkrywania). (R9, B3)
8b. ~~Treść potwierdzenia przy `>`~~ **ZAMKNIĘTE:** §2.7a pokazuje `AT RISK`, HP i Med-Patche. (R19)

**DESIGN / Balans i Ekonomia**
9. ~~Kredyty startowe~~ **ZAMKNIĘTE (Balans v1.2):** 50 kr, pusta skrytka. D2 liczony przy 0 kr [QA]. (R16)
10. ~~Tabela 12 właściwości~~ **ZAMKNIĘTE:** `balans-m1.md` §3.2. D6 rozpisany.
11. Odbudowa po śmierci bez zapasu w skrytce: czy półka ×4 jest zamierzoną drogą odbudowy? (R20, D4)
12. Clear the Path g1 = 1 Med-Patch przy wrogach bez łupu: czy wystarczy w 1. godzinie? Clear the Path na g3 (Balans pyt. 4). (R13)
13. ~~Rekompensata po 450 ms~~ **ZAMKNIĘTE:** Balans v1.1: bez rekompensaty, straty HP 82 / 188 / 285 w granicach szumu. (R3)
13a. Copper na g1 albo w nagrodzie za `M1_TERM_08`, żeby Lights było osiągalne w pierwszej godzinie. (R18)
13b. `TOOL_SALVAGE_PCT` z zaokrągleniem w dół na zrzutach 2–4 Scrap. (R24)
13c. `M1_AFFIX_11`: kanałowanie (Balans) czy efekt w zagadce (LUZ M6)? (R22, z Mechanikami i LUZ)

**LUZ / Pracownik 1**
14c. **v0.4.1:** Power Lines v0.5.1 zdejmuje blokadę 14b. Prośba M-P4: QA dostarczy tabelę kalibracji z B3; M-P2 (05 i 01 szybsze niż cel g2) do decyzji Mechanik. (R27)
14b. ~~**Blokada R27 (v0.4):** nowa wersja `zagadki-m1/`: czasy wiążące z mech v0.5.2, limit g3 ≤ 75 / ≤ 105 s, `M1_TERM_03` bez [4,5], opis `consumers[].consumer_type` `"mid"` (od g3), ponowne `validate.py` z numerem wersji. Do tego czasu B3 dla 03 i g3 nie jest mierzony.~~ Zdjęta w v0.4.1. (R27)
14a. **Uwaga (v0.3.1), bez zmian w `validate.py` po stronie QA:** `power-lines-line1.json` ma w `hint.text_id` stare ID `M1_TERM_xx_TIP`, a teksty §11.5 mają `M1_TERM_xx_TIP_1/2/3`. Stąd 8 uwag „brak … w pliku tekstów” i pominięta kontrola tokenów podpowiedzi. Propozycja: w JSON lista `hint.text_ids` (3 stopnie) i `check_texts()` sprawdza każde ID; `hint_en_draft` usunąć albo oznaczyć jako nieaktualne. Do tego czasu QA traktuje te uwagi jako znane. (B3)
14. ~~Specyfikacja Power Lines~~ **DOSTARCZONA (v0.1):** B3 rozpisany. Pyt. 3c (czas zagadki vs budżet sesji, R27). Czeka na Mechaników i GD (pyt. 13–14 specyfikacji). Prośba: po zmianach zasad uruchomić ponownie `validate.py` i podać numer wersji, żeby QA mogło powtórzyć B3.

**PROG / UI i Menu**
15. Ekrany M1: HUD (`AT RISK`, plecak, `[+]`), sklep, skrytka, plecak, podsumowanie, ekran śmierci z przyczyną, potwierdzenie przy `>`, wyjaśnienie zasady. Układ na 360×640 i 640×360. **W toku.** (R2, R4, R11)
16. Niski ekran poziomo (< ~330 px) i `@` pod `||` (`m0-status` pkt 5, 10). (R11)
16a. 10 elementów UI nauki gry i §2.7a (lista w mech §2.19). Pasek podpowiedzi na dole: czy prostokąt wchodzi do reguły E2 (wróg w zapowiedzi albo z linią strzału nie może być pod paskiem)? Czy 14 px jest dopuszczalne dla tekstu UI? (R28)
16b. `ui-m1.md`: opis okna przy `>` nadal ma „Enter = GO DOWN” [Z]; ujednolicić z mech v0.5.2 (fokus). Ekran śmierci (NEXT) już zgodny. (R33)

**PROG / Silnik i Narzędzia**
17. Trwałość zapisu na iOS: środki są w kodzie (`persist()`, przypomnienia, podpowiedź iOS). Pytanie: czy zapis w karcie Safari i w trybie ekranu głównego to ten sam magazyn danych (krok 4 B7)? (R7, E1)
17a. ~~`fx-m1.ts` ATK, `fx-params.ts` stale~~ **ZAMKNIĘTE (sprawdzone v0.4.1).** (R30, R33)
17b. Telemetria bossa: wykorzystanie wręcz w fazie zamachu (D7, R32).
18. Lokalny dziennik telemetrii z eksportem JSON i skrótem stanu w buildzie testowym (§4.4), headless symulacja na danych z `src/data/` dla A4 i D1–D4.

**GRAF / Concept i Styl**
19. Tło pola celu wieżyczki (mech 2.10). (R12)
20. `*` w trzech rolach, efekt Szumu z `# & %`, pary `:`/`;` i `'`/`"`: decyzja po pomiarze C3. (R12)
21. Boss `[=]` na torach `=`. (R12)

**FABUŁA / Dialogi i Lore**
22. ~~Teksty nauki gry~~ **DOSTARCZONE (v0.3.1):** teksty §12.3, do akceptacji GD. Zostaje: `M1_TUT_04` bez odwołania do koloru (C9). (R5)
23. ~~Teksty ryzyka i śmierci~~ **DOSTARCZONE (v0.3.1):** teksty §12.1–12.2, do akceptacji GD. Zostaje: `M1_RISK_04` skrócić do 2 zdań (C9). (R2, R4)
24. `teksty` 7.3: motyw AFFIX_06 „regeneracja” → „+% leczenia z Med-Patchy”. (R15)

**ZARZ / Game Director**
25. Akceptacja poprawionych M1_BASE_03 i M1_BASE_14 (R1). Do tego czasu A2 raportuje stan bez blokowania.
26. Pytania Balansu: boss, półka ×4, `CONTRACT_ENEMY_LOOT` = 0, Clear the Path g3 i pułap DPS **rozstrzygnięte** (`balans-m1.md` v1.1). Otwarte: ujścia kredytów §7 i akceptacja całego `balans-m1.md`. **Do tego czasu ceny w D2/D6 są wstępne.** (R17, R20, R21)
25a. Akceptacja tekstów `teksty-m1-en.md` §11.5 (podpowiedzi stopniowane, MORE) i §12 (śmierć, ryzyko, samouczek, etykiety slotów), w tym nowych ID z C9 (`M1_RISK_01B`, `M1_HUD_SK1–3`, `M1_DEATH_BTN` NEXT). Do tego czasu C9 i B3 krok 7 raportują bez blokowania.
26a. ~~R6~~ **ZAMKNIĘTE (GD):** wariant A. (R6; zostaje R31 u Mechanik)
26b. ~~Blokada strony 1~~ **ZAMKNIĘTE (v0.5.2):** 1500 / 500 ms. (R30)
26c. Zmiana kierunku walki (broń dystansowa, twin-stick): termin nowej specyfikacji walki i sterowania; do tego czasu testy R10, A5, C4 wstrzymane. (R35)

**Rozstrzygnięte 25.10.2026:**
- długość krótkiej sesji (GD; R8);
- reguła zapowiedzi „zapowiedź − tick ≥ 400 ms” (GD; R3), w v0.5 `ENEMY_WINDUP_MIN_MS` = 450 i zsynchronizowana w tabelach, Balansie i kodzie (R3 zamknięte);
- projekt zabezpieczeń przed stratą (mech §2.7a) i nauki gry w Prologu (mech §2.19);
- boss 2400 / 20–32 / 800 / 1200 ms, półka ×4, `CONTRACT_ENEMY_LOOT` = 0 (GD, `balans-m1.md` v1.1);
- przyczyna śmierci na ekranach (GD; R2);
- informacyjne zabezpieczenia przed stratą (GD; R4);
- właściciele nauki gry (Producent; R5);
- progi [QA] to wskaźniki, a kryteria wyjścia to E1–E3 (GD);
- metody bez ludzkich testerów (GD);
- zapis decyzji o sesji w `zespol.md` (linia 25, sprawdzone v0.3);
- czas wyjazdu windy 2 s (mech v0.5);
- tabela 12 właściwości i bazy slotów (Balans v1.0);
- specyfikacja zagadki Power Lines dostarczona (LUZ, v0.1, czeka na akceptację).

### 6a. Pytania QA na przyszłość: broń dystansowa i twin-stick na telefonie (R35)
Do nowej specyfikacji (Mechaniki, UI i Menu, GRAF). Bez rozbudowy testów do czasu odpowiedzi.
1. **Kciuki a mapa:** dwa joysticki zajmują oba dolne rogi. Ile komórek widoku (pion i poziom, 568×320 i 360×640) zasłaniają kciuki i joysticki? Czy kamera przesuwa `@` i kierunek celowania tak, żeby cel i wróg w zapowiedzi nie były pod kciukiem (E2)?
2. **Gdzie trafiają pozostałe przyciski:** Dash, Shock, dron, USE, `[+]`, `||`, gdy prawy kciuk celuje? Czy USE przy szybie (przytrzymanie 1,0 s) da się zrobić bez puszczania celowania?
3. **Czytelność celowania w ASCII:** jak widać kierunek celowania (linia znaków, kursor, podświetlenie komórki celu)? Czy ten znak nie myli się z `x` pola zapowiedzi, pasem szarży i `*`? Czy celowanie jest w 8 kierunkach siatki, czy dowolne kąty, i jak wtedy rysujemy pocisk na siatce?
4. **Pociski i zasada zapowiedzi:** czy reguła `ENEMY_WINDUP_MIN_MS` (zapowiedź − tick ≥ 400 ms) obejmuje pociski wrogów jako całość (zapowiedź strzału + lot), czy tylko zapowiedź? Czy pocisk jest widoczny na każdym polu lotu i ile ticków trwa pole? Pocisk spoza widoku albo spod kciuka = E2.
5. **Pociski gracza:** czy auto-cel zostaje (jak bump), czy celowanie jest w pełni ręczne? Co z trafieniem przez róg i ścianą (linia wzroku na siatce)?
6. **Zasięg a widok:** zasięg broni vs widok min. 15 wierszy na niskim ekranie (mech 2.14a M2): czy gracz może trafić / zostać trafiony przez wroga, którego nie widzi?
7. **Klawiatura i mysz na PC:** celowanie myszą czy drugim zestawem klawiszy? Co ze Spacją (dziś ATK), która nie może zamykać okien?
8. **Co z obecnymi wynikami:** bump attack, R10, A5, Shock Pulse przerywający zapowiedź, boss (wykorzystanie wręcz 0,6 w modelu D7) — wszystkie do przeliczenia.

---

## Załącznik: braki w źródłach (stan na 2026-10-25, v0.4.1)
| Brak | Status | Właściciel |
|---|---|---|
| Specyfikacja zagadki Power Lines | **dostarczona v0.1**, czeka na Mechaników i GD | LUZ / Pracownik 1 |
| Tabela 12 właściwości, bazy slotów, ceny, półka sklepu | **dostarczone** (`balans-m1.md` v1.0, do akceptacji GD) | DESIGN / Balans i Ekonomia |
| ~~Kredyty startowe i zawartość skrytki na starcie~~ | zamknięte (`balans-m1.md` v1.2: 50 kr, pusta skrytka) | — |
| Decyzje GD o bossie i sklepie | **boss, półka, łup kontraktów: rozstrzygnięte** (v1.1); ujścia §7 i akceptacja całości otwarte | ZARZ / Game Director |
| ~~Decyzja GD o pakiecie R6~~ | zamknięte: wariant A (mech v0.5.2) | — |
| ~~`zagadki-m1/` zgodne z mech v0.5.2~~ | **zamknięte:** Power Lines v0.5.1 (R27 odblokowane, pomiar B3) | — |
| Kod FX ekranu śmierci zgodny z v0.5.2 | zamknięte; `ui-m1.md` (Enter w oknie `>`) otwarte, niski (R33) | UI i Menu |
| Specyfikacja walki dystansowej i twin-stick | **brak; testy sterowania i walki wręcz wstrzymane** (R35, §6a) | Producent, Mechaniki, UI i Menu |
| ~~Synchronizacja danych `d`/`s` 450 ms, boss~~ | zamknięte (mech v0.5, Balans v1.1, kod) | — |
| ~~Teksty `M1_TUT_*` i `M1_RISK_*`~~ | **dostarczone** (teksty §12, do akceptacji GD) | — (akceptacja: GD) |
| ID podpowiedzi w `power-lines-line1.json` (`_TIP` → `_TIP_1/2/3`) | otwarte (pyt. 14a) | LUZ / Pracownik 1 |
| Ekrany i HUD M1 (sklep, skrytka, plecak, podsumowanie, ekran śmierci, potwierdzenie `>`) | w toku | PROG / UI i Menu |
| Projekt nauki gry w Prologu | **dostarczony (mech §2.19)**; elementy UI do uzgodnienia, teksty brak | DESIGN / Mechaniki + PROG / UI i Menu (teksty: Dialogi i Lore) |
| Tło pola celu wieżyczki | otwarte | GRAF / Concept i Styl |
| Telemetria testowa + headless symulacja | otwarte | PROG / Silnik i Narzędzia |
| Test na prawdziwym iPhonie (B7) | po publikacji | właściciel (wykonuje), PROG / Silnik i Narzędzia (poprawki) |
| ~~Zapis decyzji o długości sesji w `zespol.md`~~ | zamknięte (linia 25) | — |
| ~~Czas wyjazdu windy z bazy~~ | zamknięte (2 s) | — |

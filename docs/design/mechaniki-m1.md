# Mechaniki M0/M1 – walka, ruch, pętla gry (DESIGN / Mechaniki)

Status: **Zaakceptowane przez GD z poprawkami v0.3. Wersja 0.4 dopisała ustalenia PROG / Gameplay, Balansu i Level Design; wersja 0.5 dopisuje decyzje GD z 25.10.2026 (ok. 21:04), odpowiedź Balansu, plan testów QA i luki z `graf/assety-m1.md` §14. Wersja 0.5.2 nanosi decyzje GD (R6 wariant A, samouczek T01–T13 ze „Skip tutorial”, Clear the Path na głęb. 3, sprzedaż sprzętu w automacie), Balans v1.1, odpowiedzi dla UI i ryzyka QA R25–R28.** Otwarte zostają: bramka Lights I („3 fragmenty”, pomiar QA B1), teksty Issue Mk2 (czekają na akceptację GD) i pozycje „do potwierdzenia”.
Wersja: 0.5.2 (25.10.2026). Autor: DESIGN / Mechaniki.

**Changelog**
- **v0.5.2 (25.10.2026), decyzje GD, Balans v1.1, UI, QA (plan testów v0.3), Lore, GRAF / Assety:**
  - **R6 wariant A zatwierdzony przez GD (2.9):** alarm (promień 12) **przy przyjeździe windy** (`EVAC_ALERT_MOMENT` = arrival), wezwanie **1,0 s** (`EVAC_CALL_HOLD_MS` = 1000), ponowne wezwanie po **5 s** (`EVAC_RECALL_COOLDOWN_S` = 5), szary `!` nad wrogami ściągniętymi alarmem. Przeliczone czasy ewakuacji (6 / 8 / 10 s przy szybie). Odrzucone alternatywy, zapisane tylko tutaj:
    - **(B)** alarm przy wezwaniu, ale w promieniu 8 pól, wezwanie 1,0 s, ponowne wezwanie po 15 s;
    - **(C)** bez zmian zasad, tylko informacja (szary `!`, licznik); QA przewidywało ≥ 20% śmierci w sekwencji ewakuacji.
  - **Samouczek T01–T13 zatwierdzony przez GD (2.19)** z dodatkami:
    - „Skip tutorial” przy nowym zapisie, gdy na urządzeniu ukończono Prolog (flaga urządzenia), stan jak po Prologu, `M1_TUT_SKIP_PROLOGUE` z przyciskami `M1_TUT_SKIP_PROLOGUE_YES` „SKIP” / `_NO` „PLAY”; pytanie `M1_TUT_SKIP` („Show hints?”) zostaje jako drugie okno **po SKIP** (poprawka logiki, niżej);
    - nowy krok T10a „alarm windy” (`M1_TUT_18`);
    - T04: czas po zamrożeniu = zapowiedź − 100 ms (QA R26);
    - T08: błędy terminala wg Lore (`M1_TERM_FAIL` tylko OVERLOAD);
    - pasek podpowiedzi na dole, na środku (QA R28);
    - mapowanie H1–H15 z `prog/ui-m1.md` §7 na T01–T13.
  - **Clear the Path na głęb. 3 = TAK (GD)**: 40 kr + 1 Med-Patch, waga 1, 6 wrogów (`sss` + `ddh`) 12–20 pól od szybu, sesja ~105–125 s (2.2, 2.4, 2.16).
  - **Sprzedaż sprzętu w automacie = TAK (GD)**: półka 3 przedmiotów r1/r2 za ×4 ceny sprzedaży, rotacja po każdej wyprawie (2.12, 2.16).
  - **Balans v1.1** (`design/balans-m1.md`):
    - zasada kr/min liczona na **pełny cykl baza → baza**, tak samo dla kontraktów i wypraw; limity **20 / 48 / 90 kr/min** (było 21 / 52 / 97);
    - `REWARD_RELAY` 40 → **35 kr** + fragment, `RETUNE_REWARD` 30 → **25 kr + 2 Copper**;
    - boss 2400 HP zostaje, mediana walki **86 / 68 / 46 s przy 35 / 48 / 72 DPS** (nasz szacunek 58–64 s był za niski); przy pomiarze QA < 65 s przy typowym sprzęcie następny krok to **2600 HP**;
    - strata HP na poziom przy zapowiedziach 450 ms: **82 / 188 / 285 HP**.
  - **Odpowiedzi dla UI** (`prog/ui-m1.md` §5, §7, §9), nowa sekcja **2.14a**: terminal w 2 kolumnach, baza jako menu-hub bez ticków, okno przy `>`, przycisk NEXT na ekranie śmierci (auto-przejście 5000 ms zostaje, decyzja GD), sens zasady utraty, M1–M14.
  - **QA R25 (2.7a):** STAY **nie cofa** gracza; zostaje na `>` i nie schodzi. Okno wraca po zejściu z pola i ponownym wejściu albo po USE na `>`.
  - **QA R27 (2.2):** czasy zagadki 30–60 s (głęb. 1) i 60–90 s (głęb. 2–3) są wiążące; wariant 03 bez przełącznika-pułapki [4,5]; limit wariantu na głęb. 3 (mediana ≤ 75 s, p80 ≤ 105 s).
  - **Lore (`teksty-m1-en.md` §11–12, zatwierdzone przez GD):**
    - brama areny ma osobne okno `M1_RISK_01B` „Fight the boss? You can lose {at_risk} cr.” z przyciskiem `M1_RISK_01B_YES` „GO IN” (decyzja GD);
    - przycisk ekranu śmierci to **NEXT** (`M1_DEATH_BTN`), nie CONTINUE;
    - `M1_RISK_04` (alias `M1_UI_DEATH_RULE`) ma 2 strony: NEXT, potem OK (`M1_RISK_04_OK`); `M1_RISK_SETTING` „Ask before going deeper”;
    - `M1_TERM_TRIP` / `_FUSE` / `_SHORT` / `_LOW` w T08;
    - etykiety slotów `M1_HUD_SK1`–`3` (DASH / PULSE / DRONE);
    - `M1_DEATH_01_HAZ` nie wchodzi: ciecz `~` w M1 to dekoracja bez obrażeń (decyzja Mechanik, 2.11), potwierdzone przez GD). `~` jest **przechodnia**, bez kosztu ruchu i bez spowolnienia. W M1 nie ma patroli, wrogowie tylko błądzą w promieniu `ENEMY_WANDER_RADIUS`. `NO_ENEMY_RADIUS_ENTRY_SHAFT` zostaje 10, bo budzenie grup alarmem windy jest zamierzone (R6 A).
    - Szarża bossa jedzie wzdłuż toru w stronę gracza. Wycofanie z areny resetuje bossa, brama się nie zamyka (2.11, pytania LD).
    - Power Lines: tapnięcie w odbiornik nic nie robi, wiersz `{receiver} {got}/{need}` bez typu. Typy i nazwy urządzeń przechodzą do M2 (GD), więc `consumer_names` w M1 nie ma.
  - **Lights Above the Base (`M1_BASE_08`), 3 poziomy (GD, Balans):** wg Balansu v1.2 §4.1: L0 skrytka 30 / uzupełnianie 2 / półka 3; I 150 kr + 10 Cu (po `M1_TERM_08`): 40 / 3 / 3; II 600 kr + 25 Cu: 50 / 3 / 4; III 1500 kr + 40 Cu: 60 / 3 / 4, r3 20%. `ISSUE_MEDPATCH_TOPUP` = 2 / 3 zatwierdzone przez GD (wariant 6 odrzucony). `TERM08_REWARD_COPPER` = 10, `START_CREDITS` = 50. Bramka Lights I „3 fragmenty” otwarta do QA B1 (2.15).
  - **Issue Mk2 (QA R20, Balans):** po odblokowaniu przystanku na głęb. 2 Pole 10–15, Suit pancerz 6; teksty Lore zatwierdzone przez GD: `M1_GEAR_ISSUE_POLE` „Issue Pole”, `M1_GEAR_ISSUE_POLE_2_NAME` „Issue Pole II” / `_POLE_2`, `M1_GEAR_ISSUE_SUIT_2_NAME` „Issue Suit II” / `_SUIT_2`, `M1_BASE_17` (2.3). Dawne ID `M1_GEAR_ISSUE_BATON*` są wycofane.
  - **Gameplay (decyzje v0.5.2):** Shock = krok ×2 dla kroków rozpoczętych w trakcie (akumulator); kolejność obrażeń z Momentum i jednym `round`; budzenie grupy (promień 4, ta sama grupa, linia wzroku, bez łańcucha); odnowienie Shock Pulse i drona od wciśnięcia; `skillFailed` bez zużycia odnowienia (Dash bez przesunięcia, dron bez miejsca); skos wroga = 1,5 × krok prosty w górę do ticka (`h` 400, `s` 300, `d` 300 ms) (1.14, 2.5, 2.10, 2.11, 2.16).
  - **UI, ostatnia runda v0.5.2:**
    - pasek podpowiedzi 16 px / 2 linie (667×375), 14 px / 3 linie (568×320), 14 px / 1 linia w pionie;
    - komunikaty HUD (alarm windy, niskie HP, `AT RISK`) mają pierwszeństwo przed paskiem; przerwana podpowiedź liczy się do limitu tylko po ≥ 2 s;
    - T01 przy wejściu na głęb. 1, T02 jako puls LIFT w menu bazy; przy jednym przystanku LIFT jedzie od razu;
    - zamrożenie T04: `@` i wróg bez przyciemnienia, auto-pauza ma pierwszeństwo, zamrożenie wraca bez powtórzenia;
    - „Skip tutorial”: fokus i Esc = PLAY; okno „Show hints?” (`M1_TUT_SKIP`) z fokusem i Esc = YES (poprawka logiki niżej: pojawia się po SKIP, nie po PLAY);
    - ekran śmierci: NEXT po 1500 ms (tap / Enter, Spacja nie), **auto-przejście po 5000 ms zostaje** (decyzja GD, `DEATH_SCREEN_AUTO_MS` przywrócone), auto-pauza zatrzymuje oba zegary;
    - terminal: `consumer_type` ("end" | "mid", mid od głęb. 3) w obiekcie odbiornika z `consumers[]`, `POWER_LINES_MAX_RECEIVERS` = 4.
  - **Sprzątanie:** wartości sprzed zmian R6 (wezwanie 1500 ms, ponowne wezwanie 15 s, alarm `call`) są już tylko w tym changelogu i w wariancie B; „CONTINUE” tylko w historii; `M1_DEATH_01_HAZ` występuje tylko jako „nie wchodzi w M1, ciecz `~` to dekoracja”.
  - **Poprawki końcowe v0.5.2:**
    - okno „Skip tutorial” ma własne przyciski `M1_TUT_SKIP_PROLOGUE_YES` „SKIP” i `_NO` „PLAY” (fokus i Esc = PLAY); `M1_TUT_SKIP_YES` / `_NO` tylko dla „Show hints?”;
    - **poprawka logiki:** „Show hints?” (`M1_TUT_SKIP`) pokazuje się **po SKIP** (decyduje o T12, T13 i pozostałych podpowiedziach dla gracza, który pominął Prolog), po PLAY nie ma drugiego okna;
    - teksty zatwierdzone przez GD: `M1_TUT_18` „Enemies come to the lift. Get in fast.”, `M1_TUT_02T` „Tap LIFT to go down.”, `M1_TUT_02K` „Choose LIFT. Press {KEY_CONFIRM} to go down.” (`{KEY_CONFIRM}` = Enter);
    - szarża bossa wg GD (`level-m1.md` §10): boss najpierw idzie na najbliższy tor (bez ataku, bez przerwania, `BOSS_CHARGE_SEEK_TRACK` = true), szarża zawsze pozioma w stronę kolumny gracza, pas = 2 rzędy toru, zapowiedź 900 ms od stanięcia na torze, unik 1–2 kroki w pionie; wariant pionowy usunięty; wycofanie z areny oznaczone jako zatwierdzone przez GD;
    - S12: przy nieznanym polu ciosu brak podświetlenia (`assety-m1.md` v1.2, `fx_death_player.anchorRules`).
  - **Retest QA (plan testów v0.4):**
    - R28: pasek podpowiedzi chowa się (fade 150 ms) nad wrogiem w ALERT/CHASE/ATTACK, zapowiedzią albo pasem szarży (`TUT_HINT_HIDE_ON_THREAT`); 14 px tylko przy wysokości < 360 px i w pionie (wyjątek od min. 16 px, decyzja Mechanik);
    - R29: w oknie przy `>` i bramie areny Enter i Spacja działają na przycisk z fokusem (domyślnie STAY), bez skrótu GO DOWN;
    - R30: strona 1 `M1_RISK_04` z blokadą 1500 ms (`RISK_EXPLAINER_PAGE_LOCK_MS`), strona 2 (OK) 500 ms;
    - R31: obrażenia nie przerywają wezwania windy (`EVAC_CALL_INTERRUPT_ON_DAMAGE` = false), kryterium §2.17 poprawione;
    - R32: 2600 HP tylko przy zmierzonej medianie < 65 s w paśmie 44–52 DPS i zmierzonym udziale bicia; wyniki QA D7 (38 / 48 / 58 / 72 DPS → 79 / 68 / 57 / 46 s); odesłanie B1 → D7;
    - rozjazdy: tabela T01–T13 z tekstami z `teksty-m1-en.md` §12.3; `M1_RISK_04` = 2 strony; ustawienie „Ask before going deeper”.
  - **Nowa sekcja 2.16a „Pola zdarzeń FX”** (konwencja `assety-m1.md` v1.3).
  - **GRAF / Assety:** S14 przyjęte (pas szarży świeci stale, bez migania); S12 (białe błyski zabójcy, przy „Reduce motion” stałe odwrócenie) **zatwierdzone przez GD**.
- **v0.5.1 (25.10.2026), potwierdzenia Level Design** (`level-design-m1.md` §3–4):
  - układ Prologu przyjęty; terminal 04 leży 45–60 pól (BFS) od wejścia, para Scrapperów ≥ 8 pól od terminala, szyb `<` 25–40 pól od wejścia i od terminala (2.19);
  - szyb `<`: min. 2 przechodnie sąsiednie pola (cel 3), nigdy w korytarzu o szerokości 1, walidacja łączności mapy po wstawieniu `<` (2.9);
  - zamknięte pytanie 10 w 2.18.
- **v0.5 (25.10.2026), decyzje GD, Balans, QA, GRAF / Assety, PROG:**
  - **Zapowiedź ciosu (decyzja GD, potwierdzone testem QA A4):**
    - jedna reguła: zapowiedź − 1 tick ≥ 400 ms, czyli **min. 450 ms (9 ticków)** dla każdego ciosu wroga, także dronów przywołanych przez bossa;
    - zapowiedzi nie skracają się z głębokością;
    - Panel Drone i Scrapper: 400 → 450 ms (1.14, 2.11).
  - **Krótka sesja (decyzja GD):** mierzona od otwarcia gry do ekranu podsumowania, mediana ≤ 3 min, p80 ≤ 4 min. Wprowadzony sprawdzony budżet czasu (2.2).
  - **Kontrakty (2.4):**
    - po śmierci kontrakt wraca na tablicę z wyzerowanym postępem;
    - „ponowne zestrojenie” liczone osobno na każdej głębokości;
    - ponowne zestrojenie daje 30 kr + 2 Copper (v0.5.2: 25 kr + 2 Copper);
    - wrogowie kontraktu bez łupu;
    - wagi liczone dla par (typ, głębokość).
  - **Brak odradzania wrogów w trakcie poziomu M1 (decyzja GD, Z5 z assetów).**
  - **Pełna sekwencja ewakuacji** z czasem wyjazdu windy, nietykalnością i regułą kabiny. Propozycja R6 (wezwanie przy niskim HP) dla GD (2.9; zatwierdzona w v0.5.2).
  - **Zabezpieczenia informacyjne przed stratą (decyzja GD, QA R4):** potwierdzenie przy `>`, znacznik „can be lost” i jednorazowe wyjaśnienie zasady (2.7a). Ekran śmierci pokazuje przyczynę śmierci (Z6).
  - **Nowa sekcja 2.19 „Nauka gry w Prologu”** (QA R5, decyzja Producenta).
  - **Boss (Balans + luki z assetów, Z12, Z13):**
    - HP 2400, zamach 800 / 1200 ms, obrażenia 20–32;
    - szarża 2 ticki na pole;
    - przywołanie trwa 600 ms, a boss jest w tym czasie podatny na ciosy.
  - **Budżet HP (2.13)** przepisany według symulacji grupowej Balansu: 82 / 187 / 287 HP na poziom (v0.5.2: 82 / 188 / 285).
  - **M2:** Recovery Beacon 400 kr + 25 Copper potwierdzony, zegar Zbieraczy 50 / 45 / 40 s.
  - **PROG / Gameplay (potwierdzone):**
    - Panel Drone po skosie 300 ms;
    - kolejność liczenia obrażeń;
    - pancerz w M1 ma tylko gracz;
    - akumulator ułamków ticka potwierdzony (osobno atak i ruch);
    - `MAX_STEPS_PER_FRAME` = 5 w tabeli 1.14.
  - **Lore:** `M1_NOTE_47_BODY` → `M2_NOTE_47_BODY` (pula M2).
- **v0.4 (25.10.2026), Balans, PROG / Gameplay, Level Design, decyzje GD:**
  - **PROG / Gameplay** (`prog/walka-m0.md` §6):
    - kolejność w ticku wpisana jako zaimplementowana (1.1);
    - żetony 2+1 z odstępem 150 ms, `!` nad każdym wrogiem w zapowiedzi, wróg bez żetonu obok gracza czeka;
    - mapa i osobna pula żetonów drona;
    - sprawdzenie bumpa z kolejnością w ticku (2.10);
    - do tabeli 1.14 dopisane `COMBAT_EXTRAS` (5 stałych) i podział interwału wędrówki na MIN/MAX.
  - **Balans** (`design/balans-m1-review.md`):
    - mnożniki wrogów: HP ×1 / 1,5 / 2,2, obrażenia ×1 / 1,25 / 1,5;
    - pancerz DR = A / (A + 100), limit 60%, min. 1 obrażenia; pancerz bazowy 6–10 / 13–19 / 20–28, afiks +2–4 / +4–7 / +7–10;
    - `M1_AFFIX_06` = +% leczenia z Med-Patchy (10–15 / 16–25 / 26–35%, maks. 1 na przedmiot, tylko pancerz i moduł, łącznie maks. +60%);
    - Med-Patch 25 kr, niesprzedawalny; Issue uzupełnia patche do 2 przy każdym wyjeździe windą;
    - Panel Drone: ruch 200 ms, zapowiedź 400 ms (w v0.5: 450 ms); Rail Pistol 8–11 (~16,5 DPS); afiksy szybkości przez akumulator ułamków ticka;
    - boss: zamach 800 / 900 ms (w v0.5: 800 / 1200 ms), szarża co 4. atak z zapowiedzią linii 900 ms, bez mnożnika głęb. 3.
  - **Decyzje GD:**
    - cel walki z bossem 60–90 s (HP 2100–2400 do ustalenia z Balansem; w v0.5: 2400);
    - zasada „kontrakt ≤ kr/min wyprawy na tej samej głębokości” z obowiązkowym powodem atrakcyjności innym niż kredyty (2.4). Nagrody kontraktów przeliczone pod tę zasadę;
    - limit Med-Patchy **6** (leczenie 40 bez zmian), pełna wyprawa 1→3 bez powrotu możliwa, ale trudna, a przystanki windy to normalna ścieżka;
    - nazwa **Buddy Drone** (ostateczna); `M1_NOTE_47_BODY` (od v0.5 `M2_NOTE_47_BODY`) zatwierdzony.
  - **Level Design:**
    - zejście `>` 40–60 / 45–65 pól, na głęb. 3 brama areny 50–70 pól od wejścia; `>` i brama min. 20 pól od szybu;
    - puste zwłoki jako dekoracja dopiero w M2 (w M1 ich nie ma);
    - nory w M1 to zwykłe miejsca spawnu Zbieraczy.
  - Przeliczone: walki z Curfew Guardem na głęb. 1–3, budżet HP na głęb. 3 i pełnej wyprawy, czasy przejścia poziomów (2.11, 2.13).
- **v0.3 (25.10.2026), poprawki Game Directora i ustalenia działów:**
  - Śmierć w M1 = pełna utrata wszystkiego, co ryzykowne (plecak + założony sprzęt), **bez odzysku ze zwłok**. Usunięte 20% uszkodzenia przedmiotów. Zwłoki `%` to tylko znak i opis (USE = notatka). Zbieracze rozbierają je fabularnie i wizualnie.
  - Cały system odzysku (zegar zwłok, wyścig ze Zbieraczami, nory, 50% zwrotu, zachowanie strefy) przeniesiony do nowej sekcji **„M2 – pierwszy system łagodzący: Recovery Beacon”**, z ustaleniami Silnika (zapis strefy, `corpseTicksLeft`) i przeliczoną symulacją bez 20% uszkodzenia. Przystanki windy w M1 są tylko skrótem.
  - **Bump attack w M1** (krok w stronę wroga atakuje, 2.6).
  - Umiejętności: 3 na stałych slotach w M1, projektowane jako **wymienne w slotach** (wybór zestawu i synergie od M2). Nazwy zatwierdzone przez GD: **Dash, Shock Pulse**; dron wtedy roboczo, w v0.4 ostatecznie **Buddy Drone**. Stałe `SK1_VAULT_*` → `SK1_DASH_*`.
  - Med-Patch: stały przycisk `[+]` z licznikiem (dotyk) / Q. Przytrzymanie USE tylko dla interakcji z czasem trwania (wezwanie windy).
  - Symbole i telegraf wg `graf/styl-ascii.md` §9 (v1.1): żółty `!` nad wrogiem, odwrócona komórka wroga, migające `x` na ciemnej magencie, szary `!` ALERT, drzwi `Π`, materiały `:`, Med-Patch `+`, Data Core `§`, dron `¤`. Usunięte `c`→`C`.
  - Ustalenia Level Design (`design/level-design-m1.md`): odległości jako długość ścieżki BFS. Przeliczone czasy kontraktów i ewakuacji. Kontrakty krótkie losowane tylko na głębokościach z przystankiem windy.
  - Teksty przez ID z `fabula/teksty-m1-en.md` (np. `M1_SYS_04` „Enemies nearby. Fight first.”, `M1_BASE_06` przy przyjeździe windy). Komunikaty o Zbieraczach w puli M2 (`M2_SYS_01–03`).
  - Rozstrzygnięte pytania do GD, GRAF, LD, UI i Silnika przeniesione do list „Rozstrzygnięte”.
- v0.2 (25.10.2026): Część 2 (pętla M1).
- v0.1 (25.10.2026): Część 1 (walka i ruch M0).
Źródła: `wizja-gry.md` (zatwierdzona), `plan-produkcji.md` (zatwierdzony), `fabula-reprint.md` (v1), `prog/stos-techniczny.md` (propozycja PROG / Silnik), `prog/sterowanie.md` (propozycja PROG / UI i Menu, założenia Z1–Z4).
Odbiorcy: PROG / Gameplay (walka), PROG / Silnik i Narzędzia (pętla, ruch, kolizje, pauza), PROG / UI i Menu (wejście, HUD), GRAF (glify, kolory), QA (kryteria M0).

Zasady pisania: opis po polsku, teksty w grze po angielsku. Wszystkie liczby to wartości startowe do strojenia, zebrane w tabeli w punkcie 1.14. Dane mają trafić do `src/data/` (nie na sztywno do kodu).

---

## Część 1: Walka i ruch (M0)

### 1.0 Cel M0 i filary
Cel M0 z planu: „sprawdzić, czy walka jest przyjemna na obu urządzeniach”. Spec ma więc dać **czytelny rytm**: wróg zapowiada cios, gracz schodzi z pola i odpowiada. Kluczowe zasady wynikające z wizji:
- **Czas rzeczywisty, NIE turowo.** Świat nie czeka na gracza. Auto-pauza chroni gracza, który odszedł od gry. Nie zamraża walki, gdy coś się dzieje (szczegóły w 1.11).
- **Siatka znaków ASCII.** Pozycje to całe komórki, nie ułamki. Ruch jest dyskretny, ale ciągły w czasie (trzymasz kierunek, postać idzie krok po kroku).
- **Telefon = komputer.** Każda mechanika M0 musi dać się zagrać jednym kciukiem na ruch i jednym na atak. Nie ma celowania myszą ani gestów.
- **Filar 3 (leniwe farmienie):** przytrzymanie ATK atakuje automatycznie i wybiera cel automatycznie.
- **Miejsce na M1:** 3 umiejętności, broń dystansowa, USE. Architektura nie może tego blokować.

### 1.1 Model czasu
- **Tick symulacji: 50 ms (20 Hz)**, stały krok (fixed timestep), zgodnie z `prog/stos-techniczny.md`. Render na `requestAnimationFrame` z interpolacją tylko wizualną: logika zna wyłącznie całe komórki i całe ticki.
- **Czas każdej akcji liczony jest w tickach.** W danych parametry zapisujemy w ms (wielokrotności 50). Przy ładowaniu: `ticks = round(ms / TICK_MS)`, minimum 1. Jeśli Silnik zmieni tick, liczby zostają sensowne.
- Każda encja ma niezależne liczniki (odliczane co tick do 0):
  - `moveCooldown`: po wykonaniu kroku, ile ticków do następnego,
  - `attackWindup`: przygotowanie ataku (cios jeszcze nie padł),
  - `attackCooldown`: odnowienie po ciosie,
  - `stateTimer`: timery AI (reakcja, utrata śladu itd.).
- **Kolejność w jednym ticku: potwierdzona i zaimplementowana przez PROG / Gameplay** (`prog/walka-m0.md` §6 pkt 1):
  1. **Odczyt wejścia** (`InputManager.sample()` Silnika): akcje z bufora tapnięć (100 ms = 2 ticki). Akcja `pause` daje pauzę zamiast ticka.
  2. **Faza gracza:** zapis ostatniego wejścia, zbocze i bufor ATK, **start ataku gracza** (cel zamrożony). **Potem krok gracza** (`tryStep`), zablokowany w czasie przygotowania i w ticku własnego ciosu. W M1 w tym samym miejscu przed krokiem: bump attack (2.6), umiejętności i Med-Patch.
  3. **Faza świata (AI wrogów)** w kolejności listy encji: wykrycie, ALERT, krok albo **start zapowiedzi**. Pole celu = **pole gracza po jego kroku z punktu 2**.
  4. **Rozstrzygnięcie ciosów:** najpierw gracz, potem wrogowie. **Wróg zabity w tym ticku nie uderza** (remis wygrywa gracz).
  5. **Śmierć i respawn** (wróg; gracz: start 0,5 s zatrzymania), **regeneracja** (tylko M0), **auto-pauza** (zgłoszenie D; pauza wchodzi po tym ticku, następny się nie wykona).
  6. **Odliczenie liczników:** timery walki (ALERT, wędrówka, głuchota, respawn, błyski, liczby), potem `moveCooldown`, `attackWindup`, `attackCooldown` wszystkich encji. `tick++`.
- **Skutki potwierdzone przez Gameplay:**
  - **Okno uniku to pełne 500 ms (10 ticków) zapowiedzi**, minus opóźnienie wejścia ≤ 50 ms. Krok gracza w danym ticku zawsze wyprzedza rozstrzygnięcie ciosu wroga w tym samym ticku.
  - **„Przygotowanie doszło do 0” jest w kodzie licznikiem równym 1.** Start ataku ustawia `attackWindup = ticki_przygotowania + 1`, a cios rozstrzyga się w fazie 4 ticka z licznikiem = 1. Czasy są bez zmian: cios gracza po 100 ms, wroga po 500 ms, cykle 400 / 1200 ms.
  - **Gracz nie robi kroku w ticku własnego ciosu.** Inaczej krok przed rozstrzygnięciem mógłby wyprowadzić go z zasięgu i dać pudło przez własny ruch.
- Pauza = pętla symulacji nie wykonuje ticków. Wszystkie liczniki zostają zamrożone co do ticka (np. wróg w połowie zapowiedzi ciosu ma po wznowieniu dokładnie tyle samo czasu).

### 1.2 Ruch
- **Po siatce znaków, 8 kierunków** (4 proste + 4 skosy). Krok = przejście o 1 komórkę. Pozycja zmienia się **od razu na początku kroku**, a potem liczy się cooldown. Dzięki temu reakcja jest natychmiastowa, bez opóźnienia animacji.
- **Koszt ruchu gracza:** prosto **3 ticki (150 ms)**, czyli 6,7 komórki/s. Skos **4 ticki (200 ms)** (≈ 3 × √2, żeby skosy nie były szybsze).
- **Prędkość stała.** Nie zależy od wychylenia joysticka (kierunek wybiera się po martwej strefie, patrz 1.12).
- **Trzymanie kierunku = ciągły marsz.** Gdy `moveCooldown` dojdzie do 0, a kierunek jest wciąż trzymany, następuje kolejny krok. Zmiana kierunku w trakcie cooldownu jest buforowana i obowiązuje ostatni trzymany kierunek. Krótkie tapnięcie (≥ 1 tick) daje dokładnie 1 krok.
- **Skosy na klawiaturze (v0.5, decyzja do Silnika, QA-M0-002 / QA-M0-009):**
  - krok prosty z miejsca **rusza od razu** (bez czekania);
  - jeśli w ciągu `DIAG_GRACE` (1 tick, 50 ms) od startu dojdzie klawisz prostopadły, a krok wciąż trwa, **cel kroku zmienia się na skos**. Pozycja przestawia się z pola prostego na pole skośne liczone od pola startowego, a czas kroku to **200 ms liczone od startu kroku** (bez cofania i bez dodatkowego czasu). Zmiana następuje tylko wtedy, gdy pole skośne jest wolne i krok nie ścina rogu. Inaczej zostaje krok prosty;
  - **przeciwne klawisze na jednej osi** (np. A+D): wygrywa ostatnio wciśnięty. Po jego puszczeniu ruch wraca do kierunku wciąż trzymanego. Para przeciwnych klawiszy **nigdy nie oznacza stopu**;
  - w marszu i przy joysticku nie ma żadnego okna.
- **Kierunek patrzenia (`facing`)** = kierunek ostatniego kroku (lub ostatniej próby kroku w ścianę). Na starcie: wschód. Używany przy ataku bez celu (1.3).
- **Kolizje:**
  - Ściana `#` blokuje. Krok w ścianę nie zużywa czasu (`moveCooldown` się nie ustawia), zmienia tylko `facing`.
  - **Brak ścinania rogów:** krok po skosie jest zablokowany, jeśli **którakolwiek** z dwóch komórek prostopadłych jest ścianą. To samo dotyczy wroga.
  - Encje się blokują: gracz i wróg nie mogą stać w jednej komórce. W M0 krok w komórkę wroga nie wykonuje się i **nie jest atakiem**, tylko ustawia `facing`. **W M1 krok w stronę wroga atakuje (bump attack, decyzja GD, 2.6).**
  - Gracz nie może się przesunąć w trakcie `attackWindup` (zobowiązanie do ciosu, 100 ms). W trakcie `attackCooldown` ruch jest dozwolony (hit-and-run).

### 1.3 Atak gracza (jeden atak podstawowy, wręcz)
- **Typ:** cios wręcz roboczo „Shock Baton” (nazwa EN do akceptacji Dialogów i Lore). W M0 nie ma broni dystansowej.
- **Zasięg:** 1 komórka, metryka Czebyszewa, czyli 8 sąsiednich pól (także po skosie). Atak po skosie przez róg ściany jest zablokowany na tej samej zasadzie co ruch (nie da się bić przez róg).
- **Wybór celu: automatyczny.** W chwili rozpoczęcia ataku cel to najbliższy wróg w zasięgu. Przy remisie wygrywa ten w kierunku `facing`, potem pierwszy zgodnie z ruchem wskazówek zegara od północy. Cel jest zamrażany na start ataku.
- **Czasy:**
  - przygotowanie (`windup`): **2 ticki (100 ms)**, cios pada pod koniec,
  - odnowienie (`cooldown`): **6 ticków (300 ms)** po ciosie,
  - **pełny cykl 8 ticków = 400 ms → 2,5 ciosu/s.**
- **Trafienie:** cios trafia, jeśli w chwili rozstrzygnięcia cel nadal jest w zasięgu 1 (w M0 wróg nie odskakuje, więc praktycznie zawsze trafia). Jeśli cel uciekł, mamy pudło („whiff”), a cooldown liczy się normalnie.
- **Obrażenia:** losowo **8–12** (liczba całkowita, rozkład równomierny), **szansa krytyczna 10%, mnożnik ×1,5** (zaokrąglenie w dół, czyli 12–18). Średnio **10,5 na cios**, DPS przy ciągłym biciu **≈ 26,3**. Losowość jest w M0 celowa: testuje czytelność liczb i zapowiada filar losowych statystyk sprzętu.
- **Przytrzymanie ATK = autoatak:** atak startuje automatycznie, gdy tylko `attackCooldown` = 0 **i jest cel w zasięgu**. Trzymanie ATK bez celu niczego nie robi (nie ma machania w powietrze).
- **Tapnięcie ATK bez celu:** wykonuje się cios w kierunku `facing` (pełny cykl 400 ms, trafia, jeśli coś stoi na tym polu). To czytelny feedback, że przycisk działa.
- **Bufor:** wciśnięcie ATK w ostatnich 150 ms cooldownu (3 ticki) jest kolejkowane i wykonuje się, gdy cooldown się skończy.
- **Ruch a atak:** to osobne liczniki. Krok nie blokuje ataku. Atak blokuje ruch tylko w czasie przygotowania (100 ms).
- Ciosy gracza **nie przerywają** zapowiedzi wroga (zapowiedź ma być w 100% wiarygodna). Nie ma odrzutu ani ogłuszenia w M0.

### 1.4 Statystyki gracza i wroga M0

| | Gracz „Hunter 47” | Wróg „Scrap Crawler” (nazwa robocza EN) |
|---|---|---|
| Glif | `@` | `c` (w zapowiedzi odwrócona komórka, 1.7) |
| HP | **100** | **80** |
| Obrażenia na cios | 8–12, kryt. 10% ×1,5 (śr. 10,5) | **12–18** (śr. 15), bez krytyka |
| Zasięg ataku | 1 (8 sąsiadów) | 1 (8 sąsiadów) |
| Przygotowanie ciosu | 100 ms (2 t) | **500 ms (10 t)**, telegrafowane |
| Odnowienie po ciosie | 300 ms (6 t) | **700 ms (14 t)** |
| Cykl ataku | 400 ms → 2,5/s | **1200 ms → 0,83/s** |
| DPS teoretyczny | ≈ 26,3 | ≈ 12,5 |
| Ruch prosto / skos | 150 / 200 ms (3 / 4 t) | **200 / 300 ms (4 / 6 t)** |
| Prędkość | 6,7 komórki/s | 5 komórek/s (gracz zawsze może uciec) |
| Pancerz, uniki, regeneracja w walce | brak | brak |
| Regeneracja poza walką (tylko M0, pomoc do testów) | 5 HP/s po 5 s bez walki | pełne HP przy powrocie na spawn (1.6) |

„Bez walki” = gracz nie zadał ani nie otrzymał obrażeń przez 5 s i wróg nie jest w stanie Pościg/Atak.

### 1.5 Bilans walki 1 na 1 (policzone, symulacja 100 000 walk tą samą logiką ticków)
Założenie: obaj zaczynają obok siebie, obaj biją od razu, remisy w ticku wygrywa gracz.
- **Ciosy gracza potrzebne na wroga 80 HP:** średnio **8,1** (mediana 8, zakres 5–10; 7–9 ciosów w 99,5% walk).
- **Czas walki:** cios n pada w chwili 100 ms + (n−1) × 400 ms, czyli **mediana 2,9 s** (zakres 1,7–3,7 s).
- **„Stoję i biję” (zero uników):** wróg zadaje 2–3 ciosy (w 500, 1700 i 2900 ms), gracz traci **średnio 34 HP** (zakres 18–54). Wygrana z ~66 HP. Bez regeneracji wystarczy na 2 takie walki, trzecia jest ryzykowna.
- **Uniki w 50% przypadków:** średnio ok. 17 HP straty.
- **Gra idealna (unik każdej zapowiedzi):** 0 HP straty i **bez utraty DPS**. Cykl wroga 1200 ms = dokładnie 3 cykle gracza. Wzorzec: cios → krok w bok w trakcie zapowiedzi (okno reakcji 500 ms − maks. 50 ms opóźnienia ticka ≈ 450 ms) → wróg pudłuje i stoi 700 ms → powrót obok i 2 ciosy → powtórka. To nagradza uwagę, a nie refleks na poziomie e-sportu (typowy czas reakcji to 250–300 ms).
- **Gracz, który w ogóle nie walczy:** ginie po 7 ciosach wroga (100 / 15 ≈ 6,7) = **ok. 7,7 s** od pierwszej zapowiedzi. Auto-pauza (1.11, wyzwalacz D) zatrzyma grę wcześniej, po pierwszym ciosie u gracza, który nic nie robi.
- **Ucieczka:** gracz (150 ms/krok) oddala się od wroga (200 ms/krok) o ~1,7 komórki/s. Z zasięgu utraty śladu (12) ucieka z dystansu 1 w ok. 6,5 s.

### 1.6 AI wroga M0 (Scrap Crawler)
Maszyna stanów: **IDLE → ALERT → CHASE ↔ ATTACK → (RETURN → IDLE)**, plus DEAD.

| Stan | Zachowanie | Wyjście |
|---|---|---|
| **IDLE** (bezczynny) | Stoi na spawnie. Co 2–4 s (losowo) robi 1 krok w losowym kierunku, maks. 3 komórki od spawnu. | Gracz w zasięgu wykrycia **7 komórek** (Czebyszew) **i** w linii wzroku (Bresenham, ściany `#` zasłaniają) → ALERT. Otrzymanie obrażeń → od razu CHASE. |
| **ALERT** (reakcja) | Stoi **300 ms (6 t)**. Nad wrogiem **szara** nakładka `!` (`#C9D1D9`, tylko 300 ms, nie zajmuje komórki; GRAF §9). Daje graczowi uczciwą chwilę. | Po 300 ms → CHASE. |
| **CHASE** (pościg) | Co krok wybiera ruch po najkrótszej ścieżce BFS do gracza (8 kierunków, bez ścinania rogów, promień przeszukiwania 20). Ścieżka liczona przy każdym kroku. Pamięta ostatnią widzianą pozycję gracza. | Gracz w zasięgu 1 i `attackCooldown` = 0 → ATTACK. Dystans > **12** albo brak linii wzroku przez **3 s** → RETURN. |
| **ATTACK** | Start zapowiedzi: **zamraża pole celu = pole, na którym stoi gracz** (nie śledzi gracza). Stoi 500 ms (zapowiedź, 1.7), potem cios w zamrożone pole: trafia, jeśli gracz nadal na nim stoi. Potem 700 ms odnowienia, w którym stoi w miejscu. | Po odnowieniu: gracz w zasięgu 1 → nowa zapowiedź od razu. Inaczej → CHASE. |
| **RETURN** | Wraca BFS na spawn. Nie reaguje na gracza przez pierwsze 1 s, potem znów może go wykryć. Po dojściu na spawn odnawia pełne HP. | Na spawnie → IDLE. Wykrycie po 1 s albo obrażenia → CHASE. |
| **DEAD** | Patrz 1.9. | Respawn po 5 s. |

Uwagi:
- Unik = **zejście z zamrożonego pola** dowolnym krokiem, także na inne pole obok wroga. To celowo wyrozumiałe w M0 (na telefonie precyzja kroku jest gorsza).
- Wróg nie stawia kroku, gdy pole zajmuje gracz. Jeśli ścieżka jest zablokowana, czeka 1 tick i liczy ją od nowa.

### 1.7 Telegrafowanie ataku wroga w ASCII
Zapowiedź (500 ms) musi być czytelna **także bez koloru** (daltonizm, słońce na telefonie). Wygląd według `graf/styl-ascii.md` §9 (v1.1). Trzy sygnały naraz:
1. **Żółta nakładka `!`** (`#FFE14D` bold) nad wrogiem przez całą zapowiedź. Szary `!` przez 300 ms oznacza za to ALERT („zauważył cię”, 1.6). Różnią się kolorem i czasem trwania.
2. **Glif wroga w odwróconej komórce:** tło `#FF5FC8`, znak `#0B0F14`. **Bez zamiany na wielką literę**, bo wielkie litery to elity i boss (GRAF). Trafienie wroga zostaje białe (1.7 niżej), więc się nie mylą.
3. **Zamrożone pole celu:** tło `#4A1240`, a `x` w `#FF5FC8` miga co 100 ms (na przemian z glifem gracza, jeśli na nim stoi). Gdy gracz z niego zejdzie, `x` zostaje do końca zapowiedzi, więc gracz widzi, że uciekł. Przy „Reduce motion” `x` jest stałe, bez migania.
4. **Ostatnie 150 ms (3 ticki):** miganie przyspiesza do 50 ms (sygnał „teraz albo nigdy”, poza „Reduce motion”). Mechanika się nie zmienia.
5. Cios: pole celu na 100 ms pokazuje `*`. Przy trafieniu pasek HP błyska, a aureola gracza miga na `#FF5FC8`. Dostępna jest wibracja 20 ms (opcja z `sterowanie.md`). Przy pudle nad wrogiem przez 600 ms nakładka `miss`.
- Liczby obrażeń: nakładka nad celem (`-11`, krytyk `-16!`), unosi się przez 600 ms. Nie zajmuje komórek, min. 12 px z obrysem (UI). W M0 obowiązkowo, bo testujemy czytelność liczb na telefonie.
- Trafienie wroga: glif wroga przez 100 ms rysowany na biało.
- Szarża bossa (M1): ta sama reguła dla całej linii toru.

Przykład (gracz `@` stoi w zamrożonym polu, wróg `c` w zapowiedzi; `[c]` = odwrócona komórka, `x` = migające pole celu):
```
# . . . ! . . . . #          # . . . ! . . . . #
# . . .[c]. . . . #    ->    # . . .[c]x . . . #
# . . . . @ . . . #          # . . . . . @ . . #
  t = 0–350 ms: @/x miga       gracz zszedł z pola: unik
```

### 1.8 Śmierć gracza (M0)
- HP ≤ 0 → symulacja świata zatrzymuje się na 0,5 s (zatrzymanie dramatyczne), potem nakładka pełnoekranowa:
  `HUNTER 47 – SIGNAL LOST` / `Reprinting… ` (tekst roboczy EN, zgodny z fabułą „Reprint”).
- Po **3 s** gracz pojawia się na punkcie startu z pełnym HP. Wróg resetuje się na spawnie (pełne HP, IDLE). Tekst nadal „Hunter 47” (decyzja GD w `fabula/teksty-m1-en.md`: pamięć zsynchronizowana = ten sam łowca). Licznik śmierci tylko w debug.
- W miejscu śmierci zostaje `%` (zwłoki), bez interakcji w M0. To zapowiedź mechaniki utraty łupu z M1 (Część 2) i możliwość testu czytelności glifu.
- W M0 **nie ma** utraty przedmiotów (ich nie ma). Licznik śmierci i zabójstw idzie do panelu debug.

### 1.9 Śmierć wroga (M0)
- HP ≤ 0 → wróg znika z siatki, w jego polu zostaje `%` (wrak, przechodni, bez łupu w M0). Nakładka `+1 kill` (debug).
- **Tylko M0 (mapa testowa):** **respawn po 5 s** na spawnie (pełne HP, IDLE), tylko jeśli gracz jest ≥ 8 komórek od spawnu. **W M1 wrogowie nie odradzają się w trakcie poziomu** (decyzja GD, 2.11). Inaczej czeka, aż gracz się oddali. Dzięki temu QA może testować walki seriami.
- Wrak `%` znika przy respawnie (M0). W M1 wrak zostaje do końca poziomu.

### 1.10 Mapa testowa M0 (propozycja dla Silnika)
- Ręczna arena **40 × 20** komórek: ściany zewnętrzne, 3–4 filary `#` (do łamania linii wzroku i testu rogów), jeden korytarz szerokości 1 (test BFS i blokowania).
- Start gracza w odległości ≥ 12 od spawnu wroga, poza linią wzroku. Pierwsze spotkanie zaczyna się więc od IDLE → ALERT.
- **Minimalny widoczny obszar wokół gracza:** poziomo (landscape) **31 × 17 komórek** (±15 / ±8), pionowo (portrait) **17 × 21**. Musi być > zasięgu wykrycia (7), żeby wróg nigdy nie wykrył gracza spoza ekranu.

### 1.11 Auto-pauza
Wizja: „automatyczna pauza, gdy gracz odejdzie lub przełączy aplikację”. Gra jest w czasie rzeczywistym, więc **nie pauzujemy przy wejściu wroga w pole widzenia ani przy każdym trafieniu**. Zrobiłoby to z walki grę turową wbrew filarom. Pauzujemy, kiedy gracz **nie może** albo **nie gra**.

**Wyzwalacze (każdy działa od razu w bieżącym ticku):**
| Kod | Kiedy | Dlaczego |
|---|---|---|
| A | `visibilitychange` → hidden, `blur` okna, `pagehide`, `freeze` (zmiana karty/aplikacji, blokada ekranu, połączenie telefoniczne) | gracz przełączył aplikację |
| B | `resize` lub zmiana orientacji w trakcie gry | układ i kontrolki się przestawiają, kciuk traci joystick |
| C | ręcznie: przycisk `||`, Esc lub P | |
| D | **gracz otrzymał cios, a przez ostatnie 2,0 s nie było żadnego wejścia** (brak trzymanego klawisza, dotyku i nowego zdarzenia) | gracz odszedł w trakcie walki: traci maks. 1 cios (≤ 18 HP) zamiast ginąć |
| E | brak jakiegokolwiek wejścia przez **60 s** (także poza walką) | gracz odszedł, oszczędzanie baterii |

- **Nie wyzwalają:** wejście wroga w pole widzenia, ALERT, zwykłe trafienie u aktywnego gracza.
- Przy wejściu w pauzę: zerowanie wszystkich trzymanych wejść (klawisze, dotyk, bufor ATK), zapis lokalny (wg Silnika), przyciemniona mapa, napis `PAUSED` + przycisk `RESUME`. Przy wyzwalaczu D dodatkowo `You were hit while away.`
- **Wznowienie:** zawsze świadome, nigdy automatyczne po powrocie do karty: `RESUME` (tap), Esc, P lub Enter. **Spacja NIE wznawia** (to atak – uniknięcie przypadkowego ciosu po pauzie).
- **Po wznowieniu: odliczanie 1,0 s** (nakładka `3 · 2 · 1`, po ~333 ms), symulacja dalej stoi. **Nietykalność po wznowieniu: 0 ms.** W czasie odliczania wejście jest już czytane: kierunek i ATK trzymane w momencie końca odliczania wykonują się w pierwszym ticku. Odliczanie zamiast nietykalności, bo nie da się go nadużyć wielokrotną pauzą, a zapowiedzi wroga są zamrożone co do ticka (gracz po powrocie widzi dokładnie, co się działo).
- Pauza w trakcie zapowiedzi wroga, żeby się zastanowić, jest dozwolona (gra jednoosobowa, nie karzemy tego).

### 1.12 Sterowanie
**Przyjmujemy propozycję PROG / UI i Menu z `/workspace/GRA/prog/sterowanie.md`** (joystick pływający po lewej, ATK po prawej, WASD/strzałki + Spacja/J, Esc/P, warstwa akcji, opcja leworęczna, HUD HP + `||`). Nie definiujemy własnego układu. Doprecyzowania mechaniki do ich pliku:
- Założenie **Z1 → zmienione:** ruch **po siatce**, 8 kierunków (nie swobodny). Joystick: martwa strefa 15%, kwantyzacja do 8 sektorów po 45° z histerezą 10° (zgodnie z ich pkt 2). Prędkość stała, wychylenie wybiera tylko kierunek. Akcja `move` dla logiki = jeden z 8 kierunków albo brak.
- Założenie **Z2 → potwierdzone:** jeden atak podstawowy, automatyczny cel, przytrzymanie = autoatak (tylko gdy cel w zasięgu, 1.3).
- Założenie **Z3 → potwierdzone:** poziomo jako główna orientacja, pionowo obsługiwana (min. obszar widoku w 1.10).
- Założenie **Z4 → potwierdzone:** w M0 nie ma **umiejętności Dash** (wchodzi w M1 jako sk1, 2.5). Unik w M0 = krok z zamrożonego pola.
- Bufor tapnięć 100 ms z ich pkt 8 jest zgodny z 1.1. Bufor ATK w cooldownie: 150 ms (1.3).
- Skosy z klawiatury: `DIAG_GRACE` = 50 ms tylko przy ruszaniu z miejsca (1.2).
- Wyzwalacze auto-pauzy w ich pkt 6 pokrywają A–C. **Dodajemy D i E** (1.11) i ustalamy odliczanie 1,0 s bez nietykalności.

### 1.13 Symbole ASCII M0 (wg `graf/styl-ascii.md`, w tym §9 v1.1)
| Znak | Znaczenie | Uwagi |
|---|---|---|
| `@` | gracz | |
| `c` | Scrap Crawler (wróg M0) | magenta `#FF5FC8` bold (GRAF). W zapowiedzi odwrócona komórka (tło magenta), bez zmiany litery |
| `x` | zamrożone pole celu wroga (miga co 100 ms) | `#FF5FC8` na tle `#4A1240` |
| `*` | moment ciosu (100 ms) | |
| `%` | zwłoki gracza / wrak wroga | przechodni |
| `#` | ściana | blokuje ruch, wzrok i ataki przez róg |
| `.` | podłoga | |
| nakładki (nie zajmują komórek) | żółty `!` zapowiedź ciosu (cała zapowiedź), szary `!` ALERT (300 ms), `-11` / `-16!` obrażenia, `miss`, `+1 kill` | liczby i napisy 600 ms, unoszą się |

### 1.14 Tabela parametrów do strojenia
Wszystkie w `src/data/` (np. `combat-m0.ts`). Czasy w ms, przeliczane na ticki (1.1).

| Nazwa | Wartość | Jednostka | Uwagi |
|---|---|---|---|
| `TICK_MS` | 50 | ms | 20 Hz, Silnik |
| `PLAYER_HP` | 100 | HP | |
| `PLAYER_MOVE_MS` | 150 | ms/komórka | prosto |
| `PLAYER_MOVE_DIAG_MS` | 200 | ms/komórka | skos |
| `DIAG_GRACE_MS` | 50 | ms | tylko klawiatura, ruszanie z miejsca |
| `PLAYER_ATK_RANGE` | 1 | komórki (Czebyszew) | |
| `PLAYER_ATK_WINDUP_MS` | 100 | ms | blokuje ruch |
| `PLAYER_ATK_COOLDOWN_MS` | 300 | ms | |
| `PLAYER_DMG_MIN` | 8 | HP | |
| `PLAYER_DMG_MAX` | 12 | HP | równomiernie, całkowite |
| `PLAYER_CRIT_CHANCE` | 0,10 | — | |
| `PLAYER_CRIT_MULT` | 1,5 | × | zaokr. w dół |
| `INPUT_TAP_BUFFER_MS` | 100 | ms | UI |
| `ATK_QUEUE_MS` | 150 | ms | bufor ATK w cooldownie |
| `PLAYER_REGEN_DELAY_MS` | 5000 | ms | tylko M0 |
| `PLAYER_REGEN_PER_S` | 5 | HP/s | tylko M0 |
| `PLAYER_RESPAWN_MS` | 3000 | ms | + 500 ms zatrzymania |
| `PLAYER_IFRAMES_ON_HIT_MS` | 0 | ms | parametr na M1 |
| `ENEMY_HP` | 80 | HP | |
| `ENEMY_MOVE_MS` | 200 | ms/komórka | prosto |
| `ENEMY_MOVE_DIAG_MS` | 300 | ms/komórka | skos (M0). **Od v0.5.2 per wróg:** skos = 1,5 × krok prosty, zaokrąglony w górę do ticka (2.11, 2.16) |
| `ENEMY_ATK_RANGE` | 1 | komórki | |
| `ENEMY_ATK_WINDUP_MS` | 500 | ms | telegraf (Scrap Crawler M0) |
| `ENEMY_WINDUP_MIN_MS` | 450 | ms | reguła GD: zapowiedź − tick ≥ 400 ms; minimum dla każdego wroga M0–M1 |
| `ENEMY_ATK_COOLDOWN_MS` | 700 | ms | stoi w miejscu |
| `ENEMY_DMG_MIN` | 12 | HP | |
| `ENEMY_DMG_MAX` | 18 | HP | |
| `TELEGRAPH_BLINK_MS` | 100 | ms | |
| `TELEGRAPH_FAST_LAST_MS` | 150 | ms | szybsze miganie (50 ms) |
| `ENEMY_DETECT_RADIUS` | 7 | komórki | + linia wzroku |
| `ENEMY_ALERT_MS` | 300 | ms | |
| `ENEMY_LEASH_RADIUS` | 12 | komórki | |
| `ENEMY_LOST_LOS_MS` | 3000 | ms | |
| `ENEMY_RETURN_DEAF_MS` | 1000 | ms | |
| `ENEMY_PATH_RADIUS` | 20 | komórki | BFS |
| `ENEMY_WANDER_INTERVAL_MIN_MS` / `ENEMY_WANDER_INTERVAL_MAX_MS` | 2000 / 4000 | ms | losowo z przedziału (w kodzie dwie stałe; dawniej `ENEMY_WANDER_INTERVAL_MS` 2000–4000) |
| `ENEMY_WANDER_RADIUS` | 3 | komórki | |
| `ENEMY_RESPAWN_MS` | 5000 | ms | |
| `ENEMY_RESPAWN_MIN_DIST` | 8 | komórki | od gracza |
| `AUTOPAUSE_IDLE_HIT_MS` | 2000 | ms | wyzwalacz D |
| `AUTOPAUSE_IDLE_MS` | 60000 | ms | wyzwalacz E |
| `RESUME_COUNTDOWN_MS` | 1000 | ms | 3·2·1 |
| `RESUME_IFRAMES_MS` | 0 | ms | |
| `FLOAT_TEXT_MS` | 600 | ms | nakładki |
| `HIT_FLASH_MS` | 100 | ms | |
| `PLAYER_DEATH_FREEZE_MS` | 500 | ms | 1.8, zatrzymanie świata przed `SIGNAL LOST` (dopisane v0.3, `COMBAT_EXTRAS`) |
| `TELEGRAPH_FAST_BLINK_MS` | 50 | ms | 1.7 pkt 4, okres szybkiego migania w ostatnich `TELEGRAPH_FAST_LAST_MS` (dopisane v0.3) |
| `STRIKE_FX_MS` | 100 | ms | 1.7 pkt 5, znacznik `*` na polu celu (dopisane v0.3) |
| `HIT_VIBRATE_MS` | 20 | ms | 1.7 pkt 5, opcjonalna wibracja (decyduje UI; dopisane v0.3) |
| `MOVE_DEADZONE` | 0,15 | długość wektora | zabezpieczenie logiki przed szumem analogowym. Właściwa martwa strefa joysticka (15%) należy do UI (dopisane v0.3) |
| `VIEW_MIN_LANDSCAPE` | 31 × 17 | komórki | |
| `VIEW_MIN_PORTRAIT` | 17 × 21 | komórki | |
| `ARENA_SIZE` | 40 × 20 | komórki | mapa testowa |
| `MAX_STEPS_PER_FRAME` | 5 | ticki | stała Silnika: maks. kroków symulacji na klatkę renderu (ochrona przed „spiralą śmierci” po zacięciu); nadmiar czasu jest odrzucany (dopisane v0.5) |

Kontrola spójności przy strojeniu: (1) `ENEMY_MOVE_MS` > `PLAYER_MOVE_MS` (ucieczka możliwa); (2) **reguła zapowiedzi (zatwierdzona przez GD 25.10.2026):** zapowiedź każdego ciosu wroga − `TICK_MS` ≥ 400 ms, czyli **min. 450 ms (9 ticków)**. Dotyczy wszystkich wrogów M1 (także bossa, wieżyczki i dronów przywołanych przez bossa) i nie zmienia się z głębokością (`ENEMY_WINDUP_MIN_MS`, 2.11); (3) czas zabicia wroga ≈ 2,5–3,5 s; (4) „stój i bij” kosztuje 25–45% HP gracza.

### 1.15 Kryteria akceptacji M0 (dla QA i GD)
M0 jest zaliczony, gdy **wszystkie** punkty są spełnione na: Chrome Android, iOS Safari (poziomo i pionowo) i desktop Chrome/Firefox (klawiatura):
1. Symulacja chodzi stałym tickiem 50 ms. Czasy akcji zgadzają się z tabelą 1.14 z dokładnością do 1 ticka (test jednostkowy Vitest + log debug).
2. Ruch w 8 kierunkach po siatce: 150 ms prosto, 200 ms po skosie. Ciągły marsz przy trzymaniu. Ściany i wróg blokują. Nie ma ścinania rogów. Skos z klawiatury działa bez kroku „schodkowego”.
3. Atak: zasięg 1 z automatycznym celem, 2,5 ciosu/s, obrażenia 8–12 i krytyki 12–18 widoczne jako liczby. Przytrzymanie ATK bije tylko z celem w zasięgu. Tap bez celu bije w `facing`.
4. Wróg przechodzi IDLE → ALERT → CHASE → ATTACK → RETURN zgodnie z 1.6, łącznie z linią wzroku, utratą śladu i powrotem z odnowieniem HP.
5. Zapowiedź ciosu (żółty `!` + odwrócona komórka wroga + migające `x`, 1.7) jest czytelna bez koloru. Zejście z pola w trakcie 500 ms zawsze daje pudło. Pozostanie na nim zawsze daje trafienie.
6. Walka 1 na 1 bez uników: w 20 próbach QA średnio 7–9 ciosów gracza, 2–4 s, strata 18–54 HP (zgodnie z 1.5).
7. Tester po 5 minutach nauki unika ≥ 70% zapowiedzi na telefonie i na klawiaturze (cel komfortu M0, do potwierdzenia w planie QA).
8. Śmierć gracza: ekran `SIGNAL LOST`, respawn po 3 s, reset wroga, `%` w miejscu śmierci. Śmierć wroga: `%`, respawn po 5 s przy dystansie ≥ 8.
9. Auto-pauza działa dla wyzwalaczy A–E, wszystkie wejścia są zerowane, po powrocie do karty gra **nie** rusza sama. Wznowienie ma odliczanie 1,0 s, liczniki wroga są zachowane co do ticka, nie ma skoku delta-time.
10. Joystick i ATK działają jednocześnie (wielodotyk), a gesty przeglądarki są zablokowane (zgodnie z `sterowanie.md`).
11. Wszystkie parametry z 1.14 są w jednym pliku danych. Zmiana wartości nie wymaga zmiany logiki.
12. Subiektywnie (ankieta QA, min. 3 osoby): „walka jest przyjemna” ≥ 4/5 na obu urządzeniach. To główny cel M0 z planu produkcji.

### 1.16 Odpowiedzi dla UI i Menu (decyzje do pytań z `prog/sterowanie.md`, pkt 9)
1. **Ruch:** po siatce znaków (komórka po komórce), **8 kierunków**, **prędkość stała** (150 ms prosto / 200 ms skos). Wychylenie joysticka wybiera tylko kierunek: martwa strefa 15%, 8 sektorów po 45°, histereza 10°. Nie ma skradania.
2. **Atak:** w M0 **jeden** atak podstawowy. **Przytrzymanie = autoatak: TAK**, w tempie 2,5/s, ale tylko gdy cel jest w zasięgu. Tap bez celu = jeden cios w kierunku patrzenia. Bufor ATK 150 ms przed końcem odnowienia.
3. **Celowanie: automatyczne** (najbliższy wróg w zasięgu, remis → kierunek patrzenia). **W M0 tylko wręcz** (zasięg 1, 8 sąsiadów). Dystans przyjdzie w M1 przez slot broni, też z autocelowaniem. Celowanie myszą: nie w M0.
4. **Umiejętność Dash: nie w M0** (unik = krok z zaznaczonego pola). **Wchodzi w M1 jako umiejętność sk1** (Część 2, 2.5), obsługiwana **przyciskiem, nie gestem**: gest koliduje z joystickiem pływającym.
5. **Orientacja:** **pozioma główna**, pionowa obsługiwana (oba tryby objęte testami M0). Minimalny widok: poziomo 31 × 17, pionowo 17 × 21 komórek. Obrót w trakcie gry = auto-pauza.
6. **Interakcje (M1):** drobny łup (kredyty, złom, materiały) **zbierany automatycznie** po wejściu na pole. Sprzęt, zwłoki, terminale i ewakuacja przez **kontekstowy przycisk USE** (klawisz E). Na telefonie pojawia się nad ATK tylko wtedy, gdy jest obiekt na polu albo obok. W M0 nie ma USE.
7. **Po pauzie: odliczanie 1,0 s** (`3 · 2 · 1` po ~333 ms), **nietykalność 0 ms**. Wejście trzymane podczas odliczania działa w pierwszym ticku po nim. Wznowienie zawsze świadome: tylko RESUME / Esc / P / Enter. **Spacja NIE wznawia** (to klawisz ataku).
8. **HP: pasek + liczba** (`HP [########--] 80/100`), tak jak w waszej propozycji. **W M0 nie ma innego zasobu.** Zarezerwujcie miejsce pod drugi pasek albo cooldowny 3 umiejętności na M1 (decyzja w Części 2). Dodatkowo w M0 są pływające liczby obrażeń nad celem (600 ms).

### 1.17 Otwarte pytania
**Rozstrzygnięte przez PROG / Gameplay (`prog/walka-m0.md` §6, 25.10.2026):**
- Kolejność w ticku: **potwierdzona i zaimplementowana** (1.1), łącznie z kodowaniem „przygotowanie = 1” i brakiem kroku w ticku własnego ciosu.
- Liczby z prozy, których brakowało w tabeli 1.14 (`COMBAT_EXTRAS`), są dopisane do tabeli.
- Żetony ataku, odstęp 150 ms, okrążenie bez cofania i osobna pula drona: przyjęte w 2.10.

**Rozstrzygnięte przez PROG / Silnik (25.10.2026), dla porządku:**
- Ścieżki: w M0 BFS przy każdym kroku wroga, promień 20. W M1 jedna wspólna mapa odległości (flow field) liczona, gdy gracz zmieni komórkę (Część 2, 2.10).
- Zapis przy auto-pauzie odtwarza pełny stan co do ticka (numer ticka, stan PRNG, liczniki, stany AI) i jest wersjonowany.
- Znacznik ostatniego wejścia (`lastInputTick`) dla wyzwalacza D dostarcza `InputManager` Silnika.

**Rozstrzygnięte przez PROG / UI i Menu (`prog/sterowanie.md`, 25.10.2026):**
- Joystick: dodatkowo poniżej 25% wychylenia kierunek się nie zmienia (trzyma poprzedni). Przyjmujemy.
- Minimalna komórka siatki 20 px CSS. Zaznaczenie pola celu przez tło lub obramowanie komórki. Liczby obrażeń min. 12 px z obrysem. Przyjmujemy (1.7 pkt 2 realizujemy jako tło/obramowanie + miganie).
- USE to osobny przycisk nad ATK, nie slot umiejętności. Przyjmujemy.

**Rozstrzygnięte przez Game Directora (akceptacja v0.2, 25.10.2026):**
- Auto-pauza tylko przy nieobecności gracza (A–E): **OK**. „Pauza po wykryciu wroga” wraca jako **opcja dostępności po M1**.
- Bump attack (krok w stronę wroga = atak): **TAK, od M1**. W M0 nie (zasady w 2.6).
- Gra idealna bez strat (1.5): **zostaje** jako nagroda za umiejętności.
- Brak regeneracji w M1: **zaakceptowany** (2.13). Regeneracja 5 HP/s zostaje wyłącznie pomocą testową M0.
- Nazwy „Scrap Crawler”, „Shock Baton”, `SIGNAL LOST`: **zaakceptowane**. Teksty ekranu śmierci w M1: `M1_BASE_04`.

---

## Część 2: Pętla gry M1

Zakres od Producenta: pętla gry M1, 3 umiejętności, zasady śmierci (utrata niesionego łupu) i ewakuacji, kontrakty na krótkie sesje.

Podstawa:
- Część 1 (walka i ruch),
- `plan-produkcji.md` (zakres M1),
- `fabula/zakres-m1.md` (§3, §5, §10),
- `fabula/teksty-m1-en.md` (teksty podawane tu przez ID, w tym §10 i pula M2),
- `graf/styl-ascii.md` (§4 i §9 v1.1),
- `prog/sterowanie.md` (sloty i przyciski),
- `design/level-design-m1.md` (generator, odległości).

**Odległości** w Części 2 to zawsze **długość ścieżki BFS po polach przechodnich** (zgodnie z Level Design), nie linia prosta. Efektywna prędkość marszu po ścieżce to **5,5–6 pól/s** (mieszanka kroków prostych 150 ms i skośnych 200 ms).

**Twarde zastrzeżenia Game Directora (wiążące dla całej Części 2):**
- **Z-GD1:** odzyskanie łupu **nigdy nie jest pewne**. W M1 jest spełnione najprościej: **odzysku nie ma** (2.7). System odzysku od M2 musi tę zasadę zachować (sekcja M2).
- **Z-GD2:** trudność rośnie **tylko ze strefą i głębokością**, nigdy z liczbą śmierci gracza (2.11). Nie ma też ułatwień po śmierciach (żadnej „litości”).
- **Z-GD3:** **czytanie zapisków pauzuje grę** (2.14).

Wartości ekonomiczne (ceny, nagrody w kredytach) są **ROBOCZE**: oznaczone jako (R), do przejęcia przez Balans i Ekonomię. Wartości mechaniczne (czasy, zasięgi, sloty) to propozycja Mechanik do strojenia.

### 2.1 Pętla gry M1 w skrócie
```
 BAZA (Vat Station 3)                     STREFA (Sector 1: Ashfield Yards)
 ┌──────────────────────────┐   winda    ┌──────────────────────────────────────┐
 │ kontrakty (BASE/Exchange)│ ─────────> │ głęb. 1 → 2 → 3 (+ boss Rail Guardian)│
 │ Exchange: kup / sprzedaj │            │ walka, łup, terminale, notatki       │
 │ skrytka, sprzęt          │ <───────── │ DECYZJA: dalej (>) czy winda (<)?    │
 │ ulepszenie bazy, mapa    │ ewakuacja  │ śmierć → wszystko ryzykowne przepada │
 └──────────────────────────┘            └──────────────────────────────────────┘
   podsumowanie sesji (BASE) po każdym powrocie i po każdym wydruku
```
1. **Przygotowanie (baza, 30–90 s):** wybór kontraktów, zakup Med-Patchy, sprzęt ze skrytki albo z półki automatu (2.12). Baza to menu-hub bez ticków (2.14a). Ważna decyzja: **co zabrać**, bo wszystko zabrane jest ryzykowane w 100%.
2. **Wyprawa:** winda na głębokość 1 albo na odblokowany przystanek (2.9). Walka, łup, terminale.
3. **Decyzja dalej/wracać:** HUD zawsze pokazuje **`AT RISK: {cr}`**, czyli sumę wartości sprzedaży wszystkiego, co przepadnie przy śmierci (plecak + założony sprzęt poza Issue + kredyty ze strefy), oraz zajętość plecaka. Przy pełnej utracie w M1 ta liczba to **dokładnie** stawka, o jaką gracz gra (filar 1).
4. **Powrót:** ewakuacja windą (2.9) albo śmierć (2.7).
5. **Baza:** sprzedaż, kontrakty, skrytka, ulepszenie, podsumowanie sesji (`M1_BASE_11`–`M1_BASE_14`, liczby zawsze prawdziwe).
6. **Rozwój:** lepszy sprzęt, przystanki windy (skrót), zapalone fragmenty sektora, biegłość umiejętności, wyższa głębokość.

**Stawka w liczbach (szacunek z rozkładu łupu 2.12, wartości R):** średnia wartość przedmiotu to ok. 18 kr na głęb. 1, 39 kr na głęb. 2 i 76 kr na głęb. 3.
| Moment wyprawy | `AT RISK` (bez założonego sprzętu) |
|---|---|
| po głęb. 1 | **≈ 170 kr** (6,3 przedmiotu + 27 Scrap) |
| po głęb. 2 | **≈ 580 kr** (plecak prawie pełny) |
| na głęb. 3 | **≈ 900–1300 kr**, limitowane plecakiem 12 slotów (gracz wymienia słabsze rzeczy na lepsze) |

Do tego dochodzi założony sprzęt, który gracz sam wybiera w bazie (tani albo drogi zależnie od celu, wizja, filar 1).

### 2.2 Struktura sesji (cele długości)
| Typ sesji | Cel długości | Co się dzieje | Uzasadnienie liczby |
|---|---|---|---|
| Mikro (baza) | **15–45 s** | kontrakt Exchange (dostawa/sprzedaż), zakupy | tylko menu, bez strefy |
| Krótka (kontrakt BASE lub Exchange) | **otwarcie gry → ekran podsumowania: mediana ≤ 3 min, p80 ≤ 4 min** (decyzja GD) | wczytanie, baza, winda, cel, ewakuacja, podsumowanie | budżet czasu niżej |
| Średnia (wyprawa na 1–2 głęb.) | **8–15 min** | eksploracja 1–2 poziomów, 1 terminal na poziom | ~6–8 min na poziom z walką i łupem |
| Długa (pełna wyprawa + boss) | **30–45 min** | głęb. 1→3, boss, plecak pełny w połowie głęb. 2 | 3 poziomy × 8–10 min + boss 1,5–2,5 min + powroty |

**Budżet czasu krótkiej sesji (v0.5, metryka GD; typowy gracz, mediana / p80):**

| Etap | Mediana | p80 | Źródło |
|---|---|---|---|
| Otwarcie gry → ekran bazy (wczytanie zapisu) | 3 s | 5 s | Silnik |
| Baza: tablica kontraktów, zakupy, sprzęt | 35 s | 60 s | 2.1 (30–90 s). Wymóg dla UI: tablica kontraktów i przycisk windy widoczne od razu po wczytaniu |
| Wyjazd windą baza → strefa (`LIFT_RIDE_MS`) | 2 s | 2 s | 2.9 |
| Strefa (wyjazd → wejście do kabiny) | wg kontraktu | wg kontraktu | 2.4 |
| Odjazd i zjazd (`LIFT_DEPART_MS` + `LIFT_RIDE_MS`) | 3 s | 3 s | 2.9 |
| **Narzut poza strefą** | **≈ 43 s** | **≈ 70 s** | |

| Sesja | Strefa: mediana / p80 | **Całość: mediana / p80** | Cel GD (≤ 180 / ≤ 240 s) |
|---|---|---|---|
| Restore Relay, głęb. 1 (zagadka 30–60 s) | 75 / 105 s | **118 / 175 s** | ✓ |
| Restore Relay, głęb. 3 (zagadka 60–90 s, winda 9 s) | 111 / 139 s | **154 / 209 s** | ✓ |
| Data Core, głęb. 2 | 85 / 110 s | **128 / 180 s** | ✓ |
| Clear the Path, głęb. 1 / 2 | 65–75 / 80–95 s | **108–118 / 150–165 s** | ✓ |
| Clear the Path, głęb. 3 (v0.5.2, `sss` + `ddh`, winda 9 s) | 62–82 / ~110 s | **105–125 / 180 s** | ✓ |
| Kontrakt Exchange (tylko baza) | — | **≈ 35 / 55 s** | ✓ |

Wniosek: wszystkie kontrakty mieszczą się w metryce GD bez zmian w samych kontraktach. Najwęższe miejsce to Relay na głęb. 3 przy p80. Warunki:
- zagadka mieści się w czasach z `zagadki-m1/` (mediana 30–60 s na głęb. 1, 60–90 s na głęb. 2–3);
- wizyta w bazie ma medianę ≤ 40 s.

**Czas zagadki jest wiążący (v0.5.2, QA R27, decyzja przekazana LUZ / Pracownik 1):** mediana **30–60 s na głęb. 1** i **60–90 s na głęb. 2–3**, p80 ≤ 120 s. Wariant `M1_TERM_03` traci przełącznik-pułapkę [4,5].

Sprawdzenie Relay na głęb. 3. Strefa = zagadka + ~36 s (mediana) / ~49 s (p80), całość = strefa + narzut 43 / 70 s:

| Wariant głęb. 3 (zagadka mediana / p80) | Całość mediana / p80 | Cel ≤ 180 / ≤ 240 s |
|---|---|---|
| środek celu (75 / 90 s) | 154 / 209 s | ✓ |
| górna granica celu (90 / 120 s) | 169 / **239 s** | ✓ na granicy (1 s zapasu przy p80) |
| `M1_TERM_03` z pułapką (120–180 s, szacunek LUZ) | **199–259 s** | ✗ |
| **limit wariantu głęb. 3 (proponowany): mediana ≤ 75 s, p80 ≤ 105 s** | ≤ 154 / ≤ 224 s | ✓ z zapasem 26 / 16 s |

Wniosek: przy samym celu 60–90 s najdłuższy wariant mieści się w medianie (169 s), ale p80 nie ma zapasu. Dlatego **na głęb. 3 (warianty 06 i 03) obowiązuje limit: mediana ≤ 75 s i p80 ≤ 105 s** (`PUZZLE_TIME_LIMIT_D3`). Jeśli QA w B3 zmierzy więcej dla `M1_TERM_03` po usunięciu pułapki, LUZ / Pracownik 1 upraszcza wariant dalej. Głęb. 2 zostaje przy 60–90 s (całość ~167 / ~237 s, QA obserwuje w B1). Stan `zagadki-m1/power-lines-line1.md` (v0.4) w chwili pisania: nadal „60–120 s na wariant” i pułapka [4,5] w 03, więc LUZ 1 musi to jeszcze nanieść.

Pierwsza godzina (Prolog, 2.19) i sesje średnie/długie nie są „krótką sesją”. QA mierzy metrykę w B1 (b).

- Wizja: krótka 30 s – 3 min, długa 30 min – 2 h. M1 ma jeden sektor, więc długa sesja celuje w dolną granicę (30–45 min). Górna granica przyjdzie z kolejnymi strefami (M2+).
- **Przerwanie w dowolnym momencie:** auto-pauza i zapis co do ticka (Część 1, 1.11 i ustalenia Silnika). Gracz nie musi kończyć wyprawy, żeby zamknąć grę.
- **Każda sesja zostawia ślad (filar 6):** podsumowanie zawsze pokazuje co najmniej jedną trwałą zmianę: biegłość, kontrakt, fragment sieci, przeczytane notatki, kredyty. Także po śmierci, gdy ryzykowny łup przepadł w całości.

### 2.3 Trwałe vs ryzykowane (kluczowa tabela)
| Zawsze bezpieczne (trwały postęp, śmierć tego nie cofa) | Ryzykowane (przy śmierci w M1 przepada w 100%, bez odzysku) |
|---|---|
| Kredyty na koncie w bazie (wypłacone przez Exchange) | Cały plecak (12 slotów): sprzęt, materiały, Med-Patche, przedmioty kontraktów (np. Data Core) |
| Skrytka w bazie (`{STASH_SLOTS}`: 30 / 40 / 50 / 60 wg poziomu Lights, 2.15) | **Cały założony sprzęt** (4 sloty), poza sprzętem startowym Issue |
| Zapalone fragmenty sieci, przystanki windy, ulepszenie bazy | Kredyty podniesione w strefie (`$`), dopóki nie wrócą do bazy |
| Biegłość umiejętności, odblokowane umiejętności | Postęp aktywnego kontraktu BASE (kontrakt wraca na tablicę) |
| Przeczytane notatki i zapiski (zapamiętane przez Vat) | |
| Ukończone kontrakty i ich nagrody | |

**Sprzęt startowy Issue** (`M1_GEAR_ISSUE`, `M1_GEAR_ISSUE_POLE`, `M1_GEAR_ISSUE_SUIT`): przy każdym wydruku BASE wydaje Issue Pole i Issue Suit, a **przy każdym wyjeździe windą** (po wydruku i po ewakuacji tak samo, Balans) uzupełnia Med-Patche do **`{ISSUE_MEDPATCH_TOPUP}`** sztuk: **2, a od Lights I 3** (decyzja GD, 2.15), jeśli gracz ma mniej (`M1_GEAR_ISSUE_TOPUP`). Gracz zaczyna nowy zapis z **50 kr** (`START_CREDITS`, Balans v1.2).

**Poziom Issue (QA R20, Balans v1.2):** Issue **nigdy nie przepada**, a jego poziom rośnie z odblokowanymi przystankami windy:

| Poziom | Warunek | Issue Pole | Issue Suit |
|---|---|---|---|
| **Mk1** | start | 8–12 obrażeń, 2,5 ciosu/s (Część 1) | pancerz 0 |
| **Mk2** | odblokowany przystanek na głęb. 2 | **10–15** obrażeń, 2,5 ciosu/s | **pancerz 6** |

Poziom zależy od przystanku (trwały postęp), a nie od liczby śmierci, więc Z-GD2 jest zachowane. **Teksty Issue (Lore, wszystkie zatwierdzone przez GD):** `M1_GEAR_ISSUE_POLE` „Issue Pole” („A long metal pole from the Vat. Swing it wide to hit many enemies. It is not much, but it is always there.”), `M1_GEAR_ISSUE_POLE_2_NAME` „Issue Pole II” i `M1_GEAR_ISSUE_POLE_2` („A longer, heavier pole from the Vat. It swings wide and hits harder, but it is still basic gear.”), `M1_GEAR_ISSUE_SUIT_2_NAME` „Issue Suit II” i `M1_GEAR_ISSUE_SUIT_2`. Dawne ID `M1_GEAR_ISSUE_BATON*` są wycofane. Opis „swing it wide” zakłada zamach łukiem z v0.6 (design/wariant-twin-stick.md). Samodzielna linia BASE **`M1_BASE_17`** (zatwierdzona przez GD) przy pierwszym wyjeździe windą po odblokowaniu przystanku na głęb. 2 (moment przejścia na Mk2). `M1_GEAR_ISSUE` i `M1_RISK_03` bez zmian. Śmierć nie daje więc darmowych patchy ponad zwykły wyjazd (Z-GD2). Issue nie da się sprzedać (0 kr), nie przepada i nie liczy się do `AT RISK`.

Przy pełnej utracie Issue jest **jedyną** siatką bezpieczeństwa. Issue nigdy nie przepada; jego poziom rośnie z odblokowanymi przystankami (Mk1 → Mk2 na głęb. 2), nigdy z liczbą śmierci (Z-GD2). Issue i chroni przed miękką blokadą: gracz bez kredytów i sprzętu zawsze może wyruszyć i zarobić. Sprawdzenie: na Issue gracz zabija Curfew Guarda na głęb. 1 (120 HP) w ~4,5 s, tracąc 51 HP bez uników albo 26 HP przy 50% uników. Ma 180 HP budżetu (100 + 2 Med-Patche), a poziom głęb. 1 kosztuje ~79 HP przy 50% uników (Balans), więc głęb. 1 jest przechodnia na samym Issue.

### 2.4 Kontrakty (krótkie sesje)
- **Tablica:** maks. **3 aktywne kontrakty** naraz (2 od BASE + 1 od Exchange). **Na nowo losują się tylko ukończone sloty**, po następnym powrocie do bazy (`M1_BASE_10`). Losowanie odbywa się per para **(typ, głębokość)** z własną wagą (Balans §6.3: domyślnie ×1, ponowne zestrojenie ×0,5 wagi Relay tej głębokości); na tablicy nie ma dwóch identycznych par. Nie ma limitu czasu w czasie rzeczywistym (gra nie karze za nieobecność).
- **Kontrakty BASE są losowane tylko na głębokościach, gdzie winda ma przystanek** (głęb. 1 zawsze, 2 i 3 po odblokowaniu, 2.9). Dzięki temu kontrakt zawsze startuje przy szybie i mieści się w sesji krótkiej. Bez tej reguły kontrakt na głęb. 2 wymagałby przejścia całej głęb. 1 (sesja średnia).
- Kontrakty BASE liczą się podczas **każdej** wyprawy: można je robić osobno (sesja krótka) albo „po drodze” w długiej.
- Kontrakt BASE kończy się dopiero po **ewakuacji** z wykonanym celem. **Śmierć:** każdy aktywny kontrakt **zostaje w swoim slocie z wyzerowanym postępem** (ten sam kontrakt, bez nowego losowania). Nie ma kary poza utraconym łupem (Data Core przepada razem z resztą). To zgodne z implementacją (`prog/kontrakty-m1.md` A4, `prog/game/src/contracts/`).
- **Ponowne zestrojenie liczone osobno dla każdej głębokości:** Restore Relay na danej głębokości staje się „ponownym zestrojeniem”, gdy rozwiązane są **wszystkie warianty terminali tej głębokości** (głęb. 1: 04, 07, 08; głęb. 2: 05, 01, 02; głęb. 3: 06, 03). Inne głębokości nie mają na to wpływu. Zgodne z implementacją (`prog/kontrakty-m1.md` A3).
- **Wrogowie kontraktu nie upuszczają łupu** (`CONTRACT_ENEMY_LOOT` = 0: 0 Scrap, 0 przedmiotów, 0 kr; Balans). Bez tej reguły Clear the Path na głęb. 1 dawałby ~80 kr/min i łamałby zasadę GD.
- **Terminal Power Lines (zagadka):** specyfikacja w **`design/zagadki-m1/`** (`power-lines-line1.md`, dane `power-lines-line1.json`, autor: LUZ / Pracownik 1). Wstępne ustalenia:
  - reguły dochodzą stopniowo z głębokością;
  - cel czasu **30–60 s na głęb. 1** i **60–90 s na głęb. 2–3**;
  - kara za błąd 1,5 s, bez blokady terminala;
  - podpowiedź pod `?` za darmo, bez wpływu na nagrodę;
  - `M1_AFFIX_11` daje darmową podpowiedź na starcie;
  - plansza 9×9 z przyciąganiem tapu;
  - **w poziomie (telefon):** siatka maks. 9×9, komórka min. **28 px** (awaryjnie 26 px), pole trafienia przełącznika **48×48 px**, bez przewijania, przełączniki w odległości Czebyszewa **≥ 2** od siebie (żeby pola trafienia się nie nakładały).

  Ten czas jest częścią budżetu sesji (2.2) i jest **wiążący** (v0.5.2, QA R27). Na głęb. 3 dodatkowo limit wariantu: mediana ≤ 75 s, p80 ≤ 105 s (2.2). Wariant `M1_TERM_03` bez przełącznika-pułapki [4,5].

**Zasada ekonomii kontraktów (decyzja GD, v0.4):** kontrakt **nie daje więcej kr/min niż wyprawa na tej samej głębokości**. **Podstawa czasu (Balans v1.1, v0.5.2): pełny cykl baza → baza**, czyli sesja z 2.2 bez 3 s wczytania, **tak samo dla kontraktów i wypraw** (wyprawa: poziom ~8 min + ~0,67 min narzutu). Limity: **20 / 48 / 90 kr/min** na głęb. 1/2/3 (było 21 / 52 / 97 na samym czasie strefy). Kontrakt musi być atrakcyjny **z innego powodu niż kredyty**:
- pewna mała nagroda bez dużego ryzyka,
- trwały postęp,
- albo materiał trudny do zdobycia gdzie indziej.

Krótka sesja ma dać widoczny postęp (filar 6). Nagrody poniżej są przeliczone pod tę zasadę i potwierdzone przez Balans (v1.1, §5). kr/min liczone na cykl baza → baza.

| ID tekstu | Kontrakt | Cel | Głęb. | Czas (mediana) | Nagroda (R) | kr/min vs wyprawa | Powód atrakcyjności (nie kredyty) | Waga w puli (R) |
|---|---|---|---|---|---|---|---|---|
| `M1_CONTR_01` | **Restore Relay** (BASE) | rozwiązać terminal Power Lines tego poziomu i ewakuować się | 1–3 (z przystankiem) | głęb. 1: 45–105 s (~75 s); głęb. 2–3: 60–140 s (~110 s) | **35 kr** (Balans v1.1, było 40) + przy pierwszym rozwiązaniu wariantu **fragment sieci (+10%)**. Po wyczerpaniu wariantów tej głębokości „ponowne zestrojenie” (LD §3): **25 kr + 2 Copper** (Balans v1.1, było 30), bez fragmentu | 18 / ~16 / 14 kr/min ≤ 20 / 48 / 90 (przy 40 kr głęb. 1 dawała 21 > 20) | **Trwały postęp:** fragment sieci, przystanek windy (pierwszy terminal na głębokości) i ulepszenie bazy (`M1_TERM_08`). Druga forma gry: zagadka pauzuje świat, a w pokoju terminala nie startuje żaden wróg (LD), więc ryzyko jest niskie. Ponowne zestrojenie: pewna nagroda i Copper na ulepszenia (Lights, w M2 Beacon) przy minimalnym ryzyku | ×1, po wyczerpaniu ×0,5 |
| `M1_CONTR_02` | **Recover the Data Core** (BASE) | zabrać Data Core `§` (1 slot plecaka, przepada przy śmierci) z miejsca 30–45 pól od szybu, pilnowanego przez 3 wrogów kontraktu, i ewakuować się | 2 (z przystankiem) | 60–110 s (~1,4 min) | **40 kr + 3 Copper** (wartość ~55 kr). Było 90 kr + 30% na przedmiot r≥2 | ~26 kr/min ≤ 48 | **Materiał trudny do zdobycia:** Copper jest tylko w skrzyniach od głęb. 2 (~8 na poziom), a ulepszenie bazy wymaga 15 Copper. Kontrakt daje go pewnie i szybko | ×1 |
| `M1_CONTR_03` | **Clear the Path to the Lift** (BASE) | zabić 6 wrogów kontraktu stojących 12–20 pól od szybu i ewakuować się. Głęb. 3: grupy `sss` + `ddh` z mnożnikami głęb. 3 | 1, 2 lub 3 (z przystankiem; głęb. 3 decyzja GD v0.5.2) | 45–80 s (~1 min); głęb. 3: sesja ~105–125 s | głęb. 1: **1 Med-Patch**. Głęb. 2: **25 kr + 1 Med-Patch**. Głęb. 3: **40 kr + 1 Med-Patch** | ~13 / ~25 / ~32 kr/min (patch liczony jako 25 kr) ≤ 20 / 48 / 90 | **Pewna mała nagroda przy niskim ryzyku:** walka zawsze tuż przy szybie (ucieczka windą 6–8 s), a Med-Patch to zasób na następną wyprawę (niesprzedawalny). Do tego biegłość umiejętności rośnie w krótkiej sesji. Na głęb. 3 jedyny kontrakt z nagrodą-zasobem; urozmaica tablicę głęb. 3 (bez niego zestrojenie ×0,5 nie działa na głęb. 3, Balans §5.1) | ×1 (głęb. 1 / 2 / 3) |
| `M1_CONTR_04` | **Deliver N Units** (Exchange) | oddać w bazie 20 Scrap albo 8 Copper | baza | 15–30 s | wartość sprzedaży × 1,5 (20 Scrap → 60 kr, 8 Copper → 60 kr), czyli premia +20 kr | premia +20 kr (materiał pochodzi z wypraw) | **Zero ryzyka:** mikro sesja w bazie, zamienia nadmiar materiałów na kredyty z premią. Widoczny postęp (kredyty na ulepszenie) bez wychodzenia do strefy | ×1 |
| `M1_CONTR_05` | **Sell One Item** (Exchange) | sprzedać 1 przedmiot rzadkości 2 (Tuned) albo 3 (Grid-Grade) | baza | ~15 s | cena sprzedaży **+50 kr (r2) / +100 kr (r3)** (Balans) | premia 50/100 kr, ≈ 1 min wyprawy na głęb. 2/3 | **Zero ryzyka:** premia za przedmiot już przyniesiony z wyprawy. Pomaga zdecydować, co zatrzymać, a co sprzedać | ×1 |
| `M1_CONTR_DONE` | ukończenie | | | | | | | |

**Wrogowie kontraktu** (Data Core, Clear the Path) to osobna grupa dokładana do poziomu poza zwykłą pulą. Stoją poza strefą bez wrogów z Level Design (10 pól od wejścia i szybu), dlatego Clear the Path ma 12–20 pól, a nie 10 jak w v0.2.

**Sprawdzenie czasów z odległościami Level Design** (marsz 5,5–6 pól/s po ścieżce; walka z jednym wrogiem 3–5 s na głęb. 1, ~5–6 s na głęb. 2–3, 2.11; ewakuacja z 2.9):
- **Restore Relay:**
  - dojście szyb → terminal **25–40 pól** = 4–7 s;
  - po drodze 0–2 wrogów (strefa 10 pól przy szybie i 8 przy terminalu jest pusta) = 0–12 s;
  - zagadka (pauzuje świat) = **30–60 s na głęb. 1, 60–90 s na głęb. 2–3** (`zagadki-m1/`);
  - powrót = 4–7 s;
  - ewakuacja: 1,0 s wezwania + dojazd 5/7/9 s, a alarm przy przyjeździe windy może ściągnąć 0–2 wrogów (0–12 s; gracz czekający przy szybie zwykle wsiada przed nimi, 2.9).

  Razem **≈ 45–105 s na głęb. 1** i **≈ 77–140 s na głęb. 3** (v0.4 przy zagadce 60–120 s: 75–170 s). Z narzutem bazy i windy mieści się w metryce GD (2.2).

  **Rozstrzygnięte (Balans v1.1):** podstawa czasu to cykl baza → baza (także dla wypraw), limit głęb. 1 = 20 kr/min. Przy 40 kr Relay na głęb. 1 dawał 20,9 kr/min, więc nagroda spada do 35 kr (18 kr/min), a zestrojenie do 25 kr + 2 Copper.
- **Data Core (głęb. 2):** 2 × 30–45 pól = 10–16 s + 3 strażników × ~5,1–5,9 s = 15–18 s + 0–2 wrogów po drodze (0–12 s) + ewakuacja 8 s + alarm (0–12 s). Razem **≈ 35–70 s**, z marginesem na szukanie **60–110 s**. W v0.2 było 1,5–2,5 min. Czas jest krótszy, bo kontrakt startuje zawsze z przystanku przy szybie.
- **Clear the Path:** dojście 12–20 pól (2–4 s) + 6 wrogów × 4–5 s (część w grupach) ≈ 24–30 s + szukanie 10–20 s + ewakuacja 6–8 s + alarm (0–12 s). Razem **≈ 45–80 s**. W v0.2 było 55–90 s.
- **Clear the Path, głęb. 3 (v0.5.2):** `sss` + `ddh` z mnożnikami głęb. 3, walka ~49–52 s w strefie (symulacja Balansu, mediana), z szukaniem i ewakuacją (10 s) strefa **~62–82 s**, sesja **~105–125 s** (p80 ~180 s). Strata HP przy typowym sprzęcie głęb. 3 (48 DPS, DR 23%): 85 HP przy 50% uników, śmierć 0,0% (sprzęt wejściowy: 2,1%). Bez łupu z wrogów (`CONTRACT_ENEMY_LOOT` = 0).
- **Zagadki:** na poziom jest **dokładnie 1 terminal** (pierwszy nierozwiązany wariant tej głębokości). Kolejność trudności wg Level Design: głęb. 1 **04 < 07 < 08**, głęb. 2 **05 < 01 < 02**, głęb. 3 **06 < 03**.

### 2.5 Umiejętności M1 (3 sloty, wymienne w projekcie)
**Decyzja (zaakceptowana przez GD):** w M1 są **3 umiejętności, każda na stałym slocie**. Sloty sk1/sk2/sk3 leżą w łuku wokół ATK, klawisze **1 / 2 / 3**, alternatywnie **K / L / ;** (zgodnie z `prog/sterowanie.md`). **W M1 nie ma innego zasobu niż czas odnowienia:** brak energii i many, HUD bez drugiego paska. Kosztem jest **odnowienie + chwila zobowiązania** (przygotowanie).

**Wymienność od pierwszego dnia (wymóg dla PROG i Balansu):** umiejętności projektujemy i kodujemy jako **wymienne w slotach**, choć w M1 gracz ich nie przestawia:
- Akcje wejścia `skill1..3` wskazują **slot**, nie konkretną umiejętność. Slot trzyma `skillId`, a definicja umiejętności (czasy, zasięgi, efekty, tagi) leży w `src/data/`.
- Żadna umiejętność nie zakłada konkretnego slotu ani obecności innej umiejętności. Synergie opierają się na **tagach statusów** (np. `Shock`, `Momentum`), nie na nazwach. Dzięki temu dron „×2 na Shock” zadziała z każdym przyszłym źródłem Shock.
- Odnowienia i biegłość są przypisane do umiejętności, nie do slotu (przełożenie nie resetuje biegłości).
- **Od M2:** wybór zestawu (więcej niż 3 umiejętności w puli, przekładanie między slotami w bazie) i rozbudowane synergie (drzewko w stylu PoE 2, plan produkcji).

Odblokowanie w pętli (trwałe, uczy po kolei, komunikat `M1_SKILL_UNLOCK`):
- sk1 **Dash**: od pierwszego wydruku,
- sk2 **Shock Pulse**: po pierwszym zapalonym fragmencie sieci (Prolog „First Light”, ~10–15 min gry),
- sk3 **Buddy Drone**: po pierwszym dotarciu na głębokość 2.

| | **sk1 Dash** (`M1_SKILL_01`) | **sk2 Shock Pulse** (`M1_SKILL_02`) | **sk3 Buddy Drone** (`M1_SKILL_03`) |
|---|---|---|---|
| Rola | unik / zmiana pozycji | obszar + **przerwanie zapowiedzi** | pomocnik + odciąganie uwagi |
| Efekt | przeskok o **do 3 pól** w kierunku joysticka (bez wejścia: `facing`). Liczony pole po polu, zatrzymuje się przed ścianą lub wrogiem, bez ścinania rogów. **Nietykalność 200 ms** od startu. **Bez przesunięcia o choćby 1 pole** (ściana albo wróg tuż obok): zdarzenie `skillFailed`, odnowienie się **nie zużywa**, Momentum się nie włącza. Przy ≥ 1 polu odnowienie się zużywa i włącza się Momentum. | wszyscy wrogowie w promieniu **2** (5×5, Czebyszew, linia wzroku) dostają **15–20** obrażeń i status **Shock 2 s**: przerwana bieżąca zapowiedź ciosu (wróg wraca do CHASE z pełnym odnowieniem ataku) i ruch wolniejszy o 50%: **krok ×2** (prosty i skos) dla kroków **rozpoczętych** w trakcie Shocku, liczony przez akumulator ułamków ticka (krok rozpoczęty przed Shockiem kończy się w starym czasie). | stawia drona na wolnym polu obok (preferencja: `facing`). Dron: **40 HP**, stoi, co **500 ms** strzela w najbliższego wroga w zasięgu **5** (linia wzroku) za **5–7**. Wrogowie w promieniu **4** od drona atakują drona zamiast gracza (prowokacja). Znika po **8 s** albo przy 0 HP. **Brak wolnego pola obok:** zdarzenie `skillFailed`, odnowienie się **nie zużywa**. |
| Przygotowanie | 0 ms (natychmiast) | 150 ms (blokuje ruch, jak atak) | 200 ms |
| Odnowienie | **4 s** | **8 s**, liczone **od wciśnięcia** (nie od końca przygotowania) | **18 s**, liczone **od wciśnięcia** |
| Synergia (tag) | daje **Momentum**: pierwszy cios podstawowy w ciągu 1,5 s po Dash zadaje **+50%** | daje **Shock** | strzały w cel z tagiem **Shock** zadają **×2** |
| Glif / efekt | ślad `·` na pokonanych polach przez 150 ms | rozbłysk **całego obszaru** 5×5 przez 150 ms (najpierw środek, potem krawędź; v0.5: poprawione „pierścień”, S9 z assetów) | dron **`¤`** w `#3DDC97` bold na tle `#1F3B57` (GRAF §9), przy obrażeniach tło miga na `#FF5FC8` |
| Sterowanie dotyk | tap sk1 (kierunek z joysticka w chwili tapu) | tap sk2 | tap sk3 |
| Bufor | 150 ms, jak ATK | 150 ms | 150 ms |

Liczby w kontekście Części 1:
- **Dash** (3 pola w 1 tick) vs zapowiedź 500 ms: unik z dowolnego pola zapowiedzi, także przy otoczeniu. Odnowienie 4 s ≈ 3,3 cyklu ataku wroga M0, więc Dash nie zastępuje zwykłego kroku, tylko ratuje w złej sytuacji.
- **Shock Pulse:** 17,5 śr. obrażeń na każdego w polu 5×5. Na grupę 3 Zbieraczy (3 × 30 HP na głęb. 1) to ~58% ich HP w jednym użyciu. Przerwanie zapowiedzi to jedyny sposób w M1, żeby „zbić” cios wroga, poza zejściem z pola.
- **Buddy Drone:** 6 śr. obrażeń co 0,5 s = 12 DPS × 8 s = **96 obrażeń** (do 192 na celach z Shock), plus tankowanie do 40 HP. Przy odnowieniu 18 s to ~5,3 DPS uśrednione: wyraźny, ale nie dominujący dodatek do 26 DPS ataku.

**Biegłość (trwała, wizja: „biegłość umiejętności”, `M1_SKILL_LEVELUP`):** każda umiejętność ma 3 poziomy. Poziom 2 po **40 użyciach**, poziom 3 po **150**, każdy poziom daje **−10% odnowienia** (Dash 4,0 → 3,6 → 3,2 s). Liczy się każde użycie, które trafiło lub uniknęło czegoś. Śmierć niczego tu nie cofa.

**Broń w M1:** atak podstawowy zależy od slotu broni. Dwie klasy:
- **wręcz** (Issue Pole, wartości z Części 1),
- **dystans** (Rail Pistol (R): zasięg 6, linia wzroku, trafienie natychmiastowe, przygotowanie 150 ms, odnowienie 450 ms, **8–11 obrażeń, czyli ~16,5 DPS**, ~63% DPS wręcz. Było 6–9 / ~12,5 DPS; zmiana za Balansem).

**Afiksy szybkości ataku i ruchu (Balans, potwierdzone przez PROG / Gameplay, osobny akumulator dla ataku i dla ruchu):** czasy akcji liczone z **akumulatorem ułamków ticka**. Czas akcji w danych jest w ms, a reszta z zaokrąglenia do ticka przechodzi na następną akcję. Dzięki temu np. −10% cyklu ataku (8 → 7,2 ticka) daje średnio 7,2 ticka zamiast skoku do 7 (−14%). Bez tego najmniejsza zmiana ruchu to −33% (3 → 2 ticki). Do implementacji razem z afiksami (`M1_AFFIX_02`, `M1_AFFIX_07`).

Cel zawsze automatyczny (Część 1, 1.16 pkt 3). Słabszy DPS broni dystansowej to cena bezpieczeństwa (Balans).

### 2.6 Bump attack w M1: krok w stronę wroga atakuje (decyzja GD)
Ruch (joystick, WASD/strzałki) w komórkę zajętą przez wroga **zamienia się w atak podstawowy** na tego wroga. Gracz nigdy nie wchodzi w pole wroga i nie przesuwa go.

Zasady (ten sam atak co ATK, te same liczniki z Części 1):
1. **Cel:** wróg w komórce, w którą gracz próbuje wejść. **Bump nadpisuje autocel:** atakuje *tego* wroga, nawet jeśli inny jest bliżej albo był celem przytrzymanego ATK. Przytrzymany ATK bez kierunku dalej używa autocelu (Część 1, 1.3). Gdy jednocześnie trzymany jest ATK i kierunek na wroga, wygrywa cel z bumpa.
2. **Gotowy atak** (`attackCooldown` = 0 i brak `attackWindup`): startuje zwykły atak (przygotowanie 100 ms, odnowienie 300 ms, obrażenia broni). `moveCooldown` się nie ustawia. `facing` = kierunek bumpa.
3. **Trwa odnowienie lub przygotowanie: brak ruchu i bufor.** Gracz stoi w miejscu (nie „ześlizguje się” obok wroga). Bump w ostatnich **150 ms** odnowienia trafia do tego samego bufora co ATK (`ATK_QUEUE_MS`) i wykonuje się, gdy odnowienie minie. Wcześniejszy bump jest ignorowany, ale **trzymanie kierunku na wroga = ciągły atak** w tempie broni (2,5/s Issue Pole), dokładnie jak przytrzymany ATK.
4. **Skos przez róg:** zablokowany jak ruch (Część 1, 1.2). Taki bump nie atakuje, tylko zmienia `facing`.
5. **Broń dystansowa:** bump strzela w sąsiedniego wroga (zasięg 6 obejmuje sąsiada). Ten sam licznik ataku.
6. **Nie atakuje:** własnego drona `¤` (blokuje jak ściana), zwłok `%` ani obiektów. Wróg w zapowiedzi jest normalnym celem.
7. **Uwaga dla gracza i QA:** trzymanie kierunku na wroga trzyma gracza w miejscu. Żeby uniknąć zapowiedzi, trzeba **zmienić kierunek** (krok z zamrożonego pola) albo użyć Dash. To świadomy koszt „leniwego” bicia (filar 3) i nagroda dla uważnego gracza (gra idealna bez strat zostaje, decyzja GD).
8. **Klawiatura:** `DIAG_GRACE` (50 ms) działa także dla bumpa po skosie. Bump liczy się jako wejście dla auto-pauzy D.

Efekt dla telefonu: walka wręcz jest możliwa samym joystickiem. ATK zostaje dla autocelu i broni dystansowej.

### 2.7 Śmierć w M1: pełna utrata, bez odzysku (decyzja GD)
**W chwili śmierci (jeden tick):**
1. **Przepada wszystko, co ryzykowne** (2.3): cały plecak, cały założony sprzęt poza Issue, kredyty ze strefy, aktywny kontrakt BASE (wraca na tablicę). **Nie ma losowego uszkodzenia** (20% z v0.2 usunięte jako zbędne) i **nie ma odzysku**. Podsumowanie sesji pokazuje `{items_lost}` i stratę w kredytach zgodną z ostatnim `AT RISK` (liczby zawsze prawdziwe).
2. W polu śmierci powstają **zwłoki `%`** (glif „twoje zwłoki” z GRAF: biały bold, tło jak aureola gracza). W M1 to **tylko znak**: nie mają inwentarza i gracz nie może do nich wrócić (opis `M2_NOTE_47_BODY` od M2, niżej). Widać je w 0,5 s zatrzymania i na ekranie śmierci (`M1_BASE_04`).
3. **Ekran śmierci i przyczyna (decyzja GD; Z6 z `graf/assety-m1.md`):**
   1. **Zatrzymanie 500 ms** (`PLAYER_DEATH_FREEZE_MS`). Zabójca jest podświetlony. Wygląd (GRAF S12, **zatwierdzone przez GD**): biała odwrócona komórka, **3 błyski po 100 ms** w 500 ms zatrzymania; przy „Reduce motion” **stałe odwrócenie** komórki przez 500 ms, bez błysków. Boss: wszystkie 6 komórek. Gdy zabójca zginął w tym samym ticku, podświetla się pole, z którego padł cios. **Gdy pole ciosu jest nieznane, nic się nie podświetla** (a linia `M1_DEATH_01` znika). Przypadki: `graf/assety-m1.md` v1.2, `fx_death_player.anchorRules` (`killerAlive` / `killerDiedSameTick` / `killerUnknown`).
   2. **Ekran śmierci:**
      - `M1_BASE_04`;
      - linia przyczyny **`M1_DEATH_01`** (nowy slot dla Lore, sens: „Killed by: {enemy_name}”);
      - **`M1_DEATH_02`** (sens: „Last hits: {hit_1} {hit_2} {hit_3}”): ostatnie 3 trafienia po pancerzu, z dziennika obrażeń, zawsze prawdziwe liczby.

      Przez **1500 ms** ekranu nie da się pominąć (`DEATH_SCREEN_MIN_MS`). Potem aktywny jest przycisk **NEXT** (**`M1_DEATH_BTN`**, decyzja GD): **tap albo Enter; Spacja (ATK) nie** działa, żeby trzymany atak nie przeskoczył ekranu. Bez naciśnięcia ekran **przechodzi dalej sam po 5000 ms** od startu (`DEATH_SCREEN_AUTO_MS`, decyzja GD; bez zgody GD nie usuwamy). **Auto-pauza zatrzymuje oba zegary** (1500 i 5000 ms); po wznowieniu liczą dalej od miejsca zatrzymania. Stały czas 3000 ms z M0 (`PLAYER_RESPAWN_MS`) w M1 nie obowiązuje.
   3. **Wydruk w bazie:** animacja 600 ms (GRAF; logika jest już w bazie), `M1_BASE_03`, Issue (2.3), pełne HP.
   4. Przy pierwszej śmierci z łupem: jednorazowe wyjaśnienie (2.7a).
   5. Podsumowanie sesji ze stopką `M1_BASE_14`. Podsumowanie także pokazuje przyczynę (`M1_DEATH_01`).
4. **Strefa nie jest zachowywana:** każda wyprawa w M1 dostaje **nowe ziarno** (także po śmierci). Nie ma zegara zwłok.

**Brak zwłok-dekoracji w M1 (decyzja Level Design, v0.4):** w następnych wyprawach M1 nie pojawiają się puste zwłoki Huntera 47, bo sugerowałyby odzysk, którego w M1 nie ma. Dekoracja wchodzi w M2 razem z Recovery Beacon. Fabuła się zgadza: ciało zostaje w strefie, a Zbieracze je rozbierają (`M1_ENEMY_03` „…bodies. It keeps the parts.”).

**Tekst opisu własnych zwłok `M2_NOTE_47_BODY`** (dawniej `M1_NOTE_47_BODY`; Lore przeniosło go do puli M2) jest zatwierdzony przez GD. W M1 gracz nie ma jak użyć USE na własnych zwłokach (zwłoki są widoczne tylko w chwili śmierci, każda wyprawa ma nowe ziarno, dekoracji brak). Tekst jest więc gotowy na M2: USE na zwłokach w trybie opisu (np. zwłoki już puste). Kod USE z trybem opisu istnieje od M1 (haki niżej).

**Haki w kodzie pod M2 (wymóg dla PROG):**
- **Encja zwłok** ma od M1 pole `inventory` (w M1 zawsze puste) i rekord w zapisie.
- **USE na zwłokach** ma od M1 dwa tryby za flagą `CORPSE_RECOVERY_ENABLED` (M1: `false`): tryb opisu (`M2_NOTE_47_BODY`, pauza) i tryb odzysku (M2, przytrzymanie USE).
- **Strzałka do zwłok** na brzegu ekranu: zaimplementowana i **wyłączona flagą** `CORPSE_ARROW_ENABLED` (M1: `false`).
- **Zachowanie strefy i zegar zwłok** (`zoneSeed`, `corpseTicksLeft`, sekcja M2): interfejsy i pola zapisu gotowe za flagą `ZONE_PERSIST_ENABLED` (M1: `false`, nowe ziarno po każdej wyprawie).

### 2.7a Zabezpieczenia informacyjne przed stratą (decyzja GD, QA R4)
Trudność się nie zmienia (Z-GD2). Gracz tylko **zawsze wie**, ile może stracić, zanim to straci. Trzy elementy:

| Element | Wyzwalacz | Treść (ID dla Dialogów i Lore) | Element UI (do uzgodnienia z UI i Menu) |
|---|---|---|---|
| **1. Potwierdzenie zejścia** | **wejście na pole** `>` (oraz na bramę areny bossa na głęb. 3), gdy `AT RISK` > 0 i ustawienie „Ask before going deeper” (`M1_RISK_SETTING`) jest włączone (**domyślnie ON**). Okno pojawia się w ticku wejścia, zanim nastąpi zejście. **Ponownie** dopiero po zejściu z pola i ponownym wejściu albo po USE na `>` (v0.5.2, QA R25) | **`M1_RISK_01`**: „Go deeper? You can lose {at_risk} cr.”. Pod spodem liczby bez tekstu: `HP {hp}/{max} · + {patches}`. Przyciski **`M1_RISK_01_YES`** „GO DOWN” i **`M1_RISK_01_NO`** „STAY”. Ustawienie: **`M1_RISK_SETTING`** „Ask before going deeper” (Lore §12.2). **Brama areny (decyzja GD, `teksty-m1-en.md` §12.2):** to samo okno z osobnym tekstem **`M1_RISK_01B`** „Fight the boss? You can lose {at_risk} cr.” i przyciskiem **`M1_RISK_01B_YES`** „GO IN”; STAY = `M1_RISK_01_NO`. Na głęb. 3 nie ma „deeper” ani „down” | okno modalne, **pauzuje grę** (jak każda pauza: zero ticków) i **zeruje trzymane wejścia** (kierunek, ATK). **Domyślny fokus = STAY.** Enter i Spacja działają na przycisk z fokusem; Esc = STAY. **Bezpośredniego skrótu GO DOWN nie ma** (QA R29); zmiana fokusu strzałkami / Tab, na dotyku tap w przycisk. Tak samo przy bramie areny. **STAY nie cofa gracza** (QA R25): gracz zostaje na polu `>` i nie schodzi, bez kosztu czasu. Wznowienie od razu, a przy wrogu w CHASE/ATTACK z odliczaniem 1,0 s (1.11). Stojąc na `>`, gracz walczy i używa umiejętności normalnie; zejście z pola i powrót albo USE na `>` = okno znowu. Przy wyłączonym ustawieniu albo `AT RISK` = 0 wejście na `>` od razu schodzi, a USE na `>` też schodzi. Przełącznik w ustawieniach |
| **2. Znacznik „can be lost”** | zawsze, dla każdego przedmiotu ryzykownego (2.3: założony sprzęt poza Issue, plecak). Przedmioty w skrytce bazy znacznika nie mają | **`M1_RISK_02`**: „Can be lost if you die.”. Issue: **`M1_RISK_03`**: „Issue gear. You never lose it.” | linia w tooltipie i mały znacznik na slocie w ekranie sprzętu i plecaka (wygląd: GRAF; jeśli GRAF wybierze tekst zamiast ikony, znacznik to `M1_RISK_02_TAG` „AT RISK”, opcjonalny wg Lore). Najważniejszy moment to przeniesienie przedmiotu ze skrytki na postać |
| **3. Jednorazowe wyjaśnienie** | **pierwsza śmierć**, w której `AT RISK` > 0. Flaga `riskExplainerSeen` w zapisie, raz na zapis | **`M1_RISK_04`** (**2 strony**, tekst zatwierdzony w `teksty-m1-en.md` §12.2; sens: strona 1 „co przepadło” z liczbami, strona 2 „co zostaje”) + liczby `{items_lost}` i `{cr_lost}`. **Sens zasady (wiążący dla Lore, odpowiedź UI M9):** przepada **plecak, założony sprzęt oprócz Issue i kredyty ze strefy**; zostają **skrytka, kredyty w bazie, ulepszenia, postęp sieci i rozwiązane terminale**. `M1_UI_DEATH_RULE` to alias tego samego tekstu (Lore). **Panel ma 2 strony** (podział `[[PAGE]]` w tekście): strona 1 (co przepadło + liczby) z przyciskiem **NEXT** (`M1_DEATH_BTN`), aktywnym dopiero po **1500 ms** (`RISK_EXPLAINER_PAGE_LOCK_MS`; QA R30: podwójny tap z ekranu śmierci jej nie przeskoczy), strona 2 (co zostaje) z przyciskiem **OK** (**`M1_RISK_04_OK`**), aktywnym po **500 ms**. Flaga `riskExplainerSeen` zapisuje się po OK | panel między wydrukiem a podsumowaniem, przycisk OK. Nie pauzuje świata, bo gracz jest w bazie |

Parametry: `RISK_CONFIRM_DESCENT_DEFAULT` = true, `RISK_EXPLAINER_ONCE` = true.

### 2.8 Zbieracz (Scrapper) w M1: tylko fabuła i wizual (decyzja GD)
- W M1 Zbieracz `s` to **zwykły wróg** (słaby, w grupach 2–4, 2.11). **Nie zabiera łupu gracza**, nie ma wyścigu, ucieczki do nory ani zwrotu po zabiciu.
- Fabularnie rozbiera ciała i wraki w strefie (wizualnie: wraki; zwłoki gracza jako dekoracja dopiero w M2).
- **Nory Zbieraczy w M1 (decyzja Level Design):** zwykłe miejsca startowe grup Zbieraczy **przy generowaniu poziomu** (bez dosyłania i bez odradzania w trakcie poziomu, 2.11), bez roli w odzysku. Rozmieszczenie wg `level-design-m1.md` §2 (2 / 3 / 3 na poziom, odstępy) może być używane już w M1. Zasada „najbliższa nora ≥ 20 pól od zwłok” dotyczy tylko M2.
- Mechanika rozgrabiania, komunikaty `M2_SYS_01`–`M2_SYS_03` i wygląd Zbieracza niosącego łup (GRAF §9) są w sekcji **M2 – Recovery Beacon**.

### 2.9 Ewakuacja (szyb windy serwisowej `<`)
- **Rozmieszczenie (Level Design, `level-design-m1.md`):** każdy poziom ma **dokładnie 1 szyb** `<` w odległości **25–40 / 30–50 / 35–55 pól** od wejścia (głęb. 1/2/3). **Zejście `>`:** 40–60 pól od wejścia (głęb. 1), 45–65 pól (głęb. 2). Na głęb. 3 zamiast `>` jest **brama areny bossa** 50–70 pól od wejścia. `>` i brama leżą **min. 20 pól od szybu**, żeby „zejść niżej” i „wracać” były różnymi kierunkami. Przy starcie poziomu nie ma wrogów w promieniu 10 pól od wejścia i od szybu. Na arenie bossa (ok. 28×14) po walce otwiera się dodatkowy szyb.
- **Przystanki windy = skrót (nie łagodzenie straty):** z bazy winda jedzie zawsze na głębokość 1. Przystanek na głęb. 2 i 3 odblokowuje **pierwszy rozwiązany terminal Power Lines na tej głębokości**. Gracz wybiera przystanek przy wyjeździe i wysiada przy szybie tego poziomu. **Gdy dostępny jest tylko jeden przystanek (głęb. 1), LIFT jedzie od razu, bez okna wyboru** (UI, v0.5.2). Zejście w dół tylko przez `>`. Przystanki skracają drogę do głębszych poziomów i umożliwiają krótkie kontrakty na głęb. 2–3 (2.4). W M1 nie łagodzą straty, bo strata jest pełna.
- **Procedura:**
  1. **Wezwanie: przytrzymanie USE** przy szybie (zasięg 1) przez **1,0 s** (R6, decyzja GD v0.5.2). To interakcja z czasem trwania, więc przytrzymanie (2.13, UI). **Przerywa je:** puszczenie USE, ruch, atak (także bump) i użycie umiejętności. **Obrażenia NIE przerywają wezwania** (`EVAC_CALL_INTERRUPT_ON_DAMAGE` = false; QA R31): przy 1,0 s przytrzymania i wrogu 200–250 ms/pole przerwanie przez obrażenia wymagałoby 3–4 pól przewagi nad goniącym wrogiem, czyli wezwanie pod presją byłoby praktycznie niemożliwe. Wróg dalej zadaje obrażenia, więc koszt zostaje. Po przerwaniu można zacząć od nowa od razu. **Ucieczka z wrogiem obok (QA R34, decyzja Mechanik):** wydanie 1–2 Med-Patchy, żeby wyjechać z łupem, to **zamierzony koszt**, a nie nadużycie. Ewakuacja ma być wyborem zasobów, a nie testem zręczności. **Próg korekty:** jeśli w QA A7 scen. 6 mediana kosztu ucieczki od 1 wroga na głęb. 2–3 wyjdzie **< 1 Med-Patch** (albo > 3 przy grupie 2–3 wrogów), wracamy do tematu. Pierwsza dźwignia to obrażenia wroga przy szybie, a nie flaga przerywania.
  2. **Dojazd windy** (gracz może się ruszać i walczyć): **5 / 7 / 9 s** na głęb. 1/2/3, odliczanie w HUD (`M1_UI_LIFT_COMING`). Wezwanie nie wywołuje alarmu.
  3. **Przyjazd i alarm (R6, decyzja GD v0.5.2):** w ticku przyjazdu wszyscy wrogowie w promieniu **12 pól** (BFS) dostają alarm i idą w stronę szybu (mapa statyczna do szybu, 2.10). Nad każdym ściągniętym wrogiem pojawia się **szary `!` ALERT** (300 ms, GRAF §9), a w pasku komunikat **`M1_SYS_05`** („The lift is loud. Enemies are coming.”). Wrogowie, którzy już gonią gracza, gonią dalej. Gracz czekający przy szybie wsiada w ≤ 1 s, a wróg z ≥ 10 pól potrzebuje ≥ 2–2,5 s, więc alarm karze tylko tego, kto odszedł od szybu w trakcie dojazdu.
  4. **Okno:** po przyjeździe winda czeka **10 s**. Komunikat **`M1_BASE_06`** („The lift is here…”) pokazuje się **w chwili przyjazdu** (decyzja GD), przed `M1_SYS_05` w kolejce. Wejście na pole `<` w tym czasie = natychmiastowa ewakuacja (świat znika, gracz bezpieczny).
  5. **Wsiadanie:** krok na pole `<` w czasie okna, bez przytrzymania i bez czasu wsiadania. Od ticku wejścia (faza gracza, przed ciosami wrogów) gracz jest **w kabinie**:
     - jest **nietykalny** i wypada z symulacji;
     - wrogowie tracą cel, a zapowiedzi zamrożone na jego poprzednim polu pudłują;
     - sterowanie jest wyłączone.
  6. **Odjazd (`LIFT_DEPART_MS` = 1000 ms):** animacja zamykania kabiny w świecie. Gracz pozostaje nietykalny, a świat jeszcze się rysuje. Auto-pauza w tym czasie tylko zamraża animację. Od wejścia do kabiny ewakuacji nie da się już przerwać.
  7. **Zjazd do bazy (`LIFT_RIDE_MS` = 2000 ms):** ekran przejścia z `M1_BASE_05`, który można pominąć tapnięciem po 500 ms. Potem baza i podsumowanie.
  8. **Brak wejścia:** `M1_BASE_07`, ponowne wezwanie możliwe po **5 s** (`EVAC_RECALL_COOLDOWN_S`, R6, decyzja GD v0.5.2). Koszt spóźnienia: 5 + 1 + 5–9 = **11–15 s**. Ponowny przyjazd znowu wywołuje alarm (tylko dla wrogów, którzy jeszcze go nie dostali albo wrócili do IDLE).
- **Kabina a wrogowie:**
  - pole `<` jest **zawsze nieprzechodnie dla wrogów** (ściana w flow field i dla AI), więc wróg nigdy nie stoi w kabinie i jej nie blokuje;
  - Buddy Drone nie może stanąć na `<`;
  - zamknięty `<` blokuje gracza jak ściana: krok zmienia tylko `facing`, a przytrzymanie USE wzywa windę;
  - **potwierdzone przez Level Design** (`level-design-m1.md` §4): `<` ma min. **2** przechodnie sąsiednie pola (cel **3**) i **nigdy nie stoi w korytarzu o szerokości 1**, bo jako pole nieprzechodnie dla wrogów i drona nie może przecinać łączności mapy. Walidacja łączności mapy odbywa się **po** wstawieniu `<`.
- **Wyjazd z bazy do strefy:** USE na windzie w bazie, potem `LIFT_RIDE_MS` = 2000 ms ekranu przejścia (jeśli generowanie poziomu trwa dłużej, ekran czeka). Gracz pojawia się na wejściu poziomu, bez nietykalności (strefa 10 pól bez wrogów z Level Design wystarcza).
- **Śmierć w trakcie dojazdu:** zwykła śmierć (2.7), wezwanie przepada.
- Po ewakuacji (`M1_BASE_05`): pełne HP, cały plecak i założony sprzęt są bezpieczne w bazie, kredyty ze strefy idą na konto, kontrakty BASE się rozliczają, podsumowanie sesji (`M1_BASE_13`).

**Czasy ewakuacji (przeliczone z odległościami Level Design, marsz 5,5–6 pól/s, bez walki):**
| | Głęb. 1 | Głęb. 2 | Głęb. 3 |
|---|---|---|---|
| Stojąc przy szybie: wezwanie + dojazd | **6 s** | **8 s** | **10 s** |
| Marsz wejście → szyb | 4–7 s (25–40 pól) | 5–9 s (30–50 pól) | 6–10 s (35–55 pól) |
| **Razem od wejścia na poziom** | **≈ 10–13 s** | **≈ 13–17 s** | **≈ 16–20 s** |
| Z najdalszego miejsca poziomu (ścieżka do ~90 / 100 / 110 pól, szacunek) | ≈ 21–22 s | ≈ 24–26 s | ≈ 28–30 s |

**Przejście poziomów (z nowymi odległościami LD):** sam marsz wejście → `>` to 7–11 s (głęb. 1) i 8–12 s (głęb. 2), a wejście → brama areny 9–13 s (głęb. 3). Najkrótsza droga przez całą strefę to 135–195 pól ≈ **23–35 s** czystego marszu. Realnie, z walką na trasie i bez eksploracji, wychodzi ~2–3 min na poziom, a z eksploracją 6–10 min (2.2 bez zmian).

**Ryzyko R6 (QA): wezwanie przy niskim HP. Wariant A zatwierdzony przez GD (v0.5.2), wpisany w procedurę wyżej i w 2.16.**

*Powód:* przy alarmie w chwili wezwania wróg ściągnięty z 10–12 pól dochodził przed przyjazdem windy, więc gracz wracający z niskim HP ginął za rozsądną decyzję „wracam” (szacunek dla głęb. 2: 17–70 HP straty na 1–2 wrogów). Wartości sprzed zmiany są w changelogu v0.5.2.

| Element (zatwierdzony) | Wartość | Efekt |
|---|---|---|
| Moment alarmu (`EVAC_ALERT_MOMENT`) | **`arrival`**, promień 12, `M1_SYS_05` w chwili przyjazdu | dodatkowa strata od alarmu na głęb. 2 przy 50% uników: **~0–18 HP** |
| Wezwanie (`EVAC_CALL_HOLD_MS`) | **1000 ms** (przerywa ruch, atak, umiejętność lub puszczenie USE; obrażenia NIE przerywają, `EVAC_CALL_INTERRUPT_ON_DAMAGE` = false, QA R31) | ekspozycja przy szybie 6 / 8 / 10 s |
| Ponowne wezwanie (`EVAC_RECALL_COOLDOWN_S`) | **5 s** | koszt spóźnienia 11–15 s |
| Informacja | `M1_SYS_05` + **szary `!` ALERT** nad wrogami ściągniętymi przy przyjeździe, odliczanie dojazdu w HUD | gracz widzi przyczynę (QA A6) |

Co zostaje: dojazd 5 / 7 / 9 s rosnący z głębokością (Z-GD2); wrogowie, którzy już gonią gracza, atakują w trakcie dojazdu (trzeba się najpierw oderwać, filar 1); pełna utrata bez zmian. Ewakuacja przestaje być pułapką za rozsądną decyzję, ale dalej kosztuje czas i wymaga przytomności. Odrzucone alternatywy B i C: changelog v0.5.2.

Do tego dochodzi obrona przed wrogami ściągniętymi alarmem: 0–2 wrogów × 4–6 s. **Powrót z głęb. 3 trwa więc realnie 20–45 s**, a z głęb. 1 10–25 s. Głębiej = dłuższa i groźniejsza droga do bezpieczeństwa, a to jest sedno decyzji „dalej czy wracać”.

### 2.10 AI wielu wrogów (rozszerzenie 1.6 na M1)
- **Mapa odległości (flow field), decyzja Silnika:** jedna wspólna mapa Dijkstry od komórki gracza (8 kierunków, wagi **3 prosto / 4 skos** = koszty ruchu w tickach, bez ścinania rogów, promień **30 pól**), liczona **tylko gdy gracz zmieni komórkę** (maks. ~6,7 razy/s). Wszyscy wrogowie w CHASE robią krok na sąsiednie wolne pole o najniższej wartości (przy remisie krok prosty). Jeśli wszystkie lepsze pola są zajęte, czekają 1 tick. Zastępuje BFS na wroga z M0.
- **Budzenie grupy (decyzja dla Gameplay, v0.5.2):** gdy wróg przechodzi w ALERT, budzą się (ALERT) tylko wrogowie **z tej samej grupy** z generatora, w promieniu **4 pól (Czebyszew)** od niego i **z linią wzroku** do niego (`ENEMY_GROUP_WAKE_RADIUS` = 4). **Bez łańcucha:** obudzony w ten sposób wróg nie budzi dalej. Wrogowie z innych grup reagują tylko na własne wykrycie gracza albo alarm windy.
- **Mapy statyczne** (liczone raz na poziom lub zdarzenie): do szybu (alarm windy). RETURN na spawn: BFS pojedynczego wroga, maks. 1 taki BFS na tick (rzadkie). Mapy do nor i do zwłok: dopiero M2.
- **Żetony ataku (czytelność zapowiedzi; ustalone z PROG / Gameplay, `walka-m0.md` §6 pkt 2):**
  - pula **na gracza: 2 zapowiedzi wręcz + 1 strzał wieżyczki** naraz, czyli na telefonie maks. 3 zapowiedzi jednocześnie;
  - **odstęp 150 ms między żetonami** tego samego celu (`ATTACK_TOKEN_STAGGER_MS`): kolejny żeton można wziąć najwcześniej 150 ms po poprzednim, więc ciosy nie padają w jednym ticku, a każdy ma własne `*` i liczbę obrażeń. Przy 2 wrogach wręcz i jednym kroku gracz nadal unika obu, bo oba zamrażają zwykle jego pole;
  - żeton jest pobierany przy starcie zapowiedzi i zwracany przy rozstrzygnięciu ciosu, śmierci wroga, przerwaniu (Shock) i wyjściu ze stanu ATTACK. Przydział jest deterministyczny: w kolejności aktualizacji AI, przy remisie wygrywa bliższy wróg, potem niższe id;
  - **nad każdym wrogiem w zapowiedzi świeci żółty `!`** (1.7), więc przy kilku wrogach widać, *kto* uderza. Pole celu wieżyczki ma inne tło niż pole celu wręcz (do GRAF/UI);
  - **wróg bez żetonu:** jeśli już stoi obok gracza, **czeka w miejscu** (nie cofa się). Jeśli nie, podchodzi najdalej na odległość 2 i tam czeka na żeton.
- **Prowokacja drona (sk3, ustalone z PROG / Gameplay, `walka-m0.md` §6 pkt 3):**
  - dron to zwykła encja (blokuje ruch, ma HP);
  - **osobna mapa odległości od drona, promień 6** (wagi 3/4, maks. 13×13 pól), **liczona raz przy postawieniu** (dron stoi, ściany w M1 się nie zmieniają) i usuwana, gdy dron zniknie. Wtedy wrogowie wracają na flow field gracza;
  - **wrogowie w promieniu 4 (Czebyszew) z linią wzroku do drona** idą po mapie drona i **celują w drona**: zapowiedź zamraża pole drona;
  - **osobna pula 2 żetonów dla drona** (wręcz i strzał łącznie, z tym samym odstępem 150 ms). Zapowiedzi na drona nie zużywają żetonów gracza i mu nie zagrażają.
- **Bump attack a kolejność w ticku (sprawdzone):**
  - bump jest rozstrzygany w fazie gracza **jako start ataku, przed krokiem**. Rozpoczęte przygotowanie blokuje `tryStep` w tym samym ticku, więc gracz nie „wchodzi” w wroga;
  - przy trwającym odnowieniu `tryStep` w pole wroga jest zablokowany zajętością pola: brak ruchu, bump trafia do bufora ATK (ostatnie 150 ms);
  - wróg widzi w fazie świata pole gracza po fazie gracza, a przy bumpie gracz stoi, więc zamrożone pole to jego bieżące pole;
  - trzymanie kierunku na wroga trzyma gracza w miejscu także w ticku ciosu (zgodnie z zasadą „bez kroku w ticku własnego ciosu”). Żeby uniknąć ciosu, trzeba zmienić kierunek albo użyć Dash. Dash startuje w fazie gracza przed AI, więc przeskok też mieści się w pełnym oknie zapowiedzi (min. 450 ms, 2.11);
  - wróg, który dopiero w fazie świata wejdzie w pole wskazywane przez joystick, zostanie zbumpowany w następnym ticku (≤ 50 ms opóźnienia). Bez konfliktu.

### 2.11 Strefa i głębokość: jedyne źródło trudności (Z-GD2)
**Zasada:** każdy parametr trudności to funkcja `(strefa, głębokość)` z tabeli danych. **Żaden** parametr nie zależy od liczby śmierci, liczby wydruków, czasu gry ani wyników gracza. Nie ma dynamicznej trudności w żadną stronę. Test akceptacyjny (2.17) to sprawdza.

| Parametr (Sector 1) | Głęb. 1 Outskirts | Głęb. 2 Solar Fields | Głęb. 3 Rail Depot |
|---|---|---|---|
| Mnożnik HP wrogów (Balans) | ×1,0 | ×1,5 | ×2,2 |
| Mnożnik obrażeń wrogów (Balans) | ×1,0 | ×1,25 | ×1,5 |
| Liczba wrogów na poziom | 8–10 | 12–14 | 14–16 (+ boss) |
| Skład | d, s, h | d, s, h, t | d, s, h, t, grupy mieszane |
| Szyb od wejścia (LD) | 25–40 pól | 30–50 pól | 35–55 pól |
| Zejście `>` / brama areny od wejścia (LD) | 40–60 pól | 45–65 pól | brama 50–70 pól |
| Typowy pancerz gracza ze sprzętu tej głęb. (Balans) | 0–8 (DR 0–7%) | ~21 (DR 17%) | ~30 (DR 23%) |
| Dojazd windy | 5 s | 7 s | 9 s |
| Rzadkość łupu 1 / 2 / 3 (R) | 80 / 18 / 2% | 65 / 30 / 5% | 50 / 38 / 12% |
| Poziom przedmiotu | 1 | 2 | 3 |
| Rozmiar poziomu (LD) | 64×40 | 72×44 | 80×48 + arena ok. 28×14 |
| Pola przechodnie (LD) | 40–50% | 40–50% | 40–50% |
| Skrzynie `■` | 3 | 4 | 4 |

- **Reguła zapowiedzi (zatwierdzona przez GD, test QA A4):** zapowiedź każdego ciosu wroga − 1 tick ≥ 400 ms, czyli **min. 450 ms (9 ticków)** (1.14, `ENEMY_WINDUP_MIN_MS`). Dotyczy też dronów przywołanych przez bossa. **Zapowiedzi nie skracają się z głębokością.**
  - Uzasadnienie: okno reakcji = 450 ms − maks. 50 ms opóźnienia wejścia = **400 ms**. Krok zmienia pozycję od razu na starcie (1.2), więc gracz potrzebuje tylko czasu reakcji (250–300 ms) i ewentualnie zmiany sektora joysticka (+50–100 ms). Zostaje zapas 0–100 ms.
  - Najgorszy przypadek: start zapowiedzi w trakcie własnego przygotowania ciosu (100 ms bez ruchu). Wtedy zostaje 300 ms, co dalej wystarcza na sam refleks. Na to jest też Dash.
- **W M1 wrogowie nie odradzają się w trakcie poziomu (decyzja GD, Z5 z `graf/assety-m1.md`).**
  - Liczba wrogów na poziomie jest stała: pula z generatora (8–10 / 12–14 / 14–16) + grupy kontraktów.
  - Nie ma dosyłania ani posiłków. Alarm windy przyciąga tylko istniejących wrogów. Wrak `%` zostaje do końca poziomu.
  - Nowi wrogowie są dopiero na nowym poziomie (każda wyprawa i każde zejście `>` to nowe ziarno).
- **Obrażenia w M1 zadają tylko wrogowie i boss** (także drony z przywołania i strzały Line Sentry). **Ciecz `~` w M1 to dekoracja: nie zadaje obrażeń** i nie ma innego efektu (decyzja Mechanik v0.5.2; GD może ją zmienić). Wybuchów i pułapek w M1 nie ma. Dlatego `M1_DEATH_01_HAZ` nie wchodzi do M1, a `sourceKind` = `hazard` w logu obrażeń zostaje zarezerwowany i nieużywany.
  - **Wpływ:**
    - Clear the Path: 6 wrogów kontraktu to skończona grupa, więc kontrakt da się zawsze domknąć;
    - ekonomia: łup na poziom jest skończony, jak w modelu Balansu (łup ÷ ~8 min); limity kr/min **20 / 48 / 90** liczone na cykl baza → baza (Balans v1.1, 2.4);
    - farmienie: kolejna wyprawa windą, a nie czekanie na odrodzenie;
    - wyczyszczony poziom jest bezpieczny, więc powrót z niego to nagroda za walkę. Trudność rośnie przez HP, obrażenia, liczbę, skład i dłuższą drogę powrotu (szyb dalej, winda dłużej jedzie).

**Wrogowie M1, wartości robocze dla głęb. 1** (role i litery z GRAF, nazwy z `M1_ENEMY_01`–`M1_ENEMY_04`, `M1_BOSS_01`; liczby po przeglądzie Balansu):
| Glif | Nazwa | Rola | HP | Obrażenia | Zapowiedź / odnowienie | Ruch prosto | Zachowanie |
|---|---|---|---|---|---|---|---|
| `d` | Panel Drone | szybki, wręcz, w parach | 40 | 8–12 | **450 / 600 ms** (v0.5: było 400, reguła GD) | **200 ms**, skos **300 ms** (było 150; reguła 1.14: wróg wolniejszy od gracza) | jak AI z 1.6, wykrycie 8 |
| `h` | Curfew Guard | ciężki, wręcz | 120 | 14–20 | 600 / 900 ms | 250 ms, skos **400 ms** | szablon M0 (Scrap Crawler z Części 1 → w M1 Curfew Guard), wolny, wytrzymały |
| `s` | Scrapper | słaby, w grupach 2–4 | 30 | 4–6 | **450 / 600 ms** (v0.5: było 400) | 200 ms, skos **300 ms** | zwykły wróg przy wrakach i norach. W M1 **nie** zabiera łupu (2.8) |
| `t` | Line Sentry | wieżyczka, dystans 6, nieruchoma | 70 | 10–15 | 700 / 1500 ms | — | zamraża pole celu jak w 1.6, strzał w to pole, wymaga linii wzroku |
| 3×2 | Rail Guardian (boss) | arena ok. 28×14, 2 tory (LD), głęb. 3 | **2400** (Balans) | **20–32** (Balans), **bez mnożnika głębokości** | zamach **800 / 1200 ms** (Balans); szarża **co 4. atak**, zapowiedź = podświetlenie całego toru **900 ms** (boss najpierw wchodzi na najbliższy tor) | 300 ms; szarża **2 ticki na pole** | 3 ataki: (1) zamach 3×3 przed sobą; (2) szarża wzdłuż toru; (3) przy 50% HP jednorazowo przywołuje 2 Panel Drone. Szczegóły szarży i przywołania niżej. Wejście: `M1_BOSS_INTRO`. **Cel walki: 60–90 s (decyzja GD).** |

**Kontrola czasu walk (przeliczone w v0.4, symulacja 20 000 walk co do ticka na wrogo).** Mnożniki ×1/1,5/2,2 HP i ×1/1,25/1,5 obrażeń, typowy pancerz 0 / 21 / 30 (DR 0 / 17,4 / 23,1%), unik jako niezależny rzut na cios:

| Curfew Guard | HP | DPS gracza | Czas walki | Strata HP bez uników | Strata HP przy 50% uników |
|---|---|---|---|---|---|
| głęb. 1 (Issue) | 120 | 26 | **4,5 s** | 51 | 26 |
| głęb. 2, sprzęt z głęb. 2 | 180 | 35 | **5,1 s** | 59 | 29 |
| głęb. 2, sprzęt z głęb. 1 | 180 | 30 | 5,9 s | 68 | 34 |
| głęb. 3, sprzęt z głęb. 3 | 264 | 48 | **5,5 s** | 74 | 37 |
| głęb. 3, sprzęt z głęb. 2 | 264 | 40 | 6,5 s | 82 | 41 |

W v0.3 było 4,6 / 5,5 / 6,0 s i 51 / 79 / 122 HP bez uników (bez pancerza, mnożniki ×1,6 / 2,4 i ×1,3 / 1,6). Czas walki rośnie teraz łagodnie (+22% od głęb. 1 do 3), a obrażenia na walkę o ~45% (z pancerzem), a nie ×2,4.

- **Boss (Balans v1.1, model zdarzeniowy `boss_v05.py` z szarżą 2 ticki na pole, przywołaniem 600 ms, dronami 450 ms i aktywacją 500 ms):** `BOSS_HP` = **2400 zostaje**. Mediana wygranych walk: **86 s przy 35 DPS**, **68 s przy 48 DPS** (typowy sprzęt głęb. 3, cel 65–75 s), **46 s przy 72 DPS** (pułap M1). Nasz szacunek z v0.5 (58–64 s) był za niski. Wyprawa „na bossa” (48 DPS, 50% uników): 53% sukcesu. **Pomiar QA (D7, v0.4 planu testów):** 38 DPS → 79 s, **48 DPS → 68 s** (przy udziale bicia 0,7: 62 s), 58 DPS → 57 s, 72 DPS → 46 s. **Reguła strojenia (QA R32):** decyzja o **2600 HP** zapada **tylko wtedy, gdy zmierzona mediana < 65 s w paśmie 44–52 DPS, przy zmierzonym udziale bicia** (nie przy założonym 0,6) (2600 HP: 71 s przy 48 DPS, wyprawa „na bossa” 53% → 44%). Pomiar: QA D7. Przy 72 DPS walka spada poniżej 60 s: to nagroda za najlepszy build (pułap DPS zaakceptowany przez GD).

**Rail Guardian: szarża (Z12 z `graf/assety-m1.md`):**
- **Prędkość: 2 ticki na pole (100 ms/pole, 10 pól/s)**, `BOSS_CHARGE_TICKS_PER_CELL` = 2. Tor ~28 pól boss przejeżdża w maks. **2,8 s**. GRAF przyjęło 1 tick na pole (20 pól/s, 1,4 s), czego **nie przyjmujemy**, bo:
  1. przy 20 pól/s bryła na ekranie „teleportuje się” (3 klatki 60 FPS na pole), więc ruch jest nieczytelny na telefonie;
  2. 10 pól/s to nadal 1,5× szybciej niż gracz (6,7 pola/s), więc ucieczka wzdłuż toru się nie udaje i trzeba zejść w bok (o to chodzi w ataku);
  3. gracz, który został w pasie daleko od bossa, ma drugą szansę (np. 15 pól = 1,5 s), ale nie ma jej gracz stojący tuż przy bossie.
- **Pas szarży** = **2 rzędy toru** (wysokość bryły 3×2), od bossa do ściany na końcu toru w kierunku szarży. Szarża jest zawsze pozioma, więc wariant pionowy (3 pola) nie istnieje. **Zapowiedź = podświetlenie całego toru** przez `BOSS_CHARGE_WINDUP_MS` = **900 ms** (reguła GD ≥ 450 ms spełniona z zapasem), liczone **od chwili, gdy boss stanie na torze**. Pas świeci przez całą zapowiedź i przez cały przejazd, aż boss się zatrzyma. **Świeci stale, bez migania** (stałe `x`; GRAF S14 przyjęte w v0.5.2, ochrona osób wrażliwych na błyski). Pola już przejechane wypadają z pasa.
- **Uczciwość uniku (przeliczone w v0.5.2 dla szarży poziomej):** unik = **zejście z rzędów toru**, czyli krok w pionie. Z rzędu brzegowego wystarczy **1 krok** (150 ms); gdy po tej stronie jest ściana albo przeszkoda, **2 kroki** przez drugi rząd (300 ms). Czas: reakcja 250–300 ms + opóźnienie wejścia 50 ms + 150–300 ms = **maks. ~650 ms < 900 ms zapowiedzi**, zapas ≥ 250 ms. Do tego gracz widzi wcześniej, że boss idzie na tor (ruch bez ataku), więc realny czas na decyzję jest dłuższy. Zapowiedź − tick = 850 ms ≥ 400 ms. **Prędkość zostaje: 2 ticki na pole.**
- **Trafienie:** gracz dostaje obrażenia **raz**, gdy bryła wjedzie na jego pole (obrażenia jak zamach, 20–32, bez odrzutu). Wejście w zaznaczony pas w trakcie przejazdu to błąd gracza (pas widać).
- Po uderzeniu w ścianę na końcu toru: 2 s ogłuszenia i odsłonięty słaby punkt `R` z obrażeniami ×2 (bez zmian).
- **Kierunek i wejście na tor (decyzja GD, `level-m1.md` §10 pkt 2; zastępuje wersję Mechanik z v0.5.2):**
  1. Przy 4. ataku boss **idzie na najbliższy tor `=`** (BFS, swoim zwykłym krokiem 300 ms/pole; przy remisie odległości tor bliżej gracza). W tym czasie **nie atakuje** i **nie da się tego przerwać** (Shock Pulse i ciosy nie przerywają, obrażenia wchodzą normalnie). Jeśli już stoi na torze, ten krok odpada. `BOSS_CHARGE_SEEK_TRACK` = true.
  2. Gdy boss stanie na torze, zaczyna się zapowiedź 900 ms (podświetlenie całego toru).
  3. Szarża jest **zawsze pozioma, wzdłuż toru, w stronę kolumny gracza** (znak różnicy kolumn); **przy remisie w stronę dalszej ściany**.
- **Wycofanie przez bramę areny (zatwierdzone przez GD, `level-m1.md` §10 pkt 1):** brama **nie zamyka się** na czas walki. Gdy gracz wyjdzie z areny, boss wraca na start z **pełnym HP**, a przywołane drony znikają (przywołanie znów dostępne). Powrót do areny pokazuje ponownie `M1_RISK_01B`.

**Rail Guardian: przywołanie 2 Panel Drone (Z13):**
- **Wyzwalacz:** pierwszy tick, w którym HP bossa ≤ 50%, **po rozstrzygnięciu bieżącego ataku** (rozpoczęty zamach albo szarża się kończy). Przywołanie jest jednorazowe.
- **Animacja: 600 ms (12 ticków)** `|R|` (`BOSS_SUMMON_MS`, wartość GRAF przyjęta). To nie jest cios, więc nad bossem nie ma `!`.
- **Boss w tym czasie stoi i jest podatny na ciosy** (zwykłe obrażenia, bez nietykalności i bez słabego punktu ×2). Ciosy i Shock Pulse nie przerywają przywołania. To nagroda za agresję w krótkim oknie.
- **Drony:** pojawiają się na końcu animacji na 2 wolnych polach w promieniu 3 od bossa, **min. 4 pola (BFS) od gracza**, nie na pasie toru. Mają statystyki z mnożnikami głęb. 3 (HP 88, obrażenia 12–18), **nie upuszczają łupu** i się nie odradzają.
- **Aktywacja 500 ms** (`SUMMON_ACTIVATE_MS`): przez ten czas drony stoją, z szarym `!` ALERT przez 300 ms. Potem idą normalnie za AI (CHASE).
- **Pierwszy cios drona** może paść najwcześniej po 600 + 500 ms + dojście (≥ 4 pola × 200 ms) + **zapowiedź 450 ms (9 ticków)**, czyli ≥ 2,35 s od startu przywołania. Reguła ≥ 450 ms obowiązuje także je.
- **Żetony:** boss zajmuje **1 z 2 żetonów wręcz** gracza, kiedy atakuje. Przy ataku bossa naraz zapowiada więc najwyżej 1 dron. Obowiązuje odstęp 150 ms między żetonami.

**Pancerz (model Balansu, przyjęty):**
- **Pancerz w M1 ma tylko gracz** (wrogowie i boss nie mają pancerza; potwierdzone z PROG / Gameplay).
- **Kolejność liczenia obrażeń (decyzja dla Gameplay, v0.5.2):** rzut obrażeń → krytyk ×1,5 → Momentum ×1,5 (pierwszy cios po Dash, 2.5) → × mnożnik głębokości (**tylko ciosy wrogów**) → **jedno `round`** → pancerz `floor(dmg × (1 − min(0,6; A/(A+100))))`, **min. 1**. Do `round` wartość jest ułamkowa (bez pośrednich zaokrągleń).
- **DR = A / (A + 100)**, limit **60%**, obrażenia po redukcji zaokrąglane w dół, **min. 1**. Pancerz działa tak samo na każdy cios (także bossa) i nie zastępuje uników.
- **Źródła:**
  - przedmiot Armor ma pancerz bazowy wg poziomu przedmiotu: **6–10 / 13–19 / 20–28**;
  - afiks `M1_AFFIX_05` (Plated / of Steel) daje **+2–4 / +4–7 / +7–10** (r1/r2/r3) na slotach Armor i Module;
  - Issue Suit = 0.
- Typowe wartości: 8 / 21 / 30 (DR 7 / 17 / 23%). Maksimum w M1 ~48 (DR 32%).
- HUD i tooltip pokazują DR jako „−23%”.

### 2.12 Łup: kategorie, plecak, udźwig
Glify i kolory według `graf/styl-ascii.md` §4 i §9 (v1.1).
| Kategoria | Glif (GRAF) | Podnoszenie | Miejsce | Uwagi |
|---|---|---|---|---|
| Kredyty Sieci w strefie | `$` `#3DDC97` | automatycznie po wejściu na pole | konto „w drodze” (ryzykowane) | rzadkie, 5–20 kr (R) |
| Materiały: **Scrap**, **Copper** | **`:`** `#B08850` bold (wspólny znak, rodzaj w komunikacie i plecaku) | automatycznie | plecak, stos **20 / slot** | Scrap 2–4 z każdego wroga, Copper 1–3 ze skrzyń i z głęb. 2+ |
| Sprzęt (broń `/`, pancerz `[`, moduł `"`, narzędzie `(`) | kształt = slot, kolor = rzadkość | **USE** (tap) | plecak, 1 / slot | 3 rzadkości (`M1_RARITY_1–3`), ~12 właściwości (Balans) |
| Med-Patch (`M1_GEAR_MEDPATCH`) | **`+`** `#3DDC97` bold (na ziemi i w HUD) | automatycznie (gdy jest miejsce w limicie) | plecak, stos **6 / slot**, **maks. 6 sztuk** (decyzja GD) | jedyne leczenie w strefie (2.13). **Niesprzedawalny** (0 kr) |
| Przedmioty kontraktów (`M1_GEAR_DATACORE`) | **`§`** `#FFE14D` bold, tło `#3A3410` | USE | plecak, 1 / slot | ryzykowane jak łup |
| Notatki, zapiski, terminale `&`, opis zwłok `%` | wg GRAF | USE → okno tekstu (pauza) | nie zajmują miejsca | przeczytane = trwałe |

- Drzwi zamknięte to teraz **`Π`** (otwarte `'`), bo `+` przeszedł na Med-Patch (GRAF §9).
- **Plecak: 12 slotów** (założone 4 sloty sprzętu się nie liczą). Pełny plecak blokuje podnoszenie (`M1_SYS_06`). Upuszczony przedmiot leży do końca wyprawy (w M1 nikt go nie zabiera; przy wyjściu z poziomu przepada).
- **Skrytka w bazie: `{STASH_SLOTS}` slotów** (30 / 40 / 50 / 60 dla L0 / Lights I / II / III, Balans v1.2, 2.15). Exchange kupuje wszystko poza Issue i Med-Patchami (exploit „śmierć = darmowe patche na sprzedaż” zamknięty, Balans).
- **Sprzedaż sprzętu w automacie (decyzja GD, v0.5.2; Balans §4):** Exchange ma **półkę 3 przedmiotów** (4 od Lights II, 2.15) rzadkości r1/r2, poziom przedmiotu = najgłębszy odblokowany przystanek windy, cena **×4 ceny sprzedaży** (`SHOP_GEAR_PRICE_MULT`). Slot 1 półki ma 10% szans na r3 za ×5 (20% od Lights III). Półka losuje się na nowo **po każdej wyprawie** (powrót windą albo śmierć), nie z czasem rzeczywistym. Kupiony przedmiot trafia do skrytki i jest bezpieczny, dopóki gracz go nie założy (potem „can be lost”, 2.7a). Skutki: ujście kredytów i szybsza odbudowa po śmierci; półka nie zależy od liczby śmierci (Z-GD2). Pozostałe ujścia z Balansu §7 (płatne odświeżenie, kalibracja) czekają na GD i nie są częścią tej specyfikacji.
- **Dlaczego 12 slotów (symulacja 20 000 poziomów):**
  - na poziom średnio **6,3 przedmiotu + 27 Scrap** (głęb. 1), **8,6 + 39** (głęb. 2), **9,0 + 45** (głęb. 3) przy zrzucie ~20% z wroga i 1–2 przedmiotach ze skrzyni;
  - po głęb. 1 plecak jest zajęty w ~9/12 slotów (6 przedmiotów, 2 sloty Scrap, Med-Patche);
  - **plecak zapełnia się w połowie głęb. 2**, przy `AT RISK` ≈ 400–600 kr (2.1), czyli tam, gdzie gracz ma zdecydować „dalej czy wracać”;
  - pełna wyprawa to ~24 przedmioty, więc bez powrotu nie da się zabrać wszystkiego.
- **Wartości sprzedaży (R):** Scrap 2 kr, Copper 5 kr. Sprzęt rzadkości 1/2/3: 10 / 40 / 150 kr × (1 + 0,5 × (poziom − 1)). Szacunek dochodu:

  | Źródło | Dochód (R) |
  |---|---|
  | wyprawa na głęb. 1 (~8 min) | ≈ **150–190 kr** (~20 kr/min) |
  | kontrakt BASE | Relay 35 kr (+ fragment) / Data Core 40 kr + 3 Cu / Clear the Path: patch, 25 kr + patch, 40 kr + patch (głęb. 1/2/3) na ~2–3 min cyklu baza → baza, **zawsze ≤ kr/min wyprawy na tej głębokości** (20 / 48 / 90, zasada GD, 2.4) |
  | kontrakt Exchange | premia +20 kr (Deliver) albo +50 / +100 kr (Sell) |
  | głęb. 2–3 | wyraźnie więcej, ale z pełnym ryzykiem |

  Do Balansu.

### 2.13 Leczenie bez regeneracji (zaakceptowane przez GD)
- **W M1 nie ma regeneracji HP** (parametr M0 `PLAYER_REGEN_PER_S` = 0). Leczenie tylko:
  1. **Med-Patch** (`M1_GEAR_MEDPATCH`):
     - **+40 HP** w ciągu 2 s (20 HP/s, można się ruszać i atakować);
     - użycie natychmiastowe, odnowienie **4 s**;
     - **maks. 6 sztuk** w plecaku (decyzja GD, było 5);
     - cena **25 kr**, **nie da się go sprzedać**;
     - wypada też ze skrzyń (~30%, czyli ~0,9 / 1,2 / 1,2 patcha na poziom) i za kontrakt Clear the Path.
  2. **Baza:** pełne HP przy każdym powrocie i wydruku.
  3. **Issue:** uzupełnienie do `{ISSUE_MEDPATCH_TOPUP}` sztuk (**2, od Lights I 3**, decyzja GD, 2.15) **przy każdym wyjeździe windą** (2.3).
- **Sterowanie Med-Patch (ustalenie z UI):**
  - na dotyku stały mały przycisk **`[+]` nad slotami umiejętności z licznikiem sztuk**;
  - na klawiaturze **Q**;
  - przy 0 sztuk przycisk jest przygaszony.

  **Przytrzymanie USE służy wyłącznie interakcjom z czasem trwania** (w M1: wezwanie windy 1,0 s; w M2 także odzysk zwłok). Tap USE bez obiektu w zasięgu nic nie robi.
- **`M1_AFFIX_06` = „+% leczenia z Med-Patchy”** (Patched / of Repair; było „regeneracja”):
  - zakresy **+10–15% / +16–25% / +26–35%** (r1/r2/r3);
  - maks. 1 taki afiks na przedmiot, tylko na slotach **Armor i Module**, **łącznie maks. +60%**;
  - zwiększa ilość leczenia przy tym samym czasie 2 s i działa też na patche Issue;
  - przy limicie patch leczy 64 HP (0,39 kr/HP zamiast 0,625).
- **Uzasadnienie:** HP staje się zasobem wyprawy. Liczba Med-Patchy + HP + `AT RISK` = decyzja „dalej czy wracać” (filar 1). Regeneracja zrobiłaby z każdej przerwy pełne leczenie.

**Budżet HP (v0.5, symulacja grupowa Balansu, `balans-m1-review.md` §6.6).**

Model grupowy: 2 żetony wręcz + 1 strzelec, patche w walce i między walkami, limit 6, leczenie 40, DPS 26 / 35 / 48, DR 7 / 17 / 23%, boss 2400 HP, 20–32, 800 / 1200 ms. Strata na poziom przy 50% uników: **82 / 188 / 285 HP** (głęb. 1/2/3; Balans v1.1 z zapowiedziami 450 ms u `d` i `s`, `poziomy_grupy.py`). Model 1v1 z v0.4 (79 / 169 / 254) to dolna granica.

| Scenariusz (szansa sukcesu) | 50% uników | 60% | 70% | 80% |
|---|---|---|---|---|
| Głęb. 3 z przystanku, bez bossa (budżet ~388 HP, zapas ~100 HP) | **94%** | — | 100% | 100% |
| Głęb. 3 + boss w jednej wyprawie z przystanku | 7% | 44% | 92% | 100% |
| **Wyprawa „na bossa”** (przystanek głęb. 3 → ~3 spotkania → boss) | **53%** (v1.1, `boss_v05.py`; v0.5: 47%) | 87% | 100% | — |
| Pełna 1→3 + boss bez powrotu | 0% | 3% | 47% | 96% |
| j.w., build „długiej wyprawy” (+60% leczenia, DR ~30%) | 6% | 45% | 91% | 100% |

- **Normalna ścieżka (decyzja GD):** przystanki windy. Poziom głęb. 3 w jednej wyprawie, boss w osobnej („na bossa”, przeciętny gracz wygrywa w ~2 podejściach).
- **Pełna wyprawa 1→3 + boss bez powrotu: możliwa, ale trudna.** Wychodzi przy **~75–80% uników** albo przy **~70% razem z buildem** (+60% leczenia i DR ~30%). Przy 70% bez buildu sukces to ~47%, a przy samym buildzie (50% uników) ~6%.
- Budżet z v0.4 (472 HP) zakładał, że da się podnieść wszystkie patche ze skrzyń. Przy limicie 6 część przepada, więc realny budżet jest ~5–10% niższy (Balans).
- **Spójność ze zmianami v0.5 (przeliczone przez Balans v1.1):** zapowiedź 450 ms u `d` i `s` (surowy DPS −5%) daje 82 / 188 / 285 HP na poziom, czyli w granicach szumu względem v0.5 (dłuższa zapowiedź działa głównie przez wyższy realny % uników, do pomiaru w QA). Boss z szarżą 2 ticki na pole, przywołaniem i 1 żetonem: wyprawa „na bossa” 53%. Wnioski się nie zmieniają.

Wniosek: pełny przelot bez powrotu to wyzwanie dla dobrego gracza albo nagroda za build „długiej wyprawy” (afiks leczenia + pancerz), zgodnie z filarami 1–2.

### 2.14 Pauza w M1: teksty, terminale, ekwipunek (zaakceptowane przez GD, Z-GD3)
| Okno | Pauzuje świat? | Wznowienie |
|---|---|---|
| **Notatka / zapisek / opis zwłok** (USE) | **TAK, zawsze** (Z-GD3), także w walce | od razu, **chyba że** jakiś wróg jest w stanie CHASE/ATTACK: wtedy odliczanie 1,0 s jak w 1.11 |
| **Terminal (zagadka)** | **TAK** | Otwarcie możliwe tylko, gdy **żaden wróg nie jest w CHASE/ATTACK**. W przeciwnym razie komunikat **`M1_SYS_04`** („Enemies nearby. Fight first.”; tylko terminal). Po zamknięciu wznowienie od razu. Auto-pauza w terminalu: 2.14a (M10). Zagadka ma być myśleniem, nie stresem (filary 3–4). |
| **Ekwipunek / plecak w strefie** | poza walką TAK. W walce **NIE** (świat działa, mapa przyciemniona) | Zarządzanie łupem w walce kosztuje czas. Poza walką gracz może spokojnie układać plecak. |
| Mapa sektora | jak ekwipunek | |
| Menu pauzy / auto-pauza | TAK | 1.11 (odliczanie 1,0 s, Spacja nie wznawia) |
| **Okno potwierdzenia przy `>` / bramie areny** | **TAK**, zeruje trzymane wejścia | STAY: od razu, a przy wrogu w CHASE/ATTACK odliczanie 1,0 s; gracz zostaje na `>` (2.7a) |
| **Baza** | nie dotyczy: menu-hub bez ticków (2.14a) | — |

### 2.14a Odpowiedzi dla UI i Menu (v0.5.2; `prog/ui-m1.md` §5, §7, §9 „DESIGN / Mechaniki”)
Decyzje wiążące dla specyfikacji. Część była już wysłana do UI (oznaczone [wysłane]), resztę rozstrzygają Mechaniki.

**Terminal Power Lines [wysłane]:**
- układ **2-kolumnowy** (układ B z pomiaru UI): lewa kolumna to **sama siatka 272 px** (9 × 28 px + 2 × 10 px marginesu), prawa to **panel 288 px** z nagłówkiem, kontekstem, komunikatem, SEND, `?`, **RESET i EXIT** (przyciski panelu, każdy **≥ 48 px**);
- klikalne są tylko przełączniki (pole 48×48, wygrywa najbliższy punktowi dotyku), SEND, `?`, RESET, EXIT (M11);
- odbiorniki oznaczone **literami od A**: litera jest **w komórce na siatce** (wygląd ustala GRAF) **i w panelu**. Panel pokazuje listę `x/y` wszystkich odbiorników **na bieżąco** (np. `A 4/2 · B 1/2`). **Bez dymka** po tapnięciu odbiornika (M12). **Maks. 4 odbiorniki na wariant** (litery A–D; `POWER_LINES_MAX_RECEIVERS` = 4), bo podpowiedź TIP potrzebuje ≥ 90 znaków w panelu;
- dane wariantu: przy każdym odbiorniku pole JSON **`consumer_type`** (w obiekcie odbiornika na liście `consumers[]`, np. `{"id":"A","at":[2,2],"need":3,"consumer_type":"mid"}`) o wartości `"end"` albo `"mid"` (decyzja UI). **`"mid"` występuje dopiero od głęb. 3** (reguły wchodzą stopniowo z głębokością). Znaczenie i zachowanie obu typów opisuje `zagadki-m1/` (LUZ / Pracownik 1); Mechaniki ustalają tylko pole i próg głębokości;
- komórka 28 px, awaryjnie 26 px; **poniżej ok. 256 px** wysokości użytecznego widoku komunikat „obróć telefon” (`M1_UI_ROTATE_TERMINAL`) zamiast komórki < 26 px (M13);
- **auto-pauza w terminalu (M10):** okno terminala zostaje otwarte, na nim nakładka `PAUSED` / `RESUME`. Po RESUME terminal działa od razu (świat i tak stoi). Po EXIT świat wznawia się od razu, a z odliczaniem 1,0 s tylko wtedy, gdy jakiś wróg jest w CHASE/ATTACK (ta sama reguła co notatka, 2.14).

**Baza [wysłane] (M4):** baza to **menu-hub bez ticków**. Nie ma chodzonej mapy ani symulacji. Czas gry w bazie nie biegnie, auto-pauza w bazie nie działa (nie ma czego pauzować). Tablica kontraktów i przycisk windy są widoczne od razu po wczytaniu (2.2).

**Okno przy `>` [wysłane, zmienione przez QA R25] (M5):** pojawia się **po wejściu na pole** `>` (nie po USE), pauzuje grę i **zeruje trzymane wejścia**. **STAY nie cofa gracza**: gracz zostaje na `>` i nie schodzi. Wznowienie od razu, a przy wrogu w CHASE/ATTACK z odliczaniem 1,0 s. Okno pojawia się znowu po zejściu z pola i ponownym wejściu albo po USE na `>`. Brama areny: `M1_RISK_01B` / `M1_RISK_01B_YES` „GO IN” (2.7a).

**Ekran śmierci (M8, korekta względem wysłanej odpowiedzi „ręczne przejście”):** obowiązuje decyzja GD: przycisk **NEXT** (`M1_DEATH_BTN`) aktywny po 1500 ms (tap / Enter, Spacja nie), a bez naciśnięcia **automatyczne przejście po 5000 ms**. Auto-pauza zatrzymuje oba zegary.

**Sens zasady utraty [wysłane] (M9):** przepada **plecak, założony sprzęt oprócz Issue i kredyty ze strefy**. Zostają **skrytka, kredyty w bazie, ulepszenia, postęp sieci i terminale**. Treść: `M1_RISK_04` (alias `M1_UI_DEATH_RULE`), 2 strony: NEXT, potem OK (2.7a).

**Rozstrzygnięte przez Mechaniki:**
- **M1 (`M1_SYS_04`):** **tylko terminal.** Ekwipunek w walce otwiera się bez pauzy (2.14) z paskiem `M1_UI_INV_COMBAT`, bez `M1_SYS_04`. Opis kontekstu `M1_SYS_04` w `teksty-m1-en.md` („terminala lub ekwipunku”) do poprawki przez Lore.
- **M2 (niski ekran):** akceptujemy **mniej wierszy, min. 15** (7 nad i 7 pod `@`, kamera trzyma `@` w środku w pionie), przy komórce ≥ 20 px. Jeśli 15 wierszy się nie mieści, komórka może zejść do 18 px (glif nie mniejszy niż 16 px, GRAF). Pionu nie wymuszamy; poniżej 300 px wysokości jednorazowo `M1_UI_ROTATE_HINT`. Uzasadnienie: zapowiedź wroga zaczyna się z zasięgu 1 (wręcz) albo 6 (Line Sentry), czyli zawsze w widoku 15 wierszy. Panel Drone (wykrycie 8) może ruszyć zza krawędzi, ale musi dojść ≥ 1 pole, zanim zacznie zapowiedź. Wymóg „zero obrażeń od niewidocznego wroga” jest spełniony.
- **M3 (klawisze I / F / X / 1–5):** **akceptujemy, bez kolizji.** Bindy w strefie: WASD/strzałki, Spacja/J, 1–3 i K/L/;, E (USE), Q (Med-Patch), Esc/P. **I** = ekwipunek (strefa i baza). **F** (załóż) i **X** (wyrzuć) działają tylko przy otwartym ekwipunku. **1–5** = skróty bazy tylko w menu-hubie (w bazie nie ma umiejętności). Przy otwartym ekwipunku w walce sterowanie postacią jest nieaktywne (gracz stoi, świat działa), a I/Esc zamyka okno.
- **M6 (format liczb):** czas jako **`m:ss`** z obcięciem ułamka sekundy (bez zaokrąglania w górę). DR w HUD i tooltipie jako **liczba całkowita z obcięciem** („−23%”, jak 2.11). W porównaniu przedmiotów w ekranie sprzętu DR **z 1 miejscem po przecinku**, też obcięte. Kredyty zawsze dokładnie.
- **M7 (obrażenia spoza wrogów):** **nie.** W M1 obrażenia zadają tylko wrogowie i boss. Ciecz `~` to dekoracja bez obrażeń (2.11). `KILLED BY` zawsze wskazuje wroga. `M1_DEATH_01_HAZ` nie wchodzi.
- **M10:** wyżej (terminal).
- **M14 i pytanie z 4.3:** lista podpowiedzi to T01–T13 z 2.19, mapowanie H1–H15 niżej w 2.19. W oknie przy `>` trzymany kierunek jest zerowany (jak przy każdej pauzie).


### 2.15 Postęp sieci i ulepszenie bazy (M1)
- **Mapa sektora: 10 fragmentów** = 8 wariantów terminali Power Lines (po 10%) + Rail Guardian (20%, `M1_BOSS_DEFEAT`). `grid_pct` w podsumowaniu to suma zapalonych fragmentów (`M1_BASE_09`, `M1_TERM_OK`).
- **Rozkład wariantów (przyjęty przez Level Design):** głęb. 1: `M1_TERM_04 < 07 < 08`; głęb. 2: `05 < 01 < 02`; głęb. 3: `06 < 03` (kolejność = trudność i kolejność pojawiania się). Na poziom dokładnie 1 terminal, 25–40 pól od szybu, w pomieszczeniu z 1–2 wejściami, bez wrogów bliżej niż 8 pól na starcie.
- **Konsekwencja:** zapalenie sektora wymaga min. **8 wypraw z terminalem** (3 + 3 + 2) + boss. To naturalnie rozkłada postęp sieci na wiele krótkich i średnich sesji.
- **Ulepszenie bazy „Lights Above the Base” (`M1_BASE_08`), 3 poziomy (decyzja GD; liczby: Balans v1.2 §4.1):** jedno ulepszenie, poziomy kupowane **kolejno w BASE**. Bramka Lights I = rozwiązanie terminala **`M1_TERM_08`**; każdy następny poziom wymaga poprzedniego. Rozwiązanie `M1_TERM_08` daje też **10 Copper** (`TERM08_REWARD_COPPER`), czyli 2/3 kosztu Lights I w Copper.

  | Poziom | Koszt | Skrytka (`STASH_SLOTS`) | Uzupełnianie Med-Patchy (`ISSUE_MEDPATCH_TOPUP`) | Półka automatu | r3 na półce |
  |---|---|---|---|---|---|
  | L0 (start) | — | 30 | 2 | 3 | 10% |
  | Lights I | **150 kr + 10 Copper** (`BASE_UPGRADE_COST`, po `M1_TERM_08`) | 40 | **3** | 3 | 10% |
  | Lights II | **600 kr + 25 Copper** (`BASE_UPGRADE2_COST`) | 50 | 3 | **4** | 10% |
  | Lights III | **1500 kr + 40 Copper** (`BASE_UPGRADE3_COST`) | 60 | 3 | 4 | **20%** |

  - **Lights I zmienia nie tylko skrytkę, ale też uzupełnianie Med-Patchy z Issue: 2 → 3** (decyzja GD, zatwierdzone). `STACK_MEDPATCH` = 6 to osobny limit plecaka.
  - Wizualnie każdy poziom zapala kolejne odcinki kabla w bazie (GD, `level-m1.md` §10 pkt 11).
  - W tekstach liczby skrytki i uzupełniania podajemy tokenami `{STASH_SLOTS}` i `{ISSUE_MEDPATCH_TOPUP}`.
  - **Otwarte (do pomiaru QA B1):** alternatywna bramka Lights I = „dowolne 3 fragmenty sieci” zamiast `M1_TERM_08` (gdyby 08 jako trzeci wariant głęb. 1 za długo blokował pierwsze ulepszenie). Do decyzji obowiązuje `M1_TERM_08`.
- Terminal rozwiązany raz pozostaje rozwiązany na stałe (po ID wariantu, nie po mapie). Po wyczerpaniu wariantów: „ponowne zestrojenie” (2.4).
- **M2:** ulepszenie BASE „Recovery Beacon” (sekcja M2) to drugie ulepszenie bazy, pierwszy system łagodzący stratę.

### 2.16 Tabela parametrów M1
(R) = wartość robocza dla Balansu i Ekonomii. Czasy w ms przeliczane na ticki jak w 1.1. Parametry Części 1 obowiązują dalej, poza zmienionymi tutaj. Parametry odzysku zwłok są w tabeli sekcji M2.

| Nazwa | Wartość | Jednostka | Uwagi |
|---|---|---|---|
| `PLAYER_REGEN_PER_S` | 0 | HP/s | zmiana z M0 (5) |
| `BUMP_ATTACK_ENABLED` | true | flaga | M0: false |
| `ATK_QUEUE_MS` | 150 | ms | bufor ATK i bumpa (Część 1) |
| `BAG_SLOTS` | 12 | sloty | |
| `STACK_MATERIAL` | 20 | szt./slot | Scrap, Copper |
| `STACK_MEDPATCH` | 6 | szt./slot | maks. 6 łącznie (GD, v0.4) |
| `STASH_SLOTS` | 30 / 40 / 50 / 60 | sloty | L0 / Lights I / II / III (Balans v1.2); w tekstach token `{STASH_SLOTS}` |
| `ISSUE_MEDPATCH_TOPUP` | 2 / 3 | szt. | przed / od Lights I, przy każdym wyjeździe windą (decyzja GD); token `{ISSUE_MEDPATCH_TOPUP}` |
| `START_CREDITS` | 50 | kr | nowy zapis (Balans v1.2) |
| `ISSUE_TIER` | Mk1 / Mk2 | — | Mk2 od odblokowania przystanku na głęb. 2: Pole 10–15, Suit pancerz 6 (QA R20, Balans) |
| `MEDPATCH_HEAL` | 40 | HP | w ciągu 2000 ms |
| `MEDPATCH_DURATION_MS` | 2000 | ms | |
| `MEDPATCH_COOLDOWN_MS` | 4000 | ms | |
| `MEDPATCH_PRICE` | 25 | kr | Balans |
| `MEDPATCH_SELLABLE` | false | flaga | niesprzedawalny (Balans) |
| `AFFIX_MEDHEAL_PCT` | 10–15 / 16–25 / 26–35 | % | `M1_AFFIX_06`, r1/r2/r3, 1 na przedmiot, Armor i Module |
| `MEDHEAL_BONUS_CAP` | 60 | % | łącznie |
| `ARMOR_DR_FORMULA` | A / (A + 100) | — | Balans |
| `ARMOR_DR_CAP` | 0,60 | — | min. 1 obrażenia po redukcji |
| `ARMOR_BASE` | 6–10 / 13–19 / 20–28 | pancerz | wg poziomu przedmiotu (głęb. 1/2/3) |
| `AFFIX_ARMOR` | +2–4 / +4–7 / +7–10 | pancerz | `M1_AFFIX_05`, r1/r2/r3 |
| `ACTION_TICK_ACCUMULATOR` | true | flaga | ułamki ticka dla afiksów szybkości, osobno atak i ruch (potwierdzone przez Gameplay) |
| `DEATH_SCREEN_MIN_MS` | 1500 | ms | ekran śmierci nie do pominięcia (2.7) |
| `DEATH_SCREEN_AUTO_MS` | 5000 | ms | samoczynne przejście bez NEXT (decyzja GD); zegar stoi w auto-pauzie |
| `DEATH_SCREEN_BUTTON` | NEXT (`M1_DEATH_BTN`) | — | tap / Enter po `DEATH_SCREEN_MIN_MS`; Spacja (ATK) nie |
| `KILLER_HIGHLIGHT` | 3 błyski po 100 ms (białe odwrócenie); Reduce motion: stałe 500 ms; pole ciosu nieznane: brak podświetlenia | — | GRAF S12, zatwierdzone przez GD; przypadki: `assety-m1.md` v1.2 `fx_death_player.anchorRules` |
| `PRINT_ANIM_MS` | 600 | ms | animacja wydruku (GRAF), nie blokuje logiki |
| `RISK_CONFIRM_DESCENT_DEFAULT` | true | flaga | potwierdzenie przy `>` i bramie areny, wyłączalne w ustawieniach (2.7a) |
| `RISK_CONFIRM_STAY_MODE` | stay_on_tile | — | QA R25: STAY zostawia gracza na `>`; okno znowu po ponownym wejściu albo USE na `>` |
| `RISK_EXPLAINER_ONCE` | true | flaga | `riskExplainerSeen` w zapisie (2.7a) |
| `RISK_EXPLAINER_PAGE_LOCK_MS` | 1500 / 500 | ms | blokada przycisku strony 1 (NEXT) / strony 2 (OK) `M1_RISK_04` (QA R30) |
| `RISK_CONFIRM_KEYS` | Enter i Spacja = przycisk z fokusem; Esc = STAY; fokus domyślny STAY | — | bez skrótu GO DOWN, także brama areny (QA R29) |
| `SK1_DASH_RANGE` | 3 | pola | było `SK1_VAULT_RANGE` |
| `SK1_DASH_IFRAMES_MS` | 200 | ms | było `SK1_VAULT_IFRAMES_MS` |
| `SK1_DASH_COOLDOWN_MS` | 4000 | ms | było `SK1_VAULT_COOLDOWN_MS` |
| `SK1_MOMENTUM_WINDOW_MS` | 1500 | ms | tag Momentum |
| `SK1_MOMENTUM_BONUS` | 0,5 | +× | 1 cios |
| `SK2_PULSE_RADIUS` | 2 | pola | 5×5 |
| `SK2_PULSE_DMG` | 15–20 | HP | |
| `SK2_PULSE_WINDUP_MS` | 150 | ms | |
| `SK2_PULSE_COOLDOWN_MS` | 8000 | ms | |
| `SK2_SHOCK_MS` | 2000 | ms | tag Shock: przerywa zapowiedź, ruch −50% |
| `SHOCK_MOVE_MULT` | 2 | × czasu kroku | prosty i skos, kroki rozpoczęte w trakcie Shocku, przez akumulator (v0.5.2) |
| `SKILL_COOLDOWN_FROM` | press | — | odnowienie Shock Pulse i drona od wciśnięcia (v0.5.2) |
| `SKILL_FAIL_REFUND` | true | flaga | Dash bez przesunięcia o 1 pole i dron bez wolnego pola: `skillFailed`, odnowienie nie zużyte (v0.5.2) |
| `ENEMY_GROUP_WAKE_RADIUS` | 4 | pola (Czebyszew) | budzenie grupy: tylko ta sama grupa, z linią wzroku, bez łańcucha (2.10) |
| `ENEMY_MOVE_DIAG_MS` (per wróg) | `h` 400 / `s` 300 / `d` 300 / `t` — | ms | 1,5 × krok prosty, w górę do ticka (v0.5.2) |
| `SK3_DRONE_HP` | 40 | HP | |
| `SK3_DRONE_DMG` | 5–7 | HP | ×2 na tag Shock |
| `SK3_DRONE_FIRE_MS` | 500 | ms | |
| `SK3_DRONE_RANGE` | 5 | pola | |
| `SK3_DRONE_TAUNT_RADIUS` | 4 | pola (Czebyszew) | + linia wzroku do drona |
| `SK3_DRONE_LIFE_MS` | 8000 | ms | |
| `SK3_DRONE_WINDUP_MS` | 200 | ms | |
| `SK3_DRONE_COOLDOWN_MS` | 18000 | ms | |
| `SKILL_BUFFER_MS` | 150 | ms | |
| `MASTERY_THRESHOLDS` | 40 / 150 | użycia | poziom 2 / 3 |
| `MASTERY_CDR_PER_LEVEL` | 0,10 | — | |
| `DEATH_LOSS_RISKY` | 1,0 | — | pełna utrata w M1 (plecak + założony sprzęt + kredyty strefy) |
| `CORPSE_RECOVERY_ENABLED` | false | flaga | M2: true |
| `CORPSE_ARROW_ENABLED` | false | flaga | M2: true |
| `ZONE_PERSIST_ENABLED` | false | flaga | M2: true |
| `EVAC_CALL_HOLD_MS` | 1000 | ms | przytrzymanie USE (R6 wariant A, GD v0.5.2) |
| `EVAC_ARRIVE_S` | 5 / 7 / 9 | s | głęb. 1/2/3 |
| `EVAC_HOLD_S` | 10 | s | od przyjazdu (`M1_BASE_06`) |
| `EVAC_CALL_INTERRUPT_ON_DAMAGE` | false | flaga | wezwanie przerywa ruch, atak, umiejętność, puszczenie USE; obrażenia nie (QA R31) |
| `EVAC_RECALL_COOLDOWN_S` | 5 | s | R6 wariant A, GD v0.5.2 (było 15) |
| `EVAC_ALERT_RADIUS` | 12 | pola (BFS) | `M1_SYS_05` + szary `!` nad ściągniętymi wrogami |
| `EVAC_ALERT_MOMENT` | arrival | — | alarm przy przyjeździe windy (R6 wariant A, GD v0.5.2; było `call`) |
| `LIFT_BOARD_MS` | 0 | ms | wsiadanie = krok na `<` w oknie |
| `LIFT_CABIN_INVULNERABLE` | true | flaga | od ticku wejścia do kabiny do końca odjazdu |
| `LIFT_DEPART_MS` | 1000 | ms | odjazd w świecie, nie do przerwania |
| `LIFT_RIDE_MS` | 2000 | ms | ekran przejścia w obie strony (`M1_BASE_05` przy zjeździe); czeka na generowanie poziomu |
| `LIFT_RIDE_SKIP_AFTER_MS` | 500 | ms | tap pomija resztę zjazdu |
| `SHAFT_ENEMY_PASSABLE` | false | flaga | `<` zawsze nieprzechodnie dla wrogów i drona |
| `SHAFT_DIST_FROM_ENTRY` | 25–40 / 30–50 / 35–55 | pola (BFS) | LD |
| `STAIRS_DIST_FROM_ENTRY` | 40–60 / 45–65 / — | pola (BFS) | LD, zejście `>` na głęb. 1/2 |
| `ARENA_GATE_DIST_FROM_ENTRY` | 50–70 | pola (BFS) | LD, głęb. 3 |
| `STAIRS_GATE_MIN_DIST_FROM_SHAFT` | 20 | pola (BFS) | LD, `>` i brama od `<` |
| `NO_ENEMY_RADIUS_ENTRY_SHAFT` | 10 | pola (BFS) | LD, na starcie poziomu |
| `TERMINAL_DIST_FROM_SHAFT` | 25–40 | pola (BFS) | LD |
| `TERMINAL_NO_ENEMY_RADIUS` | 8 | pola (BFS) | LD |
| `TERMINALS_PER_LEVEL` | 1 | szt. | LD |
| `FLOWFIELD_RADIUS` | 30 | pola | wagi 3/4 |
| `ATTACK_TOKENS_MELEE` | 2 | wrogów | jednoczesne zapowiedzi |
| `ATTACK_TOKENS_RANGED` | 1 | wieżyczka | na gracza |
| `ATTACK_TOKEN_STAGGER_MS` | 150 | ms | min. odstęp między żetonami tego samego celu |
| `DRONE_ATTACK_TOKENS` | 2 | wrogów | osobna pula na drona (wręcz + dystans) |
| `DRONE_FIELD_RADIUS` | 6 | pola | mapa odległości drona, liczona raz przy postawieniu |
| `DEPTH_HP_MULT` | 1,0 / 1,5 / 2,2 | × | Balans; nie dotyczy bossa |
| `DEPTH_DMG_MULT` | 1,0 / 1,25 / 1,5 | × | Balans; nie dotyczy bossa |
| `DEPTH_ENEMY_COUNT` | 8–10 / 12–14 / 14–16 | szt. | |
| `DEPTH_RARITY_ODDS` | 80/18/2, 65/30/5, 50/38/12 (R) | % | |
| `ENEMY_ITEM_DROP` | 0,20 (R) | — | średnio |
| `CONTRACT_SLOTS` | 2 BASE + 1 Exchange | szt. | |
| `CONTRACT_DEPTHS` | tylko z przystankiem windy | — | |
| `CONTRACT_WEIGHTS` | per (typ, głębokość): Relay 1/1/1, Data Core –/1/–, Clear the Path 1/1/**1**; zestrojenie 0,5 × waga Relay tej głęb. | — | Balans v1.1 §5; losowanie dwustopniowe (PROG) |
| `CONTRACT_ENEMY_LOOT` | 0 | — | wrogowie kontraktu bez łupu (Balans) |
| `CONTRACT_FAIL_ON_DEATH` | zostaje w slocie, postęp = 0 | — | 2.4, `prog/kontrakty-m1.md` A4 |
| `RETUNE_SCOPE` | per głębokość | — | 2.4, `prog/kontrakty-m1.md` A3 |
| `CONTRACT_KRPM_CAP` | ≤ kr/min wyprawy tej głęb.: **20 / 48 / 90** | kr/min | zasada GD; cykl baza → baza dla kontraktów i wypraw (Balans v1.1) |
| `REWARD_RELAY` | **35 kr** + fragment (1. raz) | | Balans v1.1 (było 40) |
| `REWARD_DATACORE` | 40 kr + 3 Copper | | potwierdzone przez Balans |
| `REWARD_CLEARPATH` | 1 Med-Patch / 25 kr + 1 Med-Patch / **40 kr + 1 Med-Patch** | | głęb. 1 / 2 / 3 (głęb. 3: GD v0.5.2, Balans v1.1) |
| `CLEARPATH_GROUPS` | g1: `sss` + `ddh`; g3: `sss` + `ddh` z mnożnikami głęb. 3 | — | 6 wrogów; g3 wg Balansu v1.1 §5 (g2 bez zmian w danych) |
| `REWARD_DELIVER_MULT` | 1,5 | × | wartość sprzedaży |
| `REWARD_SELL_BONUS` | +50 / +100 | kr | r2 / r3 (Balans) |
| `CLEARPATH_ENEMY_DIST` | 12–20 | pola (BFS) | od szybu |
| `DATACORE_DIST` | 30–45 | pola (BFS) | od szybu |
| `RETUNE_REWARD` / `RETUNE_WEIGHT` | **25 kr + 2 Copper** / ×0,5 | | „ponowne zestrojenie” (Balans v1.1, było 30 kr) |
| `PUZZLE_TIME_TARGET` | 30–60 / 60–90 (p80 ≤ 120) | s | mediana, głęb. 1 / głęb. 2–3, **wiążące** (QA R27) |
| `PUZZLE_TIME_LIMIT_D3` | mediana ≤ 75, p80 ≤ 105 | s | warianty 06 i 03 (Relay g3 w krótkiej sesji, 2.2) |
| `PUZZLE_FAIL_PENALTY_MS` | 1500 | ms | `zagadki-m1/` |
| `POWER_LINES_MAX_RECEIVERS` | 4 | szt. | na wariant (litery A–D); limit miejsca na TIP ≥ 90 znaków w panelu (UI) |
| `POWER_LINES_MID_FROM_DEPTH` | 3 | głęb. | `consumer_type` = `"mid"` dopiero od tej głębokości |
| `TUT_HINT_MIN_VISIBLE_MS` | 2000 | ms | przerwana podpowiedź liczy się do limitu pokazów tylko po ≥ 2 s widoczności (2.19) |
| `TUT_HINT_BAR_FONT` | 16 px / maks. 2 linie; 14 px tylko przy wysokości < 360 px (maks. 3 linie) i w pionie (1 linia) | — | wyjątek od min. 16 px: decyzja Mechanik (2.19) |
| `TUT_HINT_HIDE_ON_THREAT` | true | flaga | fade 150 ms, gdy pod paskiem wróg ALERT/CHASE/ATTACK, zapowiedź albo pas szarży (QA R28) |
| `LIFT_SINGLE_STOP_AUTO` | true | flaga | przy jednym dostępnym przystanku LIFT jedzie bez okna wyboru (2.9) |
| `GRID_FRAGMENTS` | 8 × 10% + boss 20% | % | |
| `BASE_UPGRADE_COST` | 150 kr + 10 Copper | | Lights I, po `M1_TERM_08`: skrytka 40, uzupełnianie 3 (GD, Balans v1.2) |
| `BASE_UPGRADE2_COST` | 600 kr + 25 Copper | | Lights II: skrytka 50, 4. miejsce na półce (GD) |
| `TERM08_REWARD_COPPER` | 10 | Cu | za pierwsze rozwiązanie `M1_TERM_08` (Balans v1.2) |
| `BASE_UPGRADE3_COST` | 1500 kr + 40 Copper | | Lights III: skrytka 60, r3 na półce 20% (GD) |
| `SHOP_GEAR_SLOTS` | 3 / 4 | szt. | półka sprzętu automatu; 4 od Lights II (GD) |
| `SHOP_GEAR_RARITY` | r1 / r2 (+ r3: 10%, 20% od Lights III, slot 1) | — | Balans §4 |
| `SHOP_GEAR_PRICE_MULT` | 4 (r3: 5) | × ceny sprzedaży | GD, Balans §4 |
| `SHOP_GEAR_REROLL` | po każdej wyprawie | — | powrót windą albo śmierć |
| `SELL_SCRAP` / `SELL_COPPER` | 2 / 5 (R) | kr/szt. | |
| `SELL_ITEM` | 10 / 40 / 150 × (1 + 0,5·(poz.−1)) (R) | kr | |
| `BOSS_HP` | 2400 | HP | Balans v1.1: mediana 86 / 68 / 46 s przy 35 / 48 / 72 DPS; 2600 tylko gdy zmierzona mediana QA D7 < 65 s w paśmie 44–52 DPS przy zmierzonym udziale bicia (QA R32) |
| `BOSS_DMG` | 20–32 | HP | Balans; bez mnożnika głębokości |
| `BOSS_SWING_WINDUP_MS` / `_RECOVERY_MS` | 800 / 1200 | ms | Balans (v0.5) |
| `BOSS_CHARGE_EVERY` | 4 | ataki | co 4. atak szarża |
| `BOSS_CHARGE_WINDUP_MS` | 900 | ms | podświetlenie całego toru; liczone od chwili, gdy boss stanie na torze (GD: ≥ 450) |
| `BOSS_CHARGE_SEEK_TRACK` | true | flaga | przed szarżą boss idzie zwykłym krokiem na najbliższy tor `=`, bez ataku i bez przerwania (GD) |
| `BOSS_CHARGE_TICKS_PER_CELL` | 2 | ticki/pole | 10 pól/s; tor 28 pól ≤ 2,8 s (Z12) |
| `BOSS_SUMMON_HP_PCT` | 50 | % | jednorazowo, po rozstrzygnięciu bieżącego ataku |
| `BOSS_SUMMON_MS` | 600 | ms | boss stoi i jest podatny, bez `!`; ciosy i Shock nie przerywają (Z13) |
| `SUMMON_COUNT` | 2 | szt. | Panel Drone z mnożnikami głęb. 3, bez łupu |
| `SUMMON_MIN_DIST_PLAYER` | 4 | pola (BFS) | promień 3 od bossa, nie na pasie toru |
| `SUMMON_ACTIVATE_MS` | 500 | ms | drony stoją (ALERT 300 ms), potem CHASE |
| `BOSS_MELEE_TOKENS` | 1 | żeton | boss zajmuje 1 z 2 żetonów wręcz gracza |
| `PANEL_DRONE_STEP_MS` / `_DIAG_MS` / `_WINDUP_MS` | 200 / 300 / 450 | ms | v0.5: skos potwierdzony z Gameplay, zapowiedź wg reguły GD |
| `SCRAPPER_WINDUP_MS` | 450 | ms | v0.5, reguła GD (było 400) |
| `ENEMY_RESPAWN_IN_LEVEL` | false | flaga | M1: brak odradzania w trakcie poziomu (GD, Z5) |
| `TUT_HINTS_DEFAULT` | true | flaga | podpowiedzi Prologu, wyłączalne (2.19) |
| `TUT_HINT_MAX_SHOWS` | 2 | razy | na ID, potem nigdy |
| `TUT_TELEGRAPH_FREEZE_AT_MS` | 100 | ms | jedyne zamrożenie nauki: 100 ms po starcie pierwszej zapowiedzi na gracza; po wznowieniu zostaje zapowiedź − 100 ms (2.19, QA R26) |
| `TUT_HINT_MS` | 4000 | ms | czas pokazu podpowiedzi |
| `TUT_HINT_BAR_POS` | dół, środek | — | między joystickiem a przyciskami; nie zasłania `AT RISK` ani pól w promieniu 3 od `@`; prostokąt zgłaszany kamerze (QA R28) |
| `DEVICE_PROLOGUE_DONE` | false | flaga urządzenia | poza zapisem; true po pierwszym powrocie po First Light; włącza „Skip tutorial” przy nowym zapisie (2.19) |
| `RAIL_PISTOL_DMG` | 8–11 | HP | ~16,5 DPS |

Usunięte w v0.4: `DECOR_OLD_CORPSE_CHANCE` (dekoracja zwłok dopiero w M2), `CONTRACT_REWARDS` (zastąpione przez `REWARD_*`). Usunięte względem v0.2: `DEATH_ITEM_DESTROY_CHANCE`, `DEATH_STACK_LOSS`, `DESTROYED_TO_SCRAP`, `USE_HOLD_MED_MS`. Parametry `CORPSE_*`, `SCRAPPER_*` przeniesione do sekcji M2. `EVAC_MIN_DIST_FROM_ENTRY` (25) zastąpiony przez `SHAFT_DIST_FROM_ENTRY`. `EVAC_CALL_CHANNEL_MS` zmienia nazwę na `EVAC_CALL_HOLD_MS`.

### 2.16a Pola zdarzeń FX (v0.5.2)
Nazwy pól wg konwencji GRAF (`graf/assety-m1.md` v1.3, `fx_common.payloadConvention`) i kodu (`prog/game/src/core/events.ts`, `FxTriggerEvents`): `entityId` (encja, do której kotwiczy efekt; boss = lewy górny róg), `cells` (lista komórek `FxCell {x, y}`), `cell` (jedna komórka), `killer { entityId?, strikeOrigin }`, `alertedIds`. Mechaniki wymagają tylko pól, z których korzystają reguły tego dokumentu. Wygląd, czasy klatek i pozostałe pola: `assety-m1.md`.

| Zdarzenie (mechanika) | Wymagane pola | Reguła mechaniki |
|---|---|---|
| Śmierć gracza (`fx_death_player`, 2.7) | `killer.strikeOrigin` (komórki, z których padł cios; boss: 6 pól bryły); `killer.entityId` gdy zabójca żyje | zabójca żyje → podświetlenie encji; zginął w tym samym ticku → `strikeOrigin`; brak obu → bez podświetlenia (`anchorRules`, S12) |
| Przyjazd windy z alarmem (`liftArrived`, 2.9) | `cell` (szyb `<`), `alertedIds` (może być puste) | szary `!` (`fx_alert`) nad każdym wrogiem z `alertedIds`; `M1_SYS_05` |
| Zapowiedź szarży (`bossTelegraph`, `kind` = `bossCharge`, 2.11) | `entityId` (boss), `cells` = 2 rzędy toru od bossa do ściany | emitowane, gdy boss **stanie na torze** (start 900 ms); pas świeci stale do końca przejazdu |
| Uderzenie w ścianę (`chargeWallHit`) | `entityId`, `cells` | początek ogłuszenia 2 s |
| Przywołanie (`bossSummon`, 2.11) | `entityId` (boss), `cells` (2 pola dronów) | animacja 600 ms; potem `summonedSpawn` z `entityId` każdego drona (aktywacja 500 ms) |

### 2.17 Kryteria akceptacji M1 (mechaniki)
**Wyjście z M1 (decyzja GD, v0.5):**
- testy techniczne przechodzą (m.in. zapis 100%, zero obrażeń od niewidocznego wroga);
- właściciel po zagraniu potwierdza, że chce grać dalej.

Testy: symulacja, boty QA, granie właściciela. Kryteria poniżej to testy techniczne mechaniki. Progi subiektywne i progi [QA] są **wskaźnikami**, nie warunkiem wyjścia.

1. **Pełna pętla:** baza → winda → głęb. 1–3 → ewakuacja lub śmierć → baza → podsumowanie. Działa bez błędów 10 razy z rzędu w teście QA, na telefonie i PC.
2. **Kontrakty:** 5 typów z 2.4, losowane tylko na głębokościach z przystankiem, per para (typ, głębokość). Na nowo losują się tylko ukończone sloty. Po śmierci kontrakt zostaje w slocie z postępem 0. Clear the Path losuje się na głęb. 1, 2 i 3. Relay 35 kr + fragment. „Ponowne zestrojenie” (25 kr + 2 Copper, waga ×0,5) włącza się osobno dla każdej głębokości. Wrogowie kontraktu nie upuszczają łupu. **Krótka sesja (metryka GD):** otwarcie gry → podsumowanie, mediana ≤ 3 min, p80 ≤ 4 min (wskaźnik, 2.2).
3. **Umiejętności:** 3 umiejętności (Dash, Shock Pulse, Buddy Drone) z liczbami z 2.16, odblokowanie wg 2.5. Shock Pulse przerywa zapowiedź w 100% przypadków. Synergie Momentum i dron ×2 na Shock działają przez tagi. **Test wymienności:** zamiana `skillId` w slotach w danych (bez zmiany kodu) działa poprawnie. Biegłość zapisuje się i przetrwa śmierć.
4. **Bump attack:**
   - krok w wroga atakuje go z pominięciem autocelu;
   - przy trwającym odnowieniu gracz stoi w miejscu, a bump w ostatnich 150 ms jest buforowany;
   - trzymanie kierunku = 2,5 ciosu/s Issue Pole;
   - bump przez róg nie atakuje;
   - dron i zwłoki nie są celem.
5. **Śmierć:** przepada 100% `AT RISK` (test: wartość straty w podsumowaniu = ostatni `AT RISK` co do kredytu). Issue zostaje. Med-Patche uzupełniają się do `ISSUE_MEDPATCH_TOPUP` (2, od Lights I 3) przy wyjeździe windą. Issue Mk2 po odblokowaniu przystanku na głęb. 2. Każda wyprawa ma nowe ziarno. Generator M1 **nie stawia** zwłok-dekoracji (test na 1000 poziomów).
6. **Haki M2:** flagi `CORPSE_RECOVERY_ENABLED`, `CORPSE_ARROW_ENABLED`, `ZONE_PERSIST_ENABLED` istnieją. Po włączeniu w buildzie testowym strzałka do zwłok się pokazuje, a USE przełącza się na tryb odzysku (bez logiki Zbieraczy, to M2).
7. **Ewakuacja:**
   - wezwanie przez przytrzymanie USE 1,0 s, przerywane puszczeniem, ruchem, atakiem (także bumpem) i umiejętnością; **obrażenia go nie przerywają** (test: trafienie w trakcie przytrzymania nie zeruje pierścienia, QA R31);
   - dojazd 5/7/9 s bez alarmu; w ticku przyjazdu `M1_BASE_06`, alarm w promieniu 12 pól (BFS), `M1_SYS_05` i szary `!` nad każdym ściągniętym wrogiem; okno 10 s, ponowne wezwanie po 5 s (R6 wariant A);
   - wsiadanie = krok na `<`. Od tego ticku gracz jest nietykalny (test: zapowiedź rozstrzygana w tym samym ticku pudłuje). Odjazd 1000 ms, zjazd 2000 ms (pomijalny po 500 ms). Wróg nigdy nie wchodzi na `<`;
   - przystanki windy odblokowują się terminalami;
   - odległości szybu, `>` i bramy areny (min. 20 pól od szybu) zgodne z Level Design (test generatora na 1000 poziomów).
8. **Trudność tylko z głębokości (Z-GD2):** test automatyczny generuje ten sam poziom (to samo ziarno) przy 0 i 50 śmierciach na koncie. Statystyki wrogów, ich liczba, łup i czasy są identyczne bit w bit.
9. **Brak regeneracji:** HP rośnie tylko z Med-Patchy i w bazie (test: 60 s bez walki = HP bez zmian). Med-Patch działa z przycisku `[+]` (z licznikiem) i z Q. Limit 6 sztuk, Exchange odmawia kupna Med-Patcha.
10. **Pauzy (Z-GD3):** notatka i opis zwłok zawsze pauzują. Terminal otwiera się tylko poza walką (w przeciwnym razie `M1_SYS_04`) i pauzuje. Ekwipunek pauzuje tylko poza walką. Wznowienie zgodne z 2.14.
11. **Plecak i `AT RISK`:** 12 slotów, stosy 20/6, pełny plecak blokuje podnoszenie (`M1_SYS_06`). `AT RISK` = suma wartości sprzedaży plecaka + założonego sprzętu poza Issue + kredytów ze strefy, zgodna z cenami Exchange co do kredytu.
12. **Wielu wrogów:** flow field liczony tylko przy zmianie komórki gracza. Maks. 2 jednoczesne zapowiedzi wręcz + 1 strzał na gracza, z odstępem ≥ 150 ms między startami żetonów (nigdy dwa ciosy w tym samym ticku). `!` nad każdym wrogiem w zapowiedzi. Wróg bez żetonu obok gracza stoi. Dron: mapa liczona raz, prowokacja tylko z linią wzroku, osobna pula 2 żetonów. 16 wrogów + boss bez spadku poniżej 60 FPS renderu na średnim telefonie (cel z `stos-techniczny.md`).
13. **Telegraf i symbole:** zgodne z 1.7 i GRAF §9: żółty `!` + odwrócona komórka + `x` na `#4A1240`, szary `!` ALERT 300 ms, `Π` drzwi, `:` materiały, `+` Med-Patch, `§` Data Core, `¤` dron.
14. **Postęp:** 10 fragmentów sieci, 1 terminal na poziom w kolejności trudności, ulepszenie bazy przez `M1_TERM_08` + koszt, liczby w podsumowaniu zawsze prawdziwe (zgodne z zapisem).
15. **Pancerz i leczenie:** kolejność: rzut → krytyk ×1,5 → Momentum ×1,5 → × mnożnik głębokości (tylko wrogowie) → round → pancerz (tylko gracz). Obrażenia po pancerzu = floor(obrażenia × (1 − min(0,6; A/(A+100)))), min. 1 (testy jednostkowe na A = 0, 21, 30, 150). Suma `M1_AFFIX_06` obcinana do +60%.
16. **Ekonomia kontraktów:** w telemetrii QA mediana kr/min każdego kontraktu BASE ≤ mediana kr/min wypraw na tej głębokości (zasada GD).
17. **Boss:**
    - mediana walki w QA D7 w paśmie 44–52 DPS mieści się w 65–75 s (pomiar QA: 68 s przy 48 DPS); `BOSS_HP` → 2600 tylko przy medianie < 65 s w tym paśmie i zmierzonym udziale bicia (wskaźnik, QA R32);
    - pas szarży świeci stale, bez migania (S14);
    - szarża 2 ticki na pole, pas zaznaczony przez całą zapowiedź i przejazd;
    - przywołanie trwa 600 ms, boss jest wtedy podatny, drony pojawiają się ≥ 4 pola od gracza i mają aktywację 500 ms;
    - boss zajmuje 1 żeton wręcz.
18. **Zapowiedzi:** każda zapowiedź ciosu wroga ≥ 450 ms (test danych: `windupMs − TICK_MS ≥ 400` dla każdego wroga i ataku, także przywołanych). Brak skracania z głębokością.
19. **Brak odradzania:** liczba żywych wrogów na poziomie M1 nigdy nie rośnie po wygenerowaniu poziomu (test na 1000 poziomów z botem).
20. **Śmierć i strata (2.7, 2.7a):**
    - ekran śmierci pokazuje zabójcę i 3 ostatnie trafienia zgodnie z dziennikiem obrażeń;
    - potwierdzenie przy `>` działa i da się je wyłączyć; po STAY gracz stoi na `>` i nie schodzi, okno wraca dopiero po ponownym wejściu albo USE na `>` (QA R25); brama areny pokazuje `M1_RISK_01B`;
    - ekran śmierci: NEXT (`M1_DEATH_BTN`) działa od 1500 ms (tap / Enter, nie Spacja), bez naciśnięcia przejście po 5000 ms; auto-pauza zatrzymuje oba zegary; wyjaśnienie ma 2 strony (NEXT, OK);
    - znacznik „can be lost” jest na każdym przedmiocie ryzykownym i na żadnym z Issue ani ze skrytki;
    - wyjaśnienie pojawia się dokładnie raz na zapis.
21. **Nauka gry (2.19):**
    - każda podpowiedź ma wariant T/K, maks. 8 słów i maks. 2 pokazy;
    - po zaliczeniu nie wraca;
    - przełącznik „Hints” działa;
    - „Skip tutorial” pojawia się tylko przy nowym zapisie z `DEVICE_PROLOGUE_DONE` = true, a stan po pominięciu jest identyczny ze stanem po ukończeniu Prologu (porównanie zapisów pole po polu, poza czasem gry i statystykami);
    - pasek podpowiedzi nie zasłania `AT RISK` ani pól w promieniu 3 od `@` (QA R28);
    - po zamrożeniu T04 zostaje zapowiedź − 100 ms (Curfew Guard: 500 ms, QA R26);
    - układ Prologu nie zmienia statystyk wrogów (Z-GD2).
22. **Subiektywnie, wskaźnik (QA, min. 3 osoby, pierwsza godzina gry):** „decyzja dalej/wracać była odczuwalna” ≥ 4/5, „utrata łupu bolała, ale była uczciwa” ≥ 3,5/5, „bump attack nie przeszkadzał w unikach” ≥ 3,5/5.

### 2.18 Otwarte pytania (Część 2)
**Do Game Directora**
1. **Podświetlenie zabójcy (GRAF S12, 2.7):** 3 białe błyski po 100 ms w 500 ms zatrzymania, przy „Reduce motion” stałe odwrócenie komórki. Zatwierdzone przez GD (v0.5.2).
2. ~~`ISSUE_MEDPATCH_TOPUP`~~: **rozstrzygnięte (GD):** 2, od Lights I 3.
3. **Ujścia kredytów z Balansu §7** (płatne odświeżenie półki, kalibracja) poza tą specyfikacją, do decyzji GD.

**Do Balansu i Ekonomii**
4. Bramka Lights I: `M1_TERM_08` (obowiązuje) czy „dowolne 3 fragmenty sieci”, do pomiaru QA B1 (2.15).
5. Tempo odbudowy po śmierci na samym Issue (≤ 2 wyprawy) z półką automatu i DPS 26 → 35 → 48 (`progresja2.py`).

**Do PROG (Gameplay, Silnik, UI i Menu)**
6. Gameplay: priorytet bumpa nad autocelem (2.6) i sprawdzenie bumpa z kolejnością w ticku (2.10). Prosimy o potwierdzenie przy implementacji M1.
7. Gameplay/Silnik: flagi `CORPSE_RECOVERY_ENABLED`, `CORPSE_ARROW_ENABLED`, `ZONE_PERSIST_ENABLED` i pola zapisu z sekcji M2 jako haki w M1. Strzałka do celu (komponent strzałki zwłok) jest użyta w Prologu do szybu (2.19).
8. Kontrakty (`prog/kontrakty-m1.md`, `contracts-m1.ts`): `REWARD_RELAY` 35, `RETUNE_REWARD` 25 kr + 2 Cu, Clear the Path na głęb. 3 (40 kr + 1 Med-Patch, waga 1, `sss` + `ddh`), `expectedMs` wg 2.4. Lista zmian w raporcie v0.5.2.
9. Silnik: flaga urządzenia `DEVICE_PROLOGUE_DONE` poza zapisem (2.19) i stan „jak po Prologu” przy „Skip tutorial”.
10. UI: elementy z 2.7a, 2.14a i 2.19 (lista w 2.19). Prostokąt paska podpowiedzi zgłaszany kamerze (QA R28).

**Do LUZ / Pracownik 1 (zagadka)**
11. Wpisać w `zagadki-m1/` wiążące czasy 30–60 s (głęb. 1) i 60–90 s (głęb. 2–3), limit na głęb. 3 (mediana ≤ 75 s, p80 ≤ 105 s), usunąć pułapkę [4,5] z `M1_TERM_03`, przeliczyć `validate.py` i podać wersję dla QA B3. W pliku v0.4 jest jeszcze „60–120 s” i pułapka.

**Do Level Design**
12. `level-design-m1.md` §3: nagroda za ponowne zestrojenie to teraz **25 kr + 2 Copper** (Balans v1.1; w ich pliku 40 kr).

**Do Dialogów i Lore / Scenarzysty**
13. Tokeny w opisach umiejętności (`teksty-m1-en.md` §10.2): `{SK1_VAULT_RANGE}` i `{SK1_VAULT_COOLDOWN_MS}` zmieniają nazwy na `{SK1_DASH_RANGE}` i `{SK1_DASH_COOLDOWN_MS}`.
14. Nowe lub zmienione sloty v0.5.2: `M1_TUT_SKIP_PROLOGUE` z przyciskami `M1_TUT_SKIP_PROLOGUE_YES` „SKIP” i `M1_TUT_SKIP_PROLOGUE_NO` „PLAY” (`M1_TUT_SKIP_YES` / `_NO` tylko dla „Show hints?”), `M1_TUT_02T` „Tap LIFT to go down.” i `M1_TUT_02K` „Choose LIFT. Press {KEY_CONFIRM} to go down.”, `M1_TUT_18` „Enemies come to the lift. Get in fast.” (teksty zatwierdzone przez GD), opis kontekstu `M1_SYS_04` (tylko terminal), `M1_SYS_05` w chwili przyjazdu. Pełna lista różnic w raporcie v0.5.2.

**Rozstrzygnięte (v0.5.2):**
- **Game Director:** R6 wariant A (alarm przy przyjeździe, wezwanie 1,0 s, ponowne wezwanie po 5 s, szary `!`); samouczek T01–T13 ze „Skip tutorial”; Clear the Path na głęb. 3; sprzedaż sprzętu w automacie (półka ×4); Lights I/II/III (2.15); `M1_RISK_01B` dla bramy areny; przycisk `M1_DEATH_BTN` „NEXT”.
- **Balans v1.1:** podstawa kr/min = cykl baza → baza, limity 20 / 48 / 90; Relay 35 kr; zestrojenie 25 kr + 2 Cu; Clear the Path głęb. 3; boss 2400 HP (86 / 68 / 46 s), następny krok 2600; strata HP 82 / 188 / 285 (dawne pytania 2, 3 i 5).
- **UI:** odpowiedzi M1–M14 (2.14a).
- **QA:** R25 (STAY bez cofania), R26 (T04), R27 (czasy zagadki wiążące, limit głęb. 3), R28 (pasek podpowiedzi na dole).
- **GRAF / Assety:** S14 (pas szarży bez migania).
- **Mechaniki:** ciecz `~` bez obrażeń w M1 (GD może zmienić).

**Rozstrzygnięte (v0.5):**
- **Game Director:**
  - reguła zapowiedzi „zapowiedź − tick ≥ 400 ms” (min. 450 ms);
  - krótka sesja mierzona od otwarcia gry do podsumowania (mediana ≤ 3 min, p80 ≤ 4 min);
  - R4 przez zabezpieczenia informacyjne (2.7a);
  - przyczyna śmierci na ekranie śmierci i w podsumowaniu;
  - brak odradzania wrogów w trakcie poziomu (Z5);
  - progi [QA] to wskaźniki;
  - Buddy Drone `¤`.
- **Balans:**
  - BOSS_HP 2400, zamach 800 / 1200 ms, obrażenia 20–32;
  - zestrojenie 30 kr + 2 Copper (v0.5.2: 25 kr), wrogowie kontraktu bez łupu, wagi per (typ, głębokość);
  - Relay, Data Core, Clear the Path i Sell w wartościach v0.4 potwierdzone; 21 / 52 / 97 kr/min potwierdzone (v0.5.2: 20 / 48 / 90 na cykl baza → baza);
  - Beacon 400 kr + 25 Copper, zegar Zbieraczy 50 / 45 / 40 s;
  - budżet HP z modelu grupowego.
- **PROG / Gameplay:**
  - Panel Drone po skosie 300 ms;
  - kolejność obrażeń, pancerz tylko u gracza;
  - akumulator ułamków ticka (osobno atak i ruch);
  - `MAX_STEPS_PER_FRAME` = 5;
  - skosy z `DIAG_GRACE` i przeciwne klawisze (1.2);
  - śmierć a kontrakt (A4) i zestrojenie per głębokość (A3), zgodnie z `prog/kontrakty-m1.md`.
- **GRAF / Assety** (`graf/assety-m1.md` §14): Z6 (ekran śmierci, 2.7), Z12 (szarża 2 ticki na pole, nie 1), Z13 (przywołanie 600 ms, boss podatny).
- **Dialogi i Lore:** `M1_NOTE_47_BODY` → `M2_NOTE_47_BODY` (pula M2), więc dawne pytanie 10 jest zamknięte.
- **Level Design (v0.5.1):** układ Prologu (terminal 45–60 pól, Scrappery ≥ 8 pól od terminala, szyb 25–40 pól od wejścia i od terminala), szyb `<` z min. 2 polami (cel 3), nigdy w korytarzu szerokości 1, walidacja łączności po wstawieniu.

**Rozstrzygnięte (v0.4):**
- **Game Director:** cel walki z bossem 60–90 s; zasada kr/min kontraktu ≤ wyprawa na tej samej głębokości z powodem atrakcyjności niekredytowej; limit Med-Patchy 6 przy leczeniu 40, pełna wyprawa 1→3 możliwa, ale trudna, przystanki windy jako normalna ścieżka; nazwa Buddy Drone; `M1_NOTE_47_BODY` (dziś `M2_NOTE_47_BODY`) zatwierdzony.
- **Balans:** mnożniki ×1/1,5/2,2 i ×1/1,25/1,5; model pancerza A/(A+100) z limitem 60%; `M1_AFFIX_06` jako +% leczenia z Med-Patchy z limitem +60% (dawne pytanie o zmianę afiksu); Med-Patch 25 kr i niesprzedawalny; uzupełnianie przy wyjeździe windą; Panel Drone 200/400 ms; Rail Pistol 8–11; ataki bossa.
- **Level Design:**
  - dekoracja zwłok dopiero w M2 (dawne pytanie 5);
  - `>` 40–60 / 45–65 pól, brama areny 50–70 pól, min. 20 pól od szybu (dawne pytanie 6);
  - nory w M1 jako zwykłe miejsca spawnu Zbieraczy.
- **PROG / Gameplay** (`walka-m0.md` §6): kolejność w ticku (1.1), żetony 2+1 z odstępem 150 ms, `!` nad każdym wrogiem w zapowiedzi, czekanie w miejscu bez żetonu, mapa drona (promień 6, raz przy postawieniu), prowokacja w promieniu 4 z linią wzroku, osobna pula 2 żetonów drona (2.10).
- **Dialogi i Lore:** opis własnych zwłok = `M1_NOTE_47_BODY` (dawne pytanie 10; od v0.5 `M2_NOTE_47_BODY`).

**Rozstrzygnięte (v0.3):**
- **Game Director:**
  - Zbieracz w M1 i 20% uszkodzenia: **odrzucone**. Pełna utrata, odzysk w M2 jako Recovery Beacon.
  - 3 umiejętności na stałych slotach: **TAK**, projektowane jako wymienne (wybór zestawu i synergie od M2).
  - Ekwipunek w walce bez pauzy, notatki pauzują zawsze, terminal tylko poza walką: **TAK**.
  - Po śmierci „Hunter 47”: przyjęte (Część 1, 1.8).
- **Level Design** (`level-design-m1.md`): rozkład terminali i kolejność trudności, odległości szybu i terminali (BFS), strefy bez wrogów, rozmiary i 40–50% pól przechodnich, arena 28×14 z 2 torami, nory (w v0.4: spawn Zbieraczy w M1), „ponowne zestrojenie”.
- **Silnik:** zachowanie strefy przez 1 wyprawę i zegar zwłok. Ustalenia wpisane do sekcji M2. W M1 nieaktywne, haki za flagą.
- **UI:** Med-Patch jako stały przycisk `[+]` z licznikiem (dotyk) i Q. Przytrzymanie USE tylko dla interakcji z czasem trwania.
- **GRAF** (`styl-ascii.md` §9 v1.1): materiały `:`, Med-Patch `+`, drzwi `Π`, Data Core `§`, dron `¤`, telegraf (żółty `!` + odwrócona komórka + `x` na ciemnej magencie), szary `!` ALERT, wygląd Zbieracza z łupem (M2).
- **Dialogi i Lore** (`teksty-m1-en.md` §10): nazwy Dash / Shock Pulse / Buddy Drone, `M1_SYS_04` „Enemies nearby. Fight first.”, `M1_BASE_06` przy przyjeździe windy, komunikaty o Zbieraczach w puli M2 (`M2_SYS_01–03`), `[EVAC_TIME_TBD]` = 10, `M1_ENEMY_03` zostaje z „bodies”.


### 2.19 Nauka gry w Prologu (v0.5, QA R5, decyzja Producenta; T01–T13 zatwierdzone przez GD w v0.5.2)
Projekt: Mechaniki, z UI i Menu (elementy UI). Teksty: Dialogi i Lore (robocze ID niżej). Nauka mieści się w Prologu, bez osobnego samouczka i bez osobnej mapy.

**Prolog = od pierwszego wydruku (`M1_BASE_01`, `M1_BASE_02`) do pierwszego powrotu do bazy po First Light** (pierwszy rozwiązany terminal, zakres fabuły §8 pkt 1–2).

**Czas Prologu: cel 10–15 min** (Balans [P], QA C10; pierwsza ewakuacja ≤ 10 min jako wskaźnik QA D0):

| Etap | Szacunek |
|---|---|
| baza: wydruk, 2 kwestie BASE, droga do windy | 0,5–1 min |
| głęb. 1: pierwsze walki (Scrapper, Curfew Guard) | 1–2 min |
| eksploracja i łup w drodze do terminala | 2–4 min |
| terminal 04 (najłatwiejszy, uczy reguł zagadki, `zagadki-m1/`) | 0,5–1,5 min |
| powrót i ewakuacja | 1–1,5 min |
| **razem bez śmierci** | **≈ 6–10 min** |
| z dokończeniem poziomu albo jedną śmiercią | **≈ 10–15 min** |

**Układ Prologu (przyjęty przez Level Design, szczegóły: `level-design-m1.md` §4):** pierwsza wyprawa (i każda kolejna aż do First Light) to zwykły poziom głęb. 1 z generatora, ze stałym wariantem terminala 04 i **kolejnością wstawek** na ścieżce BFS wejście → terminal:
1. pojedynczy Scrapper `s` w IDLE, 12–18 pól od wejścia;
2. pojedynczy Curfew Guard `h` w pomieszczeniu ≥ 5×5, 20–30 pól od wejścia;
3. skrzynia za Guardem z gwarantowanym Med-Patchem i 1 przedmiotem r1. Skrzynia stoi tak, żeby nie dało się jej zabrać bez przejścia obok Guarda (LD §4);
4. para Scrapperów 30–40 pól od wejścia i **≥ 8 pól od terminala** (pokój terminala zostaje bez wrogów);
5. terminal 04 **45–60 pól od wejścia** (BFS; w Prologu zamiast zwykłego „25–40 pól od szybu”). Szyb `<` stoi **25–40 pól od wejścia i 25–40 pól od terminala**.

Marsz wejście → terminal to 45–60 pól, czyli ok. 8–11 s. Mieści się w szacunku czasu wyżej.

Wstawki wchodzą w zwykłą pulę 8–10 wrogów. **Statystyki się nie zmieniają.** Układ zależy od postępu (brak First Light), a nie od liczby śmierci, więc Z-GD2 jest zachowane.

**Czy śmierć w Prologu to pełna utrata? Tak.** Te same zasady co zawsze (wizja, Z-GD2: brak litości). Stawka jest jednak naturalnie mała:
- Issue nie przepada;
- `AT RISK` w Prologu to ~0–170 kr;
- rozwiązany terminal zostaje rozwiązany (2.15), więc First Light i Shock Pulse nie przepadają nawet przy śmierci przed ewakuacją;
- kontrakt Relay zostaje na tablicy z postępem 0 (2.4).

Pierwsza śmierć z łupem włącza jednorazowe wyjaśnienie (2.7a, `M1_RISK_04`). Śmierci nie wymuszamy scenariuszem.

**Zasady nauki:**
- **Pokazuj zamiast mówić.** Najpierw sygnał UI (puls przycisku, błysk HUD, podświetlenie). Tekst pojawia się tylko wtedy, gdy gracz nie wykona czynności w podanym czasie albo przy pierwszym wystąpieniu zagrożenia.
- **Bez ścian tekstu:**
  - maks. **1 podpowiedź naraz**, maks. **8 słów**, angielski A2;
  - **pasek na DOLE ekranu, na środku, między joystickiem a przyciskami** (UI, pomiar 568×320; QA R28). Nie zasłania `AT RISK` ani pól w promieniu 3 od `@`. Prostokąt paska jest zgłaszany kamerze jako prostokąt UI, więc kamera przesuwa widok tak, żeby `@` i pola w promieniu 3 nie leżały pod paskiem. Na PC: dół ekranu, środek. **Rozmiar (UI):** **16 px, maks. 2 linie** (np. 667×375 poziomo). **14 px tylko na ekranach o wysokości < 360 px** (np. 568×320: maks. 3 linie) **i w pionie** (1 linia nad kontrolkami). To wyjątek od minimum 16 px (decyzja Mechanik, GD może zmienić);
  - **chowanie przy zagrożeniu (QA R28, retest):** pasek znika (fade 150 ms), gdy pod jego prostokątem jest wróg w stanie ALERT, CHASE albo ATTACK, jego zapowiedź albo pas szarży; wraca, gdy pod nim nic takiego nie ma (`TUT_HINT_HIDE_ON_THREAT` = true). Ochrona 3 pól od `@` zostaje;
  - **pierwszeństwo komunikatów HUD:** alarm windy (`M1_SYS_05`), niskie HP i komunikaty `AT RISK` mają pierwszeństwo przed paskiem nauki. Pasek chowa się na ich czas i potem wraca z tą samą podpowiedzią. Przerwana podpowiedź liczy się do limitu 2 pokazów tylko wtedy, gdy była widoczna **≥ 2 s** (`TUT_HINT_MIN_VISIBLE_MS` = 2000);
  - znika po zaliczeniu albo po 4 s (`TUT_HINT_MS` = 4000); tap w pasek zamyka podpowiedź (liczy się jako pokaz);
  - podpowiedzi nie pauzują gry. Jedyny wyjątek to jednorazowe zamrożenie przy pierwszej zapowiedzi (T04).
- **Dotyk i klawiatura osobno:** każda podpowiedź sterowania ma wariant **T** (dotyk) i **K** (klawiatura), wybierany według ostatniego urządzenia wejścia (`prog/sterowanie.md`). Klawisze w tekstach K to tokeny mapowania (`{KEY_ATK}`, `{KEY_USE}`, `{KEY_HEAL}`, `{KEY_SK1}`…, a w menu `{KEY_CONFIRM}` = Enter), więc przemapowanie nie psuje tekstu.
- **Pominięcie przy kolejnych podejściach:**
  - każdy ID ma flagę `tutSeen` w zapisie, po zaliczeniu nie wraca, a bez zaliczenia pokazuje się maks. 2 razy (`TUT_HINT_MAX_SHOWS`);
  - w ustawieniach jest przełącznik „Hints” (`M1_TUT_SETTING`, domyślnie ON);
  - **„Skip tutorial” (decyzja GD, v0.5.2):**
    - **Gdzie:** tylko przy **tworzeniu nowego zapisu** (NEW GAME, także NEW GAME z okna błędu wczytania), po potwierdzeniu nowej gry, **przed pierwszym wydrukiem**. Okno pokazuje się, gdy flaga urządzenia **`DEVICE_PROLOGUE_DONE`** = true. Flaga leży **poza zapisem** (osobny klucz localStorage, Silnik), nie jest eksportowana z zapisem i nie znika przy NEW GAME. Ustawia się przy pierwszym powrocie do bazy po First Light w dowolnym zapisie na tym urządzeniu, a także przy wczytaniu albo imporcie zapisu, który ma First Light.
    - **Okno:** tekst **`M1_TUT_SKIP_PROLOGUE`** (sens: „You know the start. Skip the tutorial?”), przyciski z osobnymi ID: **`M1_TUT_SKIP_PROLOGUE_YES`** „SKIP” (pomiń Prolog) i **`M1_TUT_SKIP_PROLOGUE_NO`** „PLAY” (graj Prolog), maks. 8 znaków. **Domyślny fokus i Esc = PLAY.** **Po SKIP** pojawia się drugie okno **`M1_TUT_SKIP`** („You know the start. Show hints?”) z przyciskami **`M1_TUT_SKIP_YES`** / **`M1_TUT_SKIP_NO`**, **fokus i Esc = YES**. Decyduje, czy gracz, który pominął Prolog, dostaje pozostałe podpowiedzi (T12, T13 i powtórki): odpowiedź ustawia przełącznik „Hints” w tym zapisie. **Po PLAY drugiego okna nie ma** (Prolog z podpowiedziami wg „Hints”, domyślnie ON). Element UI: okno modalne w menu przed grą (bez świata pod spodem), przyciski ≥ 48 px. Później opcji nie ma (ani w pauzie, ani w ustawieniach); same podpowiedzi wyłącza przełącznik „Hints”.
    - **Stan po pominięciu = stan po ukończeniu Prologu** (bez łupu, którego gracz nie zebrał):
      - rozwiązany terminal `M1_TERM_04` (First Light): fragment sieci 10%, `grid_pct` = 10;
      - odblokowane Dash i Shock Pulse (biegłość 0);
      - nagroda kontraktu Relay z Prologu: **35 kr** na koncie w bazie (fragment już wliczony wyżej);
      - Issue (Pole, Suit), Med-Patche do `{ISSUE_MEDPATCH_TOPUP}` przy pierwszym wyjeździe, pusta skrytka, pusty plecak, półka automatu wylosowana;
      - flagi `tutSeen` dla T01–T11 ustawione; **T12 (Buddy Drone) i T13 (kontrakty) zostają nieodhaczone**, bo dotyczą czasu po Prologu; pokazują się tylko przy „Show hints?” = YES (T13 przy pierwszym wejściu do bazy);
      - fabuła: zdarzenia `M1_BASE_01`/`02` i First Light oznaczone jako widziane; notatki z Prologu **nie** są oznaczone jako przeczytane (gracz znajdzie je w kolejnych wyprawach);
      - `riskExplainerSeen` = false (wyjaśnienie straty działa raz na zapis, jak zawsze);
      - tablica kontraktów jak po pierwszym powrocie (Relay g1 ze slotu Prologu ukończony, sloty wylosowane na nowo).
    - Pominięcie nie zmienia trudności ani statystyk (Z-GD2). Układ Prologu (wstawki LD) przestaje obowiązywać, bo First Light jest już zapalony.
  - Pytanie `M1_TUT_SKIP` („Show hints?”) z v0.5 **zostaje** jako drugie okno **po wyborze SKIP** w „Skip tutorial” (wyżej). Po PLAY się nie pokazuje.

**Kolejność i kroki** (teksty podpowiedzi wg `fabula/teksty-m1-en.md` §12.3, zatwierdzone przez GD; przy rozjeździe obowiązuje plik tekstów):

| # | Mechanika | Sytuacja w grze | Warunek zaliczenia | Porażka / brak reakcji | Podpowiedź (robocze ID: sens) | Element UI (do uzgodnienia z UI i Menu) |
|---|---|---|---|---|---|---|
| T01 | Ruch | **wejście na głęb. 1** (pierwsze pojawienie się przy wejściu poziomu; baza to menu bez chodzenia, 2.14a) | 3 kroki | 4 s bez ruchu → podpowiedź | `M1_TUT_01T` „Drag here to move.” / `M1_TUT_01K` „Move: {KEY_MOVE}.” | T: pulsujący „duch” joysticka w lewej strefie; K: znaki klawiszy obok `@` |
| T02 | Wyjazd (baza) | baza (menu-hub) po wydruku; T02 dzieje się **przed** T01 | wybór LIFT → wyjazd (przy jednym przystanku bez okna wyboru) | 3 s w bazie bez wyboru LIFT | `M1_TUT_02T` „Tap LIFT to go down.” / `M1_TUT_02K` „Choose LIFT. Press {KEY_CONFIRM} to go down.” (`{KEY_CONFIRM}` = Enter) | **puls przycisku LIFT** w menu bazy. USE w strefie uczy T08 |
| T03 | Atak i bump | głęb. 1, samotny Scrapper w IDLE | zabić Scrappera | 6 s w zasięgu 1 bez ataku | `M1_TUT_03T` „Walk into it to hit. Or tap ATK.” / `M1_TUT_03K` „Walk into it, or press {KEY_ATK}.” | ATK pulsuje; nad wrogiem liczby obrażeń (już są) |
| T04 | Zapowiedź i unik | Curfew Guard w otwartym pomieszczeniu | **2 uniki** (pudło po zejściu z pola) | pierwsza zapowiedź na gracza: **zamrożenie 100 ms po starcie** (raz na zapis, `TUT_TELEGRAPH_FREEZE_AT_MS`); po trafieniu przy następnej zapowiedzi tekst bez zamrożenia (maks. 2 razy) | `M1_TUT_04` „! means attack. Step off the x.” · `M1_TUT_04B` „Move away when you see !” | przy zamrożeniu **`@` i wróg z zapowiedzią (z `!`, odwróconą komórką i `x`) bez przyciemnienia**, reszta ekranu przyciemniona. **Auto-pauza ma pierwszeństwo:** po RESUME i odliczaniu 1,0 s zamrożenie wraca w tym samym stanie (bez powtórzenia i bez nowego licznika). **Wznowienie: dowolny kierunek ruchu**, a krok wykonuje się w tym samym ticku. **Po wznowieniu zostaje zapowiedź wroga − 100 ms** (QA R26): przy Curfew Guardzie (600 ms) **500 ms**, przy wrogu z 450 ms 350 ms. Bez odliczania 1 s |
| T05 | Med-Patch | HP ≤ 60% i patche > 0 (zwykle po Guardzie) | użycie patcha | HP ≤ 30% → ponownie, mocniejszy puls | `M1_TUT_05T` „Tap [+] to heal.” / `M1_TUT_05K` „Press {KEY_HEAL} to heal.” | `[+]` pulsuje; licznik błyska przy podniesieniu `+` ze skrzyni |
| T06 | Dash (sk1) | pierwszy raz ≥ 2 wrogów w zasięgu 1 (para Scrapperów) albo HP ≤ 40% z wrogiem obok | użycie Dash | brak, podpowiedź wraca przy następnej takiej sytuacji (maks. 2) | `M1_TUT_06T` „Tap DASH to jump away.” / `M1_TUT_06K` „Press {KEY_SK1} to dash away.” | slot sk1 podświetlony; etykieta slotu `M1_HUD_SK1` „DASH” |
| T07 | Plecak i `AT RISK` | pierwszy podniesiony przedmiot (`AT RISK` rośnie od 0); potem plecak ≥ 9/12 | informacja (pokazana) | — | `M1_TUT_07` „AT RISK: you lose this if you die.” · `M1_TUT_08` „Bag almost full.” | błysk `AT RISK` i licznika plecaka w HUD; w tooltipie `M1_RISK_02` (2.7a) |
| T08 | USE i terminal | terminal `&` (wariant 04), pokój bez wrogów (LD) | rozwiązanie (First Light, `M1_BASE_09`, `M1_SKILL_UNLOCK`) | błąd: komunikat wg rodzaju (Lore §11): **`M1_TERM_FAIL` tylko OVERLOAD**, osobno `M1_TERM_TRIP` (zły podział), `M1_TERM_FUSE` (ponad limit), `M1_TERM_SHORT` (pierścień), `M1_TERM_LOW` (za mało mocy); do tego kara 1,5 s i podpowiedź `?` (`zagadki-m1/`); wróg w pobliżu: `M1_SYS_04` | `M1_TUT_09T` „Tap USE at the terminal.” / `M1_TUT_09K` „Press {KEY_USE} at the terminal.” | USE pulsuje w zasięgu 1; zasady zagadki uczy sam wariant 04 |
| T09 | Shock Pulse (sk2) | pierwsza zapowiedź wroga w promieniu 2 po odblokowaniu | przerwana zapowiedź | brak (maks. 2 pokazy) | `M1_TUT_10T` „Tap PULSE to stop the attack.” / `M1_TUT_10K` „Press {KEY_SK2} to stop the attack.” | slot sk2 podświetlony w chwili zapowiedzi; etykieta `M1_HUD_SK2` „PULSE” |
| T10 | Ewakuacja | po First Light | ewakuacja | przerwane wezwanie → `M1_TUT_13`; spóźnienie → `M1_BASE_07`, strzałka dalej aktywna | `M1_TUT_11` (BASE) „Now go back to the lift.” · przy szybie `M1_TUT_12T` „Hold USE to call the lift.” / `M1_TUT_12K` „Hold {KEY_USE} to call the lift.” · `M1_TUT_13` „Stand still and keep holding.” | **strzałka do szybu** na brzegu ekranu (komponent strzałki zwłok, w Prologu włączony do pierwszej ewakuacji); USE z pierścieniem postępu przytrzymania; odliczanie dojazdu |
| T10a | Alarm windy (v0.5.2, R6 A) | pierwsze udane wezwanie windy (start dojazdu) | informacja (zaliczone przy pierwszej ewakuacji) | przy przyjeździe zawsze `M1_SYS_05` i szary `!` nad ściągniętymi wrogami (to zwykła zasada, nie nauka) | `M1_TUT_18` „Enemies come to the lift. Get in fast.” | odliczanie dojazdu w HUD pulsuje; przy przyjeździe szary `!` nad ściągniętymi wrogami |
| T11 | Śmierć i Issue | nie wymuszamy. Pierwsza śmierć: z łupem → 2.7a; bez łupu → `M1_TUT_14`. Pierwsze otwarcie sprzętu w bazie → `M1_TUT_15` | informacja | — | `M1_TUT_14` „New print complete. Your base, grid and skills are safe.” · `M1_TUT_15` „Issue gear is always yours. The rest can be lost.” | panel po wydruku; znaczniki `M1_RISK_02` / `03` na slotach |
| T12 | Buddy Drone (sk3, po Prologu) | pierwsza grupa ≥ 3 wrogów po odblokowaniu (głęb. 2) | użycie drona | brak (maks. 2) | `M1_TUT_16T` „Tap DRONE. Enemies near it attack it.” / `M1_TUT_16K` „Press {KEY_SK3}. Enemies near it attack it.” | slot sk3 podświetlony; etykieta `M1_HUD_SK3` „DRONE” |
| T13 | Kontrakty (koniec Prologu) | pierwszy powrót do bazy po First Light | informacja | — | `M1_TUT_17` „Short orders. Each takes a few minutes.” | podświetlenie tablicy kontraktów |

**Lista elementów UI do uzgodnienia z UI i Menu:**
1. pasek podpowiedzi (1 linia, **dół ekranu, środek**, między joystickiem a przyciskami; prostokąt zgłaszany kamerze, nie zasłania `AT RISK` ani pól w promieniu 3 od `@`);
2. „duch” joysticka i znaki klawiszy przy `@`;
3. puls przycisków ATK / USE / `[+]` / sk1–3; etykiety slotów `M1_HUD_SK1`–`3` (DASH / PULSE / DRONE);
4. zamrożenie nauki z przyciemnieniem i podświetleniem zapowiedzi;
5. błysk `AT RISK` i licznika plecaka;
6. strzałka do szybu (Prolog);
7. pierścień przytrzymania USE (1,0 s), odliczanie dojazdu, szary `!` nad wrogami ściągniętymi alarmem przy przyjeździe windy (T10a);
8. przełącznik „Hints” (`M1_TUT_SETTING`);
9. okno „Skip tutorial” przy nowym zapisie (`M1_TUT_SKIP_PROLOGUE`, przyciski `M1_TUT_SKIP_PROLOGUE_YES` „SKIP” / `_NO` „PLAY”, fokus i Esc = PLAY) i **po SKIP** okno „Show hints?” (`M1_TUT_SKIP`, przyciski `M1_TUT_SKIP_YES` / `_NO`, fokus i Esc = YES);
10. okno potwierdzenia zejścia (STAY zostawia na `>`), wariant bramy areny `M1_RISK_01B`, znacznik „can be lost”, 2-stronicowy panel wyjaśnienia (NEXT, OK) (2.7a);
11. linie przyczyny śmierci, podświetlenie zabójcy, przycisk NEXT (2.7).

**Mapowanie H1–H15 (`prog/ui-m1.md` §7) → T01–T13 (obowiązuje T, odpowiedź na M14):**

| H (UI) | → T | Co zostaje / co odpada |
|---|---|---|
| H1 ruch | T01 | zostaje; wyzwalacz 4 s bez ruchu (nie 2 s), zaliczenie 3 kroki |
| H2 pierwszy ALERT | — | **odpada**: szary `!` jest czytelny sam; tekst tylko przy alarmie windy (T10a) |
| H3 zapowiedź na polu gracza | T04 | zostaje jako T04 z jednorazowym zamrożeniem i 2 unikami |
| H4 pierwszy wróg obok | T03 | zostaje; wyzwalacz 6 s w zasięgu 1 bez ataku |
| H5 Dash po zapowiedzi | T06 | zostaje, ale wyzwalacz to ≥ 2 wrogów w zasięgu 1 albo HP ≤ 40% z wrogiem obok |
| H6 pierwszy sprzęt w zasięgu | T07 | **łączy się z T07**: podnoszenie pokazuje sam przycisk USE (puls), tekst dopiero o `AT RISK` |
| H7 `AT RISK` | T07 | zostaje (`M1_TUT_07`, potem `M1_TUT_08` przy 9/12); nie jest wymagana przed pierwszym `>`, bo `>` ma własne okno (2.7a) |
| H8 HP < 50% | T05 | zostaje; próg HP ≤ 60%, drugi pokaz przy ≤ 30% |
| H9 pierwszy szyb | T10 | zostaje (przytrzymanie USE) |
| H10 wezwanie windy | T10 / T10a | `M1_SYS_05` przy **przyjeździe** (R6 A); ostrzeżenie przed alarmem to T10a (`M1_TUT_18`) |
| H11 pierwszy terminal | T08 | zostaje |
| H12 terminal w walce | T08 | zostaje jako zwykły komunikat `M1_SYS_04` (nie podpowiedź nauki) |
| H13 odblokowane umiejętności | T09 / T12 | zostaje osobno dla Shock Pulse (T09) i Buddy Drone (T12); `M1_SKILL_UNLOCK` bez zmian |
| H14 pierwszy `>` | 2.7a | **odpada z nauki**: rolę pełni okno potwierdzenia zejścia |
| H15 pierwsza śmierć z łupem | T11 / 2.7a | zostaje jako `M1_RISK_04` (2 strony); bez łupu `M1_TUT_14` |
| — | T02, T13 | **nowe względem H**: USE przy windzie w bazie (T02), tablica kontraktów (T13) |

Czas pokazu: 4 s (`TUT_HINT_MS`), nie 6 s z propozycji UI. ID tekstów nauki to `M1_TUT_*` (Lore §12.3), a nie `M1_HINT_*` z `prog/ui-m1.md` §8.

---

## M2 – pierwszy system łagodzący: Recovery Beacon

**Status:** projekt na M2 (nie wchodzi do M1). Przeniesiony z v0.2 (dawne 2.6–2.7) decyzją GD i uzupełniony ustaleniami z Silnikiem. W M1 w kodzie są tylko haki za flagami (2.7).

### M2.1 Odblokowanie i idea
- **Ulepszenie BASE „Recovery Beacon”** (trwałe, drugie ulepszenie bazy). Koszt roboczy: **400 kr + 25 Copper (R)**, warunek: zapalone ≥ 50% sektora 1 (do Balansu). Fabuła: BASE dostaje sygnał z ciała łowcy (tekst do Dialogów i Lore).
- Po zbudowaniu zwłoki zachowują ryzykowny inwentarz, a gracz może spróbować go odzyskać w **następnej wyprawie**. **Odzysk nigdy nie jest pewny (Z-GD1):** grozi wyścig ze Zbieraczami i ponowna śmierć po drodze. Przystanki windy (trwały postęp) stają się realnym środkiem łagodzącym, bo skracają drogę do zwłok.
- Flagi: `CORPSE_RECOVERY_ENABLED`, `CORPSE_ARROW_ENABLED`, `ZONE_PERSIST_ENABLED` = `true` po zbudowaniu ulepszenia.

### M2.2 Zachowanie strefy (ustalenia z PROG / Silnik)
- Gdy powstają zwłoki z łupem, zapis przechowuje **opis instancji strefy na jedną kolejną wyprawę**:
  - `zoneSeed` + **głębokość** + `generatorVersion`,
  - **lista zmian** względem wygenerowanego poziomu: zwłoki (komórka i zawartość), otwarte skrzynie i rozwiązane terminale, zabici unikalni wrogowie i boss.
- **Zwykli wrogowie i zwykły łup odradzają się przy ponownym wejściu na poziom** (poziom generuje się od nowa z tego samego ziarna, a lista zmian jest nakładana na wynik). W trakcie pobytu na poziomie nikt się nie odradza (2.11).
- **Niezgodny `generatorVersion`** (aktualizacja gry między sesjami): zwłoki lądują na **najbliższej wolnej komórce przy wejściu do strefy** (na poziomie zwłok), żeby aktualizacja nigdy nie zabrała graczowi szansy na odzysk.
- **Zegar zwłok `corpseTicksLeft`:** liczony w tickach strefy, **tylko gdy gracz jest w strefie i gra nie jest zapauzowana**. Baza, menu, pauza i zamknięta karta go nie ruszają. Jest zapisywany w stanie gry. Wartość startowa = czas przyjścia Zbieraczy: **50 / 45 / 40 s** (1000 / 900 / 800 ticków) dla głęb. 1/2/3 (v0.5, Balans; było 75 / 60 / 45 s). Po jego upływie zaczyna się rozbiórka: **1 przedmiot (lub 1 stos) co 6 s**.
- **Koniec:** po tej jednej wyprawie (ewakuacja lub śmierć) albo po opróżnieniu zwłok zwłoki znikają, a następna wyprawa dostaje **nowe ziarno**.

### M2.3 Zasady zwłok i odzysku
- **Jedne zwłoki naraz.** Śmierć przed odzyskaniem starych zwłok: stare przepadają, nowe je zastępują.
- Zwłoki czekają na **jedną następną wyprawę**. Czas w bazie i sesje mikro (Exchange) się nie liczą: zwłoki czekają.
- **Strzałka do zwłok** na brzegu ekranu (na poziomie zwłok) i znacznik na mapie sektora. Gracz wie, gdzie iść, ale nie wie, czy zdąży.
- **Odzysk: przytrzymanie USE** przy zwłokach (zasięg 1) przez **1,0 s**. Przerywa je puszczenie, ruch albo obrażenia. Zabiera wszystko, co się zmieści: przedmioty, które były założone, wracają na swoje sloty, jeśli jest tam Issue, reszta idzie do plecaka, a nadmiar zostaje w zwłokach.
- **Bez losowego uszkodzenia przy śmierci** (decyzja GD w v0.3).

### M2.4 Zbieracze i zwłoki
| Parametr | Głęb. 1 | Głęb. 2 | Głęb. 3 |
|---|---|---|---|
| Przybycie Zbieraczy (`corpseTicksLeft` startowo) | **50 s** | **45 s** | **40 s** (v0.5, Balans; było 75 / 60 / 45 s) |
| Grupa | 2 Zbieraczy | 2 | 3 |
| Nory na poziom (Level Design) | 2 | 3 | 3 |

- **Nory (`level-design-m1.md` §2):** punkty w ścianie, min. **30 pól** między norami i min. **10 pól** od szybu i wejścia. Zbieracze wychodzą z **najbliższej nory odległej o ≥ 20 pól** od zwłok (generator gwarantuje, że taka istnieje dla każdego pola). Idą do zwłok po statycznej mapie odległości do zwłok.
- **Rozbiórka:** 1 losowy przedmiot lub stos co 6 s na całą grupę. Każdy zabrany przedmiot trafia do „kieszeni” konkretnego Zbieracza.
- **Wygląd Zbieracza z łupem (GRAF §9):** tło komórki w kolorze tła rzadkości najlepszego zabranego przedmiotu, a co 600 ms glif na 200 ms zmienia się z `s` na znak slotu (`/ [ " (`, `:`, `§`). Przy „Reduce motion” zamiast tego stałe podkreślenie `_`.
- **Ucieczka:** gdy gracz podejdzie na **≤ 6 pól** z linią wzroku, Zbieracze z łupem uciekają do nory (200 ms/pole, gracz dogania o ~1,7 pola/s). Po dotarciu do nory znikają razem z łupem. Zbieracze bez łupu walczą normalnie.
- **Zabicie Zbieracza z łupem:** każdy zabrany przedmiot ma **50% szans** na powrót w całości, w przeciwnym razie zamienia się w Scrap (3 / 8 / 20 szt. zależnie od rzadkości).
- **Komunikaty:** `M2_SYS_01` (wyruszają, ikona zwłok na strzałce zmienia się na `!`), `M2_SYS_02` (ucieczka z łupem), `M2_SYS_03` (zniknięcie w norze).
- **AI:** mapy statyczne do nor (ucieczka) i do zwłok (marsz), liczone raz na zdarzenie. Ruch jak w 2.10.

### M2.5 Symulacja odzysku (przeliczona bez 20% uszkodzenia, 50 000 prób na wariant)
Założenia:
- zwłoki z 12 przedmiotami (4 założone + 8 w plecaku), Zbieracze jak w M2.4;
- uciekającego Zbieracza udaje się zabić w 80% przypadków;
- ryzyko ponownej śmierci w drodze: 5 / 10 / 15% (głęb. 1/2/3);
- czas dojścia do zwłok (rozkład trójkątny): z przystanku windy 40–130 s (moda 70 s); bez przystanku na głęb. 2: 120–300 s, na głęb. 3: 200–420 s.

| Wariant | Średni odzysk | Odzysk 100% | Odzysk 0% | (v0.2 z 20% uszkodzenia: średni odzysk) |
|---|---|---|---|---|
| Głęb. 1 (winda zawsze dojeżdża) | **85%** | 49% | 5% | 67% |
| Głęb. 2, z przystankiem windy | **72%** | 21% | 10% | 55% |
| Głęb. 2, bez przystanku | **36%** | 0% | 28% | 29% |
| Głęb. 3, z przystankiem | **58%** | 5% | 16% | 42% |
| Głęb. 3, bez przystanku | **34%** | 0% | 32% | 27% |

Wnioski:
- **Odzysk nigdy nie jest pewny (Z-GD1):** w każdym wariancie jest ≥ 5% szans na 0% i ≤ 49% szans na 100%.
- Przystanki windy mają duże znaczenie (głęb. 2: 72% vs 36%).
- Bez 20% uszkodzenia odzysk na głęb. 1 jest hojny (85% średnio, 49% pełnych odzysków). **Do strojenia w M2 przez Balans:** jeśli to za dużo, krótszy zegar na głęb. 1 (np. 60 s) albo koszt „ładowania” Beacona. **v0.5: Balans przestroił zegar na 50 / 45 / 40 s** (`odzysk_m2.py`, skalibrowany do tabeli wyżej). Średni odzysk to **69 / 61 / 55%** (głęb. 1 / 2 i 3 z przystankiem), maleje z głębokością, a Z-GD1 jest zachowane (≥ 5% szans na 0% w każdym wariancie). Tabela wyżej pokazuje stary zegar 75 / 60 / 45 s jako punkt kalibracji.

### M2.6 Parametry M2 (robocze)
| Nazwa | Wartość | Jednostka | Uwagi |
|---|---|---|---|
| `BEACON_UPGRADE_COST` | 400 kr + 25 Copper | | warunek ≥ 50% sektora; potwierdzone przez Balans |
| `CORPSE_MAX` | 1 | szt. | |
| `CORPSE_LIFETIME_EXPEDITIONS` | 1 | wyprawy | |
| `CORPSE_LOOT_HOLD_MS` | 1000 | ms | przytrzymanie USE |
| `CORPSE_TICKS_START` | 1000 / 900 / 800 | ticki (50 / 45 / 40 s) | `corpseTicksLeft`; Balans v0.5 (średni odzysk 69 / 61 / 55%) |
| `SCRAPPER_GROUP` | 2 / 2 / 3 | szt. | |
| `SCRAPPER_DISMANTLE_MS` | 6000 | ms/przedmiot | |
| `SCRAPPER_FLEE_TRIGGER` | 6 | pola | + linia wzroku |
| `SCRAPPER_BURROW_MIN_DIST` | 20 | pola (BFS) | od zwłok |
| `BURROWS_PER_LEVEL` | 2 / 3 / 3 | szt. | LD |
| `BURROW_MIN_SPACING` | 30 | pola (BFS) | LD |
| `BURROW_MIN_DIST_ENTRY_SHAFT` | 10 | pola (BFS) | LD |
| `SCRAPPER_DROP_INTACT` | 0,5 | — | |
| `DESTROYED_TO_SCRAP` | 3 / 8 / 20 | szt. | tylko przy przedmiotach „rozebranych” przez Zbieracza |
| Zapis strefy | `zoneSeed`, głębokość, `generatorVersion`, lista zmian | | ustalenie z Silnikiem |

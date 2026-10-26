# Teksty gry M1 (EN): Prolog + Sector 1 „Ashfield Yards”

> **Status: ZATWIERDZONE przez Game Directora (25.10.2026).** Decyzje: teaser w wersji ludzkiej; po śmierci nadal „Hunter 47”; wszystkie elementy [NEW] zatwierdzone; prefiks „Tuned-Up” zmieniony na „Ready”; Scrapper zostaje z „bodies”; notatki M1 neutralne (cytat 3:12 w M2); związek M1_TERM_08 z ulepszeniem bazy rozstrzygają Mechaniki; rozbieżność #46 rozstrzyga Scenarzysta.
Autor: [GRA][FABUŁA] Dialogi i Lore, 25.10.2026. Wersja zatwierdzona.

**Źródła:** /workspace/GRA/fabula-reprint.md (zatwierdzona fabuła, zastrzeżenia GD w sekcji 10), /workspace/GRA/fabula/zakres-m1.md (zakres M1, lista slotów w sekcji 9), kontekst: wizja-gry.md, plan-produkcji.md, prog/sterowanie.md (okno tekstu: fragmenty po 2–3 zdania, czytanie pauzuje grę).

**Zastosowane zasady:**
- Angielski A2: proste słowa, krótkie zdania, maks. 2–3 zdania na fragment (jeden fragment = jedna strona okna tekstu).
- BASE w M1 jest całkowicie „czysta”: bez zniekształceń, bez dziwnego tonu. Zniekształcony jest tylko sygnał w teaserze (M1_TEASE_02).
- Nie pada nazwa WARDEN, Static/Szum ani Quiet Protocol. Wrogowie są „broken / wrong orders”, bez wskazania przyczyny.
- Liczby i nazwy mechaniczne to placeholdery w nawiasach kwadratowych: `[..._TBD]`.
- Dodatki spoza pierwotnej fabuły zostały zatwierdzone przez Game Directora.
- Ton: cisza, pustka, melancholia, odrobina suchego humoru maszyn. Bez horroru i patosu.
- `{zmienna}` = wartość wstawiana przez kod (prawdziwa liczba z gry, zgodnie z zastrzeżeniem GD).

---

> **Limity tekstu od UI (`prog/ui-m1.md` §13, 25.10.2026, liczone PO podstawieniu tokenów):**
> - pasek nauki `M1_TUT_*`: **≤ 38 znaków** (maks. 8 słów);
> - okno potwierdzenia (`M1_RISK_01/01B`, `M1_TUT_SKIP`): **44 zn./linię, ≤ 80**;
> - panel wyjaśnienia (`M1_RISK_04`, baza): **50 zn./linię, ≤ 300**;
> - podpowiedź terminala TIP: **≤ 90 (twardy limit)**, cel ≤ 80;
> - ~~typ w wierszu odbiornika ≤ 8~~ – nieaktualne: w M1 brak typów (GD q22 = c).

## 1. BASE (terminal bunkra)

| ID | Moment | Tekst |
|---|---|---|
| M1_BASE_01 | Pierwszy wydruk (Prolog) | Hunter 47. Print complete. Grid status: dark. |
| M1_BASE_02 | Pierwsze polecenie (Prolog) | Your task is simple. Go up, find the power lines, and turn them back on. The lift is ready. |
| M1_BASE_03 | Kolejny wydruk po śmierci (poprawione 25.10: brak odzysku w M1, QA R1, kierunek GD). **Warunek (GD):** pokazywać, gdy `{items_lost}` > 0 lub `{cr_lost}` > 0 | Hunter 47. Print complete. Your gear is gone. Your memory is here. |
| M1_BASE_03B | Kolejny wydruk po śmierci, gdy nic nie przepadło poza Issue (`{items_lost}` = 0 i `{cr_lost}` = 0, np. w Prologu). Zatwierdzone przez GD 25.10.2026 | Hunter 47. Print complete. Your memory is here. |
| M1_BASE_04 | Komunikat śmierci (ekran śmierci) | Signal lost. Hunter 47 is down. Starting a new print. |
| M1_BASE_05 | Powrót do bazy windą | Welcome back, Hunter 47. Syncing memory. Please do not move during the sync. |
| M1_BASE_06 | Przyjazd windy ewakuacyjnej (pokazywane w chwili przyjazdu, nie przy wezwaniu) | The lift is here. I can hold it for 10 seconds. Please be fast. |
| M1_BASE_07 | Okno ewakuacji się zamyka | The lift is going down. I cannot hold it longer. Call again when you can. |
| M1_BASE_08 | Ulepszenie bazy: światła na powierzchni | Power to the bunker is back. The lights above the base are on. You can see them from the zone now. |
| M1_BASE_09 | Zapalony fragment mapy sektora | Line restored. A new part of Sector 1 is on the map. Good work. |
| M1_BASE_10 | Nowy kontrakt dostępny | New order on the terminal. It is short. You can do it before the next long run. |
| M1_BASE_11 | Nagłówek podsumowania | SESSION REPORT — HUNTER 47 |
| M1_BASE_12 | Wiersze podsumowania | Time in zone: {time} · Deepest level: {depth} · Items brought back: {items_in} · Items left in zone: {items_lost} · Credits: {credits} · Grid restored: {grid_pct}% |
| M1_BASE_13 | Stopka podsumowania (udany powrót) | All data is saved. The grid is a little less dark. |
| M1_BASE_14 | Stopka podsumowania (po śmierci; poprawione 25.10: brak odzysku w M1, QA R1, kierunek GD). **Warunek (GD):** `{items_lost}` > 0 lub `{cr_lost}` > 0 | All data is saved. Your gear is gone. |
| M1_BASE_14B | Stopka podsumowania po śmierci, gdy nic nie przepadło poza Issue (`{items_lost}` = 0 i `{cr_lost}` = 0). Zatwierdzone przez GD 25.10.2026 | All data is saved. Nothing was lost. |

## 2. Exchange (automat handlowy w bazie)

| ID | Moment | Tekst |
|---|---|---|
| M1_EXCH_01 | Powitanie | EXCHANGE ONLINE. Supply must keep flowing. How can I help you, customer? |
| M1_EXCH_02 | Kupno | Purchase complete. Thank you for keeping supply flowing. |
| M1_EXCH_03 | Sprzedaż | Item accepted. {credits} Grid credits added. Scrap is also supply. |
| M1_EXCH_04 | Brak kredytów | Not enough credits. Please bring more scrap. I am always open. |
| M1_EXCH_05 | Pełny ekwipunek | Your bag is full. I cannot give you more. Please sell something first. |
| M1_EXCH_06 | Pożegnanie | Come back soon. You are my only customer this year. |

## 3. Opisy miejsc

| ID | Miejsce | Tekst |
|---|---|---|
| M1_LOC_BASE | Baza „Vat Station 3” | A small bunker under an old substation. The Reprint Vat hums in the middle of the room. There is a terminal, a locker, a vending machine, and a lift up. |
| M1_LOC_D1 | Głębokość 1: Surface / Outskirts | Empty houses stand in long rows. Car doors are still open, and bags lie on the road. People left in a hurry. |
| M1_LOC_D2 | Głębokość 2: Solar Fields | Long lines of dark solar panels go to the horizon. Small drones still fly over them. They do not clean anymore. |
| M1_LOC_D3 | Głębokość 3: Rail Depot | A big rail hall with cold trains inside. The gate is closed, and a red light blinks over it. Something big is still on guard here. |
| M1_LOC_EVAC | Punkt ewakuacji: szyb windy serwisowej | A narrow service lift goes down to the bunker. A small screen says: "CALL BASE". The lift does not wait long. |

## 4. Notatki w świecie i zapisek #46

### 4.1. Zapisek #46 (zwłoki na głębokości 2, Solar Fields)
| ID | Tekst |
|---|---|
| M1_NOTE_46_TITLE | HUNTER 46 — LAST ENTRY |
| M1_NOTE_46 | If you read this, you are the next one. Don't trust the quiet. |
| M1_NOTE_46_BODY | (opis zwłok przy interakcji) A hunter lies between the panels. The suit looks like yours. The number on the arm says 46. |

### 4.2. Notatki mieszkańców (głębokość 1)
| ID | Tytuł | Tekst |
|---|---|---|
| M1_NOTE_01 | Note on a fridge | Mia, the power is out again. We are going to the station. Take the blue bag and come fast. |
| M1_NOTE_02 | Note on a door | We are not here. Please don't break the door. We will come back soon. |
| M1_NOTE_03 | Shopping list | Water, bread, batteries, more batteries. The shop is closed. Everything is closed. |
| M1_NOTE_04 | Child's drawing | A drawing of a house with a big yellow sun. Under it: "When the lights come back, we come back." |

### 4.3. Notatki techników farmy (głębokość 2)
| ID | Tytuł | Tekst |
|---|---|---|
| M1_NOTE_05 | Maintenance tag | Panel row 12: drone did not stop at the end of the row. Turned it off by hand. Check its orders. |
| M1_NOTE_06 | Shift note | All drones are back in the dock, but nobody sent them back. Line A has no power. I am going home. |

### 4.4. Notatki pracowników depot (głębokość 3)
| ID | Tytuł | Tekst |
|---|---|---|
| M1_NOTE_07 | Depot log, page 1 | Alarm at the depot. The rail guard closed all tracks. Order: "Hold until the alarm is cancelled." |
| M1_NOTE_08 | Depot log, page 2 | We tried to cancel the alarm. The terminal said: "No authority." The last train left without us. |
| M1_NOTE_09 | Note on a locker | Spare fuses are in box 3. If the guard is still on, do not walk on track 2. |

## 5. Terminale: Power Lines, Line 1 (konteksty wariantów)

| ID | Element | Tekst |
|---|---|---|
| M1_TERM_HEADER | Nagłówek każdego terminala | BASE ORDER: POWER LINES — LINE 1. Send power to the right places. Do not overload the lines. |
| M1_TERM_01 | Wariant: farma solarna | This box sent power from the solar farm to the town. Now the farm is dark, and the town is dark too. |
| M1_TERM_02 | Wariant: stacja pomp | This pump station gave water to every house in Ashfield. The pumps are still, and the pipes are dry. |
| M1_TERM_03 | Wariant: hala depot | This box powered the lights and doors in the rail hall. Without it, the trains sleep in the dark. |
| M1_TERM_04 | Wariant: osiedle | Power for forty homes went through this box. Someone wrote on it: "Please fix soon." |
| M1_TERM_05 | Wariant: dok dronów | The service drones charged here every night. Some still come back and wait for power. |
| M1_TERM_06 | Wariant: przejazd kolejowy | This box ran the lights and gates at the rail crossing. The gates are down, and they will not go up. |
| M1_TERM_07 | Wariant: sklep na rogu | A small shop used this box for its fridges and lights. The sign still says "OPEN 24 HOURS". |
| M1_TERM_08 | Wariant: przekaźnik do bunkra | This line goes down to your bunker. Fix it, and BASE can turn on the lights above the base. |
| M1_TERM_OK | Rozwiązanie | Line restored. Power is flowing. Map updated. |
| M1_TERM_FAIL | Przeciążenie | Overload. The line is off for now. |

Uwaga: M1_TERM_08 odblokowuje ulepszenie bazy (Mechaniki 2.14), a budowa kosztuje. Dlatego drugie zdanie kontekstu zmienione 25.10.2026 (decyzja GD): „Fix it, and BASE can turn on the lights above the base.”

## 6. Wrogowie i boss

Nazwy są propozycjami Dialogów i Lore; rolę bojową, statystyki i umiejętności ustalają Mechaniki/Balans.

| ID | Nazwa | Opis |
|---|---|---|
| M1_ENEMY_01 | Panel Drone (dron serwisowy) | It cleaned the solar panels for years. Now it attacks anything that moves. Its brush is still turning. |
| M1_ENEMY_02 | Curfew Guard (strażnik osiedla) | A security robot for the town. It still says "Curfew. Go home." There is no one left to go home. |
| M1_ENEMY_03 | Scrapper (zbieracz) | A small machine that takes everything apart. Wire, metal, doors, bodies. It keeps the parts. |
| M1_ENEMY_04 | Line Sentry (skażony agregat / wieżyczka) | A turret fixed next to an old power line. It guards the line, but the line has no power. It does not know that. |
| M1_BOSS_01 | Rail Guardian | The security machine of the rail depot. Its order is "Hold until the alarm is cancelled." Nobody cancelled the alarm. |
| M1_BOSS_INTRO | Wejście na arenę | WARNING: AREA CLOSED. AUTHORITY NOT FOUND. LEAVE THE TRACKS. |
| M1_BOSS_DEFEAT | Po pokonaniu (BASE) | The rail guard is down. The depot line is free. You can now restore the last part of Sector 1. |

Uwaga do M1_ENEMY_03: zostaje w pełnej wersji z „bodies” (Mechaniki 2.7: Zbieracz rozgrabia zwłoki gracza już w M1; decyzja czeka na akceptację GD).

Umiejętności wrogów i bossa: `[ENEMY_ABILITY_TBD]`, `[BOSS_ABILITY_TBD]`.

## 7. Przedmioty

### 7.1. Opisy slotów
| ID | Slot | Tekst |
|---|---|---|
| M1_ITEM_SLOT_WEAPON | Weapon | Your main tool for fights. Old, but it still works. |
| M1_ITEM_SLOT_ARMOR | Armor | It keeps your new body in one piece a little longer. |
| M1_ITEM_SLOT_MODULE | Module | A small part for your suit. It changes how you work. |
| M1_ITEM_SLOT_TOOL | Tool | For doors, boxes, and old machines. Not for fights. |

### 7.2. Rzadkości (propozycja nazw, liczba 3 z planu M1)
| ID | Rzadkość | Nazwa (propozycja) | Opis |
|---|---|---|---|
| M1_RARITY_1 | pospolita | Salvaged | Found in the zone. It works most days. |
| M1_RARITY_2 | rzadsza | Tuned | Someone fixed this with care. It works better than it should. |
| M1_RARITY_3 | najrzadsza | Grid-Grade | Made when the Grid was alive. You don't see these often. |

### 7.3. Prefiksy i sufiksy (12 właściwości)
Właściwości są placeholderami `[PROP_xx_TBD]` do czasu tabeli Balansu. Kolumna „motyw” to sugestia, do której właściwości nazwa pasuje; jeśli Balans da inne właściwości, nazwy przepiszę.

| ID | Właściwość | Motyw (sugestia) | Prefiks | Sufiks |
|---|---|---|---|---|
| M1_AFFIX_01 | [PROP_01_TBD] | obrażenia | Heavy | of Force |
| M1_AFFIX_02 | [PROP_02_TBD] | szybkość ataku | Quick | of the Rush |
| M1_AFFIX_03 | [PROP_03_TBD] | szansa krytyczna | Sharp | of the Weak Spot |
| M1_AFFIX_04 | [PROP_04_TBD] | maks. zdrowie | Thick | of the Long Shift |
| M1_AFFIX_05 | [PROP_05_TBD] | pancerz | Plated | of Steel |
| M1_AFFIX_06 | [PROP_06_TBD] | +% leczenia z Med-Patchy (Mechaniki 2.12, decyzja GD) | Patched | of Repair |
| M1_AFFIX_07 | [PROP_07_TBD] | szybkość ruchu | Light | of the Runner |
| M1_AFFIX_08 | [PROP_08_TBD] | obrażenia od prądu | Charged | of the Spark |
| M1_AFFIX_09 | [PROP_09_TBD] | czas odnowienia umiejętności | Ready | of the Second Try |
| M1_AFFIX_10 | [PROP_10_TBD] | znajdowanie łupu | Lucky | of the Scavenger |
| M1_AFFIX_11 | [PROP_11_TBD] | szybkość hakowania/terminali | Clever | of the Open Door |
| M1_AFFIX_12 | [PROP_12_TBD] | promień zbierania / zasięg | Long | of Reach |


### 7.4. Przedmiot w skrytce #46 (opcjonalny smaczek, zakres-m1 §3)
| ID | Nazwa | Opis |
|---|---|---|
| M1_ITEM_LOCKER | Hunter Locker (opis szafki) | A locker for hunters. Many names were written inside and then crossed out. It is almost empty. |
| M1_ITEM_46 | Bent Key Tag | A small metal tag with the number 46. Someone used it to mark the days. There are many lines on it. |

Statystyki przedmiotów, ceny i wartości: `[ITEM_STAT_TBD]`, `[PRICE_TBD]`.

## 8. Kontrakty (jedno zdanie tła na typ)

| ID | Źródło | Tytuł | Tło |
|---|---|---|---|
| M1_CONTR_01 | BASE | Restore a Relay (depth {depth}) | A relay at depth {depth} is down. It is a small part of the line, but the line does not work without it. |
| M1_CONTR_02 | BASE | Recover the Data Core (depth 2) | A data core is still in the Solar Fields, and BASE wants its records back. |
| M1_CONTR_03 | BASE | Clear the Path to the Lift | Machines are too close to the lift, and BASE cannot call it safely. |
| M1_CONTR_04 | Exchange | Deliver [N_TBD] Units of Scrap / Copper | The Exchange needs [N_TBD] units of [MATERIAL_TBD] to keep supply flowing. Payment: [REWARD_TBD] credits. |
| M1_CONTR_05 | Exchange | Sell One [RARITY_TBD] Item | The Exchange wants better goods on its shelves. Bring one [RARITY_TBD] item. |
| M1_CONTR_DONE | BASE/Exchange | Ukończenie | Order complete. Reward: [REWARD_TBD]. |

## 9. Teaser końca M1

| ID | Moment | Tekst |
|---|---|---|
| M1_TEASE_01 | BASE (czysta) po zapaleniu sektora | Sector 1 is online. Wait, I am receiving a weak signal from outside the sector. Playing it now. |
| M1_TEASE_02 | Sygnał (zniekształcony) | ...—llo? ...s anyone th—re? ...we see a l—ght in sect—r one... ...who turn— it on? ...answ— ...pl—ase... |
| M1_TEASE_03 | BASE (czysta) po sygnale | The signal is gone. Source: unknown. I have saved it. |


## 10. Dokładka od Mechanik (ZATWIERDZONE przez GD, 25.10.2026)

> Decyzje GD: Dash, Shock Pulse i Helper Drone zatwierdzone (Helper Drone jako nazwa robocza, można zaproponować lepszą); „Enemies nearby” zatwierdzone; M1_BASE_06 pokazywane przy przyjeździe windy i zaczyna się od „The lift is here.”; w M1 nie ma odzysku zwłok (pełna utrata), Scrapperzy rozbierają ciało tylko fabularnie, więc M1_SYS_01–03 przeniesione do puli M2. Opis zwłok przy USE zostaje w M1. **Aktualizacja: ostateczna nazwa drona to „Buddy Drone” (GD 25.10.2026).**
Źródło: /workspace/GRA/design/mechaniki-m1.md, Część 2 (2.3, 2.5, 2.7, 2.8, 2.11–2.13, 2.17 pkt 15–16). Te same zasady: A2, maks. 2–3 zdania, BASE czysta, bez WARDEN/Static/Quiet Protocol.
Liczby: w opisach umiejętności i przedmiotów stoją **tokeny parametrów `{NAZWA}` z tabeli 2.15** zamiast wpisanych liczb. Kod wstawia aktualną wartość, więc tekst nie rozjedzie się z balansem. Nazwy parametrów (`SK1_...` itd.) są wewnętrzne i gracz ich nie widzi.

### 10.1. Komunikaty systemowe (HUD, krótkie)
| ID | Moment | Tekst | Status |
|---|---|---|---|
| M1_SYS_04 | Próba otwarcia terminala w walce (`Hostiles nearby`; v0.5.2: ekwipunek bez blokady) | Enemies nearby. Fight first. | zatwierdzone; nowy kontekst (v0.5.2) zaakceptowany (GD, 25.10.2026) |
| M1_SYS_05 | **Przyjazd** windy przyciąga wrogów (R6 A, Mechaniki v0.5.2; alarm 12 pól) | The lift is loud. Enemies are coming. | zatwierdzone; nowy kontekst (v0.5.2) zaakceptowany (GD, 25.10.2026) |
| M1_SYS_06 | Pełny plecak przy podnoszeniu (2.11, opcjonalny) | Bag full. | zatwierdzone |

Uwaga: „Hostiles” to słowo powyżej A2, dlatego proponuję „Enemies”. Jeśli UI chce jeszcze krócej na HUD-zie telefonu: samo „Enemies nearby.”

### 10.2. Umiejętności (3 sloty)
| ID | Nazwa robocza → proponowana | Opis |
|---|---|---|
| M1_SKILL_01_NAME | Vault → **Dash** | Dash |
| M1_SKILL_01 | | Jump up to {SK1_DASH_RANGE} tiles fast. Nothing can hit you at the start of the jump. Your next hit right after it is stronger. |
| M1_SKILL_02_NAME | Arc Pulse → **Shock Pulse** | Shock Pulse |
| M1_SKILL_02 | | Send out a ring of electric power around you. It hurts all close enemies and gives them Shock. Shocked enemies stop their attack and move slowly. |
| M1_SKILL_03_NAME | Salvage Drone → Helper Drone → **Buddy Drone** (ostateczna, GD 25.10.2026) | Buddy Drone |
| M1_SKILL_03 | | A small drone from the base. It shoots the closest enemy, and enemies near it attack the drone, not you. It shoots twice as hard at shocked enemies. |
| M1_SKILL_UNLOCK | BASE, odblokowanie umiejętności (`{skill}` = nazwa) | New skill ready: {skill}. |
| M1_SKILL_LEVELUP | BASE, nowy poziom biegłości | {skill} is now level {level}. It is ready faster. |

Pola z liczbami dla UI (tooltip pod opisem, wartości z 2.15):
- Dash: `Range: {SK1_DASH_RANGE} · Cooldown: {SK1_DASH_COOLDOWN_MS} · Next hit: +{SK1_MOMENTUM_BONUS}`
- Shock Pulse: `Damage: {SK2_PULSE_DMG} · Shock: {SK2_SHOCK_MS} · Cooldown: {SK2_PULSE_COOLDOWN_MS}`
- Buddy Drone: `HP: {SK3_DRONE_HP} · Damage: {SK3_DRONE_DMG} · Time: {SK3_DRONE_LIFE_MS} · Cooldown: {SK3_DRONE_COOLDOWN_MS}`

Dlaczego zmiana nazw:
- **Vault → Dash:** „vault” (skok) to słowo spoza A2, a w angielskim znaczy też „sejf/skarbiec”. Myli się ze skrytką (Hunter Locker) i wygląda prawie jak „Vat” (Reprint Vat). „Dash” jest krótkie i jasne.
- **Arc Pulse → Shock Pulse:** nazwa od razu mówi, co robi umiejętność, i łączy ją ze statusem Shock oraz synergią drona. „Arc” nie jest słowem A2. Jeśli GD woli zostawić Arc Pulse, opis pasuje bez zmian.
- **Salvage Drone → Helper Drone:** (1) koliduje z rzadkością **Salvaged** (M1_RARITY_1), np. „Salvaged … ” obok „Salvage Drone” w tym samym UI; (2) dron nie odzyskuje łupu, tylko strzela i ściąga wrogów, a w fabule i wizji „dron odzyskujący rzeczy” to przyszły system łagodzenia straty (M2). Nazwa „Salvage” zablokowałaby ją dla tamtego drona. „Helper” jest słowem A2.
- Sprawdzone kolizje: Dash / Shock Pulse / Helper Drone nie pokrywają się z rzadkościami (Salvaged, Tuned, Grid-Grade), afiksami (m.in. Charged / of the Spark, Quick / of the Rush), wrogami (Panel Drone, Curfew Guard, Scrapper, Line Sentry, Rail Guardian) ani z Issue / Med-Patch / Data Core. Uwaga: „Helper Drone” i wróg „Panel Drone” mają wspólne słowo „Drone”. To czytelne (różne kolory i glify), ale jeśli GD chce uniknąć, alternatywa: „Helper Bot”.

### 10.3. Sprzęt i przedmioty
| ID | Nazwa | Opis |
|---|---|---|
| M1_GEAR_ISSUE | Issue gear (opis ogólny / tooltip „Issue”) | Basic gear from the Vat. You get it with every new print. You cannot sell it, and you cannot lose it. |
| M1_GEAR_ISSUE_POLE | Issue Pole (broń wręcz, szeroki zamach łukiem; zmiana nazwy z Baton po zmianie walki na twin-stick, zatwierdzone GD 25.10.2026) | A long metal pole from the Vat. Swing it wide to hit many enemies. It is not much, but it is always there. |
| M1_GEAR_ISSUE_SUIT | Issue Suit (pancerz) | A plain suit from the Vat. It fits you well. It was made for you, like your body. |
| M1_GEAR_ISSUE_POLE_2_NAME | nazwa Issue Mk2, broń (Balans/Mechaniki §2.3; po odblokowaniu przystanku windy na głęb. 2; zatwierdzone GD 25.10.2026) | Issue Pole II |
| M1_GEAR_ISSUE_POLE_2 | opis Issue Pole II (zatwierdzone GD 25.10.2026) | A longer, heavier pole from the Vat. It swings wide and hits harder, but it is still basic gear. |
| M1_GEAR_ISSUE_SUIT_2_NAME | nazwa Issue Mk2, pancerz | Issue Suit II |
| M1_GEAR_ISSUE_SUIT_2 | opis Issue Suit II (zatwierdzone GD 25.10.2026) | A thicker suit from the Vat. It stops a little more. It still fits you well. |
| M1_BASE_17 | BASE przy pierwszym wydruku/wyjeździe po odblokowaniu przystanku na głęb. 2 (zatwierdzone GD 25.10.2026; jeśli istnieje już linia o odblokowaniu przystanku, dopisać jako jej 2. zdanie) | The lift stops at depth 2 now. The Vat prints better Issue gear for you. |
| M1_GEAR_MEDPATCH | Med-Patch | A small patch that heals you. It works for a short time, so you can keep moving. Your only medicine in the zone. |
| M1_GEAR_DATACORE | Data Core (przedmiot kontraktu) | A small, heavy box full of old Grid data. BASE wants it back. If you die, you lose it. |
| M1_GEAR_ISSUE_TOPUP | BASE przy **wyjeździe windą**, **tylko gdy coś faktycznie uzupełniono** (`{medpatch_added}` > 0); Issue uzupełnia Med-Patche do maks. `{ISSUE_MEDPATCH_TOPUP}` przy każdym wyjeździe (decyzja GD 25.10.2026, pyt. 32; liczba otwarta, tylko zmienna). **ZATWIERDZONE (GD, 25.10.2026)** po poprawce: `{MEDPATCH_COUNT}` = aktualna liczba Med-Patchy w plecaku po uzupełnieniu (nie `{ISSUE_MEDPATCH_TOPUP}`, które mówi, ile Issue dokłada). **Dla PROG: `{MEDPATCH_COUNT}` to nowy token czasu gry** (liczba Med-Patchy w plecaku po uzupełnieniu, podstawiana przy wyjeździe). | I refilled your Med-Patches. You have {MEDPATCH_COUNT} now. |

Tooltip liczbowy Med-Patch (UI): `Heal: {MEDPATCH_HEAL} HP · Time: {MEDPATCH_DURATION_MS} · Cooldown: {MEDPATCH_COOLDOWN_MS} · Price: {MEDPATCH_PRICE}`. Cena jest robocza (R), do Balansu.

### 10.4. Zmiany w zatwierdzonych liniach
- M1_BASE_06: `[EVAC_TIME_TBD]` → **10** („The lift is here. I can hold it for 10 seconds. Please be fast.”). To jedyne wystąpienie placeholdera w tekstach gry.
- M1_ENEMY_03: bez zmian, zostaje z „bodies” (zaktualizowana tylko uwaga pod tabelą).


## 11. Terminal Power Lines – teksty zagadki (ZATWIERDZONE przez GD, 25.10.2026)

> **Decyzje GD (25.10.2026):** zatwierdzone Bad split, Over the limit, Closed ring, LIMIT, ON/OFF, OVERLOAD, Houses, Bunker Line. Kontekst M1_TERM_08 zmieniony na „…Fix it, and BASE can turn on the lights above the base.”. Odbiornik w legendzie to nie LIGHT, tylko jedno ogólne słowo **DEVICE**, a typy (LIGHT, PUMP, GATE…) pokazujemy w wierszu panelu bocznego (zmiana UI, 11.3a). Konteksty M1_TERM_01–08 **nie są skracane**. Podpowiedzi dostępne **od razu pod `?`**, w 3 stopniach. Zakres M1_TERM_FAIL tylko dla OVERLOAD.
> **Aktualizacja 25.10.2026 (GD):** sekcja 11 **zatwierdzona w całości**, także DEVICE (11.3), typy urządzeń (11.3a), stopnie podpowiedzi (11.5), NEXT / TIP n/3 / MORE (11.1) i zmiana M1_TERM_LOW (11.2).
> **Aktualizacja UI (25.10.2026):** w oknie Power Lines **nie ma dymków ani tooltipów, a tapnięcie urządzenia nic nie robi**. Urządzenia mają etykiety **A–I** (token `{receiver}` = litera), widoczne **na siatce w komórce odbiornika i w liście panelu** (Mechaniki), wiersz `A 3/4` = litera + x/y na żywo. **Typów urządzeń w M1 nie ma** (GD q22 = c, 11.3a). Wymóg GRAF: linia wyniku maks. 2 × ~30 znaków (11.2); M1_TERM_OK i M1_TERM_FAIL skrócone z tego powodu – **skróty zatwierdzone przez GD (25.10.2026)**.
Źródła: `design/zagadki-m1/power-lines-line1.md` (§5–7, §11, §13 pkt L1) i `.json` (pola `name_en_working`, `hint_en_draft`, `source_power`, `fuses[].max`), `graf/styl-ascii.md` §2 i §11 (wygląd okna zatwierdzony przez GD pod warunkiem, że wszystkie etykiety są A2 i przechodzą przez Dialogi i Lore).
Zasady jak wyżej: A2, krótko, BASE czysta, bez WARDEN/Static/Quiet Protocol. Liczby wyłącznie jako tokeny z nazw pól danych zagadki: `{source_power}` (moc źródła), `{fuse_max}` (limit bezpiecznika, pole `fuses[].max`), `{box_power}` / `{box_lines}` (moc w węźle i liczba żywych gałęzi przy TRIP; pola nie ma w JSON, nazwa robocza dla PROG). Liczby i znaki na siatce (`12`, `1/2`, `4/2`, `≤4`, `x`, `⊥`) nie są tłumaczone.

**Szerokości (styl-ascii §2 i §11, zagadka §5):** telefon w pionie 360 CSS px, min. ~30 kolumn tekstu. Przyjmuję limity:
- przyciski: zalecane **≤ 6 znaków**, maks. ok. **8** (GRAF, 25.10.2026);
- etykiety legendy: maks. **10 znaków** (najdłuższa: ON THE WAY, 10). Limit 10 dotyczy **tylko etykiet legendy** (GRAF);
- komunikat wyniku: osobna linia pod siatką, **maks. 2 linie po ~30 znaków, łamanie między słowami** (GRAF, sprawdzenie w 11.2); nazwa rozdzielni: maks. 2 linie;
- komórki siatki pokazują **tylko liczby** (GRAF); etykiety urządzeń A–I i typy są w panelu bocznym (11.3a);
- **limity UI (`prog/ui-m1.md` §13, liczone PO podstawieniu tokenów, 25.10.2026):** podpowiedź terminala TIP **≤ 90 znaków (twardy limit**, 4 linie × 27 zn. w panelu 270 px); cel Lore **≤ 80** jako zapas, bo przy > 4 odbiornikach limit może spaść (UI M-P2). Wszystkie 24 TIP-y mają teraz ≤ 80 znaków (11.5);
- linia legendy: maks. **3 linie × 30 = 90 znaków**.
Długości (token liczę jako 2 cyfry) są w kolumnie „zn.”.

### 11.1. Przyciski i znaczniki okna
| ID | Robocze | Ostateczne | zn. | Decyzja i powód |
|---|---|---|---|---|
| M1_TERM_BTN_SEND | SEND | **SEND** | 4 | zostaje: słowo A2, powtarza nagłówek („Send power to the right places”). |
| M1_TERM_BTN_RESET | RESET | **RESET** | 5 | zostaje: formalnie powyżej A2, ale to międzynarodowe słowo z gier (w PL też „reset”). Prostsze wersje („START AGAIN”, 11 zn.) nie mieszczą się w przycisku. |
| M1_TERM_BTN_EXIT | EXIT | **EXIT** | 4 | zostaje: A2, znane z napisów „EXIT”. „CLOSE” też by pasowało, ale EXIT jest krótsze i zgodne z menu pauzy. |
| M1_TERM_BTN_HELP | ? | **?** | 1 | zostaje jako znak. Etykieta dla czytnika ekranu: „Help”. |
| M1_TERM_HELP_TITLE | – | **HELP** | 4 | nowy: tytuł rozwiniętej legendy pod `?`. |
| M1_TERM_TAG_NEW | NEW | **NEW** | 3 | zostaje: znacznik nowego elementu w legendzie. |
| M1_TERM_TAG_TIP | – | **TIP** | 3 | nowy: znacznik podpowiedzi (`hint_en_draft`), niezależnie od decyzji M3 (auto czy pod `?`). |
| M1_TERM_BTN_WAIT | – | **WAIT** | 4 | nowy, opcjonalny: napis na zablokowanym SEND przez 1,5 s po porażce. Jeśli UI tylko wyszarza przycisk, ID wypada. |
| M1_TERM_BTN_NEXT | – | **NEXT** | 4 | **nowy, zatwierdzony (GD):** przycisk strony kontekstu przed zagadką (patrz niżej). A2, krótki, ten sam co „DALEJ” w oknie tekstu (`prog/sterowanie.md`). |
| M1_TERM_TAG_TIP_N | – | **TIP {n}/3** | 7 | **nowy, zatwierdzony (GD):** nagłówek stopnia podpowiedzi (`{n}` = 1–3). |
| M1_TERM_BTN_MORE | – | **MORE** | 4 | **nowy, zatwierdzony (GD):** pod podpowiedzią odsłania następny stopień (nie pokazujemy wszystkich trzech naraz). |

**Kontekst i układ okna (decyzja GD):** konteksty `M1_TERM_01–08` zostają w pełnej długości (2 zdania, ok. 95–105 znaków). Okno tekstu pokazuje 2–3 zdania na stronę, czyli 3–4 linie przy ~30 kolumnach. Jeśli UI stwierdzi, że kontekst nie mieści się nad siatką (zwłaszcza w poziomie), kontekst idzie jako **osobna strona przed zagadką** z przyciskiem `M1_TERM_BTN_NEXT` („NEXT”), a na ekranie zagadki zostaje nagłówek i nazwa rozdzielni (11.4). Treści kontekstów się nie zmieniają.

### 11.2. Komunikaty wyniku SEND
| ID | Wynik | Robocze | Ostateczne | zn. | Decyzja i powód |
|---|---|---|---|---|---|
| M1_TERM_OK | WIN | (zatwierdzone) „Line restored. Power is flowing. BASE has updated the map.” | **Line restored. Power is flowing. Map updated.** | 45 | **skrócone (wymóg GRAF, 25.10.2026):** stara wersja (58 zn.) łamała się na 3 linie. Sens bez zmian. Zmiana także w sekcji 5. |
| M1_TERM_OK_RETUNE | WIN w wariancie „ponownie zestrojonym” | – | Line restored. Power is flowing. Good work. | 43 | **nowy:** przy ponownym zestrojeniu nie ma nowego fragmentu mapy (LD §3), więc „updated the map” byłoby nieprawdą (zastrzeżenie GD: liczby i postęp zawsze prawdziwe). |
| M1_TERM_LOW | DARK | Not enough power. Some lights are still off. | **Not enough power. Some devices are still off.** | 45 | **zmiana, zatwierdzona (GD):** „lights” → „devices”, bo odbiornik w legendzie to teraz DEVICE (nie każdy odbiornik to lampa). |
| M1_TERM_FAIL | OVERLOAD | (zatwierdzone) „Overload. The line is off for now. Check the numbers and try again.” | **Overload. The line is off for now.** | 34 | **skrócone (wymóg GRAF, 25.10.2026):** stara wersja (67 zn.) to 3 linie. Zostaje pierwsza część, identyczna z linią w szkicu okna (zagadka §5). „Check the numbers and try again” wynika z liczb `x/y` i z podpowiedzi pod `?`. Słowo OVERLOAD zostaje (nagłówek „Do not overload the lines”). Zakres: tylko OVERLOAD (zatwierdzone przez GD). |
| M1_TERM_TRIP | TRIP (węzeł nie dzieli bez reszty) | TRIP / „box cannot split 8 into 3” | **Bad split. {box_power} does not split into {box_lines} equal parts.** | 49 | **zmiana:** „trip” w tym znaczeniu (wyłączenie bezpiecznika) to poziom B2, a dla A2 znaczy „wycieczka”. „Bad split” mówi, co się stało; liczby w zdaniu pokazują dlaczego. |
| M1_TERM_FUSE | FUSE (za dużo przez bezpiecznik) | FUSE | **Over the limit. Only {fuse_max} can go through here.** | 44 | **zmiana:** „fuse” to B2. Na ekranie bezpiecznik jest już rysowany jako `≤4` (GRAF §11), więc „limit” zgadza się z tym, co gracz widzi. |
| M1_TERM_SHORT | SHORT (pierścień) | „Short circuit. Power went round in a ring.” | **Closed ring. Power goes round and round. Nothing works.** | 55 | **zmiana:** „short circuit” to B1/B2. „Ring” i „round” są proste, a cały pierścień jest podświetlony (GRAF §11), więc słowo pasuje do obrazu. |

Uwaga: wewnętrzne nazwy wyników w kodzie (`TRIP`, `FUSE`, `SHORT`, `OVERLOAD`) mogą zostać, gracz widzi tylko teksty z tej tabeli.

**Limit linii wyniku (GRAF, 25.10.2026):** komunikat wyniku to osobna linia pod siatką, **maks. 2 linie po ok. 30 znaków, łamanie tylko między słowami**. Sprawdzone zawijaniem do 30 kolumn, każdy token (`{fuse_max}`, `{box_power}`, `{box_lines}`) liczony jako 2 cyfry:
- `M1_TERM_OK`: „Line restored. Power is” / „flowing. Map updated.”
- `M1_TERM_OK_RETUNE`: „Line restored. Power is” / „flowing. Good work.”
- `M1_TERM_LOW`: „Not enough power. Some devices” / „are still off.”
- `M1_TERM_FAIL`: „Overload. The line is off for” / „now.”
- `M1_TERM_TRIP`: „Bad split. NN does not split” / „into NN equal parts.”
- `M1_TERM_FUSE`: „Over the limit. Only NN can go” / „through here.”
- `M1_TERM_SHORT`: „Closed ring. Power goes round” / „and round. Nothing works.”
Wszystkie mieszczą się w 2 liniach.

### 11.3. Legenda (pod `?`, tylko elementy z danego wariantu)
| ID | Element | Etykieta | Linia legendy | zn. | Decyzja i powód |
|---|---|---|---|---|---|
| M1_TERM_LEG_SOURCE | `source` | **POWER IN** | All power starts here. The number is how much. | 46 | etykieta zostaje (z §3 zagadki). Robocza linia „POWER IN: 12.” ma literalną liczbę, a przy ponownym zestrojeniu liczba się zmienia, więc linia opisuje komórkę zamiast powtarzać liczbę. |
| M1_TERM_LEG_CABLE | `cable` | **WIRE** | Power goes along the wire. | 26 | **nowy:** §7 nie ma linii dla kabla, a `cable` jest w `elements` każdego wariantu. „Wire” jest prostsze niż „cable/line”, a „line” w grze to cała linia zasilania (LINE 1). |
| M1_TERM_LEG_JUNCTION | `junction` | **BOX** | A box splits power into equal parts. One part for each open wire. | 65 | etykieta zostaje (BOX, jak w §3 i w kontekstach „This box…”). Linia uproszczona: bez „equally between” (B1). |
| M1_TERM_LEG_SWITCH | `switch` | **SWITCH** | Tap a switch to turn it on or off. = is on. / is off. | 53 | **zmiana:** „open/close” dla przełącznika jest mylące dla A2 (po angielsku „closed switch” przepuszcza prąd, intuicyjnie „zamknięte” = stop). ON/OFF jest jednoznaczne. Wewnętrzne nazwy w danych bez zmian. |
| M1_TERM_LEG_CONSUMER | `consumer` | **DEVICE** | The number is the power this device needs. More burns it. Less leaves it off. | 78 | **zmiana, zatwierdzona (GD):** LIGHT → DEVICE (jedno ogólne słowo A2). **GD q22 = c:** w M1 nie ma typów; DEVICE to jedyna nazwa urządzenia w oknie (11.3a). |
| M1_TERM_LEG_GROUND | `ground` | **GROUND** | Ground takes any power. Send extra power here. | 46 | zostaje z drobnym uproszczeniem („Use it for extra power” → „Send extra power here”). „Ground” jest A2 jako „ziemia”, a sens elektryczny wynika z obrazu `⊥`. |
| M1_TERM_LEG_FUSE | `fuse` | **LIMIT** | Only this much power can go through. Count all of it, also power for the ground. | 80 | **zmiana nazwy: FUSE → LIMIT** (B2 → A2, zgodnie z glifem `≤4`). Drugie zdanie to kluczowy „aha” wariantu 05 (od JSON v0.5.0: wariant 03 – za limitem jest węzeł z uziemieniem) (bezpiecznik liczy też moc do uziemienia, §4 pkt 5). |
| M1_TERM_LEG_SUM | `multi_source` (JSON v0.5.0, głęb. 1) | **ADD UP** | Two or more wires can feed one device. The power adds up. | 57 | **nowy, ZATWIERDZONE przez GD 25.10.2026.** Wymagany przez JSON v0.5.0 (`pending_text_ids`). Etykieta 6 zn. (≤ 10). Linia wg propozycji LUZ, bez zmian (A2). |
| M1_TERM_LEG_PASS | `pass_through` | **ON THE WAY** | A device on the way takes what it needs. The rest goes on. | 58 | **zmiana, zatwierdzona (GD):** „light” → „device”. Etykieta ON THE WAY bez zmian. |
| M1_TERM_LEG_RING | `ring` | **RING** | Never make a ring. Power goes round and round, and nothing works. | 65 | **zmiana:** bez „short circuit” (B1/B2) i bez „close” (patrz SWITCH). Spójne z M1_TERM_SHORT. |

### 11.3a. Urządzenia w panelu: bez typów (ROZSTRZYGNIĘTE, GD q22 = c, 25.10.2026)
**Decyzja GD (c):** w M1 **nie ma typów urządzeń**. Wiersz panelu to tylko litera + x/y: **`{receiver} {got}/{need}`**, np. **`A 3/4`** (format Mechanik). Tapnięcie urządzenia nic nie robi. Legenda mówi tylko **DEVICE** (M1_TERM_LEG_CONSUMER). Opcja (b) (typ w wierszu, `A PUMP 3/4`) odrzucona.
**Sprawdzone w źródłach:** `graf/styl-ascii.md` §11 – odbiornik to „cyfra w ramce”, bez osobnych glifów dla typów; `power-lines-line1.md` §3 – odbiornik `1–9` jako jedna kategoria; JSON v0.5.0 ma przy odbiornikach pola `name` i `type_text_id` (M1_TERM_TYPE_*), ale żaden element UI ich nie pokazuje. **Typ nie jest widoczny w M1**, więc teksty zagadki nie mogą wskazywać urządzenia typem (audyt w 11.5). **Dla LUZ/PROG:** pola `name` / `type_text_id` w M1 nieużywane (materiał na kodeks M2).
**10 nazw typów z opisami przeniesione do puli M2** (materiał na kodeks wiedzy), z tymi samymi ID.
**Uwaga dla GRAF/UI:** Mechaniki potwierdziły litery A–I w komórce odbiornika – nadal do uzgodnienia z zasadą GRAF „komórki pokazują tylko liczby” (np. litera obok liczby). Teksty nie zależą od tej decyzji.

### 11.4. Nazwy rozdzielni (tytuł wariantu pod nagłówkiem)
| ID | Wariant | Robocze (`name_en_working`) | Ostateczne | Decyzja i powód |
|---|---|---|---|---|
| M1_TERM_04_NAME | Osiedle | Housing Block | **Houses** | zmiana: „housing block” to B1, a głęb. 1 opisuje „Empty houses” (M1_LOC_D1), kontekst „forty homes”. |
| M1_TERM_07_NAME | Sklep na rogu | Corner Shop | **Corner Shop** | zostaje: A2, zgodne z M1_TERM_07. |
| M1_TERM_08_NAME | Przekaźnik do bunkra | Bunker Relay | **Bunker Line** | zmiana: „relay” to B2, a zatwierdzony kontekst mówi „This line goes down to your bunker”. |
| M1_TERM_05_NAME | Dok dronów | Drone Dock | **Drone Dock** | zostaje: „dock” występuje już w M1_NOTE_06, a kontekst tłumaczy (drony ładowały się tutaj). |
| M1_TERM_01_NAME | Farma solarna | Solar Farm | **Solar Farm** | zostaje (M1_TERM_01, M1_LOC_D2). |
| M1_TERM_02_NAME | Stacja pomp | Pump Station | **Pump Station** | zostaje (M1_TERM_02). |
| M1_TERM_06_NAME | Przejazd kolejowy | Rail Crossing | **Rail Crossing** | zostaje (M1_TERM_06 „rail crossing”). |
| M1_TERM_03_NAME | Hala depot | Rail Hall | **Rail Hall** | zostaje (M1_TERM_03 „rail hall”). |

### 11.5. Podpowiedzi stopniowane (pod `?` od początku) – zatwierdzone (GD)
> **25.10.2026, audyt typów (GD q22 = c) i JSON v0.5.0:** w oknie nie ma typów urządzeń (odbiornik = cyfra w ramce, `styl-ascii.md` §11; panel `A 3/4`; legenda tylko DEVICE). Podpowiedzi wskazują urządzenia **pozycją** (top/left/right/bottom, „right of the first box”, „first on the wire”) albo **liczbą** (big/small), bez liter (kolejność liter ustala UI/dane). JSON v0.5.0 (LUZ) przestawił układy: 04, 07, 08 to nowe zagadki z sumowaniem linii; układ dawnego 07 → 05, dawnego 08 → 01, dawnego 01 → 02; 06 i 03 drobne zmiany. Wszystkie 24 TIP-y sprawdzone z `solution` v0.5.0 i ze skalami `retune`, każdy ≤ 80 znaków. Zmienione wiersze: **ZATWIERDZONE przez GD 25.10.2026**. Dla LUZ: w JSON można zdjąć `rewrite_needed`.
> **25.10.2026, limit UI (§13):** 12 TIP-ów skróconych do ≤ 80 znaków (11 za długich + 08_TIP_2 dla zapasu). Skrócone wersje **ZATWIERDZONE przez GD (25.10.2026)**; sprawdzone z rozwiązaniami v0.3 JSON (tier 3 nadal nie podaje pełnego rozwiązania).
Decyzja GD: podpowiedzi są dostępne od razu pod `?`. Każdy wariant ma 3 stopnie: **TIP 1** = tylko kierunek, **TIP 2** = konkretniej (gdzie patrzeć), **TIP 3** = najkonkretniej (co policzyć), ale **żaden stopień nie podaje gotowego ustawienia przełączników**. Stopnie odsłania przycisk MORE po kolei. Sprawdzone z rozwiązaniami z `power-lines-line1.md` v0.3 §8 i `solution.taps` w JSON. Bez literalnych liczb (ponowne zestrojenie mnoży liczby); liczba części („three equal parts”) i porównanie z limitem nie zmieniają się przy skalowaniu.
Poprzednie pojedyncze `M1_TERM_xx_TIP` (zatwierdzone) zostają jako TIP 1 albo TIP 2, z zamianą „light” → „device” tam, gdzie chodzi o dowolny odbiornik.

| ID | Wariant | Tekst | zn. | Co sprawdza (spoiler dla zespołu) |
|---|---|---|---|---|
| M1_TERM_04_TIP_1 | Houses | Power from two wires adds up in one device. | 43 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „One device gets all the power. Can the box share it?”. nowy układ v0.5.0 (sumowanie linii, 3 źródła 2/3/4, dom 5). Tekst = `hint_en_draft` z JSON. |
| M1_TERM_04_TIP_2 | Houses | One wire is not enough. Add a second wire so the sum is just right. | 67 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „A box gives the same part to each ON wire. Right now only one wire is ON.”. start: tylko lewa linia ON → 3/5 (ciemny). Trzeba dobrać drugą linię. |
| M1_TERM_04_TIP_3 | Houses | Keep the left wire ON. Add each other POWER IN to it. Which sum is right? | 73 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „With two ON wires, each house gets half. Is half the right number?”. 3 + 2 = 5 (górna), 3 + 4 = 7 (prawa, przepalenie). Nie mówi, która. Pozycja „left” widoczna na siatce. |
| M1_TERM_07_TIP_1 | Corner Shop | The biggest number is not always the best. | 42 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Too much power? Send some of it into the ground.”. nowy układ v0.5.0. Tekst = `hint_en_draft` z JSON. |
| M1_TERM_07_TIP_2 | Corner Shop | Count each device on its own. Which wires add up to just its need? | 66 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „The top box needs three ON ways out to give each device the right part.”. lewe urządzenie 6, prawe 4; każde ma 3 źródła. |
| M1_TERM_07_TIP_3 | Corner Shop | Left device: leave the top POWER IN OFF. Right device: add a small extra. | 73 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Power both devices. The grounds below get one part. Use one or two, not three.”. lewe: 3 + 3 (górne 4 OFF, bo 4 + 3 = 7); prawe: 3 + 1 („small extra”, nie mówi, który z małych). Pozycje lewo/prawo/góra widoczne. |
| M1_TERM_08_TIP_1 | Bunker Line | Sometimes you need three wires, not two. | 40 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „One box gives power to the next box. Count each box on its own.”. nowy układ v0.5.0. Tekst = `hint_en_draft` z JSON. |
| M1_TERM_08_TIP_2 | Bunker Line | No two wires give the big device its need. Try three wires. | 59 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Start with the big light. How many equal parts does the first box need?”. duże urządzenie (9 – większa liczba, widoczna) potrzebuje 6 + 2 + 1. |
| M1_TERM_08_TIP_3 | Bunker Line | Big device: one big POWER IN must go OFF. The small device needs just one more. | 79 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „The first box needs three parts, so the top ground helps. And the lower ground?”. duże: 5 OFF (start 6 + 5 = 11), nie mówi, które z dużych; małe (4): 3 + 1 – „one more” = jedna linia / jedna jednostka. |
| M1_TERM_05_TIP_1 | Drone Dock | Too much power? Send some of it into the ground. | 48 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „The limit counts all power that goes through it.”. układ dawnego 07 przeniesiony do 05 (v0.5.0); tekst dawnego 07_TIP_1. |
| M1_TERM_05_TIP_2 | Drone Dock | The top box needs three ON ways out to give each device the right part. | 71 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Too much goes through the limit. Send extra to a ground before it, not after.”. tekst dawnego 07_TIP_2 (bez typów). 6 = 2 + 2 + 2; skale 2–3 też dzielą się na 3. |
| M1_TERM_05_TIP_3 | Drone Dock | Power both devices. The grounds below take one part. It must split evenly. | 74 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Give each way from the first box what the limit allows. Other grounds stay OFF.”. dawne 07_TIP_3 „…Use one or two, not three” było **fałszywe przy skali ×3** (6 na 3 uziemienia = 2, działa). Nowe zdanie prawdziwe przy skalach 1–3. |
| M1_TERM_01_TIP_1 | Solar Farm | One box gives power to the next box. Count each box on its own. | 63 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Never make a ring. A device gets a different part from a different box.”. układ dawnego 08 przeniesiony do 01 (v0.5.0); tekst dawnego 08_TIP_1. |
| M1_TERM_01_TIP_2 | Solar Farm | Start with the device right of the first box. How many parts must that box make? | 80 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „The middle town can get power from the top or bottom box. Try the other one.”. dawne 08_TIP_2 „Start with the big light” – typ zamieniony na pozycję (urządzenie na prawo od 1. węzła, [2,5]). |
| M1_TERM_01_TIP_3 | Solar Farm | The first box needs three parts, so the top ground helps. And the lower ground? | 79 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Each right box gets half to split. The ground by POWER IN is a trap.”. tekst dawnego 08_TIP_3 bez zmian (bez typów). 12 → 3 × 4 (skala 2: 24 → 3 × 8); dolne uziemienie OFF. |
| M1_TERM_02_TIP_1 | Pump Station | Never make a ring. A device gets a different part from a different box. | 71 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „A device on the way takes what it needs. The rest goes on.”. układ dawnego 01 przeniesiony do 02 (v0.5.0); tekst dawnego 01_TIP_1. |
| M1_TERM_02_TIP_2 | Pump Station | The middle device can get power from the top or bottom box. Try the other one. | 78 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „The first pump takes its part before any box. Count what is left for the box.”. dawne 01_TIP_2 „The middle town” → „The middle device” (pozycja). Start: środek z góry → trzeba z dołu. |
| M1_TERM_02_TIP_3 | Pump Station | Each right box gets half to split. The ground by POWER IN is a trap. | 68 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Give the pump above the box a way to the houses. Then the box needs two parts.”. tekst dawnego 01_TIP_3 bez zmian. Uziemienie przy POWER IN jest teraz ON na starcie – zdanie dalej prawdziwe. |
| M1_TERM_06_TIP_1 | Rail Crossing | {source_power} cannot split into three equal parts. Something must take power first. | 72 | **sprawdzone z JSON v0.5.0, bez zmian (zatwierdzone).** bez zmian (prawdziwe dla 13 i 26, `valid_if` podzielność przez 3). |
| M1_TERM_06_TIP_2 | Rail Crossing | Use one way: past the top device or the left one. The other is then at the end. | 79 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Use one way: past the light or the gate motor. The other device is at the end.”. „the light / the gate motor” → „the top device / the left one” (pozycje [0,4] i [3,2]). |
| M1_TERM_06_TIP_3 | Rail Crossing | Let the top device take its part first. Then the next box needs three parts. | 76 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Let the light take its part first. Then the next box needs three equal parts.”. „the light” → „the top device”. 13 − 1 = 12 = 3 × 4 (skala 2: 24 = 3 × 8). Prawe uziemienie ON już na starcie (v0.5.0). |
| M1_TERM_03_TIP_1 | Rail Hall | Start from the limit and count back. | 36 | **sprawdzone z JSON v0.5.0, bez zmian (zatwierdzone).** bez zmian. |
| M1_TERM_03_TIP_2 | Rail Hall | The first device on the wire takes its part. How many parts does the box need? | 78 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „The first signal takes its part first. How many parts does the box need?”. „The first signal” → „The first device on the wire” (urządzenie między POWER IN a 1. węzłem). 15 − 3 = 12 → 3 × 4. |
| M1_TERM_03_TIP_3 | Rail Hall | Go the long way to the bottom device, past the small one. Only one ground is ON. | 80 | **zmiana 25.10.2026, ZATWIERDZONE przez GD 25.10.2026** (GD q22 = c: brak typów urządzeń w M1; JSON v0.5.0). Było: „Go the long way to the last signal, past the small light. Only one ground is ON.”. „the last signal / the small light” → „the bottom device / the small one” (pozycja i mniejsza liczba). Jedyne uziemienie ON: górne [0,4]. v0.5.0: brak przełącznika [4,5], drzwi tylko z góry. |

\* Teksty powyżej 90 znaków (limit legendy z początku sekcji 11) mają 2–3 zdania i mieszczą się na jednej stronie okna tekstu (3–4 linie, ~30 kolumn; najdłuższe 135 zn. ≈ 5 linii – patrz pytanie 21). Jeśli UI potrzebuje krócej, skrócę TIP 2–3, nie zmieniając sensu.

**Wariant 06 a ponowne zestrojenie:** JSON ma `retune.scales: [1, 2]` i `hint_off_when_invalid: true` (walidator pokazuje „x2: bez TIP”). Nowy TIP 1 zostawia token `{source_power}`, ale mówi o „three equal parts”, co jest prawdą dla 13 i dla 26, więc **podpowiedź może zostać włączona także przy skali 2**. TIP 2 i 3 nie zależą od liczb. Do potwierdzenia przez LUZ (flaga `hint_off_when_invalid` może zostać jako zabezpieczenie dla przyszłych skal 3+, np. 39 dzieli się na 3).

### 11.6. Inne komunikaty okna
| ID | Moment | Tekst | zn. | Uwagi |
|---|---|---|---|---|
| M1_TERM_RETUNE | Nagłówek kontekstu w wariancie „ponownie zestrojonym” (zamiast/obok M1_TERM_xx) | BASE ORDER: This line works again, but it needs new numbers. | 60 | **nowy.** BASE czysta, bez słowa „retune” (B2). |
| M1_TERM_DONE | Ponowne otwarcie rozwiązanego terminala (jeśli PROG na to pozwala) | This line is on. Nothing to do here. | 36 | **nowy, opcjonalny.** |
| M1_SYS_04 | Próba otwarcia **tylko terminala** w walce (v0.5.2: ekwipunek otwiera się w walce bez pauzy) | Enemies nearby. Fight first. | 28 | bez zmian (zatwierdzone), zagadka §1 już go używa. Nowy kontekst (v0.5.2) zaakceptowany (GD, 25.10.2026). |

### 11.7. Kolizje i zmiany w zatwierdzonych liniach
- **Zatwierdzone linie: treść bez zmian.** Jedyna zmiana to zakres `M1_TERM_FAIL` (tylko OVERLOAD, a nie wszystkie porażki), patrz 11.2.
- Sprawdzone kolizje nazw: LIMIT, WIRE, BOX, SWITCH, LIGHT, GROUND, RING, ON THE WAY i nazwy rozdzielni nie pokrywają się z rzadkościami (Salvaged / Tuned / Grid-Grade), afiksami, wrogami ani umiejętnościami. „LIGHT” to też prefiks afiksu `M1_AFFIX_07` („Light”), ale w innym oknie i innym znaczeniu (lekki) – akceptowalne. „Line Sentry” (wróg) i „line” w nagłówku nie kolidują z legendą, bo legenda używa „wire”.
- „Fuses” zostają w zatwierdzonej notatce `M1_NOTE_09` („Spare fuses are in box 3”). To świat, nie UI zagadki, więc nie zmieniam.


## 12. Śmierć, ryzyko, samouczek (ZATWIERDZONE przez GD, 25.10.2026)

> **Mechaniki (25.10.2026):** do v0.5.2 dodają M1_RISK_04_OK, M1_TUT_SKIP_YES / M1_TUT_SKIP_NO, M1_HUD_SK1–3 i nowe M1_RISK_01B. M1_DEATH_01_HAZ nieużywane w M1 (ciecz `~` bez obrażeń) → pula M2.
> **Decyzje GD (25.10.2026):** sekcja 12 zatwierdzona. Warianty M1_BASE_03B / M1_BASE_14B zatwierdzone, z warunkami wyświetlania przy liniach w sekcji 1 (wariant B, gdy nic nie przepadło poza Issue). Przycisk ekranu śmierci **NEXT** zatwierdzony. **M1_RISK_01B** (brama areny) zatwierdzone – **Mechaniki i UI muszą je wdrożyć** (osobne okno/tekst dla bramy areny w §2.7a i w UI). M1_RISK_04 w pełnej wersji, podzielony na strony na granicy zdań, lista „co zostaje” na jednej stronie; alias M1_UI_DEATH_RULE zostaje.
> **Aktualizacja UI (25.10.2026):** pasek podpowiedzi samouczka na ekranie **568×320** (poziomo) jest **na dole**, nie u góry (Mechaniki §2.19 mówią „u góry ekranu”). Limity znaków przyśle UI; obecne teksty mają ≤ 8 słów i ≤ 38 znaków.
Źródło: `design/mechaniki-m1.md` v0.5: §2.7 (ekran śmierci), §2.7a (zabezpieczenia informacyjne), §2.19 (nauka w Prologu). Zasady jak zawsze: A2, maks. 2–3 zdania, BASE czysta, bez WARDEN/Static. W M1 śmierć = pełna utrata ryzykownych rzeczy, Issue nigdy nie przepada.
**Limity z §2.19:** podpowiedzi samouczka (pasek u góry) maks. **8 słów**, 1 linia, bez pauzy. Panele (wyjaśnienie po śmierci, M1_TUT_14/15) i okna (potwierdzenie zejścia) mają maks. 2 zdania. Liczba słów w kolumnie „sł.” (token = 1 słowo).
**Zmiana sterowania PC (UI, 25.10.2026, twin-stick):** `{KEY_MOVE}` = „WASD” (strzałki już nie ruszają). Nowy token `{KEY_AIM}` = „arrows / mouse” na podpowiedź o celowaniu (pasek ≤38 znaków); tekst podpowiedzi po v0.6 Mechanik.

**Tokeny klawiszy (z §2.19):** `{KEY_MOVE}`, `{KEY_USE}`, `{KEY_ATK}`, `{KEY_HEAL}`, `{KEY_SK1}`, `{KEY_SK2}`, `{KEY_SK3}`, **`{KEY_CONFIRM}`** (nowy, UI 25.10.2026: potwierdzenie w menu bazy i oknach, wyświetlany jako „Enter”; E też działa, Spacja nigdy). Dokument wymienia wprost `{KEY_ATK}`, `{KEY_USE}`, `{KEY_HEAL}`, `{KEY_SK1}` „…”; `{KEY_MOVE}`, `{KEY_SK2}`, `{KEY_SK3}` są użyte w jego tabeli kroków. Innych nie dodaję. `{KEY_MOVE}` powinien się renderować jako np. „WASD / arrows” (PROG).
**Głos:** BASE mówi tylko w M1_TUT_11, M1_TUT_14, M1_TUT_17 i M1_RISK_04 (spokojnie, rzeczowo, bez zniekształceń). Pozostałe linie to neutralny UI.

### 12.1. Ekran śmierci (§2.7 pkt 3)
| ID | Moment | Tekst | Uwagi |
|---|---|---|---|
| M1_DEATH_01 | linia przyczyny pod `M1_BASE_04`, też w podsumowaniu sesji | Killed by: {enemy_name} | `{enemy_name}` = nazwa z sekcji 6 (Panel Drone, Curfew Guard, Scrapper, Line Sentry, Rail Guardian). |
| M1_DEATH_02 | ostatnie 3 trafienia (po pancerzu, prawdziwe liczby) | Last hits: {hit_1} · {hit_2} · {hit_3} | **Format ustalony (25.10, z Assetami):** `{hit_n}` = „-{dmg}”, np. „-18”, bo zabójca jest już w M1_DEATH_01, a nazwy wrogów nie mieszczą się 3 razy w ~30 kolumnach. Przy 0 trafień linia jest ukryta. Gdy zabójca jest nieznany, linia M1_DEATH_01 jest ukryta (assety-m1.md v1.2). Przy mniej niż 3 trafieniach puste tokeny i separatory znikają. Najnowsze trafienie pierwsze albo ostatnie – do UI (proponuję ostatnie, czyli `{hit_3}` = cios śmiertelny). |
| M1_DEATH_01_HAZ | zabójca to otoczenie (np. ciecz `~`) – **tylko jeśli GD/Mechaniki dadzą obrażenia od otoczenia w M1** | Killed by: {hazard_name} | **NIE UŻYWANE W M1 → pula M2** (Mechaniki 25.10.2026: ciecz `~` w M1 to tylko dekoracja, bez obrażeń), chyba że GD zdecyduje inaczej. Wiersz zostaje tu jako odnośnik. `{hazard_name}` to nazwa z listy otoczenia, której jeszcze nie ma. |
| M1_DEATH_BTN | przycisk po 1500 ms | NEXT | **Zatwierdzone (GD): NEXT** zamiast „CONTINUE” z §2.7 (B1). To samo słowo co M1_TERM_BTN_NEXT. Mechaniki: do poprawki w §2.7. |

### 12.2. Zabezpieczenia przed stratą (§2.7a)
| ID | Moment | Tekst | sł. | Uwagi |
|---|---|---|---|---|
| M1_RISK_01 | wejście na `>` przy `AT RISK` > 0 (okno, pauza) | Go deeper? You can lose {at_risk} cr. | 7 | robocze z §2.7a bez zmian. Pod spodem tylko liczby: `HP {hp}/{max} · + {patches}`. |
| M1_RISK_01_YES | przycisk | GO DOWN | 2 | bez zmian. |
| M1_RISK_01_NO | przycisk (domyślny fokus, Esc) | STAY | 1 | bez zmian. |
| M1_RISK_01B | brama areny bossa na głęb. 3 | Fight the boss? You can lose {at_risk} cr. | 8 | **ZATWIERDZONE (GD, 25.10.2026). Zmiana (QA):** „guard” → „boss”, bo myliło się z Curfew Guard; boss areny to Rail Guardian. Wcześniej zatwierdzone (GD). Na głęb. 3 nie ma „deeper” ani „down”, za bramą jest arena. **Do wdrożenia przez Mechaniki (§2.7a: osobny tekst dla bramy areny) i UI (to samo okno, inne ID tekstu i przycisku).** |
| M1_RISK_01B_YES | przycisk przy bramie | GO IN | 2 | zatwierdzone (GD); NO = M1_RISK_01_NO „STAY”. |
| M1_RISK_02 | linia tooltipu przedmiotu ryzykownego | Can be lost if you die. | 6 | bez zmian. |
| M1_RISK_02_TAG | **nowy, opcjonalny:** krótki znacznik na slocie, jeśli GRAF chce tekst zamiast ikony | AT RISK | 2 | to samo słowo co w HUD (`AT RISK: {cr}`), ≤ 7 znaków. Jeśli GRAF da ikonę, ID wypada. |
| M1_RISK_03 | tooltip Issue | Issue gear. You never lose it. | 6 | bez zmian; zgodne z M1_GEAR_ISSUE („…you cannot lose it.”). |
| M1_RISK_04 (alias: **M1_UI_DEATH_RULE**, ten sam tekst) | BASE, panel po pierwszej śmierci z łupem (raz na zapis, flaga `riskExplainerSeen`). **Zatwierdzone (GD), pełna wersja, 2 strony** | You lost your bag, your gear except Issue, and the credits from this zone: {items_lost} items, {cr_lost} cr. You cannot get them back from your body. **[[PAGE]]** Safe: your locker, base credits, base upgrades, the grid and solved terminals. | 3 zd. / 2 str. | **Podział stron:** znacznik `[[PAGE]]` = nowa strona (przycisk M1_TERM_BTN_NEXT „NEXT” / DALEJ jak w oknie tekstu). Strona 1 = co przepadło + brak odzysku (2 zdania). Strona 2 = **cała lista „co zostaje” na jednej stronie** (1 zdanie). Podział tylko na granicy zdań. Ostatnia strona: przycisk M1_RISK_04_OK. Treść: STRACONE = plecak, założony sprzęt poza Issue, kredyty zebrane w tej strefie; ZOSTAJE = skrytka (Hunter Locker), kredyty w bazie, ulepszenia bazy, postęp sieci, rozwiązane terminale. Alias `M1_UI_DEATH_RULE` wskazuje ten sam tekst. **QA (25.10.2026):** pełna wersja zostaje (decyzja GD); każda strona ma maks. 2 zdania (str. 1: 2, str. 2: 1), więc spełnia zasadę 2 zdań na fragment. |
| M1_RISK_04_OK | przycisk panelu | OK | 1 | |
| M1_RISK_SETTING | przełącznik w ustawieniach (domyślnie ON) | Ask before going deeper | 4 | **zmiana:** robocze „Confirm before going deeper” – „confirm” to B1. „Ask” jest A2 i mówi to samo. |

### 12.3. Samouczek w Prologu (§2.19)
| ID | Krok | Tekst | sł. | Uwagi |
|---|---|---|---|---|
| M1_TUT_01T | T01 ruch (dotyk) | Drag here to move. | 4 | bez zmian. |
| M1_TUT_01K | T01 ruch (klawiatura) | Move: {KEY_MOVE}. | 2 | bez zmian. |
| M1_TUT_02T | T02 puls przycisku LIFT w menu bazy (Mechaniki v0.5.2: baza to menu, nie chodzona) | Tap LIFT to go down. | 20 | **zmiana 25.10 (v0.5.2), ZATWIERDZONE (GD, 25.10.2026).** Słowo LIFT = M1_UI_BTN_LIFT. |
| M1_TUT_02K | T02 jw. | Choose LIFT. Press {KEY_CONFIRM} to go down. | 34 (po podstawieniu „Enter”) | **ZATWIERDZONE (GD, 25.10.2026).** Zmiana tylko tokenu (`{KEY_USE}` → `{KEY_CONFIRM}`), sens zatwierdzony. UI: menu bazy i wszystkie okna potwierdza się Enter (E też działa, Spacja nigdy); wybór w menu strzałkami / WASD. |
| M1_TUT_03T | T03 atak | Walk into it to hit. Or tap ATK. | 8 | bez zmian. |
| M1_TUT_03K | T03 | Walk into it, or press {KEY_ATK}. | 6 | bez zmian. |
| M1_TUT_04 | T04 zapowiedź (zamrożenie) | ! means attack. Step off the x. | 7 | **ZATWIERDZONE (GD, 25.10.2026). Zmiana (QA):** usunięte „Yellow” – tekst nie może opierać się na kolorze (dostępność). Żółty `!` zostaje w grafice (GRAF, `assety-m1.md` §2). Wariant K = ten sam tekst (bez klawiszy). |
| M1_TUT_04B | T04 bez zamrożenia | Move away when you see ! | 6 | dodane „away”; bez koloru, zgodne z QA. |
| M1_TUT_05T | T05 Med-Patch | Tap [+] to heal. | 4 | bez zmian. |
| M1_TUT_05K | T05 | Press {KEY_HEAL} to heal. | 4 | bez zmian. |
| M1_TUT_06T | T06 Dash | Tap DASH to jump away. | 5 | wymaga etykiety DASH na slocie sk1 (M1_HUD_SK1). |
| M1_TUT_06K | T06 | Press {KEY_SK1} to dash away. | 5 | „to dash” → „to dash away” (spójnie z T). |
| M1_TUT_07 | T07 AT RISK | AT RISK: you lose this if you die. | 8 | bez zmian. |
| M1_TUT_08 | T07 plecak ≥ 9/12 | Bag almost full. | 3 | bez zmian; spójne z M1_SYS_06 „Bag full.” |
| M1_TUT_09T | T08 terminal | Tap USE at the terminal. | 5 | bez zmian. |
| M1_TUT_09K | T08 | Press {KEY_USE} at the terminal. | 5 | bez zmian. |
| M1_TUT_10T | T09 Shock Pulse | Tap PULSE to stop the attack. | 6 | wymaga etykiety PULSE na sk2 (M1_HUD_SK2). |
| M1_TUT_10K | T09 | Press {KEY_SK2} to stop the attack. | 6 | bez zmian. |
| M1_TUT_11 | T10, BASE po First Light | Now go back to the lift. | 6 | **zmiana:** robocze „Line is on…” powtarzałoby `M1_TERM_OK` i `M1_BASE_09` („Line restored…”), które pokazują się w tej samej chwili. Strzałka do szybu mówi, gdzie iść. |
| M1_TUT_12T | T10 przy szybie | Hold USE to call the lift. | 6 | bez zmian. |
| M1_TUT_12K | T10 | Hold {KEY_USE} to call the lift. | 6 | bez zmian. |
| M1_TUT_13 | T10 przerwane wezwanie | Stand still and keep holding. | 5 | zmiana: „Stay still while calling” (forma -ing) → prostsze dwa polecenia. Wezwanie przerywa też atak i obrażenia; tekst mówi o najczęstszej przyczynie. |
| M1_TUT_14 | T11, BASE, pierwsza śmierć bez łupu (panel) | New print complete. Your base, grid and skills are safe. | 2 zd. | BASE, spójne z M1_BASE_01/03 („Print complete”). |
| M1_TUT_15 | T11, pierwsze otwarcie sprzętu w bazie (panel) | Issue gear is always yours. The rest can be lost. | 2 zd. | bez zmian; spójne z M1_RISK_02/03. |
| M1_TUT_16T | T12 Buddy Drone | Tap DRONE. Enemies near it attack it. | 7 | wymaga etykiety DRONE na sk3 (M1_HUD_SK3). |
| M1_TUT_16K | T12 | Press {KEY_SK3}. Enemies near it attack it. | 7 | bez zmian. |
| M1_TUT_17 | T13, BASE przy tablicy kontraktów | Short orders. Each takes a few minutes. | 7 | „One takes” → „Each takes” (jaśniej). „Orders” jak w M1_BASE_10 („New order on the terminal”). |
| M1_TUT_SETTING | przełącznik w ustawieniach (domyślnie ON) | Hints | 1 | bez zmian. Opcjonalny opis pod spodem: **M1_TUT_SETTING_DESC** „Short help while you play.” (5). |
| M1_TUT_SKIP_PROLOGUE | nowa gra, gdy na urządzeniu jest ukończony Prolog (pytanie 1) | You know the start. Skip the tutorial? | 38 | **nowe (Mechaniki v0.5.2), ZATWIERDZONE (GD, 25.10.2026).** SKIP / PLAY, domyślnie PLAY. Przyciski poniżej. **Domyślny fokus i Esc = PLAY** (UI). |
| M1_TUT_SKIP_PROLOGUE_YES | przycisk | SKIP | 4 | „SKIP TUTORIAL” (13) za długie na przycisk (≤8). |
| M1_TUT_SKIP_PROLOGUE_NO | przycisk | PLAY | 4 | „PLAY PROLOGUE” za długie; „prologue” ponad A2. |
| M1_TUT_SKIP | pytanie 2, po wyborze SKIP (tutorial pominięty, ale można zostawić podpowiedzi) | Show hints? | 11 | **ZATWIERDZONE (GD, 25.10.2026), domyślnie YES.** Zmiana 25.10: „You know the start.” przeniesione do pytania 1. **Domyślny fokus i Esc = YES** (UI). Do potwierdzenia przez Mechaniki: v0.5.2 mówi „po NO” – przyjmuję, że chodzi o NO na pytanie „czy grać Prolog”, czyli wybór SKIP. |
| M1_TUT_SKIP_YES | przycisk pytania 2 | YES | 1 | |
| M1_TUT_SKIP_NO | przycisk pytania 2 | NO | 1 | |
| M1_TUT_18 | T10a, przy wezwaniu windy (Mechaniki v0.5.2) | Enemies come to the lift. Get in fast. | 38 | **ZATWIERDZONE (GD, 25.10.2026), wersja GD.** Poprzednie „…Stay close.” było dwuznaczne. Mieści się w limicie ≤ 38. Nie powtarza M1_SYS_05. |

### 12.4. Etykiety slotów umiejętności (potrzebne do tekstów T)
| ID | Slot | Tekst | Uwagi |
|---|---|---|---|
| M1_HUD_SK1 | sk1 | DASH | **nowy:** teksty M1_TUT_06T/10T/16T mówią „Tap DASH / PULSE / DRONE”, więc przyciski muszą mieć te etykiety (≤ 5 znaków). Jeśli UI da same ikony, teksty T zmienię na „Tap the first skill…”. |
| M1_HUD_SK2 | sk2 | PULSE | jw. (skrót od Shock Pulse) |
| M1_HUD_SK3 | sk3 | DRONE | jw. (skrót od Buddy Drone) |

### 12.5. Zgodność z zatwierdzonymi tekstami
- Stare tokeny umiejętności Vault (prefiks SK1 + VAULT): sprawdzone, w pliku nie ma już żadnego (są tylko `{SK1_DASH_RANGE}`, `{SK1_DASH_COOLDOWN_MS}`, `{SK1_MOMENTUM_BONUS}`).
- Treść zatwierdzonych linii bez zmian. Pytania 24, 26 i 28 rozstrzygnięte przez GD; 25 i 27 zostają otwarte.
- Pasek podpowiedzi: na 568×320 jest na dole (UI). Tekst się nie zmienia, ale opis „pasek u góry” w Mechanikach §2.19 jest do poprawki.


## 13. Ulepszenia bazy Lights II/III i Kalibracja (ZATWIERDZONE przez GD, 25.10.2026)
> **Decyzje GD (25.10.2026):** sekcja zatwierdzona w całości. (30) Lights II i III kupuje się przez **BASE**, jak inne ulepszenia bazy; Exchange tylko korzysta z efektu (półka, szansa r3). (31) **Każdy** stopień Lights daje +10 slotów skrytki; liczby tylko jako `{STASH_SLOTS}` (ustala Balans). (32, **częściowo**) Issue uzupełnia Med-Patche do maks. `{ISSUE_MEDPATCH_TOPUP}` (**wartość otwarta:** Mechaniki mają 2, Balans porówna opcje; w tekstach nigdy liczba, tylko zmienna) przy każdym wyjeździe windą; M1_GEAR_ISSUE_TOPUP tylko przy wyjeździe i tylko, gdy coś uzupełniono (sekcja 10). (33) Opłata przepada także przy KEEP OLD; gracz musi to wiedzieć przed zapłatą (M1_CAL_CONFIRM). NEW STATS na przycisku, NEW ROLL tylko na wąskim przycisku.
> **Uwaga (Mechaniki):** Mechaniki v0.5 mają w M1 tylko jedno ulepszenie Lights; GD zdecydował o trzech stopniach i uzgadnia Balans oraz Mechaniki.
Źródła: `design/balans-m1.md` v1.1 (§4, tabela ekonomii, §7 ujścia kredytów: `BASE_UPGRADE_COST`, `BASE_UPGRADE2_COST`, `BASE_UPGRADE3_COST`, `SHOP_STOCK`, `SHOP_R3_CHANCE`, `STASH_SLOTS`, `ISSUE_MEDPATCH_TOPUP`, `CALIBRATE_COST`), `design/mechaniki-m1.md` v0.5 §2.15 (Lights I = „Lights Above the Base”, `M1_BASE_08`), fakty od GD: Lights II = +1 miejsce na półce Exchange i +10 w skrytce (locker), Lights III = większa szansa na r3 (Grid-Grade) na półce, Kalibracja = przelosowanie właściwości, gracz wybiera stary albo nowy zestaw.
Zasady jak zawsze: A2, krótko, BASE czysta i trochę sucha, bez WARDEN/Static. **Liczby tylko jako tokeny z Balansu** (wartości po ulepszeniu, np. `{STASH_SLOTS}` = nowa liczba slotów), żeby tekst był zawsze prawdziwy. Gdzie Balans nie ma nazwy, jest `[..._TBD]`. Przyciski ≤ 6–8 znaków, przyciski wyboru ≤ 10.

### 13.1. Nazwy stopni (menu ulepszeń BASE)
| ID | Tekst | Uwagi |
|---|---|---|
| M1_UPG_LIGHTS_1_NAME | Lights I | Stopień I to istniejące „Lights Above the Base” (Mechaniki 2.15, `M1_BASE_08`). W menu proponuję krótkie nazwy „Lights I / II / III”, żeby było widać stopnie; „Lights Above the Base” zostaje jako podtytuł stopnia I (M1_UPG_LIGHTS_1_SUB). |
| M1_UPG_LIGHTS_1_SUB | Lights Above the Base | nazwa z Mechanik, bez zmian. |
| M1_UPG_LIGHTS_2_NAME | Lights II | |
| M1_UPG_LIGHTS_3_NAME | Lights III | |

### 13.2. Opisy stopni w menu
| ID | Tekst | Uwagi |
|---|---|---|
| M1_UPG_LIGHTS_1_DESC | Turn on the lights above the base. Locker: {STASH_SLOTS} slots. Issue Med-Patches: {ISSUE_MEDPATCH_TOPUP}. | zatwierdzone (GD). Skrytka +10 (decyzja 31). Zdanie o Med-Patchach **przywrócone** (GD + Balans 25.10, pyt. 34): uzupełnianie 2 → 3 po Lights I; liczba tylko na zmiennej. |
| M1_UPG_LIGHTS_2_DESC | More light above the base. One more item on the Exchange shelf: {SHOP_STOCK} items. Locker: {STASH_SLOTS} slots. | `{SHOP_STOCK}` i `{STASH_SLOTS}` = wartości po ulepszeniu (4 i wg Balansu; +10 na stopień). „One more” bez cyfry, bo GD podał +1 jako fakt; jeśli Balans zmieni bonus, token pokazuje prawdziwą sumę. |
| M1_UPG_LIGHTS_3_DESC | All lights above the base. Grid-Grade items come to the shelf more often: {SHOP_R3_CHANCE}. Locker: {STASH_SLOTS} slots. | `{SHOP_R3_CHANCE}` = szansa po ulepszeniu (Balans: 20%), wyświetlana z „%”. **Dopisane „Locker”** po decyzji GD 31 (każdy stopień +10). |
| M1_UPG_COST | Cost: {cost_cr} cr + {cost_cu} Copper | wspólna linia kosztu; wartości z `BASE_UPGRADE_COST` / `BASE_UPGRADE2_COST` / `BASE_UPGRADE3_COST`. |
| M1_UPG_NEEDS | Needs {upgrade_name} first. | stopień II wymaga I, III wymaga II. Lights I wymaga też rozwiązania `M1_TERM_08`: **M1_UPG_NEEDS_TERM** „Fix the Bunker Line first.” (nazwa rozdzielni z 11.4). |
| M1_UPG_BTN_BUILD | BUILD | przycisk (5 zn.). |
| M1_UPG_DONE | BUILT | etykieta zbudowanego stopnia (5 zn.). |
| M1_UPG_NO_FUNDS | Not enough credits or Copper. | brak środków (spójne z M1_EXCH_04). |

### 13.3. Linia BASE przy zakupie
| ID | Stopień | Tekst | Uwagi |
|---|---|---|---|
| M1_BASE_08 | Lights I | (zatwierdzone, bez zmian) Power to the bunker is back. The lights above the base are on. You can see them from the zone now. | Lights I ma już linię – nie dodaję nowej. |
| M1_BASE_15 | Lights II | More lights above the base. The Exchange lit one more shelf, and the locker has more room. | 2 zdania. |
| M1_BASE_16 | Lights III | All lights above the base are on. The Exchange now finds Grid-Grade goods more often. It looks happy, for a machine. | 3 zdania; ostatnie to sucha uwaga BASE. Balans [Z]: wizualnie pełne światła nad bazą. Skrytka +10 widoczna w opisie menu (M1_UPG_LIGHTS_3_DESC); linia bez zmian, żeby nie przekroczyć 3 zdań. |

### 13.4. Kalibracja (usługa automatu Exchange)
Kto: **Exchange** (Balans §4 „Automat”, ujście (b)). Tylko przedmioty rzadkości ≥ 2 (Tuned, Grid-Grade), nie dla Issue. Rzadkość, slot i poziom zostają, zmieniają się tylko właściwości.
| ID | Element | Tekst | zn./zd. | Uwagi |
|---|---|---|---|---|
| M1_CAL_BTN | przycisk usługi w Exchange | NEW STATS | 9 | **widoczna nazwa zamiast „Calibration”** (B1+). „Calibrate/tune/retune” odpadają: „Tuned” to rzadkość 2, a „retune” jest już w zagadce (ponowne zestrojenie). Wewnętrzna nazwa w kodzie i dokumentach: Calibration. Zatwierdzone (GD). Wąski przycisk: **M1_CAL_BTN_SHORT** = NEW ROLL (8). |
| M1_CAL_BTN_SHORT | ten sam przycisk, tylko gdy jest wąski | NEW ROLL | 8 | zatwierdzone (GD); tylko na wąskim przycisku. |
| M1_CAL_DESC | opis usługi (1 zdanie) | The Exchange gives this item new random stats, and you choose the old or the new ones. | 1 zd. | |
| M1_CAL_COST | linia kosztu | Cost: {CALIBRATE_COST} cr. You pay before you choose. | 2 zd. | **zmiana po decyzji GD 33:** spójne z M1_CAL_CONFIRM. `{CALIBRATE_COST}` rośnie z każdą kalibracją tego przedmiotu (Balans). |
| M1_CAL_CONFIRM | potwierdzenie **przed zapłatą** | You pay first. The money does not come back, even if you keep the old stats. | 2 zd. | **nowy** (decyzja GD 33). Jasno mówi, że opłata przepada przy KEEP OLD. |
| M1_CAL_CONFIRM_YES | przycisk | PAY | 3 | **nowy.** |
| M1_CAL_CONFIRM_NO | przycisk | BACK | 4 | **nowy.** |
| M1_CAL_NOT_R1 | przedmiot Salvaged | Only Tuned or Grid-Grade items. | 1 zd. | |
| M1_CAL_NOT_ISSUE | przedmiot Issue | Issue gear cannot get new stats. | 1 zd. | spójne z M1_GEAR_ISSUE. |
| M1_CAL_OLD_HEAD | nagłówek kolumny | OLD | 3 | ekran porównania. |
| M1_CAL_NEW_HEAD | nagłówek kolumny | NEW | 3 | |
| M1_CAL_KEEP | przycisk wyboru | KEEP OLD | 8 | robocze bez zmian: A2, ≤ 10 zn. |
| M1_CAL_TAKE | przycisk wyboru | TAKE NEW | 8 | robocze bez zmian. |
| M1_EXCH_07 | Exchange po przelosowaniu (sucha uwaga automatu) | New stats are ready. Please choose. I do not judge. | 3 zd. | głos Exchange jak M1_EXCH_01–06. |

### 13.5. Konflikty i uwagi
- „Calibration” (B1+) nie pojawia się na ekranie; gracz widzi NEW STATS (wąski przycisk: NEW ROLL). Nie używam czasowników „tune/retune” obok rzadkości Tuned ani obok „ponownego zestrojenia” zagadki.
- Pytania 30–33 rozstrzygnięte przez GD (25.10.2026). Nowe: 34 (Med-Patche a Lights I).
- „Locker” = skrytka (M1_ITEM_LOCKER), „shelf” = półka Exchange (słowo A2, nowe w tekstach gry).


## 14. Teksty UI: winda, terminal, strzałka (ZATWIERDZONE przez GD, 25.10.2026)
Źródło: `prog/ui-m1.md` §15 (nowe ID od UI), §11.6 (strzałka do szybu), §11.7 (przytrzymanie USE i odliczanie windy), §12 pkt 1 i 3 (terminal), §13 (limity). Spójne z: M1_BASE_06 („The lift is here. I can hold it for 10 seconds…”), M1_SYS_05 („The lift is loud. Enemies are coming.”), M1_LOC_EVAC („CALL BASE”), M1_TUT_12T/K („Hold USE to call the lift.”), wezwanie = przytrzymanie `EVAC_CALL_HOLD_MS` (1,5 s, R6 może dać 1,0 s – tekst nie podaje czasu), wiersze odbiorników z `{receiver}`. Wszystkie ID są nowe (w pliku nie było `M1_UI_*`). Długości liczone po podstawieniu tokenów.

| ID | Gdzie | Tekst | zn. (maks.) | Uwagi |
|---|---|---|---|---|
| M1_UI_BTN_LIFT | przycisk w bazie-hubie (wyjazd windą) | LIFT | 4 (≤ 8) | **nowy.** To samo słowo co w M1_TUT_02 („…take the lift”) i w odliczaniu. M1_TUT_02T „Tap LIFT to go down.” i M1_TUT_02K „Choose LIFT. Press {KEY_CONFIRM} to go down.” zatwierdzone (GD). |
| M1_UI_CALL | HUD na PC, przed paskiem przytrzymania: `CALL [####------]` | CALL | 4 (≤ 10) | **nowy.** Spójne z ekranem szybu „CALL BASE” (M1_LOC_EVAC) i „Hold … to call the lift” (M1_TUT_12K). Pasek to grafika, nie tekst. |
| M1_UI_LIFT_COMING | HUD, odliczanie dojazdu windy (sekundy w górę) | LIFT {s} | 6 (≤ 10) | **nowy.** `{s}` = sekundy do przyjazdu (5/7/9). Format od UI. W tym czasie może się pokazać M1_SYS_05 (osobny komunikat, bez zmian). |
| M1_UI_LIFT_HERE | HUD, winda czeka (`{s}` od 10 w dół) | GET IN {s} | 9 (≤ 10) | **nowy, zmiana względem przykładu UI:** „LIFT HERE {s}” przy `{s}` = 10 ma **12 znaków**, czyli więcej niż limit 10. „GET IN” to polecenie A2, które mówi, co zrobić, spójne z M1_RISK_01B_YES „GO IN”. M1_BASE_06 pokazuje się w tej samej chwili i mówi „The lift is here”, więc słowo „HERE” nie musi się powtarzać. Jeśli UI woli zostać przy „LIFT”: **LIFT! {s}** (8). |
| M1_UI_ROTATE_TERMINAL | komunikat, gdy ekran jest za niski na terminal (< ~256 px) | Turn your phone to use the terminal. | 36 (≤ 38) | **nowy.** A2, bez „landscape/rotate”. |
| M1_UI_TERM_RCV_ROW | wiersz listy odbiorników w panelu terminala | `{receiver} {got}/{need}`, np. `A 3/4` | maks. 7 (`I 12/12`) | **format, bez słów. Zmiana 25.10.2026 (GD q22 = c):** w M1 bez typu urządzenia; wcześniejsza propozycja `A PUMP 3/4` i zapas UI `A DEVICE 2/2` odpadają. Typy w puli M2 (kodeks). |
| M1_UI_SHAFT_ARROW_DIST | strzałka do szybu na brzegu ekranu (Prolog) | `{dist}` | 1–2 | **bez słów:** sama liczba pól obok glifu strzałki (np. `↗ 12`). Słowo „m” albo „tiles” dodawałoby jednostkę, której gra nigdzie nie używa. ID zostaje dla porządku (token `{dist}`). |

**Przepływ ewakuacji (kolejność tekstów):** `M1_TUT_12T/K` (Prolog) → przytrzymanie: `CALL [####------]` (PC) / pasek w USE → przerwanie: `M1_TUT_13` (Prolog) → `LIFT {s}` (+ ewentualnie `M1_SYS_05`) → przyjazd: `M1_BASE_06` + `GET IN {s}` od 10 do 0. Liczba 10 w M1_BASE_06 i start odliczania są zgodne (`EVAC_HOLD_S`).


---

## Pula M2 (przeniesione z M1, decyzja GD 25.10.2026)

System odzysku zwłok jako ulepszenie bazy w M2. Teksty do ponownego sprawdzenia, gdy Mechaniki zaprojektują ten system.

| ID | Kontekst | Tekst |
|---|---|---|
| M2_SYS_01 (było M1_SYS_01) | Zbieracze wyruszają do zwłok gracza (ikona zwłok → `!`) | Scrappers are going to your body! |
| M2_SYS_02 (było M1_SYS_02) | Zbieracz z łupem ucieka do nory (opcjonalny) | A Scrapper is running with your gear! |
| M2_SYS_03 (było M1_SYS_03) | Zbieracz z łupem zniknął w norze (opcjonalny) | The Scrapper got away with your gear. |
| M2_NOTE_47_BODY (było M1_NOTE_47_BODY) | Opis własnych zwłok przy USE, od M2 (Recovery Beacon). W M1 gracz nie wraca do zwłok, nowy poziom co wyprawę (Mechaniki 2.7). Tekst zatwierdzony przez GD; ostatnie zdanie do sprawdzenia, gdy w M2 będzie odzysk | The number on the arm says 47. This was you, one print ago. Nothing here can be used now. |
| M2_BASE_03 (pierwotne M1_BASE_03) | Kolejny wydruk po śmierci, gdy w M2 będzie odzysk zwłok | Hunter 47. Print complete. Your body and your gear are still in the zone. Your memory is here. |
| M1_DEATH_01_HAZ (bez zmiany ID; nieużywane w M1) | Zabójca to otoczenie – gdy w grze pojawią się obrażenia od otoczenia (w M1 ciecz `~` to dekoracja, Mechaniki 25.10.2026) | Killed by: {hazard_name} |
| M2_BASE_14 (pierwotne M1_BASE_14) | Stopka podsumowania po śmierci, gdy w M2 będzie odzysk zwłok | All data is saved. Your gear is still out there. |

### Pula M2: typy urządzeń Power Lines (materiał na kodeks wiedzy; przeniesione z 11.3a, GD q22 = c, 25.10.2026)
ID bez zmian (JSON v0.5.0 odwołuje się do nich w `type_text_id`). W M1 nieużywane.
| ID | Etykieta | Opis | zn. |
|---|---|---|---|
| M1_TERM_TYPE_LIGHT | LIGHT | Gives light to a room or road. | 30 |
| M1_TERM_TYPE_HOUSE | HOUSE | Power for one home. | 19 |
| M1_TERM_TYPE_TOWN | TOWN | Power for the whole town. | 25 |
| M1_TERM_TYPE_FRIDGE | FRIDGE | Keeps food cold. | 16 |
| M1_TERM_TYPE_PUMP | PUMP | Moves water to the houses. | 26 |
| M1_TERM_TYPE_CHARGER | CHARGER | Gives power to a drone. | 23 |
| M1_TERM_TYPE_GATE | GATE | Opens and closes the road. | 26 |
| M1_TERM_TYPE_MOTOR | MOTOR | Moves the big rail gate. | 24 |
| M1_TERM_TYPE_SIGNAL | SIGNAL | Tells trains to stop or go. | 27 |
| M1_TERM_TYPE_DOOR | DOOR | Opens a big door in the hall. | 29 |

## Otwarte pytania / placeholdery

**Placeholdery do uzupełnienia (Mechaniki / Balans / Level Design):**
- ~~`[EVAC_TIME_TBD]`~~ – UZUPEŁNIONE: 10 s (M1_BASE_06, Mechaniki 2.8 `EVAC_HOLD_S`).
- `[PROP_01_TBD]`–`[PROP_12_TBD]` – lista 12 właściwości; po tabeli Balansu dopasuję prefiksy/sufiksy.
- `[ITEM_STAT_TBD]`, `[PRICE_TBD]`, `[REWARD_TBD]`, `[N_TBD]`, `[MATERIAL_TBD]`, `[RARITY_TBD]` – kontrakty (`[RELAY_ID_TBD]` usunięte 25.10: M1_CONTR_01 używa `{depth}`, bo tablica zna tylko głębokość), ceny, nagrody.
- `[ENEMY_ABILITY_TBD]`, `[BOSS_ABILITY_TBD]` – umiejętności wrogów i bossa; 3 umiejętności gracza (nazwy i opisy) celowo pominięte do decyzji Mechanik.
- `{MEDPATCH_COUNT}` – **nowy token czasu gry dla PROG** (M1_GEAR_ISSUE_TOPUP): liczba Med-Patchy w plecaku po uzupełnieniu przy wyjeździe windą.
- `{time}`, `{depth}`, `{items_in}`, `{items_lost}`, `{credits}`, `{grid_pct}` – wartości z gry w podsumowaniu sesji (zawsze prawdziwe). Pola podsumowania do potwierdzenia z UI.

**Konflikty i niejasności w źródłach:**
1. **Numeracja sekcji:** w zleceniu „sekcja 9 = lista slotów” – w fabula-reprint.md sekcja 9 to „Do ustalenia”, a lista slotów jest w zakres-m1.md §9. Zastrzeżenia GD są w fabula-reprint.md §10. Pracowałem na tych dwóch.
2. **Miejsce zwłok #46:** fabula-reprint.md (Prolog) – „po drodze do najbliższej podstacji”; zakres-m1.md – głębokość 2 (Solar Fields). Przyjąłem zakres-m1 (nowszy, dla M1). **ROZSTRZYGNIĘTE:** obowiązuje głębokość 2, Solar Fields.
3. **#46 „Last” doszedł do rdzenia (Akt III), a jego zwłoki leżą w pierwszym sektorze.** Teksty tego nie wyjaśniają (celowo). Czy Scenarzysta ma wyjaśnienie (wrócił? ktoś go przeniósł? to inne ciało?), żeby późniejsze zapiski się nie gryzły? **ROZSTRZYGNIĘTE (Scenarzysta):** #46 dotarł do rdzenia, wrócił w pobliże bazy ostrzec następcę i tam zginął; Vat go już nie wydrukował (wyjaśnienie w Akcie III). Zapisek pasuje bez zmian.
4. **Numer po śmierci:** czy nowy wydruk po śmierci gracza to nadal „Hunter 47”, czy #48, #49…? Przyjąłem „Hunter 47” (pamięć zsynchronizowana = ten sam łowca), ale to wpływa na wątek Aktu II („liczba 47 to nie wszystko”).
5. **Notatki mieszkańców vs Quiet Streets:** zakres-m1 §9 każe pisać notatki mieszkańców, a §2 wyklucza wątek Quiet Streets z M1. Napisałem neutralne notatki bez cytatu „The lights went out at 3:12” (zostawiam go dla Quiet Streets w M2). Czy notatki M1 trafiają potem do kodeksu (który też jest poza M1)?
6. **„Don't trust the quiet”** (zatwierdzony zapisek #46) to delikatna aluzja do Quiet Protocol. Jest zatwierdzony, więc go zostawiłem, ale w tekstach M1 unikam innych skojarzeń z „quiet” jako nazwą.
7. **Źródło sygnału w teaserze** nie jest określone. Wersja główna brzmi jak ludzie (może sugerować orbitę z Aktu II – to nie WARDEN ani Szum, ale coś zdradza). Wersja zapasowa jest maszynowa i bardziej neutralna. Prośba o wybór.
8. **Zbieracz i zwłoki:** opis M1_ENEMY_03 wspomina „bodies” – do decyzji Mechanik, czy rozgrabianie zwłok jest w M1.
9. **M1_TERM_08 (linia do bunkra)** łączy zagadkę z ulepszeniem bazy – czy ulepszenie jest kupowane/budowane, czy odblokowane linią? (zakres-m1 §3 tego nie rozstrzyga). **ROZSTRZYGNIĘTE (Mechaniki 2.14):** TERM_08 odblokowuje ulepszenie, budowa kosztuje kredyty i Copper. Teksty pasują bez zmian.

**Dokładka od Mechanik – pytania (do GD):**
10. **ROZSTRZYGNIĘTE (GD): linia przy przyjeździe, „The lift is here.”.** Moment M1_BASE_06: okno 10 s liczy się od przyjazdu windy (po 5/7/9 s dojazdu), a linia zaczyna się od „Lift called”. Jeśli pokażemy ją przy wezwaniu, gracz może myśleć, że ma 10 s łącznie. Propozycja: pokazać ją w chwili przyjazdu i zmienić początek na „The lift is here.” (zmiana zatwierdzonej linii, czeka na GD). Do tego czasu przy wezwaniu pokazywać M1_SYS_05.
11. **ROZSTRZYGNIĘTE (GD): brak odzysku w M1, SYS_01–03 w puli M2.** Zbieracze w M1 (M1_SYS_01–03) czekają na decyzję GD (mechaniki-m1.md 2.17 pkt 1). Jeśli GD odrzuci, te trzy ID wypadają, a M1_ENEMY_03 i tak może zostać.
12. **ROZSTRZYGNIĘTE (GD): +% leczenia z Med-Patchy.** M1_AFFIX_06 (Patched / of Repair): Mechaniki proponują zmianę właściwości z regeneracji na „+% leczenia z Med-Patchy” (2.12). Nazwy pasują bez zmian, decyzja Balansu.
13. (Mniej pilne: ikona zwłok przy komunikacie o Zbieraczach przeszła do M2.) **Glif `!`:** Med-Patch w plecaku (2.11), ikona zwłok przy M1_SYS_01 (2.7) i telegraf GRAF nad wrogiem używają `!`. To pytanie do GRAF, ale wpływa na czytelność komunikatu o Zbieraczach.
14. **ZATWIERDZONE (GD), do przekazania Mechanikom i UI. Ostateczna nazwa drona: „Buddy Drone” (zatwierdzona przez GD).** Nazwy umiejętności: proponowane Dash / Shock Pulse / Helper Drone zamiast Vault / Arc Pulse / Salvage Drone (uzasadnienie w 10.2). Mechaniki i PROG muszą przejąć nazwy (dokument mechanik i kod używają nazw roboczych).

**Terminal Power Lines (sekcja 11) – pytania:**
15. **ROZSTRZYGNIĘTE (GD):** konteksty `M1_TERM_01–08` nie są skracane. Jeśli nie mieszczą się nad siatką, idą jako osobna strona przed zagadką z przyciskiem NEXT (`M1_TERM_BTN_NEXT`, 11.1). Decyzja o układzie: UI.
16. **ROZSTRZYGNIĘTE (GD):** kontekst `M1_TERM_08` zmieniony na „…Fix it, and BASE can turn on the lights above the base.”
17. **ROZSTRZYGNIĘTE (częściowo):** `M1_TERM_06_TIP_1` przepisany na „three equal parts” (prawda dla skal 1 i 2). Do potwierdzenia przez LUZ, czy zdjąć `hint_off_when_invalid` dla skali 2.
18. **ROZSTRZYGNIĘTE (GD):** w legendzie DEVICE. Typy urządzeń w M1 nie występują (q22 = c); 10 nazw z opisami w puli M2 (kodeks).
19. **Przekazane do PROG:** tokeny `{box_power}` / `{box_lines}` dla M1_TERM_TRIP (wynik symulacji, nie pole JSON) – nazwy w kodzie do potwierdzenia.
20. **ROZSTRZYGNIĘTE (GD):** M1_TERM_FAIL tylko dla OVERLOAD. Do przekazania LUZ (§6 zagadki) i PROG: nowe ID `M1_TERM_TRIP`, `M1_TERM_FUSE`, `M1_TERM_SHORT`, `M1_TERM_LOW`, `M1_TERM_OK_RETUNE`.
21. **ROZSTRZYGNIĘTE (UI §13, 25.10.2026):** twardy limit TIP ≤ 90 po podstawieniu tokenów. Skrócone 11 TIP-ów (+ 08_TIP_2 dla zapasu); wszystkie 24 mają teraz ≤ 80 znaków (`{source_power}` liczone jako 26). Jeśli UI obniży limit przy > 4 odbiornikach (M-P2), sprawdzę ponownie.
22. **ROZSTRZYGNIĘTE (GD, 25.10.2026): opcja (c).** W M1 brak typów urządzeń: wiersz panelu `A 3/4`, tapnięcie nic nie robi, legenda tylko DEVICE. Opcja (b) (typ w wierszu) odrzucona. Typy (10 nazw + opisy) przeniesione do puli M2 jako materiał na kodeks. Teksty zagadki sprawdzone pod kątem typów (11.5). Dla LUZ/PROG: pola `name` / `type_text_id` w JSON w M1 nieużywane.
23. **ROZSTRZYGNIĘTE (UI):** tapnięcie urządzenia nic nie robi, dymków nie ma, więc kolizja z polem przełącznika znika. Nowe pytanie do GRAF: litery A–I przy urządzeniach a zasada „bez liter / komórki tylko z liczbami” (11.3a).

**Śmierć, ryzyko, samouczek (sekcja 12) – pytania:**
24. **ROZSTRZYGNIĘTE (GD):** M1_BASE_03B „Hunter 47. Print complete. Your memory is here.” i M1_BASE_14B „All data is saved. Nothing was lost.” zatwierdzone; warunki wyświetlania przy liniach w sekcji 1 (B, gdy `{items_lost}` = 0 i `{cr_lost}` = 0).
25. **Mechaniki §2.19 T08:** przy błędzie w terminalu podany jest `M1_TERM_FAIL`, a wg zatwierdzonej sekcji 11 FAIL to tylko OVERLOAD (TRIP / FUSE / SHORT / DARK mają własne ID). Do poprawki w dokumencie Mechanik.
26. **ROZSTRZYGNIĘTE (GD):** M1_RISK_01B / M1_RISK_01B_YES zatwierdzone. Do wdrożenia przez Mechaniki (§2.7a) i UI.
27. **ROZSTRZYGNIĘTE (R6 A, Mechaniki v0.5.2): M1_SYS_05 przy przyjeździe windy.** **`M1_SYS_05`** („The lift is loud. Enemies are coming.”) – moment wyświetlenia zależy od pakietu R6 (alarm przy wezwaniu czy przy przyjeździe windy, czeka na GD). Tekst pasuje do obu wariantów.
28. **ROZSTRZYGNIĘTE (GD):** przycisk ekranu śmierci NEXT. Etykiety slotów DASH / PULSE / DRONE (12.4) – nadal do UI.

29. **Pasek podpowiedzi samouczka** na 568×320 jest na dole (UI), a Mechaniki §2.19 opisują pasek u góry. Do poprawki w dokumencie Mechanik; teksty bez zmian.
30. **ROZSTRZYGNIĘTE (GD):** Lights II i III kupuje się przez BASE, jak inne ulepszenia bazy; Exchange tylko korzysta z efektu.
31. **ROZSTRZYGNIĘTE (GD):** każdy stopień Lights daje +10 slotów skrytki; w tekstach tylko `{STASH_SLOTS}` (wartość ustala Balans).
32. **ROZSTRZYGNIĘTE (GD + Balans, 25.10.2026): uzupełnianie do 2, po Lights I do 3 – w tekstach tylko zmienne.** Wcześniej: reguła ustalona – Issue uzupełnia Med-Patche do maks. przy każdym wyjeździe windą; M1_GEAR_ISSUE_TOPUP tylko przy wyjeździe i tylko, gdy coś uzupełniono (tekst bez wydruku). **Liczba otwarta:** wcześniej podane 6 wstrzymane, Mechaniki mają 2, Balans porówna opcje. W tekstach zawsze tylko `{ISSUE_MEDPATCH_TOPUP}`.
33. **ROZSTRZYGNIĘTE (GD):** opłata przepada także przy KEEP OLD; dodane M1_CAL_CONFIRM (przed zapłatą), M1_CAL_COST ujednolicone.
34. **ROZSTRZYGNIĘTE (GD + Balans, 25.10.2026, ostatecznie): TAK – Issue uzupełnia Med-Patche do 2 przy każdym wyjeździe, po Lights I do 3 (6 = limit plecaka). Zdanie w M1_UPG_LIGHTS_1_DESC zostaje, na `{ISSUE_MEDPATCH_TOPUP}`. Wcześniejsze „nie” odwołane.** Pierwotnie: Balans v1.1 ma `ISSUE_MEDPATCH_TOPUP` podnoszone po Lights I; wartość i to, czy Lights I ją zmienia, są otwarte (pyt. 32). Jeśli Lights I nie zmienia limitu, z M1_UPG_LIGHTS_1_DESC wypada zdanie „Issue Med-Patches: …”. Do potwierdzenia przez Balans.

**Elementy:**
- M1_TERM_07 (sklep na rogu), M1_ITEM_46 (Bent Key Tag), treść sygnału M1_TEASE_02.
- Nazwy wrogów (Panel Drone, Curfew Guard, Scrapper, Line Sentry), nazwy rzadkości (Salvaged / Tuned / Grid-Grade) i prefiksy/sufiksy – to propozycje Dialogów i Lore, nie zatwierdzona fabuła.
- Drobne detale smaku: imię „Mia” (M1_NOTE_01), „forty homes” (M1_TERM_04), napisy w szafce (M1_ITEM_LOCKER), „You are my only customer this year” (M1_EXCH_06).


> **Do zrobienia po Mechaniki v0.6 (GD 25.10.2026):** przegląd TUT, tekstów walki i M1_TUT_04 („Step off the x”) pod sterowanie twin-stick bez bump-attack; nie ruszać przed v0.6.

> **STAN NA PAUZĘ (25.10.2026, 22:13, Producent: wstrzymanie):** Do zrobienia po wznowieniu: (1) M1_GEAR_ISSUE_POLE_2 – zasięg Pole II = 2 (bez zmian, Mechaniki + GRAF S23), więc „A longer, heavier pole…” → propozycja „A heavier pole from the Vat. It swings wide and hits harder, but it is still basic gear.”; wymaga akceptacji GD, potem odpowiedź GRAF (S23) i Mechanikom. (2) Po Mechaniki v0.6: przegląd TUT/walki pod twin-stick + podpowiedź {KEY_AIM} (≤38 zn.). (3) LUZ: ewentualna zmiana układu 05 i 01 (M-P2) → przepisać TIP-y.

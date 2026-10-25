# Balans M1: tabele konfiguracji (DESIGN / Balans i Ekonomia)

Status: **Decyzje GD z 25.10.2026 wpisane (v1.2).** Do akceptacji zostają tylko pozycje z „Otwarte pytania”. Wersja **1.2** (25.10.2026). Kopia v1.1: `/tmp/balans-m1_v1.1.md`.
Źródła: `mechaniki-m1.md` **v0.5**, decyzje GD z 25.10 (ujścia kredytów, NEW STATS, Lights II/III, waga Data Core, tempo do bossa, skrytka), potwierdzenie Mechaników (`M1_BASE_08` z 3 poziomami), formuła obrażeń uzgodniona z PROG, `level-m1.md` §10 (skład wrogów kontraktów, zatwierdzony przez GD), `qa/plan-testow-m1.md` (R16, R18, R20), `plan-produkcji.md`, `balans-m1-review.md`. Symulacje: `design/balans-sim/` (`wyprawa.py`, `poziomy_grupy.py`, `budzet_final.py`, `boss_v05.py`, `boss_trip_v05.py`, `kontrakty_v05.py`, `kontrakty_udzialy.py`, `progresja3.py`, `exp_qa.py`, `exp_issue6.py`, `saldo_v12.py`, wykres **`saldo_kredytow_v12.png`**).
Nazwy parametrów jak w `mechaniki-m1.md` (2.16). Oznaczenia: **[N]** nowa nazwa, **[Z]** założenie, **[P]** wartość z pliku Mechaników, **[GD]** decyzja GD. Czasy w ms (wielokrotności `TICK_MS` = 50).

## Zmiany v1.1 → v1.2
- **Ujścia kredytów [GD: przyjęte wszystkie trzy] (§4, §7):**
  - (a) r3 na półce 10% (20% przy Lights III) za ×5 ceny sprzedaży; płatne odświeżenie 25 / 50 / 100 kr, maks. 3 na wizytę, licznik zeruje się po wyprawie;
  - (b) **NEW STATS** (wcześniej „Kalibracja”): usługa przy automacie Exchange, koszt 2 × cena sprzedaży × 1,5^n, tylko r ≥ 2;
  - (c) Lights II 600 kr + 25 Cu, Lights III 1500 kr + 40 Cu.
  - Bez napraw. Ubezpieczenie przechodzi do M2. Pełna utrata w M1 zostaje.
- **NEW STATS [GD]:** gracz wybiera KEEP OLD albo nowy zestaw. Opłata przepada w obu przypadkach. **Uwaga dla UI:** oba zestawy obok siebie.
- **Lights [GD + Mechaniki]:** jedno ulepszenie `M1_BASE_08` z 3 poziomami kupowanymi kolejno w BASE, bez nowej mechaniki. Treść: 1 linia BASE na poziom i krótki opis w menu (Fabuła). Mechaniki potwierdziły zgodność z systemem, więc **Lights III zostaje w M1, a wariant awaryjny z v1.2-draft usunięty**. Każdy poziom daje +10 miejsc w skrytce [GD]. **Jedna tabela bezwzględnych wartości na poziom: §4.1.**
- **Waga Data Core na g2 = 2 [GD].** Udziały przeliczone (§5.1): z CtP g3 Relay 42% / CtP 42% / Data Core 17% (terminale dostępne).
- **Skład wrogów kontraktów [GD, `level-m1.md` §10]:** Data Core `ddh`, CtP g2 `sss`+`dht`, CtP g1 i g3 `sss`+`ddh`. Nagrody bez zmian. Zestrojenie 25 kr + 2 Cu potwierdzone.
- **Formuła obrażeń [PROG] (§1):** jedno zaokrąglenie `round` (połówki w górę) przed pancerzem, potem `floor` z minimum 1. Tabela wrogów poprawiona: Curfew Guard g2 18–25, Scrapper g2 5–8, Line Sentry g2 13–19 / g3 15–23. Wpływ na straty HP: +0–2%.
- **QA R16 / R18 / R20 (§8):**
  - **R16:** `START_CREDITS` = 50 kr;
  - **R18:** `M1_TERM_08` daje +10 Cu, a Lights I kosztuje 150 kr + 10 Cu. Lights I w 1. godzinie: z 8–12% do 50–54% przeciętnych graczy;
  - **R20:** Issue Mk2 po przystanku g2 + broń r1 na półce po śmierci. Odbudowa bez zapasu w skrytce: z 3 do 2 wypraw.
- **Tempo do bossa [GD/właściciel]:** cel ustalony: przeciętny gracz pokonuje pierwszego bossa po **~3 h**. Model: mediana 1. wygranej 150–165 min, 56–64% wygranych po 3 h. **Poprawki QA przesuwają ten moment o ≤ 15 min, czyli w granicach szumu modelu (±10–15 min), więc bez kompensacji** (§8.4).
- **Rozbieżność Issue 2 vs 6 (§9):** model liczy **uzupełnianie do 2 (3 od Lights I)**. 6 to limit plecaka. Wpisane jest to, co liczone. Wariant „do 6” policzony do porównania.

## Podsumowanie
1. **Gracz:** 100 HP, 26,25 DPS bazowo, limit 6 Med-Patchy po 40 HP, Issue uzupełnia do 2 (3 od Lights I). Wzrost ze sprzętu: DPS ~26 → ~38 → ~48–55, pułap ~70–75 [GD: OK]. Obrażenia: `round` przed pancerzem, potem `max(1, floor(x × (1 − DR)))`.
2. **Wrogowie:** HP ×1 / 1,5 / 2,2, obrażenia ×1 / 1,25 / 1,5 (round), zapowiedzi ≥ 450 ms. **Boss: 2400 HP, 20–32, 800 / 1200 ms**, mediana wygranych 86 / 68 / 46 s przy 35 / 48 / 72 DPS.
3. **Sprzęt:** 4 sloty, wartości bazowe wg ilvl, pula 12 właściwości, rzadkość = liczba właściwości. **Issue Mk2** po przystanku g2 (R20).
4. **Exchange i BASE [GD]:** Med-Patch 25 kr; półka 3 przedmiotów r1/r2 ×4 (4 od Lights II); r3 10% / 20% za ×5; odświeżenie 25 / 50 / 100; NEW STATS 2 × cena × 1,5^n; Lights I / II / III 150 kr + 10 Cu / 600 + 25 / 1500 + 40.
5. **Saldo (mediana po 3 h, `saldo_v12.py`, 300 graczy):** przeciętny gracz 2,5 tys. kr bez ujść → **~0,6–0,7 tys. kr** z ujściami; dobry 8,9 tys. → **~1,8 tys. kr**. Poprawki QA prawie nie zmieniają krzywej. Wykres: `balans-sim/saldo_kredytow_v12.png`.
6. **Kontrakty:** wszystkie ≤ kr/min wyprawy (cykl baza → baza: 20 / 48 / 90), `CONTRACT_ENEMY_LOOT` = 0, wszystkie w krótkiej sesji. Udziały (z CtP g3, waga DC 2): Relay 42% / CtP 42% / DC 17%; po wyczerpaniu terminali zestrojenie 27% / CtP 54% / DC 19%.
7. **Tempo:** przeciętny gracz g2 w ~30 min, Lights I w ~1 h (50–54% w 1. godzinie), g3 u ~65% po 3 h, boss: mediana 1. wygranej ~2,5–2,75 h, 56–64% po 3 h [GD: akceptuje]. Dobry gracz: g3 w ~1 h, boss ~65 min.
8. **Budżet HP:** pełna wyprawa 1→3 + boss: 0 / 3 / 45 / 97% sukcesu przy 50 / 60 / 70 / 80% uników („możliwa, ale trudna”). Wyprawa „na bossa” przy 48 DPS: 48 / 89 / 100%.

## Otwarte pytania
1. **GD, Issue 2 vs 6 (§9):** potwierdzasz **2 (3 od Lights I)**, czyli to, co liczyłem? Wariant „do 6” usuwa ujście ~950 kr (zakupy patchy w 4 h), przyspiesza bossa o ~20–30 min i odbiera sens nagrodzie Clear the Path (1 Med-Patch).
2. **Mechaniki, R20 Issue Mk2:** Issue Baton 10–15 i Issue Suit z pancerzem 6 po odblokowaniu przystanku g2. Zależy od postępu (przystanek), a nie od śmierci, więc nie łamie Z-GD2. Zmienia jednak opis „Issue jest stałe” (2.3). Akceptujecie?
3. **Mechaniki, R18:** nagroda +10 Cu za `M1_TERM_08` i Lights I za 150 kr + 10 Cu. Dobry gracz omija g1, więc dostaje Lights I w 1. godzinie tylko w ~50%. Wariant „bramka = dowolne 3 fragmenty sieci zamiast `M1_TERM_08`” daje 64% / 94% (przeciętny / dobry), ale zmienia 2.15. Chcecie go?
4. **QA:** cel „Lights I w 1. godzinie u ≥ 50% przeciętnych graczy” jest po R18 na styk (50–54% w dwóch przebiegach). Pomiar w B1 rozstrzygnie, czy potrzebna jest bramka z pytania 3.
5. **Model bossa:** wykorzystanie wręcz 0,6 [Z]. Jeśli QA zmierzy medianę < 65 s przy typowym sprzęcie, następna wartość to 2600 HP.

---

## 1. Gracz

| Parametr | Wartość | Jednostka | Uwagi |
|---|---|---|---|
| `PLAYER_HP` | 100 | HP | [P]; wzrost tylko z `M1_AFFIX_04` i bazy modułu |
| `PLAYER_REGEN_PER_S` | 0 | HP/s | [P] M1 |
| `PLAYER_MOVE_MS` / `PLAYER_MOVE_DIAG_MS` | 150 / 200 | ms/pole | [P] 6,7 pola/s |
| `PLAYER_ATK_RANGE` | 1 | pola | [P] wręcz |
| `PLAYER_ATK_WINDUP_MS` / `PLAYER_ATK_COOLDOWN_MS` | 100 / 300 | ms | [P] cykl 400 ms = 2,5 ciosu/s |
| `PLAYER_DMG_MIN` / `PLAYER_DMG_MAX` | 8 / 12 | HP | [P] Issue Baton = broń poz. 1 |
| `PLAYER_CRIT_CHANCE` / `PLAYER_CRIT_MULT` | 0,10 / 1,5 | — / × | [P] |
| DPS bazowy | 26,25 | HP/s | 10,5 × 2,5 × 1,05 (kryt); z `round` krytyku średni kryt 15,2 zamiast 14,8 (+0,4% DPS) |
| `RAIL_PISTOL_DMG` | 8–11 | HP | [P] zasięg 6, 150 / 450 ms → ~16,5 DPS |
| `PLAYER_ARMOR` (Issue Suit) | 0 | pancerz | [P] |
| `ARMOR_DR_FORMULA` / `ARMOR_K` | A / (A + 100) | — | [P v0.4] |
| `ARMOR_DR_CAP` / `DMG_MIN_AFTER_ARMOR` | 0,60 / 1 | — / HP | [P v0.4] |
| **Formuła obrażeń** (`DAMAGE_FORMULA`) [PROG, v1.2] | `x = round(rzut × (kryt ? 1,5 : 1) × (Momentum ? 1,5 : 1) × DEPTH_DMG_MULT)`; `obrażenia = max(1, floor(x × (1 − DR)))`; `DR = min(0,6; A / (A + 100))` | — | `round` = Math.round (połówki w górę), **jedno zaokrąglenie na końcu** (wcześniej PROG robił floor po krytyku). Gracz: `DEPTH_DMG_MULT` = 1, wrogowie: DR = 0. Skrypty: `wyprawa.py`, `boss_v05.py`, `sim_m1.py` |
| `MEDPATCH_HEAL` / `MEDPATCH_DURATION_MS` / `MEDPATCH_COOLDOWN_MS` | 40 / 2000 / 4000 | HP / ms / ms | [P] |
| `STACK_MEDPATCH` | 6 | szt. | [P] GD v0.4 |
| `ISSUE_MEDPATCH_TOPUP` | **2 / 3 / 3 / 3** (Lights 0 / I / II / III) | szt. | [GD: potwierdzone 25.10] przy każdym wyjeździe windą, gdy gracz ma mniej. **Tak liczy model** (`progresja3.py`, `CFG['topup']`). 6 to `STACK_MEDPATCH` (limit plecaka), a nie uzupełnienie. Porównanie z „do 6”: §9 |
| `MEDHEAL_BONUS_CAP` | 60 | % | [P] |
| `BAG_SLOTS` / `STASH_SLOTS` | 12 / **30 / 40 / 50 / 60** (Lights 0 / I / II / III) | sloty | [P] 30 / 40; [GD v1.2] każdy poziom Lights +10 |
| `START_CREDITS` [N, R16] | **50** | kr | stan startowy: 50 kr, pusta skrytka, Issue Baton + Issue Suit, 2 Med-Patche z Issue, przystanek g1 |
| Docelowy DPS ze sprzętu tej głęb. | 26 / 35–38 / 48–55 | HP/s | [N] cel strojenia, potwierdzony w §6 |
| Docelowy DR ze sprzętu tej głęb. | 0–7 / ~17 / ~23 | % | [N] |

## 2. Wrogowie (Sector 1)

Reguła: `HP = round(ENEMY_HP × DEPTH_HP_MULT)`, obrażenia wg formuły z §1 (**`round`** rzutu × `DEPTH_DMG_MULT`, potem pancerz gracza). Zakresy poniżej to `round(min × mult)`–`round(max × mult)` [PROG v1.2]. `DEPTH_HP_MULT` = 1,0 / 1,5 / 2,2, `DEPTH_DMG_MULT` = 1,0 / 1,25 / 1,5 [P v0.4]. **Pancerz wrogów = 0 [N]** (w M1 pancerz ma tylko gracz). Zapowiedzi i tempo nie zależą od głębokości [P]. Reguła v0.5: zapowiedź − 1 tick ≥ 400 ms, więc minimum 450 ms [P]. **Brak odradzania w trakcie poziomu** [P v0.5].

| Wróg | HP g1 / g2 / g3 | Obrażenia g1 / g2 / g3 | Pancerz | Zapowiedź / odnowienie (ms) | Ruch prosto (ms/pole) | Zasięg | Wykrycie | DPS surowy g1 → g3 |
|---|---|---|---|---|---|---|---|---|
| `d` Panel Drone | 40 / 60 / 88 | 8–12 / 10–15 / 12–18 | 0 | **450** / 600 [P v0.5] | 200 [P v0.4] | 1 | 8 | 9,5 → 14,3 |
| `h` Curfew Guard | 120 / 180 / 264 | 14–20 / **18**–25 / 21–30 | 0 | 600 / 900 | 250 | 1 | 7 | 11,3 → 17,0 |
| `s` Scrapper | 30 / 45 / 66 | 4–6 / 5–**8** / 6–9 | 0 | **450** / 600 [P v0.5] | 200 | 1 | 7 | 4,8 → 7,1 |
| `t` Line Sentry | 70 / 105 / 154 | 10–15 / **13–19** / 15–**23** | 0 | 700 / 1500 | — (nieruchoma) | 6, linia wzroku | 7 | 5,7 → 8,5 |

| Rail Guardian (boss, tylko g3, **bez mnożników głębokości**) | Wartość | Uwagi |
|---|---|---|
| `BOSS_HP` | **2400** [GD, potwierdzone v0.5] | model v0.5 (`boss_v05.py`): mediana wygranych **86 / 68 / 46 s przy 35 / 48 / 72 DPS** (cel 65–75 s przy typowym 48 DPS); wrażliwość na wykorzystanie wręcz 0,5–0,7: 70–62 s przy 48 DPS. Alternatywa przy pomiarze QA < 65 s: 2600 |
| `BOSS_DMG_MIN` / `BOSS_DMG_MAX` | **20 / 32** [GD] | było 25–40; przy 25–40 wyprawę „na bossa” wygrywa 27% przeciętnych graczy, przy 20–32: 47% |
| `BOSS_ARMOR` [N] | 0 | |
| `BOSS_SWING_WINDUP_MS` / `BOSS_SWING_RECOVERY_MS` | 800 / 1200 [GD, P v0.5] | |
| `BOSS_CHARGE_EVERY` / `BOSS_CHARGE_WINDUP_MS` / `BOSS_CHARGE_TICKS_PER_CELL` | 4 / 900 / 2 | [P v0.5]; pas 2–3 pola, trafienie raz (20–32), potem ogłuszenie 2 s + słaby punkt ×2. Model: przejazd 8–24 pól (0,8–2,4 s) [Z], unik szarży = unik + 20 p.p. [Z] |
| `BOSS_STUN_MS` / `BOSS_WEAKPOINT_MULT` [N] | 2000 / 2,0 | [P] wartości z opisu 2.11 |
| `BOSS_MOVE_MS` | 300 | [P] |
| Przywołanie przy 50% HP | 2 × Panel Drone, **z mnożnikami g3** (88 HP, 12–18, zapowiedź 450 ms), `BOSS_SUMMON_MS` 600 (boss podatny), `SUMMON_ACTIVATE_MS` 500, boss zajmuje 1 żeton | [P v0.5]; model: walka z dronami, a boss nadal zamachuje się co 2 s |
| Wyprawa „na bossa” (przystanek g3 → ~50% spotkań → boss, 6 patchy) | 48 DPS: 48 / 89 / 100% sukcesu (50 / 60 / 70% uników); 44 DPS: 29 / 75 / 98% | `boss_trip_v05.py`, formuła v1.2 (`out_bosstrip_v12.txt`) |
| Strata HP na poziom (grupy, 50% uników, formuła v1.2) | g1 82 / g2 189 / g3 290 HP (v1.1: 82 / 188 / 285) | `poziomy_grupy.py` (`out_poziomy_v12.txt`) |
| Nagroda [N] | fragment sieci 20% [P] + 2 przedmioty poz. 3, rzadkość ≥ 2 [Z] | jednorazowo; powtórna walka tylko łup [Z] |

## 3. Sprzęt

### 3.1 Wartości bazowe wg poziomu przedmiotu (`ilvl` = głębokość zrzutu)
| Slot | Glif | Parametr [N] | ilvl 1 | ilvl 2 | ilvl 3 | Uwagi |
|---|---|---|---|---|---|---|
| Broń wręcz (Baton) | `/` | `WEAPON_MELEE_DMG` | 8–12 | 10–15 | 13–19 | cykl 400 ms bez zmian; DPS bazowy (z krytem 10%) 26,3 / 32,8 / 42,0 |
| Broń dystans (Rail Pistol) | `/` | `WEAPON_RANGED_DMG` | 8–11 | 10–14 | 13–18 | 150 / 450 ms, zasięg 6; ~16,6 / 21,0 / 27,1 DPS |
| Pancerz | `[` | `ARMOR_BASE` [P] | 6–10 | 13–19 | 20–28 | DR 7 / 14 / 19% bez afiksów |
| Moduł | `"` | `MODULE_HP_BASE` | +5 | +10 | +15 | maks. HP |
| Narzędzie | `(` | `TOOL_SALVAGE_PCT` | +10 | +15 | +20 | % Scrap z wrogów i skrzyń (zaokr. w dół) |
| Issue Baton / Issue Suit | — | [P] | 8–12 / pancerz 0 | — | — | 0 kr, nie przepada, bez afiksów |
| **Issue Mk2** [N, R20] (`ISSUE_TIER_BY_STOP`) | — | — | po odblokowaniu przystanku g2: **Issue Baton 10–15** (DPS ~32,8, powyżej progu zejścia 30), **Issue Suit pancerz 6** (DR ~6%) | — | — | nadal 0 kr, nie przepada, bez afiksów; zależy od postępu (przystanek), nie od śmierci (Z-GD2). [M: przyjęte 25.10], nazwy od Lore |

### 3.2 Pula właściwości (`M1_AFFIX_01–12`)
Zasady [N]: liczba właściwości = rzadkość (1 / 2 / 3); losowanie bez powtórzeń w obrębie przedmiotu, z wagami spośród właściwości dozwolonych w slocie; wartość losowana równomiernie w zakresie rzadkości (liczby całkowite). Sloty: W = broń, A = pancerz, M = moduł, T = narzędzie.

| ID | Prefiks / sufiks [P] | Parametr [N] | Efekt | Sloty | r1 | r2 | r3 | Waga | Limit łączny |
|---|---|---|---|---|---|---|---|---|---|
| `M1_AFFIX_01` | Heavy / of Force | `AFFIX_DMG_PCT` | +% obrażeń ataku podstawowego | W, M | 5–8 | 9–14 | 15–20 | 100 | 50% |
| `M1_AFFIX_02` | Quick / of the Rush | `AFFIX_ATKSPD_PCT` | +% szybkości ataku (akumulator ułamków ticka `ACTION_TICK_ACCUMULATOR`) | W, M | 4–6 | 7–10 | 11–15 | 80 | 30% |
| `M1_AFFIX_03` | Sharp / of the Weak Spot | `AFFIX_CRIT_PP` | +p.p. szansy krytycznej | W, M, T | 3–5 | 5–8 | 8–12 | 80 | +25 p.p. |
| `M1_AFFIX_04` | Thick / of the Long Shift | `AFFIX_MAXHP` | +maks. HP | A, M | 6–10 | 11–18 | 19–28 | 100 | +60 HP |
| `M1_AFFIX_05` | Plated / of Steel | `AFFIX_ARMOR` [P] | +pancerz | A, M | 2–4 | 4–7 | 7–10 | 100 | — (DR cap 60%) |
| `M1_AFFIX_06` | Patched / of Repair | `AFFIX_MEDHEAL_PCT` [P] | +% leczenia Med-Patchy | A, M | 10–15 | 16–25 | 26–35 | 60 | 60% [P] |
| `M1_AFFIX_07` | Light / of the Runner | `AFFIX_MOVESPD_PCT` | +% szybkości ruchu (akumulator) | A, T | 3–5 | 6–8 | 9–12 | 60 | 20% |
| `M1_AFFIX_08` | Charged / of the Spark | `AFFIX_SKILLDMG_PCT` | +% obrażeń umiejętności (Shock Pulse, Buddy Drone) | W, M | 10–15 | 16–25 | 26–35 | 60 | 60% |
| `M1_AFFIX_09` | Ready / of the Second Try | `AFFIX_CDR_PCT` | −% odnowienia umiejętności (mnożone z biegłością) | M, T | 4–6 | 7–10 | 11–15 | 60 | 30% |
| `M1_AFFIX_10` | Lucky / of the Scavenger | `AFFIX_LOOT_PCT` | +% względnie do `ENEMY_ITEM_DROP` | T | 5–8 | 9–12 | 13–18 | 40 | 40% |
| `M1_AFFIX_11` | Clever / of the Open Door | `AFFIX_CHANNEL_PCT` | −% czasu kanałowania (wezwanie windy, USE) | T | 10–15 | 16–25 | 26–35 | 60 | 50% |
| `M1_AFFIX_12` | Long / of Reach | `AFFIX_PICKUP_RADIUS` | +pola automatycznego podnoszenia | A, T | +1 | +1 | +2 | 50 | +2 |

Kontrola DPS (symulacja, typowe wartości): broń ilvl 2 r2 (+11% obr., +8% szyb.) ≈ **37**; ilvl 3 r2 ≈ **48**; ilvl 3 r3 + moduł r3 ofensywny ≈ **70–75** (pułap M1, [GD: OK]).

### 3.3 Rzadkości
| Rzadkość | Nazwa [P] | Szansa g1 / g2 / g3 (`DEPTH_RARITY_ODDS`) [P] | Właściwości [N] | `SELL_ITEM` (ilvl 1 / 2 / 3) [P] | Rozebranie (M2) [P] |
|---|---|---|---|---|---|
| 1 | Salvaged | 80 / 65 / 50% | 1 | 10 / 15 / 20 kr | 3 Scrap |
| 2 | Tuned | 18 / 30 / 38% | 2 | 40 / 60 / 80 kr | 8 Scrap |
| 3 | Grid-Grade | 2 / 5 / 12% | 3 | 150 / 225 / 300 kr | 20 Scrap |

| Parametr | Wartość | Uwagi |
|---|---|---|
| `ENEMY_ITEM_DROP` | 0,20 | [P] |
| `ITEM_SLOT_WEIGHTS` [N] | W 1 / A 1 / M 1 / T 1 | [Z] równo |
| Przedmioty na poziom | ~6,3 / 8,6 / 9,0 | [P] |
| P(≥ 1 r3 na poziom) | 12 / 36 / 68% | wyliczone |

## 4. Exchange (automat) i BASE (ulepszenia)
| Pozycja | Parametr | Kupno | Sprzedaż | Uwagi |
|---|---|---|---|---|
| Med-Patch | `MEDPATCH_PRICE`, `MEDPATCH_SELLABLE` | 25 kr | 0 (false) | [P] limit w plecaku `STACK_MEDPATCH` = 6 |
| Scrap / Copper | `SELL_SCRAP` / `SELL_COPPER` | brak w sprzedaży | 2 / 5 kr | [P]; Copper tylko ze strefy i kontraktów |
| Sprzęt: cena sprzedaży | `SELL_ITEM` | — | r1 10 / 15 / 20, r2 40 / 60 / 80, r3 150 / 225 / 300 kr (ilvl 1 / 2 / 3) | [P] = bazowa × (1 + 0,5·(ilvl − 1)) |
| Półka sprzętu | `SHOP_STOCK` (§4.1), `SHOP_RARITY_ODDS` = r1 70% / r2 30%, `SHOP_ITEM_PRICE_MULT` = **4**, `SHOP_ILVL` = najgłębszy przystanek | r1 40 / 60 / 80, r2 160 / 240 / 320 kr | — | [GD] rotacja po każdej wyprawie (także po śmierci) |
| Miejsce r3 na półce | `SHOP_R3_CHANCE` (§4.1), `SHOP_R3_SLOT` = 1, `SHOP_R3_PRICE_MULT` = **5** | r3 750 / 1125 / 1500 kr | — | [GD] ujście (a); losowane tylko w 1. miejscu półki |
| Płatne odświeżenie półki | `SHOP_REFRESH_COST_BASE` = 25, `SHOP_REFRESH_COST_GROWTH` = 2, `SHOP_REFRESH_MAX_PER_VISIT` = 3 | **25 × 2^k** = 25 / 50 / 100 kr | — | [GD] ujście (a); k = odświeżenia od ostatniej wyprawy, licznik zeruje się po wyprawie |
| **Po śmierci: broń na półce** [N, R20] | `SHOP_DEATH_WEAPON` = true | r1 broń ilvl = najgłębszy przystanek (×4: 40 / 60 / 80 kr) | — | 1. rotacja po śmierci zamienia ostatnie miejsce półki na broń r1. Bez nowej mechaniki (zasada zawartości półki) |
| **NEW STATS** [GD] (usługa przy Exchange) | `NEWSTATS_COST_MULT` = 2, `NEWSTATS_COST_GROWTH` = 1,5, `NEWSTATS_MIN_RARITY` = 2; licznik `newStatsCount` (n) zapisany w przedmiocie | **2 × `SELL_ITEM` × 1,5^n** (zaokr. do 1 kr); r2 ilvl 3: 160 / 240 / 360 / 540; r3 ilvl 3: 600 / 900 / 1350 / 2025 kr | — | [GD] ujście (b). Przelosowuje wszystkie właściwości (rzadkość, slot, ilvl i wartość bazowa bez zmian; nie dla Issue). Gracz wybiera **KEEP OLD** albo nowy zestaw; **opłata przepada w obu przypadkach**, n rośnie w obu. **Uwaga dla UI:** stary i nowy zestaw obok siebie, przyciski KEEP OLD / nowy zestaw, koszt następnego NEW STATS widoczny przed zapłatą |
| Issue | — | — | 0 kr | [P] |
| „Lights Above the Base” `M1_BASE_08`, poziomy I / II / III (BASE) | `BASE_UPGRADE_COST[1..3]` | **I: 150 kr + 10 Cu** [N, R18; było 200 + 15] · **II: 600 kr + 25 Cu** · **III: 1500 kr + 40 Cu** [GD] | — | jedno ulepszenie z 3 poziomami kupowanymi kolejno w BASE [Mechaniki: potwierdzone]; I wymaga `M1_TERM_08`. Treść: 1 linia BASE na poziom i krótki opis w menu (Fabuła). Efekty: §4.1 |
| Nagroda `M1_TERM_08` [N, R18] | `TERM08_REWARD_COPPER` = **10** | — | — | +10 Cu przy 1. rozwiązaniu (obok fragmentu sieci); pokrywa Copper na Lights I |
| Recovery Beacon (M2) | `BEACON_UPGRADE_COST` | 400 kr + 25 Cu | — | [P] warunek ≥ 50% sektora |
| Zegar Zbieraczy M2 | `CORPSE_TICKS_START` [N] | 50 / 45 / 40 s (1000 / 900 / 800 ticków) | — | średni odzysk 69 / 61 / 55% |

**Bez napraw** (w M1 nie ma zużycia przedmiotów). **Ubezpieczenie: M2** (rolę pełni Recovery Beacon). **Pełna utrata w M1 zostaje** [GD].

### 4.1 Lights: wartości bezwzględne na poziom (`M1_BASE_08`) — tabela dla Mechaników
| Parametr | Lights 0 | Lights I | Lights II | Lights III | Źródło |
|---|---|---|---|---|---|
| Koszt poziomu (`BASE_UPGRADE_COST`) | — | 150 kr + 10 Cu (wymaga `M1_TERM_08`) | 600 kr + 25 Cu | 1500 kr + 40 Cu | R18 / [GD] |
| Koszt łączny do tego poziomu | 0 | 150 kr + 10 Cu | 750 kr + 35 Cu | 2250 kr + 75 Cu | |
| `STASH_SLOTS` | **30** | **40** | **50** | **60** | [P] 30 / 40; [GD] +10 na każdy poziom |
| `ISSUE_MEDPATCH_TOPUP` | **2** | **3** | **3** | **3** | [GD: potwierdzone 25.10]; II i III nie zmieniają (§9) |
| `SHOP_STOCK` (miejsca na półce) | **3** | **3** | **4** | **4** | [GD] II +1 |
| `SHOP_R3_CHANCE` (1. miejsce półki) | **10%** | **10%** | **10%** | **20%** | [GD] III ×2 |
| Wizualnie (Fabuła / GRAF) | ciemno | światła nad bazą [P] | [Z] jaśniej | [Z] pełne światła | 1 linia BASE + opis w menu |

## 5. Kontrakty (zasada GD: ≤ kr/min wyprawy na tej głęb. + powód atrakcyjności)
**Podstawa czasu [N, decyzja Balansu]: cykl baza → baza**, czyli sesja GD (2.2) bez 3 s wczytania: baza (~35 s) + winda + strefa + powrót. **Tak samo dla wypraw:** poziom ~8 min + ~0,67 min narzutu, więc `CONTRACT_KRPM_CAP` = 170 / 413 / 778 kr ÷ 8,67 min = **20 / 48 / 90 kr/min** (g1 / g2 / g3). Na samym czasie strefy byłoby 21 / 52 / 97 [P]. Uzasadnienie: narzut ~40 s płaci każdy kontrakt, także przy łańcuchu kontraktów w jednej sesji, więc to on rozstrzyga wybór „kontrakt czy wyprawa” w sesji ≤ 3 min. Wycena: Med-Patch 25 kr, Copper 5 kr. **`CONTRACT_ENEMY_LOOT` = 0** [GD]: dotyczy wszystkich wrogów kontraktu, w tym 3 strażników Data Core i 6 wrogów Clear the Path (0 Scrap, 0 przedmiotów, 0 kr). Wrogowie z poziomu spotkani po drodze dają zwykły łup.

| Kontrakt | Głęb. | Nagroda (`REWARD_*`) | Sesja mediana / p80 | kr/min (sesja) | Limit (sesja) | kr/min, gdyby był łup | Powód atrakcyjności | `CONTRACT_WEIGHT` g1 / g2 / g3 |
|---|---|---|---|---|---|---|---|---|
| `M1_CONTR_01` Restore Relay | 1 / 2 / 3 | `REWARD_RELAY` = **35 kr** (było 40) + fragment 10% (1. rozwiązanie wariantu) | 118 / 175 s (g1), 154 / 209 s (g3) [P] | 18 / ~16 / 14 (przy 40 kr: 21 > 20 na g1) | 20 / 48 / 90 | — | trwały postęp: sieć, przystanek windy, `M1_TERM_08` → Lights | 1 / 1 / 1 |
| ponowne zestrojenie | 1 / 2 / 3 | `RETUNE_REWARD` = **25 kr + 2 Cu** [GD: potwierdzone] | jak Relay | 18 / ~16 / 14 | 20 / 48 / 90 | — | pewna mała nagroda + Copper na Lights II/III i Beacon | ×0,5 wagi Relay tej głęb. (0,5 / 0,5 / 0,5) |
| `M1_CONTR_02` Recover the Data Core | 2 | `REWARD_DATACORE` = 40 kr + 3 Cu; strażnicy **`ddh`** [GD, LD §10] | 128 / 180 s [P] | 26 (symulacja: 32) | 48 | 48 (symulacja: 60) ✗ | materiał: najpewniejsze źródło Copper | — / **2** / — [GD v1.2] |
| `M1_CONTR_03` Clear the Path | 1 | `REWARD_CLEARPATH` = 1 Med-Patch; wrogowie `sss`+`ddh` | 108–118 / 150 s [P] | 13 (symulacja: 16) | 20 | 43–51 ✗ | pewna nagroda przy szybie, zasób na wyprawę, biegłość | 1 / — / — |
| `M1_CONTR_03` Clear the Path | 2 | 25 kr + 1 Med-Patch; wrogowie **`sss`+`dht`** [GD, LD §10] | ~118 / 165 s [P] | 25 (symulacja: 30) | 48 | 74–89 ✗ | j.w. | — / 1 / — |
| **`M1_CONTR_03` Clear the Path** [N] | **3** | **40 kr + 1 Med-Patch**; wrogowie `sss`+`ddh` | ~125 / 180 s [Z wg budżetu 2.2]; symulacja 105 / 115 s | **32 (symulacja: 35–38)** | 90 | 107–129 ✗ | j.w.; jedyny kontrakt g3 z nagrodą-zasobem; urozmaica tablicę g3 | — / — / **1** |
| `M1_CONTR_04` Deliver N Units | baza | `REWARD_DELIVER_MULT` = 1,5 (20 Scrap / 8 Cu → 60 kr) | 35 / 55 s [P] | premia +20 kr | — | — | zero ryzyka, sesja mikro | Exchange 1 |
| `M1_CONTR_05` Sell One Item | baza | `REWARD_SELL_BONUS` = +50 (r2) / +100 (r3) | ~35 s | premia ÷ czas zdobycia przedmiotu: +7 / +16 / +14 | — | — | zero ryzyka, wybór co zatrzymać | Exchange 1 |

**Clear the Path g3, szczegóły [N]** (`kontrakty_v05.py`, `wyprawa.py`, 3000 prób):
| Parametr | Wartość | Uwagi |
|---|---|---|
| `CONTRACT_CLEARPATH_GROUPS` g3 | `sss` + `ddh` (6 wrogów, mnożniki g3) [GD, LD §10] | skład jak g1, tylko silniejszy. Z `dht` (wieżyczka) przeciętny gracz na sprzęcie wejściowym ginie w 6,3% prób, a z `sss`+`ddh` w 2,1% |
| Dystans | 12–20 pól od szybu | [P] jak g1/g2 |
| Strefa (mediana / p80) | 49–52 / ~57 s | dolna granica; Mechaniki liczą z marginesem na szukanie ~80–100 s |
| Strata HP (50% / 70% uników), sprzęt typowy g3 48 DPS / DR 23% | 85 / 51 HP | sprzęt wejściowy 40 / 16%: 115 / 68 HP |
| Śmierć | 0,0% (typowy), 2,1% (wejściowy, 50% uników) | „pewna mała nagroda przy niskim ryzyku” spełniona od typowego sprzętu g3 |
| Nagroda | 40 kr + 1 Med-Patch (~65 kr) | netto po zużytych patchach ~45–55 kr |
| Waga | 1 (g3) | udziały w 5.1 |

**Skład wrogów kontraktów [GD, `level-m1.md` §10]** (`out_kontrakty_g2_v12.txt`, sprzęt typowy tej głęb., 3000 prób):
| Kontrakt | `CONTRACT_ENEMY_GROUPS` | Strefa mediana / p80 | Strata HP (50 / 70% uników) | Śmierć | Uwagi |
|---|---|---|---|---|---|
| Clear the Path g1 | `sss` + `ddh` | 45 / 48 s | 56 / 33 | 0% | |
| **Clear the Path g2** | **`sss` + `dht`** | 48 / 52 s | 84 / 49 | 0% | `ssd`+`ddh` z v1.1: 48 s, 82 HP, czyli praktycznie bez różnicy. **Powrót do `ddh`**, jeśli QA zmierzy czas CtP g2 > 1,3 × czasu CtP g1 (model: 1,07×) albo wyraźnie wyższą śmiertelność |
| Clear the Path g3 | `sss` + `ddh` | 49 / 52 s | 87 / 52 | 0,1% | |
| **Data Core g2** (strażnicy) | **`ddh`** | 52 / 56 s | 62 / 37 | 0% | + 0–2 wrogów poziomu po drodze (zwykły łup) |
Nagrody bez zmian. Model nie liczy czasu podejścia do nieruchomej wieżyczki `t` za osłoną (LD), więc czas CtP g2 to dolna granica.

**Wniosek `CONTRACT_ENEMY_LOOT` = 0:** zgodne z zasadą. Z łupem jak u zwykłego wroga (połowa łupu poziomu ÷ liczba wrogów [Z]: 9,4 / 15,9 / 26,3 kr na wroga) każdy kontrakt bojowy łamie limit 1,3–4×, także Data Core (3 strażników: +48 kr → 48–60 kr/min przy limicie 48). Na podstawie czasu strefy (zamiast sesji) bez łupu łamią limit tylko Relay g1 (~32 > 21 [P]) i, przy szybkim graczu, CtP g1 (34 > 21) i Data Core (64 > 52). Dlatego podstawą jest cykl baza → baza.

### 5.1 Udziały w puli (losowanie dwustopniowe [P PROG], `kontrakty_udzialy.py`, 200 tys. losowań)
Reguła: głębokość równo spośród odblokowanych przystanków; typ wg `CONTRACT_WEIGHT[typ][głęb.]`; gdy na wylosowanej głębokości nie ma wolnego typu, głębokość losowana równo spośród tych z wolnym typem. [Z] „wolny” = para (typ, głębokość) nie leży już na tablicy; 2 sloty BASE. Wszystkie 3 przystanki.

**`CONTRACT_WEIGHT` (v1.2):** g1: Relay 1, CtP 1 · g2: Relay 1, **Data Core 2**, CtP 1 · g3: Relay 1, CtP 1 · zestrojenie = 0,5 × waga Relay tej głęb.

| Wariant (z CtP g3) | Relay / zestrojenie | Clear the Path | Data Core | Pary (slot 1) | Oferty na tablicy (2 sloty) | Średnia nagroda kontraktu |
|---|---|---|---|---|---|---|
| **waga DC 2, terminale dostępne** | **Relay 41,5%** | **41,9%** | **16,6%** | Relay 16,5 / 8,3 / 16,7%; CtP 16,8 / 8,4 / 16,7%; DC 16,6% | 42 / 42 / 16% | **42,9 kr-ekw.**, 0,50 Cu, 0,42 patcha |
| **waga DC 2, terminale wyczerpane** | **zestrojenie 27,1%** | **53,8%** | **19,1%** | zestrojenie 11,2 / 4,7 / 11,2%; CtP 22,2 / 9,5 / 22,1%; DC 19,1% | 31 / 51 / 18% | **44,7 kr-ekw.**, 1,11 Cu, 0,54 patcha |
| dla porównania: waga DC 1 (v1.1), dostępne | 44,5% | 44,4% | 11,1% | | 45 / 44 / 11% | 42,3 kr-ekw., 0,33 Cu |
| dla porównania: waga DC 1, wyczerpane | 28,9% | 57,8% | 13,4% | | 33 / 54 / 13% | 44,2 kr-ekw., 0,98 Cu |
| dla porównania: bez CtP g3 (v1.0), dostępne | 61,0% | 27,8% | 11,1% | | 58 / 30 / 12% | |

Skutki:
- Waga 2 przenosi ~6 p.p. z Relay g2 i CtP g2 na Data Core. Wartość kontraktu prawie bez zmian (+0,5 kr), więc zasada kr/min i tempo nie zmieniają się.
- **Dopływ Copper** (przeciętny gracz, model, kontrakt co drugą wyprawę [Z]): z kontraktów 0,17 → 0,25 Cu na wyprawę przy dostępnych terminalach i 0,49 → 0,56 po ich wyczerpaniu. Ponad 95% Copper i tak pochodzi ze skrzyń g2–g3 (~8 Cu na poziom), więc waga DC to głównie pewne, szybkie źródło w krótkiej sesji, a nie zmiana tempa. Copper na koncie po 3 h (mediana, po wydatkach): **~55 Cu (v1.1) → ~70 Cu (v1.2 z R18)**. Lights I–III kosztują łącznie 75 Cu (10 + 25 + 40), a Beacon w M2 25 Cu. Średni poziom Lights po 3 h: 2,0 (przeciętny), 2,5 (dobry). Copper nie blokuje Lights III u dobrego gracza, a przeciętny dochodzi do Lights II.
- Zestrojenie g3 bez CtP g3 dostawało 33% losowań (jedyny typ na g3). Z CtP g3 dostaje 11%, więc waga ×0,5 działa zgodnie z zamiarem.

### 5.2 Krótka sesja (mediana ≤ 3 min, p80 ≤ 4 min [P v0.5])
- Wszystkie kontrakty BASE i Exchange mieszczą się (tabela wyżej; najwęższy Relay g3: 154 / 209 s [P]). CtP g3 ~125 / 180 s.
- **Wyprawy nie są krótką sesją** [P 2.2]: poziom ~8 min, wyprawa 1–2 głęb. to sesja średnia (8–15 min), pełna to długa (30–45 min). Wcześniejsze ~9 min na wyprawę dotyczyło sesji średniej i jest zgodne z 2.2. Zamknięcie gry w trakcie wyprawy obsługuje auto-pauza z zapisem [P 2.2].

## 6. Tempo progresji (symulacja `saldo_v12.py` / `progresja3.py`, 300 graczy na profil i wariant)
Model [Z]: 1 min w bazie + ~8 min na poziom (+1,5 min terminal). Po każdej wyprawie 50% szans na 1 kontrakt BASE (losowanie dwustopniowe §5.1, wagi v1.2). Gracz zakłada lepszy sprzęt i trzyma poprzedni jako zapas w skrytce (wariant bez zapasu: §8.3). Schodzi niżej przy DPS ≥ 30 (g2) / ≥ 40 (g3), na bossa przy DPS ≥ 44. Kupuje patche do 2 / 4 / 6 (g1 / g2 / g3), Issue uzupełnia do 2 / 3. Trzyma rezerwę 150 kr. Z półki kupuje przy +5% „siły” zestawu. Walki z `wyprawa.py` (formuła obrażeń v1.2), boss wg §2.
Warianty: **A** = bez półki (v1.0), **B** = półka [GD], **C** = ujścia [GD] (stan v1.1 z wagą DC 2), **D = v1.2** = C + poprawki QA R16 / R18 / R20.

**Cel tempa [GD / właściciel, ustalony v1.2]: przeciętny gracz pokonuje pierwszego bossa po ok. 3 h gry.** Nie przyspieszamy. Każda zmiana, która przesuwa medianę 1. wygranej o więcej niż ~±30 min, wymaga kompensacji. Szum modelu przy 300 graczach: ±10–15 min mediany i ±4 p.p. odsetka.

**Przeciętny gracz (50% uników), wariant D (w nawiasie A):**
| Czas gry | % z g3 | DPS | Saldo kr | Średni poziom Lights | Kluczowe zakupy / wydarzenia |
|---|---|---|---|---|---|
| 15 min | 0% | 32 (31) | 295 (258) | 0 | start 50 kr; pierwsze r1–r2 z g1 |
| 30 min | 0% | 38 (37) | 356 (383) | ~0,3 | przystanek g2, Issue Mk2; pierwszy zakup z półki (160–240 kr) |
| 1 h | 17% | 38 (35) | 385 (566) | 0,7 | **Lights I u ~50–54%** (R18); pierwsza śmierć, odbudowa ze skrytki / półki |
| 1,5 h | 30% | 40 (37) | 420 (899) | ~1,0 | pierwsze NEW STATS na r2 |
| 2 h | 42% | 44 (40) | 474 (1282) | 1,3 | Lights II u części graczy |
| 3 h | 65% | 61 (56) | **608 (2472)** | 2,0 | boss; zbieranie na r3 z półki / Lights III |
| **Boss** | | | | | **mediana 1. wygranej 165 min (C: 157,5; A: 185), 56% wygranych po 3 h (C: 59%; A: 50%)** |

**Dobry gracz (70% uników), wariant D (w nawiasie A):**
| Czas gry | % z g3 | DPS | Saldo kr | Lights | Uwagi |
|---|---|---|---|---|---|
| 30 min | 0% | 40 (39) | 387 (498) | ~0,3 | |
| 1 h | 88% | 58 (55) | 614 (1233) | 0,8 | boss: mediana 1. wygranej ~65 min |
| 1,5 h | 99% | 65 (65) | 1010 (2588) | ~1,2 | |
| 2 h | 100% | 69 (69) | 1317 (4570) | 1,7 | pułap DPS ~70–75 |
| 3 h | 100% | 73 (73) | **1838 (8946)** | 2,5 | Lights III, NEW STATS na r3 |

Wnioski:
- Tempo do bossa mieści się w celu „~3 h”: mediana 1. wygranej 2,5–2,75 h, 56–64% po 3 h (rozrzut między przebiegami). GD akceptuje 64% [GD].
- Odbudowa po śmierci: 2 wyprawy (p80: 3), także bez zapasu w skrytce dzięki R20 (§8.3).
- Budżet HP (formuła v1.2, `out_budzet_v12.txt`): pełna 1→3 + boss: 0 / 3 / 45 / 97% sukcesu przy 50 / 60 / 70 / 80% uników. Z buildem +60% leczenia / DR 30%: 7 / 45 / 90 / 100%. G3 z przystanku + boss: 7 / 46 / 90 / 100%. Wyprawa „na bossa”: 48 / 89 / 100% (48 DPS).

## 7. Ujścia kredytów M1 [GD: przyjęte v1.2]
Problem z v1.1: od ~90 min przychód (~20–50 kr/min) przewyższał wydatki. Bez ujść mediana salda po 3 h: 2,5 tys. kr (przeciętny) i 8,9 tys. kr (dobry). Sama półka [GD] tego nie zmieniała (B: 2,3 / 8,9 tys.).

| Ujście [GD] | Formuła / cena (parametry §4) | Wydane w 3 h (przeciętny / dobry; v1.1) | Dlaczego tak |
|---|---|---|---|
| **(a) r3 na półce i płatne odświeżenie** | 1. miejsce: 10% r3 (20% przy Lights III) za ×5 ceny sprzedaży; odświeżenie 25 / 50 / 100 kr, maks. 3, licznik zeruje się po wyprawie | ~1,2 / ~2,3 tys. kr | jasny cel „zbieram na r3”; ×5 > sprzedaż, więc nie ma arbitrażu; limit 3 na wizytę zatrzymuje „kręcenie” |
| **(b) NEW STATS** (Exchange) | 2 × `SELL_ITEM` × 1,5^n; tylko r ≥ 2; KEEP OLD albo nowy zestaw, opłata przepada zawsze | ~1,3 / ~3,0 tys. kr | koszt rośnie geometrycznie, więc ujście skaluje się z bogactwem |
| **(c) Lights II / III** (BASE) | 600 kr + 25 Cu / 1500 kr + 40 Cu | ~1,1 / ~1,9 tys. kr (z Lights I) | trwały, widoczny postęp bazy (filar 6); Copper wiąże ujście z grą na g2–g3 |

Odrzucone: **naprawy** (w M1 nie ma zużycia, nowa mechanika = podatek bez decyzji gracza). **Ubezpieczenie → M2** [GD].

**Efekt (mediana salda, `saldo_v12.py`, 300 graczy; v1.2 = D):**
| Gracz | Wariant | 30 min | 1 h | 1,5 h | 2 h | 2,5 h | 3 h | Boss: mediana 1. wygranej / % po 3 h |
|---|---|---|---|---|---|---|---|---|
| przeciętny | A (bez półki) | 383 | 566 | 899 | 1282 | 1824 | 2472 | 185 min / 50% |
| przeciętny | B (półka) | 386 | 466 | 564 | 815 | 1340 | 2340 | 170 min / 55% |
| przeciętny | C (ujścia) | 347 | 360 | 399 | 455 | 540 | 676 | 157,5 min / 59% |
| przeciętny | **D (v1.2)** | 356 | 385 | 420 | 474 | 496 | **608** | **165 min / 56%** |
| dobry | A | 498 | 1233 | 2588 | 4570 | 6709 | 8946 | 65 min / 100% |
| dobry | C | 406 | 612 | 954 | 1490 | 1441 | 1812 | 65 min / 100% |
| dobry | **D (v1.2)** | 387 | 614 | 1010 | 1317 | 1528 | **1838** | 65 min / 100% |

Wykres: **`design/balans-sim/saldo_kredytow_v12.png`** (A / B / C / D, mediana i p25–p75, oba profile). Poprzedni `saldo_kredytow_v05.png` zostaje jako historia v1.1. Krzywa D prawie pokrywa się z C: poprawki QA nie osłabiają ujść.

## 8. QA R16 / R18 / R20 (`exp_qa.py`, 300 graczy na profil, 2 przebiegi; wariant C + wagi v1.2)
### 8.1 R16: brak kredytów startowych
- **Problem:** `balans-m1.md` nie podawał stanu startowego; QA liczył D2 przy 0 kr.
- **Przyczyna:** model zakładał 0 kr na starcie (`kr = 0`), ale tego nie zapisałem.
- **Poprawka:** `START_CREDITS` = **50 kr** (2 Med-Patche albo 1 przedmiot r1 z półki ilvl 1). Stan startowy: pusta skrytka, Issue Baton + Issue Suit, 2 Med-Patche z Issue, przystanek g1 (§1).
- **Efekt:** saldo +10–15 kr po 1 h, potem bez różnicy. Boss: mediana 147,5–150 min / 58–59% (baza: 157,5–162,5 / 58–59%), czyli w granicach szumu. Ujścia bez zmian.

### 8.2 R18: Lights poza pierwszą godziną
- **Problem:** Lights I w 1. godzinie ma tylko **8–12%** przeciętnych i 20–26% dobrych graczy (cel QA ≥ 50%).
- **Przyczyna:** Lights I wymaga `M1_TERM_08` (3. wariant g1) **i** 15 Cu. Copper jest tylko od g2 (skrzynie, Data Core) i z zestrojeń, a w 1. godzinie gracz wydaje kredyty na półkę i patche.
- **Poprawka:** `TERM08_REWARD_COPPER` = **+10 Cu** i Lights I = **150 kr + 10 Cu** (było 200 + 15). Gracz, który zapali `M1_TERM_08`, ma od razu Copper na Lights I. Copper zostaje materiałem ulepszeń (Lights II/III, Beacon).
- **Efekt (Lights I ≤ 60 min, przeciętny / dobry):**

| Wariant | Przeciętny | Dobry | Boss przeciętnego (mediana / % po 3 h) |
|---|---|---|---|
| baza v1.1 | 8–12% (mediana ~87–90 min) | 20–26% | 157,5–162,5 min / 58–59% |
| tylko +10 Cu za `M1_TERM_08` | 35–36% | 49–53% | 150–155 / 61% |
| tylko Lights I 150 + 10 | 15–21% | 33–37% | 155–160 / 57–60% |
| **oba (rekomendacja)** | **46–50%** | **55–57%** | 145–170 / 54–62% |
| oba + bramka „dowolne 3 fragmenty” zamiast `M1_TERM_08` (pytanie 3) | 62–64% | 91–94% | 165 / 56% |
| **pakiet v1.2 (R16 + R18 + R20)** | **50–54%** | **48–51%** | 147,5–165 / 56–64% |

- Wpływ na ujścia: Lights I tańszy o 50 kr i 5 Cu. Lights II/III bez zmian, więc ujście (c) traci ~50 kr na gracza (pomijalne).

### 8.3 R20: odkupienie sprzętu 480 kr przy saldzie ~384 kr po 1 h
- **Problem:** po śmierci na g2 bez zapasu w skrytce gracz wraca na Issue (DPS 26 < progu 30 do zejścia na g2). Odkupienie broni + pancerza ilvl 2 r2 z półki kosztuje 480 kr, a przeciętny gracz ma po 1 h ~360–385 kr.
- **Przyczyna:** model v1.1 zakładał, że gracz trzyma zapas w skrytce [Z]. Gra tego nie uczy (R5). **Problem jest realny:** bez zapasu (polityka QA) odbudowa trwa 3 wyprawy (p80: 4–5), a boss przesuwa się do mediany 175–185 min (+15–25 min), 49–53% po 3 h.
- **Poprawka:**
  1. **Issue Mk2** (`ISSUE_TIER_BY_STOP`): po odblokowaniu przystanku g2 Issue Baton ma 10–15 (DPS ~32,8 ≥ 30), a Issue Suit pancerz 6. Nadal 0 kr, nie przepada. Gracz po śmierci może od razu wrócić na g2, a nie musi grindować g1.
  2. **Broń r1 na półce po śmierci** (`SHOP_DEATH_WEAPON`): 40–80 kr zamiast 160–320 kr za r2.
  3. Cena półki ×4 bez zmian [GD]. Zdanie o zapasie w skrytce w jednorazowym wyjaśnieniu po 1. śmierci (`M1_RISK_04`, Dialogi): propozycja QA, popieram.
- **Efekt (przeciętny gracz, bez zapasu w skrytce):**

| Wariant | Odbudowa (wyprawy do 90% DPS sprzed śmierci, mediana / p80) | Saldo 1 h / 3 h | Boss (mediana / % po 3 h) |
|---|---|---|---|
| bez zapasu, bez poprawki | 3 / 4 | 370–378 / 598–627 | 175–185 min / 49–53% |
| + Issue Mk2 | 2 / 3 | 394 / 743–816 | 150–155 / 59–61% |
| + Issue Mk2 + broń po śmierci | 2 / 3 | 391–416 / 758–770 | 155–157,5 / 58–61% |
| z zapasem (model v1.1) | 2 / 3 | 360–373 / 624–676 | 157,5–162,5 / 58–59% |

- Wpływ na ujścia: Issue Mk2 nie odbiera celu, bo r1/r2 z g2 są od niego lepsze (DPS 35–38).

### 8.4 Suma poprawek a cel tempa „boss po ~3 h”
| Wariant (przeciętny gracz) | Mediana 1. wygranej | % wygranych po 3 h | Przesunięcie względem v1.1 |
|---|---|---|---|
| v1.1 (C, waga DC 2), 3 przebiegi | 157,5 / 157,5 / 162,5 min | 58–59% | — |
| **pakiet v1.2, z zapasem** (3 przebiegi) | 147,5 / 165 / 165 min | 56–64% | **−10 do +7,5 min** |
| pakiet v1.2, bez zapasu (2 przebiegi) | 150 / 155 min | 62–64% | −5 do −10 min |
| (porównanie) Issue do 6 przy każdym wyjeździe (§9) | 125 / 135 min | 64–71% | **−22,5 do −37,5 min** |

**Wniosek: poprawki R16 / R18 / R20 nie przesuwają bossa poza ±30 min (efekt ≤ szum modelu), więc kompensacja niepotrzebna.** Jedyna zmiana bliska progu to Issue „do 6” (§9), którego nie rekomenduję.

## 9. Rozbieżność Issue 2 vs 6
- **Co liczyłem:** we wszystkich skryptach od v0.4 Issue uzupełnia Med-Patche **do 2 (3 od Lights I)** przy każdym wyjeździe windą (`progresja.py`/`progresja2.py`: `topup = 3 if lights else 2`, `progresja3.py`: `CFG['topup'] = (2, 3)`). **6 to `STACK_MEDPATCH`**, czyli limit plecaka [P GD v0.4]. W budżecie HP (`budzet_final.py`, `boss_trip_v05.py`) gracz **startuje z 6 patchami**, ale dokupionymi za 25 kr. Stąd zapewne „6, tak jak liczyłeś”.
- **Wpisane w v1.2:** `ISSUE_MEDPATCH_TOPUP` = 2 / 3 / 3 / 3 (Lights 0 / I / II / III), czyli to, co liczone.
- **Porównanie** (`exp_issue6.py`, pakiet v1.2, 300 graczy, 2 przebiegi):

| Wariant | Zakupy Med-Patchy w 4 h (przeciętny / dobry) | Saldo 3 h (przeciętny) | Boss przeciętnego: mediana / % po 3 h | Budżet HP |
|---|---|---|---|---|
| **2 / 3 (liczone, rekomendacja)** | **957–983 / ~605 kr** | 608–794 | 147,5–165 min / 56–64% | jak §6 (6 patchy na starcie wyprawy na g3 za ~100 kr) |
| 4 / 5 (pośredni) | ~375 / ~375 kr | 802–954 | 140–145 / 61–66% | bez zmian dla g3, więcej przy g1–g2 |
| 6 / 6 | **0 kr** | 878–1154 | **125–135 min / 64–71%** | ten sam dla głębokich wypraw, ale za darmo; każdy kontrakt z 6 patchami |

- **Skutki „do 6”:**
  1. znika ujście Med-Patchy (~950 kr u przeciętnego gracza w 4 h);
  2. boss przyspiesza o ~20–30 min względem 2 / 3 w tych samych przebiegach (−22,5 do −37,5 min względem v1.1), czyli na granicy celu „~3 h ±30 min” albo za nią;
  3. **nagroda Clear the Path (1 Med-Patch) traci wartość**, bo gracz i tak wyjeżdża z 6, a CtP g1 nie daje nic innego;
  4. decyzja „ile patchy kupić przed zejściem” (filar ryzyka, EV zejścia) znika;
  5. kontrakty krótkie stają się prawie bezryzykowne.
- **Decyzja GD (25.10): 2 / 3 potwierdzone.** Rekomendacja była: zostawić **2 / 3** (Lights 0 / I+). Jeśli GD chce hojniejszego startu, bezpieczniejszy jest wariant pośredni 4 / 5 (boss −15–20 min, ujście patchy ~375 kr), ale wtedy nagrodę CtP g1 trzeba zmienić (np. 15 kr + 1 Cu) i przeliczyć.

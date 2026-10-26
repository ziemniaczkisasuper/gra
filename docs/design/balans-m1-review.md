# Balans M1: przegląd wartości roboczych (DESIGN / Balans i Ekonomia)

Status: **Propozycja, do akceptacji Game Directora** (po uwagach Mechaników)
Wersja: 0.2 (25.10.2026). Autor: DESIGN / Balans i Ekonomia. **v0.2: dopisana sekcja 6 „Aktualizacja v0.3 / v0.4” (przegląd `mechaniki-m1.md` v0.4). Tam, gdzie sekcja 6 zmienia rekomendację z sekcji 0–5, obowiązuje sekcja 6.** Wartości do konfiguracji: `design/balans-m1.md`.
Przegląd dotyczy: `design/mechaniki-m1.md` v0.2 (Część 2, tabele 2.4, 2.10, 2.11, 2.12, 2.15). **Pliku Mechaników nie zmieniam**, tylko proponuję zmiany.
Inne źródła: `wizja-gry.md`, `plan-produkcji.md`, `fabula/teksty-m1-en.md` (afiksy 7.3, rzadkości 7.2), `graf/styl-ascii.md`.
Symulacje (Python, stałe ziarno, można powtórzyć): `design/balans-sim/` → `sim_m1.py` (model walki 1v1 co do ticka), `analiza.py`, `propozycja.py` (poziomy), `boss.py`, `ekonomia.py`.

Oznaczenia: **[P]** to wartość z pliku Mechaników lub innego pliku projektu. **[Z]** to założenie Balansu (w plikach go nie ma, więc przyjmuję je jawnie). **[N]** to nowa wartość proponowana przez Balans.

---

## 0. Podsumowanie decyzji

1. **Mnożniki głębokości są za strome.** Roboczo (HP ×1/1,6/2,4, obrażenia ×1/1,3/1,6) obrażenia otrzymane na walkę rosną ×1 / 1,56 / 2,1. Poziom głęb. 3 przy 50% uników kosztuje ~367 HP, czyli 100 HP + **6,7 Med-Patcha**, a limit to 5. **Propozycja: HP ×1 / 1,5 / 2,2, obrażenia ×1 / 1,25 / 1,5 i pancerz ze sprzętu** (pkt 5). Wtedy zagrożenie wynosi ×0,93 / 1,18 / 1,39, a poziom głęb. 3 kosztuje ~254 HP (100 HP + ~3,9 patcha). TTK zwykłych wrogów nadal rośnie łagodnie (Curfew Guard: 4,6 → 5,1 → 5,5 s), zgodnie z zamysłem Mechaników.
2. **Boss Rail Guardian: HP 1800 → 2400**, a cel walki to **60–90 s przy docelowym DPS 48**. Przy 1800 HP walka trwa ~45 s, czyli za krótko jak na finał M1. Szacunek Mechaników „90–120 s” liczy przerwy na uniki dwa razy (62 s już zawiera 60% czasu bicia). Cel Mechaników 90–150 s **odrzucam**, bo przy limicie 5 Med-Patchy walka zamieniłaby się w wyniszczanie zamiast testu uników.
3. **Med-Patch 25 kr zostaje.** Kosztuje 0,625 kr/HP, a leczenie pochłania ok. 15–25% przychodu z poziomu na „swojej” głębokości. **Dwie poprawki zasad:** (a) uzupełnianie Issue do 2 sztuk **przy każdym wyjeździe windą**, a nie tylko przy wydruku po śmierci. Obecnie celowa śmierć z pustym plecakiem daje 2 darmowe patche (~50 kr/min, więcej niż wyprawa na głęb. 1). (b) **Med-Patchy nie da się sprzedać** (0 kr).
4. **Kontrakty:** Clear the Path **50 kr + 2 Med-Patche → 40 kr + 1 Med-Patch** (roboczo daje ~67 kr/min, więcej niż wyprawa na głęb. 2). Sell One Item: **„cena × 2” → „cena + premia 50 kr (r2) / 100 kr (r3)”**, bo roboczo przedmiot r3 poziomu 3 daje 600 kr za 15 s. Restore Relay, Data Core i Deliver zostają bez zmian.
5. **Pancerz: model procentowy z malejącymi zwrotami, DR = A / (A + 100)**, limit DR 60%, minimum 1 obrażenia po redukcji. Typowy pancerz: 8 / 21 / 30 (głęb. 1/2/3), czyli DR 7 / 17 / 23%. Płaską redukcję odrzucam: przy 6 punktach daje Zbieraczowi −80%, a bossowi tylko −18%.
6. **M1_AFFIX_06: TAK, zmieniamy „regenerację” na „+% leczenia z Med-Patchy”**, ale na mniejszych zakresach niż proponowane +25–50%: **r1 +10–15%, r2 +16–25%, r3 +26–35%**. Maksymalnie 1 taki afiks na przedmiot, tylko na slotach Armor i Module, łączny limit **+60%**. Efektywna cena spada z 0,625 do 0,46 kr/HP (r3) i maksymalnie do 0,39 kr/HP (limit).
7. **Rzadkości i ceny sprzedaży zostają** (80/18/2, 65/30/5, 50/38/12%; 10/40/150 kr × poziom). Szansa na co najmniej 1 przedmiot r3 na poziom: 12% / 36% / 68%. Obserwujemy udział r3 w wartości łupu na głęb. 3 (47%).
8. **Wzrost DPS 26 → 35 → 48 jest realny jako DPS sprzętu *z danej głębokości*** (propozycja skalowania broni w 3.6). Gracz wchodzi jednak na głębokość ze sprzętem z poprzedniej (~30 / ~40 DPS) i propozycje z pkt 1–2 to wytrzymują. **Warunek techniczny:** afiksy szybkości ataku i ruchu wymagają licznika ułamkowego ticka, bo przy ticku 50 ms najmniejszy krok to −14% (atak) i −33% (ruch).

---

## 1. Tabela parametrów: robocza vs proponowana

Uwzględniam tylko parametry, które ruszają balans lub ekonomię. Parametry czysto mechaniczne z 2.15 (czasy kanałowania, promienie, sloty, flow field, żetony ataku, Zbieracze, ewakuacja) **sprawdziłem pod kątem spójności i zostawiam bez zmian**, poza uwagami w rozdziale 4.

| Parametr | Wartość robocza [P] | Proponowana | Uzasadnienie |
|---|---|---|---|
| `PLAYER_HP` | 100 (Część 1, w M1 bez zmiany) | **100** (bez zmian) | Bazę zostawiam. Wzrost tylko ze sprzętu (AFFIX_04, 3.6). |
| `DEPTH_HP_MULT` | 1,0 / 1,6 / 2,4 | **1,0 / 1,5 / 2,2** | TTK ×1 / 1,13 / 1,20 względem wzrostu DPS (roboczo ×1 / 1,19 / 1,30). Walki wydłużają się łagodnie, nie gąbczasto (3.2). |
| `DEPTH_DMG_MULT` | 1,0 / 1,3 / 1,6 | **1,0 / 1,25 / 1,5** | Razem z pancerzem zagrożenie na walkę rośnie ×1 / 1,18 / 1,39 zamiast ×1 / 1,56 / 2,1. Głęb. 3 mieści się w limicie 5 patchy (3.2). |
| `DEPTH_ENEMY_COUNT` | 8–10 / 12–14 / 14–16 | bez zmian | Liczba wrogów daje presję czasu. Przy nowych mnożnikach budżet HP się zgadza (3.2). |
| `DEPTH_RARITY_ODDS` | 80/18/2, 65/30/5, 50/38/12 | bez zmian | P(≥1 r3 na poziom) = 12 / 36 / 68%. Wyraźna nagroda za głębokość (3.4). |
| `ENEMY_ITEM_DROP` | 0,20 | bez zmian | Daje 6,3 / 8,6 / 9,0 przedmiotu na poziom (sym. Mechaników), co zgadza się z plecakiem 12. |
| `SELL_SCRAP` / `SELL_COPPER` | 2 / 5 kr | bez zmian | Scrap to ~1/3 wartości łupu na głęb. 1 i 12% na głęb. 3: dobra „podłoga” dla leniwego farmienia. |
| `SELL_ITEM` | 10/40/150 × (1 + 0,5·(poz.−1)) | bez zmian (obserwować) | EV przedmiotu: 18 / 39 / 76 kr. Przychód z poziomu ~170 / 410 / 780 kr (3.4). Jeśli testy pokażą zbyt „loteryjny” `AT RISK`, r3 → 120. |
| `MEDPATCH_PRICE` | 25 kr | **25 kr** (bez zmian) | 0,625 kr/HP. Na „swojej” głębokości leczenie zjada ~15–25% przychodu z poziomu (3.3). |
| `MEDPATCH_HEAL` / czas / odnowienie | 40 HP / 2000 / 4000 ms | bez zmian | 40 HP ≈ 2,3 ciosu Curfew Guarda na głęb. 1. Odczuwalny, ale nie kasuje błędu. |
| `MEDPATCH_SELL` | brak w pliku | **0 kr [N]** (nie do sprzedania) | Zamyka pętlę „śmierć → darmowe patche → sprzedaż”. |
| `ISSUE_MEDPATCH_TOPUP` | 2 / 3, **przy wydruku** (po śmierci) | 2 / 3, **przy każdym wyjeździe z bazy [N]** | Obecnie śmierć opłaca się jako tankowanie (2 × 25 kr za ~1 min). Tak samo dla śmierci i ewakuacji = zgodnie z Z-GD2 i bez nagrody za śmierć. |
| `STACK_MEDPATCH` / maks. 5 | 5 | bez zmian | Limit 5 jest kluczową kotwicą bilansu HP (3.2, 3.1). |
| Szansa Med-Patcha w skrzyni | ~30% | bez zmian | ~0,9 / 1,2 / 1,2 patcha na poziom (3 / 4 / 4 skrzynie). |
| `CONTRACT` Restore Relay | 1. raz: fragment + 60 kr; powtórka 40 kr | bez zmian | ~18–27 kr/min. Niski przelicznik równoważy to, że zagadka jest przyjemnością samą w sobie i pauzuje świat. |
| `CONTRACT` Data Core | 90 kr + 30% przedmiot r≥2 | bez zmian | ~115 kr EV / 2 min ≈ 58 kr/min. Uczciwie za głęb. 2 i ryzykowny przedmiot w plecaku. |
| `CONTRACT` Clear the Path | 50 kr + 2 Med-Patche | **40 kr + 1 Med-Patch** | Roboczo 100 kr ekwiwalentu / 1,5 min = 67 kr/min, więcej niż wyprawa na głęb. 2 (~45). Po zmianie: 43 kr/min. |
| `CONTRACT` Deliver N Units | 20 Scrap / 8 Copper → 60 kr (×1,5) | bez zmian | Premia +20 kr ponad sprzedaż. Copper konkuruje z kosztem ulepszenia bazy (dobry dylemat). |
| `CONTRACT` Sell One Item | cena × 2 | **cena + 50 kr (r2) / +100 kr (r3) [N]** | Roboczo r3 poz. 3 = 600 kr za 15 s (3× ulepszenie bazy). Stała premia oddziela kontrakt od jackpotu. |
| `BASE_UPGRADE_COST` | 200 kr + 15 Copper | bez zmian | Osiągalne po ~2 poziomach głęb. 2 (Copper) i w ~45–60 min gry. Pasuje do testu „pierwszej godziny” (3.5). |
| `BOSS_HP` | 1800 (cel 90–150 s) | **2400, cel 60–90 s przy 48 DPS** | Szczegóły w 3.1. Przy 1800 HP: ~45 s. Przy 2400 HP: 48 DPS ~59–74 s, 35 DPS ~75 s, 26 DPS ~94 s. |
| Obrażenia bossa | 25–40 | bez zmian, **bez mnożnika głębokości [Z]** | Z mnożnikiem ×1,6 (40–64) dwa ciosy zabijają gracza. Do potwierdzenia przez Mechaników. |
| Odnowienie ataku bossa | brak w pliku | **1200 ms [Z]**, szarża co 4. atak [Z] | Potrzebne do symulacji. Do ustalenia przez Mechaników. |
| `ARMOR_MODEL` | brak (pyt. 7) | **DR = A / (A + 100) [N]** | Rozdział 2.5. |
| `ARMOR_K` / `ARMOR_DR_CAP` / `DMG_MIN_AFTER_ARMOR` | — | **100 / 0,60 / 1 [N]** | Limit 60% przy A = 150 (nieosiągalny w M1, zabezpieczenie na M2). |
| Pancerz bazowy przedmiotu Armor (poz. 1/2/3) | — | **6–10 / 13–19 / 20–28 [N]** | Typowy DR 7 / 17 / 23% na głęb. 1/2/3. |
| `M1_AFFIX_05` pancerz (r1/r2/r3) | — | **+2–4 / +4–7 / +7–10 [N]** | Sloty Armor i Module. Maksimum w M1 to ~48 pancerza (DR 32%). |
| `M1_AFFIX_06` | regeneracja; Mechaniki: +25–50% leczenia | **+% leczenia Med-Patchy: 10–15 / 16–25 / 26–35% [N]**, limit łączny +60% | Rozdział 2.4. |
| `M1_AFFIX_04` maks. HP (r1/r2/r3) | — | **+6–10 / +11–18 / +19–28 HP [N]** | Równowaga z AFFIX_06 przy ~2–3 patchach na poziom (2.4). |
| `M1_AFFIX_01/02/03` (obrażenia, szybkość, kryt.) | — | **+5–8 / 9–14 / 15–20%; +4–6 / 7–10 / 11–15%; +3–5 / 5–8 / 8–12 p.p. [N]** | Pozwalają osiągnąć 35 / 48 DPS (3.6). Szybkość wymaga licznika ułamkowego ticka. |
| Rail Pistol (dystans) | 6–9, 150 / 450 ms ≈ 12,5 DPS | **do decyzji: 8–11 ≈ 16,5 DPS [N, opcjonalnie]** | 12,5 DPS to 48% DPS wręcz: TTK Curfew Guarda 9,6 s. Proponuję ~60–65% wręcz (pyt. 6). |

---

## 2. Odpowiedzi na 5 punktów Mechaników

### 2.1 Ceny, nagrody kontraktów, rzadkości, Med-Patch 25 kr
**Przychód na poziom** (z pliku: łup na poziom 6,3 + 27 Scrap / 8,6 + 39 / 9,0 + 45; ceny i rzadkości z 2.10–2.11):

| Głęb. | EV przedmiotu | Przedmioty + Scrap | Udział r3 w wartości | P(≥1 r3 / poziom) | Szt. r2 / poziom |
|---|---|---|---|---|---|
| 1 | 18,2 kr | 115 + 54 = **169 kr** | 16% | 12% | 1,1 |
| 2 | 39,0 kr | 335 + 78 = **413 kr** | 29% | 36% | 2,6 |
| 3 | 76,4 kr | 688 + 90 = **778 kr** | 47% | 68% | 3,4 |

Wynik zgadza się z szacunkiem Mechaników (głęb. 1 ≈ 120–160 kr). Przy ~8 min na poziom [P, 2.2] daje to brutto ~21 / ~52 / ~97 kr/min. Plecak 12 slotów i ryzyko śmierci obniżają realny przychód na głęb. 2–3, ale nie odwracają kolejności.

**Med-Patche na poziom** (50% uników, sym. 1v1, w 3.2), koszt jako % przychodu z poziomu:

| Głęb. | Roboczo: HP straty → patche ponad 100 HP → kr | Propozycja: HP → patche → kr |
|---|---|---|
| 1 | 84 HP → 0 → 0 kr | 79 HP → 0 → 0 kr |
| 2 | 224 HP → 3,1 → 78 kr (19%) | 169 HP → 1,7 → 43 kr (10%) |
| 3 | 367 HP → **6,7 (> limit 5)** → 168 kr | 254 HP → 3,9 → 96 kr (12%) |

Leniwe farmienie (0% uników) na głęb. 1: 157–169 HP → ~1,7 patcha → ~43 kr, czyli ~25% przychodu. Filar 3 działa: na głęb. 1 można grać „bez myślenia”, płacąc patchami.

**Ile patchy kupią nagrody (25 kr/szt.):** Relay 60 kr = 2,4; powtórka 40 kr = 1,6; Data Core 90 kr = 3,6; Clear the Path (propozycja) 40 kr + 1 = 2,6; Deliver 60 kr = 2,4. Ewakuacja przywraca pełne HP, więc kontrakty na głęb. 1–2 rzadko zużywają patche (Clear the Path na głęb. 2: ~100 HP straty przy 50% uników). **Nagrody z kontraktów to więc prawie czysty zysk** i właśnie dlatego trzeba pilnować ich kr/min:

| Aktywność | kr / min | Uwagi |
|---|---|---|
| Wyprawa głęb. 1 | ~21 | brutto, prawie bez kosztu patchy |
| Wyprawa głęb. 2 / 3 | ~45 / ~85 | brutto minus patche (propozycja), bez strat po śmierci |
| Restore Relay (1. raz / powtórka) | 27 / 18 | + fragment sieci za 1. raz |
| Data Core | ~58 | EV z 30% na przedmiot r≥2 poz. 2 |
| Clear the Path roboczo / propozycja | **67** / 43 | patch liczony po 25 kr |
| Deliver (premia ponad sprzedaż) | ~50 (tylko 20 kr na raz) | sesja mikro, ograniczona tablicą 1 slotu |
| Sell One Item r3 poz. 3 roboczo | 1200 (600 kr / 15 s) | **błąd skali**, propozycja: premia stała 100 kr |

Zasada, którą przyjmuję: **kontrakt BASE daje 1–1,5× kr/min wyprawy na głęb. 1–2** (krótkie sesje mają się opłacać, filar sesji 30 s – 3 min), **ale nie więcej niż wyprawa na głębokości, na której się odbywa.** Roboczy Clear the Path (głęb. 1) jest od tej zasady 3× wyżej.

### 2.2 HP bossa 1800 przy DPS 26 → 35 → 48
**Czysto arytmetycznie** (1800 HP / DPS): 69 / 51 / 37,5 s. Przy 60% czasu bicia [P]: 114 / 86 / 62,5 s. **Uwaga do 2.10:** wartość „62 s czystego bicia + przerwy na uniki ≈ 90–120 s” liczy przerwy dwa razy, bo 62,5 s to już 37,5 s ÷ 0,6.

**Model walki** (`boss.py`; [Z] oznacza założenie): zapowiedź 800–900 ms [P], odnowienie 1200 ms [Z], co 4. atak to szarża [Z]. Uniknięta szarża = uderzenie w ścianę: 2 s ogłuszenia z obrażeniami ×2 [P] i 100% czasu bicia [Z]. Poza tym 60% czasu bicia [P]. Umiejętności ~6 DPS [Z: Arc Pulse 2,2 + dron ~5,3, część czasu poza zasięgiem]. Przy 50% HP przychodzą 2 Panel Drone (+4 s) [P/Z]. Obrażenia 25–40 [P] bez mnożnika głębokości [Z]. Pancerz wg pkt 5.

| HP bossa | DPS gracza (DR) | Mediana TTK | HP stracone przy 70% / 80% uników | Patche ponad 100 HP (70% / 80%) |
|---|---|---|---|---|
| 1800 | 26 (0%) | 73 s | 297 / 189 | 4,9 / 2,2 |
| 1800 | 35 (16%) | 57 s | 202 / 129 | 2,5 / 0,7 |
| 1800 | **48 (23%)** | **45 s** | 145 / 95 | 1,1 / 0 |
| **2400** | 26 (0%) | 94 s | 385 / 249 | 7,1 / 3,7 |
| **2400** | 35 (16%) | 75 s | 262 / 167 | 4,0 / 1,7 |
| **2400** | **48 (23%)** | **59 s** (74 s bez punktu słabego) | 189 / 120 | 2,2 / 0,5 |
| 2700 | 48 (23%) | 66 s | 209 / 135 | 2,7 / 0,9 |

**Cel: 60–90 s przy DPS 48. Rekomendacja: 2400 HP.** Uzasadnienie:
- **Budżet patchy.** Maksymalnie 5 Med-Patchy w plecaku. Walka trwająca 90–150 s przy 70% uników wymaga 4–9 patchy, więc przegrana wynikałaby z wyniszczenia, a nie z błędu gracza. Przy 2400 HP i docelowym sprzęcie walka kosztuje 0,5–2,2 patcha: zostaje margines na adds i pomyłki.
- **Sesje i telefon:** długa sesja M1 przewiduje bossa na 2–3 min razem z dojściem, przywołanymi dronami i leczeniem [P, 2.2]. 60–90 s czystej walki się w tym mieści.
- **Gradient sprzętu.** Ze sprzętem z głęb. 2 (35 DPS) walka trwa ~75 s i kosztuje 1,7–4 patche: wykonalna. Z Issue (26 DPS) ~94 s i 3,7–7 patchy: tylko przy 80%+ uników i pełnym zapasie. Boss wymaga więc sprzętu albo umiejętności, ale nie blokuje twardo. Nie ma tu „litości” po śmierciach (Z-GD2).
- **1800 HP to za mało:** ~45 s przy 48 DPS, a przy 35 DPS faza po przywołaniu dronów trwa poniżej 30 s. Finał M1 i 20% sieci za tak krótką walkę to za słaby moment.
- Wynik jest wrażliwy na częstotliwość szarży (punkt słaby ×2 daje ~20% skrócenia). **Jeśli Mechaniki ustalą szarżę rzadziej niż co 4. atak, 2400 → ~2100.** Regułę strojenia zapisuję jako: `BOSS_HP ≈ 75 s × (48 × efektywny_czas_bicia + 6)`.

### 2.3 Mnożniki wrogów vs wzrost DPS gracza
Wzrost DPS (×1 / 1,33 / 1,83) vs HP wrogów (×1 / 1,6 / 2,4) → **TTK zwykłych wrogów rośnie ×1 / 1,19 / 1,30**. Obrażenia rosną ×1,3 / 1,6, a HP gracza jest stałe (100). **Obrażenia otrzymane na walkę** (≈ mnożnik obrażeń × mnożnik TTK) rosną więc **×1 / 1,56 / 2,1**, a na cały poziom, z większą liczbą wrogów, **×1 / 2,7 / 4,4**.

TTK i obrażenia na walkę 1v1 (sym. co do ticka, wartości robocze, DPS 26 / 35 / 48):

| Wróg | TTK g1 / g2 / g3 | Obrażenia bez uników g1 / g2 / g3 | przy 70% uników |
|---|---|---|---|
| s Scrapper | 1,0 / 1,3 / 1,4 s | 5 / 7 / 10 | 1,5 / 2 / 3 |
| d Panel Drone | 1,4 / 1,7 / 1,9 s | 13 / 25 / 32 | 4 / 7 / 10 |
| t Line Sentry (+0,75 s dojścia [Z]) | 3,3 / 3,9 / 4,2 s | 24 / 33 / 40 | 7 / 10 / 12 |
| h Curfew Guard | 4,5 / 5,4 / 5,9 s | **51 / 85 / 109** | 15 / 26 / 32 |

**Ocena:**
- **Rosnący TTK jest zamierzony** (Mechaniki: „czas walki rośnie łagodnie”). Zgadzam się: głębiej walka ma być trochę dłuższa, ale nie gąbczasta. Wzrost +30% przy głęb. 3 jest na granicy, więc proponuję +20%.
- **Wzrost obrażeń na poziom ×4,4 nie jest do utrzymania** przy limicie 5 patchy: poziom głęb. 3 przy 50% uników = 367 HP. Mechaniki chciały, żeby obrażenia rosły „wyraźnie”, ale nie zakładały pancerza ani HP ze sprzętu, bo tych liczb jeszcze nie było.
- **Propozycja** (HP ×1/1,5/2,2, obrażenia ×1/1,25/1,5, typowy pancerz DR 7/16/23%):

| Wariant | 50% uników: HP straty g1 / g2 / g3 | 70% uników | 0% uników | Zagrożenie na walkę |
|---|---|---|---|---|
| Roboczy, sprzęt docelowy (26/35/48) | 84 / 224 / 367 | 50 / 135 / 217 | 169 / 449 / 724 | ×1 / 1,56 / 2,10 |
| Propozycja, sprzęt docelowy | 79 / 169 / 254 | 47 / 101 / 151 | 157 / 335 / 504 | ×0,93 / 1,18 / 1,39 |
| Propozycja, sprzęt „na wejściu” (26/30/40) | 80 / 189 / 280 | 47 / 114 / 169 | 157 / 377 / 564 | — |

Cel, który zapisuję: **na „swojej” głębokości jeden poziom przy 50% uników mieści się w 100 HP + ≤ 4 patche**. Zapas 5 patchy i 100 HP wystarcza więc na ~1–2 poziomy, a decyzja „dalej czy wracać” wypada w połowie głęb. 2, razem z zapełnieniem plecaka [P, 2.11]. Leniwe farmienie (0% uników) jest opłacalne na głęb. 1, kosztowne na 2 i niemożliwe bez powrotów na 3. To dobry gradient dla filaru 3.

Uwaga: symulacja liczy walki 1v1 po kolei, więc daje **dolną granicę**. Grupy (2 żetony ataku) zwiększają straty. Do kalibracji w QA telemetrią „HP straty na poziom”.

### 2.4 M1_AFFIX_06: „regeneracja” → „+% leczenia z Med-Patchy”
**Rekomendacja: TAK.** Regeneracja przeczy 2.12 (brak regeneracji w M1, HP jako zasób wyprawy). „+% leczenia” wzmacnia za to pętlę ekonomiczną: patch staje się tańszy na HP, a nie darmowy. Nazwy „Patched / of Repair” pasują bez zmian [P, teksty 7.3].

**Zakresy (propozycja), jeden afiks na przedmiot, tylko sloty Armor i Module, łączny limit +60%:**

| Rzadkość | +% leczenia | HP z 1 patcha | kr / HP (cena 25) | 5 patchy = HP |
|---|---|---|---|---|
| brak | 0% | 40 | 0,625 | 200 |
| r1 Salvaged | +10–15% | 44–46 | 0,57–0,54 | 220–230 |
| r2 Tuned | +16–25% | 46–50 | 0,54–0,50 | 232–250 |
| r3 Grid-Grade | +26–35% | 50–54 | 0,50–0,46 | 252–270 |
| limit łączny | +60% | 64 | 0,39 | 320 |

Dlaczego mniej niż +25–50% od Mechaników: przy +50% na dwóch slotach (+100%) patch leczy 80 HP, czyli 80% bazowego HP. Jedna kieszeń patchy (5) dawałaby 400 HP i znosiłaby limit 5 jako kotwicę balansu (2.3). +35% na r3 to wyraźny bonus (+70 HP na pełny zapas), ale go nie łamie.

**Porównanie z AFFIX_04 (maks. HP):** przy ~2–3 patchach zużytych na poziom AFFIX_06 r2 (+20%) daje +16–24 HP na poziom, a AFFIX_04 r2 (+11–18) daje stałe HP plus pełne wyleczenie przy ewakuacji. Oba afiksy są porównywalne, ale pasują do innych stylów gry: AFFIX_06 dla długich wypraw, AFFIX_04 dla krótkich. **Pancerz mnoży wartość patcha:** przy DR 23% patch ≈ 52 efektywnego HP (0,48 kr/eHP). Dlatego limity AFFIX_06 i pancerza są ustawione razem.
Implementacja: % zwiększa ilość leczenia, a czas 2 s zostaje (rośnie więc HP/s). Dotyczy też patchy Issue.

### 2.5 Model pancerza
Typowe ciosy wrogów (średnio, głęb. 1 / głęb. 3 przy roboczym ×1,6): Scrapper 5 / 8, Panel Drone 10 / 16, Line Sentry 12,5 / 20, Curfew Guard 17 / 27, boss 32,5.

| Opcja | Jak działa | Plusy | Minusy (liczby) |
|---|---|---|---|
| **A. Płaska redukcja** (np. −6 na cios, min. 1) | dmg − A | prosta w HUD | Scrapper −80%, Drone −60%, Guard −35%, boss −18%. Słabi wrogowie znikają jako zagrożenie, a wartość pancerza spada z głębokością. Ostro przy małych liczbach (4–6 dmg). |
| **B. Procentowa z malejącymi zwrotami** DR = A/(A+K) | dmg × (1 − DR) | taki sam % na każdy cios (boss też), naturalny limit < 100%, czytelna jako „−23%” w HUD, łatwe skalowanie K na kolejne strefy | potrzebne zaokrąglenie przy małych ciosach (rozwiązane minimum 1) |
| C. Hybryda w stylu PoE: A/(A + 5·dmg) | redukcja zależna od wielkości ciosu | duże ciosy redukowane słabiej (boss groźny) | A = 30: Scrapper −43%, boss −16%. Nieczytelna dla gracza, a na telefonie bez tooltipów trudno ją wyjaśnić. Zostawiam jako opcję na M2+. |

**Rekomendacja: B, DR = A / (A + 100), limit 60%, obrażenia po redukcji zaokrąglane w dół, min. 1.** K = 100 jest dobrane tak, żeby typowy sprzęt z głębokości dawał DR ~7 / 17 / 23%. To wystarcza, żeby zagrożenie z 2.3 rosło łagodnie. Pancerz nie wpływa na uniki (zapowiedzi zostają głównym narzędziem obrony). Na kolejne strefy (M2+) K można skalować z poziomem strefy, żeby stary pancerz tracił na wartości.

| Pancerz A | DR | Scrapper g1/g3 | Drone g1/g3 | Sentry g1/g3 | Guard g1/g3 | Boss |
|---|---|---|---|---|---|---|
| 0 (Issue Suit) | 0% | 5 / 8 | 10 / 16 | 12,5 / 20 | 17 / 27,2 | 32,5 |
| 8 (typowy g1: Armor poz. 1) | 7,4% | 4,6 / 7,4 | 9,3 / 14,8 | 11,6 / 18,5 | 15,7 / 25,2 | 30,1 |
| 21 (typowy g2: poz. 2 + afiks) | 17,4% | 4,1 / 6,6 | 8,3 / 13,2 | 10,3 / 16,5 | 14,0 / 22,5 | 26,9 |
| 30 (typowy g3: poz. 3 + afiks) | 23,1% | 3,8 / 6,2 | 7,7 / 12,3 | 9,6 / 15,4 | 13,1 / 20,9 | 25,0 |
| 48 (maks. M1: poz. 3 + 2× afiks r3) | 32,4% | 3,4 / 5,4 | 6,8 / 10,8 | 8,4 / 13,5 | 11,5 / 18,4 | 22,0 |
| 150 (limit, poza M1) | 60% | — | — | — | — | 13,0 |

Źródła pancerza [N]: przedmiot Armor ma pancerz bazowy zależny od poziomu przedmiotu: **6–10 / 13–19 / 20–28**. AFFIX_05 „Plated / of Steel” daje **+2–4 / +4–7 / +7–10** (r1/r2/r3), na slotach Armor i Module. Issue Suit = 0.

---

## 3. Wyliczenia i założenia

### 3.1 Model walki (sim_m1.py)
- [P] Gracz: 8–12, kryt. 10% ×1,5 (w dół), 1. cios po 100 ms, potem co 400 ms. Symulowany DPS 26,2 (plik: ≈ 26,3). Remis w ticku wygrywa gracz. HP 100.
- [P] Wrogowie z tabeli 2.10 (HP, obrażenia, zapowiedź/odnowienie), 1. cios wroga po czasie zapowiedzi, potem co cykl.
- [Z] Wyższy DPS gracza = obrażenia przeskalowane proporcjonalnie (bez zmiany rytmu).
- [Z] Unik = niezależny rzut na każdy cios (0 / 50 / 70%), bez utraty DPS. Optymistycznie dla szybkich wrogów (cykl Drone'a 1000 ms).
- [Z] Line Sentry: 0,75 s dojścia z dystansu 6, w trakcie którego strzela.
- [Z] Skład poziomu (w pliku są tylko liczby i typy): g1 = 3 s + 4 d + 2 h; g2 = 4 s + 4 d + 3 h + 2 t; g3 = 4 s + 4 d + 4 h + 3 t.
- [Z] Walki 1v1 sekwencyjnie, czyli dolna granica strat (patrz 2.3).
- 5000 walk na kombinację.

### 3.2 Budżet HP wyprawy
- [P] 100 HP, maks. 5 Med-Patchy po 40 HP, Issue 2 sztuki, skrzynie ~30% na Med-Patch (3 / 4 / 4 skrzynie → ~0,9 / 1,2 / 1,2 patcha na poziom).
- Pełna wyprawa 1 → 3 (propozycja, 50% uników): 79 + 169 + 254 = **502 HP + boss ~120–190**. Budżet: 100 + 5 × 40 + ~3,3 patcha ze skrzyń × 40 ≈ **430 HP**. Pełna wyprawa z bossem w jednym podejściu wymaga więc ~70% uników, AFFIX_04 / AFFIX_06 albo powrotu w połowie. To zgodne z 2.2 („+ powroty”) i z filarem 1. Roboczo (84 + 224 + 367 = 675 HP + boss) jest to możliwe tylko dla bardzo dobrego gracza.
- [P, 2.12] Uwaga do bilansu Mechaników „~34 HP na walkę → ~5 walk”: to liczby wroga M0. Jego odpowiednik w M1 (Curfew Guard 120 HP, 14–20) zadaje ~51 HP bez uników, więc 180 HP (100 + 2 patche) to ~3,5 takiej walki.

### 3.3 Med-Patch: koszt w przychodzie
Patrz tabela w 2.1. Koszt leczenia na „swojej” głębokości: g1 ≈ 0% (aktywny gracz) do ~25% (leniwy), g2 ≈ 10–19%, g3 ≈ 12–22%. Cena 25 kr jest odczuwalna w pierwszej godzinie (1 patch ≈ połowa nagrody za kontrakt) i spada do drobnego kosztu głęboko. Tak ma być: wczesna decyzja „kupić 3. patcha czy zaryzykować” jest ważna, a późniejsza nie przytłacza.

### 3.4 Rzadkości
- [P] Szansa ≥ 1 r3 na poziom: 1 − (1 − p₃)^n = 12% / 36% / 68% (n = 6,3 / 8,6 / 9,0).
- Udział r3 w EV łupu: 16 / 29 / 47%. Na głęb. 3 prawie połowa wartości to „jackpot”, co pasuje do looter RPG (wizja: PoE 2). `AT RISK` będzie jednak skakał. Jeśli QA zgłosi, że decyzja dalej/wracać zależy wyłącznie od tego, czy wypadło r3, zmieniamy r3 150 → 120 (udział na g3 spada do 42%).
- [Z/N] Liczba afiksów na rzadkość: r1 = 1, r2 = 2, r3 = 3. Pełna tabela 12 właściwości będzie osobnym dokumentem Balansu (zadanie z planu produkcji).

### 3.5 Tempo progresji (szacunek)
- [P] Prolog / 1. fragment: 10–15 min. Odblokowanie sk3 po pierwszym dotarciu na głęb. 2.
- [Z] Copper 1–3 na skrzynię od głęb. 2 → ~8 na poziom g2. 15 Copper ≈ 2 poziomy g2. 200 kr ≈ 1 poziom g2 albo 4–5 kontraktów. **Ulepszenie bazy w ~45–60 min gry.**
- [Z] 4 sloty przedmiotów równo prawdopodobne. Broń r≥2 na poziom: g2 8,6 × 0,25 × 0,35 ≈ 0,75; g3 9 × 0,25 × 0,5 ≈ 1,1. **DPS ~35 po ~1–2 poziomach g2 (~30–45 min gry), ~48 po ~1 poziomie g3 (~60–90 min).** Pierwsze podejście do bossa: ~1,5 h. To pasuje do „pierwszej godziny” QA (2.16 pkt 14) i do M1 jako małej pętli.

### 3.6 Jak osiągnąć 26 → 35 → 48 DPS (propozycja [N], do pełnej tabeli afiksów)
- Bazowe obrażenia broni wręcz wg poziomu przedmiotu: **8–12 / 10–15 / 13–19** (×1 / 1,19 / 1,52).
- Broń poz. 2, r2 (+11% obrażeń, +8% szybkości): 26,25 × 1,19 × 1,11 × 1,08 ≈ **37,4**. Poz. 3, r2 (te same afiksy): ≈ **47,8**. Poz. 1, r3 (jackpot na g1: +17%, +13%, +10 p.p. kryt.): ≈ 36. Szczęście na g1 daje sprzęt na g2, co jest dobre dla filaru 2.
- **Kwantyzacja ticków:** cykl ataku 8 ticków. −10% = 7,2 ticka, a zaokrąglenie dałoby skok do 7 (+14%). Ruch 3 ticki: najmniejsza zmiana to −33%. **Proszę o licznik ułamkowy** (np. czasy w 1/10 ticka z przeniesieniem reszty), inaczej AFFIX_02 i AFFIX_07 nie mają sensownych małych wartości.

---

## 4. Uwagi spójności (poza 5 punktami, do wiadomości Mechaników)
1. **Panel Drone ma ruch 150 ms, tyle samo co gracz.** To łamie regułę spójności 1.14 pkt (1) „`ENEMY_MOVE_MS` > `PLAYER_MOVE_MS` (ucieczka możliwa)”: przed parą Drone'ów nie da się uciec poza Vaultem. Proponuję 200 ms albo świadomy wyjątek („Drone'ów się nie ucieka, je się zabija”, 40 HP).
2. **Rail Pistol 12,5 DPS** (48% wręcz) daje TTK Curfew Guarda 9,6 s, czyli Guard odda w tym czasie ~6 strzałów do pola, z którego gracz musi schodzić. Proponuję 8–11 obrażeń (~16,5 DPS, ~63% wręcz). Do decyzji, nie blokuje.
3. **Obrażenia bossa a mnożnik głębokości:** w tabeli wrogów boss ma własne wartości. Zakładam, że mnożnik głęb. 3 go nie dotyczy. Inaczej 40–64 obrażeń = śmierć w 2 ciosach.
4. Arc Pulse (17,5 / 30 HP Zbieracza = 58%) i dron (96 obrażeń / 18 s ≈ 5,3 DPS): **liczby Mechaników potwierdzone**. Przy proponowanych mnożnikach Arc Pulse na g3 zabiera Zbieraczowi 27% HP (30 × 2,2), więc rola „czyszczenia grup” słabnie z głębokością. Na M1 to OK, a w M2 skalowanie umiejętności przyjdzie z biegłością lub drzewkiem.

---

## 5. Otwarte pytania
**Do Mechaników**
1. Odnowienie ataku bossa i częstotliwość szarży (założenie: 1200 ms i co 4. atak). Od tego zależy, czy 2400 HP, czy ~2100.
2. Czy mnożnik obrażeń głęb. 3 dotyczy bossa (założenie: nie)?
3. Zgoda na uzupełnianie Issue przy każdym wyjeździe zamiast przy wydruku, i na niesprzedawalne Med-Patche (exploit „śmierć = tankowanie”)?
4. Panel Drone 150 ms (równo z graczem): wyjątek czy 200 ms?
5. Licznik ułamkowego ticka dla szybkości ataku i ruchu: Mechaniki + PROG / Gameplay.
6. Rail Pistol: 12,5 czy ~16,5 DPS?

**Do Game Directora**
7. Cel walki z bossem: **60–90 s** (Balans) zamiast 90–150 s (Mechaniki). Akceptujesz?
8. Zasada ekonomii: kontrakt BASE ≤ kr/min wyprawy na głębokości, na której się odbywa (stąd obniżka Clear the Path i premia stała w Sell One Item)?
9. Czy pełna wyprawa 1 → 3 z bossem **bez powrotu** ma być możliwa dla średniego gracza (50% uników)? Obecny budżet (~430 HP) tego nie daje, co jest zgodne z filarem 1. Jeśli GD chce inaczej, podnosimy limit Med-Patchy do 6 albo `MEDPATCH_HEAL` do 45.

**Do QA (telemetria w testach M1)**
10. HP straty na poziom i odsetek uników, żeby skalibrować symulację 1v1 (dolna granica) do walk grupowych.

---

## 6. Aktualizacja v0.3 / v0.4 (przegląd `mechaniki-m1.md` v0.4)

Podstawa: `mechaniki-m1.md` **v0.4** (2.3, 2.4, 2.11–2.13, sekcja M2), decyzje GD przekazane przez Mechaników (cel bossa 60–90 s, zasada kontraktów, limit 6 Med-Patchy, pełna wyprawa „możliwa, ale trudna”), `prog/game/src/data/contracts-m1.ts` (tylko odczyt).
Nowe skrypty w `balans-sim/`: `wyprawa.py` (walki **grupowe** co do ticka: 2 żetony wręcz + 1 strzelec, Med-Patche w walce i między walkami, boss), `poziomy_grupy.py`, `budzet_v04.py`, `budzet_final.py`, `boss_trip.py`, `boss_ttk.py`, `odzysk_m2.py` (odzysk M2, skalibrowany do tabeli M2.5 Mechaników: 85/72/58% co do punktu), `progresja.py` (model agentowy pierwszych godzin).

**Zmiany względem moich wcześniejszych rekomendacji (sekcje 0–5):**

| Temat | Było (sekcje 0–5) | Teraz | Powód |
|---|---|---|---|
| `BOSS_HP` | 2400 przy odnowieniu 1200 ms [Z] | **2400** (bez zmian, wybrana jedna wartość z 2100–2400) | Wygrane walki trwają ~57–61 s przy 48 DPS i ~62–70 s przy 35 DPS. 2100–2250 daje ~53 s, czyli poniżej celu GD 60–90 s. |
| Odnowienie zamachu bossa | 1200 ms [Z] (zapowiedź 800–900 ms [P]) | **`BOSS_SWING_RECOVERY_MS` = 1200** | v0.4 wpisała 800 / 900 ms jako „Balans”, ale to nieporozumienie: 800–900 ms to była zapowiedź, a 1200 ms to moje założenie odnowienia. Przy 900 ms boss zadaje ~15 DPS surowych obrażeń. |
| Obrażenia bossa | 25–40 bez zmian | **20–32** (kontrpropozycja) | Wyprawa „na bossa” z przystanku g3: przeciętny gracz (50% uników, na bossie 60%) wygrywa w 27% prób przy 25–40, a w **47%** przy 20–32. Ma to być finał M1 do przejścia w 2–3 podejściach, a nie wyłącznie dla dobrych graczy. |
| Ponowne zestrojenie | — | **30 kr + 2 Copper** zamiast 40 kr | Wartość ta sama (~40 kr), ale daje widoczny postęp: Copper na ulepszenia. |
| Wrogowie kontraktu | brak reguły | **bez zrzutu łupu (0 Scrap, 0 przedmiotów)** | Bez tej reguły Clear the Path na g1 daje ~58 kr łupu za ~1 min (6 × (3 Scrap × 2 kr + 0,2 × 18 kr)), czyli razem ~80 kr/min ≫ 21. Zasada GD byłaby złamana. |
| Wagi kontraktów | jedna waga na typ | **waga osobno dla (typ, głębokość)**, domyślnie ×1, zestrojenie ×0,5 | Ustalenie z Mechanikami. Uwaga: `contracts-m1.ts` ma dziś jedno pole `weight: number` na typ (pytanie do PROG). |
| Zegar Zbieraczy (M2) | — | **50 / 45 / 40 s** (g1/g2/g3) | Daje średni odzysk 69 / 61 / 55% (6.5). Propozycja Mechaników 75 → 60 s na g1 daje 76%, czyli wciąż ponad 60–70%. |
| Clear the Path g1, Relay 40 kr, Data Core 40 kr + 3 Cu, Sell +50/+100 | moje: 40 kr + 1 patch; Relay 60; Data Core 90 + 30% | **zgoda na wartości Mechaników v0.4** | Spełniają obie zasady GD (6.3). |
| Sklep | tylko Med-Patch | **dodatkowo sprzęt r1–r2 za ×4 ceny sprzedaży** (`balans-m1.md` §4) | Model progresji pokazuje nadmiar kredytów po ~90 min (6.6). Potrzebne jest ujście kredytów i szybsza odbudowa po śmierci. |

### 6.1 Pełna utrata po śmierci: czy zejście głębiej się opłaca? (pytanie 1)
Dane: AT RISK ~170 kr po g1, ~580 kr po g2, 900–1300 kr na g3 [P, 2.1, zgodne z moim modelem: 169 / 582 / ~1360 przed limitem plecaka]. Założony sprzęt [Z]: ~200 kr (z g2), ~350 kr (z g3). Prawdopodobieństwo śmierci z `budzet_v04.py` (walki grupowe, limit 6 patchy, pancerz typowy, mnożniki v0.4):

| Decyzja | P(śmierć) 50% uników | EV 50% | P(śmierć) 70% uników | EV 70% |
|---|---|---|---|---|
| g1 → g2 bez powrotu | ~1–2% | 0,985 × 410 − 0,015 × 370 ≈ **+398 kr** | ~0% | **+410 kr** |
| g2 → g3 bez powrotu (po g1 + g2) | **~91%** | 0,09 × 520 − 0,91 × 930 ≈ **−800 kr** | ~11% | 0,89 × 520 − 0,11 × 930 ≈ **+360 kr** |
| g3 z przystanku (świeży, 6 patchy) | ~6–7% | 0,93 × 780 − 0,07 × 800 ≈ **+670 kr** | ~0% | **+780 kr** |

Wnioski:
- **EV zejścia jest dodatnie** wszędzie poza „g3 na wyczerpanym zapasie” u przeciętnego gracza. Dla niego to właściwa decyzja „wracaj”: liczby same ją wskazują (filar 1).
- **Ryzyko nie jest za karne:** przystanki windy (normalna ścieżka wg GD) sprowadzają ryzyko g3 do ~6%. Wcześniejsze 367 HP na g3 dotyczyło roboczych mnożników v0.2. Przy v0.4 model grupowy daje **82 / 187 / 287 HP na poziom** przy 50% uników (`poziomy_grupy.py`), a model 1v1 79 / 169 / 254. Grupy dokładają ~+10% na g2–g3, więc liczby Mechaników w 2.13 to faktycznie dolna granica.
- Koszt patchy (do 4 kupionych × 25 kr) to ≤ 13% EV zejścia.

### 6.2 Exploit „celowa śmierć = darmowe patche” (pytanie 2)
**Zamknięty w v0.4:** uzupełnienie Issue odbywa się przy każdym wyjeździe windą (2.3, 2.13), a Med-Patche są niesprzedawalne (2.12). Śmierć nie daje nic ponad zwykły wyjazd.
Pozostała drobnostka (OK, nie zmieniać): kontrakty krótkie zużywają darmowe 2 patche i dostają je z powrotem przy następnym wyjeździe. To zamierzone, bo jest to „pewna nagroda bez ryzyka”.

### 6.3 Kontrakty pod obie zasady GD (pytanie 3 + nowa zasada)
Punkt odniesienia: wyprawa brutto **21 / 52 / 97 kr/min** (g1/g2/g3), czyli łup poziomu ÷ ~8 min. Mechaniki przyjęli te same liczby. Patch liczony jako 25 kr, Copper jako 5 kr. Czasy to mediany z 2.4 [P]. Wrogowie kontraktu bez łupu [N].

| Kontrakt | Głęb. | Nagroda | Czas | kr/min | kr/min wyprawy | Powód atrakcyjności (nie kredyty) | Ocena |
|---|---|---|---|---|---|---|---|
| Restore Relay (1. rozwiązanie wariantu) | 1 / 2 / 3 | 40 kr + fragment sieci 10% | ~2 min | 20 | 21 / 52 / 97 | trwały postęp (sieć, przystanek windy, `M1_TERM_08` → Lights); zagadka pauzuje świat, niskie ryzyko | **zgoda** |
| Ponowne zestrojenie | 1 / 2 / 3 | 40 kr (v0.4) → **30 kr + 2 Cu** | ~2 min | 20 | 21 / 52 / 97 | v0.4: tylko „pewna mała nagroda”. Z Copperem dochodzi materiał na Lights i Beacon, czyli widoczny postęp | **kontrpropozycja** (wartość bez zmian) |
| Recover the Data Core | 2 | 40 kr + 3 Cu (~55 kr) | ~1,4 min | ~39 | 52 | materiał trudny do zdobycia: 3 Cu w ~1,4 min = ~2,1 Cu/min wobec ~1 Cu/min z wyprawy g2 (~8 Cu na 8 min) | **zgoda** |
| Clear the Path | 1 | 1 Med-Patch (~25 kr) | ~1,1 min | ~23 | 21 | pewna mała nagroda tuż przy szybie; patch to zasób na następną wyprawę; biegłość umiejętności | **zgoda** (+10% ponad próg mieści się w szumie oszacowania; warunek: wrogowie kontraktu bez łupu) |
| Clear the Path | 2 | 25 kr + 1 Med-Patch (~50 kr) | ~1,2 min | ~42 | 52 | j.w. | **zgoda** |
| Deliver N Units | baza | 20 Scrap / 8 Cu → 60 kr (premia +20) | 15–30 s | n/d (premia) | — | zero ryzyka, sesja mikro | **zgoda** |
| Sell One Item | baza | cena + 50 (r2) / +100 (r3) | ~15 s | n/d (premia) | — | zero ryzyka; pomaga zdecydować, co zatrzymać | **zgoda, z poprawką metody** (niżej) |

- **Sell One Item, metoda:** premię dzielimy przez średni czas zdobycia przedmiotu danej rzadkości na wyprawie. r2 na g1: 1,1 szt. na poziom, czyli ~7,3 min → +6,9 kr/min. r2 na g2: ~3,1 min → +16 kr/min. r3 na g3: ~1,1 szt. na poziom → +13,5 kr/min. Wszystko ≤ 21 / 52 / 97, więc zgoda. Wyjątek: premia za r2 na g1 to ~+30% dochodu wyprawy (50 / 169 kr), ale tablica Exchange ma 1 slot dzielony z Deliver, więc zdarza się co najwyżej raz na powrót. Akceptuję.
- **Copper vs Recovery Beacon:** 3 Cu z Data Core to 12% kosztu Beacona (25 Cu) i 20% kosztu Lights (15 Cu). Razem 40 Cu ≈ 5 poziomów g2/g3 albo ~13 kontraktów Data Core. To sensowne: Data Core przyspiesza Copper ~2×, ale go nie zastępuje.
- **Średnia z puli w modelu progresji:** kontrakty dają 22–28 kr/min ekwiwalentu (wliczając patche i Copper), czyli ≤ wyprawy na każdej głębokości.
- **Wagi per głębokość** (osobne pole na każdą parę typ × głębokość, bez dzielenia wagi typu): Relay g1 / g2 / g3 = 1 / 1 / 1, Data Core g2 = 1, Clear the Path g1 / g2 = 1 / 1, zestrojenie = 0,5 × waga Relay tej głębokości. Udział w puli przy wszystkich przystankach: każda para ~1/6. Na g3 jest tylko Relay lub zestrojenie (pytanie 3 w 6.7).

### 6.4 Wyprawa g1 150–190 kr (pytanie 4)
**Zgodne.** Mój model daje 115 kr (przedmioty) + 54 kr (Scrap) = **169 kr** brutto na poziom g1, a $ ze strefy (5–20 kr, rzadko) to górny kraniec. Na g1 przy 50% uników patche zwykle nie są potrzebne (82 HP straty < 100 HP + 2 darmowe), więc netto ≈ brutto.

### 6.5 Recovery Beacon (M2) i zegar Zbieraczy (pytanie 5)
- **Koszt 400 kr + 25 Cu:** ≈ 1 poziom g2 (413 kr) albo ~2,4 poziomu g1. Copper: ~3 poziomy g2/g3 (8 Cu na poziom) albo ~8 kontraktów Data Core, po wcześniejszych 15 Cu na Lights. W modelu progresji przeciętny gracz ma 24 Cu po 2 h i 59 Cu po 3 h, więc Beacon jest osiągalny po ~2,5 h.
- **Opłacalność:** zwraca się przy pierwszej śmierci na g2 (AT RISK ~580 + sprzęt ~200, odzysk ~61–72% ≈ 470–560 kr). Koszt jest więc umiarkowany, a próg „≥ 50% sektora” wystarczy jako bramka. **Zgoda na 400 kr + 25 Cu** (do ponownej oceny z ekonomią M2).
- **Zegar Zbieraczy** (`odzysk_m2.py`, założenia z M2.5, kalibracja 85 / 72 / 58% ✓):

| Zegar g1 | 75 s | 60 s | 55 s | **50 s** | 45 s | 40 s |
|---|---|---|---|---|---|---|
| Średni odzysk g1 | 86% | 76% | 73% | **69%** | 65% | 61% |

Propozycja Mechaników 60 s daje **76%**, czyli wciąż ponad celem. **Rekomendacja: 50 / 45 / 40 s** (g1/g2 z przystankiem/g3 z przystankiem), co daje **69 / 61 / 55%**. Odzysk maleje z głębokością (g1 > g2 > g3), a Z-GD1 jest zachowane (≥ 5% szans na 0% w każdym wariancie).

### 6.6 Budżet HP v0.4: weryfikacja „możliwa, ale trudna”
Model grupowy (`budzet_v04.py`, `budzet_final.py`, 1200 prób na wariant): limit 6 patchy, start z 6, leczenie 40, sprzęt docelowy DPS 26 / 35 / 48, DR 7 / 17 / 23%, mnożniki v0.4, BOSS_HP 2400. Na bossie unik +10 p.p. (dłuższe zapowiedzi) [Z].

| Scenariusz | Boss: obrażenia / odnowienie | 50% uników | 60% | 70% | 80% |
|---|---|---|---|---|---|
| g3 z przystanku, bez bossa | — | 94% | — | 100% | 100% |
| g3 z przystanku + boss w jednej wyprawie | 25–40 / 900 ms (v0.4) | 2% | — | 79% | 100% |
| j.w. | **20–32 / 1200 ms (rekomendacja)** | 7% | 44% | 92% | 100% |
| Wyprawa „na bossa” (przystanek g3 → ~3 spotkania → boss) | 25–40 / 900 ms | 18% | 64% | 95% | — |
| j.w. | **20–32 / 1200 ms** | **47%** | **87%** | 100% | — |
| **Pełna 1→3 + boss bez powrotu** | 25–40 / 900 ms | 0% | — | 30% | 96% |
| j.w. | **20–32 / 1200 ms** | **0%** | **3%** | **47%** | **96%** |
| Pełna 1→3 + boss, build „długiej wyprawy” (+60% leczenia, DR 30%) | 20–32 / 1200 ms | 6% | 45% | 91% | 100% |

- **Ocena:** pełna wyprawa jest „możliwa, ale trudna” zgodnie z intencją GD: dobry gracz ma ~50% (70% uników) do ~95% (80%), a przeciętny potrzebuje buildu i ~60% uników. Przystanki windy są normalną ścieżką: g3 z przystanku to 94% sukcesu nawet dla przeciętnego gracza.
- **Korekta tekstu Mechaników 2.13:** „przechodnia przy ok. 70% uników albo +60% leczenia” → **„przy ok. 75–80% uników, albo przy 70% razem z buildem +60% leczenia i DR ~30%”**. Przy 70% bez buildu sukces to ~30–47%, przy samym buildzie (50% uników) ~6%.
- **Korekta „g3 + boss z przystanku: na styk”:** dla przeciętnego gracza to nie „na styk”, tylko ~2–7% sukcesu. Normalna ścieżka to: poziom g3 w jednej wyprawie, boss w osobnej (wyprawa „na bossa”: 47% przy rekomendacji).
- Budżet Mechaników (472 HP) zakłada, że wszystkie ~3,3 patcha ze skrzyń da się podnieść. Przy limicie 6 część przepada, gdy plecak jest pełny patchy, więc realny budżet jest ~5–10% niższy. Dlatego zostawiam limit 6 i leczenie 40 (decyzja GD), a łagodzę bossa.

### 6.7 Nowe otwarte pytania
1. **PROG / Gameplay:** `contracts-m1.ts` ma `weight: number` na typ. Ustalenie mówi o wadze per (typ, głębokość), np. `weight: Partial<Record<Depth, number>>`. Kto zmienia?
2. **Mechaniki:** czy przyjmujecie odnowienie zamachu bossa 1200 ms (nieporozumienie w v0.4) i obrażenia 20–32?
3. **Mechaniki / GD:** na g3 jedyny kontrakt BASE to Relay lub zestrojenie. Czy dodać Clear the Path na g3 (np. 40 kr + 1 patch ≈ 65 kr / 1,3 min = 50 kr/min ≤ 97)? Bez niego tablica na samym g3 jest monotonna.
4. **GD:** wrogowie kontraktu bez łupu (warunek zasady kr/min). Akceptujesz?
5. **GD:** nadmiar kredytów po ~90 min (model progresji: mediana 1–2,5 tys. kr po 2–3 h u przeciętnego gracza, 4–9 tys. u dobrego), bo jedynymi wydatkami są Lights 200 kr i patche. Proponuję sprzedaż sprzętu w automacie (`balans-m1.md` §4) jako ujście kredytów w M1, a w M2 Beacon i kolejne ulepszenia.

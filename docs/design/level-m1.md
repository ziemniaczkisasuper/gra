# Level Design M1 – Sector 1: Ashfield Yards (DESIGN / Level Design)

> **Status: ZATWIERDZONE przez Game Directora (25.10.2026).** Odpowiedzi GD na pytania z §9 są w §10.

Status: **propozycja do akceptacji GD**. Wersja 1.0 (25.10.2026). Autor: DESIGN / Level Design.
Źródła: `mechaniki-m1.md` **v0.5.2** (napisane pod v0.5.1, różnice v0.5.2 naniesione), `balans-m1.md` v1.1, `level-design-m1.md` §3–4, `fabula/zakres-m1.md`, `fabula/teksty-m1-en.md`, `graf/styl-ascii.md`, `prog/ui-m1.md` §3.1, `prog/game/src` (rng, tilemap, collision, contracts).
Prototyp: `design/tools/levelgen_m1.py` (generator i test), `design/tools/fixed_maps_m1.py` (baza i arena), wyniki w `design/tools/wyniki-test-1000.txt`, przykłady w `design/tools/przyklad-*.txt`.

Oznaczenia: **[M]** wartość z Mechanik, **[B]** z Balansu, **[LD]** ustalenie LD przyjęte w Mechanikach, **[P-LD]** propozycja LD (nowa liczba, do akceptacji). Wszystkie odległości to **długość ścieżki BFS** (8 kierunków, koszt kroku 1, bez ścinania rogów jak `canStep`), chyba że napisano „Czebyszew”.

**Zgodność z Mechanikami i Balansem (różnice zaznaczone):**
- Szyb `<` jest nieprzechodni dla wrogów i drona (`SHAFT_ENEMY_PASSABLE=false`). Generator traktuje go jako ścianę i po wstawieniu sprawdza spójność mapy.
- Wrogowie nie odradzają się w trakcie poziomu (`ENEMY_RESPAWN_IN_LEVEL=false`). Nory w M1 są tylko miejscami startu przy generowaniu.
- Ponowne zestrojenie Restore Relay jest liczone osobno dla każdej głębokości (`RETUNE_SCOPE`). Nagroda **25 kr + 2 Cu** według Mechanik v0.5.2 i Balansu v1.1. Brief z 25.10 podawał 30 kr + 2 Cu, ale to wartość z v0.5, którą v0.5.2 zastąpiło. Na poziomy to nie wpływa.
- `REWARD_RELAY` = 35 kr [B]. Clear the Path jest też na głęb. 3 (GD: TAK), skład `sss`+`ddh` [B].
- Wrogowie kontraktów nie dają łupu (`CONTRACT_ENEMY_LOOT=0`). Po śmierci kontrakt wraca z postępem 0.
- R6 (v0.5.2): alarm w promieniu 12 przy przyjeździe windy. Strefa bez wrogów wokół szybu (10 pól) zostaje, więc alarm budzi grupy stojące 10–12 pól od szybu i grupy Clear the Path (12–20). Uważam to za zamierzone (patrz pytania).

---

## 1. Cel i tempo głębokości, krzywa trudności

Trudność zależy **tylko od pary (strefa, głębokość)**. Nie ma dynamicznej trudności: liczba śmierci, czas ani sprzęt gracza na nic nie wpływają (Z-GD2). Mnożniki HP i obrażeń wrogów są w Mechanikach (`DEPTH_HP_MULT`, `DEPTH_DMG_MULT`). LD ustala rozmiar mapy, liczbę wrogów i skład grup, odległości oraz stopień skomplikowania układu.

| Głęb. | Nazwa / motyw | Cel gracza | Rozmiar | Wrogowie [M] | Skład grup [B] | Czytelność układu | Marsz W→`<` / W→`>` (pomiar) |
|---|---|---|---|---|---|---|---|
| 1 | **Outskirts**: ulice, działki, domy | nauka, terminal 1/3 sieci, skrzynie przy drodze | 64×40 | 8–10 | `sss, dd, dd, h, h` | siatka ulic, pętle przez podwórka, 2–4 barykady | 5,6 s / 8,6 s |
| 2 | **Solar Fields**: rzędy paneli, budynki serwisowe | Data Core, Copper, notatka #46 | 72×44 | 12–14 | `ssss, dd, dd, h, ht, ht` | długie alejki, płot z „ugryzieniami”, więcej ślepych odnóg | 6,9 s / 9,4 s |
| 3 | **Rail Depot**: korytarze torowe, hale, biura | brama areny, Rail Guardian, najlepszy łup | 80×48 + arena 30×16 | 14–16 | `ssh, sst, ddh, ddt, ht, h` | 3 osie torowe, hale z wagonami (zasłony), łączniki | 7,8 s / 10,5 s |

Krzywa: g1 → g2 skok liczebności (+4) i pierwsze wieżyczki `t`; g2 → g3 mieszane grupy (osłona `h` dla `s`/`d`) i otwarte tory (dystans dla `t`). Budżet strat HP na poziom: 82 / 188 / 285 HP [B]. LD go nie zmienia, ustala tylko odstępy, w których gracz może się wycofać i podleczyć (patrz §3).

**Wejście na poziom:**
- Wyjazd z bazy → **wejście W głęb. 1** (Mechaniki 2.9).
- Przystanki windy na głęb. 2/3 → przy szybie `<` danej głębokości.
- Schodzenie `>` → wejście W następnej głębokości.
- Kontrakty na głęb. 1 zaczynają się więc od W (+5–10 s marszu).

---

## 2. Algorytm generowania

### 2.1 Ziarno i strumienie
- `expSeed` (ziarno wyprawy) jest losowane przy wyjeździe. Każdy poziom ma ziarno `streamSeed(expSeed, "lvl:s1:d{depth}:a{attempt}:{stream}")`, gdzie `stream` ∈ {`layout`, `objects`, `enemies`, `contracts`, `loot`}. Funkcje `streamSeed`, `Rng` (mulberry32) i `fmix32`/FNV-1a są z `core/rng.ts`. Port w Pythonie ma potwierdzoną zgodność z TS (wektory w §8).
- **Osobny strumień `contracts`**: obecność kontraktu nie zmienia układu, puli wrogów ani łupu.
- **Układ zależy tylko od ziarna.** Przydział treści zależy od ziarna i postępu fabularnego: który wariant terminala, które notatki, czy to Prolog. Liczba śmierci, czas ani sprzęt nie wchodzą do żadnego strumienia, więc Z-GD2 jest spełnione.
- Zawartość skrzyń losowana przy generowaniu (strumień `loot`) [P-LD]. Ta sama mapa = te same skrzynie, bit w bit.
- `GENERATOR_VERSION = 1`: zapisywany razem z ziarnem (w M2 potrzebny do `zoneSeed`).

### 2.2 Kroki (jedna próba)
1. **Układ** (strumień `layout`), generator motywu głębokości:
   - **g1 Outskirts:** ulice pionowe szer. 2 co 13–18 pól; poziome szer. 2 co 8–11 (Prolog: co 10–12); jedna ulica główna szer. 3 poniżej H/3. Bloki dzielone na 2 działki, gdy szerokość ≥ 15. Dom: wnętrze 4–8 × 3–6 (Prolog: min. 5×4), podwórko 1–2 od ulicy (`;` 30%). Drzwi `'` od ulicy; drugie drzwi z p = 0,35 ze ścieżką do innej ulicy (pętle). 2–4 barykady na bocznych ulicach (ślepe zaułki). Wraki aut 2×1 `#` na ulicy głównej (6%), gruz `,` (4%).
   - **g2 Solar Fields:** pole z marginesem 2 i 10–16 „ugryzień” płotu (głębokość 2–6, długość 6–14). 3–5 budynków (wnętrze 6–10 × 4–6, 1–2 drzwi). Drogi serwisowe szer. 2: pionowe co 16–22, poziome co 9–13. Rzędy paneli: 2 rzędy `#` / 2 rzędy alejki, segmenty 8–14 z przerwą 1. Roślinność `;` 8%, gruz `,` 2%.
   - **g3 Rail Depot:** 3 poziome korytarze torowe szer. 3 (środkowy rząd `=`). Między nimi hale (wnętrze 14–22 × 7–11, p = 0,4; tor `=`, wagon 6–9 `#`, filary co 5, 2 drzwi) oraz biura i magazyny 4–7 × 3–5 (1 drzwi, 30% na 2). 1–2 pionowe łączniki szer. 2 (pętle), 2–4 ślepe odnogi długości 4–7, gruz `,` 3%.
2. **Korekta % pól przechodnich:** cel 41–49%, widełki twarde 40–50% [LD]. Za mało → przebicie prostej ściany ≤ 12 pól z dala od pokoi. Za dużo → słupek `#` na polu z 8 przechodnimi sąsiadami.
3. **Wejście W** (strumień `objects`): pas 8 pól przy krawędzi (g3: zachodniej, g1/g2: losowej), poza pokojem, ≥ 5 przechodnich sąsiadów, **tylko w największej spójnej składowej**. Następnie BFS z W; pola nieosiągalne zamieniane na `#`; walidacja % pól przechodnich.
4. **Szyb `<`:**
   - warunki: BFS od W 25–40 / 30–50 / 35–55 [LD], poza pokojem, przy ścianie, nigdy w korytarzu szer. 1, ≥ 2 przechodnich sąsiadów (najpierw kandydaci z ≥ 3) [M v0.5.1];
   - próbne wstawienie `<` jako ściany, potem BFS: mapa musi zostać spójna, a odległość W→`<` nadal w widełkach (do 30 kandydatów);
   - dalsze odległości od W liczone już z `<` jako ścianą.
5. **Zejście `>` / brama areny:** W→`>` 40–60 / 45–65, brama 50–70 [LD], ≥ 20 od `<`, poza pokojem, przy ścianie.
6. **Terminal `&`:**
   - pokój z 1–2 drzwiami, pole przy ścianie, Czebyszew > 1 od drzwi, BFS od `<` 25–40 [LD];
   - **Prolog:** dodatkowo 45–60 od W [M 2.19]. Kolejni kandydaci (do `PROLOGUE_TERMINAL_TRIES`=15) są sprawdzani, aż zmieszczą się wstawki z §3.6.
7. **Nory** (2/3/3): wylot przy ścianie, ≥ 10 od W i `<`, ≥ 10 BFS i ≥ 7 Czebyszewa od `&`, ≥ 30 BFS między norami [LD].
8. **Obiekty kontraktów** (strumień `contracts`):
   - Data Core `§`: 30–45 od `<` [M], strażnicy `ddh` [P-LD] ≥ 12 od `<`;
   - Clear the Path: 6 wrogów w 2 grupach, 12–20 od `<` [M], kotwice ≥ 6 od siebie.
9. **Pula wrogów** (strumień `enemies`, §3.1).
10. **Skrzynie, notatki, kredyty, zwłoki #46** (§3.2–3.4).
11. **Walidacja** (§2.4). Niepowodzenie dowolnego kroku → próba `attempt+1` z nowymi strumieniami.

### 2.3 Parametry układu (wynik strojenia, 1000 ziaren)
| Parametr | g1 | g2 | g3 | Źródło |
|---|---|---|---|---|
| Pokoje (domy, budynki, hale + biura) | 10–16 domów | 3–5 budynków | 2–4 hale + 6–12 biur | P-LD |
| Szerokość korytarzy / ulic | 2 (główna 3) | 2 (alejki 2) | 3 (tory), łączniki 2 | P-LD |
| Pętle: alternatywna droga W→`>` po zablokowaniu najkrótszej | ≥ 95% poziomów | ≥ 75% | ≥ 85% | P-LD (pomiar §8) |
| Ślepe zaułki | 2–4 barykady | „ugryzienia” płotu i alejki | 2–4 odnogi | P-LD |
| Pola przechodnie | 40–50% | 40–50% | 40–50% | LD |

### 2.4 Walidacja i regeneracja
Poziom jest przyjęty, gdy:
- wszystkie pola przechodnie tworzą jedną składową, także po wstawieniu `<`;
- spełnione są wszystkie odległości z §3 (asercje w kodzie);
- pola przechodnie mieszczą się w 40–50%;
- liczby obiektów są dokładnie takie jak w tabelach;
- `<` ma ≥ 2 przechodnich sąsiadów;
- żaden wróg nie widzi W ani `<` z ≤ 8 pól (Czebyszew, Bresenham) [P-LD].

Przy niepowodzeniu: kolejna próba, maksymalnie `LEVEL_GEN_MAX_ATTEMPTS`=20 [P-LD]. Po 20 nieudanych próbach używana jest **ręczna mapa awaryjna** danej głębokości (PROG: 1 na głębokość, ze stałymi obiektami). W teście 1000 ziaren mapa awaryjna nie była potrzebna (§8).

---

## 3. Rozmieszczenie

### 3.1 Wrogowie
- **Liczba:** 8–10 / 12–14 / 14–16 [M], losowana ze strumienia `enemies`. Skład grup według szablonu Balansu, korekta ±1 [P-LD]:
  - g1: liczba `s` w pierwszej grupie 2–4;
  - g2: 12 → `sss`, 14 → `sss`+`ss`;
  - g3: 14 → `ssh`→`sh`, 16 → `h`→`sh`.
- **Kotwice grup:** grupy z `s` stoją przy norach (Scrappery „wychodzą” z nor). Pozostałe grupy losowo; domy mają wagę 0,3, a `t` woli otwarte pola (tory, alejki). Członkowie grupy w promieniu 2 od kotwicy.
- **Odległości:**
  - ≥ 10 od W i `<` [LD];
  - ≥ 8 BFS i ≥ 5 Czebyszewa od `&` (`TERMINAL_MIN_CHEB`, [P-LD]: nie stoją tuż za cienką ścianą);
  - kotwice grup ≥ 10 od siebie [P-LD];
  - brak linii wzroku do W i `<` z ≤ 8 pól [P-LD].
- **Patrole:** brak w M1. Wrogowie błądzą w promieniu `ENEMY_WANDER_RADIUS` [M] od pola startu.
- **Odradzanie:** brak [M v0.5]. Liczba wrogów na poziomie nigdy nie rośnie (poza przywołaniem bossa).

### 3.2 Łup i skrzynie
- Skrzynie `■`: 3 / 4 / 4 [B]. Najpierw w pokojach (przy ścianie), ≥ 10 od W [P-LD], ≥ 12 między sobą [P-LD], Czebyszew > 3 od `&`.
- Zawartość według Balansu: ok. 30% Med-Patch, Copper 1–3 od głęb. 2, przedmioty według `DEPTH_RARITY_ODDS`. LD nie zmienia liczb. Przedmioty na poziom: ~6,3 / 8,6 / 9,0 [B], razem z `ENEMY_ITEM_DROP` 0,20.
- Kredyty `$` na ziemi: 1 / 1–2 / 1–2 stosy [P-LD] (Mechaniki: „rzadkie, 5–20 kr”), ≥ 10 od W.

### 3.3 Notatki i zwłoki #46
- Glif `?` [P-LD, pytanie do GRAF]. Liczba: 2 / 1–2 / 2 [P-LD]. Leżą w pokojach, ≥ 10 od siebie.
- Przydział treści: najpierw nieprzeczytane z puli głębokości (g1 `M1_NOTE_01`–`04`, g2 `05`–`06`, g3 `07`–`09`). Gdy wszystkie przeczytane, losowo z puli.
- **Zwłoki #46** `%` (`M1_NOTE_46_TITLE` / `_BODY`) leżą na **każdym** poziomie głęb. 2: poza pokojem („between the panels”), 25–60 od W, ≥ 10 od `<`.
- Innych zwłok jako dekoracji nie ma, są dopiero w M2 [M].

### 3.4 Terminale, nory, szyb, zejście
| Obiekt | Liczba | Reguły | Źródło |
|---|---|---|---|
| Terminal `&` | 1 | warianty g1: 04, 07, 08 / g2: 01, 02, 05 / g3: 03, 06; kolejność 04<07<08, 05<01<02, 06<03; dostaje pierwszy nierozwiązany wariant. Po wyczerpaniu wariantów głębokości: ponowne zestrojenie (szablon deterministycznie z ziarna). Pokój z 1–2 wejściami, 25–40 od `<`, wrogowie ≥ 8 | LD, M 2.4 |
| Nora | 2 / 3 / 3 | ≥ 30 między sobą, ≥ 10 od W i `<`; w M1 niewidoczna, tylko miejsce startu grup `s` | LD |
| Szyb `<` | 1 | 25–40 / 30–50 / 35–55 od W; nieprzechodni dla wrogów i drona; ≥ 2 przechodnich sąsiadów (cel 3); nie w korytarzu szer. 1; mapa spójna po wstawieniu | LD, M v0.5.1 |
| Zejście `>` | 1 (g1, g2) | 40–60 / 45–65 od W, ≥ 20 od `<` | LD |
| Brama areny | 1 (g3) | 50–70 od W, ≥ 20 od `<`; przejście na stałą mapę areny (§5), z potwierdzeniem `M1_RISK_01B` | LD, M v0.5.2 |

**Walidacja pod M2** (`M2_BURROW_COVERAGE_CHECK`, w M1 = false): każde pole przechodnie ma norę ≥ 20 pól (`SCRAPPER_BURROW_MIN_DIST`). W M1 tylko mierzymy odsetek (§8). W M2 przy fladze = true pokrycie < 100% oznacza regenerację.

### 3.5 Kontrakty na mapie
| Kontrakt | Głęb. | Co stawia generator | Skład wrogów |
|---|---|---|---|
| Restore Relay | wg wariantów | nic poza terminalem (jest zawsze) | — |
| Recover the Data Core | 2 | `§` 30–45 od `<` [M], 3 strażników ≥ 12 od `<` | `ddh` [P-LD] |
| Clear the Path | 1 / 2 / 3 | 2 grupy po 3, 12–20 od `<` [M] | g1 `sss`+`ddh` [B], g2 `sss`+`dht` [B v1.2], g3 `sss`+`ddh` [B, GD] |

Wrogowie kontraktów są **ponad** pulą 8–10 / 12–14 / 14–16, bez łupu. Kontrakty BASE nie zmieniają mapy. Kontrakty strefowe pojawiają się tylko na głębokościach z przystankiem windy (`CONTRACT_DEPTHS`).

### 3.6 Prolog (Mechaniki 2.19, kroki T01–T13)
Zwykły poziom głęb. 1 (ten sam algorytm; układ ma więcej domów ≥ 5×5) ze stałym terminalem **04** i wstawkami na trasie W→`&` (najkrótsza ścieżka BFS):

| Wstawka | Reguła | Krok |
|---|---|---|
| Samotny `s` | 12–18 od W, ≤ 2 Czebyszewa od trasy | T03 |
| `h` w pokoju ≥ 5×5 | pokój z 1–2 drzwiami, drzwi ≤ 8 od trasy [P-LD], Guard 20–30 od W, 2–3 Czebyszewa od drzwi | T04 |
| Skrzynia „za Guardem” | Med-Patch + 1 przedmiot r1 (gwarantowane); dW ≥ dW(Guard)+2; **test blokady:** po zablokowaniu pól w promieniu 2 (Czebyszew) od Guarda skrzynia jest nieosiągalna z W, czyli nie da się jej zabrać, nie przechodząc obok Guarda | T04–T05 |
| Para `ss` | 30–40 od W, ≥ 8 od `&` [M v0.5.1] | T06 |
| Terminal 04 | 45–60 od W, 25–40 od `<` | T08 |
| Szyb `<` | 25–40 od W | T10 |

- Wstawki należą do puli 8–10. Reszta puli: 8 → `dd, dd`; 9 → `dd, dd, h`; 10 → `dd, dd, sh` [P-LD]. Zwykłe grupy stoją ≥ 6 od trasy (`PROLOGUE_ROUTE_CLEAR`), żeby nie mieszały się z lekcjami.
- W bazie `@` startuje przy Reprint Vat, winda 7 pól dalej (T01, §4).

---

## 4. Baza (stała mapa)

Mały ekran ASCII bez wrogów i bez ticków walki (Mechaniki 2.14a, UI §3.1). Gracz chodzi po nim, a pasek skrótów (EXCHANGE / LOCKER / GEAR / ORDERS / LIFT) daje dostęp bez chodzenia. Rozmiar 29×10 mieści się w minimalnym widoku 31×17.

```
#############################
#--------->-----------------#
#.......A.....&.......$.....#
#.Ω.........................#
#.@.........................#
#...........................#
##########----'----##########
##########.........##########
##########...≡.....##########
#############################
```
| Znak | Obiekt | Uwagi |
|---|---|---|
| `Ω` (2,3) | Reprint Vat | wydruk po śmierci i w Prologu (T01); tu też **Issue**: wydanie Issue Baton / Suit [M]; automatyczne uzupełnienie Med-Patchy (`ISSUE_MEDPATCH_TOPUP` 2/3) przy wyjeździe [M] |
| `@` (2,4) | start | pole wydruku, Prolog T01 |
| `>` (10,1) | winda | w ścianie z kablem; USE z pola (9..11, 2); **ścieżka `@`→winda = 7** (wymóg 6–8, T01, sprawdzone skryptem) |
| `A` (8,2) | przyjazd po ewakuacji | 5 pól od Vat |
| `&` (14,2) | terminal BASE (kontrakty) | 11 pól od `@` |
| `$` (22,2) | Exchange (automat, półka 3 przedmiotów) | 19 pól od `@` |
| `≡` (13,8) | skrytka (Hunter Locker), `M1_ITEM_LOCKER` | w schowku za przejściem `'` |
| `-` | ściana z kablem | **Lights Above the Base** (`M1_BASE_08`, Lights I: 200 kr + 15 Cu po `M1_TERM_08`): kabel w rzędzie 1 i w ścianie schowka zmienia kolor na żółty. Lights II/III [B, propozycja] mogą zapalać kolejne odcinki (pytanie do GD/GRAF) |

Wszystkie obiekty są solidne; USE z sąsiedniego pola. Opis miejsca: `M1_LOC_BASE`.

---

## 5. Arena Rail Guardiana (stała mapa)

30×16 (wnętrze 28×14, zgodnie z „ok. 28×14” w Mechanikach), mieści się w całości w widoku poziomym 31×17. 393 pola przechodnie, spójna (sprawdzone skryptem).

```
##############################
#............................#
#...,....................,...#
#============================#
#============================#
#............................#
#............................#
G@..................B........X
#............................#
#............................#
#............................#
#============================#
#============================#
#...,....................,...#
#............................#
##############################
```
- `G` – brama (powrót do Rail Depot), `@` – wejście gracza, `B` – lewy górny róg bossa 3×2 (`/R\` + `[=]`), `X` – ukryty szyb (ściana; po walce `<`).
- Tory `=` w rzędach 3–4 i 11–12 to dwa tory [LD]. Ściany na końcach torów to miejsca, w które boss uderza po szarży.
- **Faza 1 (100–50% HP):**
  - zamach 800/1200 ms, obrażenia 20–32 [M/B];
  - co 4. atak szarża: zapowiedź całego pasa 900 ms (pas świeci stale, S14), 2 ticki na pole, ≤ 2,8 s na długości toru;
  - pas szarży: 2 pola przy szarży poziomej, 3 pola przy pionowej;
  - uderzenie w ścianę → 2 s ogłuszenia, odsłonięty `R` (obrażenia ×2);
  - trafienie raz za 20–32, gdy bryła wjedzie na pole gracza.
- **Faza 2 (≤ 50% HP):** po rozstrzygnięciu bieżącego ataku przywołanie (600 ms, boss podatny). 2 Panel Drone na wolnych polach w promieniu 3 od bossa, ≥ 4 BFS od gracza, poza pasem toru; mnożniki g3, bez łupu, aktywacja 500 ms [M]. Arena nie ma stałych włazów dronów (v0.5 zastąpiła ich wersję z v0.4).
- **Po walce:** `X` zmienia się w `<` (ewakuacja, `M1_LOC_EVAC`), `M1_BOSS_DEFEAT`.
- Wycofanie przez `G` w trakcie walki [P-LD]: boss wraca do pełnego HP, drony znikają, brama zostaje otwarta (pytanie do GD).
- Gracz nie zaczyna na torze. Szarża z pola B (rząd 7–8) w pionie przecina pas 3 pól. Wybór kierunku i pasa szarży: patrz pytania.

---

## 6. Przykładowe mapy (ziarno 47, glify `styl-ascii.md`)

Znaczniki debug: `O` = nora (w grze niewidoczna), `G` = brama areny, `?` = notatka (glif propozycja), `@` = wejście W. Pełne pliki: `tools/przyklad-d1.txt`, `-d2.txt` (z Data Core i Clear the Path), `-d3.txt`, `-prolog.txt`.

**Głęb. 1 Outskirts, bez kontraktów** (W→`<` 33, W→`>` 40, `<`→`&` 31, pola przechodnie 46,5%):
```
################################################################
##############..################..#################..###########
#####........#..O#....##########..###sss.####....##..###########
#####........#.,##....##########..###s...####....##..#...■...###
#####........#..##....####....##..###....####....##..#.......###
#####.?......#..##....####....##..###....####....##..#.......###
#####........#..##....####....##..###....####....##..#.......###
#####........#d.##....####....##..#####'O####....##..#.......###
######'#######d.###'#########'##..##....;;#####'###..#'#########
####;;.;;.;;....#..;;..##;;;...#..##;;;.;.##..;...#...;;;.;.;.##
#...@...........,......,..h...................,...........,....#
#...........,,....,.........................................,..#
#...;.;.;.####..#############.##..#########..$;;..;..###########
#;.;;.;...####..#############.##..#########....;;....###########
#######'######..#############'##..#.....######'####..####.....##
##.......#####.,###########....#..#.....####......#..####.....##
##.......#####..###########....#..#.....####......#..####■....##
##.......#####..#...■######....#..#.....####......#..####.....##
##.......#####,.#....######....#d.#.....####......#..####.....##
##.......#####..#....######....#.d#.....########'##..####.....##
##############..##'#########'###..###'##########.##..########'##
##############...;;.;.####;;.......;.;;..#######.##.,###......;#
##############...;.;..####...;.;....;;;..#######.##..###.;.;..;#
#....,.....h...##.,...##.........##.......,.##..##,,.##........#
#,........................,....................................#
#...................................................,..........#
####..;;.;...#...;;;.;..#..;......;...;;..;#.;;.........;;.#####
#######'######..;......;#;.....;...;..;...;####'###..###'#######
#####.......##..###'########'###..#'#########.....#..#....######
#####.......##..#......###.....#..#.......###.....#..#....######
#####.......##..#......###.....#>.#.......###.....#..#....######
#####.......##..#......###.....#..#&.?....###.....#..#....######
#####.......##..#......###.....#..#.......###.....####....######
##############..################..###########.....####....######
##############.<################..##############################
##############..################..##############################
##############..################..##############################
##############..################..##############################
##############..################..##############################
################################################################
```

**Prolog** (próba 2; `s` 17, `h` 23, skrzynia za Guardem 26, para `ss` 40, terminal 04 59 od W, para→`&` 20; Guard `h` w domu 5×5 w prawej górnej części mapy, skrzynia `■` w jego głębi):
```
################################################################
##############..#################..##################..#########
##############..#################..##.....##########O..#########
##############d.###########.....#..##.....###########..#########
##.......?####d.###########.....#..##.....#####■....#..##.....##
##........####..##......###.....#..##.....#####.....#..##.....##
##........####..##.....&###.....#..##.....#####.....#..##.....##
##........####..##......###.....#.,O#.....#####.....#..##.....##
#########'####..##......######'##..##'#########...h.#..######'##
#.;;;..;...###..##'#######;...;s..,#;...;;.########'#..#....;..#
#..#..;....###..#.;.;....#;.;.;s#..#.;;;;.;###....;;...#.....;;#
#......#.............#......#........#..#.......#..#.#......#..#
#.,..#.....#......................................,............#
###.;.;#;#;..#..#################..##################s.#####.###
###..;..;....#..#################..##################..#####.###
####'#########..#####################################,.#####'###
####........##..##########......#.,############.....#..##.....##
####........##..#..■...###......#..############.....#..##.....##
####........##..#......###......#..############.....#,.##.....##
####........##..#......###......#..#.......####.....#..##.....##
####........##..#......###......#..#.......####.....#..##.....##
#######'######..#......###......#..#.......####.....#..##.....##
#######.######..###'######'######..#.......####'#####..######@##
#######.######....;...;;#...;...;..####'######;..;;....#;.;.;;.#
#######.######.#.;.;;.;;#.#.<#;.;..;;;;....;##;...#;;#.#;.;.#..#
#.......>........,.##..........#....#..#..#.................,,.#
#..#.........#...#........#.#.......................#..#,.#.#..#
#........#...........#..........#..#.#..#......#,#.............#
####;#.....#;#..;......###.#.#;......;....##.;.;...##..#..#....#
####...;;..;....#'########...;.;...#'#######;...;.;##..........#
#####'########..#.....######'####..#.....########'###..###'#####
#####........#..#.....#####.....#..#.....####.....###..#......##
#####........#..#.....#####.....####....■####.....###,.#......##
#####........#..#.....#####.....####.....####.....###$.#......##
#####........#..#.....#####.....####.....####.....###..#......##
#####........#..###########.....#############.....###d,#########
#####........#.,###########.....#############...?.###d.#########
##############..#####################################..#########
##############..#####################################..#########
################################################################
```

**Głęb. 2 Solar Fields, Data Core + Clear the Path** (`§` + 3 strażników = Data Core; 2 grupy 12–20 od `<` = Clear the Path; `%` = zwłoki #46):
```
########################################################################
########################################################################
##..;.........................................;.################......##
##.......,.............;..........;......,......################......##
##.###########.###..#########.############..#######################.#.##
##.#############.#..#########.############..##############........'.####
##......$.....;...,.....;.......;;....;..........#########........######
##..;........;........,..;.;,,..,..;.....................#........######
##.#####O###;#####..######.##############...##########.#.#.ddh....######
##.#########d#####;.######h###########.###..#######;####.#..§..h..######
##..;......;d..............td.;.....$......;..........;..#........######
##....,...;..;####'######..;...........;...;...,;...;....######'########
##.#########..#.........#.########.#######,.##########.#.........#######
##.##########>#.........#..#############.#..##########.########.########
##..;........;#.?...t...#..............;......sss.........,......#######
##...;........#......h.■#........##'#####.....................;..#######
##.##########.#.........#;##.###;#...■..#..;#######.##########;#########
##.##########.#.........#.#;####.#......#...########.##########.########
########......###########.......;#......#..........................#####
########.........;..............;'......#........;.......######'########
###############.##..##########.#,########..;#.#########..#.......&######
################;#..########.###..<.........############.#■.......######
########;.................;.........;...;..,.............'........######
########..........,.................,....................#........######
###############.##..######.#########.#####.,##.#########.#........######
###############.##%.####.###########.#####..#####.######.###############
########;..........................;...;....;...........;..,..t...######
########ss........;..;.........;....,.........d.;....;.........h..######
#######Os............;;............;...;...;...d.;...;............######
#############;####..######.#############.#..######.#############.#######
########.....,...........................;.....;..;...............######
########..........############.............,..;.......;.......,...######
##.############.#.#...■......#.######.####..#####.#############.#####.##
##;#########.####;'..........#.###.#######..#####.##########.########.##
##....;;....,.....#..........#..............;.,.......,....;...;....;.##
##...........;....#..........#..................................,,.;..##
##.############.#.#..........#.###########..#########.#############.#.##
##.##############.#..........#.###########;.###########.############s;##
##.........###########'#######..;........;......;...;....;...........sO#
##...;...;.########......;...........########.......;..@..........;...##
##.################.##.#############.###########.#########.##########.##
##.........########..................########.............;...;.....;.##
########################################################################
########################################################################
```

**Głęb. 3 Rail Depot** (W→`<` 55, W→brama 67, `<`→`&` 39):
```
################################################################################
################################################################################
###....####....##.■..##......####.....##......###....###......##......##########
###....####....##....##...,..####.....##......###....###......##......##########
###....####....##....##......####.....##......###....###......##....,.##########
###'##########'###'#######'##########'######'######'####.####'######'###########
###.##########.###.#######.##########.######.######.####.####.######.###########
###..........................................................,dt..............##
###===============st===========================================d==============##
###................s..............................G...........................##
#####.##########.##O######################.#################.##..###.###########
#####'##########'#########################'#################.##..###,###########
####..,..###,..............,......###.................######.##..###.###########
####.....###..#....#....#....#....###..#,...#....#....######.##..###'###########
####.....###...,....,.............###.,...............######'##.......##########
####.....###==========########====###=======#########=###,....#....,..##########
#####'######...,..................###.................###.....#.......##########
#####.######..#....#....#....#....###..#....#....#....###,....#.......##########
#####.######......................###.................#########.......##########
#####.######'##########################'#######################..###############
#####.######.##########################.#######################..###############
##..........................................,..........................ddh...###
##======================$====h===============================================###
##........,...................s........,,....................................###
#######..##############...####O##################.##############.###############
#######..##############'..#######################'##############.###############
#######..##....,................###.,.........,...##############.###############
###,.....##..#....#....#....#...###..#....#■...#..##############'###############
###......##.....................###...............###..........,......##########
###......##.,.....,.............###====#########==###..#..,.#.,..#,...##########
###......##==========###..##====###........?......###............,....##########
#######..##.............$....t..###..#....#....#..###==#########======##########
#######..##...................h.###...............###...,............,###.######
#######..##..#....#....#....#...############'########..#....#....#....###.######
#######..##....................,############.########.................###.######
#######..###############.,##################.########################'###.######
#######..###############..############O#####.########################.###.######
###................,..,..............ssh.,....................................##
###===========================================================================##
###.@...........,..................,.................,.....<..................##
###.######.########.#######.###########.#####.#####.###.##########.#############
###'######'########'#######'###########'#####'#####'###'##########'#############
##.,..####....####....####.......##.....##....##.....##....####,...?.###########
##....####....####....####.......##.....##....##....■##....####■.....###########
##....####....####....####.......##.....##,...##.....##....####......###########
##################....####.....&.###############.....##....#####################
################################################################################
################################################################################
```

---

## 7. Parametry do strojenia

| Parametr | Wartość | Jedn. | Źródło |
|---|---|---|---|
| `LEVEL_SIZE` | 64×40 / 72×44 / 80×48 | pola | LD |
| `PASSABLE_PCT` | 40–50 (korekta celuje w 41–49) | % | LD / P-LD |
| `PASSABLE_TUNE_MAX_RUN` | 12 | pola | P-LD |
| `DEPTH_ENEMY_COUNT` | 8–10 / 12–14 / 14–16 | szt. | M |
| `ENEMY_GROUP_TEMPLATE` | g1 `sss,dd,dd,h,h`; g2 `ssss,dd,dd,h,ht,ht`; g3 `ssh,sst,ddh,ddt,ht,h` | — | B |
| `GROUP_MIN_SPACING` | 10 | BFS | P-LD |
| `NO_ENEMY_RADIUS_ENTRY_SHAFT` | 10 | BFS | LD |
| `ENTRY_LOS_SAFE` | 8 | Czebyszew | P-LD |
| `SHAFT_DIST_FROM_ENTRY` | 25–40 / 30–50 / 35–55 | BFS | LD |
| `SHAFT_MIN_PASSABLE_NEIGHBORS` / `_PREF_` | 2 / 3 | szt. | M v0.5.1 |
| `SHAFT_ENEMY_PASSABLE` | false | — | M |
| `STAIRS_DIST_FROM_ENTRY` | 40–60 / 45–65 | BFS | LD |
| `ARENA_GATE_DIST_FROM_ENTRY` | 50–70 | BFS | LD |
| `STAIRS_GATE_MIN_DIST_FROM_SHAFT` | 20 | BFS | LD |
| `TERMINALS_PER_LEVEL` | 1 | szt. | LD |
| `TERMINAL_DIST_FROM_SHAFT` | 25–40 | BFS | LD |
| `TERMINAL_NO_ENEMY_RADIUS` | 8 | BFS | LD |
| `TERMINAL_MIN_CHEB` | 5 | Czebyszew | P-LD |
| `BURROWS_PER_LEVEL` | 2 / 3 / 3 | szt. | LD |
| `BURROW_MIN_SPACING` | 30 | BFS | LD |
| `BURROW_MIN_DIST_ENTRY_SHAFT` | 10 | BFS | LD |
| `M2_BURROW_COVERAGE_CHECK` / `SCRAPPER_BURROW_MIN_DIST` | false / 20 | — / BFS | LD (M2) |
| `CHESTS_PER_LEVEL` | 3 / 4 / 4 | szt. | B |
| `CHEST_MIN_SPACING` / `CHEST_MIN_DIST_ENTRY` | 12 / 10 | BFS | P-LD |
| `NOTES_PER_LEVEL` | 2 / 1–2 / 2 | szt. | P-LD |
| `NOTE_MIN_SPACING` | 10 | BFS | P-LD |
| `CREDIT_PILES_PER_LEVEL` | 1 / 1–2 / 1–2 | szt. | P-LD |
| `BODY46_DIST_FROM_ENTRY` | 25–60 (≥ 10 od `<`) | BFS | P-LD |
| `CLEARPATH_ENEMY_DIST` | 12–20 | BFS | M |
| `CLEARPATH_GROUPS` | g1 `sss`+`ddh`, g2 `sss`+`dht`, g3 `sss`+`ddh` | — | B (g2: v1.2) |
| `DATACORE_DIST` | 30–45 | BFS | M |
| `DATACORE_GUARDS` | `ddh` | — | P-LD |
| `PROLOGUE_TERMINAL_DIST_FROM_ENTRY` | 45–60 | BFS | M 2.19 |
| `PROLOGUE_SCRAPPER_DIST` / `_GUARD_DIST` / `_PAIR_DIST` | 12–18 / 20–30 / 30–40 | BFS | M 2.19 |
| `PROLOGUE_PAIR_MIN_DIST_TERMINAL` | 8 | BFS | M v0.5.1 |
| `PROLOGUE_GUARD_ROOM_MIN` | 5×5 | pola | M 2.19 |
| `PROLOGUE_GUARD_ROOM_FROM_ROUTE` | 8 | BFS | P-LD |
| `PROLOGUE_GUARD_BLOCK_RADIUS` | 2 | Czebyszew | P-LD (test „za Guardem”) |
| `PROLOGUE_NEAR_ROUTE` / `_ROUTE_CLEAR` | 2 / 6 | Czeb. / BFS | P-LD |
| `PROLOGUE_TERMINAL_TRIES` | 15 | szt. | P-LD |
| `PROLOGUE_HOUSE_MIN` / ulice poziome | 5×4 / co 10–12 | pola | P-LD |
| `LEVEL_GEN_MAX_ATTEMPTS` | 20 (+ mapa awaryjna) | szt. | P-LD |
| `GENERATOR_VERSION` | 1 | — | LD |
| `ARENA_M1_SIZE` | 30×16 (wnętrze 28×14) | pola | LD |
| `BASE_LIFT_DIST_FROM_PRINT` | 7 (wymóg 6–8) | BFS | M T01 / LD |

---

## 8. Kryteria akceptacji QA

1. **Skuteczność:** 1000 ziaren na wariant (g1, g1 Prolog, g1+CtP, g2, g2+Data Core+CtP, g3, g3+CtP), 100% poziomów przechodzi walidację w ≤ 20 próbach. Mapa awaryjna istnieje i przechodzi te same asercje.
2. **Determinizm:** to samo `expSeed` + postęp daje identyczną mapę, obiekty i zawartość skrzyń. Wektory zgodności (Python ↔ TS, sprawdzone Vitestem):
   - `streamSeed(1,'lvl:s1:d1:a0:layout') = 0x82d8d768`, pierwsze `next()` = 0.996280133, 0.843829107, 0.161608928;
   - `streamSeed(0x47a11e,'world') = 0x4a3f2ad1`;
   - `Rng(1)` → 0.627073941, 0.002735721, 0.52744704.
3. **Z-GD2:** ten sam zapis z 0 i z 50 śmierciami daje bit w bit ten sam poziom.
4. **Odległości:** każda reguła z §3 sprawdzona BFS-em (testy jednostkowe na 1000 ziaren), w tym Prolog (wstawki, test blokady skrzyni, para ≥ 8 od `&`).
5. **Szyb:** ≥ 2 przechodnich sąsiadów, nie w korytarzu szer. 1, mapa spójna z `<` jako ścianą; wróg i dron nigdy nie wchodzą na `<` (test w grze).
6. **Liczby:** wrogowie, skrzynie, nory, notatki, terminal dokładnie według tabel. Brak dekoracyjnych zwłok poza #46. Liczba wrogów nie rośnie w trakcie poziomu.
7. **Pola przechodnie:** 40–50% na każdym poziomie.
8. **Tempo** (5,75 pola/s): średni marsz W→`<` 5–8 s, W→`>`/brama 8–11 s, zgodnie z budżetem 2.2/2.9.
9. **Wydajność [P-LD]:** generowanie ≤ 100 ms p95 na średnim telefonie (mieści się w `LIFT_RIDE_MS` 2000). Python: ~60 ms na próbę, TS powinien być szybszy.
10. **Baza i arena:** spójne; winda 6–8 pól od `@`; arena mieści się w widoku 31×17.

### 8.1 Wyniki prototypu
Test 1000 ziaren na wariant (`python3 levelgen_m1.py --test 1000`, pełny wynik w `tools/wyniki-test-1000.txt`). **100% poziomów przeszło walidację we wszystkich 7 wariantach, mapa awaryjna nie była potrzebna ani razu.**

| Wariant | Próby śr. / p95 / max | W→`<` | W→`>` / brama | `<`→`&` | Najdalsze | Przechodnie | Pętla | Szyb: sąsiedzi (≥ 3) | Pokrycie norą ≥ 20 (M2): śr. / 100% |
|---|---|---|---|---|---|---|---|---|---|
| g1 | 1,18 / 2 / 4 | 32,2 [25–40] | 49,3 [40–60] | 32,1 | 65,5 | 43,7% | 98% | 5,1 (100%) | 99,0% / 56% |
| g1 Prolog | 1,69 / 4 / 8 | 32,1 | 49,4 | 32,4 | 67,1 | 46,7% | 98% | 5,2 (100%) | 99,1% / 53% |
| g1 + CtP | 1,18 / 2 / 4 | j.w. | j.w. | j.w. | j.w. | j.w. | 98% | 5,2 (100%) | j.w. |
| g2 | 1,12 / 2 / 6 | 39,7 [30–50] | 54,2 [45–65] | 32,6 | 79,6 | 47,0% | 80% | 5,3 (100%) | 100% / 99% |
| g2 + DC + CtP | 1,12 / 2 / 6 | j.w. | j.w. | j.w. | j.w. | j.w. | 80% | 5,3 (100%) | j.w. |
| g3 | 1,07 / 2 / 3 | 45,0 [35–55] | 60,6 [50–70] | 32,9 | 90,5 | 45,0% | 98% | 5,2 (100%) | 100% / 99% |
| g3 + CtP | 1,07 / 2 / 3 | j.w. | j.w. | j.w. | j.w. | j.w. | 98% | 5,2 (100%) | j.w. |

- **Prolog (1000 ziaren):** `s` 14,9 [12–18], `h` 25,2 [20–30], skrzynia za Guardem 28,5 [22–37], para `ss` 35,4 [30–40], terminal 04 52,0 [45–60], para→`&` 16,8 [8–43]. Test blokady przechodzi w 100%.
- Kontrakty nie zmieniają układu ani puli (osobny strumień); zmienia się tylko średnia W→skrzynia o ±0,6.
- Średni marsz (5,75 pola/s): W→`<` 5,6 / 6,9 / 7,8 s, W→`>`/brama 8,6 / 9,4 / 10,5 s.
- Pokrycie norą (M2) na g1 to 56% poziomów ze 100% pokrycia (średnio 99%). Przy włączeniu flagi w M2 g1 będzie potrzebować więcej prób albo 3 nor. To decyzja na M2.
- Czas: Python ok. 60 ms na próbę. Najgorszy przypadek (Prolog, 8 prób) to ok. 0,5 s w Pythonie, więc w TS trzeba to zmierzyć na telefonie (kryterium 9).
- Baza: `@`→winda 7, Vat→przyjazd `A` 5, wszystkie obiekty osiągalne. Arena: 393 pola, spójna.

---

## 9. Otwarte pytania

**GD / Mechaniki**
1. Wycofanie przez bramę areny w trakcie walki: reset bossa (pełne HP, drony znikają), brama otwarta [P-LD]. Zgoda? Czy brama ma się zamykać na czas walki?
2. Szarża bossa: z jakiego miejsca i w którym kierunku (wzdłuż toru czy w stronę gracza)? Czy boss przed szarżą wchodzi na tor? Arena dopuszcza oba warianty.
3. Alarm R6 (promień 12 przy przyjeździe windy) budzi grupy 10–12 pól od `<` i grupy Clear the Path (12–20). Zostawić czy zwiększyć `NO_ENEMY_RADIUS_ENTRY_SHAFT` do 12?
4. Prolog: reszta puli przy N = 10 to `dd, dd, sh`, a pokój Guarda może mieć 1–2 drzwi (test blokady gwarantuje „za Guardem”). Zgoda?
5. W M1 nie ma patroli (tylko błądzenie w promieniu `ENEMY_WANDER_RADIUS`). Gruz `,` jest tylko kosmetyczny, `Π` nieużywane w M1. Ciecz `~` w M1 to tylko dekoracja bez obrażeń (Mechaniki v0.5.2); generator może ją stawiać jako kałuże na polach przechodnich, do potwierdzenia: czy `~` ma być przechodnia. Brak patroli potwierdzić.
6. Ponowne zestrojenie: przyjąłem **25 kr + 2 Cu** (Mechaniki v0.5.2 / Balans v1.1). Brief podawał 30 kr. Na poziomy nie wpływa.

**Balans**
7. Skład kontraktów: Data Core `ddh`, Clear the Path g2 `sss`+`dht` [B v1.2]. Rozstrzygnięte: zostaje (§10a).
8. Korekta ±1 w szablonie grup (§3.1) oraz stosy `$` 1 / 1–2 / 1–2 i notatki 2 / 1–2 / 2: zgoda?
9. Zawartość skrzyń losowana przy generowaniu (identyczna przy powtórce ziarna): zgoda?

**GRAF**
10. Glif notatki (propozycja `?`), glif bramy areny (`>` czy osobny), nora w M1 niewidoczna. Terminal BASE `&` w kolorze bazy?
11. Baza: Issue przy Vat (bez osobnego obiektu); kabel `-` w rzędzie 1 i w ścianie schowka jako nośnik Lights I. Czy Lights II/III mają zapalać kolejne odcinki (np. ściany boczne)?
12. Zamknięty `<` (blokuje też gracza): czy potrzebny osobny kolor?

**Fabuła**
13. Zwłoki #46 na każdym poziomie głęb. 2 (do przeczytania wielokrotnie) czy tylko do pierwszego przeczytania?

**PROG**
14. Nowe kafle w `TileMap`: `;` `'` `=` przechodnie; `<` solidny dla wszystkich poza graczem w oknie wsiadania; `-` `|` solidne w bazie; obiekty bazy solidne.
15. Arena jako osobna mapa (przejście przez bramę). Generowanie w trakcie `LIFT_RIDE_MS`, budżet ≤ 100 ms p95. Mapa awaryjna na głębokość. Wektory PRNG z §8 do testu Vitest.

## 10. Decyzje Game Directora do §9 (25.10.2026)
1. Wycofanie się przez bramę areny resetuje bossa (pełne HP, drony znikają). Brama zostaje otwarta przez całą walkę, bo ucieczka z łupem jest częścią decyzji „kiedy wracać”.
2. Szarża: boss wchodzi na najbliższy tor `=` i szarżuje wzdłuż niego poziomo w stronę kolumny gracza. Zapowiedź to podświetlenie całego toru, min. 450 ms (zapowiedź minus tick ≥ 400 ms). Unik polega na zejściu z rzędów toru. Liczby ustalają Mechaniki.
3. `NO_ENEMY_RADIUS_ENTRY_SHAFT` zostaje 10. Budzenie przez alarm windy grup z pierścienia 10–12 pól jest zamierzone, bo ma to być lekkie zagrożenie przy ewakuacji.
4. Reszta puli w Prologu `dd, dd, sh` i pokój Guarda z 1–2 drzwiami: zatwierdzone.
5. W M1 nie ma patroli, jest tylko błądzenie. `~` to dekoracja, jest przechodnia i nie zadaje obrażeń.
6. Ponowne zestrojenie Restore Relay za 25 kr + 2 Cu: zatwierdzone.
7. Skład wrogów kontraktów na głęb. 2: decyduje Balans.
8–9. Zatwierdzone, w tym deterministyczna zawartość skrzyń liczona z ziarna przy generowaniu.
10. Glify (m.in. notatka `?`): decyduje GRAF. Brama areny musi mieć własny glif, inny niż `>` w bazie.
11. Ulepszenia Lights II i III zapalają kolejne odcinki kabla w bazie (np. ściany boczne).
12. Pozostałe kolory i widoczność obiektów: decyduje GRAF.
13. Zwłoki #46 pokazują się tylko do pierwszego przeczytania. Potem znikają z mapy, a tekst zostaje w notatkach.
14–15. Kafle, `<` jako pole stałe, arena jako osobna mapa, budżet czasu, mapy awaryjne i wektory PRNG: decyduje PROG.

### 10a. Uzgodnienia z Mechanikami (v0.5.2)
- Po wyjściu gracza z areny boss wraca na start z pełnym HP, drony znikają, przywołanie jest znów dostępne, a przy ponownym wejściu pokazuje się `M1_RISK_01B`.
- `~` nie ma kosztu ruchu.
- **Szarża (rozstrzygnięte, mechaniki §2.11, wersja GD):** boss wchodzi na najbliższy tor `=` i szarżuje poziomo w stronę kolumny gracza. Pas toru ma 2 rzędy, czyli tyle, ile wysokość bossa 3×2. Zapowiedź trwa 900 ms od chwili, gdy boss stanie na torze, a szarża ma prędkość 2 ticki na pole. Arena (`ARENA_M1`) ma 2 takie pasy po 2 rzędy przez całą szerokość, ze ścianami na końcach, więc jest z tym zgodna bez zmian.
- Balans v1.2: kontrakty na głęb. 2 zatwierdzone (Data Core `ddh`, Clear the Path `sss`+`dht`). Powrót do `ddh`, jeśli QA zmierzy, że Clear the Path na głęb. 2 trwa dłużej niż 1,3 × głęb. 1 albo wyraźnie rośnie śmiertelność.

### 10b. Decyzje GRAF (styl-ascii.md §12, v1.5)
- Litery `A`, `G`, `B`, `X`, `O` na mapach w tym dokumencie to tylko oznaczenia. W grze `A` to podłoga, brama areny to `∩` (jasnoszary na ciemnym tle), `X` jest ścianą `#` do końca walki, a nora jest niewidoczna (Zbieracz znika w niej z jednym mrugnięciem `·`).
- Notatka to `?` (jasna, po przeczytaniu przygaszona). Zwłoki #46 to `%` i znikają po przeczytaniu.
- Terminal BASE to zielony `&`. Issue nie ma osobnego obiektu, tylko `Ω` pulsuje, gdy jest co odebrać. Zamknięty `<` jest ciemnoszary, bez tła i bez pulsowania.
- `~` w M1 ma przygaszony kolor #4B5B7A i nie jest animowana.
- Baza: Lights II zamienia boczne ściany sali (kolumny 0 i 28, rzędy 1–5) na zapalony kabel `|`. Lights III zapala resztę dolnej ściany sali (rząd 6) i rozjaśnia podłogę. `BASE_M1` jest z tym zgodna.

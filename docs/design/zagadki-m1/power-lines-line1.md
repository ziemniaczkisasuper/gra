# Zagadka terminala M1: „Power Lines — Line 1” (rozdział zasilania)
**Wersja dokumentu: v0.5.1** (dane `power-lines-line1.json` `"version": "0.5.1"`, `schema_version` 2; README ta sama wersja). Autor: LUZ / Pracownik 1, 25.10.2026. Status: **PROPOZYCJA**. Oznaczenia: „zatwierdzone przez GD 25.10.2026” = decyzja GD; „uzgodnione z Mechanikami, do akceptacji GD” = odpowiedzi Mechaników na M1–M9 i `design/mechaniki-m1.md` v0.5.2; pozostałe propozycje – do akceptacji GD.
Źródła: `wizja-gry.md` (filar 4), `fabula/zakres-m1.md` §6, `design/mechaniki-m1.md` **v0.5.2** (2.2 budżet czasu, 2.4, 2.14, 2.15, okno terminala, tabela stałych), `design/level-design-m1.md` §1 i §3, `graf/styl-ascii.md` §11 (v1.4), `fabula/teksty-m1-en.md` §11 (11.2 wyniki, 11.3 legenda, 11.4 nazwy, 11.5 podpowiedzi), `prog/sterowanie.md`.
Pliki w tym folderze: dane `power-lines-line1.json`, walidator / solver / generator `validate.py`, opis `README.md`.

**Zasada procesu (GD, 25.10.2026):** każda zmiana **zasad** zagadki wymaga **akceptacji GD przed zmianą JSON**. O każdej zmianie **układów siatek lub zasad** trzeba **wcześniej powiadomić GD oraz Dialogi i Lore** (podpowiedzi TIP są przypisane do konkretnych siatek). Propozycje zmian wpisujemy do sekcji 14 i czekamy na decyzję.

## Changelog
- **v0.5.1 (25.10.2026)** – bez zmian reguł symulacji i bez zmian siatek. Nazwy i typy urządzeń przeniesione do M2 (decyzja GD wg UI i Menu): usunięte pola `consumers[].name` i `type_text_id`, walidator zgłasza je jako błąd „pole M2”. Wiersz panelu M1: `{receiver} {got}/{need}`, np. `A 3/4`; legenda ma tylko DEVICE. Flagi `rewrite_needed` zdjęte (TIP-y przepisane przez Dialogi i Lore pod v0.5.0, czekają na akceptację GD). `M1_TERM_LEG_SUM` jest w tekstach (usunięte z `pending_text_ids`). Walidator: uwaga o słowach typów w TIP-ach, stała `POWER_LINES_MID_FROM_DEPTH`. Reguła sumowania (GD-1 / M-P1) zatwierdzona przez GD 25.10.2026. Dopisana zasada procesu.
- **v0.5.0 (25.10.2026)** – reguły wg głębokości. **Nowe warianty 04, 07, 08 (głęb. 1) z sumowaniem mocy z kilku źródeł** (bez węzła). **Przenumerowanie:** dawne układy 07 → **05**, 08 → **01**, 01 → **02** (głęb. 2, siatki bez zmian; w 02 uziemienie przy źródle ON na starcie). Dawne 05 (limit) i 02 (urządzenie na drodze) wypadły. **03:** usunięta pułapka [4,5] i górne urządzenie [1,6] (limit 4 urządzeń), urządzenie [4,6] potrzebuje 4. **06:** start z uziemieniem [3,7] ON. Do tego: podgląd liczb na żywo, pomoc `?`, czasy wiążące (mediana i p80), M1_AFFIX_11 (`affix_start_hint`), generator ponownego zestrojenia, `hint.text_ids` (3 stopnie), `sources[]`, `consumers[]` z `consumer_type`, limit 4 urządzeń, wersjonowanie.
- v0.4 – osobne ID tekstu dla każdego wyniku, tokeny z symulacji, nazwy Houses / Bunker Line. v0.3 – rozmiary i odstęp przełączników (UI i Menu). v0.2 – wygląd wg GRAF v1.4.

## 1. Cel i założenia
- **Jedna zagadka, 8 wariantów** = 8 terminali `M1_TERM_01–08`. Kolejność Level Design: głęb. 1 `04 < 07 < 08`, głęb. 2 `05 < 01 < 02`, głęb. 3 `06 < 03` (= `order` 1–8 w JSON).
- **Pomysł, nie wzór.** Każdy wariant ma jedno nowe „aha” (sekcja 8). Matematyka (dodawanie, dzielenie, podzielność, odejmowanie, liczenie wstecz) wynika z sytuacji, nie z polecenia.
- **Reguły wchodzą z głębokością** (sekcja 7a, uzgodnione z Mechanikami, do akceptacji GD).
- **Telefon.** Siatka maks. **9×9**, jedna akcja: tapnięcie przełącznika + SEND / RESET / EXIT / `?`. Maks. 12 przełączników (w M1: 3–7), każde dwa w odległości Czebyszewa ≥ 2. **Najwyżej 4 urządzenia** w wariancie (`POWER_LINES_MAX_RECEIVERS = 4`, litery A–D; mechaniki v0.5.2).
- **Czas (wiążący, mechaniki v0.5.2 §2.2, QA R27):** mediana **30–60 s na głęb. 1** i **60–90 s na głęb. 2–3**, p80 ≤ 120 s; na głęb. 3 (06, 03) dodatkowo **mediana ≤ 75 s i p80 ≤ 105 s**. Szacunki w sekcji 8. Wcześniejsze „60–120 s” w v0.1–v0.4 pochodziło z mechaniki 2.4 (v0.3/v0.4), czyli z założenia Mechaników, a **nie z decyzji GD**. Decyzja GD dotyczy całej sesji (mediana ≤ 3 min, p80 ≤ 4 min, `zespol.md`, mechaniki 2.2) i nowe czasy z niej wynikają, więc konfliktu dla GD nie ma.
- **Świat stoi:** terminal pauzuje grę i otwiera się tylko poza walką (mechaniki 2.14).

## 2. Fikcja
BASE wystawia rozkaz: przywrócić pierwszą linię zasilania sektora. Każdy terminal stoi przy rozdzielni. Okno ma nagłówek `M1_TERM_HEADER`, tytuł `M1_TERM_xx_NAME` i kontekst `M1_TERM_xx` (Dialogi i Lore).

## 3. Elementy siatki i znaki
Siatka w danych to lista wierszy, **1 znak = 1 komórka**. To **format danych**; ekran rysuje glify GRAF (3a). Znaki tylko ASCII, bez liter. Kolor nigdy nie jest jedyną informacją.

| Znak w danych | Element / legenda | Łączy się | Zasada | Od głęb. |
|---|---|---|---|---|
| `.` | pusta | – | nic | 1 |
| `*` | **źródło** / POWER IN | 1 sąsiad | wysyła swoją moc (`sources[].power`, 1–99). Wariant może mieć **kilka źródeł** (element `multi_source`) | 1 |
| `-` `\|` | **kabel** / WIRE | poziomo / pionowo | przewodzi | 1 |
| `+` | 2 połączenia: **zakręt kabla**; 3–4: **węzeł** / BOX | 2–4 | węzeł dzieli moc **po równo** między żywe gałęzie | zakręt 1, węzeł 2 |
| `=` / `/` | **przełącznik** ON / OFF | dokładnie 2 | ON przewodzi, OFF to przerwa | 1 |
| `1`–`9` | **urządzenie** / DEVICE (bez typów w M1) | 1–2 (przy kilku źródłach 1–4) | potrzebuje **dokładnie** tyle mocy | 1 (na drodze: 3) |
| `_` | **uziemienie** / GROUND | 1 | przyjmuje dowolną moc | 1 (w praktyce od 2, sekcja 7a) |
| `!` | **limit** (bezpiecznik) / LIMIT | dokładnie 2 | przepuszcza najwyżej `fuses[].max` | 3 |

### 3a. Znak w danych → znak na ekranie (wg `graf/styl-ascii.md` §11, dodatek v1.4)
Rozstrzygnięcie GRAF dla G1. Dodatek czeka na akceptację GD (sekcja 14). Dzięki niemu `*`, `!` i `+` z danych nie pojawiają się na ekranie w innym znaczeniu niż w świecie gry. Okno jest osobną warstwą nad pauzą, a świat pod nim jest przyciemniony do 30%.

| Dane (JSON) | Ekran | Kolor / wygląd | Tryb zastępczy (czysty tekst) |
|---|---|---|---|
| `.` pusta | `·` | `#2A323C`, tylko siatka tła | `.` |
| `*` źródło (każde) | liczba mocy, np. `12` | odwrócona komórka: `#0B0F14` na `#FFE14D` (jak terminal `&`) | `*`, moc w linii nad siatką |
| `-` / `\|` kabel | `─` / `│` (linie łączą się bez przerw) | bez prądu `#8B98A5`, z prądem `#FFE14D` | `-` / `\|` |
| `+` węzeł | glif złącza dobrany do sąsiadów: `┼ ├ ┤ ┬ ┴`, róg `┌ ┐ └ ┘` | `#C9D1D9` bold, cienka ramka `#8B98A5` („skrzynka”) | `+` |
| `=` przełącznik zamknięty | `=` | `#FFE14D` bold + ramka 1 px `#FFE14D` | `=` |
| `/` przełącznik otwarty | `/` | `#8B98A5` + ta sama ramka. Stan niesie kształt, a ramka mówi „tapnij” | `/` |
| `1–9` odbiornik (przed SEND) | cyfra | `#C9D1D9` bold w ramce | cyfra |
| `_` uziemienie | `⊥` | `#8B98A5` bold | `⊥` |
| `!` + `fuses[].max` bezpiecznik | `≤4` | `#FFE14D` na `#3A3410`, podwójna ramka | `≤4` |

Glif węzła wybiera renderer z połączeń w stanie „wszystkie przełączniki zamknięte” (ta sama funkcja co `neighbours()` w `validate.py`), więc wygląd węzła nie zmienia się przy tapaniu.

**Stany po SEND** (przed SEND urządzenie pokazuje tylko liczby w panelu, sekcja 5) (każdy różni się kształtem, nie tylko kolorem):
| Wynik | Ekran |
|---|---|
| odbiornik świeci (dokładnie) | cyfra `#0B0F14` na pełnym tle `#3DDC97` |
| odbiornik ciemny (za mało, DARK) | cyfra `#C9D1D9`, ramka **przerywana**, wiersz panelu `B 1/2` |
| odbiornik przepalony (OVERLOAD) | **`x`** `#0B0F14` na `#FF5FC8` (odwrócona magenta), wiersz panelu `A 4/2` |
| TRIP (węzeł) / FUSE (bezpiecznik) | ta komórka w odwróconej magencie (`#0B0F14` na `#FF5FC8`), miga 3× po 200 ms, potem stała. Przy Reduce motion od razu stała |
| SHORT (pierścień) | wszystkie komórki pierścienia na tle `#4A1240`, kable w nim `#FF5FC8`, jedno mignięcie |
| przepływ | kable zmieniają się na `#FFE14D` komórka po komórce (ok. 40 ms) |

Uwaga dla PROG: do podświetlenia SHORT renderer potrzebuje listy komórek pierścienia. `simulate()` w walidatorze zwraca przy SHORT tylko `status`; przy porcie do TS trzeba dodać zwracanie komórek cyklu.


## 4. Zasady przepływu (wersja dla implementacji)
Stan zagadki to tylko ustawienie przełączników. Ta sama funkcja liczy **podgląd na żywo** (liczby w panelu przy każdym tapnięciu) i **wynik SEND** (stany porażki/wygranej).

1. **Połączenia.** Sąsiednie komórki (bez skosów) są połączone, gdy obie przewodzą i „patrzą” na siebie. `/` nie przewodzi.
2. **Zwarcie (pierścień).** Sieć połączona ze źródłem z zamkniętym pierścieniem → **SHORT**.
3. **Gałęzie żywe.** Bez pierścieni sieć każdego źródła to drzewo. Gałąź jest żywa, gdy prowadzi do urządzenia lub uziemienia. Gałąź kończąca się na OFF albo na innym źródle jest martwa i nie bierze udziału w podziale.
4. **Podział.** Węzeł dzieli moc po równo między żywe gałęzie. Reszta z dzielenia → **TRIP**.
5. **Limit** `!`: więcej niż `max` → **FUSE**. Liczy się cała moc, także ta do uziemienia.
6. **Urządzenie na końcu linii** (`consumer_type: "end"`): **suma** mocy ze wszystkich linii, które do niego dochodzą (przy kilku źródłach to kilka linii; przy jednym źródle jedna). Dokładnie = świeci; mniej = ciemne (nie porażka); więcej = **OVERLOAD**.
7. **Urządzenie na drodze** (`consumer_type: "mid"`, od głęb. 3): bierze swoje, resztę puszcza dalej (odejmuje, nie dzieli). Za mało → ciemne i dalej idzie 0. Nie przepala się. To samo urządzenie „mid” może w danym stanie być na końcu (wariant 06); `consumer_type` mówi, czy topologia na to pozwala, a bieżącą rolę daje `simulate()["through"]`.
8. **Kilka źródeł** (tylko z prostymi liniami: bez węzła, limitu, urządzenia na drodze i pierścienia; walidator to wymusza). Źródła nie mogą się stykać bez urządzenia pomiędzy.
9. Kolejność: źródła wg pozycji, w każdym wszerz (góra, prawo, dół, lewo). Wynik SEND pokazuje **pierwszy** problem: SHORT, potem TRIP/FUSE w kolejności przepływu, potem OVERLOAD. Kolejność wpływa tylko na to, który problem widać.

**Wygrana:** brak SHORT / TRIP / FUSE / OVERLOAD i wszystkie urządzenia świecą. Referencja: `Puzzle.simulate()` i `Puzzle.preview()` w `validate.py`; testy reguł: `python3 validate.py --selftest`.

## 5. Akcje gracza, podgląd na żywo i pomoc
| Akcja | Telefon | PC |
|---|---|---|
| Przełącz przełącznik | tapnięcie w pole 48×48 px | klik albo strzałki + Spacja |
| Wyślij prąd | **SEND** | Enter |
| Stan startowy | **RESET** | R |
| Zamknij | **EXIT** | Esc / E |
| Pomoc | **`?`** (legenda + TIP 1→3 przyciskiem MORE) | H |

- **Liczby na żywo, stany po SEND (decyzja M2, uzgodnione z Mechanikami, do akceptacji GD).** Panel urządzeń pokazuje przy każdym tapnięciu wiersz `{receiver} {got}/{need}`, np. `A 3/4` (got = moc dostarczona teraz, need = potrzebna; bez typu urządzenia – typy są w M2). Gdy liczby nie da się policzyć (za złym podziałem albo w pierścieniu), `x` = `–`. **TRIP / OVERLOAD / FUSE / SHORT / LOW** (stany, magenta, `x` w komórce, teksty wyników) pojawiają się **dopiero po SEND**. Uzasadnienie: liczby to uczciwa informacja potrzebna do wnioskowania i skracają zagadkę do celów czasowych z sekcji 1. Ocena „czy to błąd” zostaje dla gracza, więc myślenie nadal jest szybsze niż zgadywanie. Podgląd pokazuje np. `4/2`, ale nie mówi „przepalenie”, a TRIP widać tylko jako `–`.
- **Kara i pomoc (M3).** Po nieudanym SEND blokada **1,5 s**. Przycisk `?` działa **od początku i jest darmowy**. Zaczyna **pulsować** po **2 nieudanych SEND** (każdy wynik inny niż WIN, także LOW) albo po **45 s** bez rozwiązania (liczone od otwarcia terminala, pauza okna nie liczy się). Pulsowanie kończy otwarcie `?`. Z Reduce motion zamiast pulsowania: stała ramka.
- **Statystyki (M4).** Liczba SEND i czas nie wpływają na nagrodę (nagroda jak w mechanice 2.4 / 2.15).
- **Rozmiary i dotyk: UZGODNIONE (Mechaniki z UI i Menu):** siatka ≤ 9×9 bez przewijania; komórka ≥ 28 px (26 px na niskich ekranach); pole trafienia przełącznika 48×48 px; **każde dwa przełączniki w odległości Czebyszewa ≥ 2** (błąd walidacji, także w instancjach ponownego zestrojenia).
- **Tryb poziomy** (GRAF §11): komórka = max(26 px, min(38 px, (wysokość − 120 px) / wiersze)). UI nie ma dymków ani tooltipów (zmiana UI z 25.10), więc `x/y` są tylko w panelu obok siatki; tapnięcie urządzenia nic nie robi.
- **Litera urządzenia:** A–D w kolejności czytania (wiersz, potem kolumna) – w panelu. Czy litera jest też w komórce urządzenia, rozstrzygają GRAF z Mechanikami (konflikt z zasadą „bez liter w oknie zagadki”, `teksty-m1-en.md` §11.3a); dane tego nie zmieniają.

## 6. Wynik SEND, porażka i reset
| Wynik | ID tekstu (§11.2) | Tokeny | Skutek |
|---|---|---|---|
| WIN | `M1_TERM_OK` | – | fragment mapy +10%, nagroda |
| WIN po ponownym zestrojeniu | `M1_TERM_OK_RETUNE` | – | nagroda ponownego zestrojenia, **bez fragmentu mapy** |
| DARK | `M1_TERM_LOW` | – | nieudany SEND (liczy się do pulsowania `?`), blokada 1,5 s |
| OVERLOAD | `M1_TERM_FAIL` (**tylko OVERLOAD**) | – | blokada 1,5 s, przełączniki zostają |
| TRIP | `M1_TERM_TRIP` | `{box_power}`, `{box_lines}` | jak wyżej |
| FUSE | `M1_TERM_FUSE` | `{fuse_max}` | jak wyżej |
| SHORT | `M1_TERM_SHORT` | – | jak wyżej |

**Tokeny = wartości z symulacji** (`simulate()["tokens"]`): `source_power` (tylko gdy wariant ma **jedno** źródło), `box_power`, `box_lines` (TRIP), `fuse_max`, `fuse_power` (FUSE). Nazwy robocze – potwierdza PROG (P1). RESET wraca do startu; EXIT zostawia ustawienie do końca poziomu.

## 7. Legenda w UI
Glify z 3a, tylko elementy z `elements`, znacznik **NEW** dla `new_elements` (pierwsze wystąpienie w kolejności M1). **Bez blokady** głębszych terminali – legenda NEW wystarcza (decyzja M8, uzgodnione z Mechanikami, do akceptacji GD). ID linii: `source`→`M1_TERM_LEG_SOURCE`, `multi_source`→`M1_TERM_LEG_SUM` (ADD UP), `cable`→`_CABLE`, `junction`→`_JUNCTION`, `switch`→`_SWITCH`, `consumer`→`_CONSUMER`, `ground`→`_GROUND`, `fuse`→`_FUSE`, `pass_through`→`_PASS`, `ring`→`_RING`. Urządzenie ma w legendzie tylko etykietę DEVICE; typów urządzeń w M1 nie ma (przeniesione do M2 decyzją GD).

## 7a. Reguły wg głębokości (uzgodnione z Mechanikami, do akceptacji GD; sumowanie zatwierdzone przez GD 25.10.2026)
| Głęb. | Dochodzi | Elementy dozwolone (`depth_elements` w JSON = `DEPTH_ELEMENTS` w walidatorze) |
|---|---|---|
| 1 | przełączniki, urządzenie na końcu linii, uziemienie | `source`, `multi_source`, `cable`, `switch`, `consumer`, `ground` |
| 2 | węzeł `+` (TRIP) i pierścień (SHORT) | + `junction`, `ring` |
| 3 | limit `!` i urządzenie na drodze | + `fuse`, `pass_through` (`consumer_type: "mid"`) |

**Konsekwencja dla głęb. 1.** Bez węzła sieć z jednym źródłem jest linią, w której nie ma czego rozdzielać (każdy przełącznik albo daje całą moc, albo nic). Dlatego warianty głęb. 1 mają **kilka źródeł**, a urządzenie **sumuje** moc z linii ON. Zagadka głęb. 1 to dobranie linii, których suma jest dokładnie równa potrzebie (pułapki: największe źródło, para zamiast trójki). To nowa reguła (sumowanie), nie nowy znak – **zatwierdzone przez GD 25.10.2026**. Uziemienie jest dozwolone na głęb. 1, ale bez węzła nie ma sensownej roli, więc pojawia się dopiero w 05 (głęb. 2) razem z węzłem. Dawne samouczki z węzłem (04, 07, 08 z v0.4) przeszły na głęb. 2 jako 05 i 01 (układ bez zmian), dawny 01 (pierścień) jako 02, a dawne 05 (limit) i 02 (pompa na drodze) wypadły – ich pomysły są w 03 i 06.

## 8. Warianty: nowy pomysł w każdym (spoilery)
Indeks = min. ruchów + log2(2^k / wygrane). **Krzywa sprawdzana w obrębie głębokości** (każda głębokość wprowadza nowy mechanizm, więc jej pierwszy wariant może być liczbowo prostszy od ostatniego z poprzedniej). Czas (heurystyka do kalibracji w playtestach QA): **mediana = 10 s + 5 s × nowy element legendy + 5 s × ruch + 4 s × log2(2^k / wygrane)**, **p80 = mediana + 30 s** (proporcja z mechaniki 2.2: 90/120 i 75/105). Szacunek zakłada podgląd liczb na żywo.

| # | ID | Rozdzielnia | Głęb. | Nowy pomysł | Elementy (NEW pogrubione) | Urządz. | Przeł. | Min. ruchów | Wygrane | Indeks | Czas med / p80 | Cel / limit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | M1_TERM_04 | Houses | 1 | linie z kilku źródeł sumują się (samouczek) | **source, multi_source, cable, switch, consumer** | 1 | 3 | 1 | 1/8 | 4,00 | 52 / 82 s | 30–60 / 120 ✓ |
| 2 | M1_TERM_07 | Corner Shop | 1 | największe źródło to pułapka | jak 04 | 2 | 6 | 4 | 1/64 | 10,00 | 54 / 84 s | ✓ |
| 3 | M1_TERM_08 | Bunker Line | 1 | para nie wystarcza – suma z trzech linii | jak 04 | 2 | 7 | 4 | 1/128 | 11,00 | 58 / 88 s | ✓ |
| 4 | M1_TERM_05 | Drone Dock | 2 | węzeł dzieli po równo; nadmiar do uziemienia | + **junction, ground** | 2 | 4 | 2 | 6/16 | 3,42 | 36 / 66 s | 60–90 / 120: szybciej niż cel* |
| 5 | M1_TERM_01 | Solar Farm | 2 | kaskada: uziemienie pomaga na jednym poziomie, szkodzi na drugim | junction, ground | 3 | 3 | 3 | 1/8 | 6,00 | 37 / 67 s | szybciej niż cel* |
| 6 | M1_TERM_02 | Pump Station | 2 | pierścień: wybór drogi zmienia udział urządzenia | + **ring** | 3 | 5 | 5 | 1/32 | 10,00 | 60 / 90 s | ✓ |
| 7 | M1_TERM_06 | Rail Crossing | 3 | urządzenie na drodze; wybór drogi zamienia role | + **pass_through** | 4 | 6 | 5 | 1/64 | 11,00 | 64 / 94 s | 60–90, ≤75 / ≤105 ✓ |
| 8 | M1_TERM_03 | Rail Hall | 3 | limit liczy wszystko; liczenie wstecz od limitu | + **fuse** | 4 | 6 | 6 | 1/64 | 12,00 | 69 / 99 s | ✓ |

\* 05 i 01 wprowadzają węzeł i są poniżej dolnej granicy celu głęb. 2. Górnych limitów nic nie przekracza, więc żadnego wariantu nie trzeba było upraszczać; budżet sesji to tylko ułatwia. Czy Mechanicy chcą je wydłużyć – punkt M-P2 w sekcji 13.

**Pułapka [4,5] w 03:** w v0.4 przełącznik [4,5] zamykał na starcie pierścień przez urządzenie [4,6]. **Usunięta** (komórka [4,5] jest pusta). Przy okazji 03 musiał zejść do 4 urządzeń: górne urządzenie [1,6] usunięte, urządzenie C [4,6] potrzebuje teraz 4 (całe 4 z limitu), więc skale ponownego zestrojenia to [1, 2]. Po zmianie 03 nie ma przełącznika, który byłby tylko pułapką: każdy z 6 przełączników jest w rozwiązaniu.
**06:** start ma uziemienie [3,7] ON (w v0.4 OFF), dzięki czemu wariant ma 5 ruchów (indeks 11 < 12 w 03) i mieści się w limicie głęb. 3.

Siatki (start → rozwiązanie) w znakach danych. Współrzędne `[wiersz, kolumna]` od 0.

**1. M1_TERM_04 Houses** (głęb. 1; źródła [0, 3]=2, [3, 0]=3, [3, 6]=4)  
Urządzenia: A 5 (end) [3, 3]. AFFIX_11: [1, 3]. Rozwiązanie: [[1, 3]].
```
start                         rozwiązanie
. . . * . . .                 . . . * . . .
. . . / . . .                 . . . = . . .
. . . | . . .                 . . . | . . .
* = - 5 - / *                 * = - 5 - / *
```
Kilka linii może zasilać jedno urządzenie: moc z linii ON sumuje się. Urządzenie potrzebuje 5, a dostaje 3 – trzeba dobrać drugą linię tak, żeby suma była dokładnie 5 (2, nie 4).

**2. M1_TERM_07 Corner Shop** (głęb. 1; źródła [0, 3]=4, [1, 5]=1, [3, 0]=3, [4, 8]=3, [6, 3]=3, [7, 5]=2)  
Urządzenia: A 6 (end) [3, 3], B 4 (end) [4, 5]. AFFIX_11: [1, 3]. Rozwiązanie: [[1, 3], [2, 5], [3, 1], [5, 3]].
```
start                                 rozwiązanie
. . . * . . . . .                     . . . * . . . . .
. . . = . * . . .                     . . . / . * . . .
. . . | . / . . .                     . . . | . = . . .
* / - 6 . | . . .                     * = - 6 . | . . .
. . . | . 4 - = *                     . . . | . 4 - = *
. . . / . | . . .                     . . . = . | . . .
. . . * . / . . .                     . . . * . / . . .
. . . . . * . . .                     . . . . . * . . .
```
Największe źródło to pułapka: urządzenie A (6) z linii 4 nie dobierze reszty (4+3=7). Trzeba zrezygnować z największej liczby i wziąć 3+3. Urządzenie B (4): 3 to za mało, a 3+2 za dużo – dobrać 1.

**3. M1_TERM_08 Bunker Line** (głęb. 1; źródła [0, 1]=6, [1, 0]=5, [2, 5]=2, [3, 6]=3, [5, 2]=1, [5, 8]=2, [8, 7]=1)  
Urządzenia: A 9 (end) [2, 2], B 4 (end) [6, 6]. AFFIX_11: [2, 0]. Rozwiązanie: [[2, 0], [2, 4], [4, 2], [8, 6]].
```
start                                 rozwiązanie
. * = . . . . . .                     . * = . . . . . .
* . | . . . . . .                     * . | . . . . . .
= - 9 - / * . . .                     / - 9 - = * . . .
. . | . . . * . .                     . . | . . . * . .
. . / . . . = . .                     . . = . . . = . .
. . * . . . | . *                     . . * . . . | . *
. . . . . . 4 - /                     . . . . . . 4 - /
. . . . . . | . .                     . . . . . . | . .
. . . . . . / * .                     . . . . . . = * .
```
Para nie wystarczy: urządzenie A (9) dostaje na starcie 6+5 (przepalenie), a żadna para z 6, 5, 2, 1 nie daje 9 poza 6+2+1 – trzeba trzech linii naraz i wyłączyć piątkę. Urządzenie B (4): 3+1.

**4. M1_TERM_05 Drone Dock** (głęb. 2; źródła [2, 0]=6)  
Urządzenia: A 2 (end) [0, 2], B 2 (end) [2, 6]. AFFIX_11: [2, 4]. Rozwiązanie: [[2, 4], [4, 1]].
```
start                         rozwiązanie
. . 2 . . . .                 . . 2 . . . .
. . | . . . .                 . . | . . . .
* - + - / - 2                 * - + - = - 2
. . | . . . .                 . . | . . . .
_ / + / _ . .                 _ = + / _ . .
. . | . . . .                 . . | . . . .
. . / . . . .                 . . / . . . .
. . _ . . . .                 . . _ . . . .
```
Wprowadza węzeł + i uziemienie _. Węzeł dzieli po równo między linie ON. Włączenie drugiego urządzenia daje obu po 3 (za dużo, widać 3/2 na panelu). Nadmiar trzeba świadomie zrzucić do uziemienia: gałąź z uziemieniem to kolejna równa część. Ale nie wszystkie trzy uziemienia naraz, bo 2 nie dzieli się na 3.

**5. M1_TERM_01 Solar Farm** (głęb. 2; źródła [2, 0]=12)  
Urządzenia: A 4 (end) [2, 5], B 2 (end) [4, 6], C 2 (end) [6, 2]. AFFIX_11: [1, 2]. Rozwiązanie: [[1, 2], [4, 1], [4, 4]].
```
start                         rozwiązanie
. . _ . . . .                 . . _ . . . .
. . / . . . .                 . . = . . . .
* - + - - 4 .                 * - + - - 4 .
. . | . . . .                 . . | . . . .
_ = + - / - 2                 _ / + - = - 2
. . | . . . .                 . . | . . . .
. . 2 . . . .                 . . 2 . . . .
```
Podział podziału: drugi węzeł dzieli tylko to, co dostał od pierwszego. To samo uziemienie, które ratuje górny węzeł, psuje dolny. Trzeba policzyć każdy poziom osobno.

**6. M1_TERM_02 Pump Station** (głęb. 2; źródła [3, 0]=12)  
Urządzenia: A 3 (end) [0, 5], B 2 (end) [3, 5], C 2 (end) [6, 5]. AFFIX_11: [1, 7]. Rozwiązanie: [[1, 7], [2, 5], [4, 1], [4, 5], [5, 7]].
```
start                                 rozwiązanie
. . . . . 3 . . .                     . . . . . 3 . . .
. . . + - + - / _                     . . . + - + - = _
. . . | . = . . .                     . . . | . / . . .
* + - + . 2 . . .                     * + - + . 2 . . .
. = . | . / . . .                     . / . | . = . . .
. _ . + - + - / _                     . _ . + - + - = _
. . . . . 2 . . .                     . . . . . 2 . . .
```
Pierścień: do środkowego urządzenia prowadzą dwie drogi z dwóch różnych węzłów. Obie ON = pierścień = zwarcie. Urządzenie dostaje inny udział zależnie od węzła, więc trzeba wybrać drogę, a potem dobrać uziemienia. Uziemienie przy źródle jest na starcie ON i jest pułapką.

**7. M1_TERM_06 Rail Crossing** (głęb. 3; źródła [0, 0]=13)  
Urządzenia: A 1 (mid) [0, 4], B 4 (mid) [3, 2], C 2 (end) [5, 4], D 2 (end) [5, 8]. AFFIX_11: [0, 3]. Rozwiązanie: [[0, 3], [2, 2], [5, 5], [5, 7], [7, 6]].
```
start                                 rozwiązanie
* - + / 1 - + . .                     * - + = 1 - + . .
. . | . . . | . .                     . . | . . . | . .
. . = . . . | . .                     . . / . . . | . .
. . 4 - - - + = _                     . . 4 - - - + = _
. . . . . . | . .                     . . . . . . | . .
. . . . 2 / + / 2                     . . . . 2 = + = 2
. . . . . . | . .                     . . . . . . | . .
. . . . . . = . .                     . . . . . . / . .
. . . . . . _ . .                     . . . . . . _ . .
```
13 nie dzieli się, więc coś musi wziąć prąd jako pierwsze. Pierścień ma dwie drogi, każda przez inny odbiornik. Ten na wybranej drodze odejmuje (jest na trasie), a ten na drugiej staje się końcówką i dostaje udział z węzła. Wybór drogi zamienia role odbiorników. Start: uziemienie przy drugim węźle ON (–1 ruch względem v0.4, żeby zmieścić się w limicie głęb. 3).

**8. M1_TERM_03 Rail Hall** (głęb. 3; źródła [2, 0]=15; `!` w [2, 5] max 4)  
Urządzenia: A 3 (mid) [2, 2], B 1 (mid) [4, 2], C 4 (end) [4, 6], D 3 (end) [8, 4]. AFFIX_11: [1, 4]. Rozwiązanie: [[1, 4], [2, 7], [4, 3], [6, 2], [6, 4], [7, 6]].
```
start                                 rozwiązanie
. . . . _ . . . .                     . . . . _ . . . .
. . . . / . . . .                     . . . . = . . . .
* - 3 - + ! + = _                     * - 3 - + ! + / _
. . . . | . | . .                     . . . . | . | . .
. . 1 / + . 4 . .                     . . 1 = + . 4 . .
. . | . | . . . .                     . . | . | . . . .
. . / . = . . . .                     . . = . / . . . .
. . + - + - = _ .                     . . + - + - / _ .
. . . . 3 . . . .                     . . . . 3 . . . .
```
Synteza z nowym limitem !: urządzenie na drodze, limit, pierścień i dwa poziomy podziału. Najprościej liczyć od limitu: przez niego może płynąć najwyżej 4, a urządzenie C za nim potrzebuje 4, więc pierwszy węzeł musi dzielić 12 na 3. Reszta wynika z tego krok po kroku. Bez przełącznika-pułapki [4,5] i z 4 urządzeniami (limit M1).


## 9. Schemat danych `power-lines-line1.json` (schema_version 2, version 0.5.1)
Plik główny:
| Pole | Typ | Opis |
|---|---|---|
| `schema_version` | int | **2** (v1 miał `source_power` i `hint.text_id`) |
| `version` | string | wersja danych dla QA, **`0.5.1`** (= nagłówek tego dokumentu i README); `changelog` – krótki opis wersji |
| `puzzle`, `title_en`, `header_text_id`, `success_text_id`, `rules_doc` | string | bez zmian od v0.4 |
| `fail_text_id`, `fail_text_id_scope` | string | `M1_TERM_FAIL`, tylko OVERLOAD |
| `result_text_ids` | obiekt | `WIN`, `WIN_RETUNE`, `DARK`, `OVERLOAD`, `TRIP`, `FUSE`, `SHORT` → osobne ID |
| `retune_header_text_id` | string | `M1_TERM_RETUNE` |
| `result_tokens` | obiekt | tokeny z symulacji (nazwy robocze, P1) |
| `depth_elements` | obiekt | głęb. → dozwolone elementy (sekcja 7a) |
| `time_target_s` | obiekt | głęb. → [min, max] mediany w s |
| `help` | obiekt | `fail_lock_ms` 1500, `help_free_from_start` true, `help_pulse_after_failed_sends` 2, `help_pulse_after_seconds` 45, `reward_depends_on_sends_or_time` false, `live_numbers` true, `fail_states_after_send_only` true |
| `consumer_limit`, `receiver_limit_const` | int, string | 4, `POWER_LINES_MAX_RECEIVERS` |
| `pending_text_ids` | obiekt | ID tekstów, których jeszcze nie ma w `teksty-m1-en.md` (walidator: uwaga zamiast błędu); teraz puste |

Wariant:
| Pole | Typ | Opis |
|---|---|---|
| `id`, `order`, `depth`, `difficulty` | | bez zmian od v0.4 |
| `name`, `name_en_working`, `name_text_id`, `context_text_id` | string | nazwy i ID tekstów |
| `idea`, `hint_en_draft` | string | dla zespołu / historia |
| **`hint`** | obiekt | **`text_ids`: dokładnie 3 ID `M1_TERM_xx_TIP_1`, `_2`, `_3`** (§11.5, kolejność = stopnie MORE); `tokens`: `{text_id: [token…]}` – tokeny użyte w danym stopniu; `valid_if`: `{text_id: {warunek}}` – warunek prawdziwości stopnia (`source_power_indivisible_by: [n…]`; `always: true` dla stopnia z tokenem, który jest zawsze prawdziwy); opcjonalnie `rewrite_needed: true` + `rewrite_note` – treść do przepisania przez Dialogi i Lore (walidator: uwaga; w v0.5.1 nie ma ich żaden wariant) |
| `elements`, `new_elements` | lista | elementy (legenda, NEW) |
| `grid` | lista stringów | siatka startowa |
| **`sources`** | lista `{at:[r,c], power:int}` | każde `*` w siatce, moc 1–99 (zastępuje `source_power`) |
| `fuses` | lista `{at:[r,c], max:int}` | limit każdego `!` |
| **`consumers`** | lista obiektów | **jeden obiekt na każde urządzenie (bez tablic równoległych), najwyżej 4**, w kolejności liter |
| **`affix_start_hint`** | `[r,c]` | przełącznik podświetlany na starcie przez **M1_AFFIX_11** (należy do `solution.taps`; wybrany tak, by był w każdym najkrótszym rozwiązaniu) |
| `solution.taps`, `solution.final_grid` | | minimalne rozwiązanie |
| `expected` | obiekt | `switches`, `min_moves`, `winning_states`, `difficulty_index`, `est_time_s` (mediana), `est_time_p80_s` |
| `retune` | obiekt | `scales`, `random_start`, `min_moves_at_least`, opcjonalnie `hint_off_when_invalid` (sekcja 11) |

**Obiekt urządzenia (`consumers[]`), dokładny zapis:**
```json
{"id": "A", "at": [2, 2], "need": 3, "consumer_type": "mid"}
```
| Pole | Typ | Znaczenie | Sprawdza walidator |
|---|---|---|---|
| `id` | string | litera A–D = kolejność czytania komórek urządzeń (wiersz, potem kolumna) – `{receiver}` w panelu | równa literze z kolejności czytania |
| `at` | `[r,c]` | komórka cyfry w `grid` | jest urządzeniem; każde urządzenie dokładnie raz |
| `need` | int | wymagana moc (= cyfra w siatce) – `{need}` w panelu | równe cyfrze |
| `consumer_type` | `"end"` / `"mid"` | `mid` = w jakimś stanie bez zwarcia urządzenie jest na drodze (puszcza prąd dalej); `end` = zawsze na końcu linii | obecność, wartość, **zgodność z symulacją** (przegląd 2^k stanów), `mid` dopiero od głęb. 3 (`POWER_LINES_MID_FROM_DEPTH`) |

Pola nazw i typów (`name`, `type_name`, `type_text_id`, `type`, `consumer_names`) to **pola M2**: w M1 walidator zgłasza je jako **BŁĄD „pole M2”**. Inne nieznane pola też są błędem.

**Zgodność z `mechaniki-m1.md` v0.5.2:** Mechanicy piszą „przy każdym odbiorniku pole JSON **`consumer_types`** o wartości `"end"` albo `"mid"`” i „`consumer_names` w M1 nie ma”. Znaczenie (end/mid, mid od głęb. 3) i stałe (`POWER_LINES_MAX_RECEIVERS = 4`, `POWER_LINES_MID_FROM_DEPTH = 3`, czasy 30–60 / 60–90 s, p80 ≤ 120 s, głęb. 3 ≤ 75 / 105 s) się zgadzają. **Różnica jest tylko w nazwie i kształcie:** v0.5.2 używa liczby mnogiej `consumer_types` przy odbiorniku i nie mówi, czy to pole obiektu, czy osobna mapa. U nas to pole **`consumer_type`** (liczba pojedyncza) w **obiekcie odbiornika** `consumers[]`, bez równoległej tablicy ani mapy. **Proponujemy zostawić nasz zapis** i poprosić Mechaników o poprawkę nazwy (M-P5).

Walidator sprawdza też: siatka ≤ 9×9, znaki, liczba połączeń (urządzenie 1–2, przy kilku źródłach 1–4), każda składowa sieci ma źródło, 1–12 przełączników, **odstęp Czebyszewa ≥ 2**, **≤ 4 urządzenia**, start ≠ wygrana, reguła głębokości.

## 10. Walidator, solver i generator (`validate.py`)
1. `--selftest`: reguły na małych siatkach (w tym sumowanie z kilku źródeł, podgląd na żywo, `consumer_type`).
2. Plik: `version`, `schema_version` 2, `result_text_ids`, zgodność `depth_elements`, `time_target_s` i `help` z decyzjami Mechaników.
3. Wariant: format, `sources`/`fuses`, połączenia, odstęp przełączników, **elementy dozwolone na głębokości** (błąd), kilka źródeł tylko z prostymi liniami, obiekty `consumers` (sekcja 9), limit 4, pola M2 = błąd.
4. Odtworzenie `solution.taps`, solver BFS (min. ruchów), pełny przegląd stanów (wygrane, rozkład wyników), zgodność podglądu na żywo z wynikiem SEND w stanach WIN/DARK.
5. `affix_start_hint` należy do rozwiązania (błąd), jest w każdym najkrótszym rozwiązaniu (uwaga).
6. `hint.text_ids` = 3 stopnie wariantu; tokeny każdego stopnia znane wariantowi; każdy `valid_if` prawdziwy w bazie.
7. `expected` (w tym czas med/p80), **czas wobec celu i limitów** (mediana > cel → błąd, poniżej celu → uwaga; p80 > 120 s, a na głęb. 3 mediana > 75 s lub p80 > 105 s → błąd), krzywa w obrębie głębokości.
8. `retune`: każda skala (cyfry ≤ 9, moc ≤ 99, odstęp, rozwiązanie działa, stopnie podpowiedzi prawdziwe albo `hint_off_when_invalid`), `min_moves_at_least` ≥ reguła głębokości.
9. **Teksty** (`fabula/teksty-m1-en.md`): każde ID z danych (wyniki, nagłówki, nazwy, konteksty, 3 stopnie TIP, legenda) musi istnieć – **nieznane ID to BŁĄD** (wyjątek: `pending_text_ids` → uwaga). Dla każdego stopnia TIP: tokeny z tekstu muszą być w `hint.tokens` tego stopnia; stopień z tokenem lub liczbą musi mieć `valid_if`, sprawdzany przy każdej skali; liczba wpisana na sztywno to błąd. Stare pole `hint.text_id` = błąd. Słowo typu urządzenia w TIP-ie (light, pump, town, charger…) = uwaga, bo M1 nie ma typów.
10. `--generate ID|all --count N --seed S`: instancje ponownego zestrojenia jako JSON; `--gen-test N`: N losowań na wariant, każda instancja sprawdzona (sekcja 11).

## 11. Ponowne zestrojenie (LD §3) i generator (decyzja M7)
- Liczby (moc źródeł, potrzeby, limity) razy k z `retune.scales`; warianty głęb. 1 mają tylko ×1 (×2 dałoby cyfrę > 9), więc różnią się losowym startem.
- **Losowy start**: nie może być wygraną, a minimalna liczba ruchów do wygranej musi być ≥ `min_moves_at_least` = max(reguła głębokości, min. ruchów bazy − 2). Reguła głębokości (uzgodnione z Mechanikami): **głęb. 1 ≥ 1, głęb. 2–3 ≥ 2** (nigdy 0–1 ruchu).
- Każda instancja jest potwierdzana **solverem BFS** (niezależnie od losowania), sprawdzane są odstęp przełączników, stopnie podpowiedzi (`hint_valid` dla każdego stopnia; nieprawdziwy stopień jest wyłączany tylko przy `hint_off_when_invalid`) i wybierany jest przełącznik dla M1_AFFIX_11 (wspólny dla wszystkich najkrótszych rozwiązań).
- Instancja: `base_id`, `scale`, `grid`, `sources`, `fuses`, `min_moves`, `solution_taps`, `affix_start_hint`, `hint_text_ids_on`, `win_text_id` (`M1_TERM_OK_RETUNE`), `header_text_id` (`M1_TERM_RETUNE`).
- Test: `python3 validate.py --gen-test 1000 --seed 2026` – 8000 instancji, 0 błędów.
- **Podpowiedź 06** (`M1_TERM_06_TIP_1`, „{source_power} cannot split into three equal parts…”): warunek `source_power_indivisible_by: [3]`. Prawdziwy dla obu skal (13, 26), więc teraz nic się nie wyłącza; `hint_off_when_invalid` zostaje jako zabezpieczenie (do decyzji LUZ/DL: można zdjąć).

## 12. Dla PROG i UI (integracja)
- Dane: JSON → `src/data/power-lines-m1.ts`; logika: port `Puzzle._flow()` (wspólny dla `simulate()` i `preview()`), test zgodności na 8 wariantach.
- **Klucze `simulate(mask)` (wynik SEND) i `preview(mask)` (na żywo; te same klucze):**
  - `status`: `WIN` / `DARK` / `OVERLOAD` / `FUSE` / `TRIP` / `SHORT` (w `preview()` informacyjnie – **UI go nie pokazuje przed SEND**);
  - `cell`: `[r,c]` komórki problemu albo `None`;
  - `got`: `{(r,c): int | None}` – moc dostarczona do urządzenia;
  - `lit`: `{(r,c): bool}`; `through`: zbiór urządzeń, które w tym stanie są na drodze; `flow`: `{(r,c): int}`;
  - `tokens`: `source_power` (tylko 1 źródło), `box_power`, `box_lines`, `fuse_max`, `fuse_power`;
  - **`panel`** (dodane w v0.5): lista `[{id, at, x, y, lit}]` w kolejności liter, np. `{"id": "A", "at": [2,2], "x": 3, "y": 3, "lit": true}`.
- **Wiersz panelu M1: `{receiver} {got}/{need}`**, np. `A 3/4`. **receiver = `consumers[i].id`** (= `panel[i].id`, kolejność czytania); **got = `preview(mask)["panel"][i]["x"]`** (= `preview(mask)["got"][(r,c)]`), liczone **na bieżąco po każdym tapnięciu** (decyzja M2), `None` → `–`; **need = `consumers[i].need`** (= `panel[i].y`). Bez typu i nazwy urządzenia (M2). Po SEND UI bierze `status`, `cell` i `tokens` z `simulate(mask)`. Przy porażce `simulate()` przerywa przepływ, więc liczby w panelu zawsze z `preview()`.
- Zapis: zbiór rozwiązanych ID. Wynik → tekst: `result_text_ids[status]`, przy instancji ponownego zestrojenia WIN → `WIN_RETUNE`.
- Pomoc: TIP-y z `hint.text_ids` po kolei (MORE), tylko te z `hint_text_ids_on` w instancji. M1_AFFIX_11: podświetlić `affix_start_hint` na starcie.
- **P1 (PROG):** nazwy tokenów `{box_power}`, `{box_lines}`, `{fuse_max}`, `{source_power}` – do potwierdzenia; przy zmianie: `RESULT_TOKENS` w `validate.py`, `result_tokens` w JSON i teksty.
- **P2 (PROG):** stała `POWER_LINES_MAX_RECEIVERS = 4` (mechaniki v0.5.2) jest w `validate.py` i jako `consumer_limit` w JSON.
- **P3 (PROG/UI):** klucz `panel` w `simulate()/preview()` i pola `consumers[]` (`id`, `at`, `need`, `consumer_type`) – nazwy do potwierdzenia przy porcie do TS.

## 13. Pytania do Mechaników – stan
Wszystkie M1–M9: **uzgodnione z Mechanikami, do akceptacji GD** (zamknięte).
- ~~M1 rdzeń zasad~~ → wszystkie reguły zostają, wchodzą z głębokością (7a), walidator pilnuje.
- ~~M2 SEND / podgląd~~ → liczby na żywo, stany po SEND (5).
- ~~M3 kara / podpowiedzi~~ → 1,5 s, `?` darmowy od startu, pulsuje po 2 nieudanych SEND / 45 s (5).
- ~~M4 statystyki~~ → bez wpływu na nagrodę (5).
- ~~M5 czas~~ → 30–60 / 60–90 s, p80 ≤ 120 s, głęb. 3 ≤ 75 / 105 s; pułapka [4,5] w 03 usunięta (1, 8).
- ~~M6 M1_AFFIX_11~~ → darmowe podświetlenie przełącznika z rozwiązania (`affix_start_hint`).
- ~~M7 ponowne zestrojenie~~ → start nie 0–1 ruchu (głęb. 2–3), generator + solver (11).
- ~~M8 ekran / dotyk~~ (dawne M7) → zamknięte wcześniej (5).
- ~~M9 kolejność odkrywania~~ → legenda NEW, bez blokady (7).
- ~~G1 (GRAF)~~, ~~L1 (Dialogi i Lore)~~ – zamknięte w v0.2 / v0.4.

Nowe:
- ~~**M-P1. Sumowanie z kilku źródeł na głęb. 1**~~ – **zatwierdzone przez GD 25.10.2026** (zamknięte).
- **M-P2. 05 i 01 poniżej dolnej granicy celu głęb. 2** (36 i 37 s wg heurystyki). Zostawić (wprowadzają węzeł) czy wydłużyć? Wydłużenie to zmiana układu, więc najpierw GD oraz Dialogi i Lore (zasada procesu).
- ~~**M-P3. Pole `consumers[].name`**~~ – **przeniesione do M2 decyzją GD (wg UI i Menu)** (zamknięte).
- **M-P4. Heurystyka czasu** (sekcja 8) – do kalibracji z pomiarami QA (B1/B3).
- **M-P5. Nazwa pola w mechaniki v0.5.2:** `consumer_types` → nasz zapis `consumers[].consumer_type` (sekcja 9). Prośba o poprawkę w dokumencie Mechaników.

## 14. Do akceptacji Game Directora
1. Typ zagadki i 8 wariantów (sekcja 8) – do akceptacji GD.
2. Sterowanie i rozmiary (5) – uzgodnione Mechaniki + UI i Menu, do akceptacji GD.
3. Porażka: 1,5 s blokady, `?` darmowy, pulsuje po 2 nieudanych SEND / 45 s; SEND i czas bez wpływu na nagrodę (5) – uzgodnione z Mechanikami, do akceptacji GD.
4. Krzywa w obrębie głębokości i rozkład wariantów zgodny z LD (8) – do akceptacji GD.
5. Ponowne zestrojenie: skalowanie + losowy start z min. 2 ruchami na głęb. 2–3, potwierdzany solverem (11) – uzgodnione z Mechanikami, do akceptacji GD.
6. Dodatek GRAF v1.4 (3a) – do akceptacji GD.
7. Teksty Dialogi i Lore §11 (osobne ID wyników, nazwy, przepisane TIP-y 3-stopniowe, `M1_TERM_LEG_SUM`) – do akceptacji GD.
8. Decyzje Mechaników M1–M9 (reguły wg głębokości, liczby na żywo / stany po SEND, pomoc, czasy, M1_AFFIX_11, generator, legenda NEW) – uzgodnione z Mechanikami, do akceptacji GD.
9. ~~**GD-1: sumowanie mocy z kilku źródeł na głęb. 1**~~ – **zatwierdzone przez GD 25.10.2026**.
10. Czasy: dawne „60–120 s” nie było decyzją GD (sekcja 1) – brak konfliktu, tylko do wiadomości.
11. **Propozycja dla GD (niewprowadzona – zasada procesu):** M-P2, czyli ewentualne wydłużenie 05 i 01 do celu 60–90 s. To zmiana układu, więc wymaga też wcześniejszego powiadomienia Dialogi i Lore.

## 15. Dla Dialogi i Lore
- TIP-y §11.5 przepisane pod JSON v0.5.0 przeszły `check_texts()`: wszystkie 24 ID istnieją, tokeny się zgadzają (`{source_power}` tylko w `M1_TERM_06_TIP_1`, warunek `source_power_indivisible_by: [3]` prawdziwy dla skal ×1 i ×2), nie ma liczb wpisanych na sztywno ani słów typów. Flagi `rewrite_needed` zdjęte. **W v0.5.1 żadna siatka się nie zmieniła**, więc TIP-y nadal pasują.
- `M1_TERM_LEG_SUM` (ADD UP) jest w tekstach, więc usunąłem go z `pending_text_ids`.
- **Typy urządzeń → M2:** teksty `M1_TERM_TYPE_*` (§11.3a) i tabela przypisań typów do komórek nie są używane w M1. Proponuję przenieść je do puli M2 (albo oznaczyć jako M2) i poprawić w §11.3a opis wiersza panelu na `{receiver} {got}/{need}` (np. `A 3/4`). Pytanie 22 (typ w wierszu) jest rozstrzygnięte: w M1 bez typu.
- Każdą przyszłą zmianę układów lub zasad zgłoszę Wam **przed** zmianą JSON (zasada procesu).

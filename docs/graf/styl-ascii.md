# Styl ASCII – zestaw znaków i paleta M0/M1
Autor: [GRA][GRAF] Concept i Styl, 25.10.2026. Status: **ZATWIERDZONY** przez Game Directora (v1.2, 25.10.2026; v1.3 tylko nazwa drona). v1.1 (25.10.2026): dopisana sekcja 9 – odpowiedzi dla DESIGN / Mechaniki. v1.2 (25.10.2026): nazwy rzadkości wg Dialogów i Lore, wróg `c` z M0 (sekcja 10). v1.3: dron = Buddy Drone. v1.4: okno terminala Power Lines (sekcja 11), ZATWIERDZONE przez GD 25.10.2026. v1.5: odpowiedzi dla Level Design (sekcja 12). v1.6: odpowiedzi dla Assety i Animacja, kolor paneli #121821 (sekcja 13).
Źródła: wizja-gry.md, fabula-reprint.md, plan-produkcji.md.

## 1. Zasady nadrzędne
1. **Kolor nigdy nie jest jedyną informacją.** Każda kategoria ma własny kształt znaku; kolor to drugi sygnał. Dzięki temu gra działa dla daltonistów bez osobnego trybu.
2. **Kształt mówi, czym coś jest:**
   - `@` to tylko gracz,
   - **litery** to tylko wrogowie (małe = zwykli, wielkie = boss/elita),
   - interpunkcja i symbole to teren, obiekty, łup i efekty.
3. **Jasność mówi, czy to ważne.** Teren jest przygaszony, wszystko interaktywne i groźne jest jasne. Na małym ekranie oko od razu wyłapuje to, co się rusza albo da się użyć.
4. **Tło ciemne, jedno:** `#0B0F14` (prawie czarny, lekko granatowy). Mniej męczy oczy, oszczędza baterię na OLED.
5. Klimat: puste, ciche postapo. Świat jest szary i zgaszony; kolor niesie tylko to, co żyje (Szum = magenta), daje energię (żółty) albo bezpieczeństwo (zielono-turkusowy).

## 2. Czcionka i rozmiar (rekomendacja dla PROG/UI)
- Dołączona czcionka monospace na licencji OFL (darmowa), np. **JetBrains Mono**: wyraźne `0/O`, `1/l/I`, obsługuje wszystkie znaki z tego dokumentu. Nie polegać na czcionkach systemowych telefonu (różne glify = rozjechana siatka).
- Telefon: glif min. **16 px CSS**, zalecane 18–20 px; wysokość wiersza 1.15–1.25. Szerokość widoku min. ~30 kolumn w pionie.
- Gracz, wrogowie i łup: pogrubienie (bold). Teren: zwykła grubość.
- Wszystkie znaki poza ASCII w tabelach mają podany zamiennik ASCII na wypadek problemów z czcionką.

## 3. Paleta
Kontrast liczony względem tła `#0B0F14` (WCAG). Teren celowo ma niższy kontrast, żeby nie konkurował z akcją.

| Rola | Kolor | Kontrast | Uwagi |
|---|---|---|---|
| Tło | `#0B0F14` | – | jedno tło gry |
| Tło paneli i przycisków UI | `#121821` | – | dodane w v1.6 (sekcja 13) |
| Podłoga | `#3B4552` | 2.0 | ledwo widoczna, tylko orientacja |
| Ściana | `#8B98A5` | 6.5 | wyraźna granica |
| Gruz / przeszkody niskie | `#6B7280` | 4.0 | |
| Sucha roślinność | `#7D7A4F` | 4.4 | |
| Tory, elementy tła | `#56606B` | 3.0 | |
| Niebezpieczna ciecz | `#9A7BFF` | 6.1 | fiolet, animowany |
| **Gracz** | `#FFFFFF` | 19.2 | najjaśniejszy element ekranu |
| **Wrogowie (Szum)** | `#FF5FC8` | 7.1 | magenta = skażenie Szumem |
| Strzał gracza | `#BDEBFF` | 15.1 | |
| Ostrzeżenie przed atakiem | `#FFE14D` | 14.8 | |
| Energia / terminale | `#FFE14D` | 14.8 | terminal jako odwrócona komórka (patrz niżej) |
| Bezpieczne / użyteczne (ewakuacja, baza, kredyty) | `#3DDC97` | 10.9 | |
| Zejście głębiej | `#C9D1D9` | 12.5 | z ciemnym tłem komórki |
| Skrzynie | `#B08850` | 5.9 | |
| Rzadkość 1 | `#C9D1D9` | 12.5 | szary |
| Rzadkość 2 | `#56B4E9` | 8.3 | niebieski |
| Rzadkość 3 | `#FFB000` | 10.5 | bursztyn |

Kolory rzadkości i wrogów oparte są na palecie Okabe-Ito (bezpiecznej dla daltonistów). Sprawdziłem symulacją protanopii, deuteranopii i tritanopii: trzy rzadkości są rozróżnialne we wszystkich trzech (oś niebieski–bursztyn działa zawsze, a szary różni się jasnością). Pary słabsze w symulacji (np. wróg vs zielony obiekt u deuteranopów, terminal vs rzadkość 3) zawsze różnią się kształtem znaku, więc nie są problemem.

## 4. Zestaw znaków

### Aktorzy
| Co | Znak | Kolor | Dodatkowo |
|---|---|---|---|
| Gracz (łowca #47) | `@` | `#FFFFFF` bold | tło komórki `#1F3B57` (aureola), żeby gracz był widoczny od razu |
| Wróg 1: szybki do walki wręcz (np. dron) | `d` | `#FF5FC8` bold | |
| Wróg 2: strzelający, nieruchomy (np. wieżyczka) | `t` | `#FF5FC8` bold | |
| Wróg 3: słaby, w grupach (np. pełzacz) | `s` | `#FF5FC8` bold | |
| Wróg 4: ciężki, wytrzymały (np. transporter) | `h` | `#FF5FC8` bold | |
| Boss M1: Rail Guardian | blok 3×2 (niżej) | `#FF5FC8` bold | tło `#3D0F2E` |
| Scrap Crawler (tylko M0, w M1 zastąpiony przez `h` Curfew Guard) | `c` | `#FF5FC8` bold | zasady zapowiedzi jak w sekcji 9 |
| Elita (po M1) | wielka litera typu, np. `D` | `#FF5FC8` | |

Litery wrogów to robocze role. Nazwy (EN) ustala Dialogi i Lore, typy Mechaniki/Balans; zasada „jedna litera = jeden typ” zostaje. Unikać liter `l`, `i`, `o` (mylą się z innymi znakami).

Boss Rail Guardian (zajmuje 3×2 komórki, łatwiej trafić palcem i zobaczyć na telefonie):
```
/R\
[=]
```
Słaby punkt (litera `R`) miga na biało, gdy jest odsłonięty.

### Teren
| Co | Znak | Kolor |
|---|---|---|
| Podłoga | `.` | `#3B4552` |
| Ściana | `#` | `#8B98A5` |
| Gruz (przechodni, spowalnia lub osłania – decyzja Mechanik) | `,` | `#6B7280` |
| Sucha roślinność | `;` | `#7D7A4F` |
| Niebezpieczna ciecz (po M1; w M1 `~` to dekoracja, patrz sekcja 12) | `~` | `#9A7BFF`, powolna animacja `~`/`≈` |
| Tory kolejowe (arena bossa) | `=` | `#56606B` |
| Drzwi zamknięte / otwarte | `Π` / `'` | `#8B98A5` (zmiana z `+`, patrz sekcja 9) |
| Pole zapamiętane, poza zasięgiem wzroku | ten sam znak | kolor przyciemniony o 50% |

### Obiekty interaktywne
| Co | Znak | Wygląd |
|---|---|---|
| Terminal (zagadka) | `&` | **odwrócona komórka**: znak `#0B0F14` na tle `#FFE14D`; po rozwiązaniu zwykły `&` w `#3DDC97` |
| Punkt ewakuacji | `<` | `#3DDC97` bold, tło `#0F3326`, delikatne pulsowanie |
| Zejście na głębszy poziom | `>` | `#C9D1D9` bold, tło `#2A2F36` |
| Skrzynia | `■` (zamiennik `0`) | `#B08850` |
| Zwłoki poprzednika | `%` | `#C9D1D9` |
| Twoje zwłoki (z niesionym łupem) | `%` | `#FFFFFF` bold, tło `#1F3B57` jak aureola gracza |
| Kredyty Sieci (na ziemi) | `$` | `#3DDC97` |

### Łup na ziemi (kształt = slot, kolor = rzadkość)
| Slot | Znak |
|---|---|
| Broń | `/` |
| Pancerz | `[` |
| Moduł | `"` |
| Narzędzie | `(` |

| Rzadkość (nazwy wg Dialogów i Lore, `M1_RARITY_1–3`) | Kolor znaku | Tło komórki | Drugi sygnał bez koloru |
|---|---|---|---|
| 1 – Salvaged | `#C9D1D9` | brak | – |
| 2 – Tuned | `#56B4E9` | `#0E2A3F` | widoczne tło komórki |
| 3 – Grid-Grade | `#FFB000` | `#3A2A00` | tło + błysk co ~1,5 s (znak na chwilę zmienia się w `*`) |

W ekwipunku i sklepie rzadkość ma też znacznik tekstowy niezależny od koloru: rzadkość 1 bez znacznika, rzadkość 2 `◆` (zamiennik `+`), rzadkość 3 `◆◆` (zamiennik `++`), oraz ramka: zwykła / pojedyncza / podwójna.

### Efekty walki
| Co | Znak | Kolor |
|---|---|---|
| Strzał gracza | `*` | `#BDEBFF` |
| Pocisk wroga | `•` (zamiennik `°`; nie `o`, bo litery są zarezerwowane dla wrogów) | `#FF5FC8` |
| Ostrzeżenie przed atakiem wroga (nad wrogiem, ~0,4–0,6 s przed ciosem) | `!` | `#FFE14D` bold |
| Trafienie | znak trafionego miga na biało przez 1 klatkę | – |
| Gracz otrzymuje obrażenia | aureola gracza miga na `#FF5FC8` | – |

### Baza
| Co | Znak | Kolor |
|---|---|---|
| Drukarka łowców (Reprint Vat) | `Ω` (zamiennik `8`; nie `V`, bo litery są zarezerwowane dla wrogów) | `#3DDC97` bold |
| Automat Exchange | `$` | `#3DDC97` bold, tło `#0F3326` |
| Skrytka | `≡` (zamiennik `=`) | `#C9D1D9` |
| Wyjście na wyprawę | `>` | jak zejście |
| Ulepszenie bazy (widoczne na mapie) | podświetlone fragmenty ścian i kabli `-` `|` w `#FFE14D` | zapalone = postęp |

### Mapa sektora (przywracanie sieci)
- Sektor zgaszony: `·` w `#2A323C`.
- Sektor zapalony: `▓` (zamiennik `#`) w `#FFE14D`.
- Gracz na mapie: `@` jak w grze.
Różnica zgaszony/zapalony to zarówno kształt, jak i jasność, więc działa w każdym typie daltonizmu.

## 5. Klimat Szumu (efekt, opcjonalny w M1)
Wrogowie od czasu do czasu „zakłócają się”: na 1 klatkę ich litera zmienia się w losowy znak spośród `% & # ?` w tym samym kolorze. Bardzo rzadko (co kilka sekund), nigdy podczas ostrzeżenia `!`. Wyłączane opcją „Reduce motion”, tak samo jak wszystkie miganie i pulsowanie.

## 6. Ustawienia dostępności (propozycja dla UI)
- Rozmiar czcionki (min. 3 stopnie).
- Reduce motion: wyłącza miganie, pulsowanie i zakłócenia Szumu.
- Tryb wysokiego kontrastu: podłoga `#5A6573`, teren jaśniejszy o ~20%.
Osobne tryby dla daltonistów nie są potrzebne, bo każda informacja ma kształt; można je dodać później, jeśli QA coś wykaże.

## 7. Przykładowy ekran
```
###########
#.........#     @  gracz
#..d...,,.#     d  wróg (magenta)
#.....!...#     !  ostrzeżenie przed ciosem
#..@...t..'     t  wieżyczka
#.*.......#     *  strzał gracza
#..[..&...#     [  pancerz (kolor = rzadkość), & terminal
#~~~...%..#     %  zwłoki poprzednika
#~~~.....<#     <  ewakuacja
###########
```

## 8. Do potwierdzenia przez inne działy
- PROG/UI: czcionka (JetBrains Mono lub inna OFL), minimalny rozmiar komórki, rysowanie tła komórek na canvas.
- Mechaniki/Balans: ostateczne 4 typy wrogów (litery), czy gruz osłania; nazwy rzadkości.
- Dialogi i Lore: angielskie nazwy wrogów, rzadkości i obiektów.
- QA: test czytelności na prawdziwym telefonie (np. 360 px szerokości) i z symulatorem daltonizmu.

## 9. Odpowiedzi dla DESIGN / Mechaniki (do mechaniki-m1.md v0.2, punkty 13–14)
Wszystkie znaki poniżej sprawdziłem w czcionce JetBrains Mono (Bold, v2.304): są w niej obecne. Przy tej czcionce zamienniki ASCII z tabel nie są w M1 potrzebne; to tylko awaryjny plan, gdyby PROG wybrał inną czcionkę.

| Pytanie | Decyzja GRAF |
|---|---|
| Materiały (Scrap, Copper) | **`:`** zatwierdzone, kolor `#B08850` bold (ciepły „metal”, jak skrzynie). Scrap i Copper mają ten sam znak, bo zbierają się same; rodzaj widać w komunikacie podniesienia i w plecaku. Nie myli się z gruzem `,` (inny kształt i jaśniejszy kolor). |
| Med-Patch na ziemi | **`+`** w `#3DDC97` bold (krzyżyk medyczny jest najbardziej intuicyjny). Kolizję rozwiązuję po stronie drzwi: **drzwi zamknięte to teraz `Π`** (framuga), otwarte `'`. `♥` odpada, bo nie ma go w czcionce. W plecaku/HUD Med-Patch to ikona `+` z licznikiem, **nie `!`**, bo `!` jest zarezerwowany dla ostrzeżeń. |
| Data Core (przedmiot kontraktu) | **`§`** w `#FFE14D` bold, tło komórki `#3A3410`. Żółty = energia/dane Sieci; kształt odróżnia go od łupu rzadkości 3 (bursztyn) i od terminala `&` (odwrócona komórka). Ta sama reguła dla przyszłych przedmiotów kontraktów: `§` + żółty. |
| Dron gracza (Buddy Drone) | **`¤`** w `#3DDC97` bold, tło `#1F3B57` (ta sama „aureola” co gracz = sojusznik). Zamiennik awaryjny: `0`. Nie `+` (Med-Patch). Gdy dron traci HP, tło miga na `#FF5FC8` jak u gracza. |
| Zbieracz (Scrapper) niosący łup | Zgoda na propozycję Mechaników plus drugi sygnał bez koloru: (1) **tło komórki** w kolorze tła rzadkości najlepszego zabranego przedmiotu (rzadkość 1: `#2A2F36`, 2: `#0E2A3F`, 3: `#3A2A00`); (2) **co 600 ms glif na 200 ms zmienia się z `s` na znak slotu** najlepszego przedmiotu (`/ [ " (`, `:` dla stosu, `§` dla Data Core) w kolorze rzadkości. Gracz widzi, *że* Zbieracz ma łup i *co* to jest. Przy „Reduce motion”: zamiast mrugania stałe podkreślenie `_` pod `s`. |
| Zapowiedź ciosu wroga | **Bez wielkiej litery** (wielkie = elita/boss). Trzy sygnały naraz: (1) nakładka **`!`** nad wrogiem w `#FFE14D` bold przez całą zapowiedź; (2) **glif wroga w odwróconej komórce**: tło `#FF5FC8`, znak `#0B0F14` (trafienie zostaje białe, więc się nie mylą); (3) **zamrożone pole celu**: tło `#4A1240`, migające co 100 ms z `x` w `#FF5FC8` (kolor Szumu zamiast czerwieni, spójnie z wrogami; czerwień i magenta i tak wyglądają u daltonistów podobnie, więc kluczowy jest kształt `x` i miganie). Przy „Reduce motion”: pole celu bez migania, stałe `x` na tle `#4A1240`. Szarża bossa: ta sama reguła dla całej linii toru. |
| Nakładka ALERT `!` (wykrycie) | Ten sam `!`, ale w `#C9D1D9` (szary) i tylko 300 ms. Żółty `!` = „zaraz uderzy”, szary = „zauważył cię”. Różnica też w czasie trwania, więc nie zależy od koloru. |

Zmiany w sekcji 4 wynikające z powyższego: drzwi `+` → `Π`. Reszta tabel bez zmian.

## 10. Uzgodnienia v1.2
- **Nazwy rzadkości:** obowiązują nazwy z Dialogów i Lore (`fabula/teksty-m1-en.md`, `M1_RARITY_1–3`): **Salvaged / Tuned / Grid-Grade**. Moje robocze Scrap/Prototype wycofuję, bo „Scrap” to już nazwa materiału. Kolory i sygnały bez koloru bez zmian: Salvaged szary, Tuned niebieski + tło + `◆`, Grid-Grade bursztyn + tło + błysk + `◆◆`.
- **Wróg `c` (Scrap Crawler):** istnieje tylko w prototypie M0. Glif `c`, kolor `#FF5FC8` bold, zapowiedź ciosu jak w sekcji 9 (żółty `!`, odwrócona komórka, pole celu z `x`), **bez** zmiany na `C`. W M1 jego miejsce zajmuje `h` Curfew Guard (szablon M0 wg mechaniki-m1.md). Litera `c` zostaje zarezerwowana i nie zostanie użyta dla innego wroga.
- Dron gracza: ostateczna nazwa **Buddy Drone** (zatwierdzona przez GD; Salvage Drone i Helper Drone nie obowiązują). Glif `¤` bez zmian.

## 11. Okno terminala „Power Lines” (odpowiedź na G1 z `design/zagadki-m1/power-lines-line1.md` §13)
Dodatek v1.4 (25.10.2026), **zatwierdzony przez GD bez zmian**. Rozszerza styl o nowe okno UI i nie zmienia sekcji 1–10. Zastrzeżenie GD: wszystkie etykiety, przyciski i komunikaty w oknie (SEND, RESET, EXIT, TRIP, FUSE, SHORT itd.) są po angielsku i przechodzą przez Dialogi i Lore (poziom A2).

**Zasada:** znaki w JSON zagadki (`* - | + = / 1–9 _ !`) to **format danych** i mogą zostać bez zmian. Na ekranie rysujemy je glifami z tabeli niżej. Dzięki temu znaki `*`, `!` i `+` z terminala nie pojawiają się na ekranie w innym znaczeniu niż w świecie gry. Okno jest osobną warstwą nad pauzą, a świat pod nim przyciemniamy do 30%.

| Element (dane) | Na ekranie | Kolor / wygląd |
|---|---|---|
| pusta `.` | `·` | `#2A323C` (tylko siatka tła) |
| źródło `*` | liczba mocy, np. `12` | odwrócona komórka: `#0B0F14` na `#FFE14D` (jak terminal `&`) |
| kabel `-` / `\|` | `─` / `│` (rysunek ramek, linie łączą się bez przerw) | bez prądu `#8B98A5` (kontrast 6,5; `#56606B` było za słabe dla kluczowej informacji), z prądem `#FFE14D` |
| węzeł `+` | glif złącza dobrany do sąsiadów: `┼ ├ ┤ ┬ ┴`, róg `┌ ┐ └ ┘` | `#C9D1D9` bold, cienka ramka komórki `#8B98A5` (= „skrzynka”) |
| przełącznik zamknięty `=` | `=` | `#FFE14D` bold + ramka 1 px `#FFE14D` |
| przełącznik otwarty `/` | `/` | `#8B98A5` + ta sama ramka. Stan niesie kształt (`=` / `/`), a ramka mówi „tapnij” |
| odbiornik `1–9` (przed SEND) | cyfra | `#C9D1D9` bold w ramce |
| uziemienie `_` | `⊥` | `#8B98A5` bold (`_` siedzi na dole komórki i ginie na telefonie) |
| bezpiecznik `!` + limit | `≤4` | `#FFE14D` na `#3A3410` (kontrast 9,6), podwójna ramka. Znak `≤` mówi wprost „najwyżej 4” i nie używa `!` |

**Stany odbiornika po SEND** (każdy różni się kształtem, nie tylko kolorem):
| Stan | Wygląd | Etykieta |
|---|---|---|
| Świeci (dokładnie) | cyfra `#0B0F14` na pełnym tle `#3DDC97` | – |
| Ciemny (za mało) | cyfra `#C9D1D9`, ramka **przerywana** | `1/2` pod komórką, `#C9D1D9`, ok. 60% wielkości |
| Przepalony (za dużo) | **`x`** `#0B0F14` na tle `#FF5FC8` (odwrócona komórka w kolorze zagrożenia, jak zapowiedź ciosu) | `4/2` pod komórką |

**Miejsce problemu po porażce:**
- TRIP (węzeł) i FUSE (bezpiecznik): ta komórka w odwróconej magencie (`#0B0F14` na `#FF5FC8`), miga 3× po 200 ms, potem zostaje stała. Przy „Reduce motion” od razu stała.
- SHORT (pierścień): wszystkie komórki pierścienia mają tło `#4A1240`, a kable w nim są w `#FF5FC8` (kontrast 5,3), z jednym mignięciem. Gracz widzi cały pierścień jako kształt.
- Animacja przepływu po SEND: kable zmieniają kolor na `#FFE14D` komórka po komórce (ok. 40 ms, jak w §5 zagadki).

**Rozmiary:** komórka 38 px w pionie (OK). Liczby dwucyfrowe w komórce rysujemy czcionką `min(18 px, 0,5 × komórka)`, więc w poziomie (26–30 px) to ok. 13–15 px, czyli nadal czytelnie, bo to krótkie liczby na kontrastowym tle. Etykiety `x/y` nie mieszczą się pod komórką w poziomie, więc wtedy pokazuje je tapnięcie odbiornika (dymek). Sam rozmiar celu dotyku w poziomie to decyzja UI/Mechaników (M7).

**Tryb zastępczy (czysty tekst):** zostają znaki z danych, z wyjątkiem bezpiecznika (`≤4`) i uziemienia (`⊥`). Wszystkie użyte glify są w JetBrains Mono (sprawdzone).

## 12. Odpowiedzi dla Level Design (`design/level-m1.md` §9 pkt 10–13, decyzje GD w §10)
Dodatek v1.5 (25.10.2026). GD oddał GRAF decyzje o glifach i kolorach z tych punktów, więc to decyzje ostateczne, chyba że GD zdecyduje inaczej.

**Litery na mapach LD to tylko oznaczenia w dokumentacji** (`A`, `G`, `B`, `X`). W grze litery są zarezerwowane dla wrogów, dlatego te pola rysujemy tak:
| Oznaczenie LD | W grze |
|---|---|
| `A` – przyjazd po ewakuacji (baza) | zwykła podłoga `.`, bez glifu. Przy przyjeździe gracz pojawia się tam z aureolą |
| `G` – brama areny Rail Guardiana | **`∩`** w `#C9D1D9` bold, tło `#2A2F36` (kontrast 8,7). Ten sam „przejściowy” styl co `>`, ale **inny kształt**, zgodnie z wymogiem GD. W M1 `∩` oznacza wyłącznie bramę areny |
| `B` – pozycja bossa | blok `/R\` + `[=]` (sekcja 4) |
| `X` – ukryty szyb | zwykła ściana `#` do końca walki, potem `<` (ewakuacja) |

| Pytanie | Decyzja GRAF |
|---|---|
| Notatka (zapisek) na ziemi | **`?`** (propozycja LD przyjęta) w `#E6EDF3` bold. Po przeczytaniu glif zostaje, ale jest przygaszony do `#56606B`: gracz widzi, co już przeczytał. W świecie gry `?` nie ma innego znaczenia, a przycisk `?` w oknie terminala to UI, nie mapa |
| Zwłoki #46 (decyzja GD: tylko do pierwszego przeczytania) | `%` w `#C9D1D9` jak inni poprzednicy. Po przeczytaniu znikają z mapy, a tekst zostaje w notatkach. Nie potrzebują osobnego glifu |
| Nora Zbieraczy | **w M1 niewidoczna** (zwykła ściana `#`). Zbieracz, który w nią wchodzi, znika z jednym mignięciem `·` w `#FF5FC8` na polu przy ścianie (przy „Reduce motion” bez mignięcia). Gracz rozumie, że Zbieracz uciekł, ale nora nie zdradza się na mapie |
| Terminal BASE (kontrakty) w bazie | **`&` w `#3DDC97` bold, tło `#0F3326`**, czyli tak samo jak inne obiekty bazy (Exchange). Odwrócona żółta komórka zostaje tylko dla terminali-zagadek w strefie. Dzięki temu „żółte = zagadka, zielone = usługa bazy” |
| Issue przy Vat | zgoda, bez osobnego obiektu. `Ω` zostaje jedynym glifem. Gdy Issue czeka do odebrania (np. po wydruku), `Ω` pulsuje raz na 1,5 s (przy „Reduce motion” stała podkreślona komórka) |
| Zamknięty `<` (winda niedostępna) | **`<` w `#56606B`, bez tła i bez pulsowania.** Otwarty (okno 10 s): `<` w `#3DDC97` bold, tło `#0F3326`, pulsowanie i licznik sekund nad polem. Różnica to jasność + tło + ruch, nie sam kolor |
| `~` w M1 (dekoracja przechodnia, bez obrażeń) | zmiana koloru na **`#4B5B7A`** (kontrast 2,8, poziom podłogi/torów) i bez animacji. Jaskrawy fiolet `#9A7BFF` z sekcji 3 zostaje zarezerwowany na prawdziwie niebezpieczną ciecz (po M1), żeby gracz nie uczył się, że „fiolet jest bezpieczny” |
| Kable w bazie i ulepszenia Lights | Kabel niezapalony: `-` / `\|` w `#56606B`. Zapalony: `#FFE14D`. **Lights I** (wg LD): rząd 1 i ściana schowka. **Lights II:** ściany boczne głównej sali (kolumny 0 i 28, rzędy 1–5) zamieniają się z `#` na kabel `\|` i się zapalają. **Lights III:** dolna ściana sali (rząd 6, odcinki `-`) się zapala, a podłoga głównej sali rozjaśnia się z `#3B4552` do `#56606B` („w bazie jest jasno”). Każdy poziom daje więc widocznie więcej żółtego na mapie bazy |

Szarża Rail Guardiana (decyzja GD §10 pkt 2): podświetlenie całego pasa toru według reguły z sekcji 9, czyli tło `#4A1240` i `=` w `#FF5FC8` przez cały czas zapowiedzi (min. 450 ms), bez migania, bo pas ma być czytelny od razu.

## 13. Odpowiedzi dla Assety i Animacja (przegląd UI M1, `assety-m1.md` v1.3 §15 i §10a)
Dodatek v1.6 (25.10.2026).

1. **Litery A–I przy odbiornikach w oknie Power Lines: zgoda, z warunkami.** Okno terminala to warstwa UI, a nie mapa, więc reguła „litery = wrogowie” nie jest złamana. Litera to jednak **mała etykieta w lewym górnym rogu komórki** (ok. 45% wielkości glifu, `#8B98A5`, zwykła grubość), a nie główny znak. Główny znak komórki to nadal cyfra zapotrzebowania. Litera nie zmienia koloru razem ze stanem odbiornika. Na komórce świecącej (tło `#3DDC97`) i przepalonej (tło `#FF5FC8`) etykieta jest w `#0B0F14`. Gdy komórka ma mniej niż 30 px (telefon w poziomie), etykietę rysujemy nad siatką w linii opisu zamiast w komórce.
2. **Ramka z klawiszami ↑ ← ↓ → przy `@` w samouczku: zgoda.** Opisane pierwszeństwo (nie zasłania wroga, `!`, odwróconej komórki ani pola `x`, a gdy nie ma miejsca, przechodzi pod `@` albo się chowa) jest dobre. Wygląd: tło `hintBg`, ramka `#8B98A5`, strzałki `#C9D1D9`. Na urządzeniach dotykowych pokazujemy wskazówkę joysticka zamiast klawiszy. Ramka znika po pierwszych ruchach i nie wraca.
3. **`#121821`: dopisuję do palety** jako **tło paneli i przycisków** (`panelBg` / `controlBg`). To pełny kolor, a nie rgba, bo przezroczysty panel nad ruchomą mapą (ekwipunek w walce) obniża czytelność tekstu. Kontrast na `#121821`: `#C9D1D9` 11,5, `#8B98A5` 6,1, `#FFFFFF` 17,8. **`hintBg` = rgba(11,15,20,0.9) z ramką `#8B98A5`: zgoda** (dymki są małe i krótkotrwałe, więc lekka przezroczystość nie szkodzi).

Uwaga do „bazy jako menu-hubu”: `design/level-m1.md` §4 (zatwierdzony przez GD) opisuje bazę jako mapę ASCII z widocznym postępem Lights I–III, a `prog/ui-m1.md` (projekt) jako hub. Tę rozbieżność przekazuję Producentowi. Do decyzji sekcje 4 i 12 dotyczące bazy zostają bez zmian. Jeśli w M1 baza będzie hubem, ulepszenia Lights trzeba pokazać na ekranie huba (np. jako mapę bazy w tle albo pasek z kablami), bo widoczny postęp to filar gry.

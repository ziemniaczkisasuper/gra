# Sterowanie i HUD M0 – propozycja PROG / UI i Menu (25.10.2026)

Status: PROPOZYCJA – do uzgodnienia z DESIGN / Mechaniki i PROG / Silnik i Narzędzia, potem akceptacja Game Directora przed wdrożeniem.
Zakres: M0 (ruch + atak w czasie rzeczywistym na telefonie i klawiaturze, HUD: HP + pauza).

## 1. Założenia z dokumentów
Fakty (cytaty):
- „Ruch i walka: w czasie rzeczywistym, dynamicznie (NIE turowo), z automatyczną pauzą, gdy gracz odejdzie lub przełączy aplikację.” (wizja-gry.md, l. 10)
- „Platforma: przeglądarka, dobrze działa na telefonie i komputerze, wspólny zapis.” (wizja-gry.md, l. 13)
- „Grafika: 2D rysowane znakami tekstowymi (ASCII) … bez obrazków.” (wizja-gry.md, l. 9) → kontrolki i HUD też w stylu znakowym/prostych kształtów.
- „Język gry: w całości angielski” (wizja-gry.md, l. 12) → etykiety UI po angielsku (HP, PAUSE, ATK).
- „Do ustalenia: … sterowanie na telefonie (dział UI)” (wizja-gry.md, l. 39).
- „Sesje krótkie 30 s – 3 min, łatwo przerwać i wrócić” (wizja-gry.md, l. 29) → szybka pauza / wznowienie.
- M0: „postać chodzi po mapie ASCII w czasie rzeczywistym, jeden wróg, prosta walka, automatyczna pauza, sterowanie na telefonie i klawiaturze. Cel: sprawdzić, czy walka jest przyjemna na obu urządzeniach.” (plan-produkcji.md, l. 12)
- Technologia: „TypeScript w przeglądarce, siatka znaków rysowana na canvas, bez silnika. Jedna wersja na telefon i komputer.” – **do potwierdzenia przez PROG** (plan-produkcji.md, l. 7).
- M1 przewiduje „3 umiejętności do wyboru” (plan-produkcji.md, l. 21) → układ musi pomieścić później 1 atak + 3 umiejętności.

Założenia własne (NIE wynikają z dokumentów – do potwierdzenia):
- Z1. Ruch swobodny w 8 kierunkach (lub po siatce z powtarzaniem) – zależy od Mechaniki.
- Z2. W M0 jest jeden atak podstawowy; celowanie automatyczne na najbliższego wroga w zasięgu.
- Z3. Orientacja telefonu: poziomo (landscape) jako główna; pionowa obsługiwana awaryjnie.
- Z4. Brak dash/uniku w M0 (miejsce na przycisk zarezerwowane).

## 2. Telefon (dotyk)
**Ruch – wirtualny joystick pływający (rekomendacja)**
- Lewa połowa ekranu = strefa ruchu. Joystick pojawia się tam, gdzie kciuk dotknie; znika po puszczeniu.
- Uzasadnienie: kciuk nie musi trafiać w stały punkt, działa na różnych rozmiarach ekranu i przy różnym chwycie. Alternatywa (stały joystick) – jako opcja w ustawieniach, nie w M0.
- Promień joysticka: ok. 60 dp (średnica podstawy ~120 dp), gałka ~48 dp.
- Martwa strefa: 15% promienia (≈ 9 dp) – brak ruchu, brak drgań.
- Pełna prędkość od ~70% wychylenia (bez analogowego „skradania” w M0, chyba że Mechanika zechce).
- Jeśli ruch po siatce/8 kierunków: kwantyzacja kąta do 8 sektorów po 45° z histerezą ~10°, żeby kierunek nie migotał na granicach.
- Joystick „podąża”: gdy kciuk wyjdzie poza promień, podstawa przesuwa się za nim (brak „utknięcia” na krawędzi).

**Atak**
- Stały przycisk ATK w prawym dolnym rogu, średnica ~72 dp (min. 48 dp / ~9 mm), odstęp od krawędzi ≥ 16 dp + safe area.
- Przytrzymanie = atak powtarzany (autofire w tempie broni) – mniej klikania przy „leniwym farmieniu” (filar 3, wizja l. 20). Do potwierdzenia z Mechaniką.
- Pole trafienia większe niż wizualny przycisk (+8 dp wokół).
- Miejsce na 3 przyciski umiejętności (M1) w łuku wokół ATK, każdy ≥ 48 dp, odstępy ≥ 8 dp. W M0 ukryte.

**Wielodotyk**
- Śledzenie po `pointerId` (Pointer Events): jeden palec przypisany do joysticka, inny do ATK – działają jednocześnie.
- Palec, który zaczął w strefie ruchu, pozostaje joystickiem, nawet jeśli przesunie się na prawą połowę.
- Wyłączyć gesty przeglądarki na canvasie: `touch-action: none`, blokada przewijania, pinch-zoom i podwójnego tapnięcia, brak menu kontekstowego przy długim przytrzymaniu, `user-select: none`.
- `pointercancel` / utrata fokusu = puszczenie wszystkich kontrolek.

**Opcja leworęczna**
- Przełącznik „Left-handed”: lustrzane odbicie (ruch po prawej, ATK po lewej). W M0 może być flaga w kodzie/URL; menu ustawień później.

**Informacja zwrotna**
- Wciśnięty przycisk: zmiana jasności/obramowania. Wibracja (`navigator.vibrate`, krótka, ~20 ms) przy otrzymaniu obrażeń – opcjonalna, wyłączalna (nie działa na iOS Safari).
- Przezroczystość kontrolek ~40–60%, żeby nie zasłaniały mapy ASCII.

## 3. Komputer (klawiatura)
| Akcja | Domyślnie | Alternatywa |
|---|---|---|
| Ruch | W A S D | Strzałki |
| Atak | Spacja | J |
| Umiejętności (M1) | 1 2 3 | K L ; |
| Pauza | Esc | P |

- Przekątne: jednoczesne wciśnięcie dwóch kierunków; przeciwne kierunki się znoszą.
- Ruch oparty na stanie klawiszy (keydown/keyup), nie na powtarzaniu systemowym.
- Używać `KeyboardEvent.code` (pozycja fizyczna), nie `key` – działa z układami AZERTY/QWERTZ i polskim.
- `blur` okna / zmiana karty = wyczyszczenie wciśniętych klawiszy + auto-pauza (brak „zablokowanego” ruchu).
- Przebindowanie: architektura od początku przez warstwę akcji (sekcja 6); UI do zmiany klawiszy – po M0.

**Nice-to-have (po M0):**
- Mysz: klik LPM = atak w kierunku kursora (wymaga decyzji o ręcznym celowaniu).
- Pad (Gamepad API): lewa gałka = ruch, A/X = atak, Start = pauza. Tanie do dodania, jeśli warstwa akcji istnieje.

## 4. HUD M0
**Pasek HP – lewy górny róg**
- Pasek znakowy + liczba, np. `HP [########--] 80/100` – pasek do szybkiej oceny kątem oka, liczba do precyzji (build/statystyki są ważne w grze).
- Wysokość linii ≥ 16 px tekstu (na telefonie minimum ~14 sp), kontrast ≥ 4.5:1 względem tła (WCAG AA). Pod paskiem półprzezroczyste ciemne tło, żeby nie zlewał się z mapą.
- Kolor: zielony > 50%, żółty 25–50%, czerwony < 25% + miganie przy < 25% – ale stan rozróżnialny też bez koloru (długość paska, liczba). Ostateczna paleta: GRAF (styl-ascii.md).
- Krótki błysk/potrząśnięcie paska przy obrażeniach.

**Przycisk pauzy – prawy górny róg**
- Ikona `||` w polu ≥ 48×48 dp, odstęp ≥ 16 dp od krawędzi i safe area.
- Daleko od strefy kciuków (dolne rogi), więc brak przypadkowych tapnięć w walce.
- Na komputerze widoczny także (klikalny), z podpowiedzią „Esc”.

**Safe area / notch**
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` + marginesy z `env(safe-area-inset-*)`.
- HUD i kontrolki nigdy w obszarze notcha/zaokrągleń ani paska gestów (dół iOS/Android). Mapa może sięgać pod notch.

## 5. Szkic układu (telefon, poziomo)
```
+--------------------------------------------------------------+
| HP [########--] 80/100                                  [||] |
|                                                              |
|                 . . . # # # . . . .                          |
|                 . . @ . . . . E . .                          |
|                 . . . . . # . . . .                          |
|                                                              |
|   strefa ruchu (lewa połowa)        |      (sk1)  (sk2)      |
|        .---.                        |   (sk3)                |
|       ( (o) )   <- joystick         |          (  ATK  )     |
|        '---'     pływający          |                        |
+--------------------------------------------------------------+
  @ = gracz, E = wróg; sk1–3 ukryte w M0; [||] = pauza
  Leworęczny: lustrzane odbicie dolnej części.
```
Pionowo (awaryjnie): mapa w górnych ~60%, kontrolki w dolnych ~40% (ten sam układ lewo/prawo), HUD na górze.

## 6. Pauza
- Wejście: przycisk `||`, Esc/P, oraz automatycznie: `visibilitychange` (hidden), `blur` okna, `pagehide`, utrata fokusu, obrót ekranu/zmiana rozmiaru w trakcie walki (propozycja).
- W pauzie: zatrzymana symulacja (pętla gry nie liczy czasu – brak „skoku” delta-time po powrocie), przyciemniona mapa, menu: `RESUME`, (później `SETTINGS`, `QUIT TO BASE`).
- Wznowienie tylko świadome (RESUME / Esc) – nigdy automatyczne po powrocie do karty. Po wznowieniu krótkie odliczanie (np. 1 s) lub chwila nietykalności – do decyzji Mechaniki.
- Wszystkie dotknięcia/klawisze trzymane w chwili pauzy są zerowane.
- Przy auto-pauzie zapis stanu lokalnie (zgodnie z założeniem zapisu, plan l. 8) – koordynacja z Silnik i Narzędzia.

## 7. Skalowanie UI
- Kontrolki i HUD w jednostkach CSS px (≈ dp), nie w komórkach siatki – stały fizyczny rozmiar niezależnie od zoomu mapy.
- Canvas skalowany z `devicePixelRatio` (ostre znaki na ekranach retina).
- Mapa: stały rozmiar komórki w px wybrany tak, by widoczne było min. N×M komórek (N, M do ustalenia z Level Design/Mechaniką); nadmiar szerokości = szersze pole widzenia, a nie większe znaki.
- Proporcje testowe: 16:9, 19.5:9 / 20:9 (telefony), 4:3 (tablety), 16:10 i 21:9 (PC). Minimalna szerokość wspierana: 360 CSS px.
- Na PC kontrolki dotykowe ukryte; pokazują się przy pierwszym zdarzeniu dotyku (`pointerType === "touch"`), znikają po użyciu klawiatury.

## 8. Warstwa akcji (propozycja techniczna)
- Wejścia (klawiatura, dotyk, później pad/mysz) mapowane na akcje: `move` (wektor x,y w [-1,1]), `attack` (wciśnięty/trzymany), `skill1..3`, `pause`.
- Logika gry czyta tylko akcje, nie surowe zdarzenia → przebindowanie, opcja leworęczna i pad bez zmian w gameplayu.
- Próbkowanie akcji raz na klatkę/tick symulacji; buforowanie krótkich tapnięć ATK (np. 100 ms), żeby nie ginęły między tickami.

## 9. Otwarte pytania
**Do DESIGN / Mechaniki**
1. Ruch: swobodny (analogowy, ułamkowe pozycje) czy po siatce znaków (komórka po komórce)? 4 czy 8 kierunków? Prędkość stała czy zależna od wychylenia?
2. Ile ataków w M0 – jeden podstawowy? Czy przytrzymanie = autoatak jest OK?
3. Celowanie: automatyczne (najbliższy wróg) czy ręczne (kierunek ruchu/ostatni kierunek, mysz)? Atak wręcz, dystansowy czy oba?
4. Czy jest dash/unik (M0 czy później)? Jeśli tak – osobny przycisk czy gest (np. szybkie machnięcie)?
5. Orientacja telefonu: tylko pozioma, tylko pionowa czy obie?
6. Interakcje (zbieranie łupu, terminale) – automatyczne po wejściu na pole czy osobny przycisk „USE”? (wpływa na układ M1)
7. Po wznowieniu pauzy: odliczanie czy nietykalność?
8. Czy HP ma pokazywać liczby (np. 80/100), czy tylko pasek? Czy w M0 jest jeszcze inny zasób (energia, amunicja)?

**Do PROG / Silnik i Narzędzia**
1. Potwierdzenie stosu: TypeScript + canvas bez silnika (plan l. 7)? Bundler/narzędzia (np. Vite)?
2. HUD/kontrolki: rysowane na canvasie czy jako warstwa DOM/CSS nad canvasem? (Proponuję DOM dla kontrolek/HUD – łatwiejsza dostępność, safe area i skalowanie; do decyzji.)
3. Kto posiada moduł wejścia i warstwę akcji – UI czy Silnik? Proponuję: UI pisze adaptery dotyk/klawiatura, Silnik definiuje interfejs akcji i pętlę.
4. Pętla: stały krok symulacji (fixed timestep) czy zmienny? Jak próbkowane jest wejście względem ticka?
5. Gdzie jest punkt pauzy/auto-pauzy w pętli i czy auto-pauza wyzwala zapis lokalny?
6. Docelowe przeglądarki do testów M0 (iOS Safari, Chrome Android, desktop Chrome/Firefox)?

## Pauza przy czytaniu tekstów (decyzja Game Directora, przekazana przez FABUŁA / Scenarzysta)

Źródło: `/workspace/GRA/fabula/zakres-m1.md`, sekcja 10.

- Otwarcie zapisku, notatki w świecie gry lub tekstu terminala **pauzuje grę** (ten sam mechanizm co zwykła pauza: świat stoi, wciśnięte klawisze i dotknięcia się zerują), ale bez menu pauzy – na ekranie jest tylko okno tekstu.
- Okno tekstu: wyśrodkowane, ciemne tło z kontrastem min. 4.5:1, czcionka większa niż w HUD. Fragmenty po 2–3 zdania; przy kilku fragmentach przewijanie stronami (NEXT), nie ciągłe przewijanie.
- Zamknięcie: przycisk `X` / CLOSE (min. 48 dp) w prawym górnym rogu okna, na klawiaturze Esc lub klawisz akcji/USE; dotknięcie poza oknem nie zamyka (żeby nie zamknąć przypadkiem).
- Po zamknięciu gra wznawia się od razu, bez odliczania – gracz sam otworzył tekst, więc nie jest zaskoczony. (Do potwierdzenia z Mechaniką razem z pytaniem 7.)
- Esc w oknie tekstu zamyka tekst, a nie otwiera menu pauzy.

## Ustalenia z PROG / Silnik i Narzędzia (25.10.2026)

Szczegóły stosu: `/workspace/GRA/prog/stos-techniczny.md`.

- Stos: TypeScript (strict) + Vite, canvas 2D bez silnika, statyczny build pod GitHub Pages.
- Canvas rysuje mapę i encje; HUD, kontrolki dotykowe i okna (pauza, tekst) to DOM w `src/ui/` nad canvasem, `touch-action: none` tylko na strefach kontrolek.
- Wejście: Silnik daje `src/input/actions.ts` (`ActionState`, `InputSource { poll(); reset() }`) i scala źródła w `InputManager`. UI pisze `KeyboardSource` i `TouchSource` (Pointer Events) w `src/input/`.
- Pętla: stały krok 20 Hz z akumulatorem, render na rAF z interpolacją. Akcje jednorazowe (tap ataku, pauza) zatrzaskiwane jako zbocze, konsumowane w pierwszym kroku.
- Pauza w `core/loop`, zdarzenia `paused`/`resumed` na event busie; auto-pauza na `visibilitychange`/`blur`/`pagehide` z `reset()` wejścia i zapisem do localStorage.
- Testy M0: Chrome Android, Safari iOS (pion i poziom), Chrome i Firefox na PC.
- Do uzgodnienia: wznowienie „dowolnym klawiszem” vs tylko RESUME/Esc (patrz niżej) oraz powód pauzy (menu vs okno tekstu).

## Ustalenia z DESIGN / Mechaniki (25.10.2026)

Źródło: `/workspace/GRA/design/mechaniki-m1.md`, sekcja „Odpowiedzi dla UI i Menu”. Z2–Z4 przyjęte, **Z1 zmienione: ruch po siatce**.

- Ruch: siatka, 8 kierunków, stała prędkość (150 ms prosto, 200 ms skos). Joystick wybiera tylko kierunek: martwa strefa 15%, 8 sektorów po 45°, histereza 10°. Dodatkowo (UI): poniżej 25% wychylenia kierunek się nie zmienia, trzyma poprzedni – drobne drgania kciuka przy środku nie przeskakują sektorów. Klawiatura: 50 ms okna na drugi klawisz skosu przy ruszaniu z miejsca.
- Atak (M0 jeden, wręcz, zasięg 1): przytrzymanie = autoatak 2,5/s tylko z celem w zasięgu; tap bez celu = cios w kierunku patrzenia; bufor ATK 150 ms. Celowanie automatyczne (najbliższy wróg, remis = kierunek patrzenia).
- Brak dasha w M0. Jeśli w M1, to osobny przycisk.
- Orientacja: pozioma główna, pionowa obsługiwana. Min. widok 31×17 (poziomo) / 17×21 (pionowo) pól. Obrót ekranu = auto-pauza.
- USE (M1): kontekstowy przycisk widoczny tylko przy obiekcie, klawisz E. Na telefonie **osobny przycisk nad ATK**, nie slot umiejętności (sloty mają stałe miejsca dla pamięci mięśniowej). W M0 brak USE.
- Wznowienie po pauzie: odliczanie 1,0 s (3-2-1), bez nietykalności; wejście trzymane podczas odliczania działa w pierwszym ticku po nim. Wyjątek: zamknięcie okna tekstu – bez odliczania (gracz sam je otworzył; potwierdzone przez Mechanikę). Ale jeśli w trakcie czytania zadziałała auto-pauza (zmiana karty/aplikacji, obrót ekranu), po zamknięciu okna odliczanie 1,0 s jest.
- HUD: pasek HP z liczbą (80/100), brak innego zasobu w M0, miejsce pod paskiem HP zostaje na zasób M1. Liczby obrażeń nad celem przez 600 ms.
- Czytelność siatki: minimalna komórka 20 px CSS (18 px to granica czytelności nakładek). Na iPhone SE w poziomie 31×17 daje ok. 21 px. HUD jest nakładką i nie zabiera pól. Zaznaczenie celu/pola jako kolor tła lub obramowanie komórki, nie dodatkowy znak; liczby obrażeń min. 12 px z obrysem, mogą wychodzić poza komórkę.

## Akceptacja Game Directora (25.10.2026) – ZAAKCEPTOWANE do wdrożenia M0

Poprawki GD (wiążące):
1. Wszystkie etykiety w grze po angielsku (okno tekstu: NEXT / CLOSE; menu pauzy: RESUME itd.).
2. Wznowienie z menu pauzy tylko świadomie: RESUME, Esc lub P, z odliczaniem 1 s. Nigdy „dowolnym klawiszem”. Zamknięcie okna tekstu wznawia od razu, bez odliczania (wyjątek Mechaniki: jeśli w trakcie czytania zadziałała auto-pauza, po zamknięciu jest odliczanie 1 s).
3. Kontrolki i HUD w stylu znakowym ASCII: znaki i proste ramki, bez ikon graficznych. Paletę i ostateczny wygląd zatwierdza GRAF.

## Ustalenia na M1 z DESIGN / Mechaniki (25.10.2026)

- Med-Patch: klawisz Q; na dotyku stały przycisk `[+]` nad slotami umiejętności, z licznikiem sztuk (zielony `+`, także w HUD – wg GRAF). Przytrzymanie USE tylko dla interakcji z czasem trwania; czas zależy od interakcji i jest brany z danych, nie wpisany na sztywno: w M1 jedyna taka interakcja to wezwanie windy przy szybie `<`, **1,0 s** (`EVAC_CALL_HOLD_MS` = 1000; decyzja GD R6 wariant A, mechaniki v0.5.2; ponowne wezwanie po 5 s, alarm przy przyjeździe windy); w M2 odzysk zwłok 1,0 s (`CORPSE_LOOT_HOLD_MS`). *[Poprawka 25.10.2026, UI i Menu: było „(0,4 s)”. Źródło zmiany: `graf/assety-m1.md` §14 S7 oraz `design/mechaniki-m1.md` v0.5 §2.9, §2.13, §2.16. Wartości 0,4 s nie ma w żadnym dokumencie mechaniki ani w kodzie. Aktualizacja v0.5.2: 1,5 s → 1,0 s (GD, R6 A).]*
- Umiejętności: 3 stałe sloty, klawisze 1/2/3 lub K/L/;.
- HUD M1: „AT RISK: {cr}” i zajętość plecaka (12 slotów) pod paskiem HP.
- Brak odzysku zwłok w M1: USE przy zwłokach otwiera tylko notatkę. Strzałka do zwłok na brzegu ekranu jest w kodzie, wyłączona flagą do M2 (Recovery Beacon).
- Bump attack: krok w stronę wroga atakuje (M1).
- Pauzy M1: notatki zawsze (w walce wznowienie z odliczaniem 1 s, poza walką od razu); terminal tylko poza walką; ekwipunek pauzuje tylko poza walką.
- Znaki wg GRAF (`/workspace/GRA/graf/styl-ascii.md`, sekcja 9): drzwi `Π`, zapowiedź ciosu żółty `!` nad wrogiem + odwrócona komórka wroga, ALERT szary `!` przez 300 ms. Elity/boss to wielkie litery – nie używać wielkich liter jako wyróżnienia.
- Teksty M1 (FABUŁA / Dialogi i Lore): wszystkie napisy UI z ID w `/workspace/GRA/fabula/teksty-m1-en.md` – UI bierze teksty po ID, nie wpisuje ich na sztywno; tokeny liczb typu `{SK2_PULSE_DMG}` podstawiane z danych balansu. Nazwy umiejętności (zatwierdzone przez GD): Dash, Shock Pulse, Buddy Drone (ostateczna, ID M1_SKILL_03_NAME). Komunikaty HUD m.in. „Enemies nearby. Fight first.”, „Bag full.”. M1_BASE_06 pokazywany w chwili przyjazdu windy, nie przy wezwaniu.

## Wdrożenie M0 (PROG / UI i Menu, 25.10.2026)

Kod w `/workspace/GRA/prog/game/src/`: `input/joystick.ts` (sektory, martwa strefa, histereza, próg 25%), `input/touch.ts` (TouchSource, Pointer Events po `pointerId`), `input/keyboard.ts` (przejęty: blur → reset, K/L/; jako alternatywa skilli), `ui/overlay.ts` (menu pauzy, składanie UI), `ui/hud.ts`, `ui/touch-controls.ts`, `ui/text-window.ts` (`ui.showText(fragments)`), `ui/countdown.ts`, `ui/settings.ts` (`?lefty=1`, `?touch=1`), `ui/css-vars.ts` (kolory z `data/style.ts` → zmienne CSS). Nowe kolory w `UI_STYLE` oznaczone „do akceptacji GRAF”.
Zrzuty: `/workspace/GRA/prog/zrzuty/`. Test w przeglądarce: `__gra.openText(['...', '...'])`.
- **Minimalny margines kontrolek: 16 px CSS od każdej krawędzi + `env(safe-area-inset-*)`** (`--edge` w `style.css`) dla `[||]`, ATK, HUD i joysticka. Margines nie maleje na niskich ekranach; w trybie kompaktowym (wysokość ≤ 360 px) zmniejsza się ATK do 56 px (min. 48 px) i font HUD do 14 px. Menu pauzy na niskim ekranie poziomo ma dwie kolumny (RESUME | zapis), wszystko widoczne bez przewijania. `contextmenu` blokowane na całym dokumencie (canvas + UI), poza polem kodu zapisu.

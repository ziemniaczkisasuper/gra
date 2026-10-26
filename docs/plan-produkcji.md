# Plan produkcji – projekt GRA (propozycja Producenta, 25.10.2026)

Źródło: /workspace/GRA/wizja-gry.md (zatwierdzona wizja). Status: ZATWIERDZONY przez właściciela 25.10.2026 (zakres M1 + repozytorium GitHub właściciela, hosting GitHub Pages).

## Założenia produkcyjne
- Budżet 0 zł: hosting statyczny za darmo (np. GitHub Pages), bez płatnych usług.
- Technologia (do potwierdzenia przez PROG): TypeScript w przeglądarce, siatka znaków rysowana na canvas, bez silnika. Jedna wersja na telefon i komputer.
- Zapis: lokalnie w przeglądarce + eksport/import zapisu (kod/plik) między urządzeniami. Automatyczna synchronizacja dopiero później, bo bez serwera wymaga darmowej usługi chmurowej.
- AI (DeepSeek): poza M1. Klucz API nie może leżeć jawnie w grze w przeglądarce – rozwiązanie ustalimy przy M3.

## Kamienie milowe
- M0 – Prototyp techniczny (ok. 1 tydzień): postać chodzi po mapie ASCII w czasie rzeczywistym, jeden wróg, prosta walka, automatyczna pauza, sterowanie na telefonie i klawiaturze. Cel: sprawdzić, czy walka jest przyjemna na obu urządzeniach.
- M1 – Pierwsza grywalna wersja (ok. 3–4 tygodnie): pełna pętla gry w małej skali (opis niżej).
- M2 – Głębia buildu i drugi region: więcej umiejętności i synergii, więcej właściwości przedmiotów, crafting, drugi typ zagadki, łagodzenie straty (skrytka/ubezpieczenie).
- M3 – Treść i AI: dialogi z AI tam, gdzie pasuje (z trybem bez AI), kodeks wiedzy, kolejne strefy.

## Zakres M1 (pierwsza grywalna wersja)
W zakresie:
1. Baza: jeden ekran bazy, sklep-automat (kup/sprzedaj), skrytka na sprzęt, 1 ulepszenie bazy widoczne na mapie.
2. Jedna strefa wypraw, generowana losowo, 3 poziomy głębokości (głębiej = trudniej i lepszy łup), punkt ewakuacji.
3. Walka w czasie rzeczywistym: 4 typy wrogów + 1 boss, 3 umiejętności do wyboru, automatyczna pauza.
4. Łup: 4 sloty sprzętu (broń, pancerz, moduł, narzędzie), ok. 12 losowych właściwości, 3 rzadkości.
5. Śmierć: utrata całego niesionego łupu i założonego sprzętu, z zachowaniem trwałego postępu.
6. Zagadka: jeden typ terminala (np. rozdział zasilania), 5–8 ręcznie przygotowanych wariantów, nagroda w łupie lub dostępie.
7. Trwały postęp: przywracanie sieci – każda udana wyprawa zapala fragment mapy sektora; podsumowanie po sesji.
8. Sesje krótkie: 2–3 kontrakty od BASE (np. przynieś przedmiot, napraw podstację, 30 s–3 min) oraz dłuższa wyprawa z bossem.
9. Cała gra po angielsku, krótkie opisy przedmiotów i miejsc.
10. Zapis lokalny + eksport/import.

Poza M1: AI, crafting, drugi region, synchronizacja chmurowa, dźwięk (opcjonalnie proste efekty), drzewko umiejętności w stylu PoE 2.

## Zadania dla działów (M0/M1)
- DESIGN / Mechaniki: dokument pętli gry M1, sterowanie (telefon + klawiatura), 3 umiejętności, zasady śmierci i ewakuacji, kontrakty.
- DESIGN / Balans i Ekonomia: statystyki postaci i wrogów, tabela 12 właściwości i rzadkości, ceny w sklepie, tempo progresji w M1.
- DESIGN / Level Design: zasady generowania strefy (3 poziomy głębokości), rozmieszczenie wrogów, łupu, terminali i ewakuacji; arena bossa.
- PROG / UI i Menu: HUD, ekwipunek, sklep, sterowanie dotykowe, podsumowanie sesji; propozycja stosu technicznego i prototyp M0.
- GRAF: zestaw znaków ASCII i paleta kolorów (gracz, wrogowie, rzadkości łupu, teren), czytelność na małym ekranie.
- FABUŁA / Dialogi i Lore: nazwy i opisy (EN) przedmiotów, wrogów, strefy, terminali; prosty, czytelny angielski z rosnącym poziomem.
- FABUŁA / Scenarzysta: tło świata w 1 stronie, tło dla bazy i pierwszej strefy, motyw przywracania sieci.
- AUDIO: poza M1 (ew. lista 5–10 prostych efektów na później).
- QA: plan testów M0 (komfort walki na telefonie i PC) i M1 (pętla, ryzyko, balans pierwszej godziny).
- LUZ: wsparcie PROG przy wdrożeniu M1 i treści (warianty zagadek).

## Kolejność
1. PROG: stos techniczny + prototyp M0; równolegle DESIGN/Mechaniki: sterowanie i walka.
2. Po akceptacji M0: Balans, Level Design, GRAF, FABUŁA pracują na M1.
3. Każda propozycja działu przechodzi przez Game Directora przed wdrożeniem.

## Fabuła a kamienie milowe (fabula-reprint.md)
- M1: Prolog + pierwszy sektor Aktu I „The Outer Ring” (baza z Reprint Vat, jedna strefa, boss M1 = Rail Guardian w uproszczonej wersji, pierwsza linia Power Lines jako zagadka terminala).
- M2: reszta Aktu I (3–4 sektory, pełne łańcuchy Power Lines, The Mapper's Trail, Quiet Streets).

## Decyzje
- 25.10.2026: kod w repozytorium GitHub właściciela, hosting GitHub Pages (zgoda właściciela).
- 25.10.2026: zapis w M1 lokalny + eksport/import.

## Status zadań (aktualizuje Producent)
Faza 1 (start 25.10.2026):
- PROG / Silnik i Narzędzia: stos ZAAKCEPTOWANY (prog/stos-techniczny.md), repo czeka na decyzję właściciela; repozytorium, szkielet, prototyp M0 (mapa ASCII, ruch, pętla czasu rzeczywistego, auto-pauza, zapis lokalny). Wynik: /workspace/GRA/prog/
- PROG / Gameplay: walka M0 (1 wróg, atak, obrażenia, śmierć). Wynik: /workspace/GRA/prog/
- PROG / UI i Menu: sterowanie i HUD M0 ZAAKCEPTOWANE przez GD (prog/sterowanie.md); wdrożenie czeka na szkielet Silnika. Wynik: /workspace/GRA/prog/
- DESIGN / Mechaniki: część 1 (walka i ruch M0) i część 2 (pętla M1, v0.2) GOTOWE, czekają na akceptację GD; pytania przekazane do GRAF, Gameplay, Silnika. Wynik: /workspace/GRA/design/mechaniki-m1.md
- GRAF / Concept i Styl: styl ASCII v1.2 ZATWIERDZONY; dodatek v1.4 (sekcja 11, okno zagadki Power Lines) czeka na akceptację GD. Wynik: /workspace/GRA/graf/styl-ascii.md
- FABUŁA / Scenarzysta: zakres fabularny M1 (Prolog + sektor „Ashfield Yards”) – GOTOWE, zaakceptowane przez Game Directora; sloty tekstowe przekazane Dialogom i Lore (start wcześniej niż faza 2). Wynik: /workspace/GRA/fabula/zakres-m1.md (na końcu pytania do Mechanik, Level Design, GRAF i UI)
Faza 1 – postęp: szkielet M0 (Silnik) i walka M0 (Gameplay) GOTOWE lokalnie w prog/game/ (tylko klawiatura, dotyk w toku u UI). Mechaniki v0.4 (decyzje GD naniesione; otwarte: HP bossa i nagrody kontraktów u Balansu, rozbieżności kodu u Gameplay). Styl ASCII v1.1 (drzwi `Π`, `+` = Med-Patch).
Faza 2 (uruchomiona wcześniej, 25.10.2026 ok. 20:55 czasu polskiego, na prośbę właściciela o przyspieszenie):
- DESIGN / Balans i Ekonomia: design/balans-m1.md – GOTOWE (gracz, 4 wrogów, boss 2400 HP, 12 właściwości, sklep, kontrakty, symulacja progresji); GD zatwierdził decyzje 1–5 (boss 20–32/1200 ms, półka ze sprzętem, brak łupu z wrogów kontraktu, Clear the Path na głęb. 3, pułap DPS 70–75) i zlecił ujście kredytów po ~90 min; tempo do bossa (pkt 6) czeka na właściciela
- DESIGN / Level Design: design/level-m1.md – GOTOWE (generator 3 głęb., Prolog, baza 29×10, arena 30×16; 1000 ziaren×7 OK; prototyp design/tools/levelgen_m1.py); ZATWIERDZONE przez GD (brama resetuje bossa i zostaje otwarta, szarża wzdłuż toru ≥450 ms, strefa przy szybie 10 pól, brak patroli)
- GRAF / Assety i Animacja: graf/assety-m1.md v1.0 – ZATWIERDZONE przez GD; LUZ 4 wdraża efekty
- FABUŁA / Dialogi i Lore: teksty ze slotów zakres-m1.md (sekcja 9); poprawka R1 gotowa, czeka na GD
- QA / Tester 1: test M0 – qa/raport-m0.md
- QA / Tester 2: plan testów M1 – qa/plan-testow-m1.md
- LUZ / Pracownik 1: zagadka Power Lines Line 1, 8 wariantów – design/zagadki-m1/ – GOTOWE (8 wariantów rozwiązywalnych, solver BFS); czeka na odpowiedzi Mechanik, GRAF i Lore, potem akceptacja GD
- LUZ / Pracownik 2: moduł kontraktów BASE w kodzie – GOTOWY lokalnie (prog/kontrakty-m1.md, 3 typy); otwarte pytania wysłane do Balansu, Mechanik, Silnika, Lore
- PROG / Gameplay: następnie 4 typy wrogów + umiejętności; PROG / Silnik: następnie generator strefy
- LUZ / Pracownik 3: sterowanie dotykowe z UI i Menu
- LUZ / Pracownik 4: etap 2 GOTOWY (lokalny commit 1c39a34, style.ts v1.3, 24 efekty, 224 testy zielone); efekty widoczne po hooku Silnika
AUDIO: poza M1.
- 25.10 21:16 QA M0: 7 PASS / 2 FAIL (QA-M0-002 unik, QA-M0-008 deadzone) / 3 nie do sprawdzenia; 9 błędów; QA-M0-003 (zapis walki) priorytet Silnika. styl-ascii §11 v1.4 zatwierdzony przez GD.
- 25.10 LUZ3: dotyk w emulacji telefonu – 129/150 testów e2e OK, wszystkie 12 punktów sterowania działa; 2 odstępstwa (contextmenu, odstęp od krawędzi <16 dp) u UI; niesprawdzone bez telefonu: safe area, wibracja, komfort (prog/zrzuty/e2e/RAPORT.md).
- 25.10 Mechaniki v0.5: zapowiedzi ≥ 450 ms, QA-M0-002/009 rozstrzygnięte, szarża i przywołanie drona, Z5/Z6/Z12/Z13; budżet sesji domyka się dla wszystkich kontraktów; R6 i samouczek czekają na GD.
- 25.10 21:3x Balans v1.1 (decyzje GD, ujście kredytów czeka na GD). QA plan v0.3: B3, D2/D6, B7 iPhone; otwarte R16 kredyty startowe, R18, R20 (Balans), R25/R27 (Mechaniki), brak tekstów TERM_03/06_TIP, TUT_*, RISK_* (Dialogi). Repo: prywatne (decyzja właściciela 21:20) + Cloudflare Pages; logowanie GitHub – reset hasła w toku.
- 25.10 21:37 Tempo do bossa: właściciel – ok. 3 h, jak teraz. LUZ2 kontrakty pod balans v1.1 (281/281). LUZ4 etap 2 pod assety v1.1 (8f6eae7); nowe zadanie: hook efektów i wpięcie kontraktów (uzgodnione z Silnikiem). GD: ujście kredytów zatwierdzone; S12/S15 czekają.
- 25.10 21:40 Repo ZAŁOŻONE: prywatne https://github.com/ziemniaczkisasuper/gra (puste, konto ziemniaczkisasuper). Hosting: Cloudflare Pages (do założenia). Push kodu: po zalogowaniu gh / tokenie – jeszcze nie.
- 25.10 21:43 Repo zmienione na PUBLICZNE (decyzja właściciela). Hosting wraca na GitHub Pages; Cloudflare niepotrzebny.
- 25.10 21:49 PUBLIKACJA (prośba właściciela): master=7ecc65c na github.com/ziemniaczkisasuper/gra, gra live na https://ziemniaczkisasuper.github.io/gra/ (gh-pages, build z kopią settings.ts + contracts/save.ts z drzewa roboczego). Deploy: /tmp/gra-deploy, vite build --base=/gra/. Silnik ma zacommitować te 2 pliki.
- 25.10 21:50 Mechaniki v0.5.2 GOTOWE (otwarte: S12 + Med-Patch 2/6 u GD, skrytka u Balansu v1.2, czasy zagadki/pułapka 03 u LUZ1). Level Design GOTOWE, czeka na GD. Silnik commituje settings.ts + contracts/save.ts i poda hash; wtedy odświeżę gh-pages i master.
- 25.10 21:51 GD zatwierdził level-m1.md. LUZ2: nowe zadanie src/inventory/ (plecak 12, AT RISK, Med-Patche, wypłata kontraktów, itemLost, save), uzgadnia z Silnikiem/Gameplay/UI.
- 25.10 21:51 Silnik: 066f27a naprawia build (321 testów). Czekam na commit z base './' przed kolejnym deployem (deploy zawsze z --base=/gra/).
- 25.10 21:57 LUZ4: hook FX c38fd61 (21 testów). Nowe: poprawka NEXT/auto-przejście ekranu śmierci + logika Power Lines w TS (src/puzzles/power-lines). QA2 retest v0.5.2 (plan v0.4): uwagi rozesłane do Gameplay, UI (R28–R30), LUZ1 (zagadki v0.4→v0.5, B3/R27 zablokowane), Dialogi (ID SKIP), Balans (R32: 2400 HP zostaje bez uzasadnienia).
- 25.10 21:58 Balans v1.2 GOTOWE (ujścia a/b/c, Lights M1_BASE_08 ×3, formuła z 1 zaokrągleniem, poprawki QA R16/R18/R20, tempo ok. 3 h). Otwarte: Issue 2/3 u GD, Issue Mk2 + bramka Lights I u Mechanik.
- 25.10 21:59 FEEDBACK WŁAŚCICIELA po prototypie: nie lubi broni krótkodystansowych; celowanie trudne (trzeba iść do wroga) – chce osobnej gałki do ataku (twin-stick). Przekazane GD (decyzja), Mechanikom (spec), UI (układ). Priorytet przed kolejną publikacją.
- 25.10 22:00 Dialogi: ID SKIP spójne (2 okna), 24 TIP ≤80 zn., zatw. GD. Balans R32: 2400 HP zostaje; skrytka 30/40/50/60; Issue 2/3 zatw. GD. Przekazane QA2.
- 25.10 22:01 DECYZJA GD (twin-stick): prawa gałka = kierunek ataku, bez bump-attack; Issue wręcz z zamachem łukiem 2 pola/~90°/obszarowo; broń dystansowa jako 2. typ broni od głęb. 1. Mechaniki: design/wariant-twin-stick.md. Rozesłane do Balansu (v1.3), Gameplay, UI.
- 25.10 22:02 Silnik: HEAD gotowy do wgrania (base './' 1dfd474, QA 011/012, font v1.3). Wstrzymane: następna publikacja razem z twin-stick, po zgodzie właściciela.
- 25.10 22:18 WSTRZYMANIE (prośba właściciela, oszczędność): aktywni tylko Mechaniki (spec twin-stick), Gameplay, Silnik (aim), UI (2 gałki). Wstrzymani: GD (wybudzić przy decyzji), Balans, LD, Scenarzysta, Dialogi, GRAF×2, Audio, QA×2, LUZ1–4. Zakres demo: twin-stick + łuk Issue; broń dystansowa po demo. Właściciel prosi o publikację obecnej wersji – w toku.
- 25.10 22:24 PUBLIKACJA 2: Pages = build 2963c22 (404 testy), master GitHub = a0d6209 (docs/ z dokumentami, zredagowane nazwy kont). Silnik ma wciągnąć a0d6209.
- 25.10 22:29 DECYZJA WŁAŚCICIELA: od teraz sam koduje w Cursorze. PROG (Gameplay, Silnik, UI) wstrzymane po lokalnym commicie. Mechaniki kończą tylko wariant-twin-stick.md, potem pauza. Producent: wypchnąć ostatni kod + spec do docs/ na GitHub.

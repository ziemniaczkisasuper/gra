# Level Design M1 – decyzje robocze (DESIGN / Level Design, 25.10.2026)
Odpowiedzi na pytania 8–9 z `design/mechaniki-m1.md` (2.17). Odległości to zawsze długość ścieżki (BFS po polach przechodnich), nie linia prosta.

## 1. Terminale Power Lines
- Rozkład przyjęty: głęb. 1 Outskirts: `M1_TERM_04, 07, 08`; głęb. 2 Solar Fields: `01, 02, 05`; głęb. 3 Rail Depot: `03, 06`. Pasuje tematycznie (farma solarna, pompy i dok dronów na polach; hala i przejazd w depot; osiedle, sklep i bunkier na obrzeżach).
- Kolejność trudności zagadek w głęb. 1: 04 (najłatwiejsza, samouczek) < 07 < 08. W głęb. 2: 05 < 01 < 02. W głęb. 3: 06 < 03.
- Na poziom: dokładnie 1 terminal Power Lines. Instancja dostaje pierwszy nierozwiązany wariant tej głębokości wg kolejności wyżej; gdy wszystkie rozwiązane, wariant „ponownie zestrojony” (pkt 3).
- Położenie: 25–40 pól od szybu `<`, w pomieszczeniu z 1–2 wejściami (nie w korytarzu). Żaden wróg nie startuje bliżej niż 8 pól od terminala.

## 2. Nory Zbieraczy, szyb, rozmiary, wrogowie
- Nory: punkty w ścianie; 2 na poziom w głęb. 1, 3 w głęb. 2–3. Min. 30 pól między norami, min. 10 pól od szybu i wejścia.
- M1: odzysk zwłok usunięty (pełna utrata), nory są tylko miejscami spawnu Zbieraczy, bez gwarancji odległości od zwłok. Reguła „najbliższa nora ≥ 20 pól od zwłok” wraca w M2 z ulepszeniem Recovery Beacon.
- Szyb `<`: dokładnie 1, odległość od wejścia 25–40 / 30–50 / 35–55 pól (głęb. 1/2/3), żeby głębsze poziomy realnie wydłużały drogę powrotu.
- Zejście `>`: 40–60 / 45–65 pól od wejścia (głęb. 1/2), w głęb. 3 zamiast `>` brama areny 50–70 pól od wejścia. `>` (lub brama) min. 20 pól od szybu `<`, żeby wybór „dalej czy wracać” był realnym rozejściem dróg.
- Puste zwłoki z poprzedniej śmierci jako dekoracja: nie w M1 (przy pełnej utracie sugerowałyby możliwość odzysku), wraca do M2 razem z Recovery Beacon.
- Kontrakty BASE tylko na głębokościach z przystankiem windy; Clear the Path: wrogowie kontraktu 12–20 pól od szybu, zgodne z zasadą „brak wrogów do 10 pól od szybu na starcie”.
- Rozmiary 64×40 / 72×44 / 80×48 przyjęte. Cel: 40–50% pól przechodnich.
- Wrogowie 8–10 / 12–14 / 14–16 przyjęci. Brak wrogów w promieniu 10 pól od wejścia i szybu przy starcie poziomu (alarm windy i tak ich ściąga).
- Arena Rail Guardiana (głęb. 3): osobne pomieszczenie ok. 28×14 za bramą, 2 proste tory przez całą długość (pod szarżę), ściany na końcach torów (ogłuszenie po uderzeniu), dodatkowy szyb otwierany po walce.

## 3. Restore Relay po rozwiązaniu wszystkich wariantów
- Kontrakt zostaje w puli jako „ponowne zestrojenie”: ten sam szablon zagadki wariantu, nowe liczby z generatora (zakresy parametrów podaje autor zagadek dla każdego wariantu).
- Nagroda: 25 kr + 2 Copper (Balans v1.1, mechaniki v0.5.2), bez fragmentu sieci (sieć na tej głębokości jest już pełna). Ponowne zestrojenie startuje osobno dla każdej głębokości, po wyczerpaniu jej wariantów. Kontrakt po śmierci wraca na tablicę z wyzerowanym postępem. Waga w puli kontraktów ×0,5, żeby nie dominował nad Data Core i Clear the Path.
- Nagroda wg Balansu v1.1 (25 kr + 2 Copper); waga ×0,5 do potwierdzenia.

## 4. Prolog i szyb (odpowiedź na mechaniki-m1.md v0.5, §2.19)
- Układ Prologu przyjęty: zwykły poziom głęb. 1 ze stałym terminalem 04 i wstawkami na ścieżce wejście → terminal (Scrapper 12–18 pól, Curfew Guard w pokoju ≥ 5×5 na 20–30 polu, skrzynia za Guardem, para Scrapperów 30–40 pól, terminal 04).
- Warunek LD dla Prologu: terminal 04 leży 45–60 pól od wejścia (ścieżka BFS), żeby wszystkie wstawki zmieściły się przed nim, a para Scrapperów była min. 8 pól od terminala. Szyb `<` nadal 25–40 pól od wejścia i 25–40 od terminala.
- Skrzynia „za Guardem”: w tym samym pokoju po przeciwnej stronie niż wejście z trasy albo w ślepej wnęce tuż za pokojem, tak żeby gracz nie mógł jej zabrać bez przejścia obok Guarda.
- Szyb `<`: min. 2 przechodnie pola sąsiednie (cel 3), nigdy w korytarzu o szerokości 1, bo `<` jest nieprzechodnie dla wrogów i drona i nie może przecinać łączności mapy. Walidacja: po wstawieniu `<` mapa nadal spójna.
- Wrogowie nie odradzają się w trakcie poziomu w M1 (decyzja GD).

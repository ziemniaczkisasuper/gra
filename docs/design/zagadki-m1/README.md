# design/zagadki-m1: zagadki terminali M1

Autor: LUZ / Pracownik 1, 25.10.2026. **Wersja: v0.5.1** (dokument `power-lines-line1.md` v0.5.1, dane `power-lines-line1.json` `"version": "0.5.1"`, `schema_version` 2). Status: propozycja; decyzje Mechaników M1–M9 wprowadzone (do akceptacji GD), reguła sumowania zatwierdzona przez GD 25.10.2026.

**Zasada procesu (GD, 25.10.2026):** każda zmiana zasad zagadki wymaga akceptacji GD **przed** zmianą JSON. O każdej zmianie układów siatek lub zasad trzeba **wcześniej** powiadomić GD oraz Dialogi i Lore (TIP-y są przypisane do siatek).

**Changelog:** v0.5.1 – bez zmian siatek i reguł; `consumers[]` bez `name`/`type_text_id` (nazwy urządzeń w M2, decyzja GD), panel `A 3/4`, flagi `rewrite_needed` zdjęte, `M1_TERM_LEG_SUM` w tekstach. v0.5.0 – reguły wg głębokości, nowe 04/07/08 (sumowanie), przenumerowanie 05/01/02, 03 bez pułapki [4,5] i bez urządzenia [1,6], 06 ze startem uziemienia ON (pełny opis: dokument, „Changelog”).

## Pliki
| Plik | Co to jest |
|---|---|
| `power-lines-line1.md` | Zasady „Power Lines — Line 1”: znaki, przepływ, reguły wg głębokości, sterowanie, podgląd na żywo i pomoc, wyniki, legenda, 8 wariantów ze spoilerami i czasami, schemat JSON, integracja PROG/UI, punkty dla Mechaników, GD i Dialogi i Lore. |
| `power-lines-line1.json` | Dane 8 wariantów `M1_TERM_01–08` (`order` 1–8): siatka, `sources`, `fuses`, `consumers` (obiekty urządzeń), `hint.text_ids` (3 stopnie), `affix_start_hint`, rozwiązanie, metryki z czasem, parametry ponownego zestrojenia. Źródło prawdy dla PROG (`src/data/`). |
| `validate.py` | Walidator, solver i generator (Python 3.8+, bez zależności). Referencja reguł: `Puzzle.simulate()` (SEND) i `Puzzle.preview()` (liczby na żywo). |

## Uruchomienie
```
cd /workspace/GRA/design/zagadki-m1
python3 validate.py                              # pełna walidacja + teksty + tabela (czas mediana/p80)
python3 validate.py --show M1_TERM_03            # start, panel na żywo i rozwiązanie
python3 validate.py --selftest                   # testy reguł
python3 validate.py --generate M1_TERM_06 --count 5 --seed 7   # instancje ponownego zestrojenia (JSON)
python3 validate.py --gen-test 1000 --seed 2026  # 1000 losowań na wariant, każda instancja sprawdzona solverem
python3 validate.py --texts ścieżka.md           # inny plik tekstów (domyślnie ../../fabula/teksty-m1-en.md)
```
Kod wyjścia 0 = brak błędów; 1 = błędy (`BŁĄD: ...`). `UWAGA: ...` nie blokuje (np. podpowiedzi do przepisania, czas poniżej celu, ID w `pending_text_ids`).

## Co sprawdza walidator (szczegóły: dokument, sekcja 10)
1. Reguły na małych siatkach (podział, TRIP, uziemienie, limit, urządzenie na drodze, zwarcie, sumowanie z kilku źródeł, podgląd, `consumer_type`, odstęp przełączników).
2. Wersja i zgodność JSON z decyzjami Mechaników (`depth_elements`, `time_target_s`, `help`).
3. Siatka: ≤ 9×9, połączenia, **odstęp przełączników Czebyszew ≥ 2**, **≤ 4 urządzenia** (`POWER_LINES_MAX_RECEIVERS`), **elementy dozwolone na głębokości**.
4. `consumers[]`: `id` (A–D w kolejności czytania), `at`, `need`, `consumer_type` (end/mid zgodnie z symulacją, mid od głęb. 3). Pola nazw/typów (`name`, `type_text_id`…) to błąd „pole M2”.
5. Rozwiązanie, solver BFS, przegląd stanów, `expected`, czas wobec celu i limitów (mediana/p80), krzywa w obrębie głębokości, `affix_start_hint` w rozwiązaniu.
6. Podpowiedzi: `hint.text_ids` = 3 stopnie; tokeny i `valid_if` dla każdego stopnia.
7. Ponowne zestrojenie: skale, stopnie podpowiedzi, `min_moves_at_least` ≥ reguła głębokości; generator potwierdza każdą instancję solverem.
8. Teksty: każde ID musi istnieć w `fabula/teksty-m1-en.md` (nieznane = błąd), tokeny w każdym stopniu TIP, uwaga o słowach typów urządzeń w TIP-ach.

## Dodanie lub zmiana wariantu
Najpierw akceptacja GD (zmiana zasad) i powiadomienie GD oraz Dialogi i Lore (zmiana układu). Potem zmień siatkę w JSON (przełączniki co najmniej 2 komórki od siebie, także po skosie; najwyżej 4 urządzenia; tylko elementy z `depth_elements` swojej głębokości), uzupełnij `sources`, `fuses` i `consumers`, uruchom `validate.py` i przepisz metryki do `expected` (walidator wypisze różnice).

# Assety i animacje M1 – efekty ze znaków (dane dla PROG)

| | |
|---|---|
| **Wersja** | v1.6 |
| **Data** | 2026-10-25 |
| **Autor** | [GRA][GRAF] Assety i Animacja |
| **Źródła** | `graf/styl-ascii.md` v1.1 (paleta, znaki, §9 telegraf). W trakcie pracy pojawiła się v1.2 (§10: nazwy rzadkości Salvaged / Tuned / Grid-Grade, `c` tylko w M0, bez `C`). Sprawdziłem: paleta i znaki bez zmian, dane są zgodne także z v1.2; `design/mechaniki-m1.md` **v0.5** (25.10.2026; v1.0 powstała na v0.4; sprawdzona też v0.5.1 – zmiany tylko Level Design, bez wpływu na dane; dla v1.2 §2.9 sprawdzone w **v0.5.2** – zawiera R6 A, zgodne z danymi); `fabula/teksty-m1-en.md` §12.1 (teksty ekranu śmierci, v1.2); pomocniczo: `prog/stos-techniczny.md`, `prog/walka-m0.md`, `prog/sterowanie.md`, `prog/game/src/data/style.ts` (format `GlyphStyle`), `design/level-design-m1.md`, `fabula/zakres-m1.md`, `fabula/teksty-m1-en.md` **v1.4:** `styl-ascii.md` v1.6 §13, `mechaniki-m1.md` v0.5.2 §2.11 (szarża tylko pozioma), `design/level-m1.md` §4 i §10. **v1.5:** `mechaniki-m1.md` v0.5.2 (§1.3, §2.3, l. 38), `fabula/teksty-m1-en.md` (`M1_GEAR_ISSUE_POLE*`, `_SUIT_2*`), `plan-produkcji.md` (decyzja GD twin-stick 25.10 22:01), `design/balans-sim/twinstick.py`, commit Silnika 24c1276; `design/wariant-twin-stick.md` – **brak pliku**. **v1.6:** odpowiedzi Mechanik z 25.10 na S20, S21 i S23 (trafią do `design/wariant-twin-stick.md` v0.6). |
| **Status** | **zatwierdzony v1.0; v1.1 – poprawki wg Mechaniki v0.5; v1.2 – decyzje GD (S12, S15/R6 A) i teksty Lore (S13); v1.3 – przegląd UI, poprawki Mechanik i Pracownika 4; v1.4 – szarża tylko pozioma (GD), decyzje Concept i Styl v1.6; v1.5 – Issue Pole (twin-stick), ramka WASD (czeka na CiS); v1.6 – odpowiedzi Mechanik S20/S21/S23** (v1.0 zatwierdzona przez Game Directora 2026-10-25) |
| **Odbiorcy** | PROG / Gameplay (walka, umiejętności, boss), PROG / Silnik (renderer), PROG / UI i Menu (nakładki, ekran bazy), DESIGN / Mechaniki (sprawdzenie czasów) |

**Changelog**
- **v1.6 (2026-10-25), odpowiedzi Mechanik (S20, S21, S23):**
  - `fx_player_pole_swing`:
    - `status`: potwierdzone przez Mechaniki, formalnie w `wariant-twin-stick.md` v0.6;
    - `triggerPayload`: doszło `hitIds`;
    - nowe `cellRules`: zasłanianie liczy kod gry, FX dostaje gotowe `cells`;
    - `frames`: 3 × 50 ms = 150 ms, bez osobnej klatki gaśnięcia; `durationMs` 150, `SWING_FX_MS` 150, `reduceMotion` 150 ms;
    - `arcRule` doprecyzowane; nowe `weaponRange`; `params.timingNote` ([R]);
    - `cellsByDir` sprawdzone dla 8 kierunków, zgodne z regułą (bez zmian);
  - `fx_boss_rail_guardian.states.chargeTelegraph.directionLock` (nowe): kierunek szarży blokowany na starcie zapowiedzi;
  - §14: S20, S21 i S23 zamknięte.
- **v1.5 (2026-10-25), Issue Pole i twin-stick:**
  - nowy blok `fx_player_pole_swing` (sekcja 3a): zamach łukiem na 2 pola, 90°, 8 komórek na każdy z 8 kierunków (`cellsByDir`), przemiatanie w 3 fazach po 50 ms plus 50 ms gaśnięcia (200 ms), `#BDEBFF` → `#56606B`, wariant Reduce motion. Status: **zależne od specyfikacji Mechanik v0.6** (S21);
  - Issue Pole / Pole II / Suit II: nie potrzebują nowych glifów. Styl §5 ma tylko glify kategorii (`/` broń, `[` pancerz), a plik nie ma sprite'a Batona ani ikon pojedynczych przedmiotów. Nie było też żadnego ID `BATON` do usunięcia;
  - nowy blok `ui_tutorial_key_frame` (sekcja 10b): wariant `arrows` (zatwierdzony, aktywny) i `wasdTwinStick` ([W] [A] [S] [D], `#8B98A5`, bez pogrubienia, na `hintBg`, strzałki tylko w podglądzie celowania), który **czeka na CiS** (S22);
  - §14: nowe punkty S21–S23; §15 pkt 2: dopisek o wariancie WASD.
- **v1.4 (2026-10-25), szarża bossa (GD) i decyzje Concept i Styl v1.6 §13:**
  - szarża tylko pozioma (mechaniki v0.5.2 §2.11, `level-m1.md` §10 pkt 2), wariant pionowy usunięty:
    - nowe `fx_boss_rail_guardian.states.chargeTelegraph.band`: cały tor, czyli 2 rzędy `=` od ściany do ściany, stałe `x` przez 900 ms;
    - `states.charge.band.zone`: 2 rzędy toru od bossa do ściany w kierunku szarży;
    - `chargeTelegraph.trigger`: zapowiedź startuje, gdy boss stanie na torze;
    - params: `BOSS_CHARGE_SEEK_TRACK`, `BOSS_CHARGE_AXIS`, `BOSS_CHARGE_BAND_ROWS`;
    - `fx_telegraph.timelines["900"]` oznaczona jako nieużywana;
  - `ui_power_lines_receiver_label` zatwierdzony przez CiS: litera bez pogrubienia, `#8B98A5`, na `#3DDC97`/`#FF5FC8` w `#0B0F14`, przy komórce < 30 px etykieta nad siatką;
  - kolory:
    - `#121821` jest w palecie (pełny kolor `panelBg` / `controlBg`);
    - `fx_common.palette` ma nowe `uiPanelBg` i `hintFrame`;
    - nowe `fx_common.uiColors`;
    - `validate.py` sprawdza `rgba()` i paletę `fx_common`;
  - baza: zamiast „NIEUŻYWANE W M1” jest status „zależne od decyzji Producenta (hub vs mapa)”, nowy punkt S19. `fx_base_print` ma 2 warianty: `map` i `hub`;
  - §15: zaktualizowane punkty 2, 4 i 6.
- **v1.3 (2026-10-25), przegląd GRAF dla PROG / UI i Menu, poprawki Mechanik (v0.5.2) i LUZ Pracownik 4:**
  - S17 i S18 zamknięte (teksty §12 zatwierdzone przez GD, format `-{dmg}`; `M1_DEATH_01_HAZ` nieużywane w M1);
  - `fx_death_screen`: NEXT działa **tylko po tapnięciu albo Enterze**, liczy się nowe naciśnięcie po 1500 ms. Spacja, J i ATK nie działają (§2.14a M8). Nowe pola `input` i `autoPause`. Auto-przejście po 5000 ms zostaje;
  - `fx_szum_glitch`: losowanie z osobnego kosmetycznego RNG, nie z PRNG gry (pole `rng`);
  - payloady:
    - `fx_telegraph.triggerPayload.attackerId` → `entityId` (konwencja z `core/events.ts`);
    - nowe `fx_common.payloadConvention`;
    - `killerHighlight.anchorRules` opisane polami `killer.entityId` / `killer.strikeOrigin`;
    - tokeny `M1_DEATH_02` z `getCombatDeath().lastHits`;
  - baza = menu-hub:
    - `fx_base_print` to teraz ekran przejścia 600 ms przed hubem (warstwa `screen`);
    - `fx_base_lift_arrive`, `fx_base_terminal_new`, `fx_base_cable_light` i `screen_base_m1` mają pole `status: NIEUŻYWANE W M1`;
  - nowy blok `ui_power_lines_receiver_label` (sekcja 10a): litery odbiorników w oknie terminala, do akceptacji Concept i Styl;
  - nowa sekcja 15: przegląd GRAF dla UI (6 punktów).
- **v1.2 (2026-10-25), decyzje GD i teksty Lore:**
  - S12 zatwierdzone przez GD. Przypadki podświetlenia zabójcy zapisane w danych: `fx_death_player.parts[killerHighlight].anchorRules` (zabójca żyje / zginął w tym samym ticku / nieznany);
  - format (prośba LUZ Pracownik 4): `fx_boss_rail_guardian.states.charge.durationMs` = samo `"untilWallHit"`, komentarz o 2800 ms przeniesiony do `note`; `fx_evac_shaft.params.unitNote` i `params.decision` przeniesione do `fx_evac_shaft.note`;
  - S15, R6 opcja A (GD):
    - alarm przy **przyjeździe** windy, promień 12, z szarym `!` (`fx_alert`) i `M1_SYS_05`;
    - wezwanie **1000 ms**, pasek 10 × 100 ms;
    - ponowne wezwanie po **5 s**, odliczanie 5 s;
    - nowy parametr `EVAC_ALERT_MOMENT: "arrival"`; zgodne z `mechaniki-m1.md` v0.5.2 (S16 zamknięte);
  - S13, teksty Lore (`teksty-m1-en.md` §12.1):
    - przycisk ekranu śmierci = `M1_DEATH_BTN` („NEXT”) zamiast tekstu CONTINUE;
    - teksty `M1_DEATH_01` / `M1_DEATH_02`;
    - reguły dla PROG: ukryć linię przy nieznanym zabójcy, pomijać puste sloty z separatorem, ukryć linię przy 0 trafień.
- **v1.1 (2026-10-25), poprawki wg `mechaniki-m1.md` v0.5:**
  - zapowiedzi: minimum 450 ms. Linia czasu 400 ms zastąpiona przez 450 ms (`s`, `d`, drony bossa). Linia 500 ms oznaczona jako tylko M0 (`fx_telegraph`);
  - śmierć gracza: podświetlony zabójca w 500 ms zatrzymania. Ekran śmierci ma `M1_BASE_04`, `M1_DEATH_01` i `M1_DEATH_02`; 1500 ms bez pominięcia, potem CONTINUE, samo przejście po 5000 ms, dalej wydruk 600 ms. Stałe 3000 ms usunięte (Z6);
  - boss, szarża: 100 ms na pole i pas 2 / 3 pola świecący przez zapowiedź i cały przejazd; obrażenia raz (Z12). Przywołanie: 600 ms bez `!`, nieprzerywalne, boss podatny bez ×2; drony ≥ 4 pola od gracza, 500 ms aktywacji z szarym ALERT 300 ms, zapowiedź 450 ms (Z13). Odnowienie zamachu 900 → **1200 ms** (Balans w v0.5);
  - ewakuacja (zgodność z v0.5 §2.9): wejście do kabiny i odjazd 1000 ms (`LIFT_DEPART_MS`) zamiast 400 ms. Ekran przejazdu 2000 ms (`LIFT_RIDE_MS`, `M1_BASE_05`, pominięcie po 500 ms), w obie strony;
  - Shock Pulse: opisy „pierścień” poprawione na „obszar 5×5” (S9); klucze JSON bez zmian;
  - poprawki od LUZ Pracownik 4 (wdrożenie, lista `FX_SPEC_DIFFS` w `src/data/fx-params.ts`), rozstrzygnięte według v0.5:
    - `BOSS_SUMMON_AT_HP_PCT` → `BOSS_SUMMON_HP_PCT`; dopisane `BOSS_CHARGE_TICKS_PER_CELL`, `BOSS_SUMMON_MS` i `SUMMON_ACTIVATE_MS`;
    - `EVAC_ARRIVE_MS` / `EVAC_HOLD_MS` / `EVAC_RECALL_COOLDOWN_MS` → `EVAC_ARRIVE_S` / `EVAC_HOLD_S` / `EVAC_RECALL_COOLDOWN_S` (w sekundach);
    - podświetlenie zabójcy: 3 białe błyski w 500 ms, a przy „Reduce motion” stała biała komórka;
  - §14: Z6, Z12, Z13 rozstrzygnięte; S7 i S9 zamknięte; Z5 potwierdzone.
- v1.0 (2026-10-25): pierwsza wersja, zatwierdzona przez GD.

Zakres: 9 elementów z zadania Producenta – zapowiedź ciosu, trafienie, śmierć, Dash, Shock Pulse, Helper Drone (ostateczna nazwa **Buddy Drone**, GD 25.10.2026), ewakuacja, klatki bossa 3×2, układ ekranu bazy. Wszystko to **dane** (JSON), bez obrazków. Nie zmieniam plików innych działów; to, co PROG ma podmienić u siebie, jest w sekcji 13.

## 0. Jak PROG to wczytuje

**Format: JSON.** W `/workspace/GRA` nie ma ustalonego formatu danych graficznych. PROG trzyma dane w `src/data/*.ts`, ale obecny `tsconfig.json` (TS 6, `moduleResolution: bundler`) importuje pliki `.json` bez zmian konfiguracji (sprawdzone kompilacją `tsc`). Każdy blok poniżej to samodzielny obiekt JSON z polem `id`. Proponuję zapis jako `src/data/fx/<id>.json` albo złączenie w jedną tablicę `src/data/fx-m1.json`. Wszystkie bloki sprawdziłem skryptem: parsują się (`python -m json.tool`), kolory należą do palety, a suma klatek zgadza się z czasem trwania (sekcja 12).

**Komórka klatki = `GlyphStyle` z `src/data/style.ts` + przesunięcie:**
`{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}`
- `dx`, `dy` – przesunięcie w komórkach od kotwicy (`anchor`). Oś y w dół.
- **Pominięte pole = dziedziczone** z tego, co leży pod spodem (teren → przedmiot → encja → wcześniejsze efekty). Np. klatka tylko z `bg` zmienia tło, a znak zostaje (gracz `@` na zamrożonym polu).
- `"ch": "{glyph}"` – PROG podstawia własną literę encji (np. `d`, `h`, `s`, `t`), gdy encji już nie ma w logice (śmierć).
- Czasy w ms, wielokrotności 50 (1 tick = 50 ms, mechaniki 1.1). Renderer może je odtwarzać na `requestAnimationFrame`, ale **logika nigdy nie czeka na animację** (wszystkie efekty są czysto wizualne).

**Pola elementu:**

| Pole | Znaczenie |
|---|---|
| `id` | unikalny identyfikator |
| `trigger` | zdarzenie logiki, które startuje efekt (nazwy jak w `combat/state.ts` M0: `enemyHit`, `playerHit`, `enemyMiss`, `enemyKilled`, `playerDied`; nowe dla M1 opisane w elemencie) |
| `endsOn` | zdarzenia, które przerywają efekt przed końcem |
| `durationMs` | liczba albo nazwa parametru z mechaniki (np. `"attackWindupMs"`), gdy czas zależy od wroga |
| `loop` | `true` = klatki powtarzane do końca `durationMs` / do `endsOn`; `false` = raz |
| `layer` | warstwa rysowania (blok `fx_common`) |
| `priority` | kolejność w tej samej warstwie: wyższy rysowany później (wygrywa) |
| `anchor` | punkt odniesienia `dx/dy` (blok `fx_common`) |
| `frames` | lista klatek `{"ms": ..., "cells": [...]}`; `"hold": true` = jedna klatka przez cały czas efektu |
| `reduceMotion` | zachowanie przy opcji „Reduce motion” (styl §6): `"same"`, `"skip"` (efekt nie jest rysowany) albo własne `frames` |
| `params` | liczby z mechaniki, z których wynikają czasy (do kontroli przez QA; źródłem prawdy zostaje `src/data/` mechaniki) |

## 1. Wspólne: warstwy, kotwice, paleta, glify bazowe
Paleta to dokładnie kolory z `styl-ascii.md` v1.1 (§3, §4, §9). Żaden efekt nie używa innego koloru (sprawdza to skrypt z sekcji 12).


```json
{
  "id": "fx_common",
  "schema": "graf-fx/1",
  "tickMs": 50,
  "palette": {
    "background": "#0B0F14",
    "floor": "#3B4552",
    "wall": "#8B98A5",
    "rubble": "#6B7280",
    "vegetation": "#7D7A4F",
    "tracks": "#56606B",
    "liquid": "#9A7BFF",
    "player": "#FFFFFF",
    "playerHalo": "#1F3B57",
    "enemy": "#FF5FC8",
    "playerShot": "#BDEBFF",
    "warning": "#FFE14D",
    "energy": "#FFE14D",
    "safe": "#3DDC97",
    "safeCellBg": "#0F3326",
    "descent": "#C9D1D9",
    "descentCellBg": "#2A2F36",
    "crate": "#B08850",
    "rarity1": "#C9D1D9",
    "rarity2": "#56B4E9",
    "rarity2CellBg": "#0E2A3F",
    "rarity3": "#FFB000",
    "rarity3CellBg": "#3A2A00",
    "telegraphTargetBg": "#4A1240",
    "bossCellBg": "#3D0F2E",
    "dataCoreCellBg": "#3A3410",
    "sectorDark": "#2A323C",
    "floorHighContrast": "#5A6573",
    "uiPanelBg": "#121821",
    "hintFrame": "#8B98A5"
  },
  "layers": [
    {"name": "terrain", "order": 0, "note": "PROG: teren i przedmioty (poza tym plikiem)"},
    {
      "name": "ground",
      "order": 10,
      "note": "ślady, rozbłyski obszaru, smugi; pod encjami: encja rysuje swój znak na wierzchu, a tło efektu zostaje, jeśli encja nie ma własnego tła"
    },
    {"name": "entity", "order": 20, "note": "PROG: gracz, wrogowie, dron, boss (glify bazowe z bloku glyphs_m1)"},
    {
      "name": "cell",
      "order": 30,
      "note": "nadpisuje podane pola komórki nad encją (zapowiedź, cios, trafienie, stany)"
    },
    {
      "name": "overlay",
      "order": 40,
      "note": "napisy nad komórkami, nie zajmują pola: !, liczby, miss, paski, odliczanie"
    },
    {"name": "screen", "order": 50, "note": "pełny ekran: śmierć, przejście do bazy"}
  ],
  "anchors": {
    "entity": "lewy górny róg encji (boss 3×2: komórka '/')",
    "targetCell": "zamrożone pole celu (logika)",
    "zone": "każda komórka listy podanej przez logikę (np. 3×3 zamachu, pas szarży, obszar 5×5 Shock Pulse bez ścian i bez pól poza linią wzroku)",
    "path": "każda komórka listy ścieżki (Dash: pole startu i pola pośrednie, bez pola końcowego)",
    "aboveEntity": "nakładka nad komórką encji (boss: nad środkową górną komórką)",
    "screen": "cały ekran gry"
  },
  "priorities": {
    "idle": 10,
    "statusShock": 40,
    "attackerTelegraph": 50,
    "telegraphTarget": 60,
    "strike": 70,
    "hitFlash": 80,
    "death": 90
  },
  "reduceMotionRule": "wyłącza miganie, pulsowanie i zakłócenia Szumu (styl §5–6); wtedy obowiązuje wariant reduceMotion elementu",
  "payloadConvention": {
    "source": "prog/game/src/core/events.ts (FxTriggerEvents) i walka-m1.md §8; mechaniki v0.5.2 nie nazywa pól zdarzeń",
    "entityId": "encja, do której kotwiczy się efekt (atakujący w zapowiedzi, trafiony wróg, dron, boss – lewy górny róg)",
    "cells": "lista komórek strefy / pasa / ścieżki (FxCell {x, y}, siatka świata)",
    "cell": "jedna komórka (szyb, terminal)",
    "killer": "{entityId?, strikeOrigin: FxCell[]} – zabójca (fx_death_player)",
    "alertedIds": "liftArrived: id wrogów ściągniętych alarmem (fx_alert na każdym)",
    "kind": "rodzaj ataku w telegraphStart / bossTelegraph",
    "windupMs": "czas zapowiedzi atakującego",
    "dmg, crit": "trafienia",
    "renamed_v1_3": "fx_telegraph.triggerPayload.attackerId → entityId"
  },
  "uiColors": {
    "source": "styl-ascii.md v1.6 §13 pkt 3",
    "panelBg": "#121821 (pełny kolor, bez rgba)",
    "controlBg": "#121821 (pełny kolor, bez rgba)",
    "hintBg": "rgba(11,15,20,0.9) z ramką #8B98A5",
    "hudBg": "rgba(11,15,20,0.9)",
    "tutDim": "rgba(11,15,20,0.72)",
    "textBackdrop": "rgba(11,15,20,0.86)",
    "pulse": "#3DDC97",
    "controlActiveBg": "rgba(61,220,151,0.18)",
    "rule": "rgba dozwolone tylko na kolorach z palety (validate.py to sprawdza)"
  }
}
```


```json
{
  "id": "glyphs_m1",
  "note": "glify bazowe encji i obiektów używanych przez efekty (styl §4 i §9). PROG ma je już częściowo w style.ts",
  "player": {"ch": "@", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true},
  "enemies": {
    "d": {"ch": "d", "fg": "#FF5FC8", "bold": true, "name": "Panel Drone"},
    "h": {"ch": "h", "fg": "#FF5FC8", "bold": true, "name": "Curfew Guard"},
    "s": {"ch": "s", "fg": "#FF5FC8", "bold": true, "name": "Scrapper"},
    "t": {"ch": "t", "fg": "#FF5FC8", "bold": true, "name": "Line Sentry"}
  },
  "buddyDrone": {"ch": "¤", "fg": "#3DDC97", "bg": "#1F3B57", "bold": true, "asciiFallback": "0"},
  "wreck": {"ch": "%", "fg": "#C9D1D9"},
  "playerCorpse": {"ch": "%", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true},
  "evacShaft": {"ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true},
  "enemyProjectile": {"ch": "•", "fg": "#FF5FC8", "asciiFallback": "°"}
}
```

## 2. Zapowiedź ciosu (telegraph)

Źródło: styl §9 (trzy sygnały naraz) i mechaniki 1.7, 2.10, 2.11. **Czas zapowiedzi = `attackWindupMs` atakującego = okno reakcji gracza.** Efekt startuje w ticku startu zapowiedzi (`telegraphStart`) i kończy się w ticku rozstrzygnięcia ciosu. Shock Pulse przerywa go natychmiast (`telegraphInterrupted`).

| Atakujący | Zapowiedź (ms) | Linia czasu pola celu |
|---|---|---|
| `s` Scrapper, `d` Panel Drone, drony przywołane przez bossa | 450 | `450` |
| Scrap Crawler (tylko M0, prototyp) | 500 | `500` (w M1 nieużywana) |
| `h` Curfew Guard | 600 | `600` |
| `t` Line Sentry (dystans) | 700 | `ranged.700` |
| Boss: zamach 3×3 | 800 | `800` (kotwica `zone`, 9 pól) |
| Boss: szarża (cała linia toru) | 900 | `900` (kotwica `zone`, linia toru) |

Zasada linii czasu (taka sama dla każdego czasu): `x` miga co **100 ms**, zaczynając od fazy „widać `x`”. W ostatnich **150 ms** miganie przyspiesza do **50 ms**. Faza „bez `x`” pokazuje to, co stoi na polu (np. `@`), na tle `#4A1240`. Gdy gracz zejdzie z pola, `x` zostaje do końca zapowiedzi. Zapowiedzi nie skracają się z głębokością (2.11), więc tabela jest kompletna dla M1. **Reguła v0.5: każda zapowiedź ≥ 450 ms (9 ticków).** Linia 450 ms: `x` 100 → pusto 100 → `x` 100 → (ostatnie 150 ms) pusto 50 → `x` 50 → pusto 50 = 450 ms. Przy szarży pas świeci dalej przez cały przejazd (sekcja 9).

```json
{
  "id": "fx_telegraph",
  "trigger": "telegraphStart",
  "triggerPayload": {
    "entityId": "id atakującego (boss: bossTelegraph.entityId)",
    "kind": "melee | ranged | bossSwing | bossCharge",
    "cells": "pole celu (1 komórka) albo strefa / pas (boss)",
    "windupMs": "attackWindupMs atakującego"
  },
  "endsOn": ["strikeResolved", "telegraphInterrupted", "attackerDied"],
  "durationMs": "attackWindupMs",
  "loop": false,
  "params": {
    "TELEGRAPH_BLINK_MS": 100,
    "TELEGRAPH_FAST_LAST_MS": 150,
    "TELEGRAPH_FAST_BLINK_MS": 50,
    "windupMs": {"s": 450, "d": 450, "bossSummonedD": 450, "c_M0": 500, "h": 600, "t": 700, "bossSwing": 800, "bossCharge": 900},
    "ENEMY_WINDUP_MIN_MS": 450
  },
  "parts": [
    {
      "name": "warnOverlay",
      "layer": "overlay",
      "priority": 50,
      "anchor": "aboveEntity",
      "hold": true,
      "frames": [{"ms": "durationMs", "text": "!", "fg": "#FFE14D", "bold": true}],
      "note": "żółty ! nad KAŻDYM wrogiem w zapowiedzi (2.10); boss: nad środkową górną komórką"
    },
    {
      "name": "attackerInverted",
      "layer": "cell",
      "priority": 50,
      "anchor": "entity",
      "hold": true,
      "frames": [{"ms": "durationMs", "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#FF5FC8"}]}],
      "note": "odwrócona komórka, BEZ zmiany litery (styl §9). Boss: ta sama komórka powtórzona dla dx 0..2, dy 0..1"
    },
    {
      "name": "targetCell",
      "layer": "cell",
      "priority": 60,
      "anchor": "targetCell albo zone",
      "timelineKey": "windupMs (melee/boss) albo ranged.<windupMs>"
    }
  ],
  "timelines": {
    "450": [
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]}
    ],
    "500": [
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]}
    ],
    "600": [
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]}
    ],
    "800": [
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]}
    ],
    "900": [
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#4A1240"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]}
    ],
    "ranged.700": [
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "•", "fg": "#FF5FC8", "bg": "#2A2F36", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#2A2F36"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "•", "fg": "#FF5FC8", "bg": "#2A2F36", "bold": true}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#2A2F36"}]},
      {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "•", "fg": "#FF5FC8", "bg": "#2A2F36", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#2A2F36"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "•", "fg": "#FF5FC8", "bg": "#2A2F36", "bold": true}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "bg": "#2A2F36"}]},
      {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "•", "fg": "#FF5FC8", "bg": "#2A2F36", "bold": true}]}
    ]
  },
  "reduceMotion": {
    "warnOverlay": "same",
    "attackerInverted": "same",
    "targetCell": [
      {
        "ms": "durationMs",
        "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}],
        "ifOccupied": {"dx": 0, "dy": 0, "bg": "#4A1240"},
        "note": "stałe x; gdy na polu stoi gracz lub dron – jego znak na tle #4A1240 (żeby nie zniknął)"
      }
    ],
    "targetCellRanged": [
      {
        "ms": "durationMs",
        "cells": [{"dx": 0, "dy": 0, "ch": "•", "fg": "#FF5FC8", "bg": "#2A2F36", "bold": true}],
        "ifOccupied": {"dx": 0, "dy": 0, "bg": "#2A2F36"}
      }
    ]
  },
  "timelineUse": {
    "450": "s, d, drony przywołane przez bossa",
    "500": "TYLKO M0 (Scrap Crawler c, prototyp) – w M1 nieużywana",
    "600": "h",
    "ranged.700": "t",
    "800": "zamach bossa",
    "900": "NIEUŻYWANA od v1.4: zapowiedź szarży to stały pas (fx_boss_rail_guardian.states.chargeTelegraph.band, S14 / mechaniki v0.5.2 §2.11). Zostaje tylko jako zapas"
  },
  "rule": "każda zapowiedź ciosu wroga ≥ 450 ms (9 ticków): windupMs − TICK_MS ≥ 400 (mechaniki v0.5, ENEMY_WINDUP_MIN_MS). Linia 400 ms usunięta w v1.1"
}
```


```json
{
  "id": "fx_strike",
  "trigger": "strikeResolved",
  "note": "moment ciosu na zamrożonym polu (1.7 pkt 5, STRIKE_FX_MS). Boss: na każdym polu strefy. Trafienie/pudło rozstrzyga logika",
  "layer": "cell",
  "priority": 70,
  "anchor": "targetCell albo zone",
  "loop": false,
  "durationMs": 100,
  "params": {"STRIKE_FX_MS": 100},
  "frames": [{"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "*", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]}],
  "variants": {"ranged": [{"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "*", "fg": "#FF5FC8", "bg": "#2A2F36", "bold": true}]}]},
  "reduceMotion": "same"
}
```


```json
{
  "id": "fx_alert",
  "trigger": "enemyAlert | liftArrived (alarm windy, R6 A)",
  "note": "wykrycie (ALERT, 1.6), alarm windy w chwili PRZYJAZDU (R6 A: każdy wróg w promieniu 12 pól) oraz aktywacja dronów przywołanych przez bossa. Szary i krótki, żeby nie mylił się z żółtym ! zapowiedzi",
  "layer": "overlay",
  "priority": 40,
  "anchor": "aboveEntity",
  "loop": false,
  "durationMs": 300,
  "params": {"ENEMY_ALERT_MS": 300},
  "frames": [{"ms": 300, "text": "!", "fg": "#C9D1D9", "bold": true}],
  "reduceMotion": "same"
}
```


```json
{
  "id": "fx_telegraph_interrupt",
  "trigger": "telegraphInterrupted",
  "note": "Shock przerwał zapowiedź: pole celu na chwilę pokazuje gaśnięcie w kolorze energii gracza, potem znika",
  "layer": "cell",
  "priority": 60,
  "anchor": "targetCell albo zone",
  "loop": false,
  "durationMs": 100,
  "frames": [{"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#BDEBFF"}]}],
  "reduceMotion": "same"
}
```

## 3. Trafienie (hit)

Źródło: styl §4 „Efekty walki”, mechaniki 1.7 (`HIT_FLASH_MS` = 100 ms, liczby 600 ms, `miss` 600 ms). Styl mówi „1 klatka”; przyjmuję 100 ms z mechaniki (patrz sprzeczności, sekcja 14).


```json
{
  "id": "fx_hit_enemy",
  "trigger": "enemyHit",
  "note": "zwykły wróg: cała komórka biała (biel ≠ magenta zapowiedzi, więc się nie mylą). Działa też w trakcie zapowiedzi (priority 80 > 50)",
  "layer": "cell",
  "priority": 80,
  "anchor": "entity",
  "loop": false,
  "durationMs": 100,
  "params": {"HIT_FLASH_MS": 100},
  "frames": [{"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true}]}],
  "reduceMotion": "same"
}
```


```json
{
  "id": "fx_hit_player",
  "trigger": "playerHit",
  "note": "aureola gracza miga na magentę (styl §4): 2 błyski. Pasek HP i wibracja 20 ms – UI",
  "layer": "cell",
  "priority": 80,
  "anchor": "entity",
  "loop": false,
  "durationMs": 300,
  "frames": [
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#FF5FC8"}]},
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#1F3B57"}]},
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#FF5FC8"}]}
  ],
  "reduceMotion": [{"ms": 300, "cells": [{"dx": 0, "dy": 0, "bg": "#FF5FC8"}]}]
}
```


```json
{
  "id": "fx_hit_drone",
  "trigger": "droneHit",
  "note": "Buddy Drone traci HP: tło miga na magentę jak u gracza (styl §9)",
  "layer": "cell",
  "priority": 80,
  "anchor": "entity",
  "loop": false,
  "durationMs": 100,
  "frames": [{"ms": 100, "cells": [{"dx": 0, "dy": 0, "bg": "#FF5FC8"}]}],
  "reduceMotion": "same"
}
```


```json
{
  "id": "fx_hit_boss",
  "trigger": "enemyHit (boss)",
  "note": "boss: tylko znaki na biało, tło zostaje – mniejsza powierzchnia błysku przy 2,5 ciosu/s + strzałach drona",
  "layer": "cell",
  "priority": 80,
  "anchor": "entity",
  "loop": false,
  "durationMs": 100,
  "frames": [
    {
      "ms": 100,
      "cells": [
        {"dx": 0, "dy": 0, "fg": "#FFFFFF", "bold": true},
        {"dx": 1, "dy": 0, "fg": "#FFFFFF", "bold": true},
        {"dx": 2, "dy": 0, "fg": "#FFFFFF", "bold": true},
        {"dx": 0, "dy": 1, "fg": "#FFFFFF", "bold": true},
        {"dx": 1, "dy": 1, "fg": "#FFFFFF", "bold": true},
        {"dx": 2, "dy": 1, "fg": "#FFFFFF", "bold": true}
      ]
    }
  ],
  "reduceMotion": "same"
}
```


```json
{
  "id": "fx_float_text",
  "trigger": ["enemyHit", "playerHit", "enemyMiss", "droneHit"],
  "note": "nakładki tekstowe (1.7): unoszą się o ok. 1 wiersz w górę przez 600 ms, min. 12 px z obrysem #0B0F14 (UI). Kolory: obecne z style.ts COMBAT_STYLE.text, zatwierdzam",
  "layer": "overlay",
  "priority": 60,
  "anchor": "aboveEntity",
  "loop": false,
  "durationMs": 600,
  "params": {"FLOAT_TEXT_MS": 600},
  "styles": {
    "dmgToEnemy": {"text": "-{dmg}", "fg": "#FFFFFF", "bold": true},
    "critToEnemy": {"text": "-{dmg}!", "fg": "#FFE14D", "bold": true},
    "dmgToPlayer": {"text": "-{dmg}", "fg": "#FF5FC8", "bold": true},
    "dmgToDrone": {"text": "-{dmg}", "fg": "#FF5FC8"},
    "miss": {"text": "miss", "fg": "#C9D1D9"},
    "outline": "#0B0F14"
  },
  "frames": [{"ms": 600, "riseRows": 1}],
  "reduceMotion": [{"ms": 600, "riseRows": 0}]
}
```

## 3a. Zamach Issue Pole gracza (v1.5; v1.6 potwierdzone przez Mechaniki)

W v1.0–v1.4 nie było osobnego efektu ataku wręcz gracza: cios Batona (1 pole) pokazywały tylko `fx_hit_enemy` / `fx_float_text`. GD zmienił walkę na twin-stick: Issue Pole i Pole II mają zamach łukiem na 2 pola, ok. 90°, obszarowo (`plan-produkcji.md` 25.10 22:01; teksty `M1_GEAR_ISSUE_POLE*`). `mechaniki-m1.md` v0.5.2 §1.3 dalej opisuje cios na 1 pole, a `design/wariant-twin-stick.md` (v0.6) jeszcze nie istnieje. Dlatego w v1.5 blok miał status „zależne od specyfikacji” (S21). **Od v1.6 potwierdzone przez Mechaniki** (odp. 25.10, formalnie w v0.6).

Podgląd (kierunek E, NE, N; pozostałe są obrotem):
```
E      NE     N
    \    -\\  //-\\
   \\    -\\   /-\ 
  @||    @||    @  
   //              
    /              
```

```json
{
  "id": "fx_player_pole_swing",
  "status": "POTWIERDZONE przez Mechaniki (odp. 25.10, S21), formalnie w design/wariant-twin-stick.md v0.6",
  "trigger": "playerSwing (koniec przygotowania ciosu = moment rozstrzygnięcia; także przy tapnięciu ATK bez celu)",
  "triggerPayload": {
    "entityId": "id gracza",
    "dir": "Dir8 {x, y} z actions.aim (albo facing, gdy aim = null)",
    "cells": "gotowa lista pól, które cios objął, policzona przez kod gry wg cellRules (FX rysuje tylko przecięcie z cellsByDir[dir])",
    "hitIds": "id encji trafionych tym zamachem (fx_hit_enemy / fx_hit_boss / fx_float_text na każdej)"
  },
  "weapon": ["M1_GEAR_ISSUE_POLE (Issue Pole)", "M1_GEAR_ISSUE_POLE_2_NAME (Issue Pole II)"],
  "params": {
    "POLE_ARC_RANGE": 2,
    "POLE_ARC_DEG": 90,
    "PLAYER_ATTACK_WINDUP_MS": 100,
    "PLAYER_ATTACK_CYCLE_MS": 400,
    "SWING_FX_MS": 150,
    "timingNote": "PLAYER_ATTACK_WINDUP_MS 100 i PLAYER_ATTACK_CYCLE_MS 400 to wartości robocze [R]; Balans może je zmienić. SWING_FX_MS 150 nie zależy od nich (mieści się w każdym cyklu ≥ 150 ms)"
  },
  "layer": "ground",
  "priority": 25,
  "anchor": "entity (gracz) + cellsByDir[dir]",
  "loop": false,
  "durationMs": 150,
  "arcRule": "łuk = zawsze 8 pól: 3 w odległości 1 (kierunek celowania i dwa sąsiednie kierunki ±45°) + 5 w odległości 2; pola na granicy ±45° należą do łuku (Mechaniki S21.1). Prosto E: (1,-1) (1,0) (1,1) i (2,-2)…(2,2). Skos NE (dy ujemne na północ): (0,-1) (1,-1) (1,0) i (0,-2) (1,-2) (2,-2) (2,-1) (2,0). Pozostałe kierunki są obrotem. Glif = kreska styczna do łuku (- | / \\). phase: 0 = początek zamachu, 1 = środek, 2 = koniec (zgodnie z ruchem wskazówek zegara na ekranie)",
  "cellsByDir": {
    "1,0": [
      {"dx": 1, "dy": -1, "ch": "\\", "phase": 0},
      {"dx": 2, "dy": -2, "ch": "\\", "phase": 0},
      {"dx": 2, "dy": -1, "ch": "\\", "phase": 0},
      {"dx": 1, "dy": 0, "ch": "|", "phase": 1},
      {"dx": 2, "dy": 0, "ch": "|", "phase": 1},
      {"dx": 1, "dy": 1, "ch": "/", "phase": 2},
      {"dx": 2, "dy": 1, "ch": "/", "phase": 2},
      {"dx": 2, "dy": 2, "ch": "/", "phase": 2}
    ],
    "1,1": [
      {"dx": 1, "dy": 0, "ch": "|", "phase": 0},
      {"dx": 2, "dy": 0, "ch": "|", "phase": 0},
      {"dx": 1, "dy": 1, "ch": "/", "phase": 1},
      {"dx": 2, "dy": 1, "ch": "/", "phase": 1},
      {"dx": 1, "dy": 2, "ch": "/", "phase": 1},
      {"dx": 2, "dy": 2, "ch": "/", "phase": 1},
      {"dx": 0, "dy": 1, "ch": "-", "phase": 2},
      {"dx": 0, "dy": 2, "ch": "-", "phase": 2}
    ],
    "0,1": [
      {"dx": 1, "dy": 1, "ch": "/", "phase": 0},
      {"dx": 1, "dy": 2, "ch": "/", "phase": 0},
      {"dx": 2, "dy": 2, "ch": "/", "phase": 0},
      {"dx": 0, "dy": 1, "ch": "-", "phase": 1},
      {"dx": 0, "dy": 2, "ch": "-", "phase": 1},
      {"dx": -1, "dy": 1, "ch": "\\", "phase": 2},
      {"dx": -2, "dy": 2, "ch": "\\", "phase": 2},
      {"dx": -1, "dy": 2, "ch": "\\", "phase": 2}
    ],
    "-1,1": [
      {"dx": 0, "dy": 1, "ch": "-", "phase": 0},
      {"dx": 0, "dy": 2, "ch": "-", "phase": 0},
      {"dx": -1, "dy": 1, "ch": "\\", "phase": 1},
      {"dx": -2, "dy": 1, "ch": "\\", "phase": 1},
      {"dx": -2, "dy": 2, "ch": "\\", "phase": 1},
      {"dx": -1, "dy": 2, "ch": "\\", "phase": 1},
      {"dx": -1, "dy": 0, "ch": "|", "phase": 2},
      {"dx": -2, "dy": 0, "ch": "|", "phase": 2}
    ],
    "-1,0": [
      {"dx": -1, "dy": 1, "ch": "\\", "phase": 0},
      {"dx": -2, "dy": 1, "ch": "\\", "phase": 0},
      {"dx": -2, "dy": 2, "ch": "\\", "phase": 0},
      {"dx": -1, "dy": 0, "ch": "|", "phase": 1},
      {"dx": -2, "dy": 0, "ch": "|", "phase": 1},
      {"dx": -1, "dy": -1, "ch": "/", "phase": 2},
      {"dx": -2, "dy": -2, "ch": "/", "phase": 2},
      {"dx": -2, "dy": -1, "ch": "/", "phase": 2}
    ],
    "-1,-1": [
      {"dx": -1, "dy": 0, "ch": "|", "phase": 0},
      {"dx": -2, "dy": 0, "ch": "|", "phase": 0},
      {"dx": -1, "dy": -1, "ch": "/", "phase": 1},
      {"dx": -2, "dy": -2, "ch": "/", "phase": 1},
      {"dx": -1, "dy": -2, "ch": "/", "phase": 1},
      {"dx": -2, "dy": -1, "ch": "/", "phase": 1},
      {"dx": 0, "dy": -1, "ch": "-", "phase": 2},
      {"dx": 0, "dy": -2, "ch": "-", "phase": 2}
    ],
    "0,-1": [
      {"dx": -1, "dy": -1, "ch": "/", "phase": 0},
      {"dx": -2, "dy": -2, "ch": "/", "phase": 0},
      {"dx": -1, "dy": -2, "ch": "/", "phase": 0},
      {"dx": 0, "dy": -1, "ch": "-", "phase": 1},
      {"dx": 0, "dy": -2, "ch": "-", "phase": 1},
      {"dx": 1, "dy": -1, "ch": "\\", "phase": 2},
      {"dx": 1, "dy": -2, "ch": "\\", "phase": 2},
      {"dx": 2, "dy": -2, "ch": "\\", "phase": 2}
    ],
    "1,-1": [
      {"dx": 0, "dy": -1, "ch": "-", "phase": 0},
      {"dx": 0, "dy": -2, "ch": "-", "phase": 0},
      {"dx": 1, "dy": -1, "ch": "\\", "phase": 1},
      {"dx": 1, "dy": -2, "ch": "\\", "phase": 1},
      {"dx": 2, "dy": -2, "ch": "\\", "phase": 1},
      {"dx": 2, "dy": -1, "ch": "\\", "phase": 1},
      {"dx": 1, "dy": 0, "ch": "|", "phase": 2},
      {"dx": 2, "dy": 0, "ch": "|", "phase": 2}
    ]
  },
  "frames": [
    {"ms": 50, "phase": {"0": {"fg": "#BDEBFF", "bold": true}}},
    {"ms": 50, "phase": {"0": {"fg": "#56606B"}, "1": {"fg": "#BDEBFF", "bold": true}}},
    {"ms": 50, "phase": {"1": {"fg": "#56606B"}, "2": {"fg": "#BDEBFF", "bold": true}}}
  ],
  "occupied": "warstwa ground: encja na polu łuku rysuje swój znak na wierzchu (trafienie pokazuje fx_hit_enemy / fx_hit_boss, priority 80). Łuk widać tylko na wolnych polach",
  "whiff": "bez trafień efekt jest ten sam (feedback, że ATK działa); logika może podać pustą listę cells przy łuku zasłoniętym ścianami – wtedy nic się nie rysuje",
  "reduceMotion": [{"ms": 150, "phase": {"0": {"fg": "#BDEBFF"}, "1": {"fg": "#BDEBFF"}, "2": {"fg": "#BDEBFF"}}}],
  "reduceMotionNote": "bez przemiatania: wszystkie 8 komórek naraz, bez pogrubienia, 150 ms",
  "colors": "#BDEBFF = playerShot / energia gracza (styl §4), #56606B = gaśnięcie jak ślad Dash; żadnej magenty (zarezerwowana dla wrogów)",
  "cellRules": {
    "computedBy": "kod gry (Gameplay), nie FX – FX dostaje gotowe cells i hitIds",
    "source": "Mechaniki S21.2 (odp. 25.10), wariant-twin-stick.md v0.6",
    "rules": [
      "ściana nie obrywa i nie jest w cells",
      "pole w odległości 2 obrywa tylko wtedy, gdy jego rodzic w odległości 1 (sąsiad na linii od gracza) jest przechodni",
      "skos w odległości 1 jest odcięty, gdy oba sąsiednie pola ortogonalne (wspólne z graczem) są ścianami"
    ]
  },
  "framesNote": "3 fazy po 50 ms = 150 ms; gaśnięcie fazy n przypada na klatkę n+1, a faza 2 znika razem z końcem efektu (bez osobnej klatki gaśnięcia)",
  "weaponRange": "Issue Pole i Issue Pole II: ten sam zasięg 2 (Mk2 zmienia tylko obrażenia; „longer” w M1_GEAR_ISSUE_POLE_2 to sam opis – S23 zamknięte)"
}
```

## 4. Śmierć

Logika usuwa wroga z siatki w ticku śmierci (1.9), więc pole jest od razu przechodnie. Animacja jest tylko wizualna i rysuje znak przez `"ch": "{glyph}"`. Wrak `%` zostaje do wyjścia z poziomu (w M1 nie ma respawnu wrogów w trakcie poziomu – patrz założenia). Śmierć gracza mieści się w 500 ms zatrzymania świata (`PLAYER_DEATH_FREEZE_MS`) z podświetlonym zabójcą. Potem ekran śmierci: 1500 ms bez pominięcia, przycisk NEXT (`M1_DEATH_BTN`), samo przejście po 5000 ms (`DEATH_SCREEN_MIN_MS`, `DEATH_SCREEN_AUTO_MS`), dalej wydruk 600 ms (mechaniki v0.5 2.7).


```json
{
  "id": "fx_death_enemy",
  "trigger": "enemyKilled",
  "note": "d / h / s / t: biały błysk ostatniego ciosu → zakłócenie Szumu (styl §5) → wrak %",
  "layer": "cell",
  "priority": 90,
  "anchor": "entity",
  "loop": false,
  "durationMs": 200,
  "frames": [
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "{glyph}", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true}]},
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "?", "fg": "#FF5FC8", "bold": true}]}
  ],
  "after": {
    "layer": "terrain",
    "cells": [{"dx": 0, "dy": 0, "ch": "%", "fg": "#C9D1D9"}],
    "until": "levelExit",
    "passable": true
  },
  "reduceMotion": [{"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "{glyph}", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true}]}]
}
```


```json
{
  "id": "fx_death_player",
  "trigger": "playerDied",
  "note": "w 500 ms zatrzymania: błysk → zwłoki % (styl §4: biały bold na aureoli) + podświetlony zabójca (mechaniki v0.5 2.7 pkt 3.1). Potem ekran śmierci",
  "loop": false,
  "durationMs": 500,
  "params": {"PLAYER_DEATH_FREEZE_MS": 500},
  "parts": [
    {
      "name": "player",
      "layer": "cell",
      "priority": 90,
      "anchor": "entity",
      "frames": [
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#FF5FC8", "bold": true}]},
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}]},
        {"ms": 300, "cells": [{"dx": 0, "dy": 0, "ch": "%", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}]}
      ],
      "reduceMotion": [
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#FF5FC8", "bold": true}]},
        {"ms": 400, "cells": [{"dx": 0, "dy": 0, "ch": "%", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}]}
      ]
    },
    {
      "name": "killerHighlight",
      "layer": "cell",
      "priority": 90,
      "anchor": "killer (payload playerDied / getCombatDeath: killer.entityId, killer.strikeOrigin)",
      "durationMs": 500,
      "frames": [
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true}]},
        {"ms": 100, "cells": [{"dx": 0, "dy": 0}]},
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true}]},
        {"ms": 100, "cells": [{"dx": 0, "dy": 0}]},
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true}]}
      ],
      "note": "zabójca miga białą odwróconą komórką (znak #0B0F14 na #FFFFFF; biel = ten sam sygnał „to on” co trafienie, nie myli się z magentą zapowiedzi): 3 błyski po 100 ms w 500 ms zatrzymania. Boss: wszystkie 6 komórek (dx 0..2, dy 0..1). Wieżyczka daleko: też, kamera jej nie szuka. Gdy zabójca zginął w tym samym ticku lub go nie ma: podświetlenie pola, z którego padł cios (ch bez zmian). Reduce motion: stała biała komórka 500 ms",
      "reduceMotion": [{"ms": 500, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true}]}],
      "after": "na ekranie śmierci zabójca zostaje niewygaszony (fx_death_screen.undimmed) w swoim zwykłym glifie",
      "anchorRules": [
        {
          "case": "killerAlive",
          "when": "killer.entityId istnieje",
          "anchor": "entity killer.entityId",
          "cells": "1 komórka; boss: 6 komórek (dx 0..2, dy 0..1)"
        },
        {
          "case": "killerDiedSameTick",
          "when": "killer.entityId brak (encja usunięta), killer.strikeOrigin podane",
          "anchor": "killer.strikeOrigin",
          "cells": "pola z killer.strikeOrigin (boss: 6 pól bryły w ticku ciosu); ch bez zmian (wrak % albo podłoga)",
          "frames": "te same co wyżej"
        },
        {
          "case": "killerUnknown",
          "when": "brak killer",
          "anchor": "none",
          "action": "skip",
          "note": "w M1 praktycznie nie występuje (ciecz bez obrażeń, v0.5.2 §2.11); na ekranie śmierci znika też linia M1_DEATH_01"
        }
      ],
      "decision": "S12 zatwierdzone przez GD 25.10.2026 (v1.2)"
    }
  ]
}
```


```json
{
  "id": "fx_death_screen",
  "trigger": "playerDeathFreezeEnd",
  "endsOn": [
    "nextPressed: przycisk M1_DEATH_BTN „NEXT” – TYLKO tap albo Enter, nowe naciśnięcie (zbocze) po 1500 ms",
    "autoAdvance: 5000 ms od startu ekranu (decyzja GD, mechaniki v0.5.2 §2.14a M8)"
  ],
  "note": "pełny ekran po 500 ms zatrzymania. Mapa przyciemniona, ale zwłoki gracza i zabójca zostają w pełnej jasności. Brak stałego czasu 3000 ms z M0. Po wyjściu: fx_base_print (600 ms)",
  "layer": "screen",
  "priority": 90,
  "anchor": "screen",
  "loop": false,
  "durationMs": 5000,
  "params": {"DEATH_SCREEN_MIN_MS": 1500, "DEATH_SCREEN_AUTO_MS": 5000, "PRINT_ANIM_MS": 600},
  "undimmed": ["playerCorpse", "killer"],
  "frames": [
    {
      "ms": 1500,
      "phase": "locked",
      "dim": {"color": "#0B0F14", "alpha": 0.72},
      "lines": [
        {"textId": "M1_BASE_04", "fg": "#FF5FC8", "bold": true},
        {
          "textId": "M1_DEATH_01",
          "text": "Killed by: {enemy_name}",
          "fg": "#C9D1D9",
          "tokens": {
            "enemy_name": "nazwa zabójcy z teksty-m1-en.md §6 (Panel Drone, Curfew Guard, Scrapper, Line Sentry, Rail Guardian)"
          },
          "hideWhen": "killerUnknown (zabójcy nie da się ustalić) – cała linia ukryta, bez zastępczego tekstu"
        },
        {
          "textId": "M1_DEATH_02",
          "text": "Last hits: {hit_1} · {hit_2} · {hit_3}",
          "fg": "#C9D1D9",
          "tokenFg": "#FF5FC8",
          "tokens": {"hit_n": "-{dmg} z getCombatDeath().lastHits[n].dmg (po pancerzu), jak dmgToPlayer w fx_float_text"},
          "order": "chronologicznie: {hit_3} = cios śmiertelny (propozycja Lore §12.1)",
          "separator": " · ",
          "rules": [
            "mniej niż 3 trafienia: pominąć puste sloty RAZEM z ich separatorem ' · ' (np. 2 trafienia → 'Last hits: -12 · -18')",
            "0 trafień: ukryć całą linię",
            "zawsze prawdziwe liczby z dziennika obrażeń"
          ],
          "note": "ostatnie 3 trafienia po pancerzu, z dziennika obrażeń"
        }
      ]
    },
    {
      "ms": 3500,
      "phase": "continue",
      "dim": {"color": "#0B0F14", "alpha": 0.72},
      "lines": [
        {"textId": "M1_BASE_04", "fg": "#FF5FC8", "bold": true},
        {
          "textId": "M1_DEATH_01",
          "text": "Killed by: {enemy_name}",
          "fg": "#C9D1D9",
          "tokens": {
            "enemy_name": "nazwa zabójcy z teksty-m1-en.md §6 (Panel Drone, Curfew Guard, Scrapper, Line Sentry, Rail Guardian)"
          },
          "hideWhen": "killerUnknown (zabójcy nie da się ustalić) – cała linia ukryta, bez zastępczego tekstu"
        },
        {
          "textId": "M1_DEATH_02",
          "text": "Last hits: {hit_1} · {hit_2} · {hit_3}",
          "fg": "#C9D1D9",
          "tokenFg": "#FF5FC8",
          "tokens": {"hit_n": "-{dmg} z getCombatDeath().lastHits[n].dmg (po pancerzu), jak dmgToPlayer w fx_float_text"},
          "order": "chronologicznie: {hit_3} = cios śmiertelny (propozycja Lore §12.1)",
          "separator": " · ",
          "rules": [
            "mniej niż 3 trafienia: pominąć puste sloty RAZEM z ich separatorem ' · ' (np. 2 trafienia → 'Last hits: -12 · -18')",
            "0 trafień: ukryć całą linię",
            "zawsze prawdziwe liczby z dziennika obrażeń"
          ],
          "note": "ostatnie 3 trafienia po pancerzu, z dziennika obrażeń"
        },
        {
          "textId": "M1_DEATH_BTN",
          "text": "NEXT",
          "fg": "#3DDC97",
          "bold": true,
          "activeFromMs": 1500,
          "input": ["tap", "Enter"],
          "notInput": ["Space", "J", "ATK"]
        }
      ]
    }
  ],
  "next": "fx_base_print",
  "reduceMotion": "same",
  "textsSource": "fabula/teksty-m1-en.md §12.1 (M1_DEATH_01, M1_DEATH_02, M1_DEATH_BTN)",
  "input": {
    "accept": ["tap", "Enter"],
    "reject": ["Space", "J", "ATK (przycisk dotykowy)"],
    "edgeOnly": true,
    "note": "mechaniki v0.5.2 §2.14a (M8) i ui-m1.md §11.10 (M-D1): trzymany atak ani Enter wciśnięty przed 1500 ms nie przeskakuje ekranu"
  },
  "autoPause": "auto-pauza zatrzymuje oba zegary (1500 i 5000 ms); po wznowieniu liczą dalej (M-D2)"
}
```

## 5. Dash (sk1)

Mechanika 2.5 / 2.16: przeskok do 3 pól w 1 ticku, przygotowanie 0 ms, **nietykalność 200 ms** (`SK1_DASH_IFRAMES_MS`), ślad `·` na pokonanych polach przez 150 ms. Gracz od razu stoi na polu końcowym (logika), więc animacja to tylko ślad za nim. Czas nietykalności pokazuję jasnym obrysem aureoli tylko w fazie 0–200 ms.

```json
{
  "id": "fx_dash",
  "trigger": "dashStart",
  "triggerPayload": {"path": "pole startu + pola pośrednie (bez końcowego); pusta lista = Dash zablokowany, brak śladu"},
  "loop": false,
  "durationMs": 200,
  "params": {"SK1_DASH_RANGE": 3, "SK1_DASH_IFRAMES_MS": 200, "SK1_DASH_COOLDOWN_MS": 4000, "trailMs": 150},
  "parts": [
    {
      "name": "trail",
      "layer": "ground",
      "priority": 20,
      "anchor": "path",
      "frames": [
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#BDEBFF", "bold": true}]},
        {"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#56606B"}]}
      ],
      "note": "150 ms jak w mechanice; druga klatka gaśnie do koloru elementów tła"
    },
    {
      "name": "iframes",
      "layer": "cell",
      "priority": 45,
      "anchor": "entity",
      "frames": [{"ms": 200, "cells": [{"dx": 0, "dy": 0, "bg": "#2A2F36"}]}],
      "note": "200 ms nietykalności: aureola gracza zmienia się z #1F3B57 na neutralną #2A2F36 (gracz „poza zasięgiem”); kończy się dokładnie z iframes"
    }
  ],
  "reduceMotion": "same"
}
```

## 6. Shock Pulse (sk2)

Mechanika 2.5 / 2.16: przygotowanie **150 ms** (blokuje ruch), potem obrażenia w promieniu 2 (5×5, Czebyszew, linia wzroku) i status **Shock 2000 ms**. Wygląd (v0.5): rozbłysk **całego obszaru** 5×5 przez 150 ms, najpierw środek, potem krawędź. Energia gracza = `#BDEBFF` (jak strzał), tło sojusznika = `#1F3B57` (jak aureola). Nie używam żółtego, bo żółty to ostrzeżenie przed ciosem wroga.

```json
{
  "id": "fx_shock_pulse",
  "trigger": "pulseCast",
  "triggerPayload": {
    "mask": "logika podaje komórki promienia 1 i 2 bez ścian i z linią wzroku (anchor zone); dx/dy poniżej są względem gracza, komórki spoza maski pominąć"
  },
  "loop": false,
  "durationMs": 300,
  "params": {"SK2_PULSE_WINDUP_MS": 150, "ringMs": 150, "SK2_PULSE_RADIUS": 2, "SK2_SHOCK_MS": 2000},
  "parts": [
    {
      "name": "windup",
      "layer": "ground",
      "priority": 20,
      "anchor": "entity",
      "startMs": 0,
      "frames": [
        {
          "ms": 150,
          "cells": [
            {"dx": -1, "dy": -1, "ch": "·", "fg": "#BDEBFF"},
            {"dx": 0, "dy": -1, "ch": "·", "fg": "#BDEBFF"},
            {"dx": 1, "dy": -1, "ch": "·", "fg": "#BDEBFF"},
            {"dx": -1, "dy": 0, "ch": "·", "fg": "#BDEBFF"},
            {"dx": 1, "dy": 0, "ch": "·", "fg": "#BDEBFF"},
            {"dx": -1, "dy": 1, "ch": "·", "fg": "#BDEBFF"},
            {"dx": 0, "dy": 1, "ch": "·", "fg": "#BDEBFF"},
            {"dx": 1, "dy": 1, "ch": "·", "fg": "#BDEBFF"}
          ]
        }
      ],
      "note": "150 ms ładowania wokół gracza"
    },
    {
      "name": "ring",
      "layer": "ground",
      "priority": 25,
      "anchor": "entity",
      "startMs": 150,
      "trigger": "pulseFire",
      "frames": [
        {
          "ms": 50,
          "cells": [
            {"dx": -1, "dy": -1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 0, "dy": -1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 1, "dy": -1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -1, "dy": 0, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 1, "dy": 0, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -1, "dy": 1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 0, "dy": 1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 1, "dy": 1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true}
          ]
        },
        {
          "ms": 100,
          "cells": [
            {"dx": -1, "dy": -1, "bg": "#1F3B57"},
            {"dx": 0, "dy": -1, "bg": "#1F3B57"},
            {"dx": 1, "dy": -1, "bg": "#1F3B57"},
            {"dx": -1, "dy": 0, "bg": "#1F3B57"},
            {"dx": 1, "dy": 0, "bg": "#1F3B57"},
            {"dx": -1, "dy": 1, "bg": "#1F3B57"},
            {"dx": 0, "dy": 1, "bg": "#1F3B57"},
            {"dx": 1, "dy": 1, "bg": "#1F3B57"},
            {"dx": -2, "dy": -2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -1, "dy": -2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 0, "dy": -2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 1, "dy": -2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 2, "dy": -2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -2, "dy": -1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 2, "dy": -1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -2, "dy": 0, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 2, "dy": 0, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -2, "dy": 1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 2, "dy": 1, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -2, "dy": 2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": -1, "dy": 2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 0, "dy": 2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 1, "dy": 2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true},
            {"dx": 2, "dy": 2, "ch": "*", "fg": "#BDEBFF", "bg": "#1F3B57", "bold": true}
          ]
        }
      ],
      "note": "rozbłysk CAŁEGO obszaru 5×5 (S9 zamknięte, mechaniki v0.5): najpierw promień 1 (50 ms), potem krawędź 5×5 (100 ms) przy wciąż podświetlonym środku. Klucz 'ring' zostaje dla zgodności z v1.0. Na polach z encją widać encję na tle #1F3B57, a wrogowie dostają fx_hit_enemy"
    }
  ],
  "reduceMotion": {
    "windup": "same",
    "ring": [
      {
        "ms": 150,
        "cells": [
          {"dx": -1, "dy": -1, "bg": "#1F3B57"},
          {"dx": 0, "dy": -1, "bg": "#1F3B57"},
          {"dx": 1, "dy": -1, "bg": "#1F3B57"},
          {"dx": -1, "dy": 0, "bg": "#1F3B57"},
          {"dx": 1, "dy": 0, "bg": "#1F3B57"},
          {"dx": -1, "dy": 1, "bg": "#1F3B57"},
          {"dx": 0, "dy": 1, "bg": "#1F3B57"},
          {"dx": 1, "dy": 1, "bg": "#1F3B57"},
          {"dx": -2, "dy": -2, "bg": "#1F3B57"},
          {"dx": -1, "dy": -2, "bg": "#1F3B57"},
          {"dx": 0, "dy": -2, "bg": "#1F3B57"},
          {"dx": 1, "dy": -2, "bg": "#1F3B57"},
          {"dx": 2, "dy": -2, "bg": "#1F3B57"},
          {"dx": -2, "dy": -1, "bg": "#1F3B57"},
          {"dx": 2, "dy": -1, "bg": "#1F3B57"},
          {"dx": -2, "dy": 0, "bg": "#1F3B57"},
          {"dx": 2, "dy": 0, "bg": "#1F3B57"},
          {"dx": -2, "dy": 1, "bg": "#1F3B57"},
          {"dx": 2, "dy": 1, "bg": "#1F3B57"},
          {"dx": -2, "dy": 2, "bg": "#1F3B57"},
          {"dx": -1, "dy": 2, "bg": "#1F3B57"},
          {"dx": 0, "dy": 2, "bg": "#1F3B57"},
          {"dx": 1, "dy": 2, "bg": "#1F3B57"},
          {"dx": 2, "dy": 2, "bg": "#1F3B57"}
        ]
      }
    ]
  }
}
```


```json
{
  "id": "fx_status_shock",
  "trigger": "statusApplied:Shock",
  "endsOn": ["statusExpired:Shock", "enemyKilled"],
  "note": "wróg z Shock (wolniejszy, przerwana zapowiedź): co 400 ms znak na 100 ms w kolorze energii gracza. Nie rysować w fazach z zapowiedzią/trafieniem (mają wyższy priorytet i tak przykryją)",
  "layer": "cell",
  "priority": 40,
  "anchor": "entity",
  "loop": true,
  "durationMs": 2000,
  "params": {"SK2_SHOCK_MS": 2000},
  "frames": [{"ms": 300, "cells": [{"dx": 0, "dy": 0}]}, {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#BDEBFF"}]}],
  "reduceMotion": [{"ms": 2000, "cells": [{"dx": 0, "dy": 0, "fg": "#BDEBFF"}]}]
}
```

## 7. Helper Drone → **Buddy Drone** (sk3)

Nazwa w zadaniu to stara nazwa robocza; ostateczna to **Buddy Drone** (GD 25.10.2026, `teksty-m1-en.md`). Mechanika 2.5 / 2.16: przygotowanie **200 ms**, dron 40 HP, strzał co **500 ms** (zasięg 5), prowokacja w promieniu 4, życie **8000 ms**. Glif `¤` `#3DDC97` bold na `#1F3B57` (styl §9).

```json
{
  "id": "fx_buddy_drone",
  "triggers": {
    "cast": "droneCast",
    "spawn": "droneSpawn",
    "fire": "droneFire",
    "hit": "droneHit",
    "expireWarn": "droneLifeLeft<=2000",
    "expire": "droneExpired",
    "destroyed": "droneDestroyed"
  },
  "params": {
    "SK3_DRONE_WINDUP_MS": 200,
    "SK3_DRONE_FIRE_MS": 500,
    "SK3_DRONE_LIFE_MS": 8000,
    "SK3_DRONE_TAUNT_RADIUS": 4,
    "SK3_DRONE_RANGE": 5,
    "SK3_DRONE_HP": 40
  },
  "states": {
    "cast": {
      "layer": "ground",
      "priority": 20,
      "anchor": "targetCell",
      "loop": false,
      "durationMs": 200,
      "frames": [
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#3DDC97"}]},
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#3DDC97", "bg": "#1F3B57"}]}
      ],
      "note": "pole, na którym stanie dron, w trakcie przygotowania 200 ms"
    },
    "idle": {
      "layer": "entity",
      "priority": 10,
      "anchor": "entity",
      "loop": false,
      "hold": true,
      "durationMs": "SK3_DRONE_LIFE_MS",
      "frames": [{"ms": "durationMs", "cells": [{"dx": 0, "dy": 0, "ch": "¤", "fg": "#3DDC97", "bg": "#1F3B57", "bold": true}]}]
    },
    "tauntRange": {
      "layer": "ground",
      "priority": 15,
      "anchor": "entity",
      "loop": false,
      "durationMs": 200,
      "trigger": "droneSpawn",
      "frames": [
        {
          "ms": 200,
          "cells": [
            {"dx": -4, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": -3, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": -2, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": -1, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 0, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 1, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 2, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 3, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": -4, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": -3, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": -3, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": -2, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": -2, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": -1, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": -1, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": 0, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": 0, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": 1, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": 1, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": 2, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": 2, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": 3, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": 3, "ch": "·", "fg": "#3DDC97"},
            {"dx": -4, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": -3, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": -2, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": -1, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 0, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 1, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 2, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 3, "dy": 4, "ch": "·", "fg": "#3DDC97"},
            {"dx": 4, "dy": 4, "ch": "·", "fg": "#3DDC97"}
          ]
        }
      ],
      "note": "jednorazowo przy postawieniu: krawędź promienia prowokacji 4 (9×9); pola ścian pominąć"
    },
    "fire": {
      "layer": "cell",
      "priority": 30,
      "anchor": "entity",
      "loop": false,
      "durationMs": 50,
      "frames": [{"ms": 50, "cells": [{"dx": 0, "dy": 0, "fg": "#FFFFFF"}]}],
      "tracer": {
        "layer": "ground",
        "priority": 20,
        "anchor": "zone",
        "zone": "pola linii (Bresenham) między dronem a celem, bez końców",
        "frames": [{"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#BDEBFF"}]}]
      },
      "note": "strzał co 500 ms; cel dostaje fx_hit_enemy, a ×2 na Shock pokazuje się jako critToEnemy w fx_float_text"
    },
    "expireWarn": {
      "layer": "cell",
      "priority": 35,
      "anchor": "entity",
      "loop": true,
      "durationMs": 2000,
      "frames": [{"ms": 250, "cells": [{"dx": 0, "dy": 0, "bg": "#0B0F14"}]}, {"ms": 250, "cells": [{"dx": 0, "dy": 0}]}],
      "note": "ostatnie 2 s życia: aureola drona miga (gaśnie)"
    },
    "expire": {
      "layer": "cell",
      "priority": 90,
      "anchor": "entity",
      "loop": false,
      "durationMs": 100,
      "frames": [{"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#3DDC97"}]}]
    },
    "destroyed": {
      "layer": "cell",
      "priority": 90,
      "anchor": "entity",
      "loop": false,
      "durationMs": 200,
      "frames": [
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "¤", "fg": "#FFFFFF", "bg": "#FF5FC8", "bold": true}]},
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#3DDC97"}]}
      ]
    }
  },
  "reduceMotion": {"expireWarn": [{"ms": 2000, "cells": [{"dx": 0, "dy": 0, "bg": "#0B0F14"}]}], "other": "same"}
}
```

## 8. Ewakuacja (szyb windy `<`)

Mechanika 2.9 / 2.16 + decyzja GD R6 opcja A (v1.2): wezwanie = przytrzymanie USE **1000 ms**; dojazd **5000 / 7000 / 9000 ms** (głęb. 1/2/3); okno **10 000 ms**; ponowne wezwanie po **5000 ms**; alarm w promieniu 12 pól **w chwili przyjazdu windy** (szary `!` nad ściągniętymi wrogami, `M1_SYS_05`). Od v0.5: wejście na `<` = kabina (gracz nietykalny), odjazd **1000 ms**, ekran przejazdu **2000 ms** z `M1_BASE_05` (pominięcie po 500 ms). Glif `<` `#3DDC97` bold, tło `#0F3326`, „delikatne pulsowanie” (styl §4). Stany idą po kolei: `idle → calling → arriving → open → (evacuated | departed → cooldown → idle)`.

```json
{
  "id": "fx_evac_shaft",
  "note": "EVAC_*_S w sekundach jak w mechanice §2.16; czasy klatek w ms = S × 1000. Decyzja R6 opcja A (GD 25.10.2026, assety v1.2): alarm przy przyjeździe windy (promień 12), wezwanie 1000 ms, ponowne wezwanie po 5 s.",
  "params": {
    "EVAC_CALL_HOLD_MS": 1000,
    "EVAC_ARRIVE_S": {"1": 5, "2": 7, "3": 9},
    "EVAC_HOLD_S": 10,
    "EVAC_RECALL_COOLDOWN_S": 5,
    "EVAC_ALERT_RADIUS": 12,
    "LIFT_DEPART_MS": 1000,
    "LIFT_RIDE_MS": 2000,
    "LIFT_RIDE_SKIP_AFTER_MS": 500,
    "EVAC_ALERT_MOMENT": "arrival",
    "decision": "R6 opcja A (GD; mechaniki v0.5.2 §2.9, §2.16, §2.17 pkt 7): alarm przy przyjeździe windy (promień 12), wezwanie 1000 ms, ponowne wezwanie po 5 s"
  },
  "states": {
    "idle": {
      "trigger": "levelStart | cooldownEnd",
      "layer": "cell",
      "priority": 10,
      "anchor": "entity",
      "loop": true,
      "durationMs": "untilNextState",
      "frames": [
        {"ms": 1500, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]},
        {"ms": 500, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0B0F14", "bold": true}]}
      ],
      "reduceMotion": [{"ms": 2000, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]}],
      "note": "pulsowanie: 1,5 s z tłem #0F3326, 0,5 s bez tła"
    },
    "calling": {
      "trigger": "evacCallStart",
      "endsOn": ["evacCallInterrupted", "evacCallDone"],
      "layer": "overlay",
      "priority": 70,
      "anchor": "aboveEntity",
      "loop": false,
      "durationMs": 1000,
      "frames": [
        {"ms": 100, "text": "[#---------]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[##--------]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[###-------]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[####------]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[#####-----]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[######----]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[#######---]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[########--]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[#########-]", "fg": "#3DDC97", "bold": true},
        {"ms": 100, "text": "[##########]", "fg": "#3DDC97", "bold": true}
      ],
      "reduceMotion": "same",
      "note": "pasek postępu nad szybem, 10 × 100 ms = EVAC_CALL_HOLD_MS 1000 (R6 A). Te same znaki co pasek HP w UI_GLYPHS. Przerwanie (puszczenie USE, ruch, obrażenia, atak, umiejętność) = pasek znika od razu"
    },
    "arriving": {
      "trigger": "evacCallDone",
      "layer": "cell",
      "priority": 20,
      "anchor": "entity",
      "loop": true,
      "durationMs": "EVAC_ARRIVE_S[depth] × 1000",
      "frames": [
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 750, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]}
      ],
      "overlay": {
        "layer": "overlay",
        "priority": 60,
        "anchor": "aboveEntity",
        "text": "{secondsLeft}",
        "fg": "#3DDC97",
        "bold": true,
        "updateMs": 1000
      },
      "sideEffects": [],
      "reduceMotion": [{"ms": 1000, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]}],
      "note": "co 1 s krótki błysk odwróconej komórki + odliczanie sekund (5/7/9 → 1). R6 A: przy wezwaniu NIE ma alarmu"
    },
    "open": {
      "trigger": "liftArrived",
      "endsOn": ["playerEvacuated"],
      "layer": "cell",
      "priority": 30,
      "anchor": "entity",
      "loop": false,
      "durationMs": 10000,
      "frames": [
        {"ms": 7000, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 250, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]}
      ],
      "overlay": {
        "layer": "overlay",
        "priority": 60,
        "anchor": "aboveEntity",
        "text": "{secondsLeft}",
        "fg": "#3DDC97",
        "bold": true,
        "updateMs": 1000
      },
      "sideEffects": [
        "tekst M1_BASE_06 w chwili przyjazdu (UI)",
        "ALARM (R6 A): w ticku liftArrived każdy wróg w promieniu EVAC_ALERT_RADIUS = 12 dostaje fx_alert (szary !, 300 ms) i idzie do szybu; tekst M1_SYS_05 w tej samej chwili"
      ],
      "reduceMotion": [{"ms": 10000, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]}],
      "note": "winda czeka: odwrócona komórka (najsilniejszy sygnał „wejdź teraz”); ostatnie 3 s miga co 250 ms (okno się zamyka). Odliczanie 10 → 1",
      "durationParam": "EVAC_HOLD_S × 1000 = 10000",
      "alarm": {
        "trigger": "liftArrived",
        "effect": "fx_alert",
        "targets": "wrogowie ściągnięci alarmem: w promieniu 12 pól (BFS) od szybu, którzy przechodzą na marsz do szybu (logika)",
        "radiusParam": "EVAC_ALERT_RADIUS",
        "textId": "M1_SYS_05",
        "note": "zgodnie z mechaniki v0.5.2 §2.9 pkt 3 i 8: wrogowie, którzy już gonią gracza, gonią dalej i nie dostają !. Ponowny przyjazd wywołuje alarm (i !) tylko dla wrogów, którzy go jeszcze nie dostali albo wrócili do IDLE"
      }
    },
    "evacuated": {
      "trigger": "playerEvacuated (krok na < w oknie = wejście do kabiny)",
      "layer": "cell",
      "priority": 90,
      "anchor": "entity",
      "loop": false,
      "durationMs": 1000,
      "frames": [
        {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#3DDC97", "bold": true}]},
        {"ms": 300, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#0B0F14", "bg": "#3DDC97", "bold": true}]},
        {"ms": 300, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]},
        {"ms": 300, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0B0F14", "bold": true}]}
      ],
      "next": "fx_screen_to_base",
      "reduceMotion": "same",
      "note": "odjazd kabiny LIFT_DEPART_MS = 1000 ms (v0.5): gracz w kabinie (nietykalny, poza symulacją), świat się rysuje; kabina „zamyka się” – odwrócona → zwykła → bez tła. Auto-pauza tylko zamraża animację"
    },
    "departed": {
      "trigger": "liftDeparted",
      "layer": "cell",
      "priority": 20,
      "anchor": "entity",
      "loop": false,
      "durationMs": 5000,
      "frames": [{"ms": 5000, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0B0F14", "bold": true}]}],
      "overlay": {
        "layer": "overlay",
        "priority": 60,
        "anchor": "aboveEntity",
        "text": "{secondsLeft}",
        "fg": "#C9D1D9",
        "updateMs": 1000
      },
      "sideEffects": ["tekst M1_BASE_07 (UI)"],
      "reduceMotion": "same",
      "note": "brak wejścia w oknie: szyb bez tła i bez pulsu + szare odliczanie 5 s do ponownego wezwania (R6 A), potem idle",
      "durationParam": "EVAC_RECALL_COOLDOWN_S × 1000 = 5000"
    },
    "arenaShaftOpen": {
      "trigger": "bossDefeated",
      "layer": "cell",
      "priority": 20,
      "anchor": "entity",
      "loop": false,
      "durationMs": 400,
      "frames": [
        {"ms": 200, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#3DDC97"}]},
        {"ms": 200, "cells": [{"dx": 0, "dy": 0, "ch": "<", "fg": "#3DDC97", "bg": "#0F3326", "bold": true}]}
      ],
      "next": "idle",
      "reduceMotion": "same",
      "note": "dodatkowy szyb na arenie bossa pojawia się po walce"
    }
  }
}
```


```json
{
  "id": "fx_screen_to_base",
  "trigger": "liftDepartEnd (po fx_evac_shaft.evacuated) | baseLiftUse (wyjazd z bazy)",
  "endsOn": ["tap po LIFT_RIDE_SKIP_AFTER_MS (tylko zjazd do bazy)"],
  "layer": "screen",
  "priority": 90,
  "anchor": "screen",
  "loop": false,
  "durationMs": 2000,
  "params": {"LIFT_RIDE_MS": 2000, "LIFT_RIDE_SKIP_AFTER_MS": 500},
  "frames": [
    {"ms": 200, "dim": {"color": "#0B0F14", "alpha": 0.5}},
    {
      "ms": 1800,
      "dim": {"color": "#0B0F14", "alpha": 1.0},
      "lines": [{"textId": "M1_BASE_05", "fg": "#3DDC97", "onlyWhen": "zjazd do bazy"}]
    }
  ],
  "note": "ekran przejścia windy w obie strony (v0.5 2.9). Gdy generowanie poziomu trwa dłużej, ostatnia klatka trwa do gotowości. Po zjeździe: baza (fx_base_lift_arrive) i podsumowanie",
  "reduceMotion": [
    {
      "ms": 2000,
      "dim": {"color": "#0B0F14", "alpha": 1.0},
      "lines": [{"textId": "M1_BASE_05", "fg": "#3DDC97", "onlyWhen": "zjazd do bazy"}]
    }
  ]
}
```

## 9. Boss Rail Guardian – klatki 3×2

Glif bazowy (styl §4): górny wiersz `/R\`, dolny `[=]`, `#FF5FC8` bold na `#3D0F2E`. Kotwica = lewy górny róg. Stany wynikają z mechaniki 2.11 / 2.16: ruch 300 ms, zamach (zapowiedź **800 ms**, odnowienie **1200 ms**, strefa 3×3 przed bossem), szarża co 4. atak (zapowiedź **900 ms**, potem przejazd **100 ms na pole**, maks. ~2,8 s; szarża tylko pozioma: zapowiedź podświetla cały tor (2 rzędy `=`), przejazd – pas od bossa do ściany, stałe `x` do zatrzymania), po uderzeniu w ścianę **2000 ms** ogłuszenia z odsłoniętym `R` (obrażenia ×2), przy 50% HP jednorazowe przywołanie 2 Panel Drone (600 ms, bez `!`, nieprzerywalne, boss podatny), śmierć.

Podgląd (znaki):
```
 idle/ruch   zapowiedź      ogłuszenie   przywołanie   śmierć (koniec)
   /R\      [/R\] odwr.     \R/           |R|           %%%
   [=]      [[=]] odwr.     [=]           [=]           %%%
```

```json
{
  "id": "fx_boss_rail_guardian",
  "size": {"w": 3, "h": 2},
  "anchor": "entity",
  "baseGlyph": {"rows": ["/R\\", "[=]"], "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
  "params": {
    "BOSS_MOVE_MS": 300,
    "BOSS_SWING_WINDUP_MS": 800,
    "BOSS_SWING_RECOVERY_MS": 1200,
    "BOSS_CHARGE_EVERY": 4,
    "BOSS_CHARGE_WINDUP_MS": 900,
    "BOSS_STUN_MS": 2000,
    "BOSS_SUMMON_HP_PCT": 50,
    "STRIKE_FX_MS": 100,
    "HIT_FLASH_MS": 100,
    "BOSS_CHARGE_TICKS_PER_CELL": 2,
    "BOSS_CHARGE_MS_PER_CELL": 100,
    "BOSS_CHARGE_MAX_MS_28_CELLS": 2800,
    "BOSS_SUMMON_MS": 600,
    "SUMMON_COUNT": 2,
    "SUMMON_MIN_DIST_PLAYER": 4,
    "SUMMON_ACTIVATE_MS": 500,
    "SUMMONED_D_WINDUP_MS": 450,
    "BOSS_CHARGE_SEEK_TRACK": true,
    "BOSS_CHARGE_AXIS": "horizontal",
    "BOSS_CHARGE_BAND_ROWS": 2
  },
  "states": {
    "intro": {
      "trigger": "bossIntro (wejście na arenę, M1_BOSS_INTRO)",
      "layer": "entity",
      "priority": 10,
      "loop": false,
      "durationMs": 600,
      "frames": [
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "?", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "#", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "?", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "#", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "?", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "#", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "?", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "#", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "reduceMotion": "skip",
      "note": "przebudzenie z zakłóceniem Szumu (styl §5); czysto wizualne"
    },
    "idle": {
      "trigger": "default (IDLE / CHASE / odnowienie)",
      "layer": "entity",
      "priority": 10,
      "loop": false,
      "hold": true,
      "frames": [
        {
          "ms": "untilNextState",
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "note": "ruch co 300 ms jest skokowy (całe komórki) – bez osobnej animacji"
    },
    "swingTelegraph": {
      "trigger": "telegraphStart kind=bossSwing",
      "layer": "cell",
      "priority": 50,
      "loop": false,
      "durationMs": 800,
      "frames": [
        {
          "ms": 800,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true}
          ]
        }
      ],
      "with": [
        "fx_telegraph.warnOverlay (żółty ! nad środkiem)",
        "fx_telegraph.timelines[\"800\"] na każdym polu strefy: 3×3 przed bossem, po stronie gracza (wyznacza logika)"
      ],
      "note": "cała bryła w odwróconej komórce, litery bez zmian"
    },
    "swingStrike": {
      "trigger": "strikeResolved (bossSwing)",
      "layer": "cell",
      "priority": 70,
      "loop": false,
      "durationMs": 100,
      "frames": [
        {
          "ms": 100,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "with": ["fx_strike na 9 polach strefy"]
    },
    "swingRecovery": {
      "trigger": "po swingStrike",
      "layer": "entity",
      "priority": 10,
      "loop": false,
      "durationMs": 1200,
      "frames": [
        {
          "ms": 1200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "note": "jak idle; 1200 ms (Balans, mechaniki v0.5)"
    },
    "chargeTelegraph": {
      "trigger": "telegraphStart kind=bossCharge (co 4. atak), w chwili gdy boss STANIE na torze `=`. Wcześniej boss idzie na najbliższy tor zwykłym ruchem 300 ms/pole (BOSS_CHARGE_SEEK_TRACK): wygląd idle/ruch, bez `!` i bez pasa",
      "layer": "cell",
      "priority": 50,
      "loop": false,
      "durationMs": 900,
      "frames": [
        {
          "ms": 900,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#0B0F14", "bg": "#FF5FC8", "bold": true}
          ]
        }
      ],
      "with": [
        "fx_telegraph.warnOverlay",
        "states.chargeTelegraph.band (stały pas, BEZ migania; linia czasu fx_telegraph.timelines[\"900\"] nie jest tu używana)"
      ],
      "note": "szarża tylko pozioma (mechaniki v0.5.2 §2.11, decyzja GD, level-m1.md §10 pkt 2). Wariant pionowy usunięty w v1.4. Pas świeci STAŁYM x (S14) przez całą zapowiedź 900 ms i dalej przez przejazd (states.charge.band), nie gaśnie przy chargeStart",
      "band": {
        "layer": "cell",
        "priority": 60,
        "anchor": "zone",
        "hold": true,
        "loop": false,
        "durationMs": 900,
        "zone": "cały tor: oba rzędy toru `=`, na którym stoi boss (2 rzędy = wysokość bryły 3×2), na całej długości od ściany do ściany, bez 6 komórek bossa",
        "frames": [{"ms": 900, "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]}],
        "ifOccupied": {"dx": 0, "dy": 0, "bg": "#4A1240"},
        "reduceMotion": "same (pas i tak jest statyczny)"
      },
      "directionLock": {
        "source": "Mechaniki S20 (odp. 25.10), wariant-twin-stick.md v0.6 / mechaniki §2.11",
        "when": "w chwili, gdy boss staje na torze = start zapowiedzi 900 ms (telegraphStart kind=bossCharge)",
        "rule": "w stronę kolumny gracza w tym momencie (znak różnicy kolumn); przy remisie w stronę dalszej ściany; potem się nie zmienia (także gdy gracz przejdzie na drugą stronę)",
        "payload": "bossTelegraph niesie kierunek od pierwszej klatki (proponowane pole dir: -1 | 1, oś x) – FX zna go od pierwszej klatki zapowiedzi",
        "fx": "pas zapowiedzi (band) świeci cały tor wg mechaniki §2.11 i sam nie pokazuje kierunku; przy chargeStart gaśnie część toru za bossem wg zablokowanego dir (states.charge.band)"
      }
    },
    "charge": {
      "trigger": "chargeStart (koniec zapowiedzi 900 ms)",
      "endsOn": ["chargeWallHit"],
      "layer": "cell",
      "priority": 50,
      "loop": true,
      "durationMs": "untilWallHit",
      "frames": [
        {
          "ms": 100,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "band": {
        "layer": "cell",
        "priority": 60,
        "anchor": "zone",
        "zone": "pas szarży = 2 rzędy toru `=` (wysokość bryły), od bossa do ściany na końcu toru w kierunku szarży (pozioma, w stronę kolumny gracza; przy remisie w stronę dalszej ściany). Przy chargeStart gaśnie część toru za bossem, a pola już przejechane wypadają z pasa (logika aktualizuje strefę co krok)",
        "loop": false,
        "hold": true,
        "frames": [
          {
            "ms": "untilWallHit",
            "cells": [{"dx": 0, "dy": 0, "ch": "x", "fg": "#FF5FC8", "bg": "#4A1240", "bold": true}]
          }
        ],
        "ifOccupied": {"dx": 0, "dy": 0, "bg": "#4A1240"},
        "note": "pas świeci przez cały przejazd STAŁYM x, bez migania (S14, przyjęte w mechanice v0.5.2); gracz w pasie widoczny na tle #4A1240. Unik = krok w pionie z rzędów toru"
      },
      "trail": {
        "layer": "ground",
        "priority": 20,
        "anchor": "zone",
        "zone": "pola zwolnione przez bryłę w danym kroku",
        "frames": [
          {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#FF5FC8", "bold": true}]},
          {"ms": 100, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#56606B"}]}
        ]
      },
      "playerHit": {
        "when": "bryła wjeżdża na pole gracza – obrażenia RAZ na szarżę (logika)",
        "play": ["fx_strike na polu gracza", "fx_hit_player"]
      },
      "note": "przejazd 2 ticki na pole (100 ms/pole, 10 pól/s) – jedna klatka na krok bryły; maks. ok. 2800 ms przy torze 28 pól"
    },
    "chargeImpact": {
      "trigger": "chargeWallHit",
      "layer": "cell",
      "priority": 70,
      "loop": false,
      "durationMs": 100,
      "frames": [
        {
          "ms": 100,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "with": ["fx_strike na polach ściany przed bossem (tylko efekt, ściana bez zmian)"]
    },
    "stunned": {
      "trigger": "bossStunned (po chargeImpact)",
      "endsOn": ["bossStunEnd"],
      "layer": "cell",
      "priority": 55,
      "loop": false,
      "durationMs": 2000,
      "frames": [
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "reduceMotion": [
        {
          "ms": 2000,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#0B0F14", "bg": "#FFFFFF", "bold": true},
            {"dx": 2, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "note": "„ramiona w dół” \\R/ (kształt = ogłuszenie, bez koloru) + słaby punkt R miga na biało co 200 ms (styl §4). Trafienie R zadaje ×2 (logika)"
    },
    "summon": {
      "trigger": "bossSummon (jednorazowo: pierwszy tick z HP ≤ 50%, po rozstrzygnięciu bieżącego ataku)",
      "endsOn": [],
      "layer": "cell",
      "priority": 50,
      "loop": false,
      "durationMs": 600,
      "frames": [
        {
          "ms": 300,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "|", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "|", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 300,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "noWarnOverlay": true,
      "hitDuring": "fx_hit_boss (zwykłe obrażenia, bez ×2 słabego punktu; R nie miga)",
      "spawnCells": {
        "layer": "ground",
        "priority": 20,
        "anchor": "zone",
        "zone": "2 wolne pola w promieniu 3 od bossa, min. 4 pola (BFS) od gracza, nie na pasie toru (logika)",
        "frames": [
          {"ms": 300, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#FF5FC8"}]},
          {"ms": 300, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#FF5FC8", "bold": true}]}
        ],
        "then": "na końcu animacji (600 ms) pojawiają się encje d"
      },
      "activation": {
        "trigger": "summonedSpawn",
        "anchor": "każdy przywołany dron",
        "layer": "cell",
        "priority": 45,
        "loop": false,
        "durationMs": 500,
        "frames": [{"ms": 500, "cells": [{"dx": 0, "dy": 0, "ch": "d", "fg": "#FF5FC8", "bold": false}]}],
        "with": ["fx_alert (szary !, 300 ms) od startu aktywacji"],
        "note": "drony stoją 500 ms (SUMMON_ACTIVATE_MS); znak bez pogrubienia = „jeszcze nieaktywny”. Potem CHASE i zwykły glif; ich zapowiedź ciosu = fx_telegraph.timelines[\"450\"]"
      },
      "reduceMotion": "same",
      "note": "„ramiona w górę” |R|, BEZ żółtego ! (to nie cios). Boss stoi; ciosy gracza i Shock Pulse NIE przerywają animacji (mechaniki v0.5, Z13)"
    },
    "hit": {"ref": "fx_hit_boss"},
    "death": {
      "trigger": "enemyKilled (boss)",
      "layer": "cell",
      "priority": 90,
      "loop": false,
      "durationMs": 500,
      "frames": [
        {
          "ms": 100,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "%", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "&", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "#", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "?", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "#", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "%", "fg": "#FF5FC8", "bg": "#3D0F2E", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "#", "fg": "#FF5FC8", "bold": true},
            {"dx": 1, "dy": 0, "ch": "?", "fg": "#FF5FC8", "bold": true},
            {"dx": 2, "dy": 0, "ch": "%", "fg": "#FF5FC8", "bold": true},
            {"dx": 0, "dy": 1, "ch": "&", "fg": "#FF5FC8", "bold": true},
            {"dx": 1, "dy": 1, "ch": "%", "fg": "#FF5FC8", "bold": true},
            {"dx": 2, "dy": 1, "ch": "?", "fg": "#FF5FC8", "bold": true}
          ]
        }
      ],
      "after": {
        "layer": "terrain",
        "cells": [
          {"dx": 0, "dy": 0, "ch": "%", "fg": "#C9D1D9"},
          {"dx": 1, "dy": 0, "ch": "%", "fg": "#C9D1D9"},
          {"dx": 2, "dy": 0, "ch": "%", "fg": "#C9D1D9"},
          {"dx": 0, "dy": 1, "ch": "%", "fg": "#C9D1D9"},
          {"dx": 1, "dy": 1, "ch": "%", "fg": "#C9D1D9"},
          {"dx": 2, "dy": 1, "ch": "%", "fg": "#C9D1D9"}
        ],
        "until": "levelExit",
        "passable": true
      },
      "reduceMotion": [
        {
          "ms": 100,
          "cells": [
            {"dx": 0, "dy": 0, "ch": "/", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 0, "ch": "R", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 0, "ch": "\\", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 0, "dy": 1, "ch": "[", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 1, "dy": 1, "ch": "=", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true},
            {"dx": 2, "dy": 1, "ch": "]", "fg": "#FFFFFF", "bg": "#3D0F2E", "bold": true}
          ]
        }
      ],
      "sideEffects": ["tekst M1_BOSS_DEFEAT", "fx_evac_shaft.arenaShaftOpen"]
    }
  }
}
```

## 10. Ekran bazy (Vat Station 3)

Źródła: styl §4 „Baza”, `fabula/zakres-m1.md` §3 (bunkier: Reprint Vat, terminal BASE, Exchange, skrytka, wyjście), mechaniki 2.1 / 2.15 (kontrakty, ulepszenie „Lights Above the Base”, mapa sektora). Rozmiar **17 × 9**: mieści się w minimalnym widoku poziomo (31 × 17) i pionowo (17 × 21), więc baza nigdy się nie przewija.

```
#-----#####-----#     - kable w górnej ścianie: 10 odcinków = 10 fragmentów sieci (po 10%)
#...............#
|.Ω.....&.....≡.|     Ω Reprint Vat   & terminal BASE (kontrakty, mapa sektora)   ≡ skrytka
|...............|     | kable w ścianach bocznych: zapalają się po ulepszeniu Lights Above the Base
|...............|
|...............|
|.$...........>.|     $ Exchange      > winda na wyprawę (wybór przystanku)
#...............#
#################
```

```json
{
  "id": "screen_base_m1",
  "size": {"w": 17, "h": 9},
  "rows": [
    "#-----#####-----#",
    "#...............#",
    "|.Ω.....&.....≡.|",
    "|...............|",
    "|...............|",
    "|...............|",
    "|.$...........>.|",
    "#...............#",
    "#################"
  ],
  "legend": {
    "#": {"ch": "#", "fg": "#8B98A5", "solid": true},
    ".": {"ch": ".", "fg": "#3B4552", "solid": false},
    "-": {"ch": "-", "fg": "#8B98A5", "solid": true, "litFg": "#FFE14D", "note": "kabel; stan zgaszony = kolor ściany"},
    "|": {"ch": "|", "fg": "#8B98A5", "solid": true, "litFg": "#FFE14D"},
    "Ω": {
      "ch": "Ω",
      "fg": "#3DDC97",
      "bold": true,
      "solid": true,
      "asciiFallback": "8",
      "interact": "none (miejsce wydruku)",
      "name": "Reprint Vat"
    },
    "&": {
      "ch": "&",
      "fg": "#3DDC97",
      "bg": "#0F3326",
      "bold": true,
      "solid": true,
      "interact": "USE → kontrakty BASE, mapa sektora, podsumowanie",
      "name": "BASE terminal"
    },
    "≡": {
      "ch": "≡",
      "fg": "#C9D1D9",
      "solid": true,
      "asciiFallback": "=",
      "interact": "USE → skrytka (30/40 slotów)",
      "name": "Stash"
    },
    "$": {
      "ch": "$",
      "fg": "#3DDC97",
      "bg": "#0F3326",
      "bold": true,
      "solid": true,
      "interact": "USE → Exchange (kup/sprzedaj, kontrakt Exchange, Med-Patch)",
      "name": "Exchange"
    },
    ">": {
      "ch": ">",
      "fg": "#C9D1D9",
      "bg": "#2A2F36",
      "bold": true,
      "solid": true,
      "interact": "USE → wyjazd windą (wybór przystanku 1/2/3)",
      "name": "Lift"
    }
  },
  "interactRange": 1,
  "spawns": {"afterPrint": [2, 3], "afterLift": [13, 6], "facingAfterPrint": "S", "facingAfterLift": "W"},
  "cables": {
    "gridFragments": {
      "cells": [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0]],
      "rule": "zapalone pierwsze N odcinków od lewej do prawej, N = grid_pct / 10 (0–10)"
    },
    "lightsAboveBase": {
      "cells": [[0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [16, 2], [16, 3], [16, 4], [16, 5], [16, 6]],
      "rule": "wszystkie zapalone po zbudowaniu ulepszenia (M1_TERM_08 + koszt), tekst M1_BASE_08"
    }
  },
  "camera": {"centerMap": true, "note": "mapa mniejsza niż widok: wyśrodkować; HUD bazy bez AT RISK"},
  "status": "ZALEŻNE OD DECYZJI PRODUCENTA (hub vs mapa, S19): przy bazie-mapie to obowiązujący układ (level-m1.md §4, zatwierdzony przez GD); przy hubie referencja / możliwe tło huba (propozycja CiS)"
}
```

Animacje bazy:


```json
{
  "id": "fx_base_print",
  "trigger": "basePrint (po ekranie śmierci i przy pierwszym wydruku; tekst M1_BASE_03 / M1_BASE_03B albo M1_BASE_01)",
  "status": "ZALEŻNE OD DECYZJI PRODUCENTA (hub vs mapa, S19): wariant `map` przy bazie-mapie, wariant `hub` przy bazie-hubie. Oba trwają 600 ms",
  "loop": false,
  "durationMs": 600,
  "params": {"PRINT_ANIM_MS": 600},
  "variants": {
    "map": {
      "note": "v1.0–v1.2: animacja na mapie bazy (Ω (2,2), spawns.afterPrint)",
      "parts": [
        {
          "name": "vat",
          "layer": "cell",
          "priority": 30,
          "anchor": "Ω (2,2)",
          "frames": [
            {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#FFFFFF"}]},
            {"ms": 100, "cells": [{"dx": 0, "dy": 0}]},
            {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#FFFFFF"}]},
            {"ms": 300, "cells": [{"dx": 0, "dy": 0}]}
          ]
        },
        {
          "name": "body",
          "layer": "cell",
          "priority": 30,
          "anchor": "spawns.afterPrint",
          "frames": [
            {"ms": 200, "cells": [{"dx": 0, "dy": 0, "ch": "·", "fg": "#3DDC97"}]},
            {"ms": 200, "cells": [{"dx": 0, "dy": 0, "ch": "%", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}]},
            {"ms": 200, "cells": [{"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}]}
          ],
          "note": "ciało „drukuje się”: punkt → kształt → gracz; sterowanie oddane po 600 ms"
        }
      ],
      "reduceMotion": {
        "vat": "skip",
        "body": [{"ms": 600, "cells": [{"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}]}]
      }
    },
    "hub": {
      "note": "v1.3: ekran przejścia przed hubem (warstwa screen); nigdy nie leży nad ORDERS/LIFT",
      "layer": "screen",
      "priority": 80,
      "anchor": "screen.center (środek obszaru gry; dx/dy w komórkach siatki UI)",
      "frames": [
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": -1, "ch": "Ω", "fg": "#FFFFFF", "bold": true},
            {"dx": 0, "dy": 0, "ch": "·", "fg": "#3DDC97"}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": -1, "ch": "Ω", "fg": "#3DDC97", "bold": true},
            {"dx": 0, "dy": 0, "ch": "%", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}
          ]
        },
        {
          "ms": 200,
          "cells": [
            {"dx": 0, "dy": -1, "ch": "Ω", "fg": "#3DDC97", "bold": true},
            {"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}
          ]
        }
      ],
      "background": "#0B0F14 (pełne tło, bez mapy)",
      "next": "hub bazy (UI)",
      "reduceMotion": [
        {
          "ms": 600,
          "cells": [
            {"dx": 0, "dy": -1, "ch": "Ω", "fg": "#3DDC97", "bold": true},
            {"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}
          ]
        }
      ]
    }
  }
}
```


```json
{
  "id": "fx_base_lift_arrive",
  "trigger": "baseArriveByLift (po ewakuacji, tekst M1_BASE_05)",
  "loop": false,
  "durationMs": 400,
  "parts": [
    {
      "name": "lift",
      "layer": "cell",
      "priority": 30,
      "anchor": "> (14,6)",
      "frames": [
        {"ms": 200, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#C9D1D9"}]},
        {"ms": 200, "cells": [{"dx": 0, "dy": 0}]}
      ]
    },
    {
      "name": "player",
      "layer": "cell",
      "priority": 30,
      "anchor": "spawns.afterLift",
      "frames": [
        {"ms": 200, "cells": [{"dx": 0, "dy": 0, "ch": ".", "fg": "#3B4552"}]},
        {"ms": 200, "cells": [{"dx": 0, "dy": 0, "ch": "@", "fg": "#FFFFFF", "bg": "#1F3B57", "bold": true}]}
      ]
    }
  ],
  "reduceMotion": "same",
  "status": "ZALEŻNE OD DECYZJI PRODUCENTA (hub vs mapa, S19): przy bazie-mapie (level-m1.md §4) używany bez zmian; przy hubie zastępuje go fx_screen_to_base (2000 ms) i od razu hub"
}
```


```json
{
  "id": "fx_base_terminal_new",
  "trigger": "newContractAvailable (M1_BASE_10)",
  "endsOn": ["terminalOpened"],
  "layer": "cell",
  "priority": 20,
  "anchor": "& (8,2)",
  "loop": true,
  "durationMs": "untilOpened",
  "frames": [
    {"ms": 500, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#3DDC97"}]},
    {"ms": 500, "cells": [{"dx": 0, "dy": 0}]}
  ],
  "reduceMotion": [{"ms": 1000, "cells": [{"dx": 0, "dy": 0, "fg": "#0B0F14", "bg": "#3DDC97"}]}],
  "status": "ZALEŻNE OD DECYZJI PRODUCENTA (hub vs mapa, S19): przy bazie-mapie używany bez zmian; przy hubie nowy kontrakt pokazuje UI w ORDERS (T13)"
}
```


```json
{
  "id": "fx_base_cable_light",
  "trigger": "gridFragmentLit | baseUpgradeBuilt (pierwsze wejście do bazy po zdarzeniu)",
  "layer": "cell",
  "priority": 20,
  "anchor": "zone (nowo zapalone odcinki kabla)",
  "loop": false,
  "durationMs": 600,
  "frames": [
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#FFE14D"}]},
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#8B98A5"}]},
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#FFE14D"}]},
    {"ms": 100, "cells": [{"dx": 0, "dy": 0, "fg": "#8B98A5"}]},
    {"ms": 200, "cells": [{"dx": 0, "dy": 0, "fg": "#FFE14D"}]}
  ],
  "after": "stan stały litFg",
  "reduceMotion": [{"ms": 600, "cells": [{"dx": 0, "dy": 0, "fg": "#FFE14D"}]}],
  "status": "ZALEŻNE OD DECYZJI PRODUCENTA (hub vs mapa, S19): przy bazie-mapie używany bez zmian (Lights I–III widoczne); przy hubie postęp świateł trzeba pokazać na ekranie huba (CiS v1.6 §13)"
}
```

## 10a. Okno terminala Power Lines: litery odbiorników (v1.3, przegląd UI pkt 1)

Propozycja do akceptacji Concept i Styl. Rozszerza `styl-ascii.md` §11; okno terminala jest warstwą UI, a nie mapą świata, więc litery nie łamią zasady „litery = wrogowie”.

```json
{
  "id": "ui_power_lines_receiver_label",
  "status": "ZATWIERDZONE przez Concept i Styl (styl-ascii.md v1.6 §13 pkt 1)",
  "context": "okno terminala Power Lines (warstwa UI nad pauzą, nie mapa świata); mechaniki v0.5.2 §2.14a / ui-m1.md §12.3: litery A–I w komórce odbiornika i w panelu, bez dymka; maks. 4 odbiorniki w M1 (A–D)",
  "letters": "A, B, C, D… według kolejności odbiorników w JSON zagadki (od góry, potem od lewej)",
  "cell": {
    "letterPos": "lewy górny róg komórki, wewnątrz ramki",
    "letterSize": "ok. 45% wielkości glifu cyfry",
    "letterBold": false,
    "mainGlyph": "cyfra zapotrzebowania (środek komórki, styl §11) – litera to tylko etykieta",
    "letterColorRule": "#8B98A5 we wszystkich stanach; na tle #3DDC97 (świeci) i #FF5FC8 (przepalony) #0B0F14",
    "smallCell": {
      "when": "komórka < 30 px (telefon w poziomie)",
      "action": "etykieta nad siatką, w linii opisu, zamiast w komórce"
    }
  },
  "states": {
    "beforeSend": {
      "letter": {"fg": "#8B98A5", "bold": false},
      "digit": {"fg": "#C9D1D9", "bold": true},
      "frame": "pojedyncza #8B98A5"
    },
    "lit": {"letter": {"fg": "#0B0F14", "bold": false}, "digit": {"fg": "#0B0F14"}, "bg": "#3DDC97"},
    "dark": {"letter": {"fg": "#8B98A5", "bold": false}, "digit": {"fg": "#C9D1D9"}, "frame": "przerywana"},
    "burnt": {"letter": {"fg": "#0B0F14", "bold": false}, "digit": {"ch": "x", "fg": "#0B0F14"}, "bg": "#FF5FC8"}
  },
  "panelRow": {
    "format": "{letter} {device} {got}/{need}",
    "letter": {"fg": "#C9D1D9", "bold": true},
    "note": "ten sam znak co w komórce = powiązanie bez koloru; {device} wg M-P3 (consumer_names), bez niego DEVICE"
  },
  "reduceMotion": "same (statyczne)"
}
```

## 10b. Ramka klawiszy samouczka przy `@` (v1.5)

Obecny wariant ze strzałkami zostaje, bo zatwierdziło go CiS. Wariant `wasdTwinStick` pod sterowanie twin-stick (Silnik 24c1276) to propozycja, która **czeka na akceptację Concept i Styl** (S22).

```json
{
  "id": "ui_tutorial_key_frame",
  "context": "samouczek T01: ramka UI (DOM) przy `@` z klawiszami ruchu; reguły pierwszeństwa bez zmian (§15 pkt 2, CiS v1.6 §13 pkt 2)",
  "precedence": "nie zasłania wroga, `!`, odwróconej komórki ani pola `x`; gdy nad `@` jest zajęte – pod `@`; gdy i tam – chowa się na czas zapowiedzi",
  "frame": {"bg": "hintBg rgba(11,15,20,0.9)", "border": "#8B98A5"},
  "touch": "zamiast klawiszy wskazówka joysticka (bez zmian)",
  "hideAfter": "pierwsze ruchy; nie wraca",
  "activeVariant": "arrows (zatwierdzone przez CiS v1.6) – do czasu akceptacji wasdTwinStick",
  "variants": {
    "arrows": {
      "status": "ZATWIERDZONE przez CiS (styl v1.6 §13 pkt 2)",
      "layout": "krzyż wokół `@`: ↑ nad, ← z lewej, ↓ pod, → z prawej",
      "fg": "#C9D1D9",
      "bold": false,
      "note": "po commicie Silnika 24c1276 strzałki NIE ruszają (ruch = WASD, strzałki celują), więc dla ruchu ten wariant jest nieaktualny"
    },
    "wasdTwinStick": {
      "status": "PROPOZYCJA – CZEKA NA CiS (Concept i Styl)",
      "when": "sterowanie PC twin-stick (Silnik 24c1276; ui-m1.md §11: {KEY_MOVE} = „WASD”)",
      "layout": "krzyż wokół `@`: [W] nad, [A] z lewej, [S] pod, [D] z prawej",
      "text": ["[W]", "[A]", "[S]", "[D]"],
      "fg": "#8B98A5",
      "bold": false,
      "case": "wielkie litery w nawiasach",
      "aimPreview": "strzałki ↑ ← ↓ → zostają tylko w podglądzie kierunku ataku (celowanie strzałkami), w kolorze #C9D1D9",
      "note": "litery tylko w ramce UI (nie w komórkach mapy) – ten sam wyjątek od styl §1 pkt 2 co dotąd"
    }
  }
}
```

## 11. Dodatkowo (opcjonalne w M1): zakłócenie Szumu

Styl §5. Element nie był w zadaniu, ale wróg bez niego jest kompletny – PROG może go pominąć w M1.

```json
{
  "id": "fx_szum_glitch",
  "trigger": "timer per wróg: losowo co 4000–8000 ms z OSOBNEGO kosmetycznego RNG (nie PRNG gry: nie trafia do zapisu i nie wpływa na determinizm symulacji; wymóg Silnika)",
  "blockedWhen": ["telegraph", "hitFlash", "death"],
  "layer": "cell",
  "priority": 15,
  "anchor": "entity",
  "loop": false,
  "durationMs": 50,
  "frames": [{"ms": 50, "cells": [{"dx": 0, "dy": 0, "ch": "{random:%&#?}"}]}],
  "note": "1 tick: litera wroga zmienia się w losowy znak z % & # ? w tym samym kolorze",
  "reduceMotion": "skip",
  "rng": "cosmetic (osobny, nie zapisywany); ten sam RNG losuje znak {random}"
}
```

## 12. Kontrola (wykonana 2026-10-25)

Skrypt wyciągnął wszystkie bloki ```json z tego pliku i sprawdził: (1) każdy parsuje się przez `python -m json.tool`; (2) każdy kolor `#RRGGBB` należy do palety `styl-ascii.md` v1.1; (3) każdy czas klatki to wielokrotność 50 ms; (4) suma klatek = `durationMs` tam, gdzie oba są liczbami; (5) linie czasu zapowiedzi sumują się do 450 / 500 / 600 / 700 / 800 / 900 ms i żadna nie jest krótsza niż 450 ms; (6) wiersze mapy bazy mają po 17 znaków. Wynik v1.6 (ponownie uruchomiony `validate.py`, 2026-10-25 ok. 22:15; od v1.4 także `rgba()` i `fx_common.palette`): **30 bloków JSON, 30 poprawnych, 0 błędów** (parsowanie `json.tool`, paleta, siatka 50 ms, sumy klatek, zapowiedzi ≥ 450 ms, mapa bazy; test kontrolny z celowo wprowadzonym błędem został wykryty).

## 13. Do podmiany po stronie PROG (nie zmieniałem ich plików)

1. **`src/data/style.ts` (`DUMMY_TELEGRAPH_GLYPH`, `COMBAT_STYLE`)** – obecne wartości robocze są sprzeczne ze stylem §9 i mechaniką 1.7:
   - zapowiedź używa wielkiej litery `C`. Ma zostać mała litera w odwróconej komórce: tło `#FF5FC8`, znak `#0B0F14`;
   - tło pola celu to `#5A0F1E`, a ma być `#4A1240`;
   - `x` i `*` są żółte (`#FFE14D`), a mają być w kolorze `#FF5FC8`.

   Proponuję, żeby `COMBAT_STYLE` czytał wartości z `fx_telegraph` i `fx_strike`.
2. **Czcionka:** subset `JetBrainsMono-*-subset.woff2` **nie ma znaków `§`, `¤`, `Π`** (sprawdzone fontTools). `Ω ≡ · • ■ ▓ ≈` są. Przed M1 trzeba dorobić subset z tymi trzema znakami. Bez tego Buddy Drone, Data Core i drzwi rysują się zamiennikiem albo pustym polem.
3. Nowe zdarzenia logiki potrzebne do wyzwalaczy:
   - `telegraphStart`, `strikeResolved`, `telegraphInterrupted`, `enemyAlert`;
   - `dashStart`, `pulseCast`, `pulseFire`, `statusApplied/Expired:Shock`;
   - `droneCast`, `droneSpawn`, `droneFire`, `droneHit`, `droneExpired`, `droneDestroyed`;
   - `evacCallStart`, `evacCallInterrupted`, `evacCallDone`, `liftArrived`, `liftDeparted`, `playerEvacuated`;
   - `bossIntro`, `chargeStart`, `chargeWallHit`, `bossStunned`, `bossStunEnd`, `bossSummon`, `summonedSpawn`, `bossDefeated`;
   - (v1.1) `playerDeathFreezeEnd`, `continuePressed` (od v1.3 `nextPressed`: tylko tap/Enter), `liftDepartEnd`, `baseLiftUse`; zdarzenie `playerDied` musi nieść id zabójcy (v1.3: `killer {entityId?, strikeOrigin}`, jak `getCombatDeath()` / `render/fx-layer.ts`), a ekran śmierci potrzebuje 3 ostatnich trafień z dziennika obrażeń;
   - `basePrint`, `baseArriveByLift`, `newContractAvailable`, `gridFragmentLit`, `baseUpgradeBuilt`.

   Zdarzenia M0 (`enemyHit`, `playerHit`, `enemyMiss`, `enemyKilled`, `playerDied`) zostają bez zmian.

## 14. Założenia do potwierdzenia i sprzeczności między źródłami

### Decyzje po akceptacji v1.0 (2026-10-25, GD przez Producenta)

- Z1–Z4, Z7, Z8, Z10, Z11, Z14–Z16: bez zmian.
- Z5: potwierdzone przez GD. W M1 wrogowie nie odradzają się w trakcie poziomu, wrak `%` zostaje.
- Z9: Shock przy „Reduce motion” sygnalizowany tylko kolorem. Wyjątek od zasady 1 zaakceptowany.
- Z6, Z12, Z13: rozstrzyga dział Mechaniki. Do czasu decyzji obowiązują wartości z tego pliku.
- S6: `*` zostaje w trzech rolach. Wracamy do tematu, jeśli test czytelności QA (C8) wykaże pomyłki.
- S11: `<` w strefie, `>` w bazie, bez zmian.
- S5: czcionkę z `§ ¤ Π` priorytetowo przygotowuje Silnik i Narzędzia, a wdraża LUZ Pracownik 4.

### Decyzje Mechaniki v0.5 wprowadzone w v1.1 (2026-10-25)

- **Z6 – ROZSTRZYGNIĘTE:**
  - 500 ms zatrzymania z podświetlonym zabójcą;
  - ekran śmierci z `M1_BASE_04`, `M1_DEATH_01` i `M1_DEATH_02`;
  - 1500 ms bez pominięcia, potem przycisk NEXT (`M1_DEATH_BTN`, v1.2), samo przejście po 5000 ms, dalej wydruk 600 ms;
  - stałe 3000 ms usunięte (`fx_death_player`, `fx_death_screen`).
- **Z12 – ROZSTRZYGNIĘTE:**
  - szarża 2 ticki na pole (100 ms/pole, tor ~28 pól = maks. 2,8 s);
  - pas 2 pola (poziomo) / 3 pola (pionowo) do ściany, świeci przez zapowiedź 900 ms i cały przejazd *(od v1.4 tylko poziomo: 2 rzędy toru, zapowiedź = cały tor)*;
  - obrażenia raz, gdy bryła wjedzie na pole gracza.
- **Z13 – ROZSTRZYGNIĘTE:**
  - przywołanie trwa 600 ms, boss stoi i jest podatny (bez ×2), bez `!`; ciosy ani Shock go nie przerywają;
  - drony pojawiają się na końcu animacji, ≥ 4 pola od gracza;
  - 500 ms aktywacji z szarym ALERT 300 ms, zapowiedź 450 ms.
- **Z5 – potwierdzone** (mechaniki v0.5: brak odradzania wrogów w trakcie poziomu M1).
- **S7 – ZAMKNIĘTE:** błąd w `prog/sterowanie.md`, zgłoszony do UI. Wezwanie windy zostaje 1500 ms.
- **S9 – ZAMKNIĘTE:** Shock Pulse działa na obszar 5×5. Opisy poprawione, klucz JSON `ring` zostaje dla zgodności.
- Przy okazji (zgodność z v0.5): odnowienie zamachu bossa 1200 ms; zapowiedzi minimum 450 ms; odjazd windy 1000 ms + ekran przejazdu 2000 ms.

### Decyzje wprowadzone w v1.2 (2026-10-25)

- **S12 – ROZSTRZYGNIĘTE przez GD:** podświetlenie zabójcy zatwierdzone bez zmian:
  - biała odwrócona komórka, 3 × 100 ms w 500 ms, a przy „Reduce motion” stała; u bossa 6 komórek;
  - zabójca zginął w tym samym ticku → pole, z którego padł cios;
  - w danych jako `anchorRules`.
- **S15 – ROZSTRZYGNIĘTE (GD, R6 opcja A):**
  - alarm przy przyjeździe windy, promień 12, szary `!` (`fx_alert`), `M1_SYS_05`;
  - wezwanie 1000 ms (pasek 10 × 100 ms);
  - ponowne wezwanie po 5 s (odliczanie 5 s).
- **S13 – ZAMKNIĘTE (Lore §12.1, GD):** `M1_DEATH_BTN` = NEXT; `M1_DEATH_01` i `M1_DEATH_02` z regułami brzegowymi w `fx_death_screen`.
- **S16 – ROZSTRZYGNIĘTE:** `mechaniki-m1.md` v0.5.2 ma R6 A (§2.9, §2.16, §2.17 pkt 7).
- **S18:** fallback zbędny w M1, bo ciecz to dekoracja (v0.5.2).
- Otwarte po v1.2: S17 (plik tekstów bez wpisu zatwierdzenia, inny format tokenu).

### Decyzje wprowadzone w v1.3 (2026-10-25)

- **S17 – ZAMKNIĘTE:** `teksty-m1-en.md` §12 zatwierdzone przez GD; `{hit_n}` = „-{dmg}”.
- **S18 – ZAMKNIĘTE** wg mechaniki v0.5.2 §2.11 (ciecz bez obrażeń); `M1_DEATH_01_HAZ` nieużywane w M1.
- **Ekran śmierci** (mechaniki v0.5.2 §2.14a M8): NEXT tylko tap/Enter, auto-przejście 5000 ms zostaje, auto-pauza zatrzymuje oba zegary.
- **Szum:** kosmetyczny RNG poza zapisem (Silnik).
- **Payloady:** `entityId` zamiast `attackerId` (kod; spec nie nazywa pól).
- **Baza-hub:** wydruk jako ekran przejścia; animacje mapy bazy nieużywane w M1. *(Zmienione w v1.4: zależne od decyzji Producenta, S19.)*

### Decyzje wprowadzone w v1.4 (2026-10-25)

- **Szarża bossa:** tylko pozioma (GD; mechaniki v0.5.2 §2.11; `level-m1.md` §10 pkt 2). Pas = 2 rzędy toru `=`, zapowiedź 900 ms podświetla cały tor stałym `x`, przejazd do ściany.
- **Concept i Styl v1.6 §13:**
  - litery odbiorników zatwierdzone;
  - ramka klawiszy zatwierdzona z regułami pierwszeństwa; na dotyku wskazówka joysticka; ramka znika po pierwszych ruchach i nie wraca;
  - `#121821` w palecie; `hintBg` zatwierdzony.
- **Baza:** S19 (Producent).



### Założenia (źródła tego nie określają, wybrałem wartość)
| # | Założenie | Kto potwierdza |
|---|---|---|
| Z1 | Pole celu **wieżyczki** (`t`): znak `•` (pocisk wroga) na tle `#2A2F36`, zamiast `x` na `#4A1240`. Mechanika 2.10 wymaga tylko „innego tła niż wręcz” i zostawia wybór GRAF/UI. Różni się kształtem i tłem | GD, Mechaniki |
| Z2 | Znacznik ciosu `*` (1.7 pkt 5, kolor nieokreślony): `#FF5FC8` na tle pola celu | GD |
| Z3 | Trafienie wroga: **cała komórka biała** (tło `#FFFFFF`, znak `#0B0F14`), tak jak już robi PROG. Boss: tylko znaki białe (mniejszy obszar błysku). Trafienie zostaje też przy „Reduce motion” (pojedynczy błysk, a nie miganie) | GD, QA |
| Z4 | Gracz trafiony: aureola miga 2 razy (100 + 100 + 100 = 300 ms). Mechanika mówi tylko „miga” | GD |
| Z5 | **(potwierdzone przez GD i Mechaniki v0.5)** Śmierć wroga: 100 ms białego błysku, 100 ms zakłócenia `?`, potem wrak `%` `#C9D1D9` do końca poziomu. Mechanika M1 nie opisuje respawnu wrogów w trakcie poziomu, więc zakładam, że go nie ma | Mechaniki |
| Z6 | ~~Ekran śmierci w M1 trwa 3000 ms (`PLAYER_RESPAWN_MS` z M0), z tekstem `M1_BASE_04` w `#FF5FC8`, a po nim wydruk w bazie (600 ms)~~ **ROZSTRZYGNIĘTE (v1.1):** 500 ms zatrzymania z zabójcą, ekran 1500 ms bez pominięcia / NEXT (`M1_DEATH_BTN`) / samo przejście po 5000 ms, wydruk 600 ms | Mechaniki, UI – zamknięte |
| Z7 | Dash: kolor śladu `·` = `#BDEBFF` (energia gracza), gaśnie do `#56606B`. Nietykalność 200 ms pokazana zmianą tła aureoli na `#2A2F36` | GD |
| Z8 | Shock Pulse: ładowanie `·` w promieniu 1 przez 150 ms przygotowania, potem rozbłysk obszaru `*` `#BDEBFF` na tle `#1F3B57` (50 ms promień 1 → 100 ms krawędź 5×5 = 150 ms). Rozbłyskuje cały obszar działania, nie tylko obwód | GD |
| Z9 | Status Shock na wrogu: co 400 ms znak na 100 ms w `#BDEBFF`. Przy „Reduce motion” znak jest stale w `#BDEBFF`, a to **sygnał tylko kolorem** (wyjątek od zasady 1 stylu; Shock widać też po spowolnionym ruchu) | GD, QA |
| Z10 | Buddy Drone: przy postawieniu 200 ms pokazuje się obwód promienia prowokacji 4. Smuga strzału `·` trwa 50 ms. Ostatnie 2 s życia aureola miga co 250 ms | GD |
| Z11 | Ewakuacja: pulsowanie spoczynkowe 1,5 s z tłem i 0,5 s bez tła. Pasek wezwania ma 10 × 100 ms (v1.2, R6 A; było 10 × 150). Podczas dojazdu co 1 s jest błysk i odliczanie. Otwarta winda to odwrócona komórka, a w ostatnich 3 s miga. Po odjeździe jest szare odliczanie 5 s (v1.2, R6 A; było 15 s) | GD, UI |
| Z12 | ~~Boss – prędkość szarży nie jest w mechanice. W danych animacji przyjmuję 1 pole na tick (50 ms).~~ **ROZSTRZYGNIĘTE (v1.1):** 100 ms/pole; pas 2 pola (poziomo) / 3 (pionowo) do ściany, świeci przez zapowiedź i przejazd; obrażenia raz. Strefa zamachu 3×3 leży po stronie gracza | Mechaniki, Gameplay – zamknięte **v1.4:** szarża tylko pozioma (GD, mechaniki v0.5.2 §2.11), więc wariant „3 w pionie” jest usunięty. Pas = 2 rzędy toru; zapowiedź podświetla cały tor |
| Z13 | ~~Boss – czas przywołania nie jest w mechanice.~~ **ROZSTRZYGNIĘTE (v1.1):** 600 ms animacji `\|R\|` bez `!`; boss stoi, podatny bez ×2, nieprzerywalne; drony ≥ 4 pola od gracza, 500 ms aktywacji (ALERT 300 ms), zapowiedź 450 ms | Mechaniki – zamknięte |
| Z14 | Boss: ogłuszenie pokazane kształtem `\R/` i miganiem `R` co 200 ms. Intro 600 ms z zakłóceniem. Wrak 3×2 `%` | GD |
| Z15 | Baza ma rozmiar 17 × 9 i rozkład z sekcji 10:<br>- terminal BASE to `&` `#3DDC97` bold na `#0F3326` (styl nie definiuje terminala bazy, a odwrócony żółty `&` znaczy „nierozwiązana zagadka”);<br>- 10 odcinków kabla to 10 fragmentów sieci, a boczne kable zapala ulepszenie Lights Above the Base;<br>- wyjście `>` działa przez USE, nie przez wejście na pole | GD, Mechaniki, UI |
| Z16 | Długości klatek nieopisane w źródłach (efekty pomocnicze, np. wydruk 600 ms – od v0.5 to też `PRINT_ANIM_MS`; przejście do bazy od v1.1 według `LIFT_DEPART_MS` / `LIFT_RIDE_MS`) są wielokrotnościami 50 ms i nie blokują logiki | – |

### Sprzeczności i niejasności między źródłami
| # | Co | Jak rozwiązałem |
|---|---|---|
| S1 | Zadanie wskazuje `mechaniki-m1.md` **v0.3**, a plik ma już **v0.4** (Panel Drone 400 ms, boss 800/900, szarża 900, nazwa Buddy Drone) | biorę v0.4; **v1.1: aktualizacja do v0.5** |
| S2 | Styl §4: trafienie miga „przez **1 klatkę**”. Mechanika 1.7 / 1.14: `HIT_FLASH_MS` = **100 ms** | 100 ms (mechanika rządzi czasami) |
| S3 | Styl §4: `!` „~0,4–0,6 s przed ciosem”. Mechanika v0.5: zapowiedź 450–900 ms (wieżyczka 700, boss 800/900) | czas = `attackWindupMs` każdego wroga. Do aktualizacji w stylu |
| S4 | `style.ts` PROG (roboczo): wielka litera `C` w zapowiedzi, tło `#5A0F1E`, żółte `x` i `*`. Sprzeczne ze stylem §9 i mechaniką 1.7 | dane tutaj są zgodne ze stylem; PROG podmienia (sekcja 13) |
| S5 | Styl §9: znaki „sprawdzone w JetBrains Mono”, ale subset czcionki w grze **nie ma `§ ¤ Π`** | do PROG / Silnik: nowy subset |
| S6 | `*` znaczy trzy rzeczy: strzał gracza (`#BDEBFF`, styl), moment ciosu wroga (mechanika 1.7) i błysk łupu rzadkości 3 (styl). Ten sam kształt, różne znaczenia | zostawiam za źródłami; różnią się kolorem i kontekstem (cios zawsze na tle pola celu). Do decyzji GD, czy zmienić znak ciosu |
| S7 | `prog/sterowanie.md` (sekcja M1, wiersz 188): „Przytrzymanie USE (**0,4 s**)”. Mechanika 2.9: wezwanie windy **1,5 s** (`EVAC_CALL_HOLD_MS`) | 1500 ms (mechanika). **ZAMKNIĘTE (v1.1):** błąd w `sterowanie.md`, zgłoszony do UI |
| S8 | Styl §9 nazywa drona „Salvage Drone”, zadanie „Helper Drone”, teksty/mechanika v0.4 – **Buddy Drone** (ostateczna) | `fx_buddy_drone` |
| S9 | Mechanika 2.5: Shock Pulse to „**pierścień** 5×5”, a działa na **cały obszar** 5×5 | rozbłysk najpierw w środku, potem na krawędzi; widać cały obszar. **ZAMKNIĘTE (v1.1):** mechanika v0.5 poprawiła na „obszar 5×5” |
| S10 | Mechanika 1.13 / 1.4 używa `c` (Scrap Crawler M0), a styl §4 v1.1 go nie miał. **Rozstrzygnięte w stylu v1.2 §10:** `c` istnieje tylko w M0, bez `C`, a w M1 zastępuje go `h` | linia czasu 500 ms zostawiona dla M0 |
| S12 (v1.1) | Mechanika v0.5 2.7 nie mówi, jak wygląda „podświetlony zabójca”, ani co robić, gdy zabójca zginął w tym samym ticku | przyjmuję białą odwróconą komórkę: 3 błyski po 100 ms w 500 ms zatrzymania, przy „Reduce motion” stała przez 500 ms (boss: 6 komórek). Gdy zabójcy nie ma, podświetlam pole, z którego padł cios. **ROZSTRZYGNIĘTE przez GD (v1.2):** zatwierdzone bez zmian; przypadki w `anchorRules` |
| S13 (v1.1) | Etykieta CONTINUE na ekranie śmierci nie ma ID w `teksty-m1-en.md` (są `M1_DEATH_01`–`02`, ale to robocze sloty Lore) | w danych tekst `CONTINUE` w `#3DDC97`. Do Lore: ID dla etykiety i finalne teksty `M1_DEATH_01`–`02`. **ZAMKNIĘTE (v1.2):** Lore `teksty-m1-en.md` §12.1, zatwierdzone przez GD: `M1_DEATH_BTN` = NEXT, `M1_DEATH_01` = „Killed by: {enemy_name}”, `M1_DEATH_02` = „Last hits: {hit_1} · {hit_2} · {hit_3}” |
| S14 (v1.1) | Pas szarży w trakcie przejazdu: mechanika mówi „zaznaczony”, nie mówi, czy miga | stałe `x` (bez migania, 2,8 s migania przy 10 Hz to ryzyko dla osób wrażliwych na błyski). Pola już przejechane wypadają z pasa **v1.4:** przyjęte w mechanice v0.5.2 §2.11; stałe `x` także w zapowiedzi 900 ms (wcześniej miganie z `timelines["900"]`) |
| S15 (v1.1) | Propozycja R6 (mechaniki 2.9, czeka na GD): alarm przy przyjeździe, wezwanie 1,0 s, ponowne wezwanie po 5 s | dane zostają przy wartościach bieżących (1500 ms, 15 s). Po decyzji GD trzeba zmienić pasek wezwania (10 × 100 ms) i odliczanie. **ROZSTRZYGNIĘTE (v1.2):** GD zatwierdził R6 opcję A; dane zmienione (1000 ms, 5 s, alarm przy przyjeździe) |
| S16 (v1.2) | `mechaniki-m1.md` v0.5.1 §2.9 i §2.16 nie mają jeszcze decyzji R6 A: wezwanie 1,5 s, alarm „w chwili wezwania”, ponowne wezwanie 15 s, `EVAC_ALERT_MOMENT` = `call`, „czeka na GD”. Kryterium 2.17 pkt 7 ma 15 s | dane GRAF idą za decyzją GD. **Do Mechaniki** (aktualizacja specu), nie rozstrzygam. **ROZSTRZYGNIĘTE (v1.2):** `mechaniki-m1.md` **v0.5.2** ma R6 A w §2.9, §2.16 (`EVAC_CALL_HOLD_MS` 1000, `EVAC_RECALL_COOLDOWN_S` 5, `EVAC_ALERT_MOMENT` arrival) i §2.17 pkt 7, zgodnie z danymi. Przy okazji wyrównałem `states.open.alarm`: szary `!` tylko nad wrogami ściągniętymi alarmem, a nie nad tymi, którzy już gonią (§2.9 pkt 3 i 8) |
| S17 (v1.2) | `teksty-m1-en.md` §12 ma nagłówek „do akceptacji GD”, a w otwartych pytaniach nr 27–28 dalej „czeka na GD”. Zatwierdzenie z 25.10 nie jest wpisane w pliku. §12.1 proponuje format tokenu `{hit_n}` = „{enemy_name} {dmg}” (np. „Curfew Guard 18”), a decyzja przekazana GRAF to „-{dmg}” | w danych „-{dmg}” (decyzja przekazana przez Producenta). **Do Lore:** wpisać zatwierdzenie i ujednolicić format tokenu. **ZAMKNIĘTE (v1.3):** `teksty-m1-en.md` §12 ma nagłówek „ZATWIERDZONE przez GD, 25.10.2026”, a §12.1 ustala `{hit_n}` = „-{dmg}” i reguły brzegowe. Wcześniej czytałem starszą wersję pliku |
| S18 (v1.2) | Zabójca nieznany: linia `M1_DEATH_01` ukryta, bez zastępczego tekstu. Styl przewiduje „niebezpieczną ciecz” `~`, która mogłaby zabić bez wroga, ale mechanika M1 nie opisuje jej obrażeń | możliwy fallback „Killed by: {hazard_name}” wymagałby nowego ID od Lore. Do decyzji GD/Lore, jeśli ciecz zada obrażenia. **Aktualizacja (v0.5.2 §2.11):** ciecz `~` w M1 to dekoracja bez obrażeń, obrażenia zadają tylko wrogowie i boss. Przypadek „zabójca nieznany” praktycznie nie występuje; reguła ukrycia linii zostaje jako zabezpieczenie. Fallback nie jest potrzebny w M1. **ZAMKNIĘTE (v1.3)** wg mechaniki v0.5.2 §2.11; `M1_DEATH_01_HAZ` nieużywane w M1 (pula M2, teksty §12.1) |
| S19 (v1.4) | Baza: `design/level-m1.md` §4 (zatwierdzony przez GD) to mapa ASCII z widocznymi Lights I–III, a `prog/ui-m1.md` §11.11 i mechaniki v0.5.2 §2.14a to menu-hub (zauważyło CiS, styl v1.6 §13) | do decyzji **Producenta**. Do tego czasu `screen_base_m1`, `fx_base_lift_arrive`, `fx_base_terminal_new` i `fx_base_cable_light` mają status „zależne od decyzji Producenta”, a `fx_base_print` ma warianty `map` i `hub`. Przy hubie trzeba pokazać postęp Lights na ekranie huba (CiS) |
| S20 (v1.4) | Szarża: mechanika mówi „zapowiedź = podświetlenie całego toru” i jednocześnie „pas = od bossa do ściany w kierunku szarży”. Nie mówi, kiedy ustalany jest kierunek ani czy część toru za bossem świeci w zapowiedzi | w danych: zapowiedź podświetla cały tor (oba kierunki), a przy `chargeStart` część za bossem gaśnie. **Do Mechaniki:** potwierdzić; jeśli kierunek jest znany od początku zapowiedzi, można świecić tylko w kierunku szarży **ZAMKNIĘTE (v1.6, Mechaniki 25.10):** kierunek ustalany i blokowany w chwili, gdy boss staje na torze (start zapowiedzi), w stronę kolumny gracza; przy remisie w stronę dalszej ściany; potem bez zmian. W danych: `chargeTelegraph.directionLock`. Pas zapowiedzi dalej świeci cały tor (§2.11) |
| S21 (v1.5) | Zamach Issue Pole: GD zatwierdził kierunek (łuk 2 pola / ~90° / obszarowo, `plan-produkcji.md` 25.10 22:01), ale spec go nie opisuje. `mechaniki-m1.md` v0.5.2 §1.3 dalej ma cios na 1 pole („Shock Baton”), a `design/wariant-twin-stick.md` (v0.6) nie istnieje | `fx_player_pole_swing` ze statusem „zależne od spec. v0.6”. Propozycja GRAF: łuk = Czebyszew 1–2 i ±45° od kierunku (8 pól), czasy z §1.3 (przygotowanie 100 ms, cykl 400 ms), efekt 200 ms. **Do Mechanik:** potwierdzić kształt łuku (czy pola po skosie na ±45° wchodzą, czy łuk przechodzi przez róg ściany), czasy i nazwę zdarzenia `playerSwing` z `dir` i `cells` **ZAMKNIĘTE (v1.6, Mechaniki 25.10, formalnie v0.6):** zawsze 8 pól, granica ±45° wchodzi (`cellsByDir` zgodne, bez poprawek); zasłanianie w `cellRules` (liczy kod gry); efekt 150 ms; payload `{entityId, dir, cells, hitIds}`; windup/cykl robocze [R] |
| S22 (v1.5) | Ramka klawiszy przy `@`: po zmianie Silnika (24c1276: ruch WASD, strzałki celują) zatwierdzony wariant ze strzałkami nie pasuje do ruchu na PC | wariant `wasdTwinStick` ([W] [A] [S] [D], `#8B98A5`, bez pogrubienia, na `hintBg`) wpisany jako propozycja, **czeka na CiS**. Do akceptacji aktywny zostaje `arrows` |
| S23 (v1.5) | Tekst `M1_GEAR_ISSUE_POLE_2` mówi „A longer, heavier pole”, a mechanika §2.3 zmienia w Mk2 tylko obrażenia (10–15), bez zasięgu | efekt łuku jest ten sam dla Pole i Pole II (zasięg 2). **Do Mechanik/Lore:** czy Pole II ma większy zasięg; jeśli tak, potrzebne `cellsByDir` dla zasięgu 3 **ZAMKNIĘTE (v1.6, Mechaniki 25.10):** Pole II ma ten sam zasięg 2, rosną tylko obrażenia; „longer” to sam opis. Pól dla zasięgu 3 nie ma |
| S11 | Strefa: szyb ewakuacji to `<`, a w bazie wyjście windą to `>` (styl §4: „jak zejście”). Ta sama winda ma dwa znaki | zostawiam za stylem. Do decyzji GD, czy to nie myli |

## 15. Przegląd GRAF dla PROG / UI i Menu (v1.3, 2026-10-25)

Źródła: `prog/ui-m1.md` §11 i §16 („Do GRAF”), `prog/game/src/data/style.ts` (stan z 2026-10-25), `mechaniki-m1.md` v0.5.2 §2.14a. Kontrasty liczone wg WCAG.

| # | Element (ID UI) | Werdykt GRAF | Poprawka / warunek | Akceptacja Concept i Styl? |
|---|---|---|---|---|
| 1 | Litery A–I odbiorników Power Lines (§12.3, G2) | **zatwierdzone z poprawką; v1.4: zatwierdzone przez CiS** (litera bez pogrubienia, `#8B98A5`, na `#3DDC97`/`#FF5FC8` w `#0B0F14`, przy komórce < 30 px nad siatką) | Litery leżą w oknie terminala, które jest warstwą UI, a nie na mapie świata, więc nie łamią zasady „litery = wrogowie”. Wygląd w komórce opisuje nowy blok `ui_power_lines_receiver_label` (sekcja 10a): mała litera w lewym górnym rogu, `#8B98A5`, cyfra zostaje na środku. W panelu wiersz `A PUMP 2/2`. W M1 wystarczą litery A–D (maks. 4 odbiorniki, M-P2) | **TAK** – rozszerza `styl-ascii.md` §11 (wygląd komórki odbiornika) |
| 2 | Ramka klawiszy przy `@` (§11.x, G-T1) | **zatwierdzone z poprawką; CiS zaakceptowało (styl v1.6 §13 pkt 2)** **v1.5:** po zmianie sterowania PC na twin-stick (Silnik 24c1276) dopisany wariant `wasdTwinStick`: [W] [A] [S] [D] krzyżem wokół `@`, `#8B98A5`, bez pogrubienia, na `hintBg`; strzałki ↑ ← ↓ → tylko w podglądzie celowania. **Czeka na CiS** (blok `ui_tutorial_key_frame`, sekcja 10b, S22) | (a) strzałki `↑ ← ↓ →` zamiast `^ < v >` (`<`/`>` to szyb i zejście); (b) pierwszeństwo: ramka nie zasłania wroga, `!`, odwróconej komórki ani pola `x`; gdy nad `@` jest zajęte, schodzi pod `@`, a gdy i tam jest zajęte, chowa się na czas zapowiedzi; (c) tło `hintBg`, ramka `#8B98A5`, strzałki/tekst `#C9D1D9`; (d) **dotyk:** zamiast klawiszy wskazówka joysticka; (e) ramka znika po pierwszych ruchach i nie wraca | zamknięte (CiS v1.6) |
| 3 | Glify strzałek do szybu (§11.6, G-T2) | **zatwierdzone z poprawką** | Glify `↑↗→↘↓↙←↖` są OK (kolor `safe` na `hudBg`: kontrast ok. 11:1). **Subset ich nie ma:** `JetBrainsMono-*-subset.woff2` zawiera tylko `→`, a font źródłowy `scripts/fonts-src` ma wszystkie. **Do Silnika:** dodać je w `font-subset.mjs`. Przy okazji brakuje też znaków ramek terminala ze stylu §11: `─│┼├┤┬┴┌┐└┘⊥≤`. Uwaga: `§ ¤ Π` są już w subsecie. Kolejność w `UI_GLYPHS.arrows` taka sama jak w `stickMarks` (E, SE, S, SW, W, NW, N, NE): `['→','↘','↓','↙','←','↖','↑','↗']` | NIE (glify UI spoza mapy; tylko informacja) |
| 4 | Kolory UI w `style.ts` (`hintBg`, `pulse`, `tutDim`, `hudBg`, `controlBg`, `controlActiveBg`, `textBackdrop`) | **zatwierdzone; v1.4 wg CiS** | Tabela 15.1. `#121821` jest w palecie (styl v1.6 §13 pkt 3) jako **pełny kolor**. **Do PROG:** `controlBg` z `rgba(18,24,33,0.55)` zmienić na `'#121821'` (bez przezroczystości); `panelBg` = `PALETTE.uiPanel` zostaje | zamknięte (CiS v1.6) |
| 5 | `fx_death_screen`: NEXT / 1500 / 5000 / auto-pauza (§11.10) | **zatwierdzone z poprawką** (dane GRAF poprawione w v1.3) | Dane zgadzają się z v0.5.2 §2.14a (M8): `M1_DEATH_BTN` „NEXT” działa **tylko po tapnięciu albo Enterze**, liczy się nowe naciśnięcie po 1500 ms; Spacja, J i ATK nie działają; auto-przejście po 5000 ms zostaje (GD); auto-pauza zatrzymuje oba zegary; stałego czasu 3000 ms nie ma od v1.1. **Do UI:** przykład w §11.10 („Last hits: Scrapper 6 · Panel Drone 9 · Curfew Guard 18”) poprawić na format Lore „Last hits: -6 · -9 · -18”. Linia ma wtedy ok. 30 znaków, więc na 568×320 mieści się w 1 wierszu, a tabela szerokości („~60 → 2 linie”) jest do aktualizacji | NIE |
| 6 | Wydruk i przyjazd windy przy bazie-hubie (G-B1) | **zależne od decyzji Producenta (S19)** | `level-m1.md` §4 (GD) opisuje bazę jako mapę z Lights I–III, a `ui-m1.md` jako hub. `fx_base_print` ma 2 warianty po 600 ms: `map` (z v1.0) i `hub` (ekran przejścia, nigdy nad ORDERS/LIFT). `fx_base_lift_arrive`, `fx_base_terminal_new`, `fx_base_cable_light` i `screen_base_m1` mają status „zależne od decyzji Producenta”. Przy hubie postęp Lights trzeba pokazać na hubie (CiS) | CiS przekazało sprawę Producentowi |

### 15.1 Kolory UI (`UI_STYLE`)

| Rola | Wartość | Baza z palety | Kontrast z tekstem | Werdykt |
|---|---|---|---|---|
| `hintBg` | `rgba(11,15,20,0.9)` + ramka `#8B98A5` (jeszcze nie ma w `style.ts`) | `#0B0F14` | `#C9D1D9` na tle: ok. 12:1 | **zatwierdzone przez CiS** (v1.6 §13 pkt 3) |
| `pulse` | `PALETTE.safe` `#3DDC97` | tak | Reduce motion: tekst `#0B0F14` na `#3DDC97` ok. 11:1 | zatwierdzone |
| `tutDim` | `rgba(11,15,20,0.72)` (jeszcze nie ma w `style.ts`) | `#0B0F14`, ta sama alfa co `fx_death_screen.dim` | – | zatwierdzone |
| `hudBg` | `rgba(11,15,20,0.9)` | `#0B0F14` | `#C9D1D9` ok. 12:1 | zatwierdzone |
| `controlBg` | `rgba(18,24,33,0.55)` | `#121821` – w palecie od styl v1.6 | `#C9D1D9` 11,5, `#8B98A5` 6,1, `#FFFFFF` 17,8 (CiS) | **poprawka (CiS):** pełny kolor `#121821`, bez rgba; `panelBg` też `#121821` |
| `controlActiveBg` | `rgba(61,220,151,0.18)` | `#3DDC97` | etykieta `#FFFFFF` na wyniku ok. 13:1 | zatwierdzone |
| `textBackdrop` | `rgba(11,15,20,0.86)` | `#0B0F14` | `#C9D1D9` ok. 11:1 | zatwierdzone |

Zasada dla PROG: przezroczystość jest dozwolona tylko na kolorach z palety (`#0B0F14`, `#3DDC97`). `#121821` to pełny kolor, bez rgba (CiS). Od v1.4 `validate.py` sprawdza w tym pliku kolory `#RRGGBB`, `rgba()` i `fx_common.palette`; pliku `style.ts` nie sprawdza.

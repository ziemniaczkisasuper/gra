# Backlog – PROG / Silnik i Narzędzia

## M2 (decyzja GD przez Mechaniki, 25.10.2026)
- Odzysk zwłok + Recovery Beacon: zapis `zoneSeed`, `generatorVersion`, lista zmian (zwłoki + rzeczy unikalne); zwykli wrogowie i łup się odradzają.
- `corpseTicksLeft` liczony tylko w tickach strefy; Zbieracze po 75/60/45 s (głęb. 1/2/3), potem 1 przedmiot co 6 s.
- Niezgodny `generatorVersion` → zwłoki na najbliższej wolnej komórce przy wejściu.
- Po wyprawie ze zwłokami (lub po ich opróżnieniu) zwłoki znikają, nowy seed.
- W M1: tylko hooki za flagą (np. `FEATURE_CORPSE_RECOVERY = false`); w M1 każda wyprawa = nowy seed, zwłoki `%` to znacznik z notatką.

## M1
- Flow field zamiast BFS per wróg.

## Kontrakty (otwarte, 25.10.2026)
- Nagrodę z `contract:completed` wypłaca moduł ekonomii/ekwipunku (jeszcze nie istnieje) – uzgodnić z Gameplay.
- `itemLost` emituje moduł ekwipunku przy śmierci.
- Źródła zdarzeń terminalSolved / itemPicked / evacuated – podpiąć, gdy powstaną te systemy.

## M1 – PWA (przydzielone przez Producenta 25.10.2026)
- Manifest + service worker (gra offline, "Add to Home Screen"; chroni zapis na iOS przed 7-dniowym czyszczeniem).

## M1 – hook FX (efekty gotowe od Pracownika 4, commit 1c39a34)
- src/data/fx-m1.ts (24 efekty), typy w src/data/fx.ts (wielokomórkowe klatki dx/dy, placeholdery {glyph} {random:..} {dmg} {secondsLeft}, ms jako nazwa parametru, parts/states/timelines/variants, klatki tekstowe i pełnoekranowe, reduceMotion).
- Hook w renderze subskrybuje zdarzenia z §13 assety-m1 (telegraphStart, strikeResolved, droneSpawn, evacCallStart…). Dziś nic nie importuje fx.ts.

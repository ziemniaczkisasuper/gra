# START – praca w Cursorze

Stan: master = kod z commita `2963c22` + dokumenty projektu w `docs/`. Zespół botów jest wstrzymany, kod piszesz sam.

## Następne zadanie

Wdrożyć **`docs/design/wariant-twin-stick.md` §9** (twin-stick: lewa gałka = ruch, prawa gałka / mysz / strzałki = kierunek ataku; Issue Pole uderza zamachem łukiem).
- §9.2 – kolejność: **14 kroków**
- §9.3 – nowe i zmienione stałe
- §9.4 – **12 kryteriów akceptacji** (sprawdzenie ręczne)

## Najważniejsze miejsca w kodzie (sprawdzone na `2963c22`)

| Co | Gdzie |
|---|---|
| Kierunek celowania `ActionState.aim: Dir8 \| null` | `src/input/actions.ts:19` |
| Źródła celowania (strzałki, mysz, gałka) | `src/input/aim.ts`; `setAimStick()` (linia 89) **nie jest jeszcze wywoływane z UI** |
| Druga gałka dotykowa – tu ją dodać | `src/ui/touch-controls.ts` |
| `BUMP_ATTACK_ENABLED: true` w `COMBAT_M1` – **zmienić na `false`** | `src/data/combat-m0.ts:105` (użycie: `src/combat/combat.ts:604`) |
| Auto-cel `pickTarget()` | `src/combat/combat.ts:733` (wywołanie: linia 616) |
| Stare ID broni `ISSUE_BATON` (do zmiany na Issue Pole) | `src/data/inventory-m1.ts:99` (`ISSUE_BATON_ITEM_ID`), `:176` (`nameId: 'M1_GEAR_ISSUE_BATON'`); też `:175`, `:208` |

## Uruchomienie

Node: wersja z `.nvmrc` (20).

```bash
npm ci          # instalacja zależności
npm run dev     # serwer deweloperski Vite (http://localhost:5173)
npm test        # testy Vitest (obecnie 404/404 zielone)
```

## Publikacja (GitHub Pages)

Gra: https://ziemniaczkisasuper.github.io/gra/ – serwowana z gałęzi `gh-pages` (sam wynik builda).

```bash
npx vite build --base=/gra/
cd dist && touch .nojekyll
git init -b gh-pages && git add -A && git commit -m "deploy <hash>"
git push -f https://github.com/ziemniaczkisasuper/gra.git gh-pages
```

`--force` tylko na `gh-pages` (same pliki builda), nigdy na `master`. Po ~1–2 min sprawdź, czy strona ładuje nowy plik `assets/index-*.js`.

## Dokumenty

- Wizja i plan: `docs/wizja-gry.md`, `docs/plan-produkcji.md`
- Mechaniki: `docs/design/mechaniki-m1.md` (v0.5.2) + wariant `docs/design/wariant-twin-stick.md` (v0.6)
- Balans, poziomy, zagadki: `docs/design/`
- UI i kontrakty kodu: `docs/prog/` (m.in. `ui-m1.md`, `kontrakty-m1.md`, `walka-m1.md`)
- Grafika ASCII, teksty, testy QA: `docs/graf/`, `docs/fabula/`, `docs/qa/`

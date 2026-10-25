# Stos techniczny – propozycja PROG / Silnik i Narzędzia (25.10.2026)
Status: PROPOZYCJA, czeka na akceptację Producenta / Game Directora.

## Decyzja: TypeScript + Vite, własny renderer siatki znaków na canvas, bez silnika
Akceptuję sugestię Producenta. Uzasadnienie:
- Grafika to siatka znaków – silnik (Godot/Unity/Phaser) nic tu nie daje, a dokłada ciężki build webowy (Godot web ~30–40 MB, wolny start na telefonie, problemy z iOS Safari).
- Czysty TS + canvas: paczka < 200 KB, start natychmiast, pełna kontrola nad pętlą i pauzą.
- Koszt 0 zł: Vite, TypeScript, Vitest – open source; hosting GitHub Pages; CI GitHub Actions (darmowe dla repo publicznych; dla prywatnych limit minut wystarcza z zapasem).

## Składniki
| Obszar | Wybór | Uwagi |
|---|---|---|
| Język | TypeScript (strict) | |
| Build / dev server | Vite | statyczny build do `dist/`, `base` ustawione pod GitHub Pages |
| Render | Canvas 2D, własny `GlyphRenderer` | font monospace, cache glifów w offscreen canvas, rysowanie tylko zmienionych komórek; skalowanie pod devicePixelRatio |
| Pętla | stały krok symulacji 20 Hz (50 ms) + render na requestAnimationFrame z interpolacją | deterministyczna logika, niezależna od FPS telefonu |
| Auto-pauza | `visibilitychange`, `blur`, `pagehide` → pauza symulacji + natychmiastowy zapis | po powrocie gra czeka na dotyk/klawisz |
| Wejście | warstwa „akcji” (move, attack, skill1..3, pause) – klawiatura i dotyk mapowane na te same akcje | dotyk i HUD: PROG / UI i Menu |
| Zapis | localStorage (mały JSON, wersjonowany, z migracjami), od M1 ewentualnie IndexedDB | eksport/import: plik .json + kod tekstowy (JSON → kompresja → base64) do skopiowania między urządzeniami |
| Losowość | własny seedowany PRNG (np. mulberry32) | powtarzalne generowanie stref i testy |
| Testy | Vitest (logika), ręczne testy na telefonie przez podgląd z GitHub Pages | |
| Jakość | ESLint + Prettier | |
| Wdrożenie | GitHub Actions: build → GitHub Pages przy pushu do `main` | |
| PWA | opcjonalnie od M1 (manifest + service worker), gra offline i „dodaj do ekranu” | |

## Struktura kodu (do uzgodnienia z PROG / Gameplay i PROG / UI i Menu)
```
src/
  core/      pętla (fixed timestep), zegar, pauza, event bus, PRNG     – Silnik i Narzędzia
  render/    GlyphRenderer, kamera, paleta (z GRAF)                    – Silnik i Narzędzia
  world/     mapa, kafle, kolizje, generowanie stref                   – Silnik i Narzędzia (+ Level Design)
  entities/  encje i komponenty (pozycja, zdrowie, AI)                 – Gameplay
  combat/    ataki, obrażenia, umiejętności, śmierć                    – Gameplay
  input/     akcje, klawiatura, dotyk                                  – UI i Menu (interfejs akcji: Silnik)
  ui/        HUD, menu, ekwipunek (DOM nad canvasem)                    – UI i Menu
  save/      serializacja, wersje, migracje, eksport/import            – Silnik i Narzędzia
  data/      dane gry jako TS/JSON (wrogowie, przedmioty, teksty EN)   – Balans, Lore
  main.ts
```
Zasady: logika gry nie dotyka DOM ani canvasa (tylko stan + zdarzenia); UI czyta stan i wysyła akcje; dane balansu w `data/`, nie w kodzie.

## Wydajność – cele M0
60 FPS renderu na średnim telefonie, symulacja 20 Hz, start < 1 s, paczka < 200 KB.

## Repozytorium
Połączone konto GitHub (connector): [zredagowane]. Repo gry: ziemniaczkisasuper/gra.
Przez połączenie nie da się założyć nowego repo ani włączyć Pages – musi to zrobić właściciel (albo dać zgodę na założenie przez przeglądarkę).
Proponowana nazwa: `gra` (lub tytuł gry, gdy będzie). Publiczne = darmowe Pages i Actions bez limitu; prywatne + Pages wymaga płatnego planu GitHub, więc przy 0 zł repo musi być PUBLICZNE.

## Plan M0 (po akceptacji)
1. Szkielet Vite + TS, ESLint, Vitest, workflow Pages.
2. core: pętla stała 20 Hz, pauza, PRNG.
3. render: siatka znaków, kamera śledząca gracza.
4. world: mapa ASCII testowa (ręczna), kolizje ze ścianami.
5. ruch gracza w czasie rzeczywistym (klawiatura; dotyk od UI i Menu).
6. auto-pauza + zapis lokalny + eksport/import.
7. Podpięcie walki (Gameplay) i HUD (UI i Menu).

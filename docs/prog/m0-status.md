# M0 – status PROG / Silnik i Narzędzia (25.10.2026, aktualizacja 21:10 CET)

Kod: `/workspace/GRA/prog/game/` (lokalnie, bez repo GitHub, nic nie wypchnięte). Opis: `game/README.md`.

## Działa
- Szkielet TS strict + Vite + Vitest + ESLint/Prettier; `base: './'`; workflow Pages gotowy, nieaktywny.
- Pętla 20 Hz (akumulator, max 5 kroków/klatkę, interpolacja), pauza z powodem `menu|text|auto`, `loop.resume()`.
- Mapa: arena 40×20 wg Mechanik 1.10 (ściany zewnętrzne, 4 filary 2×2, korytarz szer. 1, start 24 komórki od wroga, poza linią wzroku); druga mapa 60×30 pod `?map=large`.
- Ruch po siatce 8 kierunków (150/200 ms), kolizje: ściany, brak ścinania rogów, encje blokują.
- Wróg (marker `E`, glif `c` wg Mechanik/GRAF); walka – PROG / Gameplay (`combat/`).
- Renderer znaków z cache, DPR, kamera, font JetBrains Mono lokalnie (subset), dopasowanie do telefonu i PC.
- Wejście: warstwa akcji, InputManager (bufor tapnięć 100 ms, świeże wciśnięcia, licznik bezczynności); klawiatura z DIAG_GRACE i dotyk – źródła UI i Menu.
- Auto-pauza A (visibility/blur/pagehide/freeze), B (resize), E (60 s bez wejścia) + zapis; wznowienie RESUME/Esc/P/Enter → odliczanie 3·2·1 (1 s, `RESUME_COUNTDOWN_MS`), wejście czytane w trakcie i użyte w pierwszym ticku, pauza przerywa odliczanie.
- Pauza/wznowienie: `resume({ countdown?: boolean })` (zmiana UI, przejrzana – poprawna), `autoPauseSuppressed { current }` gdy auto-pauza trafia na pauzę 'text'/'menu', flaga `loop.autoPausedDuring` (do następnego resume). Wyzwalacz B (resize/obrót) zgłaszany też w trakcie pauzy (wcześniej pomijany przy otwartej notatce).
- Kamera z marginesami bezpieczeństwa (`data/camera.ts`, `CAMERA_SAFE_TOP_ROWS = 3`): `@` nigdy pod HUD, przy górnej ścianie kamera przewija się poza mapę. Zrzut: `prog/zrzuty/m0-camera-margin-667x375.png`.
- Wejście dotykowe i klawiatura – gotowe (UI i Menu), HUD HP, okno tekstu, ustawienia.
- RNG: nazwane strumienie `state.rng.stream('combat'|'world'|'loot'|'contracts'|…)`, niezależne, deterministyczne, zapisywane (Gameplay już używa `stream('combat')`).
- Zapis v3: seed, tick, `rngState` wszystkich strumieni, gracz + facing, sekcje modułów przez rejestr `registerSaveSection` (wszystko albo nic); migracje v1→v2→v3 (sprawdzone też w przeglądarce: zapis v2 → wczytany i zapisany jako v3).
- Zapis localStorage z wersją, migracją i walidacją; eksport/import pliku .json i kodu tekstowego (deflate + base64url).

## Wyniki
- `npm test`: 12 plików, 199 testów (z testami innych działów) – wszystkie zielone; moje: 4 nowe testy strumieni RNG i przepisany `save.test.ts` (16 testów: migracje v1→v3 i v2→v3, sekcje, round-trip, eksport/import). `npm run build` OK, `npm run lint` bez błędów.
- dist (z walką, UI, kontraktami): JS 58,0 KB (20,5 KB gzip).
- Test headless (Chrome + Playwright, serwowane spod podścieżki `/gra/`): ruch, pauza Esc, wznowienie Enter, Spacja nie wznawia,
  blur → auto-pauza z zapisem, odliczanie 3·2·1 i ruch klawiszem wciśniętym w trakcie, Esc przerywa odliczanie, kod eksportu, odtworzenie pozycji po przeładowaniu, brak błędów w konsoli.
- Zrzuty: `prog/m0-screenshot.png` (PC 1280×720, arena), `prog/m0-screenshot-countdown.png`, `prog/m0-screenshot-phone-portrait.png` (360×640), `prog/m0-screenshot-phone-landscape.png` (640×360).

## Otwarte
1. Odliczanie – zrobione (zerowanie przy `resume()` + wejście czytane w trakcie, zgodnie z decyzją Producenta).
2. Wyzwalacz D – podpięty przez Gameplay (`takeAutoPauseRequest`).
3. Glif wroga: brief mówił `E`, Mechaniki/GRAF – małe litery (`c`); na ekranie `c`, łatwa zmiana w `data/style.ts`.
4. Mapa – zrobione (arena 40×20 domyślna). Zapis nie pamięta, która mapa; pozycja niepasująca do mapy → spawn.
5. Bardzo niski ekran poziomo (< ~330 px wysokości z paskiem przeglądarki) przy min. 16 px nie zmieści 17 wierszy.
6. Testy na prawdziwym telefonie (iOS Safari, Chrome Android) – brak; tylko emulacja.
7. Repo + GitHub Pages – czeka na decyzję właściciela (repo musi być publiczne przy 0 zł).
8. Rysowanie tylko zmienionych komórek – niepotrzebne przy M0 (pełne przerysowanie widoku jest tanie), wrócić przy M1.
9. W `src/combat/` pracuje równolegle PROG / Gameplay (pliki combat.ts, grid.ts, …) – nie ruszałem ich; Gameplay sam podpiął walkę w `main.ts` (installCombat, wyzwalacz D) – działa razem z odliczaniem.
10. Rozstrzygnięte: `CAMERA_SAFE_TOP_ROWS = 3` (wysokość przycisku pauzy), więc `@` nie wchodzi ani pod HUD, ani pod `||`.
11. UI wykrywa auto-pauzę w trakcie czytania przez `saved { trigger: 'auto' }`; może przejść na `autoPauseSuppressed` / `loop.autoPausedDuring` (kodu UI nie zmieniałem).
12. Dodałem `@types/node` i `"node"` w `tsconfig.json` – nowy `tests/style.test.ts` (nie mój) używa `node:fs`/`node:zlib` i bez tego `npm run build` (tsc) nie przechodził.
13. Sekcje zapisu `combat` i `contracts` jeszcze nie zarejestrowane – do zrobienia przez Gameplay i LUZ (README → Rejestr sekcji).

## Aktualizacja 25.10.2026 – git, font, kontrakty, ochrona zapisu
- Lokalne repo git (bez remote). Commity Silnika: 45e6a81 M0 baseline, 4db94d7 font subset + script, 56170eb znaki GRAF v1.2 + assety M1, 135e9ad i 102c003 wpięcie kontraktów, 435c648 przypomnienie o eksporcie + iOS.
- `npm run font:subset`: Regular 9,4 KB, Bold 9,5 KB, 18 znaków spoza ASCII. Polska proza w danych jest pomijana.
- Kontrakty: wpięte przez `src/integration/contracts.ts`. Bez źródła są jeszcze: terminalSolved, itemPicked/itemLost, contractEnemyKilled, evacuated, uzupełnianie w bazie, contractSpawns.
- Ochrona zapisu: `saveApi` + `save:exportReminder`, opis w README „Przypomnienie o eksporcie”.
- Build, lint i testy zielone (17 plików, 249 testów).

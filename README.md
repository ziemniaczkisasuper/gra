# GRA – prototyp M0 (PROG / Silnik i Narzędzia)

Gra przeglądarkowa: TypeScript (strict) + Vite, canvas 2D bez silnika, statyczny build.
Teksty w grze po angielsku. Stan: lokalny szkielet, **bez repozytorium i bez wdrożenia**.

## Uruchomienie
```bash
npm install
npm run dev       # serwer deweloperski (http://localhost:5173), w konsoli dostępne window.__gra
npm test          # Vitest (logika: pętla, RNG, zapis, wejście, kolizje, kamera)
npm run lint      # ESLint (+ `npm run format` = Prettier)
npm run build     # tsc + vite build → dist/ (base './', działa z dowolnej ścieżki GitHub Pages)
npm run preview   # podgląd zbudowanej wersji
```
Na telefonie w tej samej sieci: `npm run dev -- --host` i adres IP komputera.

Sterowanie: WASD/strzałki – ruch, Spacja/J – atak; na telefonie joystick pływający + ATK (UI i Menu),
Esc/P – pauza; wznowienie: RESUME, Esc, P, Enter (Spacja nie wznawia), potem odliczanie 3·2·1 (1 s).
Mapa: domyślnie arena 40×20; `?map=large` w adresie = druga mapa 60×30.

## Struktura `src/`
| Katalog | Zawartość | Właściciel |
|---|---|---|
| `core/` | `loop.ts` (stały krok 50 ms, akumulator, max 5 kroków/klatkę, render rAF z alpha, pauza z powodem), `events.ts` (typowany event bus: `paused{reason}`, `resumed{from}`, `saved`), `rng.ts` (mulberry32), `game.ts` (stan gry, `stepGame`, rejestr systemów) | Silnik |
| `render/` | `GlyphRenderer` (siatka monospace, devicePixelRatio, cache glifów), `camera.ts` (kamera za graczem z marginesami bezpieczeństwa, dobór fontu do ekranu), `scene.ts` (rysowanie świata, tween kroku) | Silnik |
| `world/` | `tilemap.ts` (mapa ze znaków, markery `@`/`E`; mapy w `data/maps.ts`: `ARENA_M0` 40×20, `TEST_MAP_LARGE` 60×30), `collision.ts` (`canStep`: ściany, brak ścinania rogów, encje) | Silnik (+ Level Design) |
| `entities/` | `entity.ts` (pozycja w komórkach, liczniki ticków), `movement.ts` (`tryStep`), `player.ts`, `dummy.ts` | **Gameplay** |
| `combat/` | pusty – miejsce na walkę | **Gameplay** |
| `input/` | `actions.ts` (`ActionState`, `InputSource`, `InputManager`, `toDir8`), `keyboard.ts` (klawiatura), `touch.ts` + `joystick.ts` (dotyk, Pointer Events) | **UI i Menu** (interfejs akcji: Silnik) |
| `ui/` | `overlay.ts` – minimalny DOM: przycisk `||`, nakładka PAUSED + RESUME, eksport/import zapisu | **UI i Menu** |
| `save/` | `schema.ts` (wersja, migracje, walidacja), `storage.ts` (localStorage), `codec.ts` (kod tekstowy), `files.ts` (plik .json) | Silnik |
| `contracts/` | kontrakty BASE M1 (czysta logika): `types.ts`, `board.ts` (tablica 2 sloty, losowanie z przekazanego `Rng`, uzupełnianie w bazie, zapis `ContractsSave`), `progress.ts` (`applyContractEvent` → zdarzenia `contract:*`), `save.ts` (sekcja zapisu v3 `contracts`, rejestrowana przy imporcie; RNG `stream('contracts')`); dane w `data/contracts-m1.ts`, opis w `../kontrakty-m1.md` | **LUZ / Pracownik 2** (wpięcie: Silnik) |
| `data/` | `style.ts` (**wszystkie kolory, znaki, font** – styl GRAF jeszcze niezatwierdzony), `mechanics-m0.ts` (cała tabela 1.14 z `design/mechaniki-m1.md`), `maps.ts`, `strings.ts` (teksty EN), `tiles.ts`, `game.ts` | Balans, GRAF, Lore |
| `main.ts` | spięcie wszystkiego, auto-pauza, zapis | Silnik |

Zasada: `core/game.ts`, `world/`, `entities/`, `combat/`, `save/schema|codec` **nie dotykają DOM ani canvasa**
(testowane w Node). DOM tylko w `main.ts`, `render/`, `ui/`, `input/keyboard.ts`, `save/files.ts`.

## Model czasu i ruchu (wg `design/mechaniki-m1.md`)
- Tick 50 ms (20 Hz). Logika zna tylko całe komórki i całe ticki; czasy w danych w ms → `msToTicks()`.
- Ruch po siatce, 8 kierunków: prosto 3 ticki (150 ms), skos 4 ticki (200 ms); pozycja zmienia się od razu,
  potem cooldown. Krok w ścianę/encję nie kosztuje czasu (zmienia `facing`). Brak ścinania rogów.
  Ruch zablokowany przy `attackWindup > 0`. Render płynnie animuje krok (tylko wizualnie).
- Kolejność w ticku: systemy fazy `player` → ruch gracza → systemy fazy `world` → odliczenie liczników → `tick++`.
- `DIAG_GRACE` 50 ms (v0.5, QA-M0-002, `entities/player-move.ts`): krok prosty z miejsca rusza od razu. Jeśli w ciągu 1 ticku
  dojdzie klawisz prostopadły, a krok trwa, cel zmienia się na skos od pola startu. Krok trwa wtedy 4 ticki od startu (bez cofania),
  ale tylko gdy pole jest wolne i nie ma ścinania rogu. Okno działa tylko dla klawiatury (`ActionState.digitalMove`), nie w marszu.
- Przeciwne klawisze (QA-M0-009, `KeyboardSource`): na każdej osi wygrywa ostatnio wciśnięty, a po jego puszczeniu działa ten wciąż trzymany. Nigdy nie dają stopu.
- Bufor kierunku w cooldownie (QA-M0-001): zmiana kierunku albo ponowne wciśnięcie w trakcie cooldownu/przygotowania ciosu daje
  1 krok po jego końcu (bufor trwa co najmniej `INPUT_TAP_BUFFER_MS`). Trzymanie = marsz. Pauza czyści bufor.

## Pauza i wznowienie – API (`core/loop.ts`)
| Wywołanie / zdarzenie | Działanie |
|---|---|
| `loop.pause('menu' \| 'text' \| 'auto')` → `boolean` | zatrzymuje symulację, emituje `paused { reason }`; `true`, jeśli stan/powód się zmienił. Pauza w trakcie odliczania je przerywa. |
| `'auto'` przy istniejącej pauzie `'text'`/`'menu'` | powód **bez zmian**, zdarzenie `autoPauseSuppressed { current }`, flaga `loop.autoPausedDuring = true`; stan i tak zapisywany (`autoPause()` w `main.ts`). Powtórne `'auto'` przy `'auto'` – cisza. |
| `loop.autoPausedDuring` | `true`, jeśli w trakcie bieżącej pauzy wystąpiła auto-pauza (rozpoczęła ją albo została stłumiona); zerowane przez `resume()`. |
| `loop.resume()` / `loop.resume({ countdown: true })` | zeruje wejścia (`onResumeStart`), potem odliczanie 1 s: `countdown { msLeft, digit, from }` przy każdej cyfrze 3·2·1, na koniec `resumed { from }`. |
| `loop.resume({ countdown: false })` | zeruje wejścia i **od razu** `resumed { from }` (zamknięcie notatki bez auto-pauzy w trakcie czytania). |
| `loop.mode` | `'running' \| 'paused' \| 'countdown'`; `loop.paused`, `loop.pauseReason`, `loop.countingDown`. |

- Pauza: brak kroków, akumulator stoi; po wznowieniu i po odliczaniu reset bazy czasu (bez skoku) – pierwszy tick 50 ms po końcu odliczania.
- W trakcie odliczania wejście jest czytane (`input.collect()`): NOWE wciśnięcia i klawisze wciśnięte w trakcie działają
  w pierwszym ticku po nim; klawisze trzymane sprzed `resume()` nie. Esc/P, `||` lub auto-pauza przerywa odliczanie.
  Pojedyncza „czkawka” klatki liczy się max 250 ms. `RESUME_COUNTDOWN_MS` = 1000 w `data/mechanics-m0.ts`.
- Auto-pauza (`autoPause()` w `main.ts`): `visibilitychange(hidden)`, `blur`, `pagehide`, `freeze`, zmiana rozmiaru/orientacji
  (B – także w trakcie pauzy, wtedy tłumiona, ale zgłoszona i zapisana), 60 s bez wejścia (E), trafienie przy braku wejścia (D, walka)
  → `pause('auto')` + `input.reset()` + natychmiastowy zapis.
- Wznowienie z menu: RESUME, Esc, P, Enter (Spacja nie). Okno tekstu: zamknięcie → `resume({ countdown: autoPaused })`.

## Kamera
- Kamera centruje gracza w obszarze wolnym od marginesów, przycina się do krawędzi mapy, ale **margines wygrywa**:
  komórka `@` nigdy nie wchodzi w pas HUD; przy krawędzi mapy kamera przewija się poza mapę (puste pola).
- Parametry: `src/data/camera.ts` – `CAMERA_SAFE_TOP_ROWS = 3` i `CAMERA_SAFE_MARGINS { top, bottom, left, right }` (w komórkach).
- Funkcje czyste (`cameraAxis`, `computeCamera` w `render/camera.ts`), testy w `tests/camera.test.ts`.

## Losowość – nazwane strumienie (`core/rng.ts`)
- `state.rng` to `GameRng` (mulberry32). Dla modułów: **`state.rng.stream(name)`**, gdzie `name` = `'combat' | 'world' | 'loot' | 'contracts'`
  albo dowolny inny napis. Każdy strumień to osobny `Rng` (`next()`, `int(min, max)`, `pick(arr)`, `getState()`, `setState(v)`),
  wyprowadzony deterministycznie: `streamSeed(seed, name) = fmix32(fnv1a(name) XOR seed)`.
- Strumienie są niezależne: losowanie w `combat` nie zmienia `loot` itd. Ten sam seed i ta sama nazwa dają tę samą sekwencję.
  Strumień tworzy się przy pierwszym użyciu, a kolejne wywołania zwracają ten sam obiekt.
- Zapis: `state.rng.getStates()` → `{ default, combat, ... }`, odczyt: `state.rng.setStates(rec)` (robi to `gameFromSave`).
  Strumień nieobecny w zapisie startuje od nowa z seeda.
- `state.rng.next()/int()` (generator bazowy, klucz `default`) działa dalej dla kompatybilności, ale **do zastąpienia** przez `stream(...)`.
  Nie twórzcie własnych `new Rng(...)` dla stanu gry, bo nie trafi do zapisu.

## Zapis (v3)
- localStorage, klucz `gra.save.v1` (generacja formatu slotu). Schemat v3:
  `{ version: 3, savedAt, seed, tick, rngState: Record<string, number>, player: { x, y, facing: 'N'|'NE'|…|'NW' }, <sekcje modułów>? }`.
- Migracje w `save/schema.ts`: v1→v2 (seed domyślny), v2→v3 (`tick: 0`, `rngState` z seeda, `facing: 'E'`, bez sekcji).
- Walidacja: pola Silnika sprawdza `schema.ts`. Sekcja modułu musi być obiektem, a jej treść sprawdza `deserialize()` modułu.
  Każdy błąd daje `SaveError` i **cały zapis jest odrzucany** (bez częściowego wczytania; przy starcie: nowa gra, przy imporcie: komunikat i dotychczasowa gra zostaje).
  Nieznana sekcja (żaden moduł jej nie zarejestrował) jest pomijana z ostrzeżeniem.
- Limity liczb (QA-M0-007, `SAVE_LIMITS` w `schema.ts`): `tick` to bezpieczna liczba całkowita 0..2^31; `savedAt` i znaczniki czasu 0..8,64e15;
  czasy gry 0..2^31 × 50 ms; pozycja gracza to całkowite pole 0..4095; `rngState` maks. 64 strumienie, nazwy 1–64 znaki.
- `snapshot(state, now)` → `SaveData` (seed, tick, wszystkie strumienie RNG, gracz, `serialize()` każdej sekcji).
  `gameFromSave(data | null, { mapRows })` → nowy `GameState` (dla `null`: nowa gra z `fresh()` każdej sekcji).
- Eksport: plik `.json` lub kod tekstowy `GRA1z.<base64url(deflate-raw)>` (CompressionStream), bez kompresji `GRA1j.<base64url>`.
  Import z pliku i z kodu (w nakładce pauzy).
- **Zapis, którego nie da się wczytać (QA-M0-005, `save/boot.ts` `loadGame`, `save/storage.ts` `loadSave`):**
  - surowy tekst trafia do klucza `gra.save.v1.backup-<ms>` (maks. 3, najstarsza kopia znika; ten sam tekst nie jest kopiowany drugi raz; lista kluczy w `gra.save.v1.backups`, `listSaveBackups(store)`);
  - gra startuje jako nowa, a w `boot()` idzie zdarzenie `save:loadFailed { reason: 'newerVersion' | 'corrupt', backupKey }` (`backupKey: null` = kopia się nie udała). Stan da się też odczytać przez `saveApi.getLoadFailure()`;
  - przy `newerVersion` (oraz gdy kopia się nie udała) **każdy zapis do slotu jest zablokowany**: `writeSave()` zwraca `false`, a `saved` nie jest emitowane. Eksport pliku i kodu działa;
  - decyzja gracza: `saveApi.resolveLoadFailure()` („graj dalej nową grą”) odblokowuje zapis i zapisuje bieżącą grę (kopia zostaje). Import zapisu też odblokowuje. Okno z wyborem rysuje UI;
  - `corrupt` z udaną kopią nie blokuje zapisu, bo surowy tekst jest bezpieczny w kopii.

### Rejestr sekcji zapisu (`save/sections.ts`) – dla Gameplay (`combat`) i LUZ (`contracts`)
```ts
import { registerSaveSection } from '../save/sections';

registerSaveSection<CombatSave>('combat', {
  serialize: (state) => ({ /* JSON-safe dane walki */ }),
  deserialize: (raw) => deserializeCombat(raw), // WALIDACJA; rzuć błąd przy złych danych
  fresh: () => freshCombat(),                   // nowa gra / zapis bez tej sekcji
  apply: (state, value) => { /* opcjonalnie: wstaw do GameState */ },
});
```
- Bez `apply` wartość trafia do `state.sections[name]`.
- Rejestrujcie sekcję **na najwyższym poziomie modułu** (np. `combat/save.ts` importowany przez `combat/install.ts`),
  żeby była zarejestrowana, zanim `main.ts` wczyta zapis. `schema.ts` nie trzeba edytować.
- Nazwy: `[a-z][a-zA-Z0-9_-]*`, bez nazw Silnika (`version`, `savedAt`, `seed`, `tick`, `rngState`, `player`), bez duplikatów.
- `deserialize` jest wołane dwa razy (przy walidacji i przy wczytaniu), więc musi być czyste, bez efektów ubocznych.
- Liczniki ticków encji/walki zapisujcie w swojej sekcji; `tick` gry odtwarza Silnik.

## Punkty podpięcia – PROG / Gameplay (`combat/`, `entities/`)
- `registerSystem((state, actions, dtMs) => { ... }, 'player' | 'world')` z `core/game.ts` – walka, AI, śmierć, respawn.
  Faza `'player'`: start ataku gracza (przed ruchem); `'world'`: AI wroga, rozstrzygnięcie ciosów, śmierć.
- `Entity` ma liczniki `moveCooldown`, `attackWindup`, `attackCooldown` (odliczane automatycznie na końcu ticku),
  `facing`, `solid`, `glyph`. Rozszerzajcie przez nowe pola/typy w `entities/`.
- Ruch wroga: `tryStep(entity, dir, map, costs, state.tick, occupied)` + `canStep` (ten sam zakaz ścinania rogów).
- Losowość wyłącznie przez `state.rng.stream('combat')` (seedowany, deterministyczny, w zapisie). Stan walki przez sekcję zapisu `combat` (patrz wyżej).
- `input.pressed` (świeże wciśnięcia w tym kroku) odróżnia tap od przytrzymania ATK; `ActionState.attack` = trzymany lub tap
  (bufor 100 ms = 2 ticki). Bufor ATK w końcówce cooldownu (`ATK_QUEUE_MS` = 150) – do zaimplementowania w combat/.
- Wyzwalacz auto-pauzy D (trafienie + 2 s bez wejścia): `input.idleMs` jest gotowe; po trafieniu wywołajcie auto-pauzę
  (np. przez zdarzenie na busie – do dodania razem z walką).
- Parametry tylko z `data/mechanics-m0.ts`, glify/kolory tylko z `data/style.ts` (`DUMMY_TELEGRAPH_GLYPH` itd.).
- **Profil i głębokość walki:** zapis walki ich nie trzyma, więc `main.ts` po każdym wczytaniu (start, import) woła
  `setCombatProfile` z Gameplay przez `integration/combat-url.ts`. Domyślnie jest `m0` / głębokość 1. Helper QA / balans:
  `?combat=m0|m1&depth=1..3` działa w dev i w buildzie, także dla wczytanego zapisu. W M1 strefa ustawi profil przy wejściu.

## Kontrakty (LUZ) – wpięcie w Silnik (`src/integration/contracts.ts`)
- `main.ts` → `installContracts(emit)` po `installCombat()`; import modułu rejestruje sekcję zapisu `contracts` (z `src/contracts/save.ts`)
  przed wczytaniem zapisu. Losowanie tablicy: `state.rng.stream('contracts')` (stan w `rngState.contracts`).
- Zdarzenia wyjściowe modułu (`contract:offered|progress|objectiveMet|objectiveLost|completed|failed`) → `bus.emit(e.type, e.payload)`.
- Wejścia podpięte: walka `playerDied` → `{ type: 'died' }` (system fazy `world`, po walce).
- **Jeszcze nie podpięte (brak systemów-źródeł):** `terminalSolved` (terminale), `itemPicked` / `itemLost` (przedmioty, plecak),
  `contractEnemyKilled` (wrogowie z `contractId` z generatora poziomu), `evacuated` (winda/ewakuacja), `refillContractsAtBase()`
  po powrocie do bazy (`ctx` z windy i terminali), `contractSpawns()` w generatorze poziomu. Gotowe funkcje: `feedContracts(state, inputs)`,
  `refillContractsAtBase(state, ctx, emit)`.

## Punkty podpięcia – PROG / UI i Menu (`input/`, `ui/`)
- Implementujcie `InputSource { poll(): Partial<ActionState>; reset(): void }` i dodajcie przez `input.add(...)` w `main.ts`.
  `poll()` jest wołane raz na tick; przyciski zwracają `true`, jeśli trzymane LUB wciśnięte od ostatniego `poll()`;
  `pause` tylko jako zbocze. `move` w [-1, 1] – logika kwantyzuje do 8 kierunków (`toDir8`, martwa strefa 0.15);
  histereza joysticka po Waszej stronie.
- `input/keyboard.ts` i `input/touch.ts` (+ `joystick.ts`, `ui/touch-controls.ts`) – gotowe źródła wejścia UI i Menu (wielodotyk po pointerId, zatrzaskiwane przyciski, reset przy pauzie).
- `input.markActivity()` – zgłoszenie aktywności spoza źródeł (np. tap w przycisk DOM).
- `ui/overlay.ts` – minimalna nakładka; HUD (HP), okno tekstu, kontrolki dotykowe – Wasze. Słuchajcie `bus.on('paused'|'resumed'|'saved')`.
  Okno tekstu: `loop.pause('text')` przy otwarciu, `loop.resume()` przy zamknięciu.
- Font i rozmiar komórki: `data/style.ts` (`FONT`), minimalny widok 31×17 / 17×21 z `mechanics-m0.ts`.

## Przypomnienie o eksporcie (`save/api.ts`, `save/storage-env.ts`)

Ochrona zapisu (iOS Safari potrafi skasować localStorage po ~7 dniach bez wizyty). Kontrakt z PROG / UI i Menu:

- **Zdarzenie** `save:exportReminder` – jedno zdarzenie z listą powodów:
  `{ reasons: Array<'interval' | 'neverExported' | 'iosNotStandalone'>; daysSinceExport: number | null; playtimeSinceExportMs: number }`.
  Emitowane przy starcie gry (po wczytaniu) i przez `saveApi.checkExportReminder()`; może przyjść w dowolnym momencie – UI samo rysuje okno (np. dopiero w bazie).
- **Progi** (`src/data/save-reminder.ts`): `interval` = ≥ 3 dni od eksportu **i** ≥ 30 min gry od eksportu; `neverExported` = ≥ 30 min gry; drzemka 24 h; ukrycie podpowiedzi iOS 7 dni.
- **`saveApi`** (import z `src/save/api.ts`, inicjalizuje `main.ts`):
  - `exportFile(): Promise<void>` – pobiera .json; `exportCode(): Promise<string>` – zwraca kod (schowek robi UI). Oba: `lastExportAt = now`, `playtimeSinceExportMs = 0`, zapis, `save:exported { method: 'file' | 'code' }`.
  - `snoozeExportReminder()` – `exportReminderSnoozedUntil = now + 24 h`, zapis, `save:exportSnoozed { until }`. W drzemce nie ma powodów `interval`/`neverExported`.
  - `dismissIosHint()` – ukrywa powód `iosNotStandalone` na 7 dni, **niezależnie** od drzemki (drzemka nie ukrywa podpowiedzi iOS, a ukrycie iOS nie wycisza eksportu).
  - `checkExportReminder(): ExportReminder | null`.
- **Środowisko** (`storage-env.ts`): `isIos()` (UA iPhone|iPad|iPod albo MacIntel z maxTouchPoints > 1), `isStandalone()` (`navigator.standalone` lub `(display-mode: standalone)`), `isIosNotStandalone()`, `persistState` = wynik `navigator.storage.persist()` wołanego przy starcie (`granted`/`denied`/`unsupported`, log w konsoli).
- **Pola zapisu** (opcjonalne, top-level, bez zmiany wersji): `playtimeMs`, `playtimeSinceExportMs`, `lastExportAt`, `exportReminderSnoozedUntil`, `iosHintHiddenUntil` (`state.meta`). Czas gry liczą tylko ticki symulacji (pauza i odliczanie się nie liczą). Brak pola = wartość domyślna; stary zapis bez `playtimeSinceExportMs` przyjmuje `playtimeMs`.
- Testy: `tests/save-reminder.test.ts` (wstrzykiwany zegar).

## Font
JetBrains Mono (SIL OFL 1.1), podzbiór znaków w `src/assets/fonts/` (`JetBrainsMono-{Regular,Bold}-subset.woff2`, po ok. 9 KB,
lista znaków w `SUBSET.txt`), licencja w `public/fonts/OFL.txt`. Bez CDN; gdy font się nie wczyta w 1,5 s – systemowy monospace.

**Przegenerowanie: `npm run font:subset`** (`scripts/font-subset.mjs`, pakiet npm `subset-font` – HarfBuzz WASM, bez Pythona).
- Zestaw znaków: ASCII 0x20–0x7E + **automatycznie** wszystkie znaki spoza ASCII z literałów tekstowych w `src/data/**/*.ts`
  i `src/**/strings*.ts` (komentarze są pomijane) + stała lista `EXTRA_CHARS` w skrypcie (wszystkie znaki spoza ASCII
  z `graf/styl-ascii.md` v1.2 i `graf/assety-m1.md` bez polskich liter i cudzysłowów; `♥` celowo pominięte – brak w foncie).
- Pełne fonty źródłowe (oficjalne, tag `v2.304` z github.com/JetBrains/JetBrainsMono) skrypt pobiera sam do `scripts/fonts-src/`
  (katalog w `.gitignore`), więc po świeżym checkout wystarczy `npm install && npm run font:subset` (wymaga internetu przy pierwszym uruchomieniu).
- Polskie litery i cudzysłowy „ ” ze źródeł są **pomijane** (`PROSE_ONLY` w skrypcie): to opisy dla grafików/logiki
  (np. `note`, `interact` w `src/data/fx-m1.ts`), nie tekst gry (gra jest po angielsku).
- `npm run font:subset -- --check` – tylko wypisuje zebrane znaki i ich pliki, bez pobierania i zapisu.
- Po dodaniu nowego znaku w danych: uruchom skrypt i zacommituj fonty + `SUBSET.txt`; test `tests/style.test.ts` sprawdza pokrycie.
- Bez cech OpenType (ligatury kodu wyłączone) – canvas rysuje jeden glif na komórkę.

## Praca równoległa – lokalne repo git
Repozytorium jest **tylko lokalne** (bez remote, nic nie jest wypychane). Tożsamość ustawiona w tym repo: `GRA PROG <gra-prog@localhost>`.
- Przed i po większej zmianie: `git add -A && git commit -m "[dział] opis"` (np. `[Gameplay] boss Rail Guardian`, `[UI] HUD v2`).
  Jeśli w drzewie są niezacommitowane zmiany innego działu, commituj **tylko swoje pliki**: `git add <ścieżki> && git commit -m "[dział] …"`.
- Przed zapisem pliku, który edytuje ktoś inny: `git diff <plik>` (i `git log -p -3 <plik>`), żeby zobaczyć cudze zmiany.
- Przy konflikcie **nie nadpisuj cudzych zmian**: połącz ręcznie albo zostaw i zgłoś właścicielowi pliku. Bez `git reset --hard`,
  `git checkout -- <plik>` czy `git stash` na cudzych zmianach.
- `.gitignore`: `node_modules`, `dist`, raporty testów (`test-results`, `playwright-report`, `**/.results/`), `scripts/fonts-src/`.

## Wdrożenie (później)
`.github/workflows/deploy.yml` – gotowy, **nieaktywny** (tylko `workflow_dispatch`, trigger `push` zakomentowany).
Zakłada, że ten katalog jest korzeniem repo. Darmowe Pages wymagają repo publicznego.

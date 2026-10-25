# Kontrakty BASE M1 – moduł (LUZ / Pracownik 2)

Stan: 25.10.2026, lokalnie (bez repo, nic nie wypchnięte). Struktura uzgodniona z PROG / Silnik i Narzędzia.
Źródła: `design/mechaniki-m1.md` (plik ma już **v0.4**; §2.3, §2.4, §2.7, §2.9, §2.15, §2.16), `design/level-design-m1.md` §1 i §3, `fabula/zakres-m1.md` §7, `fabula/teksty-m1-en.md` (ID tekstów).

## Pliki
| Plik | Zawartość |
|---|---|
| `game/src/data/contracts-m1.ts` | dane: `CONTRACTS_M1` / `CONTRACT_DEFS` (M1_CONTR_01..03: cel, głębokości, nagroda wg głębokości, waga per (typ, głębokość), retune, skład grup wrogów Clear the Path), `CONTRACT_SLOTS_BASE` = 2, `CONTRACT_SLOTS_EXCHANGE` = 1, `CONTRACT_ENEMY_LOOT` = 0, `CONTRACT_KRPM_CAP` = 20/48/90, `TERMINAL_VARIANTS`, `GRID_FRAGMENT_PCT` = 10, `DATA_CORE_ITEM_ID` |
| `game/src/contracts/types.ts` | `ContractsState`, `ContractInstance`, `ContractProgress`, `BoardContext`, `ContractInputEvent`, `ContractEvents`, `ContractOutputEvent`, `ContractsSave` |
| `game/src/contracts/board.ts` | tablica: `createContractsState`, `refillBoard`, `contractPool`, `allowedDepths`, `contractSpawns`, `serializeContracts`, `deserializeContracts`, `loadContracts` |
| `game/src/contracts/save.ts` | sekcja zapisu v3 `contracts` (rejestracja jako efekt uboczny importu), `getContracts` / `setContracts` (stan w `state.sections.contracts`), `contractsRng(state)` = `state.rng.stream('contracts')`, `refillContracts(state, ctx)`, `NEW_GAME_BOARD_CONTEXT` |
| `game/src/contracts/progress.ts` | `applyContractEvent`, `applyContractEvents`, `contractReward` |
| `game/tests/contracts.test.ts` | 34 testy (w tym 6 dla sekcji zapisu v3) |
| `game/src/core/events.ts` | tylko dopisane do `GameEvents`: `contract:offered`, `contract:progress`, `contract:objectiveMet`, `contract:objectiveLost`, `contract:completed`, `contract:failed` |

## API
- `refillBoard(state, rng, ctx) → { state, events }`: wypełnia puste sloty BASE. Losuje **tylko** z przekazanego `Rng` (`core/rng.ts`), dwustopniowo przez `pickTwoStage`: najpierw głębokość, równo spośród `allowedDepths(ctx)` (1 zawsze + `ctx.unlockedStops`), potem typ według wag tej głębokości. 2 losowania na slot. `ctx.solvedVariants` decyduje o „ponownym zestrojeniu”.
- `applyContractEvent(state, ev) → { state, events }`: **czysta funkcja**. Nie mutuje stanu i niczego nie emituje, tylko **zwraca** zdarzenia wyjściowe. Wpinający robi `for (const e of events) bus.emit(e.type, e.payload)`.
- `ContractInputEvent`:
  - `terminalSolved { depth, variant, firstSolve }`;
  - `itemPicked { itemId, contractId? }`;
  - `itemLost { itemId, contractId? }`;
  - `contractEnemyKilled { contractId }`;
  - `evacuated`;
  - `died`.
- `contractSpawns(state, depth)`: co generator ma postawić na poziomie danej głębokości: terminal, Data Core z 3 strażnikami w odległości 30–45 pól albo 6 wrogów w odległości 12–20 pól. Wszystko otagowane `contractId` (= `ContractInstance.id`). Spawny z wrogami (`item` i `enemies`) mają pole `enemyLoot` = `CONTRACT_ENEMY_LOOT` = 0, które odczytują generator i system łupu. Spawn `enemies` ma też `groups`: skład grup jako glify (balans v1.2 / LD §10): głęb. 1 i 3 `['sss', 'ddh']`, głęb. 2 `['sss', 'dht']`; `null` = skład wybiera generator. Spawn `item` ma `guardGroups`: strażnicy Data Core `['ddh']`.
- Zapis:
  - `serializeContracts(state) → ContractsSave` (`{ v: 1, nextId, base, exchange, creditedVariants }`, czysty JSON, z postępem w trakcie wyprawy);
  - `deserializeContracts(raw)`: walidacja, przy złych danych `SaveError`; `undefined` daje pustą tablicę;
  - `loadContracts(raw | undefined, rng, ctx)`: brak sekcji daje świeżą, od razu wylosowaną tablicę.
- Nagroda (`contract:completed.payload`): `reward { credits, copper, medPatches }` oraz `gridFragmentVariant` / `gridFragmentPct`. Wypłatę robi wpinający (konto, plecak/skrytka, sieć).

## Jak wpiąć (Silnik)
1. **Import z efektem ubocznym (wymagany):** `import './contracts/save';` (z `main.ts` albo z miejsca, gdzie Silnik instaluje moduły, np. obok `combat/install.ts`). Musi się wykonać **przed** `readSave` / `parseSave` / `gameFromSave`. Bez niego `validate()` odrzuci sekcję `contracts` jako nieznaną (tylko ostrzeżenie), a nowa gra nie dostanie tablicy.
2. **Zapis:** nic więcej. `snapshot()` woła `serialize`, a `gameFromSave()` woła `deserialize` / `fresh` + `apply`. Stan tablicy jest w `state.sections.contracts` (bez pola w `GameState`). Odczyt i zapis przez `getContracts(state)` / `setContracts(state, s)`.
3. **Losowanie:** zawsze `state.rng.stream('contracts')`, czyli `contractsRng(state)`. `GameRng.stream()` zwraca `Rng`, a `board.ts` przyjmuje `Rng`, więc typy pasują bez zmian. Stan strumienia zapisuje się w `rngState.contracts` (Silnik), więc losowania po wczytaniu są identyczne jak bez przerwy. Własnego RNG moduł nie tworzy. Nie używać `state.rng.next()` (generator bazowy).
4. **Nowa gra / zapis bez sekcji:** `fresh()` nie dostaje stanu ani RNG, więc zwraca pustą tablicę. `apply()` (wołane po odtworzeniu strumieni RNG) losuje ją ze `stream('contracts')` z kontekstem `NEW_GAME_BOARD_CONTEXT` (tylko głęb. 1, nic nierozwiązane). Wynik jest deterministyczny dla seeda. Zdarzenia `contract:offered` z tego pierwszego losowania nie są emitowane, bo przy wczytaniu nie ma busa.
5. **Generator poziomu:** `contractSpawns(getContracts(state), depth)` i tagowanie Data Core oraz wrogów kontraktu przez `contractId`.
6. **Systemy gameplayu** (gdy powstaną) zamieniają swoje zdarzenia na `ContractInputEvent`:
   `const r = applyContractEvent(getContracts(state), ev); setContracts(state, r.state); for (const e of r.events) bus.emit(e.type, e.payload);`
   `terminalSolved.firstSolve` podaje system terminali.
7. **Po powrocie do bazy** (po ewakuacji i po wydruku po śmierci): `const r = refillContracts(state, ctx)` (losuje ze `stream('contracts')` i zapisuje stan w `state`), potem emisja `r.events` (`contract:offered`, tekst `M1_BASE_10`). `ctx` = `{ unlockedStops, solvedVariants }` z systemów windy i terminali.
8. `main.ts` / `game.ts`: przez `registerSystem`. Moduł tych plików nie dotyka.

## Decyzje potwierdzone przez właścicieli (25.10.2026)
- **Wagi (Balans `balans-m1.md` v1.1 §5, GD):** pole **per (typ, głębokość)** w danych, bez dzielenia na głębokości: Relay 1/1/1, **Data Core –/2/–** (waga 2 zatwierdzona przez GD), Clear the Path 1/1/1. Ponowne zestrojenie daje ×0,5 wagi Relay na tej głębokości.
- **Clear the Path na głęb. 3 (zatwierdzony przez GD):** 40 kr + 1 Med-Patch, waga 1, 6 wrogów w składzie `sss` + `ddh` (dane spawnu, mnożniki g3), 12–20 pól od szybu, `enemyLoot` 0.
- **Losowanie dwustopniowe (decyzja właściciela):**
  1. głębokość równo spośród odblokowanych (głęb. 1 zawsze + `unlockedStops`);
  2. typ według wag tej głębokości (z zestrojeniem).

  Para (kontrakt, głębokość) nie może się powtórzyć na tablicy. Przy wszystkich przystankach każda głębokość dostaje 1/3, a w jej obrębie: g1 Relay/CtP po 1/2, g2 Relay 1/4, Data Core 1/2, CtP 1/4, g3 Relay/CtP po 1/2. Balans przeliczył udziały pod losowanie dwustopniowe (`balans-m1.md` v1.1 §5.1).
- **Fallback losowania:** głębokość bez wolnego typu (wszystkie jej pary są już na tablicy albo mają wagę 0) jest pomijana w 1. etapie. Głębokość losuje się wtedy równo spośród odblokowanych głębokości, które mają jeszcze wolny typ. Daje to ten sam rozkład co ponawianie losowania głębokości, ale ze stałą liczbą losowań (2 na slot), bez pętli. Przykład: na tablicy leżą już oba typy głęb. 3 (Relay@3 i Clear@3), więc losowanie wybiera głęb. 1 albo 2, każdą po 1/2. Jeśli żadna głębokość nie ma wolnego typu, slot zostaje pusty.
- **`CONTRACT_ENEMY_LOOT` = 0 (Balans):** wrogowie kontraktu nie upuszczają Scrapu ani przedmiotów. Według `balans-m1.md` §5 („wrogowie kontraktu”) i mechaniki §2.4 (wrogowie kontraktu = Data Core i Clear the Path) dotyczy to **obu** grup: celów Clear the Path i strażników Data Core.
- **Nagrody (Balans `balans-m1.md` v1.1 §5):**
  - Restore Relay **35 kr** (było 40) + fragment sieci przy pierwszym rozwiązaniu wariantu;
  - Data Core 40 kr + 3 Copper;
  - Clear the Path: 1 Med-Patch (g1) / 25 kr + 1 Med-Patch (g2) / 40 kr + 1 Med-Patch (g3);
  - ponowne zestrojenie (niżej).
- **Uzasadnienie (zasada GD kr/min):** limit `CONTRACT_KRPM_CAP` liczony **od bazy do bazy** (sesja: baza, winda, strefa, powrót) wynosi **20 / 48 / 90 kr/min** (g1/g2/g3). Ta sama podstawa obowiązuje dla wypraw: 170 / 413 / 778 kr ÷ 8,67 min. Przy 40 kr Relay na g1 dawał ~21 kr/min, czyli powyżej limitu 20, stąd 35 kr. Kontrakty według Balansu: Relay 18/~16/14, Data Core ~26, Clear the Path 13/25/32 kr/min, wszystkie poniżej limitu. Stała jest w danych jako punkt odniesienia dla QA. Moduł jej nie egzekwuje.
- **Ponowne zestrojenie (Mechaniki + Balans):** osobno dla każdej głębokości. Gdy wszystkie warianty danej głębokości są rozwiązane, Restore Relay na tej głębokości jest „ponownym zestrojeniem”: **25 kr + 2 Copper** (`RETUNE_REWARD`, balans v1.1; wcześniej 30 kr, a w v0.4 40 kr), bez fragmentu sieci, waga ×0,5. Flaga jest ustalana przy losowaniu.
- **Śmierć (Mechaniki):** ten sam kontrakt zostaje w slocie z wyzerowanym postępem, bez ponownego losowania. Na nowo losowane są tylko ukończone sloty (po powrocie do bazy). `contract:failed` idzie dla każdego kontraktu z tablicy (wszystkie są aktywne w każdej wyprawie, §2.4), z polem `hadProgress`.
- **Wypłata nagrody (Silnik):** wypłaca ją **moduł ekonomii/ekwipunku** po zdarzeniu `contract:completed` (`reward { credits, copper, medPatches }`, fragment sieci w `gridFragmentVariant` / `gridFragmentPct`). Moduł kontraktów niczego nie wypłaca. Moduł ekonomii/ekwipunku jeszcze nie istnieje.
- **`itemLost` (Silnik):** emituje go **moduł ekwipunku**, także przy śmierci (Data Core przepada). Kolejność `itemLost` i `died` nie ma znaczenia: `died` i tak zeruje postęp. Moduł ekwipunku jeszcze nie istnieje.
- **Teksty (Dialogi):** w `M1_CONTR_01..03` jedynym tokenem jest `{depth}` (1–3), w tytule i w opisie. `contract:offered` niesie `textId` i `textParams: { depth }`, a dla dowolnego kontraktu z tablicy jest helper `contractTextParams(c)`. Treści tekstów moduł nie zawiera.

## Założenia (oznaczone w kodzie `[ASSUMPTION Ax]`)
- **A2:** na tablicy nie ma dwóch identycznych par (kontrakt, głębokość). Przy samej głęb. 1 tablica to zawsze Relay@1 + Clear@1. Balans §5.1 przyjął tę samą regułę.
- **A5 – fragment sieci:** należy do wariantu (§2.15: 8 × 10%). Kontrakt go tylko **raportuje** (pierwsze rozwiązanie, nie przy ponownym zestrojeniu, nigdy dwa razy dzięki `creditedVariants`). System sieci nie może zapalić go podwójnie.
- **A6:** pierwsze losowanie tablicy (nowa gra / zapis bez sekcji) w `apply()` używa kontekstu „tylko głęb. 1, nic nierozwiązane”. „Niewylosowana” tablica = `nextId === 1` i puste sloty.
- Ewakuacja bez wykonanego celu: kontrakt zostaje, postęp się zeruje. Cel wykonany na jednej głębokości liczy się przy ewakuacji z innej.
- Brak limitu czasu (§2.4). `expectedMs` w danych służy tylko telemetrii i QA, więc nie ma przeliczeń `msToTicks`.
- Slot Exchange istnieje w typach i zapisie (`exchange: [null]`), bez implementacji.
- `DATA_CORE_ITEM_ID = 'M1_ITEM_DATA_CORE'`: robocze ID, do uzgodnienia z modułem ekwipunku i tabelą łupu.

## Otwarte pytania
Brak. Wszystkie pytania z wcześniejszych wersji notatki rozstrzygnęli Balans, Mechaniki, Silnik i Dialogi (wyżej).

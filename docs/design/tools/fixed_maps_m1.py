"""Stałe mapy M1 (baza, arena Rail Guardiana) + sprawdzenie: wymiary, łączność, odległości.
Markery (zamieniane przy parsowaniu na podłogę/teren, jak '@'/'E' w world/tilemap.ts) – patrz level-m1.md §5–6."""
from collections import deque

BASE_M1 = [
    "#############################",
    "#--------->-----------------#",
    "#.......A.....&.......$.....#",
    "#.O.........................#",
    "#.@.........................#",
    "#...........................#",
    "##########----'----##########",
    "##########.........##########",
    "##########...L.....##########",
    "#############################",
]
# O = Reprint Vat (Ω), @ = wydruk/start Prologu (T01), > = winda w ścianie z kablem,
# A = przyjazd po ewakuacji, & = terminal BASE, $ = Exchange, L = skrytka (≡),
# '-' = ściana z kablem (żółta po Lights I), "'" = przejście do schowka. Obiekty są solidne – interakcja z sąsiedniego pola.

ARENA_M1 = [
    "##############################",
    "#............................#",
    "#...,....................,...#",
    "#============================#",
    "#============================#",
    "#............................#",
    "#............................#",
    "G@..................B........X",
    "#............................#",
    "#............................#",
    "#............................#",
    "#============================#",
    "#============================#",
    "#...,....................,...#",
    "#............................#",
    "##############################",
]
# G = brama (powrót do Rail Depot), @ = wejście gracza, B = lewy górny róg bossa 3×2,
# drony fazy 2: wolne pola w promieniu 3 od bossa (v0.5) – brak stałych włazów; X = ukryty szyb (ściana; po walce '<'), '=' = tory (przechodnie)

SOLID = set("#-|XO&$L>")
def check(name, rows, start, targets):
    H = len(rows); W = len(rows[0]); assert all(len(r) == W for r in rows), name
    find = lambda ch: next((x, y) for y, r in enumerate(rows) for x, c in enumerate(r) if c == ch)
    s = find(start); D = {s: 0}; q = deque([s])
    while q:
        x, y = q.popleft()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                n = (x + dx, y + dy)
                if n in D or not (0 <= n[0] < W and 0 <= n[1] < H) or rows[n[1]][n[0]] in SOLID: continue
                if dx and dy and (rows[y][x + dx] in SOLID or rows[y + dy][x] in SOLID): continue
                D[n] = D[(x, y)] + 1; q.append(n)
    free = sum(c not in SOLID for r in rows for c in r)
    print(f"{name}: {W}x{H}, przechodnie {free}, osiągalne z '{start}' {len(D)}")
    for t in targets:
        tp = find(t); nb = [D.get((tp[0]+dx, tp[1]+dy)) for dx in (-1,0,1) for dy in (-1,0,1)]
        nb = [v for v in nb if v is not None]
        print(f"  '{t}' {tp}: ścieżka do sąsiedniego pola = {min(nb) if nb else 'BRAK'}")

check("BASE_M1", BASE_M1, "@", "O&$L>A")
check("ARENA_M1", ARENA_M1, "@", "BXG")

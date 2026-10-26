#!/usr/bin/env python3
"""Prototyp generatora poziomów M1 (Sector 1: Ashfield Yards) – DESIGN / Level Design.

Spec: design/level-m1.md. Cel: sprawdzić, że reguły LD/Mechanik są spełnialne na podanych
rozmiarach, i dać PROG wzorzec kolejności kroków. To NIE jest kod gry.

PRNG: port 1:1 `Rng` (mulberry32) i `streamSeed` (FNV-1a + fmix32) z prog/game/src/core/rng.ts,
więc te same ziarna dadzą w TS ten sam ciąg liczb (o ile kolejność losowań jest ta sama).

Użycie:
  python3 levelgen_m1.py --test 1000            # test ziaren dla 3 głębokości (+ kontrakty)
  python3 levelgen_m1.py --show 12345 --depth 2 # wydruk mapy ASCII
"""
from __future__ import annotations
import argparse, statistics as st, sys
from collections import deque, Counter

M32 = 0xFFFFFFFF
GENERATOR_VERSION = 1

# ----------------------------------------------------------------------------- PRNG (rng.ts)
def imul(a, b): return (a * b) & M32

class Rng:
    def __init__(self, seed): self.s = seed & M32
    def next(self):
        self.s = (self.s + 0x6D2B79F5) & M32
        t = self.s
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296
    def int(self, lo, hi): return lo + int(self.next() * (hi - lo + 1))
    def pick(self, items): return items[int(self.next() * len(items))]
    def chance(self, p): return self.next() < p
    def shuffle(self, a):  # Fisher–Yates od końca (opis w spec §2.1)
        for i in range(len(a) - 1, 0, -1):
            j = self.int(0, i); a[i], a[j] = a[j], a[i]
        return a

def hash_name(name):
    h = 0x811C9DC5
    for ch in name:
        h ^= ord(ch); h = imul(h, 0x01000193)
    return h

def fmix32(h):
    h ^= h >> 16; h = imul(h, 0x85EBCA6B); h ^= h >> 13; h = imul(h, 0xC2B2AE35); h ^= h >> 16
    return h & M32

def stream_seed(seed, name): return fmix32((hash_name(name) ^ (seed & M32)) & M32)

def level_rng(exp_seed, depth, attempt, stream):
    """Osobny strumień na etap: zmiana liczby skrzyń nie zmienia układu ścian."""
    return Rng(stream_seed(exp_seed, f"lvl:s1:d{depth}:a{attempt}:{stream}"))

# ----------------------------------------------------------------------------- parametry
DEPTH = {
    1: dict(name="Outskirts",    W=64, H=40, shaft=(25, 40), down=(40, 60), enemies=(8, 10),
            chests=3, burrows=2, notes=(2, 2), credits=(1, 1)),
    2: dict(name="Solar Fields", W=72, H=44, shaft=(30, 50), down=(45, 65), enemies=(12, 14),
            chests=4, burrows=3, notes=(1, 2), credits=(1, 2)),
    3: dict(name="Rail Depot",   W=80, H=48, shaft=(35, 55), down=(50, 70), enemies=(14, 16),
            chests=4, burrows=3, notes=(2, 2), credits=(1, 2)),
}
PASSABLE_PCT = (0.40, 0.50)
STAIRS_GATE_MIN_DIST_FROM_SHAFT = 20
NO_ENEMY_RADIUS_ENTRY_SHAFT = 10
TERMINAL_DIST_FROM_SHAFT = (25, 40)
TERMINAL_NO_ENEMY_RADIUS = 8
BURROW_MIN_SPACING = 30
BURROW_MIN_DIST_ENTRY_SHAFT = 10
CLEARPATH_ENEMY_DIST = (12, 20)
DATACORE_DIST = (30, 45)
CHEST_MIN_SPACING = 12          # propozycja LD
CHEST_MIN_DIST_ENTRY = 10       # propozycja LD
GROUP_MIN_SPACING = 10          # propozycja LD (BFS między kotwicami grup)
NOTE_MIN_SPACING = 10           # propozycja LD
TERMINAL_MIN_CHEB = 5          # propozycja LD: wróg nie stoi tuż za cienką ścianą terminala
ENTRY_LOS_SAFE = 8              # propozycja LD: wróg nie widzi W/szybu z <= 8 (Czebyszew)
LEVEL_GEN_MAX_ATTEMPTS = 20
SHAFT_MIN_PASSABLE_NEIGHBORS = 2   # v0.5 / LD §4 (cel 3, patrz SHAFT_PREF_PASSABLE_NEIGHBORS)
SHAFT_PREF_PASSABLE_NEIGHBORS = 3
# Prolog (mechaniki 2.19, LD §4)
PROLOGUE_TERMINAL_DIST_FROM_ENTRY = (45, 60)
PROLOGUE_SCRAPPER_DIST = (12, 18)
PROLOGUE_GUARD_DIST = (20, 30)
PROLOGUE_GUARD_ROOM_MIN = 5        # wnętrze >= 5x5
PROLOGUE_PAIR_DIST = (30, 40)
PROLOGUE_NEAR_ROUTE = 2            # wstawki s/ss <= 2 pola (Czebyszew) od trasy W->terminal
PROLOGUE_GUARD_ROOM_FROM_ROUTE = 8 # drzwi pokoju Guarda <= 8 pól BFS od trasy (propozycja LD)
PROLOGUE_TERMINAL_TRIES = 15     # propozycja LD
PROLOGUE_HOUSE_MIN = (5, 4)      # propozycja LD: min. wnętrze domu w Prologu
PROLOGUE_ROUTE_CLEAR = 6           # zwykłe grupy >= 6 pól BFS od trasy W->terminal (propozycja LD)
# M2 (za flagą): każde pole przechodnie ma norę odległą o >= 20 pól (SCRAPPER_BURROW_MIN_DIST)
M2_BURROW_COVERAGE_CHECK = False
SCRAPPER_BURROW_MIN_DIST = 20

CLEARPATH_GROUPS = {1: ("sss", "ddh"), 2: ("sss", "dht"), 3: ("sss", "ddh")}  # g1/g3 Balans v1.1, g2 propozycja LD
DATACORE_GUARDS = "ddh"                                                       # propozycja LD
# skład grup: szablon Balansu (balans-sim/wyprawa.py ENC), korekta do wylosowanej liczby
ENEMY_TEMPLATE = {1: ["sss", "dd", "dd", "h", "h"],
                  2: ["ssss", "dd", "dd", "h", "ht", "ht"],
                  3: ["ssh", "sst", "ddh", "ddt", "ht", "h"]}

PASSABLE = set(".,;='")   # '#', '<' (szyb: nieprzechodni, v0.5) i reszta = ściana; obiekty w osobnej warstwie

# ----------------------------------------------------------------------------- siatka
class Room:
    def __init__(s, x0, y0, x1, y1, kind):  # wnętrze włącznie
        s.x0, s.y0, s.x1, s.y1, s.kind, s.doors = x0, y0, x1, y1, kind, []
    def cells(s): return [(x, y) for y in range(s.y0, s.y1 + 1) for x in range(s.x0, s.x1 + 1)]
    def inside(s, x, y): return s.x0 <= x <= s.x1 and s.y0 <= y <= s.y1

class Grid:
    def __init__(s, W, H, fill="#"):
        s.W, s.H = W, H; s.c = [[fill] * W for _ in range(H)]
    def get(s, x, y): return s.c[y][x] if 0 <= x < s.W and 0 <= y < s.H else "#"
    def set(s, x, y, ch):
        if 1 <= x < s.W - 1 and 1 <= y < s.H - 1: s.c[y][x] = ch
    def pas(s, x, y): return s.get(x, y) in PASSABLE
    def rect(s, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.set(x, y, ch)
    def rows(s): return ["".join(r) for r in s.c]

DIRS8 = [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]

def bfs(g, starts, block=None):
    """Długość ścieżki: 8 kierunków, każdy krok = 1, bez ścinania rogów (jak canStep)."""
    D = [[-1] * g.W for _ in range(g.H)]
    q = deque()
    for (x, y) in starts: D[y][x] = 0; q.append((x, y))
    while q:
        x, y = q.popleft(); d = D[y][x] + 1
        for dx, dy in DIRS8:
            nx, ny = x + dx, y + dy
            if D[ny][nx] >= 0 or not g.pas(nx, ny): continue
            if block and (nx, ny) in block: continue
            if dx and dy and (not g.pas(x + dx, y) or not g.pas(x, y + dy)): continue
            D[ny][nx] = d; q.append((nx, ny))
    return D

def largest_component(g):
    seen = set(); best = set()
    for y in range(g.H):
        for x in range(g.W):
            if (x, y) in seen or not g.pas(x, y): continue
            D = bfs(g, [(x, y)])
            comp = {(cx, cy) for cy in range(g.H) for cx in range(g.W) if D[cy][cx] >= 0}
            seen |= comp
            if len(comp) > len(best): best = comp
    return best

def los(g, a, b):
    (x0, y0), (x1, y1) = a, b
    dx, dy = abs(x1 - x0), -abs(y1 - y0); sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1
    err = dx + dy
    while (x0, y0) != (x1, y1):
        e2 = 2 * err
        if e2 >= dy: err += dy; x0 += sx
        if e2 <= dx: err += dx; y0 += sy
        if (x0, y0) != (x1, y1) and not g.pas(x0, y0): return False
    return True

def cheb(a, b): return max(abs(a[0]-b[0]), abs(a[1]-b[1]))
def n_pas8(g, x, y): return sum(g.pas(x+dx, y+dy) for dx, dy in DIRS8)
def wall_orth(g, x, y): return sum(not g.pas(x+dx, y+dy) for dx, dy in DIRS8[:4])

def build_room(g, r, floor="."):
    g.rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1, "#"); g.rect(r.x0, r.y0, r.x1, r.y1, floor)

def add_door(g, r, side, rng):
    """Drzwi w ścianie pokoju. side: N S W E. Zwraca (door, outside) albo None."""
    if side in "NS":
        x = rng.int(r.x0, r.x1); y = r.y0 - 1 if side == "N" else r.y1 + 1; o = (x, y + (-1 if side == "N" else 1))
    else:
        y = rng.int(r.y0, r.y1); x = r.x0 - 1 if side == "W" else r.x1 + 1; o = (x + (-1 if side == "W" else 1), y)
    if not (1 <= o[0] < g.W - 1 and 1 <= o[1] < g.H - 1): return None
    g.set(x, y, "'"); r.doors.append((x, y)); return (x, y), o

# ----------------------------------------------------------------------------- głęb. 1: ulice + działki
def gen_outskirts(W, H, rng, prologue=False):
    g = Grid(W, H); rooms = []
    vx = []; x = 1
    while True:                                   # ulice pionowe (boczne, szer. 2)
        x += rng.int(13, 18)
        if x + 2 > W - 8: break
        vx.append((x, 2)); x += 2
    hy = []; y = 1; main_done = False
    while True:                                   # ulice poziome (1 główna szer. 3, reszta 2)
        y += rng.int(10, 12) if prologue else rng.int(8, 11)
        sw = 3 if not main_done and y > H // 3 else 2
        if y + sw > H - 6: break
        hy.append((y, sw)); main_done |= sw == 3; y += sw
    for (x, w) in vx: g.rect(x, 1, x + w - 1, H - 2, ".")
    for (y, w) in hy: g.rect(1, y, W - 2, y + w - 1, ".")
    street = {(x, y) for y in range(H) for x in range(W) if g.pas(x, y)}
    # bloki między ulicami
    xs = [1] + [a + w for a, w in vx]; xe = [a - 1 for a, w in vx] + [W - 2]
    ys = [1] + [a + w for a, w in hy]; ye = [a - 1 for a, w in hy] + [H - 2]
    for bx0, bx1 in zip(xs, xe):
        for by0, by1 in zip(ys, ye):
            bw = bx1 - bx0 + 1; lots = [(bx0, bx1)]
            if bw >= 15:
                cut = rng.int(bx0 + 7, bx1 - 7); lots = [(bx0, cut - 1), (cut + 1, bx1)]
            for lx0, lx1 in lots:
                lw, lh = lx1 - lx0 + 1, by1 - by0 + 1
                if lw < 6 or lh < 5: continue
                top = (lx0, by0 - 1) in street; bot = (lx0, by1 + 1) in street
                face = "N" if top and (not bot or rng.chance(0.5)) else ("S" if bot else rng.pick("NS"))
                mi = PROLOGUE_HOUSE_MIN if prologue else (4, 3)   # Prolog: więcej domów >= 5x5 (pokój Guarda)
                iw = rng.int(min(mi[0], min(8, lw - 2)), min(8, lw - 2)); ih = rng.int(min(mi[1], min(6, lh - 3)), min(6, lh - 3))
                hx0 = rng.int(lx0 + 1, lx1 - iw)
                yard = rng.int(min(1, lh - ih - 2), min(2, lh - ih - 2))
                if face == "N": hy0 = by0 + 1 + yard
                else: hy0 = by1 - yard - ih
                r = Room(hx0, hy0, hx0 + iw - 1, hy0 + ih - 1, "house"); build_room(g, r)
                if yard:                           # podwórko od strony ulicy
                    yy0, yy1 = (by0, r.y0 - 2) if face == "N" else (r.y1 + 2, by1)
                    for yy in range(yy0, yy1 + 1):
                        for xx in range(max(lx0, r.x0 - 1), min(lx1, r.x1 + 1) + 1):
                            g.set(xx, yy, ";" if rng.chance(0.3) else ".")
                add_door(g, r, face, rng)
                if rng.chance(0.35):              # drugie drzwi + ścieżka do innej ulicy (pętla)
                    side = "S" if face == "N" else "N"
                    res = add_door(g, r, side, rng)
                    if res:
                        (dx_, dy_), (ox, oy) = res; step = 1 if side == "S" else -1; path = []
                        while 0 < oy < H - 1 and (ox, oy) not in street and len(path) < 6:
                            path.append((ox, oy)); oy += step
                        if (ox, oy) in street:
                            for p in path: g.set(*p, ".")
                        else:
                            g.set(dx_, dy_, "#"); r.doors.pop()
                rooms.append(r)
    # barykady z wraków na ulicach bocznych -> ślepe zaułki
    for _ in range(rng.int(2, 4)):
        if not vx: break
        x, w = rng.pick(vx); y = rng.int(3, H - 4)
        if any(a - 1 <= y <= a + b for a, b in hy): continue
        g.rect(x, y, x + w - 1, y, "#")
    # wraki aut na ulicy głównej (2x1 przy krawędzi), gruz
    for (y, w) in hy:
        if w == 3:
            for x in range(2, W - 3, 1):
                if rng.chance(0.06): g.set(x, y, "#"); g.set(x + 1, y, "#")
    for (x, y) in street:
        if g.get(x, y) == "." and rng.chance(0.04): g.set(x, y, ",")
    return g, rooms

# ----------------------------------------------------------------------------- głęb. 2: pola paneli
def gen_solar(W, H, rng):
    g = Grid(W, H); rooms = []
    g.rect(2, 2, W - 3, H - 3, ".")
    for _ in range(rng.int(10, 16)):              # nieregularny płot / skraj pola
        side = rng.pick("NSWE"); d = rng.int(2, 6); L = rng.int(6, 14)
        if side in "NS":
            x = rng.int(2, W - 3 - L); y0 = 2 if side == "N" else H - 2 - d
            g.rect(x, y0, x + L, y0 + d - 1, "#")
        else:
            y = rng.int(2, H - 3 - L); x0 = 2 if side == "W" else W - 2 - d
            g.rect(x0, y, x0 + d - 1, y + L, "#")
    occupied = []
    for _ in range(rng.int(3, 5) * 6):            # budynki: dok dronów, pompy, budki techników
        if len(rooms) >= 5: break
        iw, ih = rng.int(6, 10), rng.int(4, 6)
        x0, y0 = rng.int(4, W - 5 - iw), rng.int(4, H - 5 - ih)
        box = (x0 - 3, y0 - 3, x0 + iw + 2, y0 + ih + 2)
        if any(not (box[2] < b[0] or box[0] > b[2] or box[3] < b[1] or box[1] > b[3]) for b in occupied): continue
        r = Room(x0, y0, x0 + iw - 1, y0 + ih - 1, "building"); occupied.append(box)
        rooms.append(r)
    if len(rooms) < 3: return None
    # bloki paneli między drogami serwisowymi
    roads_x = []; x = 2
    while True:
        x += rng.int(16, 22)
        if x > W - 8: break
        roads_x.append(x); x += 2
    roads_y = []; y = 2
    while True:
        y += rng.int(9, 13)
        if y > H - 7: break
        roads_y.append(y); y += 2
    def on_road(x, y): return any(a <= x <= a + 1 for a in roads_x) or any(a <= y <= a + 1 for a in roads_y)
    def near_bld(x, y): return any(b[0] + 1 <= x <= b[2] - 1 and b[1] + 1 <= y <= b[3] - 1 for b in occupied)
    phase = rng.int(0, 3)
    for y in range(3, H - 3):
        if (y + phase) % 4 not in (0, 1): continue   # 2 rzędy paneli, 2 rzędy alejki
        x = 3
        while x < W - 3:
            L = rng.int(8, 14); gap = 1
            for xx in range(x, min(x + L, W - 3)):
                if not on_road(xx, y) and not near_bld(xx, y) and g.get(xx, y) == ".": g.set(xx, y, "#")
            x += L + gap
    for r in rooms:
        build_room(g, r)
        sides = rng.shuffle(list("NSWE")); n = 1 if rng.chance(0.5) else 2
        for s_ in sides[:n]:
            res = add_door(g, r, s_, rng)
            if res: g.set(*res[1], ".")
    for y in range(H):
        for x in range(W):
            if g.get(x, y) == "." and not any(r.inside(x, y) for r in rooms):
                if rng.chance(0.08): g.set(x, y, ";")
                elif rng.chance(0.02): g.set(x, y, ",")
    return g, rooms

# ----------------------------------------------------------------------------- głęb. 3: tory + hale
def gen_depot(W, H, rng):
    g = Grid(W, H); rooms = []
    n = 3; band = (H - 2) // n
    tracks = [1 + band * i + band // 2 + rng.int(-1, 1) for i in range(n)]
    for ty in tracks:                             # korytarze torowe szer. 3, środkowy rząd '='
        x0 = rng.int(1, 3); x1 = rng.int(W - 4, W - 2)
        g.rect(x0, ty - 1, x1, ty + 1, "."); g.rect(x0, ty, x1, ty, "=")
    bounds = [1] + [t + 3 for t in tracks]; ends = [t - 3 for t in tracks] + [H - 2]
    for bi, (by0, by1) in enumerate(zip(bounds, ends)):
        if by1 - by0 < 4: continue
        x = rng.int(2, 5)
        while x < W - 8:
            space = by1 - by0 + 1
            if rng.chance(0.4) and space >= 9 and x + 16 < W - 3:      # hala
                iw = rng.int(14, min(22, W - 4 - x)); ih = min(space - 2, rng.int(7, 11))
                y0 = by0 + 1 + rng.int(0, space - 2 - ih)
                r = Room(x, y0, x + iw - 1, y0 + ih - 1, "hall"); build_room(g, r)
                cy = (r.y0 + r.y1) // 2
                g.rect(r.x0, cy, r.x1, cy, "=")
                wx = rng.int(r.x0 + 2, r.x1 - 9); g.rect(wx, cy, wx + rng.int(5, 8), cy, "#")  # wagon
                for px in range(r.x0 + 2, r.x1 - 1, 5):                                     # filary
                    if r.y1 - r.y0 >= 6: g.set(px, r.y0 + 1, "#"); g.set(px, r.y1 - 1, "#")
                rooms.append(r); x += iw + 3
            else:                                                         # biuro / magazyn
                iw = rng.int(4, 7); ih = min(space - 2, rng.int(3, 5))
                if ih < 3: x += 3; continue
                y0 = by0 + 1 + rng.int(0, space - 2 - ih)
                r = Room(x, y0, x + iw - 1, y0 + ih - 1, "office"); build_room(g, r); rooms.append(r)
                x += iw + rng.int(2, 4)
    # drzwi + krótkie przejścia do najbliższego korytarza
    for r in rooms:
        want = 2 if r.kind == "hall" else (2 if rng.chance(0.3) else 1)
        sides = []
        up = [t for t in tracks if t + 1 < r.y0]; dn = [t for t in tracks if t - 1 > r.y1]
        if up: sides.append(("N", max(up) + 1))
        if dn: sides.append(("S", min(dn) - 1))
        rng.shuffle(sides)
        for side, ty in sides[:want]:
            x = rng.int(r.x0, r.x1)
            if side == "N":
                for yy in range(ty + 1, r.y0): g.set(x, yy, ".")
                r.doors.append((x, r.y0 - 1)); g.set(x, r.y0 - 1, "'")
            else:
                for yy in range(r.y1 + 1, ty): g.set(x, yy, ".")
                r.doors.append((x, r.y1 + 1)); g.set(x, r.y1 + 1, "'")
    # łączniki pionowe (pętle) i ślepe odnogi
    for i in range(n - 1):
        for _ in range(rng.int(1, 2)):
            x = rng.int(4, W - 6)
            g.rect(x, tracks[i] + 2, x + 1, tracks[i + 1] - 2, ".")
    for _ in range(rng.int(2, 4)):
        ty = rng.pick(tracks); x = rng.int(3, W - 4); L = rng.int(4, 7); s = rng.pick([-1, 1])
        for k in range(2, 2 + L): g.set(x, ty + s * k, ".")
    for y in range(H):
        for x in range(W):
            if g.get(x, y) == "." and rng.chance(0.03): g.set(x, y, ",")
    return g, rooms

PASSABLE_TUNE_TARGET = (0.41, 0.49)   # krok korekty celuje w środek widełek
PASSABLE_TUNE_MAX_RUN = 12

def tune_passable(g, rooms, rng):
    """Korekta procentu pól przechodnich bez psucia łączności i liczby wejść do pokoi.
    Za mało: przebij prostą ścianę (1 szer., <= MAX_RUN) między dwoma polami przechodnimi, z dala od pokoi.
    Za dużo: postaw słup/wrak '#' na polu, którego 8 sąsiadów jest przechodnich (nie rozcina mapy)."""
    W, H = g.W, g.H; tot = W * H
    def near_room(x, y): return any(r.x0 - 2 <= x <= r.x1 + 2 and r.y0 - 2 <= y <= r.y1 + 2 for r in rooms)
    npas = sum(g.pas(x, y) for y in range(H) for x in range(W))
    lo, hi = PASSABLE_TUNE_TARGET
    tries = 0
    while npas < lo * tot and tries < 400:
        tries += 1
        x, y = rng.int(2, W - 3), rng.int(2, H - 3)
        if g.pas(x, y) or near_room(x, y): continue
        dx, dy = rng.pick([(1, 0), (0, 1)])
        if not g.pas(x - dx, y - dy): continue          # start przy polu przechodnim
        run = []; cx, cy = x, y
        while not g.pas(cx, cy) and len(run) <= PASSABLE_TUNE_MAX_RUN and 1 <= cx < W - 1 and 1 <= cy < H - 1:
            if near_room(cx, cy): run = None; break
            run.append((cx, cy)); cx += dx; cy += dy
        if not run or len(run) > PASSABLE_TUNE_MAX_RUN or not g.pas(cx, cy): continue
        for c in run: g.set(*c, ".")
        npas += len(run)
    while npas > hi * tot and tries < 4000:
        tries += 1
        x, y = rng.int(2, W - 3), rng.int(2, H - 3)
        if g.get(x, y) not in ".,;" or near_room(x, y) or n_pas8(g, x, y) < 8: continue
        g.set(x, y, "#"); npas -= 1

GEN = {1: gen_outskirts, 2: gen_solar, 3: gen_depot}

# ----------------------------------------------------------------------------- składy grup
def enemy_groups(depth, n):
    gr = list(ENEMY_TEMPLATE[depth]); base = sum(len(x) for x in gr)
    if depth == 1:   # sss -> ss / ssss
        gr[0] = "s" * (3 + n - base)
    elif depth == 2: # 12: sss; 14: ssss -> sss + ss
        if n == base - 1: gr[0] = "sss"
        elif n == base + 1: gr[0] = "sss"; gr.append("ss")
    else:            # 14: ssh -> sh; 16: h -> sh
        if n == base - 1: gr[0] = "sh"
        elif n == base + 1: gr[5] = "sh"
    assert sum(len(x) for x in gr) == n
    return gr

# ----------------------------------------------------------------------------- rozmieszczenie
class Fail(Exception): pass

def generate(exp_seed, depth, contracts=(), max_attempts=LEVEL_GEN_MAX_ATTEMPTS, prologue=False):
    P = DEPTH[depth]
    for attempt in range(max_attempts):
        try:
            lv = _attempt(exp_seed, depth, attempt, P, contracts, prologue)
            lv["attempt"] = attempt
            return lv
        except Fail as e:
            last = str(e)
    return {"fail": last, "attempt": max_attempts}

def _attempt(seed, depth, attempt, P, contracts, prologue=False):
    W, H = P["W"], P["H"]
    r_lay = level_rng(seed, depth, attempt, "layout")
    res = GEN[depth](W, H, r_lay, prologue) if depth == 1 else GEN[depth](W, H, r_lay)
    if res is None: raise Fail("layout")
    g, rooms = res
    r_obj = level_rng(seed, depth, attempt, "objects")
    r_en = level_rng(seed, depth, attempt, "enemies")
    r_con = level_rng(seed, depth, attempt, "contracts")
    tune_passable(g, rooms, r_lay)                 # korekta % pól przechodnich (przed BFS)
    # 1) wejście W: przy krawędzi (głęb. 3: zachód), otwarte pole
    def open3(x, y): return n_pas8(g, x, y) >= 5
    side = "W" if depth == 3 else r_obj.pick("NSWE")
    band = 8
    cand = [(x, y) for y in range(H) for x in range(W) if g.pas(x, y) and open3(x, y)
            and not any(r.inside(x, y) for r in rooms)
            and ((side == "W" and x <= band) or (side == "E" and x >= W - 1 - band)
                 or (side == "N" and y <= band) or (side == "S" and y >= H - 1 - band))]
    comp = largest_component(g)
    cand = [c for c in cand if c in comp]
    if not cand: raise Fail("entry")
    E = r_obj.pick(cand)
    # 2) łączność: wszystko poza komponentem W -> ściana
    dW = bfs(g, [E])
    for y in range(H):
        for x in range(W):
            if g.pas(x, y) and dW[y][x] < 0: g.c[y][x] = "#"
    rooms = [r for r in rooms if dW[r.y0][r.x0] >= 0 or any(dW[c[1]][c[0]] >= 0 for c in r.cells())]
    npas = sum(g.pas(x, y) for y in range(H) for x in range(W))
    pct = npas / (W * H)
    if not (PASSABLE_PCT[0] <= pct <= PASSABLE_PCT[1]): raise Fail(f"passable {pct:.2f}")
    room_of = {}
    for i, r in enumerate(rooms):
        for c in r.cells(): room_of[c] = i
    def d(D, c): return D[c[1]][c[0]]
    free = [(x, y) for y in range(H) for x in range(W) if g.get(x, y) in ".,;="]
    taken = {E}
    # 3) szyb `<`: przy ścianie, poza pokojami
    lo, hi = P["shaft"]
    def corridor1(x, y):  # korytarz szer. 1: ściany po obu stronach w poziomie albo w pionie
        return (not g.pas(x-1, y) and not g.pas(x+1, y)) or (not g.pas(x, y-1) and not g.pas(x, y+1))
    base = [c for c in free if lo <= d(dW, c) <= hi and c not in room_of and wall_orth(g, *c) >= 1
            and not corridor1(*c) and n_pas8(g, *c) >= SHAFT_MIN_PASSABLE_NEIGHBORS]
    pref = [c for c in base if n_pas8(g, *c) >= SHAFT_PREF_PASSABLE_NEIGHBORS]
    cand = pref or base
    r_obj.shuffle(cand); S = None
    for c in cand[:30]:                      # `<` jest ścianą dla wrogów/drona: mapa musi zostać spójna
        g.c[c[1]][c[0]] = "<"
        dW2 = bfs(g, [E])
        dS_in = min([dW2[c[1]+dy][c[0]+dx] for dx, dy in DIRS8 if dW2[c[1]+dy][c[0]+dx] >= 0] or [-99]) + 1
        if lo <= dS_in <= hi and all(dW2[y][x] >= 0 for y in range(H) for x in range(W) if g.pas(x, y)):
            S = c; dW = dW2; break
        g.c[c[1]][c[0]] = "."
    if S is None: raise Fail("shaft")
    free.remove(S); taken.add(S); dS = bfs(g, [S])
    dW[S[1]][S[0]] = min(dW[S[1]+dy][S[0]+dx] for dx, dy in DIRS8 if dW[S[1]+dy][S[0]+dx] >= 0) + 1
    # 4) zejście `>` / brama areny
    lo, hi = P["down"]
    cand = [c for c in free if lo <= d(dW, c) <= hi and d(dS, c) >= STAIRS_GATE_MIN_DIST_FROM_SHAFT
            and c not in room_of and wall_orth(g, *c) >= 1]
    if not cand: raise Fail("down")
    D_ = r_obj.pick(cand); taken.add(D_)
    # (pomocnicze: reguły dla wrogów, używane od kroku 5)
    enemies = []; contract_objs = []
    def enemy_ok(c, contract=False):
        if c in taken or not g.get(*c) in ".,;=": return False
        if d(dW, c) < NO_ENEMY_RADIUS_ENTRY_SHAFT or d(dS, c) < NO_ENEMY_RADIUS_ENTRY_SHAFT: return False
        if d(dT, c) < TERMINAL_NO_ENEMY_RADIUS or cheb(c, T) < TERMINAL_MIN_CHEB: return False
        for p in (E, S):
            if cheb(c, p) <= ENTRY_LOS_SAFE and los(g, c, p): return False
        return True
    def place_group(anchor, letters, extra=lambda c: True, tag=None):
        pts = [anchor] + [(anchor[0]+dx, anchor[1]+dy) for dy in (-1,0,1,-2,2) for dx in (-1,0,1,-2,2) if (dx,dy) != (0,0)]
        out = []
        for c in pts:
            if len(out) == len(letters): break
            if enemy_ok(c) and extra(c) and d(dW, c) >= 0:
                out.append(c)
        if len(out) < len(letters): return False
        for c, ch in zip(out, letters):
            taken.add(c); enemies.append(dict(t=ch, x=c[0], y=c[1], tag=tag))
        return True
    # 5) terminal: pokój z 1–2 wejściami, 25–40 od szybu, przy ścianie pokoju, nie przy drzwiach
    lo, hi = TERMINAL_DIST_FROM_SHAFT
    ok_rooms = {i for i, r in enumerate(rooms) if 1 <= len(r.doors) <= 2}
    cand = [c for c in free if c in room_of and room_of[c] in ok_rooms and lo <= d(dS, c) <= hi
            and wall_orth(g, *c) >= 1 and all(cheb(c, dr) > 1 for dr in rooms[room_of[c]].doors)
            and (not prologue or lo_hi(PROLOGUE_TERMINAL_DIST_FROM_ENTRY, d(dW, c)))]
    if not cand: raise Fail("terminal")
    T = None; dT = None; prologue_pre = None
    if not prologue:
        T = r_obj.pick(cand); taken.add(T); dT = bfs(g, [T])
    else:   # Prolog: próbuj kolejnych kandydatów na terminal, aż wstawki się zmieszczą
        r_obj.shuffle(cand); n_pro = r_en.int(*P['enemies'])
        for tc in cand[:PROLOGUE_TERMINAL_TRIES]:
            T = tc; dT = bfs(g, [T]); n_en0 = len(enemies); tk0 = set(taken)
            taken.add(T); chests = []; cD = []
            try:
                prologue_pre = place_prologue(g, rooms, room_of, free, dW, dT, E, T, n_pro,
                                              enemy_ok, place_group, taken, r_en, chests, cD, enemies)
                break
            except Fail:
                del enemies[n_en0:]; taken.clear(); taken.update(tk0); T = None
        if T is None: raise Fail('prologue')
    # 6) nory: ściana z wylotem na pole przechodnie
    mouths = []
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if g.pas(x, y): continue
            for dx, dy in DIRS8[:4]:
                m = (x + dx, y + dy)
                if g.pas(*m) and m not in room_of and d(dW, m) >= BURROW_MIN_DIST_ENTRY_SHAFT \
                        and d(dS, m) >= BURROW_MIN_DIST_ENTRY_SHAFT and d(dT, m) >= TERMINAL_NO_ENEMY_RADIUS + 2 \
                        and cheb(m, T) >= TERMINAL_MIN_CHEB + 2:
                    mouths.append(((x, y), m)); break
    r_obj.shuffle(mouths); burrows = []; bD = []
    for wcell, m in mouths:
        if all(d(D, m) >= BURROW_MIN_SPACING for D in bD):
            burrows.append((wcell, m)); bD.append(bfs(g, [m]))
            if len(burrows) == P["burrows"]: break
    if len(burrows) < P["burrows"]: raise Fail("burrows")
    # 7) obiekty kontraktów
    for k in contracts:
        if k == "datacore":
            lo, hi = DATACORE_DIST
            cand = [c for c in free if lo <= d(dS, c) <= hi and enemy_ok(c)]
            r_con.shuffle(cand)
            for c in cand:
                taken.add(c)
                if place_group(c, DATACORE_GUARDS, lambda q: d(dS, q) >= 12, tag="datacore"):
                    contract_objs.append(dict(t="§", x=c[0], y=c[1])); break
                taken.discard(c)
            else: raise Fail("datacore")
        if k == "clearpath":
            lo, hi = CLEARPATH_ENEMY_DIST; done = 0
            cand = [c for c in free if lo <= d(dS, c) <= hi and enemy_ok(c)]
            r_con.shuffle(cand); anchors = []
            for c in cand:
                if done == 2: break
                if any(d(A, c) < 6 for A in anchors): continue
                comp = CLEARPATH_GROUPS[depth][done]
                if place_group(c, comp, lambda q: lo <= d(dS, q) <= hi, tag="clearpath"):
                    anchors.append(bfs(g, [c])); done += 1
            if done < 2: raise Fail("clearpath")
    # 8) zwykli wrogowie
    anchorsD = []; free_b = list(range(len(burrows)))
    route_ok = lambda c: True; prologue_info = None
    if prologue:
        groups, prologue_info, route_ok = prologue_pre
    else:
        chests = []; cD = []
        n = r_en.int(*P["enemies"]); groups = enemy_groups(depth, n)
    for comp in groups:
        if comp[0] == "s" and free_b:                       # Zbieracze przy norze
            b = free_b.pop(0); cand = [burrows[b][1]] + [c for c in free if 1 <= d(bD[b], c) <= 4]
        else:
            cand = [c for c in free if c not in room_of or rooms[room_of[c]].kind != "house" or r_en.chance(0.3)]
            r_en.shuffle(cand)
            if "t" in comp: cand.sort(key=lambda c: -n_pas8(g, *c))  # wieżyczka: otwarte pole
        okc = False
        for c in cand[:400]:
            if not enemy_ok(c) or not route_ok(c) or any(d(A, c) < GROUP_MIN_SPACING for A in anchorsD): continue
            if place_group(c, comp, route_ok):
                anchorsD.append(bfs(g, [c])); okc = True; break
        if not okc: raise Fail(f"enemies {comp}")
    # 9) skrzynie
    cand = [c for c in free if c not in taken and d(dW, c) >= CHEST_MIN_DIST_ENTRY and wall_orth(g, *c) >= 1 and cheb(c, T) > 3]
    r_obj.shuffle(cand); cand.sort(key=lambda c: 0 if c in room_of else 1)   # najpierw pokoje
    for c in cand:
        if all(d(D, c) >= CHEST_MIN_SPACING for D in cD):
            chests.append(c); cD.append(bfs(g, [c])); taken.add(c)
            if len(chests) == P["chests"]: break
    if len(chests) < P["chests"]: raise Fail("chests")
    # 10) notatki, #46, kredyty
    notes = []; nD = []; want = r_obj.int(*P["notes"])
    cand = [c for c in free if c in room_of and c not in taken]; r_obj.shuffle(cand)
    for c in cand:
        if all(d(D, c) >= NOTE_MIN_SPACING for D in nD):
            notes.append(c); nD.append(bfs(g, [c])); taken.add(c)
            if len(notes) == want: break
    if len(notes) < want: raise Fail("notes")
    body46 = None
    if depth == 2:
        cand = [c for c in free if c not in room_of and c not in taken and 25 <= d(dW, c) <= 60 and d(dS, c) >= 10 and wall_orth(g, *c) >= 1]
        if not cand: raise Fail("body46")
        body46 = r_obj.pick(cand); taken.add(body46)
    credits = []
    for _ in range(r_obj.int(*P["credits"])):
        cand = [c for c in free if c not in taken and d(dW, c) >= 10]
        c = r_obj.pick(cand); credits.append(c); taken.add(c)
    # 11) walidacja końcowa (twarde reguły)
    assert lo_hi(P["shaft"], d(dW, S)) and lo_hi(P["down"], d(dW, D_)) and d(dS, D_) >= 20
    assert lo_hi(TERMINAL_DIST_FROM_SHAFT, d(dS, T))
    for e in enemies:
        c = (e["x"], e["y"]); assert d(dW, c) >= 10 and d(dS, c) >= 10 and d(dT, c) >= 8
    for i in range(len(burrows)):
        for j in range(i + 1, len(burrows)): assert d(bD[i], burrows[j][1]) >= 30
    for c in chests + notes + credits + [T, S, D_]: assert d(dW, c) >= 0
    cover = burrow_coverage(g, free, bD)
    if M2_BURROW_COVERAGE_CHECK and cover < 1.0: raise Fail("burrow-coverage-M2")
    assert n_pas8(g, *S) >= SHAFT_MIN_PASSABLE_NEIGHBORS
    # metryki
    path_block = trace(dW, D_, E, g)
    alt = bfs(g, [E], block=set(p for p in path_block if cheb(p, E) > 2 and cheb(p, D_) > 2))
    far = max(v for row in dW for v in row)
    deadends = sum(1 for (x, y) in free if x and y and (x, y) not in room_of and sum(g.pas(x+dx, y+dy) for dx, dy in DIRS8[:4]) == 1)
    return dict(g=g, rooms=rooms, E=E, S=S, D=D_, T=T, burrows=burrows, enemies=enemies, chests=chests,
                notes=notes, body46=body46, credits=credits, contract_objs=contract_objs, pct=pct,
                dWS=d(dW, S), dWD=d(dW, D_), dSD=d(dS, D_), dST=d(dS, T), far=far,
                loop=d(alt, D_) >= 0, deadends=deadends, n_en=len([e for e in enemies if not e["tag"] or e["tag"].startswith("prologue")]),
                chest_dist=st.mean(d(dW, c) for c in chests), cover=cover, shaft_nb=n_pas8(g, *S),
                prologue=prologue_info, dWT=d(dW, T))

def lo_hi(r, v): return r[0] <= v <= r[1]

def burrow_coverage(g, free, bD):
    """M2: odsetek pól, dla których istnieje nora >= SCRAPPER_BURROW_MIN_DIST (BFS)."""
    ok = sum(1 for (x, y) in free if any(D[y][x] >= SCRAPPER_BURROW_MIN_DIST for D in bD))
    return ok / len(free)

def place_prologue(g, rooms, room_of, free, dW, dT, E, T, n, enemy_ok, place_group, taken, rng, chests, cD, enemies):
    """Prolog (mechaniki 2.19): wstawki na trasie W -> terminal 04 w kolejności:
    s (12–18), h w pokoju >= 5x5 (20–30) + skrzynia za nim, ss (30–40), terminal (45–60)."""
    d = lambda D, c: D[c[1]][c[0]]
    route = trace(dW, T, E, g); rset = set(route)
    dR = bfs(g, route)
    near = lambda c: min(cheb(c, p) for p in route) <= PROLOGUE_NEAR_ROUTE
    info = {}
    # 1) samotny Scrapper
    cand = [c for c in free if lo_hi(PROLOGUE_SCRAPPER_DIST, d(dW, c)) and enemy_ok(c) and near(c)]
    rng.shuffle(cand)
    if not cand or not place_group(cand[0], "s", tag="prologue1"): raise Fail("prologue s")
    info["s"] = d(dW, cand[0])
    # 2) Curfew Guard w pokoju >= 5x5 z 1 wejściem, skrzynia za nim
    best = None
    rl = [r for r in rooms if 1 <= len(r.doors) <= 2 and r.x1 - r.x0 + 1 >= PROLOGUE_GUARD_ROOM_MIN
          and r.y1 - r.y0 + 1 >= PROLOGUE_GUARD_ROOM_MIN and T not in set(r.cells())
          and min(d(dR, dr) if d(dR, dr) >= 0 else 999 for dr in r.doors) <= PROLOGUE_GUARD_ROOM_FROM_ROUTE]
    rng.shuffle(rl)
    for r in rl:
        gc = [c for c in r.cells() if lo_hi(PROLOGUE_GUARD_DIST, d(dW, c)) and enemy_ok(c)]
        rng.shuffle(gc)
        for guard in gc[:12]:
            # skrzynia "za Guardem": każda droga W -> skrzynia przechodzi <= 2 pola (Czebyszew) od Guarda
            zone = {(guard[0]+dx, guard[1]+dy) for dx in range(-2, 3) for dy in range(-2, 3)}
            dBlk = bfs(g, [E], block=zone)
            ch = [c for c in r.cells() + [n for dr in r.doors for n in []] if c not in taken and c not in zone
                  and d(dW, c) >= d(dW, guard) + 2 and dBlk[c[1]][c[0]] < 0]
            if ch:
                best = (r, guard, max(ch, key=lambda c: (d(dW, c), wall_orth(g, *c)))); break
        if best: break
    if not best: raise Fail("prologue guard room")
    r, guard, chest = best
    if not place_group(guard, "h", tag="prologue2"): raise Fail("prologue h")
    taken.add(chest); chests.append(chest); cD.append(bfs(g, [chest]))
    info.update(h=d(dW, guard), chest=d(dW, chest), room=(r.x1 - r.x0 + 1, r.y1 - r.y0 + 1))
    # 3) para Scrapperów
    cand = [c for c in free if lo_hi(PROLOGUE_PAIR_DIST, d(dW, c)) and enemy_ok(c) and near(c)]
    rng.shuffle(cand)
    for c in cand:
        if place_group(c, "ss", lambda q: lo_hi(PROLOGUE_PAIR_DIST, d(dW, q)), tag="prologue4"): break
    else: raise Fail("prologue ss")
    info["ss"] = d(dW, c); info["T"] = d(dW, T)
    info["pair_T"] = min(d(dT, (e["x"], e["y"])) for e in enemies if e["tag"] == "prologue4")
    # reszta puli (wstawki wchodzą w pulę 8–10): 8 = dd dd, 9 = + h, 10 = + h + s->sh
    rest = {8: ["dd", "dd"], 9: ["dd", "dd", "h"], 10: ["dd", "dd", "sh"]}[n]
    route_ok = lambda c: d(dR, c) >= PROLOGUE_ROUTE_CLEAR
    return rest, info, route_ok

def trace(D, target, start, g):
    path = [target]; c = target
    for _ in range(100000):
        if c == start: break
        x, y = c; nxt = None
        for dx, dy in DIRS8:
            nx, ny = x + dx, y + dy
            if D[ny][nx] == D[y][x] - 1 and (not (dx and dy) or (g.pas(x+dx, y) and g.pas(x, y+dy))):
                nxt = (nx, ny); break
        if nxt is None: raise Fail("trace")
        c = nxt; path.append(c)
    return path

# ----------------------------------------------------------------------------- wydruk
def render(lv, depth):
    g = lv["g"]; rows = [list(r) for r in g.rows()]
    def put(c, ch): rows[c[1]][c[0]] = ch
    for (w, m) in lv["burrows"]: put(w, "O")   # nora: znacznik debug (w grze niewidoczna)
    for c in lv["chests"]: put(c, "■")
    for c in lv["notes"]: put(c, "?")
    for c in lv["credits"]: put(c, "$")
    if lv["body46"]: put(lv["body46"], "%")
    for o in lv["contract_objs"]: put((o["x"], o["y"]), o["t"])
    for e in lv["enemies"]: put((e["x"], e["y"]), e["t"])
    put(lv["T"], "&"); put(lv["S"], "<"); put(lv["D"], ">" if depth < 3 else "G"); put(lv["E"], "@")
    return "\n".join("".join(r) for r in rows)

# ----------------------------------------------------------------------------- test
def test(n, base=1):
    print(f"Test {n} ziaren na wariant, generatorVersion={GENERATOR_VERSION}\n")
    variants = [(1, (), False), (1, (), True), (1, ("clearpath",), False), (2, (), False),
                (2, ("datacore", "clearpath"), False), (3, (), False), (3, ("clearpath",), False)]
    for depth, contracts, pro in variants:
        ok = 0; att = Counter(); fails = Counter(); M = {k: [] for k in
             ("dWS", "dWD", "dSD", "dST", "far", "pct", "deadends", "chest_dist", "n_en", "cover", "shaft_nb", "dWT")}; loops = 0; PR = []
        for i in range(n):
            seed = fmix32(base + i)
            lv = generate(seed, depth, contracts, prologue=pro)
            att[lv["attempt"]] += 1
            if "fail" in lv: fails[lv["fail"]] += 1; continue
            ok += 1; loops += lv["loop"]
            if lv["prologue"]: PR.append(lv["prologue"])
            for k in M: M[k].append(lv[k])
        P = DEPTH[depth]
        tag = ("PROLOG " if pro else "") + ("+".join(contracts) or "bez kontraktów")
        print(f"Głęb. {depth} {P['name']} {P['W']}x{P['H']} ({tag}): OK {ok}/{n} = {100*ok/n:.1f}%")
        a = sorted(att.elements())
        print(f"  próby: średnio {st.mean(a)+1:.2f}, p95 {a[int(.95*len(a))]+1}, max {max(a)+1}")
        if fails: print(f"  porażki po {LEVEL_GEN_MAX_ATTEMPTS} próbach: {dict(fails)}")
        if ok:
            f = lambda k: f"{st.mean(M[k]):.1f} [{min(M[k])}–{max(M[k])}]"
            print(f"  W→<: {f('dWS')} | W→>: {f('dWD')} | <→>: {f('dSD')} | <→&: {f('dST')}")
            print(f"  najdalsze pole od W: {f('far')} | pola przechodnie: {100*st.mean(M['pct']):.1f}% "
                  f"[{100*min(M['pct']):.1f}–{100*max(M['pct']):.1f}] | wrogów (pula): {f('n_en')}")
            print(f"  śr. ścieżka W→skrzynia: {st.mean(M['chest_dist']):.1f} | ślepe końce (pola): {st.mean(M['deadends']):.1f}"
                  f" | alternatywna droga W→> (pętla): {100*loops/ok:.0f}%")
            print(f"  szyb: przechodni sąsiedzi {f('shaft_nb')}, z >= 3: {100*sum(v >= 3 for v in M['shaft_nb'])/ok:.0f}%"
                  f" | M2 pokrycie norą >= 20 pól: śr. {100*st.mean(M['cover']):.1f}%, poziomy 100%: {100*sum(v == 1 for v in M['cover'])/ok:.0f}%")
            if PR:
                g_ = lambda k: f"{st.mean(p[k] for p in PR):.1f} [{min(p[k] for p in PR)}–{max(p[k] for p in PR)}]"
                print(f"  PROLOG: s {g_('s')} | h {g_('h')} | skrzynia {g_('chest')} | ss {g_('ss')} | terminal {g_('T')} | ss→terminal {g_('pair_T')}")
            sp = 5.75
            print(f"  marsz (5,75 pola/s): W→< {st.mean(M['dWS'])/sp:.1f} s, W→> {st.mean(M['dWD'])/sp:.1f} s, najdalsze {st.mean(M['far'])/sp:.1f} s")
        print()

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", type=int); ap.add_argument("--show", type=int); ap.add_argument("--depth", type=int, default=1)
    ap.add_argument("--contracts", default=""); ap.add_argument("--prologue", action="store_true")
    a = ap.parse_args()
    if a.test: test(a.test)
    if a.show is not None:
        lv = generate(a.show, a.depth, tuple(x for x in a.contracts.split(",") if x), prologue=a.prologue)
        if "fail" in lv: print("FAIL", lv); sys.exit(1)
        print(render(lv, a.depth))
        print({k: lv[k] for k in ("attempt", "dWS", "dWD", "dSD", "dST", "dWT", "far", "pct", "loop", "shaft_nb", "prologue")})

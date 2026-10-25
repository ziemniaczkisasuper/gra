#!/usr/bin/env python3
"""Walidator, solver i generator zagadki terminala „Power Lines — Line 1” (M1).

Zasady: power-lines-line1.md (ten folder). Dane: power-lines-line1.json.
Python 3.8+, bez zależności zewnętrznych.

Uruchomienie:
    python3 validate.py                          # sprawdza wszystkie warianty + teksty
    python3 validate.py --show M1_TERM_03        # start, podgląd liczb i rozwiązanie
    python3 validate.py --selftest               # testy samych zasad na małych siatkach
    python3 validate.py --generate M1_TERM_06 --count 5 --seed 7   # instancje ponownego zestrojenia (JSON)
    python3 validate.py --gen-test 500           # 500 losowań na wariant, każda instancja sprawdzona solverem
    python3 validate.py inny_plik.json           # inny plik danych

Kod wyjścia: 0 = wszystko OK, 1 = błędy.
"""
import argparse
import json
import math
import os
import random
import re
import sys
from collections import deque

# --------------------------------------------------------------------------
# Znaki siatki (sekcja 3 dokumentu zasad)
# --------------------------------------------------------------------------
EMPTY = "."
SOURCE = "*"
CABLE_H = "-"
CABLE_V = "|"
JUNCTION = "+"
SWITCH_ON = "="      # przełącznik ON (przewodzi)
SWITCH_OFF = "/"     # przełącznik OFF (przerwa)
FUSE = "!"
GROUND = "_"
DIGITS = "123456789"  # urządzenia: zapotrzebowanie 1..9
ALLOWED = set(EMPTY + SOURCE + CABLE_H + CABLE_V + JUNCTION + SWITCH_ON + SWITCH_OFF + FUSE + GROUND + DIGITS)

MAX_W = 9
MAX_H = 9
MAX_SWITCHES = 12
POWER_LINES_MAX_RECEIVERS = 4   # mechaniki v0.5.2; litery A–D
MAX_CONSUMERS = POWER_LINES_MAX_RECEIVERS   # PROG / UI i Menu (zatwierdzone przez Mechaników): najwyżej 4 urządzenia w wariancie M1 (litery A–D)
CONSUMER_KINDS = ("end", "mid")   # consumer_type: na końcu linii / na drodze (mid dopiero od głęb. 3)
POWER_LINES_MID_FROM_DEPTH = 3   # mechaniki v0.5.2 (tabela stałych)
MID_MIN_DEPTH = POWER_LINES_MID_FROM_DEPTH
MAX_POWER = 99      # mieści się w 2 znakach komórki
# Uzgodnione z UI i Menu (sekcja 5 dokumentu): komórka >= 28 px (26 px na niskich ekranach),
# pole trafienia przełącznika 48x48 px, bez przewijania. Stąd twardy warunek:
MIN_SWITCH_GAP = 2  # odległość Czebyszewa między dowolnymi dwoma przełącznikami

# --------------------------------------------------------------------------
# Decyzje Mechaników (uzgodnione z Mechanikami, do akceptacji GD) – sekcje 5, 6, 11 dokumentu
# --------------------------------------------------------------------------
# M1: reguły wchodzą stopniowo z głębokością (zbiory narastające)
DEPTH_ELEMENTS = {
    1: {"source", "multi_source", "cable", "switch", "consumer", "ground"},
}
DEPTH_ELEMENTS[2] = DEPTH_ELEMENTS[1] | {"junction", "ring"}
DEPTH_ELEMENTS[3] = DEPTH_ELEMENTS[2] | {"fuse", "pass_through"}
# M5: cel czasowy (mediana, s) na głębokość; głęb. 3 dodatkowo limit wariantu mediana <= 75 s (mechaniki 2.2)
TIME_TARGET_S = {1: (30, 60), 2: (60, 90), 3: (60, 90)}
TIME_LIMIT_D3_MEDIAN_S = 75
TIME_P80_MAX_S = {1: 120, 2: 120, 3: 105}   # mechaniki v0.5.2 (2.2): p80 <= 120 s, głęb. 3 p80 <= 105 s
P80_MARGIN_S = 30   # szacunek p80 = mediana + 30 s (proporcja z mechaniki 2.2: 90/120, 75/105)
# M7: losowy start przy ponownym zestrojeniu – minimalna liczba ruchów do wygranej
RETUNE_MIN_MOVES_RULE = {1: 1, 2: 2, 3: 2}
# M3/M4: pomoc i kara (sprawdzane tylko dla zgodności JSON z decyzją)
HELP_RULES = {"fail_lock_ms": 1500, "help_free_from_start": True, "help_pulse_after_failed_sends": 2,
              "help_pulse_after_seconds": 45, "reward_depends_on_sends_or_time": False,
              "live_numbers": True, "fail_states_after_send_only": True}

# kolejność sąsiadów: góra, prawo, dół, lewo (deterministyczna kolejność przepływu)
DIRS = (("U", -1, 0), ("R", 0, 1), ("D", 1, 0), ("L", 0, -1))
OPP = {"U": "D", "D": "U", "L": "R", "R": "L"}

# wyniki symulacji (po SEND)
WIN, DARK, OVERLOAD, FUSE_BLOWN, TRIP, SHORT = "WIN", "DARK", "OVERLOAD", "FUSE", "TRIP", "SHORT"
FAILS = (OVERLOAD, FUSE_BLOWN, TRIP, SHORT)
WIN_RETUNE = "WIN_RETUNE"  # wygrana w instancji ponownego zestrojenia (bez fragmentu mapy)

# Tokeny w tekstach wyniku (fabula/teksty-m1-en.md §11). Wartości liczy simulate() w res["tokens"].
# Nazwy robocze: PROG musi potwierdzić nazwy pól w kodzie gry.
RESULT_TOKENS = {
    WIN: set(), WIN_RETUNE: set(), DARK: set(), OVERLOAD: set(), SHORT: set(),
    TRIP: {"box_power", "box_lines"},
    FUSE_BLOWN: {"fuse_max"},
}
ELEMENT_IDS = {"source", "multi_source", "cable", "junction", "switch", "consumer", "ground", "fuse",
               "pass_through", "ring"}
LEGEND_TEXT_IDS = {"source": "M1_TERM_LEG_SOURCE", "multi_source": "M1_TERM_LEG_SUM", "cable": "M1_TERM_LEG_CABLE",
                   "junction": "M1_TERM_LEG_JUNCTION", "switch": "M1_TERM_LEG_SWITCH",
                   "consumer": "M1_TERM_LEG_CONSUMER", "ground": "M1_TERM_LEG_GROUND", "fuse": "M1_TERM_LEG_FUSE",
                   "pass_through": "M1_TERM_LEG_PASS", "ring": "M1_TERM_LEG_RING"}
CONSUMER_TYPES = {"LIGHT", "HOUSE", "TOWN", "FRIDGE", "PUMP", "CHARGER", "GATE", "MOTOR", "SIGNAL", "DOOR"}


def ports(ch):
    """Kierunki, w których znak może się łączyć."""
    if ch == CABLE_H:
        return {"L", "R"}
    if ch == CABLE_V:
        return {"U", "D"}
    if ch in (SOURCE, JUNCTION, SWITCH_ON, SWITCH_OFF, FUSE, GROUND) or ch in DIGITS:
        return {"U", "R", "D", "L"}
    return set()


class Puzzle:
    def __init__(self, grid, sources, fuses):
        """sources: dict (r,c) -> moc; fuses: dict (r,c) -> limit."""
        self.grid = list(grid)
        self.h = len(grid)
        self.w = len(grid[0]) if grid else 0
        self.sources = dict(sources)
        self.power = next(iter(self.sources.values())) if len(self.sources) == 1 else None
        self.fuses = dict(fuses)
        self.cells = [(r, c) for r in range(self.h) for c in range(self.w)]
        self.switches = [p for p in self.cells if self.ch(p) in (SWITCH_ON, SWITCH_OFF)]
        self.sw_index = {p: i for i, p in enumerate(self.switches)}
        self.consumers = [p for p in self.cells if self.ch(p) in DIGITS]
        self.source_cells = [p for p in self.cells if self.ch(p) == SOURCE]
        # litera urządzenia = kolejność czytania (wiersz, potem kolumna): A, B, C, D
        self.letters = {p: chr(65 + i) for i, p in enumerate(self.consumers)}

    def ch(self, p):
        return self.grid[p[0]][p[1]]

    # stan = maska bitowa przełączników ON (bit i = self.switches[i])
    def start_mask(self):
        m = 0
        for i, p in enumerate(self.switches):
            if self.ch(p) == SWITCH_ON:
                m |= 1 << i
        return m

    def all_closed_mask(self):
        return (1 << len(self.switches)) - 1

    def grid_for_mask(self, mask):
        rows = [list(r) for r in self.grid]
        for i, (r, c) in enumerate(self.switches):
            rows[r][c] = SWITCH_ON if mask >> i & 1 else SWITCH_OFF
        return ["".join(r) for r in rows]

    def conducts(self, p, mask):
        ch = self.ch(p)
        if ch in (SWITCH_ON, SWITCH_OFF):
            return bool(mask >> self.sw_index[p] & 1)
        return bool(ports(ch))

    def neighbours(self, p, mask):
        if not self.conducts(p, mask):
            return []
        out = []
        my = ports(self.ch(p))
        for d, dr, dc in DIRS:
            if d not in my:
                continue
            q = (p[0] + dr, p[1] + dc)
            if 0 <= q[0] < self.h and 0 <= q[1] < self.w and self.conducts(q, mask) and OPP[d] in ports(self.ch(q)):
                out.append(q)
        return out

    # ------------------------------------------------------------------
    def _flow(self, mask, strict):
        """Wspólny przepływ. strict=True: wynik SEND (pierwsza porażka kończy). strict=False: podgląd na żywo
        (liczby na urządzeniach; None = „–”, gdy liczby nie da się policzyć: za złym podziałem albo w pierścieniu)."""
        res = {"status": None, "cell": None, "got": {p: 0 for p in self.consumers},
               "lit": {p: False for p in self.consumers}, "flow": {}, "through": set(), "tokens": {}}
        if self.power is not None:
            res["tokens"]["source_power"] = self.power
        fail = None
        # 1) zwarcie: składowa ze źródłem, w której jest cykl
        seen_all, shorted = set(), set()
        for s in sorted(self.sources):
            if s in seen_all:
                continue
            comp, q, deg = {s}, deque([s]), 0
            while q:
                u = q.popleft()
                nb = self.neighbours(u, mask)
                deg += len(nb)
                for v in nb:
                    if v not in comp:
                        comp.add(v)
                        q.append(v)
            seen_all |= comp
            if deg // 2 > len(comp) - 1:
                if strict:
                    res["status"] = SHORT
                    return self._panel(res)
                shorted |= comp
                fail = fail or (SHORT, None)
        # 2) przepływ od każdego źródła (inne źródła są ślepe; urządzenie na końcu zbiera sumę)
        deliveries, leaf_order = {}, []
        for s in sorted(self.sources):
            if s in shorted:
                continue
            parent, order, children = {s: None}, [s], {}
            i = 0
            while i < len(order):
                u = order[i]
                i += 1
                if u != s and (u in self.sources or self.ch(u) == GROUND):
                    children[u] = []
                    continue
                children[u] = [v for v in self.neighbours(u, mask) if v != parent[u]]
                for v in children[u]:
                    parent[v] = u
                    order.append(v)
            live = {}
            for u in reversed(order):
                if u != s and u in self.sources:
                    live[u] = False
                else:
                    ch = self.ch(u)
                    live[u] = ch == GROUND or ch in DIGITS or any(live[v] for v in children[u])
            flow = {s: self.sources[s]}
            for u in order:
                if u not in flow:
                    continue
                p = flow[u]
                res["flow"][u] = p
                ch = self.ch(u)
                outs = [v for v in children[u] if live[v]]
                if ch == FUSE and p is not None and p > self.fuses[u]:
                    if strict:
                        res["status"], res["cell"] = FUSE_BLOWN, u
                        res["tokens"].update(fuse_max=self.fuses[u], fuse_power=p)
                        return self._panel(res)
                    fail = fail or (FUSE_BLOWN, u)
                if ch in DIGITS:
                    need = int(ch)
                    if outs:  # urządzenie na drodze: bierze swoje, resztę puszcza dalej
                        res["through"].add(u)
                        if p is None:
                            res["got"][u], rest = None, None
                        else:
                            res["got"][u] = p
                            res["lit"][u] = p >= need
                            rest = p - need if p >= need else 0
                        for v in outs:
                            flow[v] = rest
                    else:     # urządzenie na końcu: suma ze wszystkich linii, dokładnie albo przepalenie
                        if u not in deliveries:
                            deliveries[u] = []
                            leaf_order.append(u)
                        deliveries[u].append(p)
                    continue
                if ch == GROUND or not outs:
                    continue
                if p is None:
                    for v in outs:
                        flow[v] = None
                elif p % len(outs):
                    if strict:
                        res["status"], res["cell"] = TRIP, u
                        res["tokens"].update(box_power=p, box_lines=len(outs))
                        return self._panel(res)
                    fail = fail or (TRIP, u)
                    for v in outs:
                        flow[v] = None
                else:
                    for v in outs:
                        flow[v] = p // len(outs)
        # 3) urządzenia na końcu linii
        for u in leaf_order:
            vals = deliveries[u]
            if any(x is None for x in vals):
                res["got"][u] = None
                continue
            tot = sum(vals)
            res["got"][u] = tot
            if tot > int(self.ch(u)):
                if strict:
                    res["status"], res["cell"] = OVERLOAD, u
                    return self._panel(res)
                fail = fail or (OVERLOAD, u)
            res["lit"][u] = tot == int(self.ch(u))
        for u in self.consumers:
            if u in shorted:
                res["got"][u] = None
        if strict:
            res["status"] = WIN if all(res["lit"].values()) else DARK
        else:
            res["status"] = fail[0] if fail else (WIN if all(res["lit"].values()) else DARK)
        return self._panel(res)

    def _panel(self, res):
        """Wiersze panelu UI „A PUMP 2/2”: id = litera, x = moc dostarczona (got), y = wymagana moc (need)."""
        res["panel"] = [{"id": self.letters[p], "at": list(p), "x": res["got"][p], "y": int(self.ch(p)),
                         "lit": res["lit"][p]} for p in self.consumers]
        return res

    def simulate(self, mask):
        """Wynik po SEND. Klucze: status (WIN/DARK/OVERLOAD/FUSE/TRIP/SHORT), cell ([r,c] problemu albo None),
        got {(r,c): moc dostarczona}, lit {(r,c): bool}, flow {(r,c): moc na komórce}, through {urządzenia na drodze},
        tokens {source_power, box_power, box_lines, fuse_max, fuse_power}, panel [{id, at, x, y, lit}]."""
        return self._flow(mask, True)

    def preview(self, mask):
        """Podgląd na żywo (decyzja M2): te same klucze co simulate(), ale bez przerywania na porażce.
        UI pokazuje tylko panel[].x (None = „–”) i nie pokazuje status/cell przed SEND."""
        return self._flow(mask, False)

    def kinds(self):
        """consumer_type wg symulacji: 'mid', gdy urządzenie w jakimś stanie bez zwarcia puszcza prąd dalej."""
        mid = set()
        for m in range(1 << len(self.switches)):
            mid |= self.simulate(m)["through"]
        return {p: ("mid" if p in mid else "end") for p in self.consumers}

    def solve(self, start=None):
        """BFS po stanach przełączników (ruch = 1 tapnięcie). Zwraca (maska wygranej, lista tapnięć)."""
        n = len(self.switches)
        start = self.start_mask() if start is None else start
        prev = {start: None}
        q = deque([start])
        found = None
        while q:
            m = q.popleft()
            if self.simulate(m)["status"] == WIN:
                found = m
                break
            for i in range(n):
                m2 = m ^ (1 << i)
                if m2 not in prev:
                    prev[m2] = m
                    q.append(m2)
        if found is None:
            return None, None
        path = []
        m = found
        while prev[m] is not None:
            diff = m ^ prev[m]
            path.append(self.switches[diff.bit_length() - 1])
            m = prev[m]
        path.reverse()
        return found, path

    def census(self):
        """Pełny przegląd 2^k stanów: lista wygranych i rozkład wyników."""
        dist, wins = {}, []
        for m in range(1 << len(self.switches)):
            st = self.simulate(m)["status"]
            dist[st] = dist.get(st, 0) + 1
            if st == WIN:
                wins.append(m)
        return wins, dist

    def degrees_all_closed(self):
        m = self.all_closed_mask()
        return {p: len(self.neighbours(p, m)) for p in self.cells if ports(self.ch(p))}

    def has_ring(self):
        deg = self.degrees_all_closed()
        return sum(deg.values()) // 2 > len(deg) - len(self.components(self.all_closed_mask()))

    def elements(self):
        """Elementy obecne w wariancie (do legendy w UI i do reguły głębokości)."""
        deg = self.degrees_all_closed()
        el = set()
        for p, d in deg.items():
            ch = self.ch(p)
            if ch == SOURCE: el.add("source")
            elif ch in (CABLE_H, CABLE_V): el.add("cable")
            elif ch == JUNCTION: el.add("junction" if d >= 3 else "cable")   # „+” z 2 połączeniami = zakręt kabla
            elif ch in (SWITCH_ON, SWITCH_OFF): el.add("switch")
            elif ch in DIGITS: el.add("consumer")
            elif ch == GROUND: el.add("ground")
            elif ch == FUSE: el.add("fuse")
        if len(self.sources) > 1:
            el.add("multi_source")
        for mm in range(1 << len(self.switches)):
            if self.simulate(mm)["through"]:
                el.add("pass_through")
                break
        if self.has_ring():
            el.add("ring")
        return el

    def components(self, mask):
        """Lista składowych (zbiory komórek) przewodzącej sieci."""
        nodes = [p for p in self.cells if ports(self.ch(p)) and self.conducts(p, mask)]
        seen, comps = set(), []
        for s in nodes:
            if s in seen:
                continue
            comp = {s}
            seen.add(s)
            q = deque([s])
            while q:
                u = q.popleft()
                for v in self.neighbours(u, mask):
                    if v not in seen:
                        seen.add(v)
                        comp.add(v)
                        q.append(v)
            comps.append(comp)
        return comps


def switch_spacing_errors(pz):
    """Pary przełączników bliżej niż MIN_SWITCH_GAP (Czebyszew). Pusta lista = OK."""
    bad = []
    sw = pz.switches
    for i, a in enumerate(sw):
        for b in sw[i + 1:]:
            if max(abs(a[0] - b[0]), abs(a[1] - b[1])) < MIN_SWITCH_GAP:
                bad.append((list(a), list(b)))
    return bad


def scaled(pz, k):
    """Ponowne zestrojenie: moc źródeł, zapotrzebowania i limity razy k. None, gdy cyfra > 9 lub moc > 99."""
    rows = []
    for row in pz.grid:
        s = ""
        for ch in row:
            if ch in DIGITS:
                v = int(ch) * k
                if v > 9:
                    return None
                s += str(v)
            else:
                s += ch
        rows.append(s)
    if any(p * k > MAX_POWER for p in pz.sources.values()):
        return None
    return Puzzle(rows, {s: p * k for s, p in pz.sources.items()}, {p: v * k for p, v in pz.fuses.items()})


def static_tokens(pz):
    """Tokeny dostępne bez symulacji (podpowiedzi, legenda). source_power tylko przy jednym źródle."""
    t = {}
    if pz.power is not None:
        t["source_power"] = pz.power
    if len(pz.fuses) == 1:
        t["fuse_max"] = next(iter(pz.fuses.values()))
    return t


def stage_valid(cond, pz):
    """Czy stopień podpowiedzi jest prawdziwy dla tej instancji. Obsługiwane warunki:
    source_power_indivisible_by: [n, ...] – moc źródła nie dzieli się bez reszty przez żadne n;
    always: true – stopień ma token/liczbę, ale jest prawdziwy przy każdej skali (jawna deklaracja)."""
    cond = cond or {}
    for n in cond.get("source_power_indivisible_by", []):
        if pz.power is None or pz.power % n == 0:
            return False
    return True


def hint_valid(hint, pz):
    """Dla każdego stopnia z warunkiem valid_if: {text_id: bool}. Stopnie bez warunku są zawsze prawdziwe."""
    return {tid: stage_valid(hint.get("valid_if", {}).get(tid), pz) for tid in hint.get("text_ids", [])}


def difficulty_index(min_moves, switches, wins):
    """Indeks trudności = min. ruchów + log2(liczba stanów / liczba wygranych)."""
    return min_moves + math.log2((1 << switches) / wins)


def est_time_s(new_elements, min_moves, switches, wins):
    """Szacowany czas (mediana, s), heurystyka do kalibracji w playtestach QA:
    10 s (odczyt) + 5 s na nowy element legendy + 5 s na ruch + 4 s na bit trudności przestrzeni stanów.
    Zakłada podgląd liczb na żywo (decyzja M2)."""
    return round(10 + 5 * len(new_elements) + 5 * min_moves + 4 * math.log2((1 << switches) / wins))


def puzzle_from_variant(v):
    srcs = {tuple(s["at"]): s["power"] for s in v["sources"]}
    return Puzzle(v["grid"], srcs, {tuple(f["at"]): f["max"] for f in v["fuses"]})


def min_moves_from(mask, wins):
    return min(bin(mask ^ w).count("1") for w in wins)


# --------------------------------------------------------------------------
# Walidacja pliku
# --------------------------------------------------------------------------
REQ_TOP = {"schema_version": int, "puzzle": str, "variants": list}
REQ_VAR = {"id": str, "order": int, "depth": int, "difficulty": int, "name": str, "context_text_id": str,
           "idea": str, "grid": list, "sources": list, "fuses": list, "elements": list, "new_elements": list,
           "solution": dict, "expected": dict, "retune": dict, "name_text_id": str, "name_en_working": str,
           "hint": dict, "affix_start_hint": list, "consumers": list}
REQ_CONSUMER = {"id": str, "at": list, "need": int, "consumer_type": str}
# Nazwy / typy urządzeń przeniesione do M2 decyzją GD (wg UI i Menu, mechaniki v0.5.2): w M1 to BŁĄD „pole M2”.
M2_CONSUMER_FIELDS = {"name", "type_name", "type_text_id", "type", "consumer_names"}


def check_static(vid, pz, err):
    """Kontrole siatki niezależne od stanu. Zwraca False, gdy dalsza analiza nie ma sensu."""
    if len(pz.grid) > MAX_H or pz.w > MAX_W:
        err(vid, f"siatka {pz.w}x{pz.h} większa niż {MAX_W}x{MAX_H} (telefon)")
    if set(pz.source_cells) != set(pz.sources):
        err(vid, f"komórki * {sorted(pz.source_cells)} nie zgadzają się z listą sources {sorted(pz.sources)}")
        return False
    if not pz.sources:
        err(vid, "brak źródła *")
        return False
    for s, p in pz.sources.items():
        if not isinstance(p, int) or not 1 <= p <= MAX_POWER:
            err(vid, f"moc źródła {list(s)} poza zakresem 1..{MAX_POWER}")
    fuse_cells = {p for p in pz.cells if pz.ch(p) == FUSE}
    if fuse_cells != set(pz.fuses):
        err(vid, f"komórki ! {sorted(fuse_cells)} nie zgadzają się z listą fuses {sorted(pz.fuses)}")
        return False
    if not pz.consumers:
        err(vid, "brak urządzeń")
    if len(pz.consumers) > MAX_CONSUMERS:
        err(vid, f"za dużo urządzeń ({len(pz.consumers)} > {MAX_CONSUMERS}, limit M1)")
    if not pz.switches:
        err(vid, "brak przełączników")
    if len(pz.switches) > MAX_SWITCHES:
        err(vid, f"za dużo przełączników ({len(pz.switches)} > {MAX_SWITCHES})")
    for a, b in switch_spacing_errors(pz):
        err(vid, f"przełączniki {a} i {b} za blisko (Czebyszew < {MIN_SWITCH_GAP}; pole trafienia 48x48 px)")
    multi = len(pz.sources) > 1
    deg = pz.degrees_all_closed()
    for p, d in deg.items():
        ch = pz.ch(p)
        ok = {SOURCE: (1, 1), CABLE_H: (2, 2), CABLE_V: (2, 2), SWITCH_ON: (2, 2), SWITCH_OFF: (2, 2),
              FUSE: (2, 2), GROUND: (1, 1), JUNCTION: (2, 4)}.get(ch, (1, 4) if multi else (1, 2))
        if not ok[0] <= d <= ok[1]:
            err(vid, f"komórka {list(p)} '{ch}' ma {d} połączeń (dozwolone {ok[0]}..{ok[1]})")
    comps = pz.components(pz.all_closed_mask())
    for comp in comps:
        if not comp & set(pz.sources):
            err(vid, f"elementy {sorted(comp)[:3]}… nie są połączone z żadnym źródłem (przy wszystkich ON)")
    if multi:
        # źródła nie mogą się stykać bez urządzenia/uziemienia pomiędzy
        sinks = {p for p in pz.cells if pz.ch(p) in DIGITS or pz.ch(p) == GROUND}
        m = pz.all_closed_mask()
        for s in pz.sources:
            seen, q = {s}, deque([s])
            while q:
                u = q.popleft()
                for v in pz.neighbours(u, m):
                    if v in sinks or v in seen:
                        continue
                    if v in pz.sources:
                        err(vid, f"źródła {list(s)} i {list(v)} połączone bez urządzenia pomiędzy")
                    seen.add(v)
                    q.append(v)
    return True


def validate(data, verbose=True):
    errors, warnings, rows_out = [], [], []

    def err(vid, msg):
        errors.append(f"{vid}: {msg}")

    def warn(vid, msg):
        warnings.append(f"{vid}: {msg}")

    for k, t in REQ_TOP.items():
        if not isinstance(data.get(k), t):
            err("plik", f"brak lub zły typ pola '{k}'")
    if errors:
        return errors, warnings, rows_out
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(data.get("version", ""))):
        err("plik", "brak pola version (np. 0.5.0) – wersja danych dla QA")
    if data["schema_version"] != 2:
        err("plik", "obsługiwana jest tylko schema_version 2 (sources jako lista, hint.text_ids)")

    rti = data.get("result_text_ids")
    need_res = {WIN, WIN_RETUNE, DARK, OVERLOAD, TRIP, FUSE_BLOWN, SHORT}
    if not isinstance(rti, dict) or set(rti) != need_res:
        err("plik", f"result_text_ids musi mieć dokładnie klucze {sorted(need_res)}")
    elif data.get("fail_text_id") != rti[OVERLOAD]:
        err("plik", "fail_text_id musi być równe result_text_ids.OVERLOAD (FAIL tylko dla OVERLOAD)")
    elif len(set(rti.values())) != len(rti):
        err("plik", "każdy wynik musi mieć osobne ID tekstu")
    de = {int(k): set(v) for k, v in (data.get("depth_elements") or {}).items()}
    if de != DEPTH_ELEMENTS:
        err("plik", "depth_elements w JSON nie zgadza się z decyzją Mechaników (DEPTH_ELEMENTS w validate.py)")
    tt = {int(k): tuple(v) for k, v in (data.get("time_target_s") or {}).items()}
    if tt != TIME_TARGET_S:
        err("plik", "time_target_s w JSON nie zgadza się z decyzją Mechaników (TIME_TARGET_S)")
    hr = data.get("help") or {}
    for k, val in HELP_RULES.items():
        if hr.get(k) != val:
            err("plik", f"help.{k} = {hr.get(k)!r}, decyzja Mechaników: {val!r}")

    ids, orders = set(), []
    seen_elements = set()
    prev_by_depth = {}
    prev_depth = 0
    for v in sorted(data["variants"], key=lambda x: x.get("order", 0)):
        vid = v.get("id", "?")
        bad = False
        for k, t in REQ_VAR.items():
            if not isinstance(v.get(k), t) or (t is int and isinstance(v.get(k), bool)):
                err(vid, f"brak lub zły typ pola '{k}'")
                bad = True
        if bad:
            continue
        if vid in ids:
            err(vid, "powtórzone id")
        ids.add(vid)
        orders.append(v["order"])
        depth = v["depth"]
        if depth not in DEPTH_ELEMENTS:
            err(vid, f"nieznana głębokość {depth}")
            continue
        if depth < prev_depth:
            err(vid, "order musi iść głębokościami rosnąco (Level Design)")
        prev_depth = depth

        grid = v["grid"]
        if not grid or not all(isinstance(r, str) for r in grid) or len({len(r) for r in grid}) != 1:
            err(vid, "grid musi być niepustą listą napisów równej długości")
            continue
        badch = set("".join(grid)) - ALLOWED
        if badch:
            err(vid, f"niedozwolone znaki: {sorted(badch)}")
            continue
        try:
            pz = puzzle_from_variant(v)
        except (KeyError, TypeError):
            err(vid, "zły wpis w sources/fuses")
            continue
        if not check_static(vid, pz, err):
            continue

        # --- elementy / legenda / głębokość ---
        el = pz.elements()
        if set(v["elements"]) != el:
            err(vid, f"elements {sorted(v['elements'])} != wykryte {sorted(el)}")
        if el - ELEMENT_IDS:
            err(vid, f"nieznane elementy {sorted(el - ELEMENT_IDS)}")
        forbidden = el - DEPTH_ELEMENTS[depth]
        if forbidden:
            err(vid, f"głęb. {depth}: elementy niedozwolone na tej głębokości: {sorted(forbidden)}")
        if "multi_source" in el and el & {"junction", "fuse", "pass_through", "ring"}:
            err(vid, "kilka źródeł łączy się tylko z prostymi liniami (bez węzła, limitu, urządzenia na drodze, pierścienia)")
        new_el = el - seen_elements
        if set(v["new_elements"]) != new_el:
            err(vid, f"new_elements {sorted(v['new_elements'])} != nowe względem poprzednich {sorted(new_el)}")
        seen_elements |= el

        # --- urządzenia (panel UI: „A PUMP 2/2”) ---
        kinds = pz.kinds()
        seen_at = set()
        for c in v["consumers"]:
            cid = c.get("id", "?") if isinstance(c, dict) else "?"
            if not isinstance(c, dict) or any(not isinstance(c.get(k), t) or isinstance(c.get(k), bool)
                                              for k, t in REQ_CONSUMER.items()):
                err(vid, f"urządzenie {cid}: wymagane pola {sorted(REQ_CONSUMER)} z właściwymi typami")
                continue
            at = tuple(c["at"])
            if at not in pz.letters:
                err(vid, f"urządzenie {cid}: {c['at']} to nie jest komórka urządzenia (cyfra)")
                continue
            seen_at.add(at)
            if c["id"] != pz.letters[at]:
                err(vid, f"urządzenie {c['at']}: id {c['id']} != {pz.letters[at]} (litery w kolejności czytania)")
            if c["need"] != int(pz.ch(at)):
                err(vid, f"urządzenie {cid}: need {c['need']} != cyfra w siatce {pz.ch(at)}")
            if c["consumer_type"] not in CONSUMER_KINDS:
                err(vid, f"urządzenie {cid}: consumer_type musi być 'end' albo 'mid', jest {c['consumer_type']!r}")
            elif c["consumer_type"] != kinds[at]:
                err(vid, f"urządzenie {cid}: consumer_type={c['consumer_type']}, a wg symulacji {kinds[at]}")
            if c["consumer_type"] == "mid" and depth < MID_MIN_DEPTH:
                err(vid, f"urządzenie {cid}: 'mid' dozwolone dopiero od głęb. {MID_MIN_DEPTH}")
            m2 = sorted(set(c) & M2_CONSUMER_FIELDS)
            if m2:
                err(vid, f"urządzenie {cid}: pole M2 {m2} (nazwy/typy urządzeń przeniesione do M2 decyzją GD)")
            extra = sorted(set(c) - set(REQ_CONSUMER) - M2_CONSUMER_FIELDS)
            if extra:
                err(vid, f"urządzenie {cid}: nieznane pola {extra}")
        if seen_at != set(pz.consumers) or len(v["consumers"]) != len(pz.consumers):
            err(vid, f"lista consumers musi mieć dokładnie jeden wpis na każdą cyfrę w siatce ({len(pz.consumers)})")

        # --- stan startowy ---
        start = pz.start_mask()
        if pz.simulate(start)["status"] == WIN:
            err(vid, "stan startowy już jest wygraną")

        # --- odtworzenie zapisanego rozwiązania ---
        sol = v["solution"]
        mask = start
        taps_ok = True
        for t in sol.get("taps", []):
            p = tuple(t)
            if p not in pz.sw_index:
                err(vid, f"tapnięcie {t} nie trafia w przełącznik")
                taps_ok = False
                break
            mask ^= 1 << pz.sw_index[p]
        if taps_ok:
            replay = pz.simulate(mask)
            if pz.grid_for_mask(mask) != sol.get("final_grid"):
                err(vid, "final_grid nie zgadza się z wynikiem tapnięć")
            if replay["status"] != WIN:
                err(vid, f"zapisane rozwiązanie nie wygrywa (wynik: {replay['status']} {replay['cell']})")

        # --- solver ---
        found, path = pz.solve()
        if found is None:
            err(vid, "solver: brak rozwiązania")
            continue
        wins, dist = pz.census()
        mm = len(path)
        for m in range(1 << len(pz.switches)):
            r = pz.simulate(m)
            missing = RESULT_TOKENS[r["status"]] - set(r["tokens"])
            if missing:
                err(vid, f"wynik {r['status']} bez tokenów {sorted(missing)}")
                break
            pv = pz.preview(m)["got"]
            if r["status"] in (WIN, DARK) and pv != r["got"]:
                err(vid, f"podgląd na żywo różni się od wyniku SEND w stanie {m}")
                break

        # --- M6: M1_AFFIX_11 (darmowa podpowiedź na starcie) ---
        ah = tuple(v["affix_start_hint"])
        if ah not in pz.sw_index:
            err(vid, f"affix_start_hint {list(ah)} nie jest przełącznikiem")
        else:
            if [list(ah)] and list(ah) not in [list(t) for t in sol.get("taps", [])]:
                err(vid, f"affix_start_hint {list(ah)} nie należy do rozwiązania (solution.taps)")
            bit = 1 << pz.sw_index[ah]
            near = [w for w in wins if bin(start ^ w).count("1") == mm]
            if not all((start ^ w) & bit for w in near):
                warn(vid, f"affix_start_hint {list(ah)} nie jest potrzebny w każdym najkrótszym rozwiązaniu")

        # --- podpowiedzi (3 stopnie, §11.5) ---
        hint = v["hint"]
        tids = hint.get("text_ids")
        want = [f"{vid}_TIP_{n}" for n in (1, 2, 3)]
        if tids != want:
            err(vid, f"hint.text_ids musi być {want}, jest {tids}")
        else:
            for tid, toks in (hint.get("tokens") or {}).items():
                if tid not in tids:
                    err(vid, f"hint.tokens: {tid} spoza hint.text_ids")
                bad_tok = set(toks) - set(static_tokens(pz))
                if bad_tok:
                    err(vid, f"{tid} używa tokenów, których wariant nie zna: {sorted(bad_tok)}")
            for tid in (hint.get("valid_if") or {}):
                if tid not in tids:
                    err(vid, f"hint.valid_if: {tid} spoza hint.text_ids")
            for tid, ok in hint_valid(hint, pz).items():
                if not ok:
                    err(vid, f"{tid} nieprawdziwa już w wariancie bazowym")
        if hint.get("rewrite_needed"):
            warn(vid, f"podpowiedzi do przepisania przez Dialogi i Lore: {hint.get('rewrite_note', '')}")

        # --- metryki, czas, krzywa ---
        exp = v["expected"]
        di = difficulty_index(mm, len(pz.switches), len(wins))
        et = est_time_s(new_el, mm, len(pz.switches), len(wins))
        p80 = et + P80_MARGIN_S
        for key, val in (("min_moves", mm), ("switches", len(pz.switches)), ("winning_states", len(wins)),
                         ("est_time_s", et), ("est_time_p80_s", p80)):
            if exp.get(key) != val:
                err(vid, f"expected.{key}={exp.get(key)}, wyliczone {val}")
        if taps_ok and len(sol.get("taps", [])) > mm:
            warn(vid, f"zapisane rozwiązanie ma {len(sol['taps'])} ruchów, minimum to {mm}")
        lo, hi = TIME_TARGET_S[depth]
        if et > hi:
            err(vid, f"szacowany czas {et} s > cel {lo}–{hi} s dla głęb. {depth} (uprościć)")
        elif et < lo:
            warn(vid, f"szacowany czas {et} s < dolna granica celu {lo}–{hi} s (łatwiej niż cel; budżet sesji OK)")
        if p80 > TIME_P80_MAX_S[depth]:
            err(vid, f"szacowane p80 {p80} s > limit {TIME_P80_MAX_S[depth]} s dla głęb. {depth}")
        if depth == 3 and et > TIME_LIMIT_D3_MEDIAN_S:
            err(vid, f"szacowany czas {et} s > limit głęb. 3 (mediana ≤ {TIME_LIMIT_D3_MEDIAN_S} s)")
        if depth in prev_by_depth:
            pm, pd = prev_by_depth[depth]
            if mm < pm:
                err(vid, f"krzywa głęb. {depth}: min. ruchów {mm} < poprzedni wariant {pm}")
            if di <= pd:
                err(vid, f"krzywa głęb. {depth}: indeks {di:.2f} nie rośnie (poprzedni {pd:.2f})")
            for name, m in (("wszystkie ON", pz.all_closed_mask()), ("wszystkie OFF", 0)):
                if pz.simulate(m)["status"] == WIN:
                    warn(vid, f"trywialny stan '{name}' wygrywa")
        prev_by_depth[depth] = (mm, di)

        # --- ponowne zestrojenie (M7) ---
        rt = v["retune"]
        need = rt.get("min_moves_at_least", 0)
        if need < RETUNE_MIN_MOVES_RULE[depth]:
            err(vid, f"retune.min_moves_at_least={need} < reguła głęb. {depth} ({RETUNE_MIN_MOVES_RULE[depth]})")
        scale_info = []
        for k in rt.get("scales", []):
            spz = scaled(pz, k)
            if spz is None:
                err(vid, f"retune: skala {k} daje cyfrę > 9 albo moc > {MAX_POWER}")
                continue
            if switch_spacing_errors(spz):
                err(vid, f"retune: skala {k} łamie odstęp przełączników")
            if spz.simulate(mask)["status"] != WIN:
                err(vid, f"retune: rozwiązanie nie działa po skali {k}")
            sw, _ = spz.census()
            off = [t for t, ok in hint_valid(hint, spz).items() if not ok]
            scale_info.append(f"x{k}:{len(sw)}" + (f"(bez {','.join(t[-5:] for t in off)})" if off else ""))
            if off and not rt.get("hint_off_when_invalid"):
                err(vid, f"retune: {off} nieprawdziwe przy skali {k}, a hint_off_when_invalid nie jest ustawione")
            good = sum(1 for m in range(1 << len(spz.switches)) if min_moves_from(m, sw) >= need)
            if rt.get("random_start") and good == 0:
                err(vid, f"retune: skala {k} nie ma stanów startowych z min. ruchów >= {need}")
        good_starts = sum(1 for m in range(1 << len(pz.switches)) if min_moves_from(m, wins) >= need)

        fails = ", ".join(f"{k}:{dist[k]}" for k in (OVERLOAD, FUSE_BLOWN, TRIP, SHORT, DARK) if k in dist)
        rows_out.append((v["order"], depth, vid, v["name_en_working"], f"{pz.w}x{pz.h}", len(pz.switches), mm,
                         len(wins), f"{di:.2f}", f"{et}/{p80}", ",".join(sorted(new_el)) or "-", fails,
                         " ".join(scale_info), good_starts))

    if sorted(orders) != list(range(1, len(orders) + 1)):
        err("plik", f"pola order muszą być kolejne od 1, są: {sorted(orders)}")
    return errors, warnings, rows_out


# --------------------------------------------------------------------------
# Kontrola pliku tekstów (Dialogi i Lore): ID, tokeny, prawdziwość stopni podpowiedzi
# --------------------------------------------------------------------------
TOKEN_RE = re.compile(r"\{([a-z_]+)\}")
# M1 nie ma typów urządzeń (przeniesione do M2 decyzją GD): słowa typów w TIP-ach dają UWAGĘ
TYPE_WORD_RE = re.compile(r"\b(lights?|lamps?|houses?|homes?|towns?|fridges?|pumps?|chargers?|gates?|motors?|signals?|doors?)\b",
                          re.IGNORECASE)


def read_texts(path):
    """ID -> (tekst z 3. kolumny, tokeny w całym wierszu)."""
    rows = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            m = re.match(r"\|\s*(M1_TERM_[A-Z0-9_]+)\s*\|", line)
            if m and m.group(1) not in rows:
                parts = line.split("|")
                text = parts[3].strip() if len(parts) > 3 else ""
                rows[m.group(1)] = (text, set(TOKEN_RE.findall(line)))
    return rows


def check_texts(data, path):
    """Zwraca (błędy, uwagi). Nieznane ID to BŁĄD; wyjątek: ID wpisane w pending_text_ids (czekają na teksty)."""
    errs, notes = [], []
    if not os.path.exists(path):
        return [f"brak pliku tekstów {path} – nie da się sprawdzić ID i tokenów"], notes
    rows = read_texts(path)
    pending = data.get("pending_text_ids") or {}

    def need(tid, where):
        if tid in rows:
            return True
        if tid in pending:
            notes.append(f"{where}: {tid} jeszcze nie ma w pliku tekstów (pending: {pending[tid]})")
        else:
            errs.append(f"{where}: nieznane ID tekstu {tid}")
        return False

    for status, tid in (data.get("result_text_ids") or {}).items():
        if need(tid, f"wynik {status}"):
            extra = rows[tid][1] - RESULT_TOKENS.get(status, set())
            if extra:
                errs.append(f"tekst {tid} używa tokenów {sorted(extra)}, których wynik {status} nie podaje")
    for key in ("header_text_id", "retune_header_text_id"):
        if data.get(key):
            need(data[key], key)
    used_el = set()
    for v in data.get("variants", []):
        vid = v.get("id", "?")
        used_el |= set(v.get("elements", []))
        for key in ("name_text_id", "context_text_id"):
            if v.get(key):
                need(v[key], vid)
        h = v.get("hint") or {}
        if "text_id" in h:
            errs.append(f"{vid}: stare pole hint.text_id – użyj hint.text_ids (3 stopnie)")
        try:
            pz = puzzle_from_variant(v)
            scales = [k for k in (v.get("retune") or {}).get("scales", [1])]
            insts = [(k, scaled(pz, k)) for k in sorted(set([1] + scales))]
        except Exception:
            insts = []
        for tid in h.get("text_ids", []):
            if not need(tid, vid):
                continue
            text = rows[tid][0]
            toks = set(TOKEN_RE.findall(text))
            declared = set((h.get("tokens") or {}).get(tid, []))
            if toks - declared:
                errs.append(f"{vid}: {tid} ma tokeny {sorted(toks - declared)}, których nie ma w hint.tokens")
            if declared - toks:
                notes.append(f"{vid}: hint.tokens deklaruje {sorted(declared - toks)} dla {tid}, a tekst ich nie używa")
            tw = sorted({w.upper() for w in TYPE_WORD_RE.findall(text)})
            if tw:
                notes.append(f"{vid}: {tid} wspomina typ urządzenia {tw} – w M1 nie ma typów (tylko DEVICE, panel 'A 3/4')")
            if re.search(r"\d", TOKEN_RE.sub("", text)):
                errs.append(f"{vid}: {tid} ma liczbę wpisaną na sztywno – po ponownym zestrojeniu może być fałszywa")
            if toks or re.search(r"\d", text):
                cond = (h.get("valid_if") or {}).get(tid)
                if cond is None:
                    errs.append(f"{vid}: {tid} zawiera liczbę/token, a nie ma warunku hint.valid_if (choćby always)")
                    continue
                for k, spz in insts:
                    if spz is None:
                        continue
                    if not stage_valid(cond, spz) and not v.get("retune", {}).get("hint_off_when_invalid"):
                        errs.append(f"{vid}: {tid} nieprawdziwa przy skali {k}")
    for el in sorted(used_el):
        need(LEGEND_TEXT_IDS[el], f"legenda '{el}'") if el in LEGEND_TEXT_IDS else None
    return errs, notes


# --------------------------------------------------------------------------
# M7: generator instancji ponownego zestrojenia
# --------------------------------------------------------------------------
_CENSUS_CACHE = {}


def generate_instance(v, rng, data=None):
    """Losuje skalę i stan startowy; zwraca (instancja, lista_problemów). Instancja jest sprawdzona solverem."""
    pz = puzzle_from_variant(v)
    rt = v["retune"]
    need = max(rt.get("min_moves_at_least", 0), RETUNE_MIN_MOVES_RULE[v["depth"]])
    k = rng.choice(rt["scales"])
    spz = scaled(pz, k)
    problems = []
    if spz is None:
        return None, [f"skala {k} niedozwolona"]
    key = (v["id"], k)
    if key not in _CENSUS_CACHE:
        _CENSUS_CACHE[key] = spz.census()[0]
    wins = _CENSUS_CACHE[key]
    n = len(spz.switches)
    start = None
    for _ in range(200):  # losowanie z odrzucaniem
        m = rng.randrange(1 << n)
        if min_moves_from(m, wins) >= need:
            start = m
            break
    if start is None:
        cand = [m for m in range(1 << n) if min_moves_from(m, wins) >= need]
        if not cand:
            return None, [f"brak startów z min. ruchów >= {need}"]
        start = rng.choice(cand)
    grid = spz.grid_for_mask(start)
    inst_pz = Puzzle(grid, spz.sources, spz.fuses)
    # niezależne potwierdzenie solverem
    found, path = inst_pz.solve()
    if found is None:
        problems.append("solver: brak rozwiązania")
        return None, problems
    if inst_pz.simulate(inst_pz.start_mask())["status"] == WIN:
        problems.append("start już wygrywa")
    if len(path) < need:
        problems.append(f"rozwiązywalny w {len(path)} ruchach (< {need})")
    if switch_spacing_errors(inst_pz):
        problems.append("odstęp przełączników")
    hv = hint_valid(v["hint"], inst_pz)
    if not all(hv.values()) and not rt.get("hint_off_when_invalid"):
        problems.append("podpowiedź nieprawdziwa, a nie wolno jej wyłączyć")
    # AFFIX_11: przełącznik wspólny dla wszystkich najkrótszych rozwiązań (jeśli jest), inaczej z pierwszego
    near = [w for w in wins if bin(start ^ w).count("1") == len(path)]
    common = start ^ near[0]
    for w in near[1:]:
        common &= start ^ w
    pick = common if common else start ^ near[0]
    affix = spz.switches[(pick & -pick).bit_length() - 1]
    if not (start ^ found) >> inst_pz.sw_index[affix] & 1 and common:
        problems.append("affix poza rozwiązaniem solvera")
    inst = {"base_id": v["id"], "scale": k, "grid": grid,
            "sources": [{"at": list(s), "power": p} for s, p in sorted(spz.sources.items())],
            "fuses": [{"at": list(f), "max": m} for f, m in sorted(spz.fuses.items())],
            "min_moves": len(path), "solution_taps": [list(t) for t in path],
            "affix_start_hint": list(affix),
            "hint_text_ids_on": [t for t, ok in hv.items() if ok],
            "win_text_id": (data or {}).get("result_text_ids", {}).get(WIN_RETUNE, "M1_TERM_OK_RETUNE"),
            "header_text_id": (data or {}).get("retune_header_text_id", "M1_TERM_RETUNE")}
    return inst, problems


def gen_test(data, n, seed):
    rng = random.Random(seed)
    total_bad = 0
    print(f"Test generatora: {n} losowań na wariant, seed {seed}")
    for v in sorted(data["variants"], key=lambda x: x["order"]):
        bad, moves, scales, hint_off = 0, {}, {}, 0
        for _ in range(n):
            inst, probs = generate_instance(v, rng, data)
            if inst is None or probs:
                bad += 1
                continue
            moves[inst["min_moves"]] = moves.get(inst["min_moves"], 0) + 1
            scales[inst["scale"]] = scales.get(inst["scale"], 0) + 1
            hint_off += len(inst["hint_text_ids_on"]) < 3
        total_bad += bad
        mv = " ".join(f"{k}:{moves[k]}" for k in sorted(moves))
        sc = " ".join(f"x{k}:{scales[k]}" for k in sorted(scales))
        print(f"  {v['id']} (głęb. {v['depth']}, min. ruchów >= "
              f"{max(v['retune']['min_moves_at_least'], RETUNE_MIN_MOVES_RULE[v['depth']])}): "
              f"OK {n - bad}/{n}; ruchy {mv}; skale {sc}; bez części TIP: {hint_off}")
    print("WYNIK generatora:", "OK" if total_bad == 0 else f"BŁĘDY ({total_bad})")
    return total_bad == 0


# --------------------------------------------------------------------------
# Rysowanie (podgląd w konsoli)
# --------------------------------------------------------------------------
def render(pz, mask, types=None):
    r = pz.simulate(mask)
    pv = pz.preview(mask)["panel"]
    g = pz.grid_for_mask(mask)
    lines = ["   " + "".join(str(c) for c in range(pz.w))]
    for i, row in enumerate(g):
        lines.append(f"{i:2} {row}")
    lines.append("   panel na żywo (przed SEND): " + "  ".join(
        f"{row['id']} {'–' if row['x'] is None else row['x']}/{row['y']}" for row in pv))
    lines.append(f"   po SEND: {r['status']}" + (f" w komórce {list(r['cell'])}" if r["cell"] else "") +
                 (f"  tokeny: {r['tokens']}" if r["tokens"] else ""))
    return "\n".join(lines)


def show(data, vid):
    for v in data["variants"]:
        if v["id"] == vid:
            pz = puzzle_from_variant(v)
            types = None
            print(f"{vid} – {v['name_en_working']} (głęb. {v['depth']}; źródła {[(list(p), m) for p, m in pz.sources.items()]}, "
                  f"limity {[(list(p), m) for p, m in pz.fuses.items()]}; AFFIX_11: {v['affix_start_hint']})")
            print("\nSTART:")
            print(render(pz, pz.start_mask(), types))
            mask = pz.start_mask()
            for t in v["solution"]["taps"]:
                mask ^= 1 << pz.sw_index[tuple(t)]
            print(f"\nPO TAPNIĘCIACH {v['solution']['taps']}:")
            print(render(pz, mask, types))
            return 0
    print(f"nie ma wariantu {vid}")
    return 1


# --------------------------------------------------------------------------
# Testy zasad
# --------------------------------------------------------------------------
def P(grid, power, fuses=None):
    """Skrót do testów: jedno źródło o mocy power albo dict źródeł."""
    if isinstance(power, dict):
        return Puzzle(grid, power, fuses or {})
    src = [(r, c) for r, row in enumerate(grid) for c, ch in enumerate(row) if ch == SOURCE]
    return Puzzle(grid, {src[0]: power}, fuses or {})


def selftest():
    cases = [
        ("równy podział", P(["*-+-2", "..|..", "..2.."], 4), WIN),
        ("przepalenie na końcu", P(["*-+-2", "..|..", "../..", "..|..", "..2.."], 4), OVERLOAD),
        ("otwarta gałąź się nie liczy", P(["*-+-4", "..|..", "../..", "..|..", "..2.."], 4), DARK),
        ("nierówny podział", P(["*-+-2", "..|..", "..=..", "..|..", "..2.."], 5), TRIP),
        ("uziemienie bierze udział", P(["*-+-2", "..|..", "..=..", "..|..", ".._.."], 4), WIN),
        ("bezpiecznik", P(["*-!-2"], 3, {(0, 2): 2}), FUSE_BLOWN),
        ("urządzenie na drodze odejmuje", P(["*-3-2"], 5), WIN),
        ("na drodze przy braku mocy", P(["*-3-2"], 2), DARK),
        ("pierścień = zwarcie", P(["*-+-+", "..|.|", "..+=+", "....2"], 4), SHORT),
        ("dwa źródła sumują się w urządzeniu", P(["*=5=*"], {(0, 0): 3, (0, 4): 2}), WIN),
        ("suma za duża = przepalenie", P(["*=4=*"], {(0, 0): 3, (0, 4): 2}), OVERLOAD),
        ("źródło za OFF nic nie daje", P(["*=5/*"], {(0, 0): 3, (0, 4): 2}), DARK),
    ]
    ok = True
    t = P(["*-+-2", "..|..", "..=..", "..|..", "..2.."], 5)
    tk = t.simulate(t.start_mask())["tokens"]
    tk_ok = tk.get("box_power") == 5 and tk.get("box_lines") == 2 and tk.get("source_power") == 5
    f = P(["*-!-2"], 3, {(0, 2): 2})
    tk_ok &= f.simulate(f.start_mask())["tokens"].get("fuse_max") == 2
    tk_ok &= "source_power" not in P(["*=5=*"], {(0, 0): 3, (0, 4): 2}).simulate(0)["tokens"]
    ok &= tk_ok
    print(f"  [{'OK ' if tk_ok else 'BŁĄD'}] tokeny: TRIP → box_power/box_lines, FUSE → fuse_max, source_power tylko przy 1 źródle")
    near = P(["*-+/2", "../..", "..|..", "..2.."], 4)
    far = P(["*-+-/-2", "..|....", "../....", "..|....", "..2...."], 4)
    sp_ok = bool(switch_spacing_errors(near)) and not switch_spacing_errors(far)
    ok &= sp_ok
    print(f"  [{'OK ' if sp_ok else 'BŁĄD'}] odstęp przełączników: sąsiedzi po skosie odrzuceni, odstęp 2 przyjęty")
    pv = P(["*-+-2", "..|..", "..=..", "..|..", "..2.."], 5)
    pv_got = pv.preview(pv.start_mask())["got"]
    pv2 = P(["*-+-2", "..|..", "../..", "..|..", "..2.."], 4)
    pv_ok = all(x is None for x in pv_got.values()) and pv2.preview(pv2.start_mask())["panel"][0] == \
        {"id": "A", "at": [0, 4], "x": 4, "y": 2, "lit": False}
    ok &= pv_ok
    print(f"  [{'OK ' if pv_ok else 'BŁĄD'}] podgląd na żywo: za złym podziałem „–”, przepalenie widać jako 4/2 (bez stanu)")
    el_ok = "junction" not in P(["*-+", "..|", "..2"], 2).elements() and \
        "multi_source" in P(["*=5=*"], {(0, 0): 3, (0, 4): 2}).elements()
    ok &= el_ok
    print(f"  [{'OK ' if el_ok else 'BŁĄD'}] elementy: „+” z 2 połączeniami to zakręt kabla, nie węzeł; kilka źródeł = multi_source")
    kd = P(["*-3-2"], 5).kinds()
    kd_ok = kd == {(0, 2): "mid", (0, 4): "end"} and set(P(["*=5=*"], {(0, 0): 3, (0, 4): 2}).kinds().values()) == {"end"}
    ok &= kd_ok
    print(f"  [{'OK ' if kd_ok else 'BŁĄD'}] consumer_type z symulacji: urządzenie na drodze = mid, na końcu i przy sumie = end")
    for name, pz, want in cases:
        got = pz.simulate(pz.start_mask())["status"]
        flag = "OK " if got == want else "BŁĄD"
        ok &= got == want
        print(f"  [{flag}] {name}: oczekiwano {want}, jest {got}")
    return ok


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description="Walidator Power Lines — Line 1")
    ap.add_argument("json", nargs="?", default=os.path.join(here, "power-lines-line1.json"))
    ap.add_argument("--show", metavar="ID", help="narysuj start, podgląd i rozwiązanie wariantu")
    ap.add_argument("--selftest", action="store_true", help="testy zasad na małych siatkach")
    ap.add_argument("--generate", metavar="ID|all", help="wygeneruj instancje ponownego zestrojenia (JSON na stdout)")
    ap.add_argument("--count", type=int, default=3)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--gen-test", type=int, metavar="N", help="N losowań na wariant, każda instancja sprawdzona")
    ap.add_argument("--texts", default=os.path.join(here, "..", "..", "fabula", "teksty-m1-en.md"),
                    help="plik tekstów do kontroli ID i tokenów (domyślnie fabula/teksty-m1-en.md)")
    a = ap.parse_args()
    if a.selftest:
        print("Selftest zasad:")
        return 0 if selftest() else 1
    with open(a.json, encoding="utf-8") as fh:
        data = json.load(fh)
    if a.show:
        return show(data, a.show)
    if a.generate:
        rng = random.Random(a.seed)
        out = []
        for v in data["variants"]:
            if a.generate in ("all", v["id"]):
                for _ in range(a.count):
                    inst, probs = generate_instance(v, rng, data)
                    if inst is None or probs:
                        print(f"BŁĄD {v['id']}: {probs}", file=sys.stderr)
                        return 1
                    out.append(inst)
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0
    if a.gen_test:
        return 0 if gen_test(data, a.gen_test, a.seed) else 1
    print("Selftest zasad:")
    st_ok = selftest()
    errors, warnings, rows = validate(data)
    print(f"\nPlik: {os.path.basename(a.json)}, wersja danych {data.get('version')}, wariantów: {len(data.get('variants', []))}\n")
    hdr = ("#", "gł.", "id", "nazwa", "siatka", "przeł.", "min ruchów", "wygrane", "indeks", "czas s med/p80",
           "nowe elementy", "rozkład wyników (stany)", "retune: wygrane", "starty")
    widths = [max(len(str(x)) for x in col) for col in zip(hdr, *rows)] if rows else [len(h) for h in hdr]
    print("  ".join(str(h).ljust(w) for h, w in zip(hdr, widths)))
    for r in rows:
        print("  ".join(str(x).ljust(w) for x, w in zip(r, widths)))
    t_err, t_notes = check_texts(data, a.texts)
    errors += ["teksty: " + e for e in t_err]
    warnings += ["teksty: " + n for n in t_notes]
    for w in warnings:
        print("UWAGA:", w)
    for e in errors:
        print("BŁĄD:", e)
    ok = not errors and st_ok
    print("\nWYNIK:", "OK – warianty rozwiązywalne, reguły głębokości, odstępy, czasy i teksty zgodne" if ok
          else f"BŁĘDY ({len(errors)})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

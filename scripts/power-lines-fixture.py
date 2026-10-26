#!/usr/bin/env python3
"""Fixture for tests/power-lines.test.ts: results of the REFERENCE rules (design/zagadki-m1/validate.py).

Usage (from prog/game):  python3 scripts/power-lines-fixture.py [path/to/validate.py]
Writes tests/fixtures/power-lines-expected.json. LUZ / Pracownik 4.

Contents:
- selftest: every small grid built by validate.selftest() (captured by wrapping validate.P) with
  simulate()/preview() for EVERY switch mask, plus selftest() == True;
- variants: per variant simulate()/preview() for masks: 0, start, solution, all ON and 12 random
  (random.Random(2026)), the census (winning masks + status counts over all 2^k masks), solver
  (min moves), kinds() (end/mid), elements(), and validate() errors for the real file (must be []);
- invalid: validate() errors for mutated copies of the data (loader rejection tests).
"""
import copy
import importlib.util
import io
import json
import os
import random
import sys
from contextlib import redirect_stdout

sys.dont_write_bytecode = True  # do not leave __pycache__ in design/

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
GRA = os.path.abspath(os.path.join(GAME, "..", ".."))
VALIDATE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(GRA, "design", "zagadki-m1", "validate.py")
DATA = os.path.join(os.path.dirname(VALIDATE), "power-lines-line1.json")
OUT = os.path.join(GAME, "tests", "fixtures", "power-lines-expected.json")

spec = importlib.util.spec_from_file_location("pl_validate", VALIDATE)
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)


def key(p):
    return f"{p[0]},{p[1]}"


def res_json(r):
    """Python result → JSON (cell tuples → 'r,c' keys / [r,c] lists; set → sorted list)."""
    return {
        "status": r["status"],
        "cell": list(r["cell"]) if r["cell"] is not None else None,
        "got": {key(p): v for p, v in r["got"].items()},
        "lit": {key(p): v for p, v in r["lit"].items()},
        "flow": {key(p): v for p, v in r["flow"].items()},
        "through": [list(p) for p in sorted(r["through"])],
        "tokens": dict(r["tokens"]),
        "panel": r["panel"],
    }


def both(pz, m):
    return {"mask": m, "simulate": res_json(pz.simulate(m)), "preview": res_json(pz.preview(m))}


# ---- selftest grids (captured from validate.selftest) ----
captured = []
orig_P = V.P


def spy_P(grid, power, fuses=None):
    pz = orig_P(grid, power, fuses)
    srcs = [{"at": list(s), "power": p} for s, p in sorted(pz.sources.items())]
    fz = [{"at": list(f), "max": m} for f, m in sorted(pz.fuses.items())]
    captured.append((list(grid), srcs, fz, pz))
    return pz


V.P = spy_P
with redirect_stdout(io.StringIO()):
    selftest_ok = V.selftest()
V.P = orig_P
seen, selftest = set(), []
for grid, srcs, fz, pz in captured:
    k = json.dumps([grid, srcs, fz])
    if k in seen:
        continue
    seen.add(k)
    selftest.append({"grid": grid, "sources": srcs, "fuses": fz, "start": pz.start_mask(),
                     "results": [both(pz, m) for m in range(1 << len(pz.switches))]})

# ---- variants ----
with open(DATA, encoding="utf-8") as fh:
    data = json.load(fh)
with redirect_stdout(io.StringIO()):
    errors, warnings, _ = V.validate(data)
rng = random.Random(2026)
variants = []
for v in sorted(data["variants"], key=lambda x: x["order"]):
    pz = V.puzzle_from_variant(v)
    n = len(pz.switches)
    start = pz.start_mask()
    sol = start
    for t in v["solution"]["taps"]:
        sol ^= 1 << pz.sw_index[tuple(t)]
    masks = [0, start, sol, pz.all_closed_mask()] + [rng.randrange(1 << n) for _ in range(12)]
    uniq = []
    for m in masks:
        if m not in uniq:
            uniq.append(m)
    wins, dist = pz.census()
    found, path = pz.solve()
    variants.append({
        "id": v["id"], "switches": [list(p) for p in pz.switches], "start": start, "solution_mask": sol,
        "solution_grid": pz.grid_for_mask(sol), "wins": wins, "dist": dist,
        "min_moves": len(path), "solver_mask": found,
        "kinds": {key(p): k for p, k in pz.kinds().items()},
        "elements": sorted(pz.elements()),
        "results": [both(pz, m) for m in uniq],
    })

# ---- invalid data (loader rejection) ----


def errs_for(d):
    with redirect_stdout(io.StringIO()):
        e, _, _ = V.validate(d)
    return e


def var(d, vid):
    return next(x for x in d["variants"] if x["id"] == vid)


invalid = []
d = copy.deepcopy(data)  # 5th device in M1_TERM_03: free cell [8,8], not connected
g = var(d, "M1_TERM_03")["grid"]
g[8] = g[8][:8] + "2"
var(d, "M1_TERM_03")["consumers"].append({"id": "E", "at": [8, 8], "need": 2, "consumer_type": "end"})
invalid.append({"case": "five_consumers", "variant": "M1_TERM_03", "mutation": {"grid_row": [8, g[8]]},
                "errors": errs_for(d)})
d = copy.deepcopy(data)  # mid device at depth 2
var(d, "M1_TERM_02")["consumers"][0]["consumer_type"] = "mid"
invalid.append({"case": "mid_below_depth3", "variant": "M1_TERM_02", "errors": errs_for(d)})
d = copy.deepcopy(data)
d["schema_version"] = 1
invalid.append({"case": "schema_v1", "variant": None, "errors": errs_for(d)})
d = copy.deepcopy(data)
var(d, "M1_TERM_04")["solution"]["taps"] = [[3, 1]]
invalid.append({"case": "bad_solution", "variant": "M1_TERM_04", "errors": errs_for(d)})

out = {
    "_generated_by": "scripts/power-lines-fixture.py (reference: design/zagadki-m1/validate.py)",
    "data_version": data.get("version"),
    "selftest_ok": selftest_ok,
    "validate_errors": errors,
    "validate_warnings": warnings,
    "selftest": selftest,
    "variants": variants,
    "invalid": invalid,
}
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    fh.write("\n")
print(f"{os.path.relpath(OUT, GAME)}: selftest {len(selftest)} grids (ok={selftest_ok}), "
      f"{len(variants)} variants, {sum(len(v['results']) for v in variants)} variant masks, "
      f"validate errors {len(errors)}, invalid cases {[ (c['case'], len(c['errors'])) for c in invalid]}")

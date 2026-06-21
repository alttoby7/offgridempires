#!/usr/bin/env python3
"""
Fixture tests for the inverter-wattage parser in discover-shopsolar.py.

Runs WITHOUT a database or network — it imports parse_specs() and feeds it
title strings, asserting the parsed inverterW. Guards the two historical bugs:
  - truncation of uncommaed thousands ("3000W" -> 0/500)
  - ~1000x inflation when an inverter spec sits near a "kWh"/"kW" token and the
    regex drifted into an unrelated panel wattage.

Run: python3 scripts/test-inverter-parser.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib import import_module

parse_specs = import_module("discover-shopsolar").parse_specs


def inv(title: str):
    return parse_specs("", title, [])["inverterW"]


# (title, expected_inverterW)
CASES = [
    # — uncommaed thousands must not truncate —
    ("Off-Grid Kit with 3000W inverter", 3000),
    ("Portable system, 1500W inverter included", 1500),
    # — commaed thousands still work —
    ("EcoFlow Delta Pro Ultra 7,200W Inverter + 5.12kWh battery", 7200),
    # — kW form multiplies correctly, and only once —
    ("Sol-Ark 7.2kW Inverter, 10kWh storage", 7200),
    # — the NUE drift trap: inverter near kWh AND a later panel wattage —
    #   must read the real "3,600W Inverter", not 240W*1000 = 240000
    ("New Use Energy SunCase 3,600W Inverter & 5.12kWh expandable, 240W Solar Panels", 3600),
    # — "kWh" must never be read as an inverter watt —
    ("Big Battery 5.12kWh expandable to 240W Solar Panels", None),
    # — drift trap with inverter keyword but only panel watts after it → None —
    ("Inverter ready. 5.12kWh pack. 240W Solar Panels.", None),
    # — ambiguous large system, no explicit inverter watt → None (don't guess) —
    ("EDGE 63.4kW Complete Solar EG4 Indoor Wallmount 128 kWh", None),
    # — AC output phrasings —
    ("AC Output: 3,600W continuous pure sine", 3600),
    ("2400W AC output, 1024Wh", 2400),
    # — implausible parse is rejected, not stored —
    ("Inverter 240000W somehow", None),
]


def main() -> int:
    failures = []
    for title, expected in CASES:
        got = inv(title)
        ok = got == expected
        print(f"  {'PASS' if ok else 'FAIL'}  expected={expected!r:>8}  got={got!r:>8}  | {title[:60]}")
        if not ok:
            failures.append((title, expected, got))
    print()
    if failures:
        print(f"FAILED {len(failures)}/{len(CASES)} inverter-parser cases")
        return 1
    print(f"OK — all {len(CASES)} inverter-parser cases passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

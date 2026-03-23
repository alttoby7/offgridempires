"""
Seed BOM (Bill of Materials) data for kits that were created by the API ingestion
but don't yet have component breakdowns, coverage, or total cost data.

Run: python3 scripts/seed-bom.py
Requires SSH tunnel: ssh -fN -L 15433:localhost:5433 n8n-basecamp
"""

import json
import os
import sys
import uuid
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

DATABASE_URL = os.environ.get("OFFGRID_DATABASE_URL", "")

# ── BOM definitions for 8 new kits ──────────────────────────────────────────────

BOM_DATA = [
    {
        "slug": "renogy-400w-premium-mppt",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "Renogy Rover 40A MPPT", "specs": "40A MPPT + BT-1 Bluetooth", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ LiFePO4", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + fuses", "specs": "20ft 10AWG MC4, 8ft 8AWG tray", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": True, "name": "BT-1 Bluetooth Module", "specs": "Renogy DC Home app", "qty": 1},
        ],
    },
    {
        "slug": "renogy-400w-bluetooth-kit",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "Renogy Wanderer 30A PWM", "specs": "30A PWM + BT-1 Bluetooth", "qty": 1, "notes": "PWM — less efficient than MPPT"},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ LiFePO4", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + connectors", "specs": "20ft 10AWG MC4, 8ft 10AWG tray, 3 branch connectors", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": True, "name": "BT-1 Bluetooth Module", "specs": "Renogy DC Home app", "qty": 1},
        ],
    },
    {
        "slug": "eco-worthy-200w-complete",
        "voltage": 12, "panelW": 200, "batteryTotalWh": 1280, "batteryUsableWh": 1280,
        "inverterW": 1100, "inverterSurgeW": 2200, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "ECO-WORTHY 100W Mono", "specs": "2x 100W = 200W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "ECO-WORTHY 30A PWM", "specs": "30A PWM", "qty": 1, "notes": "PWM — less efficient than MPPT"},
            {"role": "battery_bank", "included": True, "name": "ECO-WORTHY 100Ah 12V LiFePO4", "specs": "1,280Wh, 4000 cycles", "qty": 1},
            {"role": "inverter", "included": True, "name": "ECO-WORTHY 1100W Pure Sine", "specs": "1100W cont / 2200W surge", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "MC4 cables + battery cables", "specs": "Included cables", "qty": 1, "notes": "May need extra battery-to-inverter cables"},
            {"role": "mounting_hardware", "included": False, "name": "Not included", "specs": "Need Z-brackets for 2 panels", "qty": 1, "cost": 3500},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Controller has basic LCD only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "bluetti-ac300-b300k-pv350",
        "voltage": 48, "panelW": 350, "batteryTotalWh": 2764, "batteryUsableWh": 2764,
        "inverterW": 3000, "inverterSurgeW": 6000, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "BLUETTI PV350", "specs": "350W portable panel", "qty": 1},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in AC300", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "BLUETTI B300K LiFePO4", "specs": "2,764Wh, 4000+ cycles", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "3000W / 6000W surge, 7 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging cables", "specs": "AC + DC + car charging cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable/foldable system", "qty": 0, "cost": 0, "notes": "Portable panel — no mounting needed"},
            {"role": "monitoring", "included": True, "name": "BLUETTI App", "specs": "Bluetooth + built-in display, AI-BMS", "qty": 1},
        ],
    },
    {
        "slug": "windynation-400w-complete-inverter",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 1500, "inverterSurgeW": 3000, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "WindyNation 100W Poly", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "WindyNation P30L PWM", "specs": "30A PWM, LCD display", "qty": 1, "notes": "PWM — less efficient than MPPT"},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": True, "name": "VertaMax 1500W Modified Sine", "specs": "1500W cont / 3000W surge", "qty": 1, "notes": "Modified sine — not safe for sensitive electronics"},
            {"role": "wiring_kit", "included": True, "name": "Solar + inverter cables", "specs": "40ft 12AWG solar cable, MC4 connectors, 2AWG inverter cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Solar mounting hardware", "specs": "Included", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 2500},
        ],
    },
    {
        "slug": "windynation-400w-mono-kit",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "WindyNation 100W Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "WindyNation P30L PWM", "specs": "30A PWM, LCD display", "qty": 1, "notes": "PWM — less efficient than MPPT"},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ LiFePO4", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "Solar cable + MC4 connectors", "specs": "Included", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Mounting brackets", "specs": "Included", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 2500},
        ],
    },
    {
        "slug": "jackery-1000v2-200w-panel",
        "voltage": 48, "panelW": 200, "batteryTotalWh": 1070, "batteryUsableWh": 1070,
        "inverterW": 1500, "inverterSurgeW": 3000, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Jackery SolarSaga 200W", "specs": "200W portable panel", "qty": 1},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in Explorer 1000 v2", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "Explorer 1000 v2 LiFePO4", "specs": "1,070Wh, 4000 cycles", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "1500W / 3000W surge, 3 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "AC charging cable + solar cable", "specs": "Proprietary connector", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable/foldable system", "qty": 0, "cost": 0, "notes": "Portable panel — no mounting needed"},
            {"role": "monitoring", "included": True, "name": "Jackery App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    {
        "slug": "jackery-1000plus-2x100w",
        "voltage": 48, "panelW": 200, "batteryTotalWh": 1264, "batteryUsableWh": 1264,
        "inverterW": 2000, "inverterSurgeW": 4000, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Jackery SolarSaga 100W Prime", "specs": "2x 100W = 200W total + Z-bracket kits", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in Explorer 1000 Plus", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "Explorer 1000 Plus LiFePO4", "specs": "1,264Wh, expandable to 5kWh", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "2000W / 4000W surge, 2 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging + extension cables", "specs": "2x charging, 1x extension, Anderson adapter", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket kits", "specs": "2 sets for panel mounting", "qty": 2},
            {"role": "monitoring", "included": True, "name": "Jackery App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    # ── New kits added 2026-03-23 ──────────────────────────────────────────────
    {
        "slug": "renogy-100w-starter-kit",
        "voltage": 12, "panelW": 100, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono N-Type", "specs": "1x 100W panel", "qty": 1},
            {"role": "charge_controller", "included": True, "name": "Renogy Wanderer 30A PWM", "specs": "30A PWM, LCD display", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 50Ah+ battery", "qty": 1, "cost": 17900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 500W+ pure sine", "qty": 1, "cost": 9900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables", "specs": "Included cables + connectors", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "1 set Z-brackets", "qty": 1},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-200w-starter-pwm",
        "voltage": 12, "panelW": 200, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "2x 100W = 200W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Renogy Wanderer 30A PWM", "specs": "30A PWM", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "2 sets Z-brackets", "qty": 2},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-200w-starter-mppt-20a",
        "voltage": 12, "panelW": 200, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "2x 100W = 200W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Renogy Rover 20A MPPT", "specs": "20A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "2 sets Z-brackets", "qty": 2},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-200w-premium-mppt-40a",
        "voltage": 12, "panelW": 200, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "2x 100W = 200W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Renogy Rover 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + Z-brackets", "specs": "Included cables + mounting", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "2 sets Z-brackets", "qty": 2},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-200w-rv-kit",
        "voltage": 12, "panelW": 200, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "2x 100W = 200W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Renogy Adventurer 30A PWM", "specs": "30A PWM flush mount", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + cable entry", "specs": "RV cable entry housing included", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "2 sets Z-brackets", "qty": 2},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-400w-starter-pwm",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "Renogy Wanderer 30A PWM", "specs": "30A PWM", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-400w-starter-mppt",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "Renogy Rover 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-400w-rv-kit",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "Renogy Adventurer 30A PWM", "specs": "30A PWM flush mount", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + cable entry", "specs": "RV cable entry housing included", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-300w-rv-kit",
        "voltage": 12, "panelW": 300, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "3x 100W = 300W total", "qty": 3},
            {"role": "charge_controller", "included": True, "name": "Renogy Adventurer 30A PWM", "specs": "30A PWM flush mount", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + cable entry", "specs": "RV cable entry housing included", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "3 sets Z-brackets", "qty": 3},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-600w-premium-kit",
        "voltage": 12, "panelW": 600, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 100W 12V Mono", "specs": "6x 100W = 600W total", "qty": 6},
            {"role": "charge_controller", "included": True, "name": "Renogy Rover 60A MPPT", "specs": "60A MPPT + Bluetooth", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 200Ah+ battery", "qty": 1, "cost": 49900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 2000W+ pure sine", "qty": 1, "cost": 29900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + fuses", "specs": "Included cables + connectors", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "6 sets Z-brackets", "qty": 6},
            {"role": "monitoring", "included": True, "name": "BT-1 Bluetooth Module", "specs": "Renogy DC Home app", "qty": 1},
        ],
    },
    {
        "slug": "renogy-1000w-cabin-kit",
        "voltage": 24, "panelW": 1000, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 200W 24V Mono", "specs": "5x 200W = 1000W total", "qty": 5},
            {"role": "charge_controller", "included": True, "name": "Renogy Rover 60A MPPT", "specs": "60A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 24V 200Ah+ battery bank", "qty": 1, "cost": 89900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 3000W+ pure sine 24V", "qty": 1, "cost": 54900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + tray cables + combiner", "specs": "Included cables + combiner box", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Mounting hardware", "specs": "5 sets mounting brackets", "qty": 5},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth included", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "renogy-1800w-cabin-kit",
        "voltage": 24, "panelW": 1800, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Renogy 300W Mono", "specs": "6x 300W = 1800W total", "qty": 6},
            {"role": "charge_controller", "included": True, "name": "Midnite Classic MPPT", "specs": "60A+ MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 24V/48V 400Ah+ battery bank", "qty": 1, "cost": 179900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 5000W+ split-phase inverter", "qty": 1, "cost": 129900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + combiner + cables", "specs": "Included wiring kit", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Ground mount hardware", "specs": "6-panel ground mount system", "qty": 6},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No monitoring included", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "eco-worthy-400w-premium-mppt",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "ECO-WORTHY 100W Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "ECO-WORTHY 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 19200},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + Z-brackets + cables", "specs": "Included cables + mounting", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "eco-worthy-400w-ultra-280ah",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 3584, "batteryUsableWh": 3584,
        "inverterW": 2000, "inverterSurgeW": 4000, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "ECO-WORTHY 100W Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "ECO-WORTHY 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "ECO-WORTHY 280Ah LiFePO4", "specs": "3,584Wh, 6000+ cycles", "qty": 1},
            {"role": "inverter", "included": True, "name": "ECO-WORTHY 2000W Pure Sine", "specs": "2000W / 4000W surge", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "MC4 + battery cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "eco-worthy-400w-premium-zbrackets",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "ECO-WORTHY 100W Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "ECO-WORTHY 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 19200},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "windynation-400w-kit-agm",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 1200, "batteryUsableWh": 600,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "AGM",
        "includesPanels": True, "includesBatteries": True, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "WindyNation 100W Poly", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "WindyNation P30L PWM", "specs": "30A PWM, LCD", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "AGM Deep Cycle Battery", "specs": "~1200Wh AGM (50% usable)", "qty": 1},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ inverter", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "Solar + battery cables", "specs": "Included cables + MC4", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Mounting hardware", "specs": "Included", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "windynation-400w-kit-inverter-300ah",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 3600, "batteryUsableWh": 1800,
        "inverterW": 1500, "inverterSurgeW": 3000, "chemistry": "AGM",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "WindyNation 100W Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "WindyNation P30L PWM", "specs": "30A PWM, LCD", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "AGM 300Ah Deep Cycle", "specs": "3,600Wh (1,800Wh usable at 50% DoD)", "qty": 1},
            {"role": "inverter", "included": True, "name": "VertaMax 1500W Pure Sine", "specs": "1500W / 3000W surge", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Solar + inverter cables", "specs": "MC4 + battery-to-inverter cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Mounting hardware", "specs": "Included", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD on controller only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "windynation-200w-rv-kit",
        "voltage": 12, "panelW": 200, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "WindyNation 100W Poly", "specs": "2x 100W = 200W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "WindyNation P30L PWM", "specs": "30A PWM", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Mounting hardware", "specs": "Included", "qty": 2},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "ecoflow-delta2-220w",
        "voltage": 48, "panelW": 220, "batteryTotalWh": 1024, "batteryUsableWh": 1024,
        "inverterW": 1800, "inverterSurgeW": 2700, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "EcoFlow 220W Bifacial Panel", "specs": "220W portable, N-Type", "qty": 1},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in DELTA 2", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "EcoFlow DELTA 2 LiFePO4", "specs": "1,024Wh, 3000+ cycles", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "1800W / 2700W X-Boost, 6 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging cables", "specs": "AC + DC + solar cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable system", "qty": 0, "cost": 0},
            {"role": "monitoring", "included": True, "name": "EcoFlow App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    {
        "slug": "ecoflow-river2pro-160w",
        "voltage": 48, "panelW": 160, "batteryTotalWh": 768, "batteryUsableWh": 768,
        "inverterW": 800, "inverterSurgeW": 1600, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "EcoFlow 160W Portable Panel", "specs": "160W portable, IP68", "qty": 1},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in RIVER 2 Pro", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "EcoFlow RIVER 2 Pro LiFePO4", "specs": "768Wh, 3000+ cycles", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "800W / 1600W X-Boost", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging cables", "specs": "AC + DC + solar cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable system", "qty": 0, "cost": 0},
            {"role": "monitoring", "included": True, "name": "EcoFlow App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    {
        "slug": "ecoflow-delta2max-400w",
        "voltage": 48, "panelW": 400, "batteryTotalWh": 2048, "batteryUsableWh": 2048,
        "inverterW": 2400, "inverterSurgeW": 4800, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "EcoFlow 400W Portable Panel", "specs": "400W portable, IP68", "qty": 1},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in DELTA 2 Max", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "EcoFlow DELTA 2 Max LiFePO4", "specs": "2,048Wh, expandable to 6kWh", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "2400W / 4800W X-Boost, 6 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging cables", "specs": "AC + DC + solar cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable system", "qty": 0, "cost": 0},
            {"role": "monitoring", "included": True, "name": "EcoFlow App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    {
        "slug": "ecoflow-delta2-2x220w",
        "voltage": 48, "panelW": 440, "batteryTotalWh": 1024, "batteryUsableWh": 1024,
        "inverterW": 1800, "inverterSurgeW": 2700, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "EcoFlow 220W Bifacial Panel", "specs": "2x 220W = 440W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in DELTA 2", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "EcoFlow DELTA 2 LiFePO4", "specs": "1,024Wh, 3000+ cycles", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "1800W / 2700W X-Boost, 6 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging cables", "specs": "AC + DC + solar cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable system", "qty": 0, "cost": 0},
            {"role": "monitoring", "included": True, "name": "EcoFlow App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    {
        "slug": "jackery-1000plus-2528wh-2x100w",
        "voltage": 48, "panelW": 200, "batteryTotalWh": 2528, "batteryUsableWh": 2528,
        "inverterW": 2000, "inverterSurgeW": 4000, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Jackery SolarSaga 100W", "specs": "2x 100W = 200W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in Explorer 1000 Plus", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "Explorer 1000 Plus + Battery Pack", "specs": "2,528Wh total (1264 + 1264), expandable", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "2000W / 4000W surge", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging + extension cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable system", "qty": 0, "cost": 0},
            {"role": "monitoring", "included": True, "name": "Jackery App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    {
        "slug": "jackery-2000plus-4085wh-2x200w",
        "voltage": 48, "panelW": 400, "batteryTotalWh": 4085, "batteryUsableWh": 4085,
        "inverterW": 3000, "inverterSurgeW": 6000, "chemistry": "LiFePO4",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Jackery SolarSaga 200W", "specs": "2x 200W = 400W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in Explorer 2000 Plus", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "Explorer 2000 Plus + E2000 Pack", "specs": "4,085Wh total (2042 + 2043), expandable to 24kWh", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "3000W / 6000W surge, 5 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging cables", "specs": "AC + DC + solar cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable system", "qty": 0, "cost": 0},
            {"role": "monitoring", "included": True, "name": "Jackery App", "specs": "Bluetooth + Wi-Fi, built-in display", "qty": 1},
        ],
    },
    {
        "slug": "jackery-1500-4x100w",
        "voltage": 48, "panelW": 400, "batteryTotalWh": 1534, "batteryUsableWh": 1534,
        "inverterW": 1800, "inverterSurgeW": 3600, "chemistry": "Li-ion",
        "includesPanels": True, "includesBatteries": True, "includesInverter": True, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Jackery SolarSaga 100W", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "Built-in MPPT", "specs": "Integrated in Explorer 1500", "qty": 1},
            {"role": "battery_bank", "included": True, "name": "Explorer 1500 Li-ion", "specs": "1,534Wh Li-ion", "qty": 1},
            {"role": "inverter", "included": True, "name": "Built-in Pure Sine", "specs": "1800W / 3600W surge, 3 AC outlets", "qty": 1},
            {"role": "wiring_kit", "included": True, "name": "Charging cables", "specs": "AC + DC + solar cables", "qty": 1},
            {"role": "mounting_hardware", "included": False, "name": "Not needed", "specs": "Portable panels", "qty": 0, "cost": 0},
            {"role": "monitoring", "included": True, "name": "Jackery App", "specs": "Bluetooth + built-in display", "qty": 1},
        ],
    },
    {
        "slug": "rich-solar-400w-premium-kit",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Rich Solar 200W Mono", "specs": "2x 200W = 400W total", "qty": 2},
            {"role": "charge_controller", "included": True, "name": "Rich Solar 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + cables + fuses", "specs": "Included cables + 30A fuse", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "2 sets Z-brackets", "qty": 2},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "rich-solar-800w-premium-kit",
        "voltage": 24, "panelW": 800, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "Rich Solar 200W Mono", "specs": "4x 200W = 800W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "Rich Solar 60A MPPT", "specs": "60A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 24V 200Ah+ battery bank", "qty": 1, "cost": 69900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 3000W+ pure sine 24V", "qty": 1, "cost": 54900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + cables + fuses", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "hqst-100w-mono-kit",
        "voltage": 12, "panelW": 100, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "HQST 100W 12V Mono", "specs": "1x 100W panel", "qty": 1},
            {"role": "charge_controller", "included": True, "name": "HQST 30A PWM", "specs": "30A PWM", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 50Ah+ battery", "qty": 1, "cost": 17900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 500W+ pure sine", "qty": 1, "cost": 9900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "1 set Z-brackets", "qty": 1},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "Basic LCD only", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "hqst-400w-kit-mppt",
        "voltage": 12, "panelW": 400, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "HQST 100W 9BB Mono", "specs": "4x 100W = 400W total", "qty": 4},
            {"role": "charge_controller", "included": True, "name": "HQST 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 100Ah+ battery", "qty": 1, "cost": 24900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 1000W+ pure sine", "qty": 1, "cost": 15900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + cables", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "4 sets Z-brackets", "qty": 4},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth", "qty": 0, "cost": 0},
        ],
    },
    {
        "slug": "hqst-600w-kit-mppt",
        "voltage": 12, "panelW": 600, "batteryTotalWh": 0, "batteryUsableWh": 0,
        "inverterW": 0, "inverterSurgeW": 0, "chemistry": "None",
        "includesPanels": True, "includesBatteries": False, "includesInverter": False, "includesController": True,
        "items": [
            {"role": "panel_array", "included": True, "name": "HQST 100W 9BB Mono", "specs": "6x 100W = 600W total", "qty": 6},
            {"role": "charge_controller", "included": True, "name": "HQST 40A MPPT", "specs": "40A MPPT", "qty": 1},
            {"role": "battery_bank", "included": False, "name": "Not included", "specs": "Need 12V 200Ah+ battery", "qty": 1, "cost": 49900},
            {"role": "inverter", "included": False, "name": "Not included", "specs": "Need 2000W+ pure sine", "qty": 1, "cost": 29900},
            {"role": "wiring_kit", "included": True, "name": "MC4 + cables + combiner", "specs": "Included cables", "qty": 1},
            {"role": "mounting_hardware", "included": True, "name": "Z-bracket mounts", "specs": "6 sets Z-brackets", "qty": 6},
            {"role": "monitoring", "included": False, "name": "Not included", "specs": "No Bluetooth", "qty": 0, "cost": 0},
        ],
    },
]


def main():
    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL not set")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Load role map
    cur.execute("SELECT id, code FROM component_roles")
    role_map = {row[1]: row[0] for row in cur.fetchall()}

    # Load use case map
    cur.execute("SELECT id, slug FROM use_cases")
    uc_map = {row[1]: row[0] for row in cur.fetchall()}
    default_uc_id = uc_map.get("rv-weekend")

    if not default_uc_id:
        print("ERROR: rv-weekend use case not found")
        sys.exit(1)

    succeeded = 0
    skipped = 0

    for bom in BOM_DATA:
        slug = bom["slug"]

        # Find kit
        cur.execute("SELECT id FROM kits WHERE slug = %s", (slug,))
        kit_row = cur.fetchone()
        if not kit_row:
            print(f"  SKIP {slug} — kit not found in DB")
            skipped += 1
            continue

        kit_id = kit_row[0]

        # Check if already has items
        cur.execute("SELECT count(*) FROM kit_items WHERE kit_id = %s", (kit_id,))
        if cur.fetchone()[0] > 0:
            print(f"  SKIP {slug} — already has BOM data")
            skipped += 1
            continue

        # Update kit specs
        cur.execute(
            """
            UPDATE kits SET
                nominal_system_voltage_v = %s,
                panel_array_w = %s,
                battery_total_wh = %s,
                battery_usable_wh = %s,
                inverter_continuous_w = %s,
                inverter_surge_w = %s,
                chemistry = %s,
                includes_panels = %s,
                includes_batteries = %s,
                includes_inverter = %s,
                includes_controller = %s
            WHERE id = %s
            """,
            (
                bom["voltage"], bom["panelW"], bom["batteryTotalWh"], bom["batteryUsableWh"],
                bom["inverterW"], bom["inverterSurgeW"], bom["chemistry"],
                bom["includesPanels"], bom["includesBatteries"], bom["includesInverter"], bom["includesController"],
                kit_id,
            ),
        )

        # Insert kit items (included only)
        for i, item in enumerate(bom["items"]):
            role_id = role_map.get(item["role"])
            if not role_id:
                print(f"    WARNING: role {item['role']} not found")
                continue

            if item["included"]:
                cur.execute(
                    """
                    INSERT INTO kit_items (kit_id, component_role_id, quantity, unit_label, sort_order, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        kit_id, role_id,
                        item["qty"], item["name"], (i + 1) * 10,
                        item.get("notes", f"{item['name']} — {item['specs']}"),
                    ),
                )

        # Insert role coverage for default use case
        missing_cents = 0
        included_count = 0
        total_roles = len(bom["items"])

        for item in bom["items"]:
            role_id = role_map.get(item["role"])
            if not role_id:
                continue

            if item["included"]:
                included_count += 1
                cur.execute(
                    """
                    INSERT INTO kit_role_coverage (kit_id, use_case_id, component_role_id, status, included_quantity, calculator_version)
                    VALUES (%s, %s, %s, 'included', %s, 'bom-seed-v1')
                    """,
                    (kit_id, default_uc_id, role_id, item["qty"]),
                )
            else:
                cost = item.get("cost", 0)
                missing_cents += cost
                cur.execute(
                    """
                    INSERT INTO kit_role_coverage (kit_id, use_case_id, component_role_id, status, missing_quantity, recommended_cost_cents, notes, calculator_version)
                    VALUES (%s, %s, %s, 'missing', %s, %s, %s, 'bom-seed-v1')
                    """,
                    (
                        kit_id, default_uc_id, role_id,
                        max(item["qty"], 1), cost, item.get("notes"),
                    ),
                )

        # Get current price for total cost calculation
        cur.execute(
            "SELECT offer_id, price_cents FROM kit_current_prices WHERE kit_id = %s ORDER BY price_cents ASC LIMIT 1",
            (kit_id,),
        )
        price_row = cur.fetchone()
        if price_row:
            offer_id, base_price = price_row
            completeness = round((included_count / total_roles) * 100) if total_roles > 0 else 0
            total_before_tax = base_price + missing_cents

            cur.execute(
                """
                INSERT INTO kit_total_cost_current (kit_id, use_case_id, primary_kit_offer_id, base_offer_price_cents, missing_components_cents, total_before_tax_cents, completeness_score, last_priced_at, calculator_version)
                VALUES (%s, %s, %s, %s, %s, %s, %s, now(), 'bom-seed-v1')
                ON CONFLICT (kit_id, use_case_id) DO UPDATE SET
                    base_offer_price_cents = EXCLUDED.base_offer_price_cents,
                    missing_components_cents = EXCLUDED.missing_components_cents,
                    total_before_tax_cents = EXCLUDED.total_before_tax_cents,
                    completeness_score = EXCLUDED.completeness_score,
                    last_priced_at = EXCLUDED.last_priced_at
                """,
                (
                    kit_id, default_uc_id, offer_id,
                    base_price, missing_cents, total_before_tax,
                    completeness,
                ),
            )

            print(f"  ✓ {slug} — ${base_price/100:.0f} listed + ${missing_cents/100:.0f} missing = ${total_before_tax/100:.0f} real, {completeness}% complete")
        else:
            print(f"  ✓ {slug} — BOM added (no price data yet)")

        succeeded += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone! {succeeded} kits updated, {skipped} skipped")


if __name__ == "__main__":
    main()

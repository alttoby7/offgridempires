import type { VerdictSeverity } from "./types";

/**
 * Curated real-world failure notes — the "hybrid" layer that sits on top of the
 * deterministic rules engine (see verdicts.ts).
 *
 * Each note is a known field failure that the raw sizing math doesn't capture:
 * a load that behaves worse in practice than its running watts suggest, or a
 * choice that quietly burns money / leaves people in the dark. A note only earns
 * its place if it *changes the recommendation*. Keyed to appliance ids from
 * APPLIANCE_CATALOG (appliances.ts) so it fires only when that load is present.
 *
 * Keep this list tight (~10–20). This is editorial judgment, not a scraped corpus.
 */
export interface FailureNote {
  id: string;
  /** Fires if ANY of these appliance ids is in the user's load list */
  appliances: string[];
  severity: VerdictSeverity;
  title: string;
  detail: string;
  fix: string;
}

export const FAILURE_NOTES: FailureNote[] = [
  {
    id: "note-well-pump",
    appliances: ["well-pump"],
    severity: "blocker",
    title: "A submersible well pump can trip an inverter that's sized for its running watts",
    detail:
      "A ½ HP pump runs at ~750W but its motor draws 3–5× that for a split second on every start (locked-rotor inrush) — a 2,000–3,500W spike. Plenty of 2,000W inverters shut down on it even though the running number looks fine.",
    fix: "Use a low-frequency (transformer-based) inverter rated 3,000W+, or fit the pump with a soft starter / CSCR control box. Pure sine only.",
  },
  {
    id: "note-window-ac",
    appliances: ["window-ac"],
    severity: "warning",
    title: "Air conditioner compressors surge ~3× on startup",
    detail:
      "A 500W window unit spikes near 1,500W the instant the compressor kicks in, and it does that every cycle. On a modified-sine inverter the compressor buzzes, runs hot, and fails early.",
    fix: "Run AC only on a pure-sine inverter with real surge headroom, or add a soft-start kit. Plan battery for the cycling draw, not the nameplate watts.",
  },
  {
    id: "note-fridge-freezer",
    appliances: ["mini-fridge", "chest-freezer"],
    severity: "warning",
    title: "Fridges and freezers surge hard and never turn off",
    detail:
      "Compressors pull 3–5× their running watts to start, and because they cycle 24/7 they quietly dominate your daily watt-hours — especially in summer heat. Modified-sine power makes them buzz and shortens compressor life.",
    fix: "Pure-sine inverter, and size the battery for the all-day cycling load. In hot climates add ~30% to the fridge's estimated draw.",
  },
  {
    id: "note-microwave",
    appliances: ["microwave"],
    severity: "warning",
    title: "A \"1,000W\" microwave actually pulls ~1,500–1,700W from the battery",
    detail:
      "The wattage on the door is cooking output, not input draw. The real load on your inverter is 40–70% higher, and it hits instantly.",
    fix: "Size the inverter to the input draw (2,000W+ pure sine), and keep run times short — microwaves are fine off-grid in bursts, not for long cooks.",
  },
  {
    id: "note-resistive-heat",
    appliances: ["space-heater"],
    severity: "blocker",
    title: "Electric resistance heat is the #1 way off-grid systems get blown out",
    detail:
      "A 1,500W heater run a few hours a day can need more panel and battery than the rest of your loads combined. Solar almost never pencils out for primary electric heat.",
    fix: "Heat with propane or wood and keep the electric heater as occasional spot backup only. If you must, budget a much larger array + bank specifically for it.",
  },
  {
    id: "note-electric-cooking",
    appliances: ["electric-oven"],
    severity: "warning",
    title: "Electric ovens and ranges are rarely solar-viable",
    detail:
      "A 2,000–2,500W resistive element running through a meal is a huge, sustained draw — the kind of load that doubles a modest system's size for one appliance.",
    fix: "Cook on propane off-grid. Reserve electric cooking for an Instant Pot / induction burner used briefly, and size for those instead.",
  },
  {
    id: "note-tankless-water-heater",
    appliances: ["tankless-water-heater"],
    severity: "blocker",
    title: "Electric tankless water heaters are not an off-grid load",
    detail:
      "Whole-house electric tankless units draw 7,000–18,000W. Even the point-of-use 3,500W version strains most off-grid inverters and batteries.",
    fix: "Use propane on-demand or a solar-thermal / batch heater. Don't try to size a battery bank around instant electric hot water.",
  },
  {
    id: "note-ev-charger",
    appliances: ["ev-charger-l1"],
    severity: "warning",
    title: "Even Level 1 EV charging can outweigh your whole house",
    detail:
      "1,400W for 8 hours is ~11 kWh a day — frequently more than everything else on the system put together. It will quietly drain the bank overnight.",
    fix: "Charge the vehicle from grid or a generator, not the off-grid battery. If solar-charging, dedicate a separate array sized just for it.",
  },
  {
    id: "note-hair-dryer",
    appliances: ["hair-dryer"],
    severity: "warning",
    title: "Hair dryers are brief but trip undersized inverters",
    detail:
      "1,500W plus a motor surge is a lot for a small portable system, even though it only runs a few minutes.",
    fix: "Use the low/warm setting (~750W) or run it on a 2,000W+ inverter. It's the surge, not the daily energy, that matters here.",
  },
  {
    id: "note-air-compressor",
    appliances: ["air-compressor"],
    severity: "blocker",
    title: "Air compressors have brutal startup inrush",
    detail:
      "A 1,500W compressor can spike past 3,000W when the motor unloads and restarts. Pancake and twin-stack units routinely stall small inverters mid-task.",
    fix: "Run shop tools on a 3,000W+ low-frequency inverter, or add a soft-start / larger run capacitor. Don't size to the running watts.",
  },
  {
    id: "note-sump-pump",
    appliances: ["sump-pump"],
    severity: "warning",
    title: "A sump pump is critical and surges — don't run it on the edge",
    detail:
      "Motor inrush roughly doubles the running watts, and the times you need it most (storms) are exactly when there's no sun to recharge.",
    fix: "Give it real inverter surge headroom and 2–3 days of battery autonomy so a multi-day storm doesn't outlast the bank.",
  },
  {
    id: "note-starlink",
    appliances: ["starlink"],
    severity: "warning",
    title: "Always-on Starlink is often the single biggest line item",
    detail:
      "At ~75–100W running 24/7, that's ~1.8–2.4 kWh every day — and in low-sun winter it's frequently the load that drains the battery first.",
    fix: "Size the battery for 2–3 cloudy days, or put Starlink on a scheduled/idle power cut overnight. It's a continuous load, not a peak one.",
  },
  {
    id: "note-cpap",
    appliances: ["cpap"],
    severity: "warning",
    title: "CPAP is life-support-adjacent — plan it conservatively",
    detail:
      "Running a CPAP through an AC inverter wastes power on overhead, and the heated humidifier roughly doubles the draw. A single cloudy night can't be allowed to cut therapy.",
    fix: "Power it from 12V DC where possible, turn off the heated humidifier to cut draw ~50%, and size 2+ days of autonomy.",
  },
  {
    id: "note-oxygen-concentrator",
    appliances: ["oxygen-concentrator"],
    severity: "warning",
    title: "An oxygen concentrator is a serious continuous medical load",
    detail:
      "~300W continuous (with a 600W startup surge) for 12–24 hours a day is one of the heaviest sustained draws a home system will see, and it can't fail.",
    fix: "Build a robust battery bank with 2–3 days autonomy and keep a generator as medical backup. Don't run it on a portable power station rated for occasional use.",
  },
];

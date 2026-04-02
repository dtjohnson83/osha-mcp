/**
 * Seed PPE requirements table with real OSHA PPE standards.
 * 
 * Covers: eye/face protection, head protection, hand protection,
 * respiratory protection, hearing protection, fall protection,
 * and flame-resistant clothing for welding operations.
 * 
 * Run: npx tsx scripts/seed-ppe.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SB_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.SB_ANON_KEY!
);

interface PPERecord {
  task_category: string;
  task_description: string;
  hazard_type: string;
  required_ppe: string[];
  standard_reference: string;
  standard_number: string;
  enforcement_notes: string;
  ansi_standard?: string;
  osha_reference: string;
}

const PPE_DATA: PPERecord[] = [
  // ─── EYE & FACE PROTECTION ───────────────────────────────────────────────
  {
    task_category: "Arc Welding (GMAW, GTAW, SMAW)",
    task_description: "Any arc welding operation producing intense ultraviolet radiation",
    hazard_type: "Optical radiation, arc flash, flying sparks",
    required_ppe: [
      "Shade 10 or darker welding helmet (auto-darkening, minimum shade 10 for GTAW/SMAW, shade 11+ for high amperage)",
      "Side shields (shaded or clear)",
      "No sunglasses or tinted safety glasses as substitute"
    ],
    standard_reference: "1910.133(a)(1), ANSI Z87.1-2020",
    standard_number: "1910.133",
    enforcement_notes: "Most cited PPE violation in general industry FY2025",
    ansi_standard: "ANSI Z87.1-2020 (or later)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.133"
  },
  {
    task_category: "Oxyfuel Welding and Cutting",
    task_description: "Oxyacetylene and oxyfuel welding, brazing, and cutting",
    hazard_type: "Flame, heat, molten metal, optical radiation",
    required_ppe: [
      "Shade 5 welding goggles or welding face shield (shade 3-5 for cutting, shade 5-8 for welding)",
      "Chrome leather gloves or welding gauntlets",
      "Flame-resistant clothing (jacket, apron)"
    ],
    standard_reference: "1910.133(a)(1), 1910.253(b)(1)",
    standard_number: "1910.133",
    enforcement_notes: "Goggles must provide side protection when chips or particles are present",
    ansi_standard: "ANSI Z87.1-2020",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.133"
  },
  {
    task_category: "Grinding Welded Surfaces",
    task_description: "Grinding, buffing, and finishing welded joints",
    hazard_type: "Flying abrasive particles, metal fragments, noise, dust",
    required_ppe: [
      "Z87+ safety glasses with side shields (impact-rated)",
      "Face shield (optional for low-hazard, required for heavy grinding)",
      "Hearing protection when noise exceeds 85 dB TWA"
    ],
    standard_reference: "1910.133(a)(1), 1910.95",
    standard_number: "1910.133",
    enforcement_notes: "Safety glasses must have Z87 marking, face shields alone insufficient for grinding",
    ansi_standard: "ANSI Z87.1-2020",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.133"
  },
  {
    task_category: "Plasma Cutting",
    task_description: "Plasma arc cutting operations",
    hazard_type: "Intense UV radiation, flying metal droplets, fume, noise",
    required_ppe: [
      "Shade 9-11 welding helmet (auto-darkening recommended)",
      "Hearing protection (plasma cutting exceeds 85 dB)",
      "Flame-resistant clothing with leather chaps or apron",
      "Respiratory protection if ventilation is insufficient"
    ],
    standard_reference: "1910.133(a)(1), 1910.253(b)(1)",
    standard_number: "1910.133",
    enforcement_notes: "Plasma arc produces intense UV — shield required even for short cuts",
    ansi_standard: "ANSI Z87.1-2020",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.133"
  },

  // ─── HEAD PROTECTION ─────────────────────────────────────────────────────
  {
    task_category: "Structural Steel Welding",
    task_description: "Welding on structural steel in construction or fabrication",
    hazard_type: "Falling objects, overhead welding sparks, bumping hazards",
    required_ppe: [
      "Type I or Type II hard hat (Class E for electrical hazard, Class G for general)",
      "Bump cap only acceptable in low-clearance areas with no overhead hazard — not a substitute for hard hat"
    ],
    standard_reference: "1926.100(a), ANSI Z89.1-2014",
    standard_number: "1926.100",
    enforcement_notes: "Must wear hard hat in all areas of potential head injury from falling/flying objects",
    ansi_standard: "ANSI Z89.1-2014 (Type I, Class E recommended for welding)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.100"
  },
  {
    task_category: "Overhead Welding",
    task_description: "Welding performed above ground or floor level",
    hazard_type: "Dropped tools, falling slag, sparks from work above",
    required_ppe: [
      "Hard hat (Class E) — mandatory",
      "Face shield over safety glasses when overhead work creates falling hazard",
      "Hearing protection if sustained noise present"
    ],
    standard_reference: "1926.100(a), 1926.102",
    standard_number: "1926.100",
    enforcement_notes: "Wearing a welding helmet alone does not satisfy hard hat requirements",
    ansi_standard: "ANSI Z89.1-2014",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.100"
  },

  // ─── HAND & ARM PROTECTION ────────────────────────────────────────────────
  {
    task_category: "Arc Welding (GMAW, GTAW, SMAW)",
    task_description: "General MIG, TIG, and stick welding",
    hazard_type: "Heat, UV radiation, sparks, molten metal spatter",
    required_ppe: [
      "MIG/TIG: Tight-fitting welding gloves (203mm minimum, leather or approved synthetic)",
      "SMAW (stick): Heavy-duty leather welding gloves (gauntlet style, 355mm+ preferred)",
      "Standard leather work gloves insufficient — must be rated for welding"
    ],
    standard_reference: "1910.138(a), ASTM F496-08",
    standard_number: "1910.138",
    enforcement_notes: "Gloves must provide adequate dexterity for electrode manipulation while protecting from burns",
    ansi_standard: "ASTM F496-08 (standard specification for insulated gauntlet-style welding gloves)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.138"
  },
  {
    task_category: "Grinding and Wire Brushing",
    task_description: "Cleaning welds and preparing surfaces",
    hazard_type: "Abrasive particles, sharp edges, heat",
    required_ppe: [
      "Heavy leather work gloves (not welding gloves — dexterity needed for tool grip)",
      "Safety glasses with side shields underneath face shield",
      "Hearing protection for power tools exceeding 85 dB"
    ],
    standard_reference: "1910.138(a)",
    standard_number: "1910.138",
    enforcement_notes: "Nylon or cotton gloves do not provide adequate protection for grinding",
    ansi_standard: "ANSI/ISEA 105-2016",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.138"
  },
  {
    task_category: "Handling Hot Workpiece",
    task_description: "Moving, repositioning, or handling recently welded materials",
    hazard_type: "Contact burns, residual heat",
    required_ppe: [
      "Leather welding gloves (same as welding)",
      "Heat-resistant sleeves if workpiece contacts forearms",
      "Heat-resistant pad or glove wrap for carrying hot material"
    ],
    standard_reference: "1910.138(a)",
    standard_number: "1910.138",
    enforcement_notes: "Material still hot enough to cause burns up to 30 minutes after welding — caution",
    ansi_standard: "ASTM F496-08",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.138"
  },

  // ─── RESPIRATORY PROTECTION ──────────────────────────────────────────────
  {
    task_category: "Mild Steel Welding (Indoor, Poor Ventilation)",
    task_description: "MIG or TIG welding mild steel in confined space or enclosed area",
    hazard_type: "Manganese fume, iron oxide, ozone, nitrogen oxides",
    required_ppe: [
      "N95 disposable respirator minimum for iron/manganese fumes",
      "OV (Organic Vapor) cartridge recommended for ozone",
      "For confined spaces: supplied-air respirator (SAR) or continuous-flow airline respirator",
      "NIOSH-approved respirator required — no homemade substitutes"
    ],
    standard_reference: "1910.134(a)(1), OSHA inhalation exposure limits",
    standard_number: "1910.134",
    enforcement_notes: "1910.134 requires written respiratory program if respirators are required. Medical evaluation, fit testing, and training mandatory.",
    ansi_standard: "NIOSH 42 CFR 84 (for disposable respirators)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.134"
  },
  {
    task_category: "Stainless Steel or High-Alloy Welding",
    task_description: "TIG or MIG welding stainless steel, Inconel, or chromium alloys",
    hazard_type: "Hexavalent chromium (CrVI), manganese, nickel compounds — carcinogens",
    required_ppe: [
      "Half-face respirator with P100 + OV cartridges minimum",
      "Local exhaust ventilation (LEV) preferred over respirator reliance",
      "HEPA vacuum for cleanup — never dry sweep chromium dust",
      "Medical surveillance required for CrVI exposure above action level (2.5 µg/m³)"
    ],
    standard_reference: "1910.134, 1910.1000 Table Z-2, 1910.1028 (benzene applies to some alloys)",
    standard_number: "1910.134",
    enforcement_notes: "Hexavalent chromium is a known carcinogen. Standard Threshold Limit Value (TLV) is 0.2 µg/m³ as CrVI. OSHA PEL is 5 µg/m³ as Cr(VI).",
    ansi_standard: "NIOSH P100 + Organic Vapor combo cartridge",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.134"
  },
  {
    task_category: "Galvanized Steel Welding",
    task_description: "Welding on zinc-coated (galvanized) steel",
    hazard_type: "Zinc oxide fume — metal fume fever (flu-like symptoms, fever, chills)",
    required_ppe: [
      "N95 minimum, N99 or P100 preferred for extended exposure",
      "Local exhaust ventilation required in enclosed spaces",
      "Respiratory protection program required for sustained indoor work"
    ],
    standard_reference: "1910.134, 1910.1000 Table Z-1",
    standard_number: "1910.134",
    enforcement_notes: "Zinc oxide fume fever is a recognized occupational disease. Symptoms delayed 4-8 hours after exposure.",
    ansi_standard: "NIOSH P100 preferred",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.134"
  },
  {
    task_category: "Paint-Stripped or Coated Steel Welding",
    task_description: "Welding steel with paint, grease, oil, or coating removal",
    hazard_type: "Chromium (from primer), lead (from old paint), isocyanates (from some coatings), organic solvents",
    required_ppe: [
      "Full-face respirator with P100 + organic vapor cartridges",
      "Air-supplied respirator preferred for lead-containing coatings",
      "Remove coating minimum 4 inches from weld area before welding",
      "Waste disposal as hazardous if lead above threshold"
    ],
    standard_reference: "1910.134, 1910.1025 (lead), 1910.1200 (Hazard Communication)",
    standard_number: "1910.134",
    enforcement_notes: "OSHA Lead Standard (1910.1025) applies if airborne lead exceeds 30 µg/m³. Medical surveillance and exposure monitoring required above 30 µg/m³ action level.",
    ansi_standard: "NIOSH P100 + OV, or supplied-air for high-exposure scenarios",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.134"
  },
  {
    task_category: "Aluminum Welding (TIG/MIG)",
    task_description: "TIG or MIG welding aluminum alloys",
    hazard_type: "Aluminum oxide fume — respiratory irritation, potential neurotoxicity",
    required_ppe: [
      "N95 minimum for short duration (<30 min), P100 for sustained work",
      "Proper ventilation critical — aluminum fume is extremely fine and penetrates deep lungs",
      "Medical evaluation recommended for prolonged exposure"
    ],
    standard_reference: "1910.134, 1910.1000 Table Z-1",
    standard_number: "1910.134",
    enforcement_notes: "Aluminum welding in enclosed spaces requiresLEV. No skin absorption risk but ingestion hazard from contaminated hands.",
    ansi_standard: "NIOSH N95 or P100",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.134"
  },
  {
    task_category: "Confined Space Welding",
    task_description: "Welding inside tanks, vessels, pits, or other confined spaces",
    hazard_type: "Oxygen deficiency, toxic fume concentration, fire/explosion, heat stress",
    required_ppe: [
      "Supplied-air respirator (SAR) or continuous-flow airline respirator — not filtering respirator",
      "Attended operation — attendant must remain outside with communication",
      "Ventilation must not reduce oxygen below 19.5%",
      "Hot work permit required",
      "Rescue plan and equipment required before entry"
    ],
    standard_reference: "1910.146 (Confined Space), 1910.134, 1910.253",
    standard_number: "1910.146",
    enforcement_notes: "Confined space entry requires permit. SAR required because mechanical ventilation alone insufficient to protect in oxygen-deficient or high-toxin atmosphere. Attendant must maintain visual/verbal contact.",
    ansi_standard: "NIOSH-approved SAR (Type C, continuous flow)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.146"
  },

  // ─── FLAME-RESISTANT CLOTHING ─────────────────────────────────────────────
  {
    task_category: "All Welding Operations",
    task_description: "General welding, cutting, and brazing — baseline requirement",
    hazard_type: "Sparks, spatter, molten metal, UV radiation",
    required_ppe: [
      "Flame-resistant (FR) welding jacket or coat (minimum 9 oz canvas or equivalent)",
      "FR collar on jacket (no open chest exposure)",
      "FR pants or bib overalls (no synthetic underlayers — melts under heat)",
      "Leather apron for heavy welding or overhead work"
    ],
    standard_reference: "1910.132(a), 1926.95(a)",
    standard_number: "1910.132",
    enforcement_notes: "Cotton and synthetic clothing ignite and melt under welding conditions. Only FR-treated or inherently FR materials acceptable. No polyester, nylon, or rayon underlayers.",
    ansi_standard: "ASTM F1506-2022 (standard for FR clothing), NFPA 2112 (flash fire)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.132"
  },
  {
    task_category: "Heavy Production Welding",
    task_description: "High-amperage or high-volume welding in fabrication settings",
    hazard_type: "Sustained heat, heavy spatter, sparks, UV exposure",
    required_ppe: [
      "Full leather welding jacket (cowl or caped style preferred)",
      "Leather sleeves (if jacket doesn't cover arms)",
      "FR cotton or leather pants (no openings)",
      "Leather welding boots or leather-topped safety shoes"
    ],
    standard_reference: "1926.95(a), OSHA general duty clause",
    standard_number: "1926.95",
    enforcement_notes: "Sparks and spatter travel — jacket must extend to collar with no gaps",
    ansi_standard: "ASTM F1506-2022, NFPA 2112 recommended for fabrication",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.95"
  },
  {
    task_category: "Overhead Welding",
    task_description: "Welding above the welder's position",
    hazard_type: "Falling sparks, spatter, molten metal drops onto body",
    required_ppe: [
      "Leather welding jacket (not FR cotton — dripping metal can pool)",
      "Leather cap or hood (if not using welding helmet with cape)",
      "Leather chaps or leather pants protection",
      "Hearing protection under helmet if overhead"
    ],
    standard_reference: "1926.95(a)",
    standard_number: "1926.95",
    enforcement_notes: "Overhead welding has highest burn injury rate — leather provides heat stop when molten drops fall",
    ansi_standard: "ASTM F1506-2022, leather preferred over FR cotton for overhead",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.95"
  },

  // ─── HEARING PROTECTION ───────────────────────────────────────────────────
  {
    task_category: "Heavy Grinding / Power Tool Operations",
    task_description: "Angle grinding, needle scaling, percussive chipping",
    hazard_type: "Noise exposure exceeding 85 dB TWA",
    required_ppe: [
      "Ear plugs (NRR 25+ dB) or ear muffs (NRR 20+ dB)",
      "Both simultaneously for noise exceeding 100 dB",
      "Ensure proper fit — ear plugs require correct insertion depth"
    ],
    standard_reference: "1910.95(b)(1), OSHA PEL = 90 dB(A) TWA, Action Level = 85 dB(A)",
    standard_number: "1910.95",
    enforcement_notes: "Annual audiometric testing required when TWA exceeds 85 dB. Engineering controls preferred over hearing protection alone above 90 dB.",
    ansi_standard: "ANSI S3.19-1974 (ear plugs), ANSI S12.6 (ear muffs)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.95"
  },
  {
    task_category: "Plasma Cutting",
    task_description: "Plasma arc cutting (all amperages)",
    hazard_type: "Noise from plasma arc (can exceed 100 dB at high amperage)",
    required_ppe: [
      "Ear plugs OR ear muffs (minimum NRR 25 dB)",
      "Combined plugging + muffing recommended for >105 dB operations"
    ],
    standard_reference: "1910.95(b)(1)",
    standard_number: "1910.95",
    enforcement_notes: "Plasma arc noise is impulsive — sound level meters must use impulse setting. Regular A-weighted meters may under-read.",
    ansi_standard: "ANSI S3.19-1974, NRR 25+ dB required",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.95"
  },

  // ─── FALL PROTECTION ─────────────────────────────────────────────────────
  {
    task_category: "Welding at Heights (Above 6 Feet in Construction)",
    task_description: "Welding on scaffolds, platforms, or elevated structures in construction",
    hazard_type: "Fall from elevation — leading cause of death in construction",
    required_ppe: [
      "Personal fall arrest system (PFAS): full-body harness + shock-absorbing lanyard + anchor point rated 5,000 lbs",
      "Guardrails as primary protection where feasible",
      "Safety net if scaffolds are 25+ feet above ground or water"
    ],
    standard_reference: "1926.500(a)(1), 1926.501(b)(1) (most cited OSHA construction standard)",
    standard_number: "1926.501",
    enforcement_notes: "1926.501 is the #1 most cited OSHA standard in construction. Fall protection required at 6 feet in construction (general industry = 4 feet). PFAS required for falls exceeding 6 feet to lower level.",
    ansi_standard: "ANSI Z359.1-2022 (fall arrest), ANSI A10.14 (scaffolding with fall protection)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.501"
  },
  {
    task_category: "Welding on Boom Lift / Aerial Lift",
    task_description: "Welding from powered aerial work platforms (scissor lifts, boom lifts)",
    hazard_type: "Fall from elevation, equipment tip-over, boom contact with energized lines",
    required_ppe: [
      "Full-body harness (not body belt) — required in boom lifts",
      "Shock-absorbing lanyard attached to platform anchor point",
      "Insulated boom required within 10 feet of energized lines",
      "Outriggers deployed and platform within rated capacity"
    ],
    standard_reference: "1926.453 (Aerial Lifts), 1926.502(d)",
    standard_number: "1926.453",
    enforcement_notes: "Body belts are prohibited for fall protection in aerial lifts — full harness required since Jan 1998. Insulated lifts rated for specific voltage (Class A, B, C, D) — verify rating before use near power lines.",
    ansi_standard: "ANSI SIA A92.2 (aerial lifts), ANSI Z359.1-2022",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.453"
  },
  {
    task_category: "Welding on Flat Roofs",
    task_description: "Welding structural steel or performing welding repairs on flat or low-slope roofs",
    hazard_type: "Fall from roof edge — leading cause of fatality in welding-related construction falls",
    required_ppe: [
      "PFAS (full-body harness + shock-absorbing lanyard + anchor) when within 15 feet of unguarded edge",
      "Guardrails, safety nets, or safety lines as primary protection",
      "Warning line system if other fall protection not feasible (per 1926.502(f))"
    ],
    standard_reference: "1926.501(a)(1) (low-slope roofs), 1926.502(a)-(e)",
    standard_number: "1926.501",
    enforcement_notes: "Warning lines alone not sufficient within 6 feet of roof edge — PFAS required",
    ansi_standard: "ANSI Z359.1-2022",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.501"
  },

  // ─── FIRE SAFETY ─────────────────────────────────────────────────────────
  {
    task_category: "Hot Work / Welding in Fire Hazard Areas",
    task_description: "Welding or cutting near flammable materials, combustibles, or in fire-prone areas",
    hazard_type: "Fire, explosion, ignition of flammable atmospheres",
    required_ppe: [
      "Fire extinguisher (minimum 10 lb ABC dry chemical or 2.5 gal water-type) within 10 feet, backed up by additional extinguisher",
      "Fire watch for minimum 30 minutes after welding in fire hazard areas",
      "Hot work permit required for all fire hazard welding",
      "Fire-resistant blankets or welding curtains to shield nearby combustibles"
    ],
    standard_reference: "1910.252(a)(1), 1926.352(a)",
    standard_number: "1926.352",
    enforcement_notes: "Fire watch must be maintained 30-60 minutes after welding depending on area (longer for areas with concealed spaces where fire could spread). Requires own extinguisher and training.",
    ansi_standard: "ANSI Z49.1 (Safety in Welding, Cutting, and Allied Processes)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1926.352"
  },
  {
    task_category: "Welding in Combustible Atmospheres",
    task_description: "Welding or cutting near flammable gases, vapors, or dusts",
    hazard_type: "Fire, explosion, deflagration",
    required_ppe: [
      "Explosion-proof equipment (Class I Division 1 rated tools if ignitable atmosphere present)",
      "Confined space permit if enclosed",
      "Continuous air monitoring for combustible gases",
      "All ignition sources eliminated before welding",
      "Inert gas shielding (not CO2 for GMAW in explosive atmospheres)"
    ],
    standard_reference: "1910.146, 1910.252(a), NFPA 51B",
    standard_number: "1910.252",
    enforcement_notes: "Atmospheres containing less than 10% of the LEL (Lower Explosive Limit) acceptable for hot work with controls. Above 10% LEL = stop work until atmosphere cleared.",
    ansi_standard: "NFPA 51B (fire prevention during welding, cutting, and brazing)",
    osha_reference: "https://www.ecfr.gov/current/title-29/section-1910.252"
  }
];

async function seedPPE() {
  console.log(`Seeding ${PPE_DATA.length} PPE requirement records...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const record of PPE_DATA) {
    const { data, error } = await supabase
      .from("ppe_requirements")
      .insert({
        task_category: record.task_category,
        task_description: record.task_description,
        hazard_type: record.hazard_type,
        required_ppe: record.required_ppe,
        standard_reference: record.standard_reference,
        standard_number: record.standard_number,
        enforcement_notes: record.enforcement_notes,
        ansi_standard: record.ansi_standard || null,
        osha_reference: record.osha_reference
      })
      .select("task_category, standard_number");

    if (error) {
      console.log(`  SKIP  ${record.standard_number} ${record.task_category.slice(0, 40)}: ${error.message}`);
      skipped++;
    } else {
      console.log(`  OK     ${record.standard_number}: ${record.task_category} (${record.required_ppe.length} PPE items)`);
      inserted++;
    }
  }

  console.log(`\nDone: ${inserted} PPE records seeded, ${skipped} skipped`);
  console.log(`Total PPE requirement entries: ${PPE_DATA.reduce((a, r) => a + r.required_ppe.length, 0)}`);
}

seedPPE().catch(console.error);

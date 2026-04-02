/**
 * Seed penalty_schedule table with current OSHA penalty amounts.
 * 
 * Updated January 2026 per OSHA's annual inflation adjustment.
 * Source: OSHA Field Operations Manual, CPL 02-00-255
 * Maximum penalties reflect 2026 inflation-adjusted rates.
 * 
 * Run: npx tsx scripts/seed-penalties.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SB_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.SB_ANON_KEY!
);

interface PenaltyRecord {
  violation_type: string;
  description: string;
  max_penalty: number;
  min_penalty: number;
  notes: string;
  standards: string[];
  category: string;
}

const PENALTIES: PenaltyRecord[] = [
  // ─── SERIOUS VIOLATIONS ────────────────────────────────────────────────
  {
    violation_type: "serious",
    description: "A violation where a workplace hazard or other condition that could cause an accident or illness exists and the employer knew or should have known of the condition and either knew or should have known that the hazard could cause death or serious physical harm.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "Per-day penalty once abatement is required. First-time serious violations typically receive the minimum. Maximum applies when employer knew of hazard and took no action.",
    standards: ["1910.134", "1910.147", "1910.1200", "1926.501", "1926.100", "1910.303", "1910.212", "1926.451"],
    category: "serious"
  },

  // ─── OTHER-THAN-SERIOUS VIOLATIONS ───────────────────────────────────
  {
    violation_type: "other_than_serious",
    description: "A violation that has a direct relationship to job safety and health, but probably would not cause death or serious physical harm. No penalty is required for other-than-serious violations.",
    max_penalty: 16362,
    min_penalty: 0,
    notes: "No penalty required by law, but OSHA may assess penalties based on gravity, size of business, and good faith. Abatement required.",
    standards: ["1910.22", "1910.176", "1910.157", "1910.303", "1926.25"],
    category: "other_than_serious"
  },

  // ─── WILLFUL OR REPEAT VIOLATIONS ─────────────────────────────────────
  {
    violation_type: "willful",
    description: "An employer intentionally and knowingly disregards OSHA requirements, or acts with plain indifference to employee safety. Requires conscious decision not to comply.",
    max_penalty: 163620,
    min_penalty: 11614,
    notes: "Maximum penalty per violation. If the same violation is found again within 3 years, it automatically becomes a repeat violation. Criminal referrals possible for willful violations resulting in employee death.",
    standards: ["1926.501", "1910.134", "1910.147", "1926.652", "1910.119"],
    category: "willful_repeat"
  },
  {
    violation_type: "repeat",
    description: "The same or substantially similar condition that OSHA found in a prior inspection, and the employer was cited for the prior violation within the past 3 years.",
    max_penalty: 163620,
    min_penalty: 11614,
    notes: "Repeat violations within 3 years of the original citation. Size reduction does not apply to willful or repeat violations. Post-retaliation violations automatically treated as willful.",
    standards: ["1926.501", "1926.451", "1910.134", "1910.147"],
    category: "willful_repeat"
  },

  // ─── FAILURE TO ABATE ─────────────────────────────────────────────────
  {
    violation_type: "failure_to_abate",
    description: "The employer has not corrected an cited hazard within the prescribed abatement period. Daily penalties accrue from the abatement date until compliance is achieved.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "Per-day penalties begin the day after the abatement deadline passes. If the final order is received after 4 months, penalty accrual continues. The employer must prove the violation was corrected, not just that they tried.",
    standards: ["1910.134", "1926.501", "1926.652", "1910.146", "1910.178"],
    category: "failure_to_abate"
  },

  // ─── POSTING REQUIREMENTS ─────────────────────────────────────────────
  {
    violation_type: "posting_requirements",
    description: "Failure to post OSHA citations, the OSHA Job Safety and Health poster, or required notices in the workplace.",
    max_penalty: 16362,
    min_penalty: 0,
    notes: "Failure to post the Summary of OSHA fatalities/catastrophes within 8 hours (29(b) citation) carries a separate penalty. Also applies to posting requirements under specific standards.",
    standards: ["1903.2", "1903.15", "1903.16", "1904.29"],
    category: "posting"
  },

  // ─── SPECIFIC HIGH-VALUE VIOLATIONS ───────────────────────────────────
  {
    violation_type: "fall_protection_willful",
    description: "Failure to provide fall protection at 6 feet or more above lower level in construction — treated as willful when employer knew of hazard and took no action.",
    max_penalty: 163620,
    min_penalty: 11614,
    notes: "#1 most cited OSHA construction standard (1926.501). Willful classification applies when employer knowingly allowed unprotected edges. Average settlement: $8,000-$15,000 for serious, $30,000-$60,000 for willful.",
    standards: ["1926.501", "1926.502", "1926.503"],
    category: "high_value"
  },
  {
    violation_type: "respiratory_protection_program",
    description: "No written respiratory protection program, no medical evaluation, no fit testing, or respirator not appropriate for hazard.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "#2 most cited general industry standard. Written program required even for voluntary use of N95 dust masks. Medical evaluation required before fit testing. $15,000-$25,000 typical settlement.",
    standards: ["1910.134"],
    category: "high_value"
  },
  {
    violation_type: "lockout_tagout_program",
    description: "Energy control (lockout/tagout) procedures not written, machine not de-energized, employees not trained, or locks not applied before servicing.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "LOTO violations carry high injury potential (amputations, electrocution). $20,000-$40,000 typical settlement for serious violations. Criminal liability possible for willful violations causing death.",
    standards: ["1910.147"],
    category: "high_value"
  },
  {
    violation_type: "hazard_communication_program",
    description: "No written HazCom program, SDS not accessible, employees not trained on chemical hazards, secondary containers not labeled.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "#3 most cited OSHA standard. Applies to any workplace with hazardous chemicals. Must have written program, SDS for every chemical, proper labeling, and annual training. $5,000-$15,000 typical settlement.",
    standards: ["1910.1200"],
    category: "high_value"
  },
  {
    violation_type: "scaffolding_general",
    description: "Scaffolds not properly constructed, guardrails missing, planks inadequate, access not provided, or scaffold not tied/braced.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "#3 most cited construction standard (1926.451). Scaffold-related fatalities average 50-60 per year. $8,000-$20,000 typical settlement. Scaffold must be designed by qualified person.",
    standards: ["1926.451", "1926.452", "1926.453"],
    category: "high_value"
  },
  {
    violation_type: "trench_excavation",
    description: "Protective system not used, or not designed by qualified person, in trenches 5 feet or deeper.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "Trenches over 5 feet require a protective system (sloping, shoring, or shield). Competent person must inspect daily. Fatalities: average 25-30 per year. $15,000-$50,000 typical settlement for serious. Willful violations start at $100,000+.",
    standards: ["1926.651", "1926.652"],
    category: "high_value"
  },
  {
    violation_type: "machine_guard_removed",
    description: "Point-of-operation guarding not in place, guard removed and not replaced, guard defeated or bypassed.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "Amputations are the leading severity in machine-related injuries. Guard removal or defeat is a separate willful violation. Operators may not remove guards even during emergencies. $15,000-$30,000 typical settlement.",
    standards: ["1910.212", "1910.217", "1910.219"],
    category: "high_value"
  },
  {
    violation_type: "confined_space_entry",
    description: "No permit-required confined space program, no atmospheric testing, rescue plan not established, entry without permit.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "Confined space fatalities average 90-100 per year. Attendant must maintain communication and not leave. Rescue service must be identified before entry. $10,000-$30,000 typical settlement.",
    standards: ["1910.146"],
    category: "high_value"
  },
  {
    violation_type: "electrical_general",
    description: "Electrical hazards — improper grounding, missing GFCI protection, flexible cords used as permanent wiring, exposed live parts.",
    max_penalty: 16362,
    min_penalty: 11614,
    notes: "Electrocution is the 4th leading cause of workplace death. GFCIs required for all 120V 15/20A circuits in wet/damp locations. $8,000-$25,000 typical settlement. Electrical fatalities treated as willful.",
    standards: ["1910.303", "1910.304", "1910.333", "1926.405", "1926.416"],
    category: "high_value"
  },
  {
    violation_type: "process_safety_management",
    description: "PSM-covered process not managed per 1910.119 — missing operating procedures, pre-startup safety review, mechanical integrity program, or management of change.",
    max_penalty: 163620,
    min_penalty: 16362,
    notes: "PSM applies to 140+ chemicals above threshold quantities (ammonia at 10,000 lbs, chlorine at 1,500 lbs, etc.). OSHA PSM citations typically settle $40,000-$200,000+. EPA/RMP have additional civil penalties under Clean Air Act.",
    standards: ["1910.119"],
    category: "high_value"
  },
  {
    violation_type: "hearing_conservation",
    description: "No hearing conservation program when noise exceeds 85 dB TWA, audiometric testing not conducted, hearing protectors not provided or not used.",
    max_penalty: 16362,
    min_penalty: 0,
    notes: "Hearing loss is permanent and progressive. Employees with TWA at or above 85 dB must be in a hearing conservation program. OSHA penalties typically $3,000-$10,000 but NIOSH and state programs may be stricter.",
    standards: ["1910.95"],
    category: "high_value"
  },
  {
    violation_type: "recordkeeping_elapsed",
    description: "Failure to maintain OSHA 300 Log, 300A Summary posting, or retain records for 5 years. Most commonly cited in January-March during posting verification.",
    max_penalty: 16362,
    min_penalty: 0,
    notes: "Must post 300A Summary February 1 through April 30 each year. Establishments with 250+ employees must certify 300 log annually. $5,000-$15,000 typical settlement.",
    standards: ["1904.29", "1904.30", "1904.32"],
    category: "high_value"
  },

  // ─── CRIMINAL PENALTIES ────────────────────────────────────────────────
  {
    violation_type: "criminal_gross_negligence",
    description: "An employer knowingly failed to abate an OSHA violation or showed plain indifference/unintentional disregard of OSHA requirements resulting in employee death.",
    max_penalty: 0,
    min_penalty: 0,
    notes: "Criminal penalties under OSHA Section 17(e): Up to 6 months imprisonment and/or $250,000 fine for first offense, up to 1 year for subsequent offenses. DOJ prosecution required. Rare — fewer than 10 cases per year.",
    standards: ["29 USC 666(e)"],
    category: "criminal"
  },
  {
    violation_type: "criminal_knowing_violation",
    description: "Any employer who willfully violates any standard, rule, or order, and that violation causes death of any employee.",
    max_penalty: 0,
    min_penalty: 0,
    notes: "Under 29 USC 666(e): Criminal referral to DOJ. Up to 1 year imprisonment and $250,000 fine ($500,000 for organizations). Average conviction: 8-12 months. Convicted employers also face civil OSHA penalties concurrently.",
    standards: ["29 USC 666(e)"],
    category: "criminal"
  },

  // ─── STATE PLAN VARIATIONS ───────────────────────────────────────────
  {
    violation_type: "calosha_serious",
    description: "California OSHA (Cal/OSHA) serious violation — where a workplace hazard could cause death or serious physical harm, and the employer knew or should have known.",
    max_penalty: 25000,
    min_penalty: 25000,
    notes: "Cal/OSHA has NO minimum penalty for serious violations — a flat $25,000 per serious violation. Cannot be reduced below $25,000. Also covers tunneling, excavations, and crane/rigger certification not covered by federal OSHA.",
    standards: ["8 CCR 3342", "1926.501", "1910.134"],
    category: "state_plan"
  },
  {
    violation_type: "calosha_failure_to_abate",
    description: "Cal/OSHA failure to abate — continuation of hazard after abatement date, or reappearance of previously abated condition.",
    max_penalty: 15000,
    min_penalty: 15000,
    notes: "Cal/OSHA daily failure-to-abate penalty is $15,000 per day. Cannot be reduced. Also note: Cal/OSHA minimum $25,000 for serious violations — regardless of size reduction, good faith, or history.",
    standards: ["8 CCR 3342"],
    category: "state_plan"
  },
  {
    violation_type: "washington_serious",
    description: "Washington State L&I (WISHA) serious violation — workplace hazard that could cause death or serious harm.",
    max_penalty: 12000,
    min_penalty: 5000,
    notes: "Washington has separate serious violation minimums ($5,000-$12,000). Also covers agricultural operations not covered under federal OSHA. Ergonomic rules active in WA (unlike federal).",
    standards: ["WAC 296-155"],
    category: "state_plan"
  }
];

async function seedPenalties() {
  console.log(`Seeding ${PENALTIES.length} penalty records...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const record of PENALTIES) {
    const { data, error } = await supabase
      .from("penalty_schedule")
      .upsert(
        {
          violation_type: record.violation_type,
          description: record.description,
          max_penalty: record.max_penalty,
          min_penalty: record.min_penalty,
          notes: record.notes,
          standards: record.standards,
          category: record.category,
          updated_at: new Date().toISOString()
        },
        { onConflict: "violation_type" }
      )
      .select("violation_type, max_penalty");

    if (error) {
      console.log(`  SKIP  ${record.violation_type}: ${error.message}`);
      skipped++;
    } else {
      console.log(`  OK     ${record.violation_type}: max $${record.max_penalty.toLocaleString()} (${record.category})`);
      inserted++;
    }
  }

  const total = PENALTIES.reduce((acc, r) => acc + r.max_penalty, 0);
  console.log(`\nDone: ${inserted} penalty records seeded, ${skipped} skipped`);
  console.log(`Max penalty for willful/repeat: $${(163620).toLocaleString()} per violation`);
  console.log(`Data effective: January 2026 (OSHA annual inflation adjustment)`);
}

seedPenalties().catch(console.error);

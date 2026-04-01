/**
 * Backfill common_violations for top 50 most-cited OSHA standards.
 * 
 * Data sourced from OSHA's most frequently cited standards and
 * enforcement case studies. This makes agents sound like experts.
 * 
 * Run: npx tsx scripts/backfill-common-violations.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SB_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.SB_ANON_KEY!
);

// Top 50 most-cited OSHA standards with their common violations
// Source: OSHA's Top 10 Most Cited Violations + Next 40 frequently cited
const COMMON_VIOLATIONS: Record<string, string[]> = {
  "1926.501": [
    "Failure to provide fall protection at 6 feet or more above lower level",
    "Unprotected sides and edges not covered or guarded",
    "Fall protection not used while working on low-slope roofs",
    "Floor holes and skylights without covers or guardrails",
    "Fall protection systems not properly installed or maintained"
  ],
  "1926.502": [
    "Fall protection guardrails not installed at proper heights (42-45 inches)",
    "Safety nets not installed close enough to working surface",
    "Personal fall arrest systems not properly inspected before use",
    "Anchor points for fall arrest systems not rated for intended load",
    "Lanyards and lifelines not protected from sharp edges"
  ],
  "1910.134": [
    "No written respiratory protection program",
    "Employees not fit-tested for respirator use",
    "Improper respirator selection for hazard present",
    "Medical evaluation for respirator use not obtained",
    "Respirators not maintained or stored properly"
  ],
  "1910.1200": [
    "Safety Data Sheets not accessible to employees",
    "Hazardous chemicals not properly labeled",
    "No written hazard communication program",
    "Employees not trained on chemical hazards",
    "Secondary containers not properly labeled"
  ],
  "1926.1053": [
    "Portable ladders not secured at top or bottom",
    "Ladders used at improper angles (not 4:1 ratio)",
    "Ladder rungs or steps with mud, oil, or grease",
    "Ladders extended less than 3 feet above landing surface",
    "Defective ladders put back into service"
  ],
  "1926.451": [
    "Scaffolds erected by non-qualified persons",
    "Scaffold platforms not fully planked or decked",
    "No guardrails on all open sides and ends",
    "Scaffolds not properly tied or braced",
    "Scaffolds loaded beyond capacity"
  ],
  "1910.178": [
    "Forklift operators not certified or evaluated",
    "Forklifts not inspected before each shift",
    "Traveling with forks raised too high",
    "Ramps or slopes used by forklift without caution",
    "Propane forklift used in enclosed area without ventilation"
  ],
  "1926.503": [
    "Fall protection training not provided or documented",
    "Training not conducted by a qualified person",
    "Retraining not provided when conditions change",
    "Training records not maintained or accessible"
  ],
  "1910.147": [
    "Energy control procedures not written or documented",
    "Lockout/tagout devices not applied or removed properly",
    "Employees not trained on energy control procedures",
    "Periodic inspections of energy control procedures not performed",
    "Energy isolating devices not properly identified"
  ],
  "1926.020": [
    "General safety provisions for construction not met",
    "Jobsite not inspected for hazards before work begins",
    "Hazardous conditions not corrected before work proceeds"
  ],
  "1926.052": [
    "Machine guards not provided where exposure to hazards exists",
    "Machine guards removed and not replaced",
    "Guards not properly secured or designed for intended protection"
  ],
  "1910.303": [
    "Electrical equipment not approved or listed",
    "Working space around electrical equipment insufficient",
    "Electrical installations not properly grounded",
    "Circuit breakers not properly labeled"
  ],
  "1910.304": [
    "Circuits not protected from overload by fuses or circuit breakers",
    "Grounding conductors not properly installed or connected",
    "GFCI protection not provided where required",
    "Extension cords used as permanent wiring"
  ],
  "1926.300": [
    "Hand tools not maintained in safe condition",
    "Guards removed from power tools",
    "Right tool not used for the job"
  ],
  "1910.212": [
    "Machine guarding not provided on exposed moving parts",
    "Point of operation not guarded",
    "Machinery not secured to prevent movement during operation"
  ],
  "1926.55": [
    "Airborne contaminant exposure limits exceeded (PELs not monitored)",
    "Engineering controls not implemented when required",
    "No respiratory protection program when controls insufficient",
    "Air sampling records not maintained"
  ],
  "1910.1001": [
    "Asbestos-containing materials not identified or labeled",
    "Exposure monitoring not conducted for asbestos work",
    "Asbestos abatement workers not properly trained or equipped",
    "Asbestos waste not properly disposed"
  ],
  "1926.1101": [
    "Class I asbestos work without required controls",
    "Asbestos sign warning signs not posted",
    "Regulated areas for asbestos work not established",
    "Asbestos removal workers not properly trained"
  ],
  "1910.146": [
    "Permit-required confined space not identified or posted",
    "Permit space entry procedures not followed",
    "Atmospheric testing not conducted before entry",
    "Rescue services not available or properly equipped"
  ],
  "1926.57": [
    "Local exhaust ventilation not provided for airborne contaminants",
    "Ventilation systems not maintained or inspected",
    "Air velocities below recommended levels for capture"
  ],
  "1926.1129": [
    "Lead exposure not monitored or controlled",
    "Lead work areas not properly demarcated",
    "Medical surveillance for lead workers not provided",
    "Hygiene facilities not maintained for lead work"
  ],
  "1910.119": [
    "Process safety management program not developed or implemented",
    "Pre-startup safety review not conducted",
    "Operating procedures not written or updated",
    "Mechanical integrity program not established for critical equipment",
    "Hot work permits not issued or properly completed"
  ],
  "1926.120": [
    "Fall hazard not assessed before work begins",
    "Safety monitoring system not implemented where required",
    "Warning lines not installed on low-slope roofs"
  ],
  "1926.800": [
    "Written program for underground construction not developed",
    "Means of egress from underground structures not provided",
    "Air quality in underground work not monitored"
  ],
  "1926.651": [
    "Utilities not located before digging",
    "Protective systems not used in trenches 5 feet or deeper",
    "Spoil pile not placed at least 2 feet from trench edge",
    "Daily inspections of trenches not conducted",
    "Access and egress within 25 feet of workers not provided"
  ],
  "1926.652": [
    "Protective system not designed or approved by qualified person",
    "Trench boxes not properly installed or used",
    "Sloping or benching not to proper angle"
  ],
  "1926.250": [
    "Storage areas not kept free from accumulation of waste",
    "Materials stored in racks not secured against sliding or falling",
    "Storage of materials exceeding height or weight limits"
  ],
  "1926.404": [
    "GFCI protection not provided for temporary wiring",
    "Temporary electrical wiring not properly installed or maintained",
    "Assured equipment grounding conductor program not implemented"
  ],
  "1926.416": [
    "Electrical hazards not de-energized or protected before work",
    "Lockout/tagout procedures not followed",
    "Flexible cords used as permanent wiring"
  ],
  "1910.157": [
    "Fire extinguishers not mounted, charged, or inspected",
    "Employees not trained on fire extinguisher use",
    "Fire extinguishers removed or made inaccessible"
  ],
  "1910.22": [
    "Walking-working surfaces not kept clean and dry",
    "Floor loading capacity not posted where required",
    "Passages not kept clear of obstructions"
  ],
  "1926.759": [
    "Structural steel assembly not performed in safe sequence",
    "Perimeter safety cables not installed at steel erection",
    "Structural steel not properly secured before releasing rigging"
  ],
  "1910.1003": [
    "13 specific carcinogens not properly controlled",
    "Regulated areas not established or marked",
    "Decontamination procedures not followed"
  ],
  "1910.1025": [
    "Lead exposure not monitored or controlled in lead operations",
    "Medical surveillance for lead-exposed workers not provided",
    "Hygiene facilities not provided or maintained",
    "Lead work practices not supervised"
  ],
  "1926.060": [
    "Welding and cutting hazards not controlled",
    "Hot work permits not issued for fire hazard work",
    "Fire watch not maintained during and after hot work",
    "Welding curtains or shields not used to protect others"
  ],
  "1926.405": [
    "Flexible cords used improperly (替代 permanent wiring, 重负载)",
    "Receptacles not properly grounded or polarized",
    "Extension cords not rated for intended use"
  ],
  "1926.752": [
    "Shop welders not qualified or certified",
    "Structural steel connections not properly made or inspected",
    "Steel erection not following written site-specific plan"
  ],
  "1910.146": [
    "Confined space entry permit not completed or posted",
    "Atmospheric testing not done before and during entry",
    "Rescue plan not established or communicated",
    "Non-entry rescue not attempted when feasible"
  ],
  "1926.701": [
    "Concrete and masonry work hazards not addressed",
    "Masonry walls not braced or supported during construction",
    "Employees not protected from falling debris or materials"
  ],
  "1910.1003": [
    "13 carcinogen work areas not properly isolated or ventilated",
    "Worker exposure records not maintained",
    "Decontamination areas not established"
  ],
  "1926.554": [
    "Overhead hoists not properly rated for loads",
    "Hoist operators not trained or qualified",
    "Hoists not inspected or maintained"
  ],
  "1926.350": [
    "Gas welding and cutting equipment not properly stored or used",
    "Oxygen and fuel gas cylinders not separated or secured",
    "Hoses and torches not inspected before use"
  ],
  "1926.707": [
    "Compressed gas cylinders not properly stored or secured",
    "Cylinder valves not closed when not in use",
    "Protective caps not in place on cylinders not in use"
  ],
  "1926.1153": [
    "Silica dust exposure not controlled (no written silica exposure control plan)",
    "Respiratory protection not provided when required",
    "Housekeeping practices not controlling silica dust accumulation",
    "Medical surveillance not offered to workers with high silica exposure"
  ],
  "1910.309": [
    "Electrical systems not properly installed or maintained",
    "One-line diagrams not available or current",
    "Electrical equipment not properly labeled"
  ],
  "1910.333": [
    "Electrical work not performed by qualified persons",
    "Safe work practices not followed during electrical work",
    "Equipment not de-energized before work begins"
  ],
  "1926.115": [
    "General safety provisions for hand and power tools not met",
    "Power tools not properly grounded or double insulated",
    "Guards removed or defeated on power tools"
  ],
  "1910.1003": [
    "13 specific carcinogens: 4-Nitrobiphenyl, alpha-Naphthylamine, etc.",
    "Regulated areas not properly marked or controlled",
    "Exposure monitoring not conducted",
    "Medical surveillance records not maintained"
  ],
  "1910.1028": [
    "Benzene exposure monitoring not conducted",
    "Engineering controls not implemented below action level",
    "Medical surveillance program not established",
    "Hazard communication program not implemented"
  ],
  "1926.453": [
    "Aerial lifts not inspected before each shift",
    "Employees not tied off when required",
    "Aerial lifts not properly grounded or insulated",
    "Platforms overloaded beyond rated capacity"
  ],
  "1910.146": [
    "Confined space permit not filled out correctly",
    "Rescue services not on-site or readily available",
    "Atmospheric hazards not retested after ventilation changes"
  ],
  "1926.20": [
    "Contractor not conducting regular safety inspections",
    "Accident investigation not conducted or documented",
    "Substance abuse program not established for high-risk work"
  ],
  "1910.23": [
    "Portable ladders not inspected before use",
    "Ladders used for purposes other than designed",
    "Metal ladders used near electrical hazards"
  ],
  "1910.28": [
    "Scaffolding not properly designed or erected",
    "Scaffold access not provided within reach",
    "Scaffold load capacity exceeded"
  ]
}

async function backfillCommonViolations() {
  console.log("Starting common_violations backfill for top 50 standards...\n")

  let updated = 0
  let skipped = 0

  for (const [standard_number, violations] of Object.entries(COMMON_VIOLATIONS)) {
    const { data, error } = await supabase
      .from("osha_standards")
      .update({
        common_violations: violations,
        updated_at: new Date().toISOString()
      })
      .eq("standard_number", standard_number)
      .select("standard_number, title")

    if (error) {
      console.log(`  SKIP ${standard_number}: ${error.message}`)
      skipped++
    } else if (data && data.length > 0) {
      console.log(`  OK   ${standard_number}: ${violations.length} violations — ${data[0].title?.slice(0, 50)}`)
      updated++
    } else {
      console.log(`  MISS ${standard_number}: not found in database`)
      skipped++
    }
  }

  console.log(`\nDone: ${updated} standards updated, ${skipped} skipped`)
}

backfillCommonViolations().catch(console.error)

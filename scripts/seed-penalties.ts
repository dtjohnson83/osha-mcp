/**
 * Seed OSHA Penalty Schedule
 * 
 * Run: npx tsx scripts/seed-penalties.ts
 * 
 * NOTE: Verify penalty amounts are current before running.
 * OSHA adjusts penalties annually in January.
 * Check: https://www.osha.gov/penalties
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// 2025 penalty amounts (adjusted January 2025)
// Source: https://www.osha.gov/penalties
const penalties = [
  {
    violation_type: "serious",
    min_penalty: 0,
    max_penalty: 16131,
    effective_date: "2025-01-15",
    notes: "Per violation. Penalty may be adjusted based on employer size, good faith, and history."
  },
  {
    violation_type: "other_than_serious",
    min_penalty: 0,
    max_penalty: 16131,
    effective_date: "2025-01-15",
    notes: "Discretionary penalty up to maximum per violation."
  },
  {
    violation_type: "willful",
    min_penalty: 11524,
    max_penalty: 161323,
    effective_date: "2025-01-15",
    notes: "Employer intentionally and knowingly committed violation. Minimum penalty applies."
  },
  {
    violation_type: "repeat",
    min_penalty: 11524,
    max_penalty: 161323,
    effective_date: "2025-01-15",
    notes: "Employer previously cited for substantially similar violation within 5 years."
  },
  {
    violation_type: "failure_to_abate",
    min_penalty: 0,
    max_penalty: 16131,
    effective_date: "2025-01-15",
    notes: "Per day beyond the abatement date. Assessed for each calendar day the violation continues."
  },
  {
    violation_type: "posting_requirements",
    min_penalty: 0,
    max_penalty: 16131,
    effective_date: "2025-01-15",
    notes: "Failure to post OSHA citations, OSHA poster, or required notices."
  }
];

async function main() {
  console.log("Seeding OSHA Penalty Schedule");
  console.log("=".repeat(50));
  
  // Clear existing penalties
  const { error: deleteErr } = await supabase
    .from("penalty_schedule")
    .delete()
    .neq("violation_type", "");
  
  if (deleteErr) {
    console.error("Failed to clear existing penalties:", deleteErr.message);
  }
  
  // Insert
  const { data, error } = await supabase
    .from("penalty_schedule")
    .insert(penalties);
  
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  
  console.log(`Inserted ${penalties.length} penalty records`);
  console.log("\nPenalty Schedule:");
  for (const p of penalties) {
    const min = p.min_penalty > 0 ? `$${p.min_penalty.toLocaleString()}` : "$0";
    const max = `$${p.max_penalty.toLocaleString()}`;
    console.log(`  ${p.violation_type.padEnd(25)} ${min} - ${max}`);
  }
  
  console.log("\nDone! Next step: Run 'npx tsx scripts/validate-data.ts'");
}

main();

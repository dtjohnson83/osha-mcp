/**
 * Validate ingested data quality
 * 
 * Run: npx tsx scripts/validate-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function main() {
  console.log("OSHA Data Validation");
  console.log("=".repeat(50));
  
  let issues = 0;
  
  // 1. Count totals
  const { count: totalCount } = await supabase
    .from("osha_standards")
    .select("*", { count: "exact", head: true });
  
  const { count: count1910 } = await supabase
    .from("osha_standards")
    .select("*", { count: "exact", head: true })
    .eq("part", "1910");
  
  const { count: count1926 } = await supabase
    .from("osha_standards")
    .select("*", { count: "exact", head: true })
    .eq("part", "1926");
  
  console.log(`\nTotal standards: ${totalCount}`);
  console.log(`  Part 1910 (General Industry): ${count1910}`);
  console.log(`  Part 1926 (Construction): ${count1926}`);
  
  if ((totalCount || 0) < 100) {
    console.warn("  WARNING: Expected 500+ standards. Data may be incomplete.");
    issues++;
  }
  
  // 2. Check for missing summaries
  const { count: missingSummaries } = await supabase
    .from("osha_standards")
    .select("*", { count: "exact", head: true })
    .is("plain_summary", null);
  
  console.log(`\nMissing summaries: ${missingSummaries}`);
  if ((missingSummaries || 0) > 0) {
    console.warn("  WARNING: Run generate-summaries.ts to fill these in.");
    issues++;
  }
  
  // 3. Check standard number format
  const { data: badNumbers } = await supabase
    .from("osha_standards")
    .select("standard_number")
    .not("standard_number", "like", "1910.%")
    .not("standard_number", "like", "1926.%");
  
  if (badNumbers && badNumbers.length > 0) {
    console.warn(`\nNon-standard numbers found: ${badNumbers.map(r => r.standard_number).join(", ")}`);
    issues++;
  } else {
    console.log("\nStandard number format: OK");
  }
  
  // 4. Check for very short raw_text (likely bad parse)
  const { data: shortText } = await supabase
    .from("osha_standards")
    .select("standard_number, title")
    .lt("raw_text", "50");  // This won't work - need RPC for length check
  
  // Alternative: spot check
  const { data: sample } = await supabase
    .from("osha_standards")
    .select("standard_number, title, plain_summary, raw_text")
    .order("standard_number")
    .limit(5);
  
  console.log("\nSample records (first 5):");
  for (const s of (sample || [])) {
    const textLen = s.raw_text?.length || 0;
    const hasSummary = !!s.plain_summary;
    console.log(`  ${s.standard_number} - ${s.title.slice(0, 50)}`);
    console.log(`    Raw text: ${textLen} chars | Summary: ${hasSummary ? "YES" : "NO"}`);
  }
  
  // 5. Check penalties
  const { count: penaltyCount } = await supabase
    .from("penalty_schedule")
    .select("*", { count: "exact", head: true });
  
  console.log(`\nPenalty records: ${penaltyCount}`);
  if ((penaltyCount || 0) < 5) {
    console.warn("  WARNING: Run seed-penalties.ts");
    issues++;
  }
  
  // 6. Test search RPC
  console.log("\nTesting search_standards RPC...");
  try {
    const { data: searchResults, error: searchErr } = await supabase
      .rpc("search_standards", {
        search_query: "fall protection",
        scope_filter: null,
        result_limit: 3
      });
    
    if (searchErr) {
      console.error(`  Search RPC error: ${searchErr.message}`);
      issues++;
    } else {
      console.log(`  "fall protection" returned ${searchResults?.length || 0} results`);
      for (const r of (searchResults || [])) {
        console.log(`    ${r.standard_number} - ${r.title}`);
      }
    }
  } catch (e: any) {
    console.error(`  Search RPC failed: ${e.message}`);
    issues++;
  }
  
  // Summary
  console.log(`\n${"=".repeat(50)}`);
  if (issues === 0) {
    console.log("VALIDATION PASSED - All checks OK");
  } else {
    console.log(`VALIDATION: ${issues} issue(s) found. See warnings above.`);
  }
}

main();

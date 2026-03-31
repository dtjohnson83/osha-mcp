/**
 * Generate Plain-English Summaries
 * 
 * Reads raw standards from Supabase, sends to Claude Sonnet for summarization,
 * and updates the records with structured metadata.
 * 
 * Run: npx tsx scripts/generate-summaries.ts
 * 
 * Requires ANTHROPIC_API_KEY in .env
 * Estimated cost: ~$30-50 for 500-700 sections
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in .env");
  process.exit(1);
}

const BATCH_SIZE = 5;
const DELAY_MS = 1500; // Between batches to respect rate limits
const MAX_TEXT_LENGTH = 12000; // Truncate very long standards to manage token costs

interface SummaryResult {
  plain_summary: string;
  key_requirements: string[];
  applicable_hazards: string[];
  ppe_requirements: string[];
  common_violations: string[];
  keywords: string[];
}

async function callClaude(standardNumber: string, title: string, rawText: string): Promise<SummaryResult | null> {
  const truncatedText = rawText.length > MAX_TEXT_LENGTH 
    ? rawText.slice(0, MAX_TEXT_LENGTH) + "\n[... truncated for processing ...]" 
    : rawText;

  const prompt = `You are a workplace safety expert and OSHA compliance advisor. Given this OSHA regulation text, produce a structured analysis.

IMPORTANT RULES:
- Be precise. If the standard says "6 feet" do not say "certain height." Include specific numbers, distances, weights, and thresholds.
- Key requirements should be what employers MUST do to comply.
- PPE requirements should only list PPE explicitly required by THIS standard, not general best practices.
- If the standard does not specify PPE, return an empty array for ppe_requirements.
- Keywords should be terms someone would search to find this standard.

Standard: ${standardNumber} - ${title}

Regulatory Text:
${truncatedText}

Respond ONLY with valid JSON matching this exact schema (no markdown, no backticks, no explanation):
{
  "plain_summary": "2-3 sentence plain-English summary",
  "key_requirements": ["requirement 1", "requirement 2"],
  "applicable_hazards": ["hazard 1", "hazard 2"],
  "ppe_requirements": ["ppe item 1"],
  "common_violations": ["violation 1", "violation 2"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  API error for ${standardNumber}: ${res.status} ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    
    // Clean and parse JSON
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as SummaryResult;
    
    // Validate structure
    if (!parsed.plain_summary || !Array.isArray(parsed.key_requirements)) {
      console.warn(`  Invalid structure for ${standardNumber}`);
      return null;
    }
    
    return parsed;
  } catch (err: any) {
    console.error(`  Failed to summarize ${standardNumber}: ${err.message}`);
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("OSHA Standards Summary Generator");
  console.log("=".repeat(50));
  
  // Fetch standards that don't have summaries yet
  const { data: standards, error } = await supabase
    .from("osha_standards")
    .select("id, standard_number, title, raw_text")
    .is("plain_summary", null)
    .order("standard_number");
  
  if (error) {
    console.error("Failed to fetch standards:", error.message);
    process.exit(1);
  }
  
  if (!standards || standards.length === 0) {
    console.log("All standards already have summaries. Nothing to do.");
    return;
  }
  
  console.log(`Found ${standards.length} standards needing summaries`);
  console.log(`Estimated batches: ${Math.ceil(standards.length / BATCH_SIZE)}`);
  console.log(`Estimated time: ~${Math.ceil(standards.length / BATCH_SIZE * DELAY_MS / 60000)} minutes`);
  console.log("");
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < standards.length; i += BATCH_SIZE) {
    const batch = standards.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(standards.length / BATCH_SIZE);
    
    console.log(`Batch ${batchNum}/${totalBatches}: ${batch.map(s => s.standard_number).join(", ")}`);
    
    // Process batch in parallel
    const results = await Promise.all(
      batch.map(async (standard) => {
        const summary = await callClaude(
          standard.standard_number, 
          standard.title, 
          standard.raw_text
        );
        return { id: standard.id, standard_number: standard.standard_number, summary };
      })
    );
    
    // Update Supabase with results
    for (const result of results) {
      if (result.summary) {
        const { error: updateErr } = await supabase
          .from("osha_standards")
          .update({
            plain_summary: result.summary.plain_summary,
            key_requirements: result.summary.key_requirements,
            applicable_hazards: result.summary.applicable_hazards,
            ppe_requirements: result.summary.ppe_requirements,
            common_violations: result.summary.common_violations,
            keywords: result.summary.keywords,
            updated_at: new Date().toISOString()
          })
          .eq("id", result.id);
        
        if (updateErr) {
          console.error(`  DB update failed for ${result.standard_number}: ${updateErr.message}`);
          failed++;
        } else {
          success++;
        }
      } else {
        failed++;
      }
    }
    
    console.log(`  Progress: ${success} success, ${failed} failed, ${standards.length - success - failed} remaining`);
    
    // Rate limit delay
    if (i + BATCH_SIZE < standards.length) {
      await sleep(DELAY_MS);
    }
  }
  
  console.log(`\n${"=".repeat(50)}`);
  console.log("SUMMARY GENERATION COMPLETE");
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log("=".repeat(50));
  
  if (failed > 0) {
    console.log("\nRe-run this script to retry failed standards.");
  }
  
  console.log("\nNext step: Run 'npx tsx scripts/seed-penalties.ts' to add penalty data.");
}

main();

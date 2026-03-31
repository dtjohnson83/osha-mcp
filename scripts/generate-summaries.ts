/**
 * Generate Plain-English Summaries for OSHA Standards
 *
 * Two modes:
 *   1. With ANTHROPIC_API_KEY: Sends raw text to Claude for high-quality AI summaries
 *   2. Without API key: Extracts summaries from raw text using keyword/pattern analysis
 *
 * Run: npx tsx scripts/generate-summaries.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const USE_API = !!ANTHROPIC_API_KEY;

const API_BATCH_SIZE = 5;
const LOCAL_BATCH_SIZE = 20;
const DELAY_MS = 1500;
const MAX_TEXT_LENGTH = 12000;

interface SummaryResult {
  plain_summary: string;
  key_requirements: string[];
  applicable_hazards: string[];
  ppe_requirements: string[];
  common_violations: string[];
  keywords: string[];
}

// ---------------------------------------------------------------------------
// API-based summarization (requires ANTHROPIC_API_KEY)
// ---------------------------------------------------------------------------

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
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  API error for ${standardNumber}: ${res.status} ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as SummaryResult;

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

// ---------------------------------------------------------------------------
// Local text-extraction summarization (no API key needed)
// ---------------------------------------------------------------------------

const PPE_MAP: Record<string, string[]> = {
  "hard hat": ["hard hat", "head protection", "protective helmet", "safety helmet"],
  "safety glasses": ["eye protection", "safety glasses", "safety goggles", "protective eyewear", "eye and face protection"],
  "face shield": ["face shield", "face protection"],
  "hearing protection": ["hearing protection", "ear protection", "earplugs", "ear muffs", "noise reduction"],
  "respirator": ["respirator", "respiratory protection", "breathing apparatus", "SCBA", "air-purifying"],
  "safety gloves": ["protective gloves", "hand protection", "safety gloves", "chemical-resistant gloves"],
  "safety shoes": ["foot protection", "safety shoes", "safety-toe", "protective footwear", "steel-toe"],
  "fall protection harness": ["fall protection", "body harness", "personal fall arrest", "safety harness", "lanyard"],
  "high-visibility vest": ["high-visibility", "reflective vest", "visibility apparel"],
  "protective clothing": ["protective clothing", "chemical protective", "flame-resistant", "FR clothing", "protective garments"],
  "life jacket": ["life jacket", "personal flotation", "PFD"],
};

const HAZARD_MAP: Record<string, string[]> = {
  "fall hazards": ["fall", "falling", "elevated", "height", "scaffold", "ladder", "roof", "floor opening", "wall opening"],
  "electrical hazards": ["electric", "electrical", "voltage", "shock", "electrocution", "arc flash", "grounding", "wiring"],
  "chemical exposure": ["chemical", "toxic", "hazardous substance", "carcinogen", "exposure limit", "PEL", "TLV", "airborne"],
  "fire hazards": ["fire", "flammable", "combustible", "ignition", "extinguisher", "sprinkler"],
  "explosion hazards": ["explosion", "explosive", "blast", "detonation", "blasting"],
  "noise hazards": ["noise", "decibel", "dB", "hearing loss", "audiometric", "sound level"],
  "struck-by hazards": ["struck by", "struck-by", "falling object", "flying object", "projectile"],
  "caught-in hazards": ["caught in", "caught-in", "caught between", "entangle", "entrap", "pinch point", "nip point"],
  "confined space hazards": ["confined space", "permit-required", "atmospheric hazard", "engulfment"],
  "ergonomic hazards": ["ergonomic", "repetitive", "musculoskeletal", "lifting", "manual handling"],
  "heat stress": ["heat stress", "heat illness", "heat stroke", "heat exhaustion", "hot environment"],
  "respiratory hazards": ["respiratory", "inhalation", "dust", "fume", "vapor", "mist", "oxygen deficient"],
  "radiation hazards": ["radiation", "ionizing", "non-ionizing", "laser", "radioactive", "X-ray"],
  "biological hazards": ["biological", "bloodborne", "pathogen", "infectious", "biohazard"],
  "excavation hazards": ["excavation", "trench", "cave-in", "shoring", "sloping", "benching"],
  "machinery hazards": ["machine guard", "moving parts", "rotating", "power transmission", "lockout", "tagout"],
  "welding hazards": ["welding", "cutting", "brazing", "hot work", "arc welding"],
  "crane hazards": ["crane", "hoist", "derrick", "rigging", "sling", "load capacity"],
};

function extractSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 500);
}

function extractRequirements(text: string): string[] {
  const sentences = extractSentences(text);
  const requirements: string[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    if (!/\b(shall|must|required to|is required|are required|employer shall|employer must|each employer)\b/i.test(sentence)) continue;
    if (/\b(means|refers to|definition|purpose of this|scope of this|applies to)\b/i.test(sentence)) continue;

    const cleaned = sentence
      .replace(/^\(\w+\)\s*/, "")
      .replace(/^\d+\.\s*/, "")
      .trim();

    if (cleaned.length > 20 && cleaned.length < 400) {
      const key = cleaned.toLowerCase().slice(0, 60);
      if (!seen.has(key)) {
        seen.add(key);
        requirements.push(cleaned);
      }
    }
  }

  return requirements.slice(0, 10);
}

function extractPPE(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const [ppeName, keywords] of Object.entries(PPE_MAP)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        const idx = lowerText.indexOf(kw.toLowerCase());
        const context = lowerText.slice(Math.max(0, idx - 200), idx + 200);
        if (/\b(shall|must|required|provide|wear|use|equip)\b/.test(context)) {
          found.push(ppeName);
          break;
        }
      }
    }
  }

  return [...new Set(found)];
}

function extractHazards(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const [hazardName, keywords] of Object.entries(HAZARD_MAP)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        found.push(hazardName);
        break;
      }
    }
  }

  return found.slice(0, 6);
}

function extractKeywords(standardNumber: string, title: string, text: string): string[] {
  const keywords: string[] = [standardNumber];

  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["this", "that", "with", "from", "shall", "must", "general", "standard"].includes(w));
  keywords.push(...titleWords);

  const industryTerms = [
    "scaffold", "ladder", "crane", "excavation", "trench", "welding", "electrical",
    "lockout", "tagout", "confined space", "fall protection", "respirator",
    "hazcom", "hazard communication", "bloodborne", "asbestos", "lead",
    "silica", "noise", "ergonomic", "forklift", "powered industrial truck",
    "fire protection", "exit route", "emergency", "first aid", "machine guarding",
    "abrasive blasting", "demolition", "concrete", "masonry", "steel erection",
    "underground construction", "compressed gas", "flammable liquid", "explosive",
    "permit-required", "walking-working surface", "stairway", "guardrail",
    "personal protective equipment", "PPE", "ventilation", "sanitation",
  ];

  const lowerText = text.toLowerCase();
  for (const term of industryTerms) {
    if (lowerText.includes(term) && !keywords.includes(term)) {
      keywords.push(term);
    }
  }

  return [...new Set(keywords)].slice(0, 12);
}

function generateLocalSummary(standardNumber: string, title: string, rawText: string): SummaryResult {
  const sentences = extractSentences(rawText);
  const requirements = extractRequirements(rawText);
  const ppe = extractPPE(rawText);
  const hazards = extractHazards(rawText);
  const keywords = extractKeywords(standardNumber, title, rawText);

  const scope = standardNumber.startsWith("1910") ? "general industry" : "construction";

  // Build plain summary
  let summary = "";
  const scopeSentences = sentences.filter((s) =>
    /\b(applies to|covers|establishes|sets forth|provides|addresses|purpose)\b/i.test(s)
  );

  if (scopeSentences.length > 0) {
    summary = `OSHA ${scope} standard ${standardNumber} (${title}). ${scopeSentences[0]}`;
  } else if (requirements.length > 0) {
    summary = `OSHA ${scope} standard ${standardNumber} (${title}) establishes requirements for employers. ${requirements[0]}`;
  } else {
    summary = `OSHA ${scope} standard ${standardNumber} covers ${title.toLowerCase()}. This standard applies to ${scope} workplaces and establishes safety requirements for employers.`;
  }

  if (summary.length > 500) {
    summary = summary.slice(0, 497) + "...";
  }

  // Generate common violations by inverting requirements
  const violations = requirements.slice(0, 5).map((req) =>
    req
      .replace(/\bshall\b/gi, "failed to")
      .replace(/\bmust\b/gi, "failed to")
      .replace(/\bThe employer\b/gi, "Employer")
      .replace(/\beach employer\b/gi, "Employer")
      .replace(/\bEmployers\b/gi, "Employer")
  ).filter((v) => v.length < 300);

  return {
    plain_summary: summary,
    key_requirements: requirements,
    applicable_hazards: hazards,
    ppe_requirements: ppe,
    common_violations: violations.slice(0, 5),
    keywords,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("OSHA Standards Summary Generator");
  console.log("=".repeat(50));

  if (USE_API) {
    console.log("Mode: API (Claude Sonnet) — high-quality AI summaries");
    console.log("Estimated cost: ~$30-50 for 500 sections\n");
  } else {
    console.log("Mode: Local text extraction — no API key needed");
    console.log("Tip: Set ANTHROPIC_API_KEY in .env for AI-powered summaries\n");
  }

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

  const batchSize = USE_API ? API_BATCH_SIZE : LOCAL_BATCH_SIZE;
  console.log(`Found ${standards.length} standards needing summaries`);
  console.log(`Batch size: ${batchSize}`);
  if (USE_API) {
    console.log(`Estimated time: ~${Math.ceil((standards.length / batchSize) * DELAY_MS / 60000)} minutes`);
  }
  console.log("");

  let success = 0;
  let failed = 0;

  for (let i = 0; i < standards.length; i += batchSize) {
    const batch = standards.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(standards.length / batchSize);

    console.log(`Batch ${batchNum}/${totalBatches}: ${batch.map((s) => s.standard_number).join(", ")}`);

    // Generate summaries
    const results = await Promise.all(
      batch.map(async (standard) => {
        let summary: SummaryResult | null;
        if (USE_API) {
          summary = await callClaude(standard.standard_number, standard.title, standard.raw_text);
        } else {
          summary = generateLocalSummary(standard.standard_number, standard.title, standard.raw_text || "");
        }
        return { id: standard.id, standard_number: standard.standard_number, summary };
      })
    );

    // Update Supabase
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
            updated_at: new Date().toISOString(),
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

    // Rate limit delay for API mode
    if (USE_API && i + batchSize < standards.length) {
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
}

main();

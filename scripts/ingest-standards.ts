/**
 * OSHA Standards Ingestion Script
 * 
 * Fetches Title 29 Parts 1910 and 1926 from the eCFR API,
 * parses sections, and inserts raw data into Supabase.
 * 
 * Run: npx tsx scripts/ingest-standards.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const ECFR_BASE = "https://www.ecfr.gov";
const TODAY = new Date().toISOString().split("T")[0];

interface ECFRSection {
  identifier: string;
  label: string;
  label_level: string;
  label_description: string;
  reserved: boolean;
  type: string;
  children?: ECFRSection[];
}

interface ParsedStandard {
  standard_number: string;
  title: string;
  subpart: string;
  part: string;
  scope: string;
  raw_text: string;
  ecfr_url: string;
}

// ----- Step 1: Get structure (table of contents) -----

async function fetchStructure(part: string): Promise<any> {
  const url = `${ECFR_BASE}/api/versioner/v1/structure/${TODAY}/title-29.json?part=${part}`;
  console.log(`Fetching structure for Part ${part}...`);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Structure fetch failed: ${res.status} ${res.statusText}`);
  
  const data = await res.json();
  return data;
}

// ----- Step 2: Extract section list from structure -----

function extractSections(
  node: any, 
  part: string, 
  currentSubpart: string = ""
): { number: string; title: string; subpart: string }[] {
  const sections: { number: string; title: string; subpart: string }[] = [];
  
  // Track current subpart as we traverse
  let subpart = currentSubpart;
  if (node.type === "subpart" && node.label) {
    subpart = node.label + (node.label_description ? " - " + node.label_description : "");
  }
  
  // If this is a section node
  if (node.type === "section" && node.identifier && !node.reserved) {
    const sectionNum = node.identifier;
    const title = node.label_description || node.label || sectionNum;
    sections.push({
      number: sectionNum,
      title: title,
      subpart: subpart
    });
  }
  
  // Recurse into children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      sections.push(...extractSections(child, part, subpart));
    }
  }
  
  return sections;
}

// ----- Step 3: Fetch full text for a section -----

async function fetchSectionText(sectionNumber: string): Promise<string> {
  // eCFR full text endpoint - get XML for the specific section
  const url = `${ECFR_BASE}/api/versioner/v1/full/${TODAY}/title-29.xml?section=${sectionNumber}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Failed to fetch ${sectionNumber}: ${res.status}`);
    return "";
  }
  
  const xml = await res.text();
  
  // Strip XML tags to get plain text
  // This is a simple approach; the XML structure varies
  const plainText = xml
    .replace(/<[^>]+>/g, " ")  // Remove XML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x2019;/g, "'")
    .replace(/\s+/g, " ")      // Normalize whitespace
    .trim();
  
  return plainText;
}

// ----- Alternative: Fetch entire part as XML and parse -----

async function fetchFullPartText(part: string): Promise<string> {
  const url = `${ECFR_BASE}/api/versioner/v1/full/${TODAY}/title-29.xml?part=${part}`;
  console.log(`Fetching full text for Part ${part} (this may take a moment)...`);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Full text fetch failed: ${res.status}`);
  
  return await res.text();
}

function extractSectionTextFromXML(fullXML: string, sectionNumber: string): string {
  // Look for the section in the full XML
  // eCFR XML uses tags like <DIV8> for sections with N="1910.134"
  // This regex approach is imperfect but workable for V1
  
  const escapedNum = sectionNumber.replace(".", "\\.");
  
  // Try to find section block
  const patterns = [
    new RegExp(`<SECTNO>[^<]*${escapedNum}[^<]*</SECTNO>([\\s\\S]*?)(?=<SECTNO>|</DIV|$)`, "i"),
    new RegExp(`N="${escapedNum}"[^>]*>([\\s\\S]*?)(?=N="\\d|</DIV)`, "i"),
  ];
  
  for (const pattern of patterns) {
    const match = fullXML.match(pattern);
    if (match && match[1]) {
      return match[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  
  return "";
}

// ----- Step 4: Insert into Supabase -----

async function insertStandards(standards: ParsedStandard[]): Promise<void> {
  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < standards.length; i += batchSize) {
    const batch = standards.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from("osha_standards")
      .upsert(batch, { onConflict: "standard_number" });
    
    if (error) {
      console.error(`  Batch insert error at ${i}: ${error.message}`);
    } else {
      console.log(`  Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }
}

// ----- Main -----

async function ingestPart(part: string) {
  const scope = part === "1910" ? "general_industry" : "construction";
  
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Ingesting Part ${part} (${scope})`);
  console.log("=".repeat(50));
  
  // Step 1: Get structure
  const structure = await fetchStructure(part);
  
  // Step 2: Extract section list
  const sections = extractSections(structure, part);
  console.log(`Found ${sections.length} sections in Part ${part}`);
  
  // Step 3: Fetch full part XML (more efficient than per-section)
  const fullXML = await fetchFullPartText(part);
  console.log(`Full XML fetched: ${(fullXML.length / 1024 / 1024).toFixed(1)} MB`);
  
  // Step 4: Parse each section
  const standards: ParsedStandard[] = [];
  let extracted = 0;
  let skipped = 0;
  
  for (const section of sections) {
    const rawText = extractSectionTextFromXML(fullXML, section.number);
    
    if (!rawText || rawText.length < 20) {
      skipped++;
      continue;
    }
    
    standards.push({
      standard_number: section.number,
      title: section.title,
      subpart: section.subpart,
      part: part,
      scope: scope,
      raw_text: rawText,
      ecfr_url: `https://www.ecfr.gov/current/title-29/section-${section.number}`
    });
    
    extracted++;
  }
  
  console.log(`Extracted ${extracted} sections, skipped ${skipped} empty/reserved`);
  
  // Step 5: Insert
  if (standards.length > 0) {
    console.log("Inserting into Supabase...");
    await insertStandards(standards);
    console.log(`Part ${part} ingestion complete!`);
  }
  
  return standards.length;
}

async function main() {
  console.log("OSHA Standards Ingestion");
  console.log(`Date: ${TODAY}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL}`);
  
  try {
    const count1910 = await ingestPart("1910");
    const count1926 = await ingestPart("1926");
    
    console.log(`\n${"=".repeat(50)}`);
    console.log("INGESTION COMPLETE");
    console.log(`Part 1910: ${count1910} standards`);
    console.log(`Part 1926: ${count1926} standards`);
    console.log(`Total: ${count1910 + count1926} standards`);
    console.log("=".repeat(50));
    console.log("\nNext step: Run 'npx tsx scripts/generate-summaries.ts' to generate plain-English summaries.");
  } catch (err) {
    console.error("Ingestion failed:", err);
    process.exit(1);
  }
}

main();

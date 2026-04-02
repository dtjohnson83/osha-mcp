/**
 * Seed NAICS-to-OSHA-standards mapping table.
 * 
 * Top welding-relevant NAICS codes with applicable standards.
 * Source: OSHA guidance + industry standards mapping research.
 * 
 * Run: npx tsx scripts/seed-naics.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SB_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.SB_ANON_KEY!
);

interface NAICSMapping {
  naics_code: string;
  industry_description: string;
  applicable_standards: string[];
  notes: string;
}

const NAICS_MAPPINGS: NAICSMapping[] = [
  {
    naics_code: "238210",
    industry_description: "Electrical Contractors and Other Wiring Installation Contractors",
    applicable_standards: [
      "1910.147 - Control of Hazardous Energy (Lockout/Tagout)",
      "1910.303 - General Electrical Requirements",
      "1910.304 - Wiring Design and Protection",
      "1910.305 - Electrical Equipment",
      "1910.333 - Electrical Protective Equipment",
      "1926.405 - Electrical Wiring Methods",
      "1926.416 - General Electrical Requirements",
      "1926.417 - Lockout and Tagging of Circuits"
    ],
    notes: "Electricians face high rates of electrical shock, arc flash, and lockout/tagout hazards. Primary concerns: 1910.333 for PPE, 1910.147 for energy isolation."
  },
  {
    naics_code: "238190",
    industry_description: "Other Foundation, Structure, and Building Exterior Contractors",
    applicable_standards: [
      "1926.500 - Fall Protection (Scope/Single-family housing)",
      "1926.501 - Duty to Have Fall Protection",
      "1926.502 - Fall Protection Systems Criteria",
      "1926.503 - Fall Protection Training",
      "1926.752 - Steel Erection (structural)",
      "1926.701 - Concrete and Masonry",
      "1926.651 - Excavation (trenches)",
      "1926.652 - Requirements for Protective Systems"
    ],
    notes: "Structural steel and exterior contractors have the highest fall fatality rate of any construction segment. 1926.501 is the most cited standard in construction."
  },
  {
    naics_code: "238120",
    industry_description: "Structural Steel and Precast Concrete Contractors",
    applicable_standards: [
      "1926.500 - Fall Protection",
      "1926.501 - Duty to Have Fall Protection",
      "1926.502 - Fall Protection Systems Criteria",
      "1926.503 - Fall Protection Training",
      "1926.752 - Steel Erection (general requirements)",
      "1926.753 - Steel Erection (hoisting and rigging)",
      "1926.759 - Steel Erection (fall protection during erection)",
      "1926.760 - Fall Protection (steel decking)",
      "1926.701 - Concrete and Masonry",
      "1926.250 - General Materials Handling"
    ],
    notes: "Steel erection has some of the most specific OSHA requirements, including special fall protection rules for skeleton steel construction (1926.759)."
  },
  {
    naics_code: "332710",
    industry_description: "Machine Shops",
    applicable_standards: [
      "1910.147 - Control of Hazardous Energy (Lockout/Tagout)",
      "1910.212 - General Requirements for Machines",
      "1910.217 - Mechanical Power Presses",
      "1910.219 - Mechanical Power-Transmissions Apparatus",
      "1910.95 - Occupational Noise Exposure",
      "1910.132 - Personal Protective Equipment (General)",
      "1910.134 - Respiratory Protection",
      "1910.146 - Permit-Required Confined Spaces",
      "1910.178 - Powered Industrial Trucks (forklifts)"
    ],
    notes: "Machine shops face rotating machinery hazards, noise exposure, and hazardous materials (cutting fluids). 1910.217 mechanical power presses are a leading injury source."
  },
  {
    naics_code: "332312",
    industry_description: "Fabricated Structural Metal Manufacturing",
    applicable_standards: [
      "1910.147 - Control of Hazardous Energy",
      "1910.212 - General Requirements for Machines",
      "1910.219 - Mechanical Power-Transmissions Apparatus",
      "1910.177 - Steel Erection ( OSHA construction standard applies if doing construction work)",
      "1926.752 - Steel Erection (if construction)",
      "1910.1200 - Hazard Communication",
      "1910.134 - Respiratory Protection",
      "1910.132 - Personal Protective Equipment"
    ],
    notes: "Fabricated metal manufacturers that perform construction (e.g., installing structural steel) are subject to 29 CFR 1926 (construction) standards, not just 1910."
  },
  {
    naics_code: "335129",
    industry_description: "Residential Electric Lighting Equipment Manufacturing",
    applicable_standards: [
      "1910.134 - Respiratory Protection",
      "1910.1000 - Air Contaminants (air quality)",
      "1910.1200 - Hazard Communication",
      "1910.132 - Personal Protective Equipment",
      "1910.212 - General Requirements for Machines",
      "1910.178 - Powered Industrial Trucks",
      "1910.147 - Control of Hazardous Energy"
    ],
    notes: "Manufacturing facilities with industrial processes may be subject to both general industry (1910) and construction (1926) standards depending on the work performed."
  },
  {
    naics_code: "333514",
    industry_description: "Special Die and Tool, Die Set, Jig, and Fixture Manufacturing",
    applicable_standards: [
      "1910.147 - Control of Hazardous Energy",
      "1910.212 - General Requirements for Machines",
      "1910.217 - Mechanical Power Presses",
      "1910.219 - Mechanical Power-Transmissions Apparatus",
      "1910.132 - Personal Protective Equipment",
      "1910.178 - Powered Industrial Trucks"
    ],
    notes: "Die and tool shops with punch presses face some of the highest amputation rates in manufacturing. 1910.217 governs press guarding."
  },
  {
    naics_code: "423510",
    industry_description: "Metal Service Centers and Other Metal Merchant Wholesalers",
    applicable_standards: [
      "1910.176 - Materials Handling (storage)",
      "1910.177 - Servicing Multi-Piece and Single-Piece Rim Wheels",
      "1910.178 - Powered Industrial Trucks (forklifts)",
      "1910.132 - Personal Protective Equipment",
      "1910.212 - General Requirements for Machines (saw, shear hazards)",
      "1910.147 - Control of Hazardous Energy",
      "1910.22 - Walking-Working Surfaces (aisles, floors)"
    ],
    notes: "Metal service centers have high forklift traffic, heavy lifting, and exposure to metal shards. Top hazards: forklift incidents, struck-by, slips/trips."
  },
  {
    naics_code: "454390",
    industry_description: "Other Direct Selling Establishments (welding supply distributors)",
    applicable_standards: [
      "1910.101 - Compressed Gas Cylinders (storage)",
      "1910.134 - Respiratory Protection (if filling)",
      "1910.178 - Powered Industrial Trucks (forklift)",
      "1910.176 - Materials Handling (storage)",
      "1910.132 - Personal Protective Equipment",
      "1910.253 - Oxygen-Fuel Gas Welding and Cutting (if performing welding)"
    ],
    notes: "Welding supply distributors that handle cylinders face specific hazards around compressed gas storage, forklift operations, and potential on-site welding work."
  },
  {
    naics_code: "541350",
    industry_description: "Building Inspection Services",
    applicable_standards: [
      "1910.134 - Respiratory Protection (if inspecting hazardous environments)",
      "1910.146 - Permit-Required Confined Spaces (if inspecting tanks/plant)",
      "1926.501 - Fall Protection (if inspecting roofs/structures)",
      "1910.95 - Occupational Noise Exposure",
      "1910.132 - Personal Protective Equipment"
    ],
    notes: "Building inspectors entering active construction sites or industrial facilities need same protections as workers. 1926.501 fall protection applies when inspecting elevated areas."
  },
  {
    naics_code: "541710",
    industry_description: "Research and Development in the Physical, Engineering, and Life Sciences (welding R&D)",
    applicable_standards: [
      "1910.1200 - Hazard Communication",
      "1910.134 - Respiratory Protection",
      "1910.146 - Permit-Required Confined Spaces",
      "1910.132 - Personal Protective Equipment",
      "1910.147 - Control of Hazardous Energy",
      "1910.95 - Occupational Noise Exposure",
      "1926.350 - Gas Welding and Cutting",
      "1926.352 - Fire Prevention (welding/cutting)",
      "1926.353 - Ventilation and Protection in Welding"
    ],
    notes: "R&D labs performing welding or heat treatments must follow same OSHA standards as production facilities, plus any state-plan requirements."
  },
  {
    naics_code: "611519",
    industry_description: "Other Technical and Trade Schools (welding schools)",
    applicable_standards: [
      "1910.132 - Personal Protective Equipment (student PPE)",
      "1910.146 - Permit-Required Confined Spaces (if training in tanks/vessels)",
      "1926.350 - Gas Welding and Cutting (training)",
      "1926.352 - Fire Prevention (welding areas)",
      "1926.353 - Ventilation and Protection in Welding",
      "1926.354 - Welding in Confined Spaces",
      "1910.253 - Oxygen-Fuel Gas Welding and Cutting",
      "1910.147 - Control of Hazardous Energy (machine shop training)",
      "1910.178 - Powered Industrial Trucks (forklift training)"
    ],
    notes: "Welding trade schools are a critical OSHA compliance gap. Students often lack PPE, proper ventilation, and fire safety equipment. 1926.353 (welding ventilation) is frequently violated."
  },
  {
    naics_code: "238150",
    industry_description: "Glass and Glazing Contractors",
    applicable_standards: [
      "1926.501 - Duty to Have Fall Protection",
      "1926.502 - Fall Protection Systems Criteria",
      "1926.503 - Fall Protection Training",
      "1926.250 - General Materials Handling",
      "1926.751 - Steel Erection (if structural)",
      "1910.132 - Personal Protective Equipment",
      "1926.054 - Exposure to Environmental Hazards (crystalline silica)"
    ],
    notes: "Glass and glazing work is exclusively at elevation. Fall protection (1926.501) is the most cited violation for this trade. Workers also face silica exposure from cutting/drilling."
  },
  {
    naics_code: "324199",
    industry_description: "All Other Petroleum and Coal Products Manufacturing",
    applicable_standards: [
      "1910.119 - Process Safety Management (highly hazardous chemicals)",
      "1910.120 - Hazardous Waste Operations and Emergency Response",
      "1910.134 - Respiratory Protection",
      "1910.1000 - Air Contaminants (PELs)",
      "1910.1200 - Hazard Communication",
      "1910.146 - Permit-Required Confined Spaces",
      "1910.147 - Control of Hazardous Energy",
      "1910.106 - Flammable and Combustible Liquids"
    ],
    notes: "Petroleum and coal manufacturing involves some of the most complex OSHA standards. 1910.119 (PSM) applies if threshold quantities of highly hazardous chemicals are present."
  },
  {
    naics_code: "331210",
    industry_description: "Iron and Steel Forging",
    applicable_standards: [
      "1910.147 - Control of Hazardous Energy",
      "1910.215 - Mechanical Guarding (forging machinery)",
      "1910.216 - Forging and Machine Tooling",
      "1910.219 - Mechanical Power-Transmissions Apparatus",
      "1910.132 - Personal Protective Equipment (heat, sparks)",
      "1910.1000 - Air Contaminants (metal fumes)",
      "1910.134 - Respiratory Protection"
    ],
    notes: "Forging operations have extremely high injury rates. Primary hazards: burns from hot metal/sparks, impact injuries from dies and hammers, and noise exposure. 1910.216 covers forging machine safety."
  },
  {
    naics_code: "333992",
    industry_description: "Welding and Soldering Equipment Manufacturing",
    applicable_standards: [
      "1910.147 - Control of Hazardous Energy",
      "1910.178 - Powered Industrial Trucks",
      "1910.212 - General Requirements for Machines",
      "1910.219 - Mechanical Power-Transmissions Apparatus",
      "1910.253 - Oxygen-Fuel Gas Welding and Cutting (manufacturing floors)",
      "1910.132 - Personal Protective Equipment",
      "1910.1200 - Hazard Communication",
      "1910.306 - Electric Welders-Circuits and Controls"
    ],
    notes: "Welding equipment manufacturers often have manufacturing floors with welding operations subject to 1910 standards, plus assembly operations with standard machine guarding requirements."
  },
  {
    naics_code: "611513",
    industry_description: "Apprenticeship Training (union apprenticeships - ironworkers, boilermakers)",
    applicable_standards: [
      "1926.500 - Fall Protection (construction)",
      "1926.501 - Duty to Have Fall Protection",
      "1926.502 - Fall Protection Systems Criteria",
      "1926.503 - Fall Protection Training",
      "1926.350 - Gas Welding and Cutting",
      "1926.352 - Fire Prevention",
      "1926.353 - Ventilation and Protection in Welding",
      "1926.354 - Welding in Confined Spaces",
      "1926.651 - Excavation",
      "1926.652 - Requirements for Protective Systems"
    ],
    notes: "Union apprenticeship programs (ironworkers, boilermakers, sheet metal workers) are extensively covered by construction standards. OSHA 1926 series is primary reference. Journeymen and apprentices must receive same fall protection."
  },
  {
    naics_code: "236220",
    industry_description: "Commercial and Institutional Building Construction",
    applicable_standards: [
      "1926.501 - Duty to Have Fall Protection",
      "1926.502 - Fall Protection Systems Criteria",
      "1926.503 - Fall Protection Training",
      "1926.451 - Scaffolding",
      "1926.500 - Fall Protection (scope/applicability)",
      "1926.651 - Excavation",
      "1926.652 - Requirements for Protective Systems",
      "1926.404 - Electrical - Temporary Wiring",
      "1926.405 - Electrical - Wiring Methods",
      "1926.250 - General Materials Handling",
      "1926.1153 - Silica (concrete cutting/drilling)"
    ],
    notes: "Commercial construction is OSHA's most-inspected sector. Top violations: fall protection (1926.501), scaffolding (1926.451), ladders (1926.1053). Multi-employer worksite policy applies — both prime and subcontractors can be cited."
  },
  {
    naics_code: "488390",
    industry_description: "Other Support Activities for Water Transportation (shipyard welding and repair)",
    applicable_standards: [
      "1915 - Shipyard Employment (OSH Act coverage)",
      "1915.51 - Confined and Enclosed Spaces",
      "1915.74 - Confined and Enclosed Spaces (other)",
      "1915.84 - Compressed Gas",
      "1915.91 - Grinding Wheels",
      "1915.92 - Welding and Cutting",
      "1915.93 - Painting",
      "1915.116 - Eye Protection",
      "1910.134 - Respiratory Protection",
      "1910.147 - Control of Hazardous Energy",
      "1910.1200 - Hazard Communication"
    ],
    notes: "Shipyard employment has its own OSHA standard (29 CFR 1915) separate from general industry (1910) or construction (1926). Ship repair/dismantling has some of the highest fatality rates in any industry. Confined space entry (1915.51) is a critical standard."
  },
  {
    naics_code: "336360",
    industry_description: "Motor Vehicle Body and Trailer Manufacturing",
    applicable_standards: [
      "1910.147 - Control of Hazardous Energy",
      "1910.178 - Powered Industrial Trucks (forklifts)",
      "1910.212 - General Requirements for Machines",
      "1910.215 - Mechanical Guarding",
      "1910.177 - Servicing Multi-Piece Rim Wheels (if truck tires)",
      "1910.176 - Materials Handling and Storage",
      "1910.305 - Electrical Equipment",
      "1910.253 - Oxygen-Fuel Gas Welding and Cutting",
      "1926.352 - Fire Prevention (welding/cutting)",
      "1910.132 - Personal Protective Equipment"
    ],
    notes: "Body shops and trailer manufacturers face a mix of general industry and welding hazards. Forklift operations (1910.178) and lockout/tagout (1910.147) are top enforcement areas."
  }
];

async function seedNAICS() {
  console.log(`Seeding ${NAICS_MAPPINGS.length} NAICS codes...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const mapping of NAICS_MAPPINGS) {
    const { data, error } = await supabase
      .from("naics_standards")
      .upsert(
        {
          naics_code: mapping.naics_code,
          industry_description: mapping.industry_description,
          applicable_standards: mapping.applicable_standards,
          notes: mapping.notes
        },
        { onConflict: "naics_code" }
      )
      .select("naics_code, industry_description");

    if (error) {
      console.log(`  SKIP  ${mapping.naics_code}: ${error.message}`);
      skipped++;
    } else {
      console.log(`  OK    ${mapping.naics_code}: ${mapping.industry_description.slice(0, 55)}`);
      inserted++;
    }
  }

  console.log(`\nDone: ${inserted} NAICS codes seeded, ${skipped} skipped`);
  console.log(`Total applicable standards mapped: ${NAICS_MAPPINGS.reduce((acc, m) => acc + m.applicable_standards.length, 0)}`);
}

seedNAICS().catch(console.error);

#!/usr/bin/env node

/**
 * OSHA Compliance MCP Server
 * 
 * Exposes 5 tools for querying OSHA safety standards:
 * - lookup_standard: Search by topic, keyword, or standard number
 * - get_ppe_requirements: PPE requirements for a task/hazard
 * - get_penalty_info: Current OSHA penalty schedule
 * - check_applicability: Which standards apply to an industry/task
 * - get_standard_text: Full regulatory text for a specific standard
 * 
 * Owner: DANZUS Holdings LLC
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DISCLAIMER = "\n\n---\n*This information is for reference only and does not constitute legal advice. Always verify requirements with official OSHA sources at osha.gov. Standards may have been amended since this data was last updated.*";

// ---- Usage tracking helper ----

async function trackUsage(toolName: string, query: string, responseTimeMs: number) {
  try {
    await supabase.from("api_usage").insert({
      tool_name: toolName,
      query: query.slice(0, 500),
      response_time_ms: responseTimeMs
    });
  } catch {
    // Non-critical, don't fail on tracking errors
  }
}

// ---- Server setup ----

const server = new McpServer({
  name: "osha-compliance",
  version: "1.0.0",
});

// ============================================
// Tool 1: lookup_standard
// ============================================

server.tool(
  "lookup_standard",
  "Search OSHA safety standards by topic, keyword, hazard, or standard number (e.g., 'fall protection', '1926.501', 'confined space', 'respirator'). Returns plain-English summaries with official citations. Covers 29 CFR 1910 (General Industry) and 1926 (Construction).",
  {
    query: z.string().describe("Search term: topic, keyword, hazard, or standard number"),
    scope: z.enum(["general_industry", "construction", "both"]).optional().default("both").describe("Filter by scope")
  },
  async ({ query, scope }) => {
    const start = Date.now();
    
    // Check if query looks like a standard number
    const isStandardNumber = /^\d{4}\.\d+/.test(query.trim());
    
    let results: any[] = [];
    
    if (isStandardNumber) {
      const { data, error } = await supabase
        .from("osha_standards")
        .select("standard_number, title, subpart, scope, plain_summary, key_requirements, ppe_requirements, ecfr_url")
        .eq("standard_number", query.trim())
        .limit(1);
      
      if (!error && data) results = data;
    }
    
    // If no exact match or not a standard number, do full-text search
    if (results.length === 0) {
      const { data, error } = await supabase.rpc("search_standards", {
        search_query: query,
        scope_filter: scope !== "both" ? scope : null,
        result_limit: 5
      });
      
      if (!error && data) results = data;
    }
    
    await trackUsage("lookup_standard", query, Date.now() - start);
    
    if (results.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No OSHA standards found matching "${query}". Try broader search terms or check the standard number format (e.g., 1926.501, 1910.134).${DISCLAIMER}`
        }]
      };
    }
    
    const formatted = results.map((s: any) => {
      const scopeLabel = s.scope === "general_industry" ? "General Industry (29 CFR 1910)" : "Construction (29 CFR 1926)";
      const reqs = (s.key_requirements || []).map((r: string) => `  - ${r}`).join("\n");
      const ppe = (s.ppe_requirements || []).length > 0
        ? `\n**Required PPE:** ${(s.ppe_requirements || []).join(", ")}`
        : "";
      
      return `## ${s.standard_number} - ${s.title}\n` +
        `**Scope:** ${scopeLabel}\n` +
        `**Subpart:** ${s.subpart || "N/A"}\n\n` +
        `**Summary:** ${s.plain_summary || "Summary not yet generated."}\n\n` +
        `**Key Requirements:**\n${reqs || "  - Not yet parsed."}` +
        ppe + `\n\n` +
        `**Official Source:** ${s.ecfr_url || "https://www.ecfr.gov/current/title-29"}`;
    }).join("\n\n---\n\n");
    
    return {
      content: [{
        type: "text",
        text: formatted + DISCLAIMER
      }]
    };
  }
);

// ============================================
// Tool 2: get_ppe_requirements
// ============================================

server.tool(
  "get_ppe_requirements",
  "Get required Personal Protective Equipment (PPE) for a specific work task or hazard, with OSHA standard citations. Examples: 'overhead welding', 'trenching 6 feet deep', 'spray painting in enclosed space'.",
  {
    task: z.string().describe("Description of the work task"),
    hazards: z.array(z.string()).optional().describe("Known hazards if any (e.g., ['fumes', 'sparks', 'falling objects'])")
  },
  async ({ task, hazards }) => {
    const start = Date.now();
    const searchTerms = [task, ...(hazards || [])].join(" ");
    
    // Search standards that have PPE requirements matching the task/hazards
    const { data, error } = await supabase.rpc("search_ppe", {
      search_query: searchTerms,
      result_limit: 10
    });
    
    await trackUsage("get_ppe_requirements", searchTerms, Date.now() - start);
    
    if (error || !data || data.length === 0) {
      // Fallback: general search
      const { data: fallback } = await supabase.rpc("search_standards", {
        search_query: searchTerms,
        scope_filter: null,
        result_limit: 5
      });
      
      if (!fallback || fallback.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No specific PPE requirements found for "${task}". This may mean the task falls under general PPE standards (1910.132-138 for General Industry, 1926.95-107 for Construction). Employers must conduct a hazard assessment per 29 CFR 1910.132(d) to determine required PPE.${DISCLAIMER}`
          }]
        };
      }
      
      const formatted = fallback.map((s: any) => {
        const ppe = (s.ppe_requirements || []);
        return `**${s.standard_number} - ${s.title}**\n` +
          (ppe.length > 0 ? `PPE: ${ppe.join(", ")}\n` : "") +
          `${s.plain_summary || ""}`;
      }).join("\n\n");
      
      return {
        content: [{
          type: "text",
          text: `## PPE Requirements for: ${task}\n\n**Related Standards:**\n\n${formatted}\n\n**Note:** Always conduct a site-specific hazard assessment per 29 CFR 1910.132(d).${DISCLAIMER}`
        }]
      };
    }
    
    // Aggregate PPE from all matching standards
    const allPPE = new Map<string, string[]>(); // PPE item -> standard numbers
    
    for (const standard of data) {
      for (const ppe of (standard.ppe_requirements || [])) {
        if (!allPPE.has(ppe)) allPPE.set(ppe, []);
        allPPE.get(ppe)!.push(standard.standard_number);
      }
    }
    
    let response = `## PPE Requirements for: ${task}\n`;
    if (hazards && hazards.length > 0) {
      response += `**Identified Hazards:** ${hazards.join(", ")}\n`;
    }
    response += "\n";
    
    if (allPPE.size > 0) {
      response += "**Required PPE:**\n";
      for (const [ppe, standards] of allPPE) {
        response += `  - **${ppe}** (per ${standards.join(", ")})\n`;
      }
    }
    
    response += "\n**Applicable Standards:**\n";
    for (const s of data.slice(0, 5)) {
      response += `  - **${s.standard_number}** - ${s.title}\n`;
      if (s.plain_summary) response += `    ${s.plain_summary}\n`;
    }
    
    response += "\n**Note:** Always conduct a site-specific hazard assessment per 29 CFR 1910.132(d). This list reflects standards-based requirements and may not cover all site-specific hazards.";
    
    return {
      content: [{
        type: "text",
        text: response + DISCLAIMER
      }]
    };
  }
);

// ============================================
// Tool 3: get_penalty_info
// ============================================

server.tool(
  "get_penalty_info",
  "Get current OSHA penalty amounts by violation type (serious, willful, repeat, other-than-serious, failure-to-abate, posting requirements). Penalties are adjusted annually for inflation.",
  {
    violation_type: z.enum([
      "serious", "other_than_serious", "willful", "repeat", 
      "failure_to_abate", "posting_requirements", "all"
    ]).optional().default("all").describe("Type of violation, or 'all' for complete schedule")
  },
  async ({ violation_type }) => {
    const start = Date.now();
    
    let query = supabase
      .from("penalty_schedule")
      .select("*")
      .order("max_penalty", { ascending: false });
    
    if (violation_type !== "all") {
      query = query.eq("violation_type", violation_type);
    }
    
    const { data, error } = await query;
    
    await trackUsage("get_penalty_info", violation_type || "all", Date.now() - start);
    
    if (error || !data || data.length === 0) {
      return {
        content: [{
          type: "text",
          text: `Penalty schedule data not available. Check https://www.osha.gov/penalties for current amounts.${DISCLAIMER}`
        }]
      };
    }
    
    let response = "## OSHA Penalty Schedule\n\n";
    
    for (const p of data) {
      const typeName = p.violation_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const min = p.min_penalty > 0 ? `$${Number(p.min_penalty).toLocaleString()}` : "$0";
      const max = `$${Number(p.max_penalty).toLocaleString()}`;
      
      response += `### ${typeName}\n`;
      response += `**Range:** ${min} - ${max} per violation\n`;
      if (p.notes) response += `**Details:** ${p.notes}\n`;
      response += `**Effective:** ${p.effective_date}\n\n`;
    }
    
    response += "**Penalty Adjustment Factors:**\n";
    response += "  - Employer size (fewer employees may reduce penalty)\n";
    response += "  - Good faith (safety program in place)\n";
    response += "  - History of violations\n";
    response += "  - Severity and probability of harm\n\n";
    response += "Penalties are adjusted annually for inflation, typically in January.\n";
    response += "**Source:** https://www.osha.gov/penalties";
    
    return {
      content: [{
        type: "text",
        text: response + DISCLAIMER
      }]
    };
  }
);

// ============================================
// Tool 4: check_applicability
// ============================================

server.tool(
  "check_applicability",
  "Determine which OSHA standards apply to a specific industry, task, or work scenario. Can filter by NAICS code, industry description, or task description.",
  {
    naics_code: z.string().optional().describe("NAICS industry code if known"),
    industry: z.string().optional().describe("Industry description (e.g., 'commercial construction', 'manufacturing')"),
    task: z.string().optional().describe("Specific task (e.g., 'trenching and excavation', 'spray painting')")
  },
  async ({ naics_code, industry, task }) => {
    const start = Date.now();
    
    if (!naics_code && !industry && !task) {
      return {
        content: [{
          type: "text",
          text: "Please provide at least one of: NAICS code, industry description, or task description."
        }]
      };
    }
    
    // Build search query from available inputs
    const searchParts = [];
    if (industry) searchParts.push(industry);
    if (task) searchParts.push(task);
    const searchQuery = searchParts.join(" ") || "general";
    
    // Determine scope from industry/task keywords
    const constructionKeywords = [
      "construction", "building", "excavation", "trenching", "scaffolding",
      "demolition", "roofing", "steel erection", "concrete", "masonry"
    ];
    const isConstruction = constructionKeywords.some(kw => 
      searchQuery.toLowerCase().includes(kw)
    );
    
    // If NAICS code provided, check naics_standards table first
    if (naics_code) {
      const { data: naicsData } = await supabase
        .from("naics_standards")
        .select("*")
        .eq("naics_code", naics_code)
        .limit(1);
      
      if (naicsData && naicsData.length > 0) {
        const record = naicsData[0];
        let response = `## Applicable Standards for NAICS ${naics_code}\n`;
        response += `**Industry:** ${record.industry_description}\n\n`;
        response += `**Applicable Standards:**\n`;
        for (const std of (record.applicable_standards || [])) {
          response += `  - ${std}\n`;
        }
        if (record.notes) response += `\n**Notes:** ${record.notes}`;
        
        await trackUsage("check_applicability", `naics:${naics_code}`, Date.now() - start);
        return { content: [{ type: "text", text: response + DISCLAIMER }] };
      }
    }
    
    // Fall back to full-text search
    const { data, error } = await supabase.rpc("search_standards", {
      search_query: searchQuery,
      scope_filter: isConstruction ? "construction" : null,
      result_limit: 10
    });
    
    await trackUsage("check_applicability", searchQuery, Date.now() - start);
    
    if (error || !data || data.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No specific standards found for "${searchQuery}". General duty clause (Section 5(a)(1) of the OSH Act) still applies: employers must provide a workplace free from recognized hazards.${DISCLAIMER}`
        }]
      };
    }
    
    let response = "## Applicable OSHA Standards\n\n";
    if (industry) response += `**Industry:** ${industry}\n`;
    if (task) response += `**Task:** ${task}\n`;
    if (naics_code) response += `**NAICS:** ${naics_code}\n`;
    response += "\n**Potentially Applicable Standards:**\n\n";
    
    // Group by subpart
    const bySubpart = new Map<string, any[]>();
    for (const s of data) {
      const key = s.subpart || "General";
      if (!bySubpart.has(key)) bySubpart.set(key, []);
      bySubpart.get(key)!.push(s);
    }
    
    for (const [subpart, standards] of bySubpart) {
      response += `### ${subpart}\n`;
      for (const s of standards) {
        response += `  - **${s.standard_number}** - ${s.title}\n`;
        if (s.plain_summary) response += `    ${s.plain_summary}\n`;
      }
      response += "\n";
    }
    
    response += "**Note:** This is not an exhaustive list. The General Duty Clause (Section 5(a)(1)) always applies. A qualified safety professional should review site-specific conditions.";
    
    return {
      content: [{
        type: "text",
        text: response + DISCLAIMER
      }]
    };
  }
);

// ============================================
// Tool 5: get_standard_text
// ============================================

server.tool(
  "get_standard_text",
  "Get the full regulatory text of a specific OSHA standard by its number (e.g., '1910.134', '1926.501'). Returns the complete standard text, plain-English summary, and official source link.",
  {
    standard_number: z.string().describe("OSHA standard number (e.g., '1910.134', '1926.501')")
  },
  async ({ standard_number }) => {
    const start = Date.now();
    
    const { data, error } = await supabase
      .from("osha_standards")
      .select("*")
      .eq("standard_number", standard_number.trim())
      .single();
    
    await trackUsage("get_standard_text", standard_number, Date.now() - start);
    
    if (error || !data) {
      return {
        content: [{
          type: "text",
          text: `Standard ${standard_number} not found. Check the number format (e.g., 1910.134 or 1926.501). Use lookup_standard to search by topic.${DISCLAIMER}`
        }]
      };
    }
    
    const scopeLabel = data.scope === "general_industry" 
      ? "General Industry (29 CFR 1910)" 
      : "Construction (29 CFR 1926)";
    
    let response = `## ${data.standard_number} - ${data.title}\n\n`;
    response += `**Scope:** ${scopeLabel}\n`;
    response += `**Subpart:** ${data.subpart || "N/A"}\n\n`;
    
    if (data.plain_summary) {
      response += `**Plain-English Summary:**\n${data.plain_summary}\n\n`;
    }
    
    if (data.key_requirements && data.key_requirements.length > 0) {
      response += `**Key Requirements:**\n`;
      for (const req of data.key_requirements) {
        response += `  - ${req}\n`;
      }
      response += "\n";
    }
    
    if (data.ppe_requirements && data.ppe_requirements.length > 0) {
      response += `**Required PPE:** ${data.ppe_requirements.join(", ")}\n\n`;
    }
    
    if (data.common_violations && data.common_violations.length > 0) {
      response += `**Common Violations:**\n`;
      for (const v of data.common_violations) {
        response += `  - ${v}\n`;
      }
      response += "\n";
    }
    
    response += `**Full Regulatory Text:**\n${data.raw_text}\n\n`;
    response += `**Official Source:** ${data.ecfr_url || `https://www.ecfr.gov/current/title-29/section-${data.standard_number}`}`;
    
    return {
      content: [{
        type: "text",
        text: response + DISCLAIMER
      }]
    };
  }
);

// ---- Start server ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});

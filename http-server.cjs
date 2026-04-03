/**
 * OSHA Compliance MCP - Minimal HTTP Server
 * Implements MCP JSON-RPC 2.0 over HTTP
 */
"use strict";

const http = require("http");
const url = require("url");
const { createClient } = require("@supabase/supabase-js");

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const DISCLAIMER = "\n\n---\n*This information is for reference only and does not constitute legal advice. Always verify requirements with official OSHA sources at osha.gov.*";

// ============================================================
// MCP Protocol Handler
// ============================================================
function handleMCPRequest(method, params) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "osha-compliance-mcp", version: "1.0.0" },
      };

    case "tools/list":
      return { tools: TOOLS };

    case "tools/call":
      return handleToolCall(params.name, params.arguments);

    case "ping":
      return null;

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// ============================================================
// Tools Registry
// ============================================================
const TOOLS = [
  {
    name: "lookup_standard",
    description: "Search OSHA safety standards by topic, keyword, hazard, or standard number. Covers 29 CFR 1910 and 1926.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term: topic, keyword, hazard, or standard number" },
        scope: { type: "string", enum: ["general_industry", "construction", "both"], default: "both" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_ppe_requirements",
    description: "Get required PPE for a specific work task or hazard, with OSHA standard citations.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Description of the work task" },
        hazards: { type: "array", items: { type: "string" }, description: "Known hazards" }
      },
      required: ["task"]
    }
  },
  {
    name: "get_penalty_info",
    description: "Get current OSHA penalty amounts by violation type.",
    inputSchema: {
      type: "object",
      properties: {
        violation_type: { type: "string", enum: ["serious", "other_than_serious", "willful", "repeat", "failure_to_abate", "posting_requirements", "all"], default: "all" }
      }
    }
  },
  {
    name: "check_applicability",
    description: "Determine which OSHA standards apply to a specific industry, task, or NAICS code.",
    inputSchema: {
      type: "object",
      properties: {
        naics_code: { type: "string" },
        industry: { type: "string" },
        task: { type: "string" }
      }
    }
  },
  {
    name: "get_standard_text",
    description: "Get the full regulatory text of a specific OSHA standard.",
    inputSchema: {
      type: "object",
      properties: {
        standard_number: { type: "string", description: "OSHA standard number (e.g., '1910.134', '1926.501')" }
      },
      required: ["standard_number"]
    }
  }
];

// ============================================================
// Tool Implementations
// ============================================================
async function handleToolCall(name, args) {
  switch (name) {
    case "lookup_standard": return toolLookupStandard(args);
    case "get_ppe_requirements": return toolPPE(args);
    case "get_penalty_info": return toolPenalty(args);
    case "check_applicability": return toolApplicability(args);
    case "get_standard_text": return toolStandardText(args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

async function toolLookupStandard({ query, scope }) {
  const isStandardNumber = /^\d{4}\.\d+/.test(query.trim());

  let results = [];

  if (isStandardNumber) {
    const { data } = await supabase
      .from("osha_standards")
      .select("standard_number, title, subpart, scope, plain_summary, key_requirements, ppe_requirements, ecfr_url")
      .eq("standard_number", query.trim())
      .limit(1);
    if (data) results = data;
  }

  if (results.length === 0) {
    const { data } = await supabase.rpc("search_standards", {
      search_query: query,
      scope_filter: scope !== "both" ? scope : null,
      result_limit: 5
    });
    if (data) results = data;
  }

  if (results.length === 0) {
    return { content: [{ type: "text", text: `No OSHA standards found matching "${query}". Try broader search terms or check the standard number format (e.g., 1926.501, 1910.134).${DISCLAIMER}` }] };
  }

  const formatted = results.map(s => {
    const scopeLabel = s.scope === "general_industry" ? "General Industry (29 CFR 1910)" : "Construction (29 CFR 1926)";
    const reqs = ((s.key_requirements) || []).map(r => `  - ${r}`).join("\n");
    const ppe = (s.ppe_requirements || []).length > 0 ? `\n**Required PPE:** ${s.ppe_requirements.join(", ")}` : "";
    return `## ${s.standard_number} - ${s.title}\n**Scope:** ${scopeLabel}\n**Subpart:** ${s.subpart || "N/A"}\n\n**Summary:** ${s.plain_summary || "Not yet generated."}\n\n**Key Requirements:**\n${reqs || "  - Not yet parsed."}${ppe}\n\n**Official Source:** ${s.ecfr_url || "https://www.ecfr.gov/current/title-29"}`;
  }).join("\n\n---\n\n");

  return { content: [{ type: "text", text: formatted + DISCLAIMER }] };
}

async function toolPPE({ task, hazards }) {
  const searchTerms = [task, ...(hazards || [])].join(" ");

  const { data } = await supabase.rpc("search_ppe", {
    search_query: searchTerms,
    result_limit: 10
  });

  if (!data || data.length === 0) {
    const { data: fallback } = await supabase.rpc("search_standards", {
      search_query: searchTerms, scope_filter: null, result_limit: 5
    });
    if (!fallback || fallback.length === 0) {
      return { content: [{ type: "text", text: `No specific PPE requirements found for "${task}". This may fall under general PPE standards (1910.132-138 for General Industry, 1926.95-107 for Construction).${DISCLAIMER}` }] };
    }
    return { content: [{ type: "text", text: `## PPE Requirements for: ${task}\n\n**Related Standards:**\n\n${fallback.map(s => `**${s.standard_number}** - ${s.title}`).join("\n")}\n\n**Note:** Always conduct a site-specific hazard assessment per 29 CFR 1910.132(d).${DISCLAIMER}` }] };
  }

  const allPPE = new Map();
  for (const standard of data) {
    for (const ppe of (standard.ppe_requirements || [])) {
      if (!allPPE.has(ppe)) allPPE.set(ppe, []);
      allPPE.get(ppe).push(standard.standard_number);
    }
  }

  let response = `## PPE Requirements for: ${task}\n\n`;
  if (allPPE.size > 0) {
    response += "**Required PPE:**\n";
    for (const [ppe, standards] of allPPE) {
      response += `  - **${ppe}** (per ${standards.join(", ")})\n`;
    }
  }
  response += "\n**Note:** Always conduct a site-specific hazard assessment per 29 CFR 1910.132(d).";

  return { content: [{ type: "text", text: response + DISCLAIMER }] };
}

async function toolPenalty({ violation_type }) {
  let query = supabase.from("penalty_schedule").select("*").order("max_penalty", { ascending: false });
  if (violation_type !== "all") {
    query = query.eq("violation_type", violation_type);
  }
  const { data } = await query;

  if (!data || data.length === 0) {
    return { content: [{ type: "text", text: `Penalty schedule data not available. Check https://www.osha.gov/penalties for current amounts.${DISCLAIMER}` }] };
  }

  let response = "## OSHA Penalty Schedule\n\n";
  for (const p of data) {
    const typeName = p.violation_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const min = p.min_penalty > 0 ? `$${Number(p.min_penalty).toLocaleString()}` : "$0";
    response += `### ${typeName}\n**Range:** ${min} - $${Number(p.max_penalty).toLocaleString()} per violation\n**Effective:** ${p.effective_date}\n\n`;
  }
  response += "**Source:** https://www.osha.gov/penalties";

  return { content: [{ type: "text", text: response + DISCLAIMER }] };
}

async function toolApplicability({ naics_code, industry, task }) {
  if (!naics_code && !industry && !task) {
    return { content: [{ type: "text", text: "Please provide at least one of: NAICS code, industry description, or task description." }] };
  }

  const searchParts = [];
  if (industry) searchParts.push(industry);
  if (task) searchParts.push(task);
  const searchQuery = searchParts.join(" ") || "general";

  const constructionKeywords = ["construction", "building", "excavation", "trenching", "scaffolding", "demolition", "roofing", "steel erection"];
  const isConstruction = constructionKeywords.some(kw => searchQuery.toLowerCase().includes(kw));

  if (naics_code) {
    const { data: naicsData } = await supabase
      .from("naics_standards").select("*").eq("naics_code", naics_code).limit(1);
    if (naicsData && naicsData.length > 0) {
      const record = naicsData[0];
      let response = `## Applicable Standards for NAICS ${naics_code}\n**Industry:** ${record.industry_description}\n\n**Applicable Standards:**\n`;
      for (const std of (record.applicable_standards || [])) response += `  - ${std}\n`;
      return { content: [{ type: "text", text: response + DISCLAIMER }] };
    }
  }

  const { data } = await supabase.rpc("search_standards", {
    search_query: searchQuery,
    scope_filter: isConstruction ? "construction" : null,
    result_limit: 10
  });

  if (!data || data.length === 0) {
    return { content: [{ type: "text", text: `No specific standards found for "${searchQuery}". General Duty Clause (Section 5(a)(1)) still applies.${DISCLAIMER}` }] };
  }

  let response = `## Applicable OSHA Standards\n\n`;
  if (industry) response += `**Industry:** ${industry}\n`;
  if (task) response += `**Task:** ${task}\n`;
  response += "\n**Potentially Applicable Standards:**\n\n";
  for (const s of data) {
    response += `  - **${s.standard_number}** - ${s.title}\n`;
    if (s.plain_summary) response += `    ${s.plain_summary}\n`;
  }

  return { content: [{ type: "text", text: response + DISCLAIMER }] };
}

async function toolStandardText({ standard_number }) {
  const { data } = await supabase
    .from("osha_standards")
    .select("*")
    .eq("standard_number", standard_number.trim())
    .single();

  if (!data) {
    return { content: [{ type: "text", text: `Standard ${standard_number} not found. Use lookup_standard to search by topic.${DISCLAIMER}` }] };
  }

  const scopeLabel = data.scope === "general_industry" ? "General Industry (29 CFR 1910)" : "Construction (29 CFR 1926)";
  let response = `## ${data.standard_number} - ${data.title}\n\n`;
  response += `**Scope:** ${scopeLabel}\n`;
  response += `**Subpart:** ${data.subpart || "N/A"}\n\n`;
  if (data.plain_summary) response += `**Plain-English Summary:**\n${data.plain_summary}\n\n`;
  if (data.key_requirements && data.key_requirements.length > 0) {
    response += `**Key Requirements:**\n`;
    for (const req of data.key_requirements) response += `  - ${req}\n`;
    response += "\n";
  }
  if (data.ppe_requirements && data.ppe_requirements.length > 0) {
    response += `**Required PPE:** ${data.ppe_requirements.join(", ")}\n\n`;
  }
  response += `**Full Regulatory Text:**\n${data.raw_text}\n\n`;
  response += `**Official Source:** ${data.ecfr_url || `https://www.ecfr.gov/current/title-29/section-${data.standard_number}`}`;

  return { content: [{ type: "text", text: response + DISCLAIMER }] };
}

// ============================================================
// HTTP Server
// ============================================================
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, mcptools, mcpheaders, mcpprotocolversion",
      "Access-Control-Expose-Headers": "mcpheaders, mcptools, mcpprotocolversion",
    });
    res.end();
    return;
  }

  // Health check
  if (parsedUrl.pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // MCP GET (Smithery probe)
  if (parsedUrl.pathname === "/mcp" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify({
      name: "osha-compliance-mcp",
      version: "1.0.0",
      capabilities: { tools: { listChanged: false } },
    }));
    return;
  }

  // MCP POST
  if (parsedUrl.pathname === "/mcp" && req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();

    let id = null, method = null, params = null;
    try {
      const json = JSON.parse(body);
      id = json.id;
      method = json.method;
      params = json.params || {};
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }));
      return;
    }

    try {
      const result = await handleMCPRequest(method, params);
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
    } catch (err) {
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32603, message: err.message } }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.error(`OSHA Compliance MCP server running on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

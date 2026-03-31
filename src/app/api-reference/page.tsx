export const metadata = {
  title: 'API Reference - OSHA Compliance API',
  description: 'Full API reference for the OSHA Compliance API.'
}

export default function APIReference() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '2rem', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>API Reference</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
        Base URL: <code style={{ background: '#f5f5f5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>https://osha-mcp.vercel.app/api/lookup</code>
      </p>

      {/* lookup_standard */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 id="lookup_standard" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>lookup_standard</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Search OSHA standards by topic, keyword, hazard, or standard number.</p>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Request</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`POST /api/lookup
{
  "tool": "lookup_standard",
  "query": "fall protection for roofing",
  "scope": "both"  // optional: "general_industry" | "construction" | "both"
}`}
        </pre>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Response</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`{
  "success": true,
  "tool": "lookup_standard",
  "result": [
    {
      "standard_number": "1926.501",
      "title": "Duty to have fall protection.",
      "subpart": "Subpart M—Fall Protection",
      "scope": "construction",
      "plain_summary": "This OSHA standard requires employers...",
      "key_requirements": [
        "Determine that walking/working surfaces have strength...",
        "Protect employees on unprotected sides and edges 6 feet..."
      ],
      "ppe_requirements": ["Hard hat when exposed to falling objects"],
      "ecfr_url": "https://www.ecfr.gov/current/title-29/section-1926.501"
    }
  ],
  "timestamp": "2026-03-31T15:00:00Z"
}`}
        </pre>
      </section>

      {/* get_ppe_requirements */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 id="get_ppe_requirements" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>get_ppe_requirements</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Get required PPE for a specific task or hazard.</p>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Request</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`POST /api/lookup
{
  "tool": "get_ppe_requirements",
  "task": "overhead welding"
}`}
        </pre>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Response</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`{
  "success": true,
  "tool": "get_ppe_requirements",
  "result": [
    {
      "standard_number": "1910.252",
      "title": "General welding requirements.",
      "ppe_requirements": [
        "Welding helmet with appropriate shade lens",
        "Safety glasses with side shields",
        "Leather gloves and apron",
        "Steel-toed boots",
        "Hearing protection when required"
      ],
      "applicable_hazards": ["fumes", "sparks", "arc radiation"],
      "ecfr_url": "https://www.ecfr.gov/current/title-29/section-1910.252"
    }
  ]
}`}
        </pre>
      </section>

      {/* get_penalty_info */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 id="get_penalty_info" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>get_penalty_info</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Get current OSHA penalty amounts by violation type.</p>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Request</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`POST /api/lookup
{
  "tool": "get_penalty_info",
  "violation_type": "serious"  // optional: "serious" | "other_than_serious" | "willful" | "repeat" | "failure_to_abate" | "all"
}`}
        </pre>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Response</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`{
  "success": true,
  "tool": "get_penalty_info",
  "result": [
    {
      "violation_type": "serious",
      "min_penalty": 1078,
      "max_penalty": 16123,
      "effective_date": "2026-01-15",
      "notes": "Penalties adjusted annually for inflation"
    }
  ]
}`}
        </pre>
      </section>

      {/* check_applicability */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 id="check_applicability" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>check_applicability</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Determine which standards apply to an industry or task.</p>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Request</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`POST /api/lookup
{
  "tool": "check_applicability",
  "task": "trenching 6 feet deep",
  "industry": "construction"  // optional
}`}
        </pre>
      </section>

      {/* get_standard_text */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 id="get_standard_text" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>get_standard_text</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Get full regulatory text by standard number.</p>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Request</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', marginBottom: '1rem' }}>
{`POST /api/lookup
{
  "tool": "get_standard_text",
  "standard_number": "1910.134"
}`}
        </pre>
      </section>

      {/* Data Freshness */}
      <section style={{ marginBottom: '3rem', background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Data Freshness</h2>
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Standards data:</strong> Last updated 2026-03-31 (from U.S. Department of Labor eCFR)</li>
          <li><strong>Penalty amounts:</strong> Current as of 2026-01-15 (annual inflation adjustment)</li>
          <li><strong>Summaries:</strong> AI-generated from official regulatory text</li>
        </ul>
      </section>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <a href="/pricing" style={{ display: 'inline-block', background: '#222', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
          View Pricing
        </a>
      </div>
    </main>
  )
}

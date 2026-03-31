export const metadata = {
  title: 'OSHA MCP - AI Compliance API',
  description: 'Pay-per-call API for OSHA safety regulation lookups. 479 standards with plain-English summaries.'
}

export default function Home() {
  return (
    <main style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      lineHeight: 1.6
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        OSHA MCP Server
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
        AI-ready API for OSHA compliance lookups
      </p>

      <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <code style={{ fontSize: '0.9rem' }}>
          POST https://osha-mcp.vercel.app/api/lookup
        </code>
        <p style={{ marginTop: '0.5rem', color: '#666' }}>
          $0.01 per call via x402 protocol
        </p>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Tools</h2>
      <ul style={{ marginBottom: '2rem' }}>
        <li><strong>lookup_standard</strong> - Search by topic, keyword, or standard number</li>
        <li><strong>get_ppe_requirements</strong> - PPE for a task or hazard</li>
        <li><strong>get_penalty_info</strong> - Current OSHA penalty amounts</li>
        <li><strong>check_applicability</strong> - Which standards apply to an industry/task</li>
        <li><strong>get_standard_text</strong> - Full regulatory text by standard number</li>
      </ul>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Coverage</h2>
      <ul>
        <li>29 CFR 1910 (General Industry): 188 standards</li>
        <li>29 CFR 1926 (Construction): 291 standards</li>
        <li>479 total standards with plain-English summaries</li>
      </ul>

      <div style={{ marginTop: '3rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
        <strong>Disclaimer:</strong> This tool is for informational purposes only and does not constitute legal advice. 
        Always verify requirements with official OSHA sources at osha.gov.
      </div>
    </main>
  )
}

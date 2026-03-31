import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1.1 }}>
        OSHA standards,<br />
        <span style={{ color: '#666' }}>plain-English answers.</span>
      </h1>
      
      <p style={{ fontSize: '1.25rem', color: '#444', marginBottom: '2rem', maxWidth: '600px' }}>
        Integrate OSHA compliance lookups into your safety app, LMS, or construction software. 
        No reading CFR text. No guessing.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '4rem' }}>
        <Link href="/docs" style={{ background: '#222', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
          Get Started
        </Link>
        <Link href="/pricing" style={{ background: '#fff', color: '#222', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', border: '1px solid #ccc', fontWeight: '500' }}>
          View Pricing
        </Link>
      </div>

      {/* Example */}
      <div style={{ background: '#f5f5f5', padding: '2rem', borderRadius: '12px', marginBottom: '4rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontFamily: 'monospace' }}>Example request:</p>
        <pre style={{ margin: 0, fontSize: '0.9rem', background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
{`POST /api/lookup
{
  "tool": "lookup_standard",
  "query": "fall protection for roofing work"
}`}
        </pre>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', marginTop: '1rem', fontFamily: 'monospace' }}>Response:</p>
        <pre style={{ margin: 0, fontSize: '0.85rem', background: '#fff', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxHeight: '200px' }}>
{`{
  "success": true,
  "result": [{
    "standard_number": "1926.501",
    "title": "Duty to have fall protection.",
    "plain_summary": "This OSHA standard requires employers to 
      provide fall protection systems for employees working at 
      heights of 6 feet or more above lower levels...",
    "key_requirements": [
      "Determine that walking/working surfaces have strength 
       and structural integrity to support employees safely",
      "Protect employees on unprotected sides and edges 
       6 feet or more above lower levels..."
    ],
    "ppe_requirements": ["Hard hat when exposed to falling objects"],
    "ecfr_url": "https://www.ecfr.gov/current/title-29/section-1926.501"
  }]
}`}
        </pre>
      </div>

      {/* Features */}
      <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>What you get</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>479 Standards</h3>
          <p style={{ color: '#666', margin: 0 }}>
            29 CFR 1910 (General Industry) and 1926 (Construction). Full coverage.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Plain-English Summaries</h3>
          <p style={{ color: '#666', margin: 0 }}>
            AI-generated summaries from official regulatory text. No legal jargon.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Task-Based Search</h3>
          <p style={{ color: '#666', margin: 0 }}>
            Query by what you're doing, not by regulation number.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>PPE & Penalties</h3>
          <p style={{ color: '#666', margin: 0 }}>
            Built-in PPE requirements and current penalty amounts.
          </p>
        </div>
      </div>

      {/* Use Cases */}
      <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Built for</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        <div style={{ background: '#fafafa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Safety Apps</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Give workers instant OSHA guidance in the field.
          </p>
        </div>
        <div style={{ background: '#fafafa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Construction LMS</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Add compliance training context without building a legal team.
          </p>
        </div>
        <div style={{ background: '#fafafa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Safety Software</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Integrate structured compliance data into existing tools.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '3rem', background: '#222', borderRadius: '12px', color: '#fff' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>Start integrating</h2>
        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Free tier: 100 calls/month. No credit card required.</p>
        <Link href="/docs" style={{ background: '#fff', color: '#222', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '500', display: 'inline-block' }}>
          Read the Docs
        </Link>
      </div>
    </main>
  )
}

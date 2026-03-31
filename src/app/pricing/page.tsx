export const metadata = {
  title: 'Pricing - OSHA Compliance API',
  description: 'Simple, transparent pricing for the OSHA Compliance API.'
}

export default function Pricing() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '2rem', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Pricing</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '3rem' }}>
        Straightforward pricing. No surprise fees.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {/* Free */}
        <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Free</h2>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>$0</p>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
            <li>100 calls/month</li>
            <li>All tools</li>
            <li>Community support</li>
          </ul>
        </div>

        {/* Growth */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '2px solid #222', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Growth</h2>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>$79<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>/month</span></p>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
            <li>10,000 API calls/month</li>
            <li>All tools</li>
            <li>Email support</li>
            <li>Higher rate limits</li>
          </ul>
        </div>

        {/* Business */}
        <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Business</h2>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>$299<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>/month</span></p>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
            <li>100,000 API calls/month</li>
            <li>All tools</li>
            <li>Priority support</li>
            <li>Custom rate limits</li>
            <li>SLA guarantee</li>
          </ul>
        </div>
      </div>

      <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Pay-per-call (no subscription)</h3>
        <p style={{ marginBottom: '1rem' }}>
          <strong>$0.01 per API call</strong> — no monthly commitment. Pay as you go via crypto or card.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Good for testing or sporadic use. Volume discounts available for 1M+ calls/month.
        </p>
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Common Questions</h2>
        
        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '500' }}>What counts as an API call?</summary>
          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
            Each tool invocation (lookup_standard, get_penalty_info, etc.) counts as 1 call, regardless of results returned.
          </p>
        </details>

        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '500' }}>What happens if I exceed my limit?</summary>
          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
            Requests return 429 Too Many Requests. You can upgrade anytime or implement exponential backoff.
          </p>
        </details>

        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '500' }}>Do you offer refunds?</summary>
          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
            Monthly plans: pro-rated refund within first 7 days. Pay-per-call: no refund (you only pay for what you use).
          </p>
        </details>

        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '500' }}>Need enterprise volume?</summary>
          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
            Contact us for custom pricing on 1M+ calls/month, dedicated infrastructure, or on-premise deployment.
          </p>
        </details>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <a href="/docs" style={{ display: 'inline-block', background: '#222', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
          Read the Docs
        </a>
      </div>
    </main>
  )
}

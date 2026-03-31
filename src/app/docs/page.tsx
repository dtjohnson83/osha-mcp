export const metadata = {
  title: 'Integration Docs - OSHA Compliance API',
  description: 'Code examples for integrating the OSHA Compliance API.'
}

const codeStyle = { fontFamily: 'monospace', background: '#f5f5f5', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.85rem' } as const

export default function Docs() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '2rem', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Integration Docs</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
        Get started with the OSHA Compliance API in minutes.
      </p>

      {/* Quick Start */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quick Start</h2>
        <p style={{ marginBottom: '1rem' }}>Get your API key from your dashboard, then make your first call:</p>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>
{`curl -X POST https://osha-mcp.vercel.app/api/lookup \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "lookup_standard",
    "query": "fall protection"
  }'`}
        </pre>
      </section>

      {/* Node.js */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Node.js</h2>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>
{`const response = await fetch('https://osha-mcp.vercel.app/api/lookup', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'lookup_standard',
    query: 'fall protection for roofing work'
  })
});

const data = await response.json();
console.log(data.result);
// [
//   {
//     "standard_number": "1926.501",
//     "title": "Duty to have fall protection.",
//     "plain_summary": "This OSHA standard requires employers...",
//     "key_requirements": ["Provide fall protection for employees..."],
//     "ppe_requirements": ["Hard hat when exposed to falling objects"],
//     "ecfr_url": "https://www.ecfr.gov/current/title-29/section-1926.501"
//   }
// ]`}
        </pre>
      </section>

      {/* Python */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Python</h2>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>
{`import requests

response = requests.post(
    'https://osha-mcp.vercel.app/api/lookup',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'tool': 'get_ppe_requirements',
        'task': 'overhead welding'
    }
)

data = response.json()
for standard in data['result']:
    print(f"{standard['standard_number']}: {standard['title']}")`}
        </pre>
      </section>

      {/* Go */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Go</h2>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>
{`package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    body, _ := json.Marshal(map[string]string{
        "tool":  "get_penalty_info",
        "violation_type": "serious",
    })
    
    req, _ := http.NewRequest("POST", 
        "https://osha-mcp.vercel.app/api/lookup",
        bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
}`}
        </pre>
      </section>

      {/* React */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>React</h2>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>
{`const [standards, setStandards] = useState([]);

async function lookupOSHA(query: string) {
  const res = await fetch('/api/lookup', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.OSHA_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tool: 'lookup_standard', query })
  });
  
  const { result } = await res.json();
  setStandards(result);
}

// Usage
<button onClick={() => lookupOSHA('respiratory protection')}>
  Check OSHA Standards
</button>`}
        </pre>
      </section>

      {/* Error Handling */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error Handling</h2>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>
{`// Error responses
{
  "error": "Missing required field: query"
}

// HTTP Status Codes
200 - Success
400 - Bad request (missing params)
401 - Invalid or missing API key
402 - Payment required (pay-per-call)
429 - Rate limit exceeded
500 - Server error

// Handle errors
if (!response.ok) {
  if (response.status === 429) {
    // Implement exponential backoff
    await delay(1000 * Math.pow(2, retryCount));
    return fetchWithRetry(payload, retryCount + 1);
  }
  throw new Error(\`API error: \${response.status}\`);
}`}
        </pre>
      </section>

      {/* Rate Limits */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Rate Limits</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Plan</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Requests/min</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Monthly cap</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem 0' }}>Free</td>
              <td>10</td>
              <td>100</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem 0' }}>Growth</td>
              <td>60</td>
              <td>10,000</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem 0' }}>Business</td>
              <td>300</td>
              <td>100,000</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <a href="/api-reference" style={{ display: 'inline-block', background: '#222', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
          View Full API Reference
        </a>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>OSHA Agent API</h1>
      <p>Pay-per-call OSHA compliance lookups via x402.</p>
      <p>Endpoint: <code>/api/lookup</code> - $0.01 per call</p>
    </main>
  )
}

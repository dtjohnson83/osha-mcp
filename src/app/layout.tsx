import Link from 'next/link'

export const metadata = {
  title: 'OSHA Compliance API',
  description: 'AI-powered OSHA safety standard lookups for developers.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <header style={{ background: '#222', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
            OSHA Compliance API
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/docs" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.9rem' }}>Docs</Link>
            <Link href="/api-reference" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.9rem' }}>API Reference</Link>
            <Link href="/pricing" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</Link>
          </nav>
        </header>
        {children}
        <footer style={{ background: '#f5f5f5', padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>OSHA Compliance API — Built with plain-English summaries from official eCFR data.</p>
          <p style={{ margin: 0 }}>Data current as of March 2026. Not legal advice.</p>
        </footer>
      </body>
    </html>
  )
}

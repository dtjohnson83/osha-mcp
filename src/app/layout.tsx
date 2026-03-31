export const metadata = {
  title: 'OSHA MCP',
  description: 'MCP server for OSHA compliance and safety data'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

export const metadata = {
  title: 'OSHA Agent API',
  description: 'Pay-per-call OSHA compliance lookups'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

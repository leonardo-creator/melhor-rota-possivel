import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Better Route',
  description: 'Created with Love',
  generator: 'Leonardo Juvencio',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}

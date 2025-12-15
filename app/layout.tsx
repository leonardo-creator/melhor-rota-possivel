import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Melhor Rota',
  description: 'Created with Love',
  generator: 'Leonardo Juvencio',
  icons: {
    icon: '/favicon.png',
  },
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

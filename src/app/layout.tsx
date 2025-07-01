import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Citizenly - Connect with Your Representatives',
  description: 'A civic engagement platform that connects citizens with elected representatives through verified polling and real-time legislative data.',
  keywords: ['civic engagement', 'democracy', 'politics', 'representatives', 'voting', 'polls'],
  authors: [{ name: 'Citizenly Team' }],
  openGraph: {
    title: 'Citizenly - Connect with Your Representatives',
    description: 'A civic engagement platform that connects citizens with elected representatives',
    type: 'website',
    url: 'https://citizenly.com',
    siteName: 'Citizenly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Citizenly - Connect with Your Representatives',
    description: 'A civic engagement platform that connects citizens with elected representatives',
  },
  robots: 'index, follow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}

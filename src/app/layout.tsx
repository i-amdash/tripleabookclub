import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SmoothScroll } from '@/components/providers/SmoothScroll'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://tripleabookclub.com'),
  title: {
    default: 'Triple A Book Club',
    template: '%s | Triple A Book Club',
  },
  description: 'A premium book club community for passionate readers. Discover monthly fiction and bi-monthly non-fiction reads, connect with fellow book lovers.',
  keywords: ['book club', 'reading', 'fiction', 'non-fiction', 'community', 'books'],
  authors: [{ name: 'Triple A Book Club' }],
  creator: 'Triple A Book Club',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tripleabookclub.com',
    title: 'Triple A Book Club',
    description: 'A premium book club community for passionate readers',
    siteName: 'Triple A Book Club',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Triple A Book Club',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Triple A Book Club',
    description: 'A premium book club community for passionate readers',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans" suppressHydrationWarning>
        <SmoothScroll>
          <div className="relative min-h-screen flex flex-col">
            {/* Background elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
              <div className="absolute inset-0 noise pointer-events-none" />
            </div>
            
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </SmoothScroll>
        
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f1f23',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#cf6f4e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { WebVitalsReporter } from '@/components/perf/WebVitalsReporter'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })

export const metadata: Metadata = {
  title: 'Anvay',
  description: 'Sovereign MCP-native context engine',
  icons: {
    icon: '/anvay-app-icon-v2.svg',
    shortcut: '/anvay-app-icon-v2.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`theme-dark ${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen m-0 bg-bg p-0 text-fg">
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  )
}

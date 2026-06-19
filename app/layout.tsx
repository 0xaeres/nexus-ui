import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Shell } from '@/components/shell/Shell'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })

export const metadata: Metadata = {
  title: 'Nexus',
  description: 'Sovereign MCP-native context engine',
  icons: {
    icon: '/nexus-app-icon-v2.svg',
    shortcut: '/nexus-app-icon-v2.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`theme-dark ${inter.variable} ${jetbrains.variable}`}>
      <body className="h-screen flex flex-col overflow-hidden m-0 p-0 bg-bg text-fg">
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}

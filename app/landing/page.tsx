import { LandingPage } from '@/components/screens/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nexus · Sovereign MCP-Native Context Engine',
  description: 'Fast, secure, sovereign context engine for developers and agent councils.',
}

export default function Landing() {
  return <LandingPage />
}

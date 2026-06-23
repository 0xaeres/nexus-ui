import { LandingPage } from '@/components/screens/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anvay · Product context your agents can trust',
  description: 'Turn product context into a living knowledge base for developers and AI agents.',
}

export default function Landing() {
  return <LandingPage />
}

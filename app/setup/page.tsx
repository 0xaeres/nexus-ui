import { Setup } from '@/components/screens/Setup'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setup & Bootstrap · Nexus',
  description: 'First-run setup wizard to bootstrap the repository context configuration and skills repository.',
}

export default function SetupPage() {
  return <Setup />
}

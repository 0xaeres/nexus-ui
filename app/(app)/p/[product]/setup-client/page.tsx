import type { Metadata } from 'next'
import { SetupClient } from '@/components/screens/SetupClient'

export const metadata: Metadata = {
  title: 'Setup client | Anvay',
  description: 'Connect a product skill to an MCP-capable AI client.',
}

export default function Page() {
  return <SetupClient />
}

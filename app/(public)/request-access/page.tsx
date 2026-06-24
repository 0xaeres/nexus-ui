import { RequestAccessScreen } from '@/components/screens/RequestAccessScreen'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request Access · Anvay',
  description: 'Request access credentials from the organization administrators to access your sovereign context engine.',
}

export default function RequestAccessPage() {
  return <RequestAccessScreen />
}

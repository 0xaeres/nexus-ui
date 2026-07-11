import { RequestAccessScreen } from '@/components/screens/RequestAccessScreen'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request Access · Anvay',
  description: 'Ask the administrator of your team\'s self-hosted Anvay instance to grant you access.',
}

export default function RequestAccessPage() {
  return <RequestAccessScreen />
}

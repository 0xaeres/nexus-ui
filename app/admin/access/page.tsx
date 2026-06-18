import { AdminAccessScreen } from '@/components/screens/AdminAccessScreen'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Access Requests · Nexus',
  description: 'Manage users and approve or reject access requests for the sovereign context engine.',
}

export default function AdminAccessPage() {
  return <AdminAccessScreen />
}

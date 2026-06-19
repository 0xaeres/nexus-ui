import { LoginScreen } from '@/components/screens/LoginScreen'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login · Nexus',
  description: 'Sign in to access your sovereign context engine and skills dashboard.',
}

export default function LoginPage() {
  return <LoginScreen />
}

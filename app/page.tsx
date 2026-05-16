import { redirect } from 'next/navigation'
import { NEXUS_PRODUCTS } from '@/lib/data'

export default function Home() {
  if (NEXUS_PRODUCTS.length === 0) redirect('/onboarding')
  redirect(`/p/${NEXUS_PRODUCTS[0].id}/dashboard`)
}

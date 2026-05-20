import { redirect } from 'next/navigation'
import { listProducts } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const products = await listProducts()
    if (!products.length) redirect('/onboarding')
    redirect(`/p/${products[0].id}/dashboard`)
  } catch {
    redirect('/onboarding')
  }
}

import { NewProduct } from '@/components/screens/NewProduct'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboard Product · Nexus',
  description: 'Connect a new product repository and configure permissions to begin generating skill packs.',
}

export default function NewProductPage() {
  return <NewProduct />
}

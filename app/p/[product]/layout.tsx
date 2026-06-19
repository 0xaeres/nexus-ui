import { notFound } from 'next/navigation'
import { ApiError, getProduct } from '@/lib/api'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>
}): Promise<Metadata> {
  const { product } = await params
  return {
    title: `Nexus · ${product}`,
    description: `Context engine dashboard and workspace for product "${product}"`,
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  try {
    await getProduct(product)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    // Backend down or other transient: let the child screens render their own
    // error UI rather than 404'ing.
  }
  return <>{children}</>
}

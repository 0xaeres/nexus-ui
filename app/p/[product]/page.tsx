import { redirect } from 'next/navigation'

export default async function ProductRoot({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params
  redirect(`/p/${product}/dashboard`)
}

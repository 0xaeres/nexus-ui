import { ProductAsk } from '@/components/screens/ProductAsk'

export default async function AskPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  return <ProductAsk productId={product} />
}

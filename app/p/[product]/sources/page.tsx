import { Sources } from '@/components/screens/Sources'

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  return <Sources productId={product} />
}

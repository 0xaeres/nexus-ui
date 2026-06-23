import { ConnectorNew } from '@/components/screens/ConnectorNew'

export default async function SourcesNewPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  return <ConnectorNew productId={product} />
}

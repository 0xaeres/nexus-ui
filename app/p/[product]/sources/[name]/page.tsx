import { ConnectorDetail } from '@/components/screens/ConnectorDetail'

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ product: string; name: string }>
}) {
  const { product, name } = await params
  return <ConnectorDetail productId={product} name={name} />
}

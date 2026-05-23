import { IngestStage } from '@/components/screens/IngestStage'

export default async function IngestPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  return <IngestStage productId={product} />
}

import { ReviewStage } from '@/components/screens/ReviewStage'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  return <ReviewStage productId={product} />
}

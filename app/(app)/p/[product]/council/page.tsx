import { CouncilStage } from '@/components/screens/CouncilStage'

export default async function CouncilPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  return <CouncilStage productId={product} />
}

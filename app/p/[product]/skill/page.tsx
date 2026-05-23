import { SkillStage } from '@/components/screens/SkillStage'

export default async function SkillPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  return <SkillStage productId={product} />
}

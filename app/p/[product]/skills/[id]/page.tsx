import { SkillDetailPage } from '@/components/screens/SkillDetailPage'

export default async function SkillDetailRoute({
  params,
}: {
  params: Promise<{ product: string; id: string }>
}) {
  const { id } = await params
  return <SkillDetailPage skillId={decodeURIComponent(id)} />
}

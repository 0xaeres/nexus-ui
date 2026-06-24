import { SkillDetailPage } from '@/components/screens/SkillDetailPage'

export default async function SkillDetailRoute({
  params,
}: {
  params: Promise<{ product: string; id: string[] }>
}) {
  const { id } = await params
  const skillId = id.map(decodeURIComponent).join('/')
  return <SkillDetailPage skillId={skillId} />
}

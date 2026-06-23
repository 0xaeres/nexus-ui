import { CouncilSession } from '@/components/screens/CouncilSession'

export default async function CouncilSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <CouncilSession sessionId={sessionId} />
}

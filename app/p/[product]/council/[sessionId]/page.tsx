import { CouncilSession } from '@/components/screens/CouncilSession'

export default async function CouncilSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  // Derive skillKind from sessionId prefix for demo
  const kind = sessionId.includes('master') ? 'master'
    : sessionId.includes('security') ? 'security'
    : sessionId.includes('language') ? 'language'
    : 'tech_stack'
  return <CouncilSession skillKind={kind as 'master' | 'tech_stack' | 'language' | 'security'} />
}

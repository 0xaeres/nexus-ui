import { ConnectorDetail } from '@/components/screens/ConnectorDetail'

export default async function SourceDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  return <ConnectorDetail name={name} />
}

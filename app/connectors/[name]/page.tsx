import { redirect } from 'next/navigation'
export default async function ConnectorDetailLegacy({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  redirect(`/p/forge/sources/${name}`)
}

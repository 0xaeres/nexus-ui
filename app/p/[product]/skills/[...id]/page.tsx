import { redirect } from 'next/navigation'

export default async function SkillDetailRoute({
  params,
}: {
  params: Promise<{ product: string; id: string[] }>
}) {
  const { product } = await params
  redirect(`/p/${product}/skills`)
}

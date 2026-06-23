import { redirect } from 'next/navigation'

export default async function SkillPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  redirect(`/p/${product}/skills`)
}

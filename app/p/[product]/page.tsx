import { redirect } from 'next/navigation'
import { ApiError, getProductStatus } from '@/lib/api'
import type { ProductStage } from '@/lib/types'

const STAGE_PATH: Record<ProductStage, string> = {
  none: 'ingest',
  ingesting: 'ingest',
  council: 'council',
  review: 'review',
  skill: 'skill',
}

export const dynamic = 'force-dynamic'

export default async function ProductRoot({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  let stage: ProductStage = 'none'
  try {
    const status = await getProductStatus(product)
    stage = status.currentStage
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      // Layout guard will render not-found.
      return null
    }
    // Backend transient: fall through to the ingest stage which surfaces errors.
  }
  redirect(`/p/${product}/${STAGE_PATH[stage]}`)
}

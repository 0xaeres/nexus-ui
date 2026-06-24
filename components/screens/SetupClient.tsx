'use client'
import { PageBody, PageHeader } from '@/components/ui/page'
import { H1 } from '@/components/ui/typography'
import { McpSetupCard } from '@/components/screens/McpSetupCard'
import { useProduct } from '@/lib/product-context'

export function SetupClient() {
  const { currentProduct, currentProductId } = useProduct()
  const productName = currentProduct?.name ?? currentProductId

  return (
    <>
      <PageHeader>
        <H1>Setup client</H1>
      </PageHeader>
      <PageBody>
        <McpSetupCard productId={currentProductId} productName={productName} />
      </PageBody>
    </>
  )
}

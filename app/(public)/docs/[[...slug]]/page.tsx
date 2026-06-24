import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsChrome, DocsUnavailable } from '@/components/docs/DocsChrome'
import { extractHeadings } from '@/lib/docs/markdown'
import { findDocPage, getDocs } from '@/lib/docs/tina'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Docs · Anvay',
  description: 'Documentation for Anvay, the MCP-native context engine.',
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const docs = await getDocs()
  if (!docs.ok) {
    return <DocsUnavailable message={docs.message} />
  }

  const page = findDocPage(docs.pages, slug)
  if (!page) notFound()

  return (
    <DocsChrome
      page={page}
      pages={docs.pages}
      groups={docs.groups}
      headings={extractHeadings(page.body)}
    />
  )
}

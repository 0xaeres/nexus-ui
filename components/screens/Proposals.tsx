'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageBody, PageHeader } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import {
  ApiError,
  approveProposal,
  listProposals,
  rejectProposal,
} from '@/lib/api'
import type { SkillProposal } from '@/lib/types'

/**
 * Connected reference screen for the Slice 4 backend.
 * Lists pending proposals and routes approve/reject through the FastAPI surface.
 */
export function Proposals() {
  const { currentProductId, currentUser } = useProduct()
  const [items, setItems] = useState<SkillProposal[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await listProposals({
        status: 'pending',
        productId: currentProductId,
      })
      setItems(list)
      setError(null)
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e)
      setError(msg)
      setItems([])
    }
  }, [currentProductId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onApprove = async (id: string) => {
    setPending(id)
    try {
      await approveProposal(id, currentUser?.name ?? 'unknown')
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setPending(null)
    }
  }

  const onReject = async (id: string) => {
    const reason = window.prompt('Reason for rejection?')
    if (!reason) return
    setPending(id)
    try {
      await rejectProposal(id, reason)
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <PageHeader>
        <H1>Proposals</H1>
        <Badge variant="outline" className="font-mono">
          {currentProductId}
        </Badge>
        <div className="flex-1" />
        <Subtle className="font-mono">
          {items?.length ?? '…'} pending
        </Subtle>
      </PageHeader>

      <PageBody>
        {error && (
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        )}

        {items === null && !error ? (
          <Card variant="surface" className="px-5 py-4">
            <Muted>Loading…</Muted>
          </Card>
        ) : items && items.length === 0 ? (
          <Card variant="surface" className="px-5 py-4">
            <H3>No pending proposals</H3>
            <Small>
              Kick off a council with{' '}
              <code className="font-mono">
                nexus council draft --product {currentProductId} --topic ...
              </code>
            </Small>
          </Card>
        ) : (
          <Card variant="surface" className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Citations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items ?? []).map((p) => (
                  <ProposalRow
                    key={p.id}
                    proposal={p}
                    busy={pending === p.id}
                    onApprove={() => onApprove(p.id)}
                    onReject={() => onReject(p.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <Separator />
        <Muted className="font-mono">
          Endpoint: {process.env.NEXT_PUBLIC_NEXUS_API ?? 'http://localhost:8000'}
        </Muted>
      </PageBody>
    </>
  )
}

function ProposalRow({
  proposal,
  busy,
  onApprove,
  onReject,
}: {
  proposal: SkillProposal
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const conf = Math.round((proposal.confidence ?? 0) * 100)
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{proposal.name}</TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {proposal.skill_kind}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">{conf}%</TableCell>
      <TableCell className="font-mono text-sm">
        {proposal.citations?.length ?? 0}
      </TableCell>
      <TableCell className="font-mono text-sm text-fg-subtle">
        {proposal.created_at?.slice(0, 19) ?? ''}
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button size="sm" variant="ghost" disabled={busy} onClick={onReject}>
          Reject
        </Button>
        <Button size="sm" disabled={busy} onClick={onApprove}>
          {busy ? 'Working…' : 'Approve'}
        </Button>
      </TableCell>
    </TableRow>
  )
}

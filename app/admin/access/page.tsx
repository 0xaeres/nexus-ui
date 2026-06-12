'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { H1, Muted, SectionLabel } from '@/components/ui/typography'
import {
  approveAccessRequest,
  listAccessRequests,
  listUsers,
  rejectAccessRequest,
  revokeUser,
} from '@/lib/api'
import type { User } from '@/lib/types'
import type { AccessRequest } from '@/lib/api'

export default function AdminAccessPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [passwords, setPasswords] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    const [reqs, us] = await Promise.all([listAccessRequests(), listUsers()])
    setRequests(reqs)
    setUsers(us)
  }

  useEffect(() => {
    refresh().catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const approve = async (id: string) => {
    await approveAccessRequest(id, { role: 'viewer', password: passwords[id] || '' })
    await refresh()
  }

  return (
    <main className="p-6 flex flex-col gap-6">
      <div>
        <H1>Access</H1>
        <Muted>Approve requests and revoke users</Muted>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Card variant="surface">
        <CardHeader><SectionLabel>Pending requests</SectionLabel></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {requests.length === 0 && <Muted>No pending requests.</Muted>}
          {requests.map((req) => (
            <div key={req.id} className="grid gap-2 rounded-md border border-border p-3">
              <div className="font-mono text-sm">{req.email}</div>
              <Muted>{req.name || 'No name'} · {req.reason || 'No reason'}</Muted>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Temporary password"
                  value={passwords[req.id] || ''}
                  onChange={(e) => setPasswords({ ...passwords, [req.id]: e.target.value })}
                />
                <Button size="sm" onClick={() => approve(req.id)}>
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await rejectAccessRequest(req.id)
                    await refresh()
                  }}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card variant="surface">
        <CardHeader><SectionLabel>Users</SectionLabel></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div className="flex-1">
                <div className="font-mono text-sm">{user.email || user.name}</div>
                <Muted>{user.role}</Muted>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (user.email) {
                    await revokeUser(user.email)
                    await refresh()
                  }
                }}
              >
                Revoke
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}

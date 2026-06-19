'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Code, H1, Muted, SectionLabel, Small } from '@/components/ui/typography'
import {
  approveAccessRequest,
  listAccessRequests,
  listUsers,
  rejectAccessRequest,
  revokeUser,
} from '@/lib/api'
import type { User } from '@/lib/types'
import type { AccessRequest } from '@/lib/api'

const MIN_TEMP_PASSWORD_LENGTH = 8
const USER_ROLES = ['viewer', 'editor', 'admin'] as const
type ApprovalRole = (typeof USER_ROLES)[number]

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export function AdminAccessScreen() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [passwords, setPasswords] = useState<Record<string, string>>({})
  const [roles, setRoles] = useState<Record<string, ApprovalRole>>({})
  const [error, setError] = useState<string | null>(null)
  const [pendingByRequest, setPendingByRequest] = useState<Record<string, boolean>>({})
  const [pendingRevokeByUser, setPendingRevokeByUser] = useState<Record<string, boolean>>({})

  const refresh = async () => {
    const [reqs, us] = await Promise.all([listAccessRequests(), listUsers()])
    setRequests(reqs)
    setUsers(us)
  }

  useEffect(() => {
    refresh().catch((e) => setError(errorMessage(e)))
  }, [])

  const approve = async (id: string) => {
    if (pendingByRequest[id]) return
    const password = passwords[id] ?? ''
    if (password.length < MIN_TEMP_PASSWORD_LENGTH) {
      setError(`Temporary password must be at least ${MIN_TEMP_PASSWORD_LENGTH} characters.`)
      return
    }

    try {
      setPendingByRequest((s) => ({ ...s, [id]: true }))
      setError(null)
      await approveAccessRequest(id, { role: roles[id] ?? 'viewer', password })
      await refresh()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPendingByRequest((s) => ({ ...s, [id]: false }))
    }
  }

  const reject = async (id: string) => {
    if (pendingByRequest[id]) return
    try {
      setPendingByRequest((s) => ({ ...s, [id]: true }))
      setError(null)
      await rejectAccessRequest(id)
      await refresh()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPendingByRequest((s) => ({ ...s, [id]: false }))
    }
  }

  const revoke = async (user: User) => {
    if (pendingRevokeByUser[user.id]) return
    if (!user.email) {
      setError('Cannot revoke user without an email address.')
      return
    }

    try {
      setPendingRevokeByUser((s) => ({ ...s, [user.id]: true }))
      setError(null)
      await revokeUser(user.email)
      await refresh()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPendingRevokeByUser((s) => ({ ...s, [user.id]: false }))
    }
  }

  return (
    <main className="p-6 flex flex-col gap-6">
      <div>
        <H1>Access</H1>
        <Muted>Approve requests and revoke users</Muted>
      </div>
      {error && <Small className="text-danger">{error}</Small>}
      <Card variant="surface">
        <CardHeader><SectionLabel>Pending requests</SectionLabel></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {requests.length === 0 && <Muted>No pending requests.</Muted>}
          {requests.map((req) => (
            <div key={req.id} className="grid gap-2 rounded-md border border-border p-3">
              <Code>{req.email}</Code>
              <Muted>{req.name || 'No name'} · {req.reason || 'No reason'}</Muted>
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    type="password"
                    placeholder="Temporary password"
                    value={passwords[req.id] || ''}
                    minLength={MIN_TEMP_PASSWORD_LENGTH}
                    aria-label="Temporary password"
                    aria-invalid={(passwords[req.id] ?? '').length > 0 && (passwords[req.id] ?? '').length < MIN_TEMP_PASSWORD_LENGTH}
                    onChange={(e) => setPasswords({ ...passwords, [req.id]: e.target.value })}
                  />
                  {(passwords[req.id] ?? '').length > 0 && (passwords[req.id] ?? '').length < MIN_TEMP_PASSWORD_LENGTH && (
                    <Small className="text-danger">
                      Minimum {MIN_TEMP_PASSWORD_LENGTH} characters.
                    </Small>
                  )}
                </div>
                <select
                  aria-label="Role"
                  value={roles[req.id] ?? 'viewer'}
                  onChange={(e) => setRoles({ ...roles, [req.id]: e.target.value as ApprovalRole })}
                  disabled={pendingByRequest[req.id]}
                  className="h-9 rounded-md border border-border bg-surface px-3 font-mono text-xs text-fg"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => approve(req.id)}
                  disabled={pendingByRequest[req.id] || (passwords[req.id] ?? '').length < MIN_TEMP_PASSWORD_LENGTH}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reject(req.id)}
                  disabled={pendingByRequest[req.id]}
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
                <Code>{user.email || user.name || user.id || 'Unknown user'}</Code>
                <Muted>{user.role}</Muted>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => revoke(user)}
                disabled={pendingRevokeByUser[user.id]}
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

'use client'
import { useMemo, useState } from 'react'
import { CheckCircle2, Clipboard, Plug } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Code, H2, H3, Muted, SectionLabel, Small } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const MCP_URL_PLACEHOLDER = 'https://<your-nexus-mcp-server>/mcp'

type Client = {
  id: string
  name: string
  note: string
  buildAddPrompt: (input: PromptInput) => string
}

type PromptInput = {
  productId: string
  productName: string
  serverName: string
}

const CLIENTS: Client[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    note: 'Best path: add remote HTTP server with Claude MCP command.',
    buildAddPrompt: ({ serverName }) => `## Add Nexus MCP to Claude Code

Add a remote HTTP MCP server named \`${serverName}\`.

\`\`\`bash
claude mcp add --transport http ${serverName} ${MCP_URL_PLACEHOLDER}
\`\`\`

If Nexus MCP requires auth, ask me for the token, then add the required \`Authorization\` header.
After adding it, run \`/mcp\` and confirm the server is listed.`,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    note: 'Uses mcp.json with top-level mcpServers and remote url.',
    buildAddPrompt: ({ serverName }) => `## Add Nexus MCP to Cursor

Open Cursor MCP settings, then add this server to either project config \`.cursor/mcp.json\` or global config \`~/.cursor/mcp.json\`.

\`\`\`json
{
  "mcpServers": {
    "${serverName}": {
      "url": "${MCP_URL_PLACEHOLDER}"
    }
  }
}
\`\`\`

If Nexus MCP requires auth, ask me for the token, then add it under \`headers\`.
Reload Cursor after saving.`,
  },
  {
    id: 'codex',
    name: 'Codex',
    note: 'Uses config.toml with [mcp_servers.<name>] and url.',
    buildAddPrompt: ({ serverName }) => `## Add Nexus MCP to Codex

Open Codex MCP settings or edit \`~/.codex/config.toml\`. Add this remote HTTP MCP server:

\`\`\`toml
[mcp_servers.${serverName}]
url = "${MCP_URL_PLACEHOLDER}"
\`\`\`

If Nexus MCP requires auth, ask me for the token, then use \`bearer_token_env_var\`, \`http_headers\`, or \`env_http_headers\`.
Restart the Codex session after saving.`,
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    note: 'Uses mcp_config.json and remote serverUrl, not url.',
    buildAddPrompt: ({ serverName }) => `## Add Nexus MCP to Antigravity

Open Agent panel -> Manage MCP Servers -> View raw config. Add this to \`mcp_config.json\`.

\`\`\`json
{
  "mcpServers": {
    "${serverName}": {
      "serverUrl": "${MCP_URL_PLACEHOLDER}"
    }
  }
}
\`\`\`

If Nexus MCP requires auth, ask me for the token, then add the required \`headers\`.
Save, then refresh MCP servers in Antigravity.`,
  },
  {
    id: 'copilot',
    name: 'VS Code Copilot',
    note: 'Uses mcp.json with top-level servers, not mcpServers.',
    buildAddPrompt: ({ serverName }) => `## Add Nexus MCP to VS Code Copilot

Run \`MCP: Add Server\` or \`MCP: Open User Configuration\`. For workspace setup, edit \`.vscode/mcp.json\`.

\`\`\`json
{
  "servers": {
    "${serverName}": {
      "type": "http",
      "url": "${MCP_URL_PLACEHOLDER}"
    }
  }
}
\`\`\`

If Nexus MCP requires auth, ask me for the token, then add the required headers or input variables.
Start or restart the MCP server and approve the trust prompt if VS Code asks.`,
  },
]

export function McpSetupCard({
  productId,
  productName,
}: {
  productId: string
  productName: string
}) {
  const toast = useToast()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const selectedClient = CLIENTS.find((client) => client.id === selectedClientId) ?? null
  const serverName = useMemo(() => `nexus-${productId}`, [productId])

  const promptInput = useMemo(
    () => ({ productId, productName, serverName }),
    [productId, productName, serverName],
  )
  const addPrompt = selectedClient?.buildAddPrompt(promptInput) ?? ''
  const checkPrompt = selectedClient ? buildCheckPrompt({ client: selectedClient, ...promptInput }) : ''

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: `${label} copied`, variant: 'success' })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card variant="surface">
        <CardHeader>
          <div className="space-y-2">
            <Badge variant="accent">MCP</Badge>
            <H2>Select your MCP client</H2>
            <Muted>Choose one client. Setup prompts appear below.</Muted>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CLIENTS.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedClientId(client.id)}
                className={cn(
                  'flex min-h-12 items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                  selectedClientId === client.id
                    ? 'border-accent/40 bg-accent/10 text-fg'
                    : 'border-border bg-bg/45 text-fg-muted hover:bg-bg-hover hover:text-fg',
                )}
              >
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 shrink-0',
                    selectedClientId === client.id ? 'text-accent' : 'text-fg-subtle',
                  )}
                />
                <Small className="text-current">{client.name}</Small>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedClient ? (
        <Card variant="surface">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <H3>{selectedClient.name}</H3>
                <Muted>{selectedClient.note}</Muted>
              </div>
              <Badge variant="outline">{serverName}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <PromptStep
              index="1"
              icon={<Plug className="h-4 w-4" />}
              title="Prompt to add Nexus MCP"
              prompt={addPrompt}
              onCopy={() => copy(`${selectedClient.name} add prompt`, addPrompt)}
            />
            <PromptStep
              index="2"
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="Prompt to verify connection"
              prompt={checkPrompt}
              onCopy={() => copy(`${selectedClient.name} check prompt`, checkPrompt)}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function PromptStep({
  index,
  icon,
  title,
  prompt,
  onCopy,
}: {
  index: string
  icon: React.ReactNode
  title: string
  prompt: string
  onCopy: () => void
}) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-xs text-accent">
            {index}
          </span>
          {icon}
          {title}
        </SectionLabel>
        <Button type="button" variant="secondary" size="sm" onClick={onCopy}>
          <Clipboard className="h-3.5 w-3.5" />
          Copy prompt
        </Button>
      </div>
      <div className="rounded-md border border-border bg-surface-sunk p-3">
        <Code className="block whitespace-pre-wrap break-words">{prompt}</Code>
      </div>
    </section>
  )
}

function buildCheckPrompt({
  client,
  productId,
  productName,
  serverName,
}: PromptInput & {
  client: Client
}) {
  return `## Verify Nexus MCP in ${client.name}

Use MCP server \`${serverName}\`.
Call \`find_skills\` with:

\`\`\`json
{
  "query": "healthcheck",
  "context": "general",
  "top_k": 1
}
\`\`\`

If the tool responds, reply exactly:

\`\`\`text
You are connected to Nexus, product name: ${productName}
\`\`\`

If it fails, show the MCP connection error and mention product id \`${productId}\`.`
}

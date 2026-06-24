'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const TABS = {
  sync: 'Ingest product context. Anvay keeps the knowledge base current.',
  query: 'Ask product questions. Get answers with source citations.',
  govern: 'Let experts draft. Humans edit, approve, or reject.',
} as const

type TabId = keyof typeof TABS

export function LandingPage() {
  const [tab, setTab] = useState<TabId>('sync')

  return (
    <main id="top" className="anvay-landing">
      <header className="anvay-landing-nav">
        <div className="anvay-landing-container anvay-landing-nav-inner">
          <a className="anvay-landing-brand" href="#top" aria-label="Anvay home">
            <span className="anvay-landing-mark" aria-hidden="true">
              <Image src="/anvay-symbol-v2.svg" alt="" width={22} height={22} priority />
            </span>
            <span>Anvay</span>
          </a>
          <nav className="anvay-landing-nav-links" aria-label="Primary">
            <a href="#why">Why Anvay</a>
            <a href="#how">How it works</a>
            <Link href="/docs">Docs</Link>
            <a href="#access">Request access</a>
          </nav>
          <div className="anvay-landing-nav-actions">
            <Link className="anvay-landing-btn anvay-landing-btn-primary" href="/request-access">Request access</Link>
            <Link className="anvay-landing-btn anvay-landing-btn-secondary" href="/login">Sign in</Link>
          </div>
        </div>
      </header>

      <div className="anvay-landing-container anvay-landing-hero">
        <div className="anvay-landing-hero-grid">
          <div>
            <div className="anvay-landing-eyebrow">Context your agents can trust</div>
            <h1 className="anvay-landing-heading-1">
              Your product, understood.
            </h1>
            <p className="anvay-landing-lead">
              Anvay turns product context into a living knowledge base for developers and AI agents.
            </p>
            <div className="anvay-landing-hero-actions">
              <Link className="anvay-landing-btn anvay-landing-btn-primary" href="/request-access">Request access</Link>
              <a className="anvay-landing-btn anvay-landing-btn-secondary" href="#how">See how it works</a>
            </div>
          </div>

          <ProductFrame />
        </div>
      </div>

      <section id="why" className="anvay-landing-section anvay-landing-spotlight">
        <div className="anvay-landing-container">
          <div className="anvay-landing-section-head">
            <h2 className="anvay-landing-heading-2">
              Stop coding from stale context.
            </h2>
            <p>
              Current sources. Grounded answers. Human control.
            </p>
          </div>
          <div className="anvay-landing-cards">
            <InfoCard label="Find" title="Get the right evidence." foot="dense · BM25 · grep · rerank">
              Hybrid retrieval ranks product knowledge, then cites the source.
            </InfoCard>
            <InfoCard label="Ask" title="Understand the product." foot="code · docs · repo map">
              Ask about architecture, behavior, or ownership—without repo spelunking.
            </InfoCard>
            <InfoCard label="Align" title="Give agents approved context." foot="edit · approve · reject">
              Expert agents draft guidance. Humans decide what becomes a skill.
            </InfoCard>
          </div>
        </div>
      </section>

      <section id="how" className="anvay-landing-section">
        <div className="anvay-landing-container anvay-landing-workflow-section">
          <div>
            <div className="anvay-landing-eyebrow">From source to skill</div>
            <h2 className="anvay-landing-heading-2">
              Connect. Ask. Approve.
            </h2>
            <p className="anvay-landing-lead">
              One product boundary. No context leaks.
            </p>
            <div className="anvay-landing-tabs" role="tablist" aria-label="Workflow preview">
              {(Object.keys(TABS) as TabId[]).map((tabId) => (
                <button
                  key={tabId}
                  className="anvay-landing-tab"
                  type="button"
                  role="tab"
                  aria-selected={tab === tabId}
                  onClick={() => setTab(tabId)}
                >
                  {tabId[0].toUpperCase() + tabId.slice(1)}
                </button>
              ))}
            </div>
            <div className="anvay-landing-tab-panel" role="tabpanel">
              {TABS[tab]}
            </div>
          </div>
          <aside className="anvay-landing-trace" aria-label="Context workflow trace">
            <div className="anvay-landing-trace-head">
              <div className="anvay-landing-label">Context run</div>
              <h3 className="anvay-landing-heading-3">
                Evidence first. Answer second.
              </h3>
            </div>
            <div className="anvay-landing-trace-list">
              <TraceRow time="00:11" agent="Plan" phase="Scope the product question" badge="plan" tone="green" />
              <TraceRow time="00:24" agent="Retrieve" phase="Rank sources and exact matches" badge="search" tone="violet" />
              <TraceRow time="00:37" agent="Trace" phase="Resolve symbols and dependencies" badge="map" tone="warn" />
              <TraceRow time="00:51" agent="Answer" phase="Return claims with citations" badge="cited" tone="green" />
            </div>
          </aside>
        </div>
      </section>

      <section id="delivery" className="anvay-landing-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-section-head">
            <h2 className="anvay-landing-heading-2">
              Context, where work happens.
            </h2>
            <p>
              Use Anvay on the web or serve product knowledge to any MCP client.
            </p>
          </div>
          <div className="anvay-landing-delivery-grid">
            <div className="anvay-landing-deliver-card">
              <span className="anvay-landing-pill anvay-landing-pill-spaced">MCP & API Access</span>
              <h3 className="anvay-landing-heading-3">
                Product context, inside your IDE.
              </h3>
              <p>Developers and agents retrieve source evidence and approved skills in their workflow.</p>
            </div>
            <pre className="anvay-landing-code" aria-label="Context tools example"><code><span className="anvay-landing-code-accent">context</span> payments
channels: vector + BM25 + grep + graph
graph: symbols · routes · files · docs
memory: <span className="anvay-landing-code-violet">approved skills</span>
tools: evidence_search_corpus · ask_product_graph</code></pre>
          </div>
          <div id="access" className="anvay-landing-cta-box">
            <div>
              <div className="anvay-landing-eyebrow">Start with one product</div>
              <h2 className="anvay-landing-heading-2">
                Give every agent the right context.
              </h2>
              <p>Connect your sources. Build shared product knowledge.</p>
            </div>
            <div className="anvay-landing-hero-actions">
              <Link className="anvay-landing-btn anvay-landing-btn-primary" href="/request-access">Request access</Link>
              <Link className="anvay-landing-btn anvay-landing-btn-secondary" href="/docs">Docs</Link>
              <Link className="anvay-landing-btn anvay-landing-btn-secondary" href="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function ProductFrame() {
  return (
    <aside className="anvay-landing-product-frame" aria-label="Anvay product preview">
      <div className="anvay-landing-frame-top">
        <div className="anvay-landing-dots"><span /><span /><span /></div>
        <span>/p/payments/ask</span>
      </div>
      <div className="anvay-landing-preview">
        <div className="anvay-landing-sidebar" aria-hidden="true">
          <div className="anvay-landing-side-item">Dashboard</div>
          <div className="anvay-landing-side-item active">Ask</div>
          <div className="anvay-landing-side-item">Sources</div>
          <div className="anvay-landing-side-item">Council</div>
          <div className="anvay-landing-side-item">Review</div>
          <div className="anvay-landing-side-item">Skills</div>
        </div>
        <div className="anvay-landing-preview-main">
          <div className="border border-border rounded-lg bg-surface-sunk px-3 py-2 flex items-center gap-2 shadow-inner">
            <span className="text-fg-subtle font-mono text-xs select-none">Ask:</span>
            <span className="text-fg text-xs font-medium font-sans">Why did checkout retry?</span>
            <span className="w-1 h-3.5 bg-accent animate-pulse-slow rounded-sm" />
          </div>

          <div className="anvay-landing-panel">
            <div className="anvay-landing-row">
              <div>
                <div className="anvay-landing-label">Grounded answer</div>
                <div className="text-xs text-fg-muted mt-0.5">Product context with citations</div>
              </div>
              <span className="anvay-landing-status">Cited answer</span>
            </div>
            <div className="anvay-landing-queue">
              <QueueRow index="01" title="Vector + BM25" meta="checkout worker · retry policy" action="rerank" />
              <QueueRow index="02" title="Graph traversal" meta="handler -> queue -> webhook" action="trace" />
              <QueueRow index="03" title="Approved memory" meta="payments-skill · known traps" action="guide" />
            </div>
          </div>
          <div className="anvay-landing-panel">
            <div className="anvay-landing-row">
              <span className="anvay-landing-mono-small">served via MCP</span>
              <span className="anvay-landing-mono-small subtle">Claude · Codex · Cursor</span>
            </div>
            <div className="anvay-landing-source-strip">
              <div className="anvay-landing-source-card"><span className="anvay-landing-label">coverage</span><strong>sources · graph · skills</strong></div>
              <div className="anvay-landing-source-card"><span className="anvay-landing-label">confidence</span><strong>citations + unknowns</strong></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function QueueRow({ index, title, meta, action }: { index: string; title: string; meta: string; action: string }) {
  return (
    <div className="anvay-landing-queue-row">
      <span className="anvay-landing-num">{index}</span>
      <span><strong>{title}</strong><br /><small>{meta}</small></span>
      <small>{action}</small>
    </div>
  )
}

function InfoCard({ label, title, foot, children }: { label: string; title: string; foot: string; children: string }) {
  return (
    <article className="anvay-landing-card">
      <div>
        <span className="anvay-landing-card-kicker">{label}</span>
        <h3 className="anvay-landing-heading-3">
          {title}
        </h3>
        <p>{children}</p>
      </div>
      <span className="anvay-landing-card-foot">{foot}</span>
    </article>
  )
}

function TraceRow({
  time,
  agent,
  phase,
  badge,
  tone,
}: {
  time: string
  agent: string
  phase: string
  badge: string
  tone: 'green' | 'violet' | 'warn'
}) {
  return (
    <div className="anvay-landing-trace-row">
      <span className="anvay-landing-mono-small">{time}</span>
      <span>
        <span className="anvay-landing-agent">{agent}</span><br />
        <span className="anvay-landing-phase">{phase}</span>
      </span>
      <span className={`anvay-landing-badge ${tone}`}>{badge}</span>
    </div>
  )
}

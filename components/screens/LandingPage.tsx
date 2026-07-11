import Image from 'next/image'
import Link from 'next/link'
import { LandingMotion, LandingNav, ScrollTopButton } from './LandingChrome'

const SOURCES = ['GitHub', 'Jira', 'Confluence', 'Filesystem', 'Remote MCP'] as const
const AGENTS = ['Claude Code', 'Codex', 'Cursor', 'Continue'] as const

const STEPS = [
  {
    num: '01',
    title: 'Connect your sources',
    body: 'Repos, tickets, docs, tribal knowledge. A live watch daemon keeps the brain current, delta-safe, never stale.',
  },
  {
    num: '02',
    title: 'The council drafts',
    body: 'A bounded LLM council retrieves evidence across six channels and writes a complete, cited product skill.',
  },
  {
    num: '03',
    title: 'Humans approve',
    body: 'Nothing ships until a human says so. Review, edit, approve: your brain is curated, not hallucinated.',
  },
  {
    num: '04',
    title: 'Every agent consumes',
    body: 'Approved skills and grounded evidence served over MCP to Claude, Codex, Cursor, Continue, the same brain everywhere.',
  },
] as const

const EVAL_STATS = [
  { value: '0.967', label: 'Evidence recall' },
  { value: '0.799', label: 'Ranking quality' },
  { value: '0.600', label: 'Answer correctness' },
  { value: '100%', label: 'Graph navigation' },
] as const

export function LandingPage() {
  return (
    <main id="top" className="anvay-landing">
      <LandingNav />
      <LandingMotion />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="anvay-landing-hero">
        <div className="anvay-landing-hero-art" aria-hidden="true">
          <div className="anvay-landing-orb anvay-landing-orb-a" />
          <div className="anvay-landing-orb anvay-landing-orb-b" />
          <div className="anvay-landing-hero-grid-bg" />
        </div>
        <div className="anvay-landing-hero-chips" aria-hidden="true">
          {SOURCES.map((s, i) => (
            <span key={s} className={`anvay-landing-chip anvay-landing-chip-${i + 1}`}>{s}</span>
          ))}
        </div>

        <div className="anvay-landing-container anvay-landing-hero-inner">
          <div className="anvay-landing-eyebrow">MCP-native context engine · Apache-2.0</div>
          <h1 className="anvay-landing-heading-1">
            A living brain<br />for your product.
          </h1>
          <p className="anvay-landing-lead">
            Anvay fuses your repos, tickets, docs, and hard-won tribal knowledge into one
            continuously-synced, <em>cited</em> intelligence layer, then serves it to every
            AI coding agent you use.
          </p>
          <div className="anvay-landing-hero-actions">
            <Link className="anvay-landing-btn anvay-landing-btn-primary anvay-landing-btn-lg" href="/request-access">
              Request access
            </Link>
            <a className="anvay-landing-btn anvay-landing-btn-secondary anvay-landing-btn-lg" href="#how">
              See how it works
            </a>
          </div>
          <div className="anvay-landing-agent-strip" aria-label="Supported agents">
            <span>Serves</span>
            {AGENTS.map((a) => (
              <strong key={a}>{a}</strong>
            ))}
            <span>over MCP</span>
          </div>
        </div>

        <div className="anvay-landing-container anvay-landing-frame-wrap">
          <ProductFrame />
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────── */}
      <section id="problem" className="anvay-landing-section">
        <div className="anvay-landing-container anvay-landing-narrow anvay-reveal">
          <div className="anvay-landing-eyebrow">The context problem is a knowledge problem</div>
          <h2 className="anvay-landing-heading-2">
            Every product carries a brain that lives nowhere.
          </h2>
          <p className="anvay-landing-prose">
            Split across the codebase, the Jira board, and the senior engineer who answers the
            same Slack question every week. Your AI agents get <strong>none</strong>{' '}
            of it, so
            they don&apos;t know your conventions or why that &ldquo;obvious&rdquo; refactor
            pages someone at 3am.
          </p>
          <p className="anvay-landing-prose anvay-landing-prose-strong">
            Not a search box. Not another wiki. A retrieval engine that reasons over everything
            your product knows, grounded in real source lines.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="anvay-landing-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-section-head anvay-reveal">
            <h2 className="anvay-landing-heading-2">From scattered context to a served brain.</h2>
            <p>One product boundary. No context leaks. Humans in the loop.</p>
          </div>
          <div className="anvay-landing-steps">
            {STEPS.map((step) => (
              <article key={step.num} className="anvay-landing-step anvay-reveal">
                <span className="anvay-landing-step-num">{step.num}</span>
                <h3 className="anvay-landing-heading-3">{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento: the hard parts ────────────────────────────── */}
      <section className="anvay-landing-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-section-head anvay-reveal">
            <h2 className="anvay-landing-heading-2">The hard parts, done right.</h2>
            <p>Anyone can stuff files into a vector database. Anvay is everything after that.</p>
          </div>
          <div className="anvay-landing-bento">
            <article className="anvay-landing-tile anvay-landing-tile-3 anvay-reveal">
              <div className="anvay-landing-tile-kicker">retrieve_evidence()</div>
              <h3 className="anvay-landing-heading-3">Retrieval that doesn&apos;t lie.</h3>
              <p>
                Six complementary channels, mixed with cross-encoder reranking, channel quotas,
                file diversity, and a coverage gate. One call.
              </p>
              <div className="anvay-landing-channel-chips">
                {['dense', 'BM25', 'grep', 'repo map', 'graph', 'skills'].map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </article>
            <article className="anvay-landing-tile anvay-landing-tile-3 anvay-reveal">
              <div className="anvay-landing-tile-kicker">knowledge graph</div>
              <h3 className="anvay-landing-heading-3">&ldquo;What breaks if I change this?&rdquo;</h3>
              <p>
                Tree-sitter extraction plus a bounded, validated LLM fact layer (CALLS,
                IMPLEMENTS, DEPENDS_ON) answers multi-hop impact questions across symbols,
                files, and services.
              </p>
            </article>
            <article className="anvay-landing-tile anvay-landing-tile-2 anvay-reveal">
              <div className="anvay-landing-tile-kicker">delta-safe sync</div>
              <h3 className="anvay-landing-heading-3">The index never poisons itself.</h3>
              <p>Changed resources embed before stale cleanup. A failed embed keeps the last good vectors.</p>
            </article>
            <article className="anvay-landing-tile anvay-landing-tile-2 anvay-reveal">
              <div className="anvay-landing-tile-kicker">human approval</div>
              <h3 className="anvay-landing-heading-3">Agents draft. Humans decide.</h3>
              <p>Nothing becomes a skill without explicit approval. Curated, not hallucinated.</p>
            </article>
            <article className="anvay-landing-tile anvay-landing-tile-2 anvay-reveal">
              <div className="anvay-landing-tile-kicker">eval-gated</div>
              <h3 className="anvay-landing-heading-3">Quality you can prove.</h3>
              <p>Recall, MRR, nDCG, faithfulness: hard floors that fail CI. &ldquo;Better&rdquo; is a number, not a vibe.</p>
            </article>
            <article className="anvay-landing-tile anvay-landing-tile-6 anvay-landing-tile-banner anvay-reveal">
              <div>
                <div className="anvay-landing-tile-kicker">product-scoped tenancy</div>
                <h3 className="anvay-landing-heading-3">Your brains never leak into each other.</h3>
              </div>
              <p>
                Every chunk, proposal, session, skill, and query is scoped by product. There is no
                cross-product read path. Crossing the boundary is a bug, not a feature.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Eval stats ───────────────────────────────────────── */}
      <section id="quality" className="anvay-landing-section anvay-landing-stats-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-section-head anvay-landing-section-head-center anvay-reveal">
            <div className="anvay-landing-eyebrow">Eval-gated</div>
            <h2 className="anvay-landing-heading-2">Quality is a number, not a vibe.</h2>
            <p>Latest full eval run: Zod and Guava corpora, 15 grounded questions each.</p>
          </div>
          <div className="anvay-landing-stats anvay-reveal">
            {EVAL_STATS.map((s) => (
              <div key={s.label} className="anvay-landing-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="anvay-landing-stats-note anvay-reveal">
            Shipping retrieval, measured end to end · hard floors fail CI
          </p>
        </div>
      </section>

      {/* ── MCP / IDE ────────────────────────────────────────── */}
      <section className="anvay-landing-section">
        <div className="anvay-landing-container anvay-landing-delivery-grid">
          <div className="anvay-reveal">
            <div className="anvay-landing-eyebrow">Context, where work happens</div>
            <h2 className="anvay-landing-heading-2">Product context, inside your IDE.</h2>
            <p className="anvay-landing-prose">
              Approved skills are ordinary Agent Skills served over MCP. Point any client at the
              server and it retrieves cited evidence, traces the product graph, and loads
              human-approved guidance, the same way your team does.
            </p>
          </div>
          <pre className="anvay-landing-code anvay-reveal" aria-label="MCP tools"><code>{`$ anvay-mcp-server --product payments

`}<span className="anvay-landing-code-accent">find_skills</span>{`             rank curated skills for the task
`}<span className="anvay-landing-code-accent">evidence_search_corpus</span>{`  hybrid + grep + repo map + graph
`}<span className="anvay-landing-code-accent">ask_product_graph</span>{`       multi-hop, cited answers
`}<span className="anvay-landing-code-mint">report_outcome</span>{`          close the feedback loop`}</code></pre>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="anvay-landing-section anvay-landing-cta-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-cta-box anvay-reveal">
            <div className="anvay-landing-cta-orb" aria-hidden="true" />
            <h2 className="anvay-landing-heading-2">Give every agent the right context.</h2>
            <p>Start with one product. Connect your sources. Build the brain.</p>
            <div className="anvay-landing-hero-actions anvay-landing-cta-actions">
              <Link className="anvay-landing-btn anvay-landing-btn-primary anvay-landing-btn-lg" href="/request-access">Request access</Link>
              <Link className="anvay-landing-btn anvay-landing-btn-secondary anvay-landing-btn-lg" href="/docs">Read the docs</Link>
            </div>
          </div>
        </div>
      </section>

      <ScrollTopButton />

      <footer className="anvay-landing-footer">
        <div className="anvay-landing-container anvay-landing-footer-inner">
          <div className="anvay-landing-brand">
            <Image src="/anvay-symbol-v4.svg" alt="" width={20} height={20} />
            <span>Anvay</span>
          </div>
          <div className="anvay-landing-footer-links">
            <Link href="/docs">Docs</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/request-access">Request access</Link>
          </div>
          <span className="anvay-landing-footer-license">Apache-2.0</span>
        </div>
      </footer>
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
          <div className="anvay-landing-ask-bar">
            <span className="anvay-landing-mono-small">Ask:</span>
            <span>Why did checkout retry?</span>
            <span className="anvay-landing-caret" />
          </div>

          <div className="anvay-landing-panel">
            <div className="anvay-landing-row">
              <div>
                <div className="anvay-landing-label">Grounded answer</div>
                <div className="anvay-landing-panel-sub">Product context with citations</div>
              </div>
              <span className="anvay-landing-status">cited</span>
            </div>
            <div className="anvay-landing-queue">
              <QueueRow index="01" title="Vector + BM25" meta="checkout worker · retry policy" action="rerank" />
              <QueueRow index="02" title="Graph traversal" meta="handler → queue → webhook" action="trace" />
              <QueueRow index="03" title="Approved memory" meta="payments-skill · known traps" action="guide" />
            </div>
          </div>
          <div className="anvay-landing-panel">
            <div className="anvay-landing-row">
              <span className="anvay-landing-mono-small">served via MCP</span>
              <span className="anvay-landing-mono-small subtle">Claude · Codex · Cursor · Continue</span>
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

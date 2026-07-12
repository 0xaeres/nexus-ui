import Image from 'next/image'
import Link from 'next/link'
import { BrandIcon } from '@/components/icons/BrandIcon'
import { LandingMotion, LandingNav } from './LandingChrome'
import { QUICKSTART_URL, REPOS } from '@/lib/links'

const AGENTS = ['Claude Code', 'Codex', 'Cursor', 'Continue'] as const

const STEPS = [
  {
    num: '01',
    title: 'Connect your sources',
    body: 'Repos, tickets, docs. A watch daemon keeps the index current.',
  },
  {
    num: '02',
    title: 'Agents draft skills',
    body: 'An LLM council drafts cited skills from six retrieval channels.',
  },
  {
    num: '03',
    title: 'Humans review',
    body: 'Nothing ships without explicit approval.',
  },
  {
    num: '04',
    title: 'Served over MCP',
    body: 'Claude Code, Codex, Cursor, and Continue, all from the same source.',
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

        <div className="anvay-landing-container anvay-landing-hero-inner">
          <div className="anvay-landing-eyebrow">Open source · Self-hosted · Apache-2.0</div>
          <h1 className="anvay-landing-heading-1">
            The context engine<br />for AI coding agents.
          </h1>
          <p className="anvay-landing-lead">
            Anvay indexes your repos, tickets, and docs into a cited knowledge base and
            serves it to your coding agents over MCP. Your context never leaves your infrastructure.
          </p>
          <div className="anvay-landing-hero-actions">
            <Link className="anvay-landing-btn anvay-landing-btn-primary anvay-landing-btn-lg" href={QUICKSTART_URL}>
              Deploy Anvay
            </Link>
            <a
              className="anvay-landing-btn anvay-landing-btn-secondary anvay-landing-btn-lg"
              href={REPOS.backend}
              target="_blank"
              rel="noreferrer"
            >
              <BrandIcon id="github" size={17} />
              View on GitHub
            </a>
          </div>
          <p className="anvay-landing-hero-note">
            No waitlist. Run it on your own machine or cloud. <Link href="/login">Sign in</Link>.
          </p>
          <div className="anvay-landing-agent-strip" aria-label="Supported agents">
            <span>Serves</span>
            {AGENTS.map((a) => (
              <strong key={a}>{a}</strong>
            ))}
            <span>over MCP</span>
          </div>
        </div>

        <div className="anvay-landing-container anvay-landing-frame-wrap anvay-reveal">
          <ProductFrame />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="anvay-landing-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-section-head anvay-reveal">
            <h2 className="anvay-landing-heading-2">How it works</h2>
            <p>
              Four stages, humans in the loop. <Link href="/docs">Details in the docs</Link>.
            </p>
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

      {/* ── Eval stats ───────────────────────────────────────── */}
      <section id="quality" className="anvay-landing-section anvay-landing-stats-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-section-head anvay-landing-section-head-center anvay-reveal">
            <h2 className="anvay-landing-heading-2">Retrieval quality, measured.</h2>
            <p>End-to-end eval runs on real corpora. Hard floors fail CI.</p>
          </div>
          <div className="anvay-landing-stats anvay-reveal">
            {EVAL_STATS.map((s) => (
              <div key={s.label} className="anvay-landing-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="anvay-landing-section anvay-landing-cta-section">
        <div className="anvay-landing-container">
          <div className="anvay-landing-cta-box anvay-reveal">
            <h2 className="anvay-landing-heading-2">Give every agent the right context.</h2>
            <p>Self-host in minutes. Start with one product.</p>
            <div className="anvay-landing-hero-actions anvay-landing-cta-actions">
              <Link className="anvay-landing-btn anvay-landing-btn-primary anvay-landing-btn-lg" href={QUICKSTART_URL}>Deploy Anvay</Link>
              <Link className="anvay-landing-btn anvay-landing-btn-secondary anvay-landing-btn-lg" href="/docs">Read the docs</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="anvay-landing-footer">
        <div className="anvay-landing-container anvay-landing-footer-inner">
          <div className="anvay-landing-brand">
            <Image src="/anvay-symbol-v4.svg" alt="" width={20} height={20} />
            <span>Anvay</span>
          </div>
          <div className="anvay-landing-footer-links">
            <Link href="/docs">Docs</Link>
            <a href={REPOS.backend} target="_blank" rel="noreferrer" className="anvay-landing-footer-github">
              <BrandIcon id="github" size={15} />
              GitHub
            </a>
            <Link href="/login">Sign in</Link>
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

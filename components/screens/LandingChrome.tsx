'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const SECTIONS = [
  { id: 'problem', label: 'Why Anvay' },
  { id: 'how', label: 'How it works' },
  { id: 'quality', label: 'Quality' },
] as const

/** Sticky nav with scroll progress, shrink-on-scroll, and scrollspy links. */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12)
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        progressRef.current?.style.setProperty(
          'transform',
          `scaleX(${max > 0 ? window.scrollY / max : 0})`,
        )
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (targets.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
        else if (window.scrollY < 200) setActive(null)
      },
      { rootMargin: '-30% 0px -55% 0px' },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])

  return (
    <header className="anvay-landing-nav" data-scrolled={scrolled || undefined}>
      <div className="anvay-landing-progress" aria-hidden="true">
        <div ref={progressRef} />
      </div>
      <div className="anvay-landing-container anvay-landing-nav-inner">
        <a className="anvay-landing-brand" href="#top" aria-label="Anvay home">
          <span className="anvay-landing-mark" aria-hidden="true">
            <Image src="/anvay-symbol-v4.svg" alt="" width={24} height={24} priority />
          </span>
          <span>Anvay</span>
        </a>
        <nav className="anvay-landing-nav-links" aria-label="Primary">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} data-active={active === s.id || undefined}>
              {s.label}
            </a>
          ))}
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="anvay-landing-nav-actions">
          <Link className="anvay-landing-btn anvay-landing-btn-secondary" href="/login">
            Sign in
          </Link>
          <Link className="anvay-landing-btn anvay-landing-btn-primary" href="/request-access">
            Request access
          </Link>
        </div>
      </div>
    </header>
  )
}

/** Floating back-to-top button, appears after scrolling past the hero. */
export function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setVisible(window.scrollY > 600))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <button
      type="button"
      className="anvay-landing-totop"
      data-visible={visible || undefined}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/**
 * JS fallback for browsers without CSS scroll-driven animations
 * (Safari, Firefox): IntersectionObserver reveals + lerped rAF parallax.
 * No-ops when `animation-timeline: view()` is supported or motion is reduced.
 */
export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (CSS.supports('animation-timeline: view()')) return

    const root = document.querySelector<HTMLElement>('.anvay-landing')
    if (!root) return
    root.classList.add('anvay-js-motion')

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    root.querySelectorAll('.anvay-reveal').forEach((el) => io.observe(el))

    const art = root.querySelector<HTMLElement>('.anvay-landing-hero-art')
    const chips = root.querySelector<HTMLElement>('.anvay-landing-hero-chips')
    const inner = root.querySelector<HTMLElement>('.anvay-landing-hero-inner')

    let target = 0
    let current = 0
    let raf = 0
    const tick = () => {
      current += (target - current) * 0.14
      if (art) art.style.transform = `translate3d(0, ${current * 0.1}px, 0)`
      if (chips) chips.style.transform = `translate3d(0, ${current * -0.14}px, 0)`
      if (inner) inner.style.transform = `translate3d(0, ${current * -0.045}px, 0)`
      raf = Math.abs(target - current) > 0.4 ? requestAnimationFrame(tick) : 0
    }
    const onScroll = () => {
      target = Math.min(window.scrollY, window.innerHeight * 1.2)
      if (!raf) raf = requestAnimationFrame(tick)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      io.disconnect()
      root.classList.remove('anvay-js-motion')
    }
  }, [])

  return null
}

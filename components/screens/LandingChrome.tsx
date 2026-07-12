'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BrandIcon } from '@/components/icons/BrandIcon'
import { REPOS } from '@/lib/links'

const SECTIONS = [
  { id: 'how', label: 'How it works' },
  { id: 'quality', label: 'Quality' },
] as const

/** Sticky nav with shrink-on-scroll and scrollspy links. */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 12))
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
          <Link className="anvay-landing-nav-signin" href="/login">
            Sign in
          </Link>
          <a
            className="anvay-landing-btn anvay-landing-btn-secondary"
            href={REPOS.backend}
            target="_blank"
            rel="noreferrer"
          >
            <BrandIcon id="github" size={16} />
            GitHub
          </a>
          <Link className="anvay-landing-btn anvay-landing-btn-primary" href="/docs/quickstart">
            Get started
          </Link>
        </div>
      </div>
    </header>
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
    const inner = root.querySelector<HTMLElement>('.anvay-landing-hero-inner')

    let target = 0
    let current = 0
    let raf = 0
    const tick = () => {
      current += (target - current) * 0.14
      if (art) art.style.transform = `translate3d(0, ${current * 0.1}px, 0)`
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

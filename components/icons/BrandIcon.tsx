import { SiGithub, SiJira, SiConfluence } from '@icons-pack/react-simple-icons'
import type { ComponentType } from 'react'

type IconProps = { size?: number; className?: string; color?: string; title?: string }

export const BRAND_ICONS: Record<string, ComponentType<IconProps>> = {
  github: SiGithub,
  jira: SiJira,
  confluence: SiConfluence,
}

export const BRAND_COLORS: Record<string, string> = {
  github: '#ECECEE',
  jira: '#2684FF',
  confluence: '#2684FF',
}

export function BrandIcon({
  id,
  size = 18,
  className,
  color,
}: { id: string; size?: number; className?: string; color?: string }) {
  const Icon = BRAND_ICONS[id]
  if (!Icon) return null
  return <Icon size={size} className={className} color={color ?? BRAND_COLORS[id] ?? 'currentColor'} />
}

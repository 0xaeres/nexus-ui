import { SiGithub } from '@icons-pack/react-simple-icons'
import type { ComponentType } from 'react'

type IconProps = { size?: number; className?: string; color?: string; title?: string }

const BRAND_ICONS: Record<string, ComponentType<IconProps>> = {
  github: SiGithub,
}

const BRAND_COLORS: Record<string, string> = {
  github: '#ECECEE',
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

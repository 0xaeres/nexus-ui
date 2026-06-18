'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type NexusLogoProps = {
  className?: string
  markOnly?: boolean
  priority?: boolean
  size?: 'sm' | 'md'
  tone?: 'dark' | 'light'
}

const SIZE = {
  sm: { width: 111, height: 24 },
  md: { width: 166, height: 36 },
}

export function NexusLogo({
  className,
  markOnly = false,
  priority = false,
  size = 'sm',
  tone = 'dark',
}: NexusLogoProps) {
  if (markOnly) {
    return (
      <Image
        src="/nexus-symbol-v2.svg"
        alt="Nexus"
        width={SIZE[size].height}
        height={SIZE[size].height}
        className={cn('shrink-0', className)}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={tone === 'light' ? '/nexus-logo-v2-light.svg' : '/nexus-logo-v2.svg'}
      alt="Nexus"
      width={SIZE[size].width}
      height={SIZE[size].height}
      className={cn('shrink-0', className)}
      priority={priority}
    />
  )
}

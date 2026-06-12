'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type NexusLogoProps = {
  className?: string
  markOnly?: boolean
  priority?: boolean
  size?: 'sm' | 'md'
}

const SIZE = {
  sm: { width: 92, height: 24 },
  md: { width: 138, height: 36 },
}

export function NexusLogo({
  className,
  markOnly = false,
  priority = false,
  size = 'sm',
}: NexusLogoProps) {
  if (markOnly) {
    return (
      <Image
        src="/nexus-logo.svg"
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
      src="/nexus-wordmark.svg"
      alt="Nexus"
      width={SIZE[size].width}
      height={SIZE[size].height}
      className={cn('shrink-0', className)}
      priority={priority}
    />
  )
}

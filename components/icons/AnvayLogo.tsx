'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type AnvayLogoProps = {
  className?: string
  markOnly?: boolean
  priority?: boolean
  size?: 'sm' | 'md'
  tone?: 'dark' | 'light'
}

const SIZE = {
  sm: { width: 68, height: 24 },
  md: { width: 102, height: 36 },
}

export function AnvayLogo({
  className,
  markOnly = false,
  priority = false,
  size = 'sm',
  tone = 'dark',
}: AnvayLogoProps) {
  if (markOnly) {
    return (
      <Image
        src="/anvay-symbol-v4.svg"
        alt="Anvay"
        width={SIZE[size].height}
        height={SIZE[size].height}
        className={cn('shrink-0', className)}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={tone === 'light' ? '/anvay-logo-v4-light.svg' : '/anvay-logo-v4.svg'}
      alt="Anvay"
      width={SIZE[size].width}
      height={SIZE[size].height}
      className={cn('shrink-0', className)}
      priority={priority}
    />
  )
}

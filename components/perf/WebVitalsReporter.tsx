'use client'

import { useReportWebVitals } from 'next/web-vitals'

type WebVitalPayload = {
  name: string
  value: number
  rating?: string
  id: string
  route: string
  product_id?: string
  navigation_type?: string
}

function csrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('nexus_csrf='))
    ?.split('=')
    .slice(1)
    .join('=')
}

function currentRoute() {
  return `${window.location.pathname}`
}

function currentProductId(route: string) {
  return route.match(/^\/p\/([^/]+)/)?.[1]
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const route = currentRoute()
    const payload: WebVitalPayload = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      route,
      product_id: currentProductId(route),
      navigation_type: metric.navigationType,
    }
    const body = JSON.stringify(payload)
    const csrf = csrfToken()

    if (csrf) {
      void fetch('/api/nexus/metrics/web-vitals', {
        method: 'POST',
        body,
        keepalive: true,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Nexus-CSRF': decodeURIComponent(csrf),
        },
      }).catch(() => undefined)
      return
    }

    navigator.sendBeacon?.(
      '/api/nexus/metrics/web-vitals',
      new Blob([body], { type: 'application/json' }),
    )
  })

  return null
}

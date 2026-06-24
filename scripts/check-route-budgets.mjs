import fs from 'node:fs'
import path from 'node:path'

const statsPath = path.join(process.cwd(), '.next/diagnostics/route-bundle-stats.json')

const HARD_LIMITS = [
  { route: '/', maxKb: 1900, targetKb: 900 },
  { route: /^\/p\/\[product\]/, maxKb: 825, targetKb: 760 },
  { route: /^(\/landing|\/login|\/request-access|\/new|\/setup|\/admin\/access|\/_not-found)$/, maxKb: 805, targetKb: 725 },
]

function label(route) {
  if (typeof route === 'string') return route
  return route.toString()
}

function limitsFor(route) {
  return HARD_LIMITS.find((entry) =>
    typeof entry.route === 'string' ? entry.route === route : entry.route.test(route),
  )
}

if (!fs.existsSync(statsPath)) {
  console.error(`Missing ${statsPath}. Run npm run build first.`)
  process.exit(1)
}

const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))
const failures = []
const warnings = []

for (const routeStats of stats) {
  const limit = limitsFor(routeStats.route)
  if (!limit) continue
  const kb = routeStats.firstLoadUncompressedJsBytes / 1024
  if (kb > limit.maxKb) {
    failures.push(`${routeStats.route}: ${kb.toFixed(1)} KB > hard cap ${limit.maxKb} KB (${label(limit.route)})`)
  } else if (kb > limit.targetKb) {
    warnings.push(`${routeStats.route}: ${kb.toFixed(1)} KB > target ${limit.targetKb} KB`)
  }
}

if (warnings.length > 0) {
  console.warn('Route bundle budget target warnings:')
  for (const warning of warnings) console.warn(`  - ${warning}`)
}

if (failures.length > 0) {
  console.error('Route bundle budget failures:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('Route bundle hard budgets passed.')

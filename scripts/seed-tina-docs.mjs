import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const docsRoot = process.env.ANVAY_DOCS_ROOT
  ? path.resolve(process.env.ANVAY_DOCS_ROOT)
  : path.resolve(root, '../anvay-docs/content/docs')

const requiredFields = ['title', 'description', 'slug', 'group', 'order']
const files = (await readdir(docsRoot))
  .filter((name) => name.endsWith('.mdx'))
  .sort()

if (!files.length) {
  throw new Error(`No curated MDX files found in ${docsRoot}`)
}

const slugs = new Set()
for (const file of files) {
  const source = await readFile(path.join(docsRoot, file), 'utf8')
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!frontmatter) throw new Error(`${file}: missing frontmatter`)

  for (const field of requiredFields) {
    if (!new RegExp(`^${field}:`, 'm').test(frontmatter[1])) {
      throw new Error(`${file}: missing ${field}`)
    }
  }

  const slug = frontmatter[1].match(/^slug:\s*["']?([^"'\n]+)["']?$/m)?.[1]?.trim()
  if (!slug) throw new Error(`${file}: invalid slug`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: invalid slug ${slug}`)
  if (slugs.has(slug)) throw new Error(`${file}: duplicate slug ${slug}`)
  slugs.add(slug)

  const body = source.slice(frontmatter[0].length)
  if (/<(?:p|h[1-6]|img|table|div|a)\b/i.test(body)) {
    throw new Error(`${file}: raw HTML is not supported in public docs`)
  }
}

console.log(`Validated ${files.length} curated Tina docs in ${docsRoot}`)
console.log('Publish by committing and pushing the anvay-docs repository; Tina Cloud indexes main.')

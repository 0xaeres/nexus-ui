import { defineConfig } from 'tinacms'

const branch =
  process.env.TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main'

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'media',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        label: 'Docs',
        name: 'doc',
        path: 'content/docs',
        format: 'mdx',
        fields: [
          { type: 'string', name: 'title', label: 'Title', required: true },
          { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
          { type: 'string', name: 'slug', label: 'Slug', required: true },
          { type: 'string', name: 'group', label: 'Navigation group', required: true },
          { type: 'number', name: 'order', label: 'Order', required: true },
          { type: 'string', name: 'sourceLabel', label: 'Source label' },
          { type: 'string', name: 'editUrl', label: 'Edit URL' },
          {
            type: 'string',
            name: 'body',
            label: 'Body',
            isBody: true,
            ui: { component: 'textarea' },
          },
        ],
        ui: {
          router: ({ document }) => {
            const slug = document._sys.filename === 'index' ? '' : document._sys.filename
            return slug ? `/docs/${slug}` : '/docs'
          },
        },
      },
    ],
  },
})

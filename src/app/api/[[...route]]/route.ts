import { OpenAPIHono } from '@hono/zod-openapi'
import { handle } from 'hono/vercel'
import { swaggerUI } from '@hono/swagger-ui'
import { imagesApp } from '@/lib/hono/routes/images'

// Create the main Hono app with OpenAPI support
const app = new OpenAPIHono().basePath('/api')

// Mount route modules
app.route('/', imagesApp)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', framework: 'Hono + Next.js' })
})

// Swagger UI
app.get('/hono-ui', swaggerUI({ url: '/api/hono-doc' }))

// OpenAPI spec
app.doc('/hono-doc', {
  openapi: '3.0.0',
  info: {
    title: 'Report Mapper API (Hono)',
    version: '1.0.0',
    description: 'Auto-generated API docs - FastAPI-like experience for TypeScript',
  },
})

// Export handlers for Next.js
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

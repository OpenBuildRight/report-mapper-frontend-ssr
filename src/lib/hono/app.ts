import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'

/**
 * Create the main Hono app with OpenAPI support
 */
export function createHonoApp() {
  // basePath is important for Next.js catch-all routes
  const app = new OpenAPIHono({ defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', issues: result.error.issues }, 400)
    }
  }})

  // Simple test route
  app.get('/', (c) => c.text('Hono API is running!'))

  // Add Swagger UI at /ui
  app.get('/ui', swaggerUI({ url: '/api/hono/doc' }))

  // OpenAPI spec endpoint
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      title: 'Report Mapper API (Hono)',
      version: '1.0.0',
      description: 'Auto-generated API documentation from Hono routes',
    },
    servers: [
      {
        url: 'http://localhost:3001/api/hono',
        description: 'Local development server',
      },
    ],
  })

  return app
}

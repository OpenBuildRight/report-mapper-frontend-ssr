'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'
import Link from 'next/link'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  const swaggerConfig = {
    url: '/api/doc',
    persistAuthorization: true,
    oauth2RedirectUrl: typeof window !== 'undefined'
      ? `${window.location.origin}/oauth2-redirect.html`
      : undefined,
    onComplete: (swaggerApi: any) => {
      if (swaggerApi && swaggerApi.initOAuth) {
        swaggerApi.initOAuth({
          clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'test-client',
          appName: 'Report Mapper API',
          scopeSeparator: ' ',
          scopes: 'openid profile email',
          useBasicAuthenticationWithAccessCodeGrant: false,
          usePkceWithAuthorizationCodeGrant: true,
        })
      }
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Documentation (Swagger UI)</h1>
            <p className="text-gray-600 mt-2">
              Interactive documentation for the Report Mapper API. Click "Authorize" to login with Keycloak.
            </p>
          </div>
          <Link
            href="/reference"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            Try Scalar UI
          </Link>
        </div>

        <SwaggerUI {...swaggerConfig} />
      </div>
    </div>
  )
}

import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    url: '/api/doc',
  },
  authentication: {
    preferredSecurityScheme: 'oauth2' as const,
    oauth2: {
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'test-client',
      scopes: ['openid', 'profile', 'email'],
    },
  },
  theme: 'purple' as const,
  layout: 'modern' as const,
  hideModels: false,
}

export const GET = ApiReference(config)

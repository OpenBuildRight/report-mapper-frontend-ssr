import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { config } from "@/config/env"
import { NextRequest, NextResponse } from "next/server"

/**
 * BFF (Backend-For-Frontend) API Proxy
 *
 * This proxy layer:
 * 1. Extracts the Keycloak access token from the server-side session
 * 2. Adds Authorization header with the token
 * 3. Forwards requests to the Java backend
 * 4. Returns the response to the frontend
 *
 * Benefits:
 * - OAuth tokens never exposed to browser (XSS-proof)
 * - Centralized authentication handling
 * - Follows OAuth 2.0 BCP for browser-based apps
 */

async function proxyToBackend(
  req: NextRequest,
  method: string,
  pathSegments: string[]
) {
  // Get session from server-side encrypted JWT
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized - No valid session" },
      { status: 401 }
    )
  }

  // Construct backend URL
  const backendPath = pathSegments.join('/')
  const backendUrl = `${config.backend.baseUrl}/api/${backendPath}`

  // Get query parameters
  const searchParams = req.nextUrl.searchParams.toString()
  const fullUrl = searchParams ? `${backendUrl}?${searchParams}` : backendUrl

  // Prepare headers
  const headers: HeadersInit = {
    'Authorization': `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  }

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method,
    headers,
  }

  // Add body for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const body = await req.text()
    if (body) {
      fetchOptions.body = body
    }
  }

  try {
    // Forward request to Java backend
    const response = await fetch(fullUrl, fetchOptions)

    // Get response data
    const data = await response.text()

    // Return response with same status code
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('Backend proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend service' },
      { status: 502 }
    )
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyToBackend(req, 'GET', path)
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyToBackend(req, 'POST', path)
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyToBackend(req, 'PUT', path)
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyToBackend(req, 'PATCH', path)
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyToBackend(req, 'DELETE', path)
}

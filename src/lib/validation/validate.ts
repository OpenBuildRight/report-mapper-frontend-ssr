import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Validate request body against a Zod schema
 * Returns either the parsed data or a NextResponse error
 */
export async function validateBody<T extends z.ZodType>(
  body: unknown,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation error',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validate query parameters against a Zod schema
 * Returns either the parsed data or a NextResponse error
 */
export function validateQuery<T extends z.ZodType>(
  params: Record<string, string | undefined>,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  try {
    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      ),
    }
  }
}

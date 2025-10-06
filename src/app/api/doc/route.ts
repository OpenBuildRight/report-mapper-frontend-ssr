import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import { config } from '@/config/env'

export async function GET() {
  // Read the OpenAPI spec from the public directory
  const specPath = path.join(process.cwd(), 'public', 'api-spec.yaml')
  let specContent = fs.readFileSync(specPath, 'utf-8')

  // Replace environment variables in the spec
  specContent = specContent.replace(/\$\{KEYCLOAK_ISSUER\}/g, config.keycloak.issuer)

  const spec = yaml.parse(specContent)

  return NextResponse.json(spec)
}

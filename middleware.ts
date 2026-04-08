// middleware.ts
// Protege todas las rutas /admin/* excepto /admin/login.
// Usa Web Crypto API (compatible con Edge Runtime).

import { NextRequest, NextResponse } from 'next/server'

async function computeAdminToken(secret: string): Promise<string> {
  const encoder  = new TextEncoder()
  const data     = encoder.encode(`${secret}:rc-admin-v1`)
  const buffer   = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token  = request.cookies.get('rc_admin')?.value
    const secret = process.env.ADMIN_SECRET

    if (!token || !secret) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const expected = await computeAdminToken(secret)

    if (token !== expected) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

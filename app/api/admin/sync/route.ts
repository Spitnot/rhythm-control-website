// app/api/admin/sync/route.ts
// POST /api/admin/sync — dispara sincronización Discogs desde el panel admin.
// Autenticación via cookie rc_admin (no CRON_SECRET).

import { createHash }      from 'crypto'
import { cookies }         from 'next/headers'
import { syncDiscogsInventory } from '@/lib/discogs/sync'

export const maxDuration = 300 // 5 minutos — requiere Vercel Pro

function computeAdminToken(secret: string): string {
  return createHash('sha256')
    .update(`${secret}:rc-admin-v1`)
    .digest('hex')
}

async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token  = cookieStore.get('rc_admin')?.value
  const secret = process.env.ADMIN_SECRET
  if (!token || !secret) return false
  return token === computeAdminToken(secret)
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await syncDiscogsInventory()

  if (result.error) {
    return Response.json({ ok: false, ...result }, { status: 500 })
  }

  return Response.json({ ok: true, ...result })
}

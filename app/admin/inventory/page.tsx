// app/admin/inventory/page.tsx
// Lista completa del inventario de discos (todas las condiciones y estados).

import { createAdminClient }  from '@/lib/supabase/admin'
import type { Release }        from '@/types'

const CONDITION_COLORS: Record<string, string> = {
  M:   'var(--rc-color-accent)',
  NM:  'var(--rc-color-accent)',
  'VG+': 'var(--rc-color-text)',
  VG:  'var(--rc-color-text)',
  default: 'var(--rc-color-muted)',
}

function conditionColor(condition: string) {
  return CONDITION_COLORS[condition] ?? CONDITION_COLORS.default
}

export default async function InventoryPage() {
  const supabase = createAdminClient()

  const { data: releases, count } = await supabase
    .from('releases')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200)

  const items = (releases ?? []) as Release[]

  return (
    <div className="p-6 md:p-10">

      <div className="flex items-baseline justify-between mb-8 max-w-6xl mx-auto">
        <h1 className="font-display text-3xl" style={{ color: 'var(--rc-color-text)' }}>
          INVENTARIO
        </h1>
        <span className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
          {count ?? 0} discos
        </span>
      </div>

      {/* Tabla — horizontal scroll en móvil */}
      <div className="overflow-x-auto max-w-6xl mx-auto">
        <table className="w-full" style={{ borderTop: 'var(--rc-border-main)' }}>
          <thead>
            <tr style={{ borderBottom: 'var(--rc-border-main)' }}>
              {['Artista / Título', 'Sello', 'Formato', 'Cond.', 'Precio', 'Estado'].map(h => (
                <th
                  key={h}
                  className="font-meta text-xs text-left py-3 px-4 first:pl-0"
                  style={{ color: 'var(--rc-color-muted)' }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(release => (
              <tr
                key={release.id}
                style={{ borderBottom: 'var(--rc-border-card)' }}
              >
                {/* Artista / Título */}
                <td className="py-3 px-4 pl-0">
                  <p className="font-display text-xs truncate max-w-xs" style={{ color: 'var(--rc-color-text)' }}>
                    {release.artists[0] ?? '—'}
                  </p>
                  <p className="font-meta text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--rc-color-muted)' }}>
                    {release.title}
                  </p>
                </td>

                {/* Sello */}
                <td className="py-3 px-4">
                  <p className="font-meta text-xs truncate max-w-[120px]" style={{ color: 'var(--rc-color-muted)' }}>
                    {release.labels[0] ?? '—'}
                  </p>
                  <p className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)', opacity: 0.5 }}>
                    {release.catno}
                  </p>
                </td>

                {/* Formato */}
                <td className="py-3 px-4">
                  <span className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
                    {release.format}
                  </span>
                </td>

                {/* Condición */}
                <td className="py-3 px-4">
                  <span
                    className="font-display text-xs"
                    style={{ color: conditionColor(release.condition) }}
                  >
                    {release.condition}
                  </span>
                </td>

                {/* Precio */}
                <td className="py-3 px-4">
                  <span className="font-meta text-xs" style={{ color: 'var(--rc-color-text)' }}>
                    {release.price.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                </td>

                {/* Estado */}
                <td className="py-3 px-4">
                  <span
                    className="font-meta text-xs"
                    style={{
                      color: release.status === 'active' ? 'var(--rc-color-accent)' : 'var(--rc-color-muted)',
                    }}
                  >
                    {release.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <p className="font-meta text-xs text-center py-16" style={{ color: 'var(--rc-color-muted)' }}>
            Sin discos en el inventario. Ejecuta una sincronización con Discogs.
          </p>
        )}
      </div>

    </div>
  )
}

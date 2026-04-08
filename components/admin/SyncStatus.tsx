'use client'
// components/admin/SyncStatus.tsx
// Muestra el estado del último sync y permite lanzar uno manualmente.

import { useState }   from 'react'
import { format }     from 'date-fns'
import { es }         from 'date-fns/locale'
import type { SyncJob } from '@/types'

interface SyncStatusProps {
  lastJob: SyncJob | null
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  running:   'En progreso',
  failed:    'Fallido',
  pending:   'Pendiente',
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'var(--rc-color-accent)',
  running:   'var(--rc-color-text)',
  failed:    '#f87171',
  pending:   'var(--rc-color-muted)',
}

export default function SyncStatus({ lastJob }: SyncStatusProps) {
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    setSyncError(null)

    const res  = await fetch('/api/admin/sync', { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setResult(
        `Sincronizados: ${data.synced} discos · Vendidos: ${data.markedSold}`
      )
    } else {
      setSyncError(data.error ?? 'Error durante la sincronización')
    }

    setLoading(false)
  }

  return (
    <div style={{ border: 'var(--rc-border-main)' }}>

      {/* Última sincronización */}
      <div className="p-5" style={{ borderBottom: 'var(--rc-border-card)' }}>
        {lastJob ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
                ÚLTIMO SYNC
              </span>
              <span
                className="font-display text-xs"
                style={{ color: STATUS_COLORS[lastJob.status] ?? 'var(--rc-color-muted)' }}
              >
                {STATUS_LABELS[lastJob.status] ?? lastJob.status}
              </span>
            </div>

            <div className="flex gap-6">
              <InfoItem
                label="Fecha"
                value={format(new Date(lastJob.started_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              />
              <InfoItem
                label="Procesados"
                value={`${lastJob.items_processed} / ${lastJob.items_total}`}
              />
            </div>

            {lastJob.error && (
              <p className="font-meta text-xs text-red-400 mt-1">{lastJob.error}</p>
            )}
          </div>
        ) : (
          <p className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
            Sin sincronizaciones previas
          </p>
        )}
      </div>

      {/* Botón de sync manual */}
      <div className="p-5 flex flex-col gap-3">
        <button
          onClick={handleSync}
          disabled={loading}
          className="font-display text-sm py-3 transition-colors disabled:opacity-40"
          style={{
            backgroundColor: loading ? 'transparent' : 'var(--rc-color-text)',
            color:           loading ? 'var(--rc-color-text)' : 'var(--rc-color-bg)',
            border:          loading ? 'var(--rc-border-main)' : 'none',
          }}
        >
          {loading ? 'SINCRONIZANDO...' : 'SINCRONIZAR AHORA'}
        </button>

        {loading && (
          <p className="font-meta text-xs text-center animate-pulse" style={{ color: 'var(--rc-color-muted)' }}>
            Esto puede tardar varios minutos según el tamaño del inventario
          </p>
        )}
        {result && (
          <p className="font-meta text-xs text-center" style={{ color: 'var(--rc-color-accent)' }}>
            ✓ {result}
          </p>
        )}
        {syncError && (
          <p className="font-meta text-xs text-center text-red-400">{syncError}</p>
        )}
      </div>

    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-meta text-xs mb-0.5" style={{ color: 'var(--rc-color-muted)' }}>
        {label.toUpperCase()}
      </p>
      <p className="font-meta text-sm" style={{ color: 'var(--rc-color-text)' }}>
        {value}
      </p>
    </div>
  )
}

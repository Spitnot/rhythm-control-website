'use client'
// app/admin/scan/page.tsx
// Escáner de código de barras para identificar discos vía cámara o entrada manual.

import { useState }    from 'react'
import dynamic         from 'next/dynamic'
import ScanResult      from '@/components/admin/ScanResult'
import type { DiscogsSearchResult } from '@/lib/discogs/client'
import type { Release }              from '@/types'

// BarcodeScanner solo se renderiza en el cliente (usa APIs del navegador)
const BarcodeScanner = dynamic(
  () => import('@/components/admin/BarcodeScanner'),
  { ssr: false, loading: () => <ScannerPlaceholder /> }
)

interface LookupResult {
  discogs:       DiscogsSearchResult
  inventory:     Release | null
  total_results: number
  all_results:   DiscogsSearchResult[]
}

type PageState = 'scanning' | 'loading' | 'result' | 'error'

export default function ScanPage() {
  const [state,   setState]   = useState<PageState>('scanning')
  const [result,  setResult]  = useState<LookupResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [bpm,     setBpm]     = useState('')
  const [key,     setKey]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function handleScan(barcode: string) {
    setState('loading')

    const res  = await fetch(`/api/discogs/lookup?barcode=${encodeURIComponent(barcode)}`)
    const data = await res.json()

    if (res.ok) {
      setResult(data)
      setBpm(String(data.inventory?.bpm ?? ''))
      setKey(data.inventory?.key ?? '')
      setState('result')
    } else {
      setErrorMsg(data.error ?? 'Error al buscar el disco')
      setState('error')
    }
  }

  function handleReset() {
    setResult(null)
    setErrorMsg('')
    setBpm('')
    setKey('')
    setSaved(false)
    setState('scanning')
  }

  async function handleSaveBpmKey() {
    if (!result?.inventory?.id) return
    setSaving(true)

    const res = await fetch(`/api/admin/release/${result.inventory.id}/bpm-key`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        bpm: bpm ? parseInt(bpm, 10) : null,
        key: key || null,
      }),
    })

    setSaved(res.ok)
    setSaving(false)
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">

      <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--rc-color-text)' }}>
        ESCANEAR
      </h1>
      <p className="font-meta text-xs mb-8" style={{ color: 'var(--rc-color-muted)' }}>
        Apunta la cámara al código de barras del disco o introdúcelo manualmente
      </p>

      {/* Escáner */}
      {state === 'scanning' && (
        <BarcodeScanner onScan={handleScan} />
      )}

      {/* Cargando */}
      {state === 'loading' && (
        <div
          className="flex items-center justify-center py-20"
          style={{ border: 'var(--rc-border-main)' }}
        >
          <p className="font-meta text-xs animate-pulse" style={{ color: 'var(--rc-color-muted)' }}>
            BUSCANDO EN DISCOGS...
          </p>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="py-10 text-center">
          <p className="font-meta text-sm text-red-400 mb-6">{errorMsg}</p>
          <button
            onClick={handleReset}
            className="font-display text-xs px-6 py-3 transition-colors hover:bg-white hover:text-black"
            style={{ border: 'var(--rc-border-main)', color: 'var(--rc-color-text)' }}
          >
            VOLVER A ESCANEAR
          </button>
        </div>
      )}

      {/* Resultado */}
      {state === 'result' && result && (
        <div className="flex flex-col gap-6">
          <ScanResult data={result} />

          {/* Editar BPM/Key si está en inventario */}
          {result.inventory && (
            <div style={{ border: 'var(--rc-border-main)' }}>
              <div className="p-4" style={{ borderBottom: 'var(--rc-border-card)' }}>
                <p className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
                  DATOS TÉCNICOS
                </p>
              </div>
              <div className="p-4 flex gap-4">
                <div className="flex-1">
                  <label className="font-meta text-xs block mb-2" style={{ color: 'var(--rc-color-muted)' }}>
                    BPM
                  </label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={e => setBpm(e.target.value)}
                    placeholder="ej. 128"
                    className="w-full bg-transparent font-meta text-sm px-3 py-2 focus:outline-none"
                    style={{ border: 'var(--rc-border-card)', color: 'var(--rc-color-text)' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="font-meta text-xs block mb-2" style={{ color: 'var(--rc-color-muted)' }}>
                    KEY
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="ej. 4A / Am"
                    className="w-full bg-transparent font-meta text-sm px-3 py-2 focus:outline-none"
                    style={{ border: 'var(--rc-border-card)', color: 'var(--rc-color-text)' }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSaveBpmKey}
                    disabled={saving || saved}
                    className="font-display text-xs px-4 py-2 transition-colors disabled:opacity-40"
                    style={{
                      backgroundColor: saved ? 'var(--rc-color-accent)' : 'var(--rc-color-text)',
                      color: 'var(--rc-color-bg)',
                    }}
                  >
                    {saving ? '...' : saved ? 'GUARDADO' : 'GUARDAR'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Acción: escanear otro */}
          <button
            onClick={handleReset}
            className="w-full font-display text-xs py-3 transition-colors hover:bg-white hover:text-black"
            style={{ border: 'var(--rc-border-main)', color: 'var(--rc-color-text)' }}
          >
            ESCANEAR OTRO
          </button>
        </div>
      )}

    </div>
  )
}

function ScannerPlaceholder() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        border:      'var(--rc-border-main)',
        aspectRatio: '4/3',
      }}
    >
      <p className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
        CARGANDO ESCÁNER...
      </p>
    </div>
  )
}

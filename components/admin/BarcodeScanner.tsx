'use client'
// components/admin/BarcodeScanner.tsx
// Escáner de código de barras usando la cámara del dispositivo.
// Usa @zxing/browser — solo disponible en el cliente (dynamic import en el parent).

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react'
import type { IScannerControls } from '@zxing/browser'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [ready,   setReady]   = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [manual,  setManual]  = useState('')
  const [lastScan, setLastScan] = useState<string | null>(null)

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return

    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()

      const controls = await reader.decodeFromVideoDevice(
        undefined,        // dispositivo por defecto
        videoRef.current,
        (result) => {
          if (!result) return
          const text = result.getText()
          // Evitar disparar el mismo código múltiples veces seguidas
          if (text === lastScan) return
          setLastScan(text)
          onScan(text)
        }
      )

      controlsRef.current = controls
      setReady(true)
    } catch {
      setCamError('No se pudo acceder a la cámara. Activa los permisos en el navegador.')
    }
  }, [onScan, lastScan])

  useEffect(() => {
    startScanner()
    return () => {
      controlsRef.current?.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    const code = manual.trim()
    if (code) {
      onScan(code)
      setManual('')
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Visor de cámara */}
      <div
        className="relative overflow-hidden"
        style={{
          border:      'var(--rc-border-main)',
          aspectRatio: '4/3',
          backgroundColor: 'var(--rc-color-bg)',
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Estado: iniciando */}
        {!ready && !camError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-meta text-xs animate-pulse" style={{ color: 'var(--rc-color-muted)' }}>
              INICIANDO CÁMARA...
            </p>
          </div>
        )}

        {/* Línea guía de escaneo */}
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-3/4"
              style={{ height: '2px', backgroundColor: 'var(--rc-color-accent)', opacity: 0.8 }}
            />
          </div>
        )}
      </div>

      {/* Error de cámara */}
      {camError && (
        <p className="font-meta text-xs text-red-400 text-center">{camError}</p>
      )}

      {/* Separador */}
      <div className="flex items-center gap-4">
        <hr className="flex-1" style={{ borderColor: 'var(--rc-color-separator)' }} />
        <span className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
          O
        </span>
        <hr className="flex-1" style={{ borderColor: 'var(--rc-color-separator)' }} />
      </div>

      {/* Entrada manual */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          value={manual}
          onChange={e => setManual(e.target.value)}
          placeholder="Introduce EAN / UPC manualmente"
          className="flex-1 bg-transparent font-meta text-sm px-3 py-2 focus:outline-none"
          style={{
            border: 'var(--rc-border-main)',
            color:  'var(--rc-color-text)',
          }}
        />
        <button
          type="submit"
          className="font-display text-xs px-4 py-2 transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--rc-color-text)',
            color:           'var(--rc-color-bg)',
          }}
        >
          BUSCAR
        </button>
      </form>

    </div>
  )
}

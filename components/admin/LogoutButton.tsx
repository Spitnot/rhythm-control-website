'use client'
// components/admin/LogoutButton.tsx
// Botón de cierre de sesión del panel admin.

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="font-meta text-xs transition-colors hover:text-white"
      style={{ color: 'var(--rc-color-muted)' }}
    >
      Cerrar sesión
    </button>
  )
}

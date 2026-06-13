'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Membership = { tenantId: string; tenantName: string; role: string }

export default function DashboardTopbar({
  userName,
  memberships = [],
  activeTenantId,
}: {
  userName: string
  memberships?: Membership[]
  activeTenantId?: string
}) {
  const initials = userName.slice(0, 2).toUpperCase() || 'HB'
  const router = useRouter()
  const [switching, setSwitching] = useState(false)

  const handleTenantSwitch = async (tenantId: string) => {
    if (!tenantId || tenantId === activeTenantId || switching) return
    setSwitching(true)
    try {
      const res = await fetch('/api/tenant/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })
      if (res.ok) {
        // Tüm sayfa verileri tenant'a bağlı — temiz başlangıç için tam yenile
        window.location.href = '/dashboard'
        return
      }
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'İşletme değiştirilemedi.')
    } catch {
      alert('Bağlantı hatası — işletme değiştirilemedi.')
    }
    setSwitching(false)
  }

  return (
    <header
      className="flex items-center justify-between flex-shrink-0"
      style={{
        height: '64px',
        background: 'rgba(240,244,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e8edf8',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-2"
        style={{
          background: '#ffffff',
          border: '1px solid #e8edf8',
          borderRadius: '10px',
          padding: '0 14px',
          height: '36px',
          width: '260px',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#4f7dff'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,125,255,0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e8edf8'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg style={{ width: '15px', height: '15px', color: '#64748b', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Arama yakında..."
          disabled
          aria-label="Arama"
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '13px', color: '#94a3b8', width: '100%',
            cursor: 'not-allowed',
          }}
        />
        <span
          style={{
            fontSize: '11px', color: '#64748b',
            background: '#f0f4ff', border: '1px solid #e8edf8',
            padding: '1px 6px', borderRadius: '5px', flexShrink: 0,
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Tenant switcher — birden fazla üyelik varsa */}
        {memberships.length > 1 && (
          <select
            aria-label="İşletme seç"
            value={activeTenantId}
            disabled={switching}
            onChange={(e) => handleTenantSwitch(e.target.value)}
            style={{
              height: '36px',
              maxWidth: '200px',
              padding: '0 10px',
              borderRadius: '10px',
              border: '1px solid #e8edf8',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              fontWeight: 500,
              cursor: switching ? 'wait' : 'pointer',
              outline: 'none',
            }}
          >
            {memberships.map((m) => (
              <option key={m.tenantId} value={m.tenantId}>
                {m.tenantName}
              </option>
            ))}
          </select>
        )}

        {/* Notification */}
        <button
          aria-label="Bildirimler"
          className="flex items-center justify-center transition-all"
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: '1px solid #e8edf8', background: '#ffffff',
            color: '#64748b', cursor: 'pointer', position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4f7dff'
            e.currentTarget.style.color = '#4f7dff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8edf8'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div
            style={{
              position: 'absolute', top: '7px', right: '7px',
              width: '6px', height: '6px',
              background: '#ef4444', borderRadius: '50%',
              border: '1.5px solid white',
            }}
          />
        </button>

        {/* Settings */}
        <button
          aria-label="Ayarlar"
          onClick={() => router.push('/dashboard/ayarlar')}
          className="flex items-center justify-center transition-all"
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: '1px solid #e8edf8', background: '#ffffff',
            color: '#64748b', cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4f7dff'
            e.currentTarget.style.color = '#4f7dff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8edf8'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M1 12a11 11 0 0 0 11 11 11 11 0 0 0 11-11A11 11 0 0 0 12 1 11 11 0 0 0 1 12" />
          </svg>
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f7dff, #7aa0ff)',
            fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
            fontWeight: 700, fontSize: '13px', color: 'white',
            boxShadow: '0 2px 8px rgba(79,125,255,0.3)',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}

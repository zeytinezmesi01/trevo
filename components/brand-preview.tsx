'use client'

import { useState } from 'react'

interface Props {
  brandName: string
  logoUrl: string
  primaryColor: string
}

export default function BrandPreview({ brandName, logoUrl, primaryColor }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'portal'>('dashboard')

  const name = brandName || 'Trevo'
  const color = primaryColor || '#111827'
  const lighter = lighten(color, 0.12)
  const textOnColor = isDark(color) ? '#fff' : '#0f172a'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Canlı Önizleme</h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('dashboard')}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{
            background: tab === 'dashboard' ? '#fff' : 'transparent',
            color: tab === 'dashboard' ? '#0f172a' : '#94a3b8',
            boxShadow: tab === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab('portal')}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{
            background: tab === 'portal' ? '#fff' : 'transparent',
            color: tab === 'portal' ? '#0f172a' : '#94a3b8',
            boxShadow: tab === 'portal' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          Müşteri Portali
        </button>
      </div>

      {/* Preview area */}
      <div
        className="rounded-xl overflow-hidden border border-gray-200"
        style={{ background: '#f8fafc' }}
      >
        {tab === 'dashboard' ? (
          <DashboardMock name={name} logoUrl={logoUrl} color={color} lighter={lighter} textOnColor={textOnColor} />
        ) : (
          <PortalMock name={name} color={color} textOnColor={textOnColor} />
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Değişiklikleri kaydettikten sonra dashboard ve portal bu şekilde görünür.
      </p>
    </div>
  )
}

/* ── Mini Dashboard ── */

function DashboardMock({ name, logoUrl, color, lighter, textOnColor }: {
  name: string; logoUrl: string; color: string; lighter: string; textOnColor: string
}) {
  return (
    <div className="flex" style={{ height: '280px' }}>
      {/* Sidebar */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: '140px', background: '#0f172a' }}>
        {/* Brand area */}
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-5 w-auto rounded" />
          ) : (
            <span className="text-sm font-bold tracking-tight text-white">{name}</span>
          )}
        </div>
        {/* Menu items */}
        <div className="flex-1 px-2 py-3 space-y-0.5">
          <MenuItem label="Genel Bakış" active />
          <MenuItem label="Müşteriler" />
          <MenuItem label="Faturalar" />
          <MenuItem label="Dosyalar" />
          <MenuItem label="Hizmetler" />
        </div>
        {/* Bottom brand accent */}
        <div className="h-1" style={{ background: color }} />
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="text-xs font-semibold mb-3" style={{ color: '#334155' }}>Genel Bakış</div>

        {/* Mini stat cards */}
        <div className="flex gap-2 mb-3">
          <StatCard />
          <StatCard />
          <StatCard />
        </div>

        {/* Section header + button */}
        <div className="flex items-center justify-between mb-2">
          <div className="h-2 rounded-full" style={{ width: '60px', background: '#e2e8f0' }} />
          <div
            className="rounded-md flex items-center justify-center text-[9px] font-medium"
            style={{ background: color, color: textOnColor, padding: '3px 10px' }}
          >
            {name}
          </div>
        </div>

        {/* Mini table rows */}
        <div className="space-y-1.5">
          <TableRow color={lighter} />
          <TableRow color={lighter} />
          <TableRow color={lighter} />
        </div>

        {/* Footer accent dot */}
        <div className="flex gap-1 mt-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e2e8f0' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e2e8f0' }} />
        </div>
      </div>
    </div>
  )
}

function MenuItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className="px-2 py-1.5 rounded-lg text-[10px] font-medium"
      style={{
        color: active ? '#fff' : '#94a3b8',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
      }}
    >
      {label}
    </div>
  )
}

function StatCard() {
  return (
    <div className="flex-1 rounded-lg p-2" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="h-1.5 rounded-full mb-1.5" style={{ width: '24px', background: '#e2e8f0' }} />
      <div className="h-2.5 rounded-full" style={{ width: '32px', background: '#cbd5e1' }} />
    </div>
  )
}

function TableRow({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="h-1.5 rounded-full flex-1" style={{ background: '#e2e8f0' }} />
      <div className="h-1.5 rounded-full" style={{ width: '40px', background: '#e2e8f0' }} />
    </div>
  )
}

/* ── Mini Portal ── */

function PortalMock({ name, color, textOnColor }: {
  name: string; color: string; textOnColor: string
}) {
  return (
    <div style={{ minHeight: '280px', background: '#f8fafc' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <span className="text-xs font-bold tracking-tight" style={{ color }}>{name}</span>
        <div className="flex gap-1.5">
          <div className="h-1.5 rounded-full" style={{ width: '24px', background: '#e2e8f0' }} />
          <div className="h-1.5 rounded-full" style={{ width: '18px', background: '#e2e8f0' }} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Welcome card */}
        <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <div className="h-2 rounded-full mb-2" style={{ width: '100px', background: '#e2e8f0' }} />
          <div className="h-1.5 rounded-full mb-1" style={{ width: '180px', background: '#f1f5f9' }} />
          <div className="h-1.5 rounded-full mb-3" style={{ width: '140px', background: '#f1f5f9' }} />
          <div
            className="rounded-lg flex items-center justify-center text-[9px] font-medium"
            style={{ background: color, color: textOnColor, padding: '4px 14px', width: 'fit-content' }}
          >
            Dosyalarımı Gör
          </div>
        </div>

        {/* File list */}
        <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <div className="h-2 rounded-full mb-2" style={{ width: '80px', background: '#e2e8f0' }} />
          <div className="space-y-2">
            <PortalFileRow color={color} />
            <PortalFileRow color={color} />
            <PortalFileRow color={color} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 text-center" style={{ background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <span className="text-[9px]" style={{ color: '#94a3b8' }}>{name} — Trevo</span>
      </div>
    </div>
  )
}

function PortalFileRow({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center" style={{ background: color + '18' }}>
        <div style={{ width: '6px', height: '6px', background: color, borderRadius: '2px' }} />
      </div>
      <div className="flex-1">
        <div className="h-1.5 rounded-full mb-1" style={{ width: '60%', background: '#e2e8f0' }} />
        <div className="h-1 rounded-full" style={{ width: '35%', background: '#f1f5f9' }} />
      </div>
    </div>
  )
}

/* ── Color helpers ── */

function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount) + 255 * amount))
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount) + 255 * amount))
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount) + 255 * amount))
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'

const HomeIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const FolderIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)
const BriefcaseIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)
const UsersIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const HeartIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
const CardIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const KeyIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
)
const SettingsIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M1 12a11 11 0 0 0 11 11 11 11 0 0 0 11-11A11 11 0 0 0 12 1 11 11 0 0 0 1 12" />
  </svg>
)
const LogoutIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
const DotsIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
)
const InvoiceIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const BarChartIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const navItems = [
  { href: '/dashboard', icon: <HomeIcon />, label: 'Genel Bakış', exact: true },
  { href: '/dashboard/raporlar', icon: <BarChartIcon />, label: 'Raporlar' },
  { href: '/dashboard/dosyalar', icon: <FolderIcon />, label: 'Dosyalar' },
  { href: '/dashboard/faturalar', icon: <InvoiceIcon />, label: 'Faturalar' },
  { href: '/dashboard/hizmetler', icon: <BriefcaseIcon />, label: 'Hizmetler' },
  { href: '/dashboard/ekip', icon: <UsersIcon />, label: 'Ekip' },
  { href: '/dashboard/musteriler', icon: <HeartIcon />, label: 'Müşteriler' },
  { href: '/dashboard/odeme', icon: <CardIcon />, label: 'Ödeme' },
]

export default function DashboardSidebar({
  brand,
  userName,
  userEmail,
}: {
  brand: Brand
  userName: string
  userEmail: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [logoError, setLogoError] = useState(false)

  const handleCikis = async () => {
    await supabase.auth.signOut()
    router.push('/giris')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const initials = userName.slice(0, 2).toUpperCase() || 'HB'

  return (
    <aside
      className="flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
      style={{
        width: '240px',
        minWidth: '240px',
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #e8edf8',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 flex-shrink-0"
        style={{ height: '64px', padding: '0 20px', borderBottom: '1px solid #e8edf8' }}
      >
        {brand.brandLogoUrl && !logoError ? (
          <img
            src={brand.brandLogoUrl}
            alt={brand.brandName || 'Logo'}
            className="h-7 w-auto max-w-[120px] object-contain rounded"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))',
              borderRadius: '9px',
              boxShadow: '0 2px 8px rgba(79,125,255,0.35)',
            }}
          >
            <Image src="/logo.svg" alt="Trevo" width={20} height={20} />
          </div>
        )}
        <span
          style={{
            fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
            fontWeight: 800,
            fontSize: '17px',
            letterSpacing: '-0.04em',
            color: '#0f172a',
          }}
        >
          {brand.brandName || 'trevo'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto" style={{ padding: '12px 10px' }}>
        <div
          style={{
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#64748b', padding: '10px 10px 4px',
          }}
        >
          Ana Menü
        </div>

        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 transition-all"
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 500,
                color: active ? 'var(--brand-primary-foreground, #ffffff)' : '#64748b',
                background: active ? 'var(--brand-primary, #4f7dff)' : 'transparent',
                boxShadow: active ? '0 2px 8px rgba(79,125,255,0.3)' : 'none',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#eef2ff'
                  e.currentTarget.style.color = 'var(--brand-primary, #4f7dff)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}

        {/* Divider + Sistem */}
        <div style={{ height: '1px', background: '#e8edf8', margin: '8px 10px' }} />
        <div
          style={{
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#64748b', padding: '4px 10px 4px',
          }}
        >
          Sistem
        </div>

        {/* Ayarlar */}
        {(() => {
          const active = isActive('/dashboard/ayarlar') && !pathname.startsWith('/dashboard/ayarlar/api')
          return (
            <Link
              href="/dashboard/ayarlar"
              className="flex items-center gap-2.5 transition-all"
              style={{
                padding: '9px 12px', borderRadius: '8px',
                fontSize: '13.5px', fontWeight: 500,
                color: active ? '#ffffff' : '#64748b',
                background: active ? '#4f7dff' : 'transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#eef2ff'
                  e.currentTarget.style.color = 'var(--brand-primary, #4f7dff)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              <SettingsIcon />
              Ayarlar
            </Link>
          )
        })()}

        {/* API & Webhook */}
        {(() => {
          const active = pathname.startsWith('/dashboard/ayarlar/api')
          return (
            <Link
              href="/dashboard/ayarlar/api"
              className="flex items-center gap-2.5 transition-all"
              style={{
                padding: '9px 12px', borderRadius: '8px',
                fontSize: '13.5px', fontWeight: 500,
                color: active ? '#ffffff' : '#64748b',
                background: active ? '#4f7dff' : 'transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#eef2ff'
                  e.currentTarget.style.color = 'var(--brand-primary, #4f7dff)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              <KeyIcon />
              API & Webhook
            </Link>
          )
        })()}

        {/* Çıkış */}
        <button
          onClick={handleCikis}
          className="flex items-center gap-2.5 w-full text-left transition-all"
          style={{
            padding: '9px 12px', borderRadius: '8px',
            fontSize: '13.5px', fontWeight: 500,
            color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <LogoutIcon />
          Çıkış Yap
        </button>
      </nav>

      {/* User card */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #e8edf8', flexShrink: 0 }}>
        <div
          className="flex items-center gap-2.5"
          style={{
            padding: '10px', borderRadius: '8px',
            background: '#f0f4ff', border: '1px solid #e8edf8',
          }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #7aa0ff))',
              fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
              fontWeight: 700, fontSize: '13px', color: 'white',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail}
            </div>
          </div>
          <DotsIcon />
        </div>
      </div>
    </aside>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const DISMISS_KEY = 'trevo_checklist_dismissed'

type Step = {
  key: string
  label: string
  done: boolean
  href: string
}

export default function SetupChecklist() {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      if (typeof window !== 'undefined' && localStorage.getItem(`${DISMISS_KEY}_${user.id}`)) {
        setDismissed(true)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_tax_number, company_tax_office, brand_name, brand_primary_color, active_tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      let einvoiceEnabled = false
      let hasIyzico = false
      if (profile?.active_tenant_id) {
        const { data: t } = await supabase
          .from('tenants')
          .select('einvoice_enabled, iyzico_api_key')
          .eq('id', profile.active_tenant_id)
          .maybeSingle()
        einvoiceEnabled = !!t?.einvoice_enabled
        hasIyzico = !!t?.iyzico_api_key
      }

      const [{ count: clientCount }, { count: fileCount }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('files').select('*', { count: 'exact', head: true }),
      ])

      const brandCustomized = !!(
        (profile?.brand_name && profile.brand_name.trim()) ||
        (profile?.brand_primary_color &&
          profile.brand_primary_color !== '#111827' &&
          profile.brand_primary_color !== '#4f7dff')
      )

      const items: Step[] = [
        {
          key: 'company',
          label: 'Şirket bilgilerini tamamla',
          done: !!(profile?.company_name && profile?.company_tax_number && profile?.company_tax_office),
          href: '/dashboard/ayarlar',
        },
        {
          key: 'brand',
          label: 'Markanı kişiselleştir (ad / renk)',
          done: brandCustomized,
          href: '/dashboard/ayarlar',
        },
        {
          key: 'client',
          label: 'İlk müşterini ekle',
          done: (clientCount || 0) > 0,
          href: '/dashboard/musteriler',
        },
        {
          key: 'file',
          label: 'İlk dosyanı yükle',
          done: (fileCount || 0) > 0,
          href: '/dashboard/dosyalar',
        },
        {
          key: 'payment',
          label: 'Online ödemeyi (iyzico) aktive et',
          done: hasIyzico,
          href: '/dashboard/odeme',
        },
        {
          key: 'einvoice',
          label: "e-Fatura'yı etkinleştir",
          done: einvoiceEnabled,
          href: '/dashboard/ayarlar',
        },
      ]

      setSteps(items)
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDismiss = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(`${DISMISS_KEY}_${user.id}`, '1')
    }
    setDismissed(true)
  }

  if (loading || dismissed || steps.length === 0) return null

  const doneCount = steps.filter(s => s.done).length
  const totalCount = steps.length
  const percent = Math.round((doneCount / totalCount) * 100)

  // Hepsi tamamsa otomatik gizle
  if (doneCount === totalCount) return null

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8edf8',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>
            🎯 Kurulum ilerlemen
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {doneCount} / {totalCount} adım tamam · %{percent}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs transition-colors"
          style={{ color: '#94a3b8' }}
        >
          Gizle
        </button>
      </div>

      <div
        style={{
          height: '6px',
          background: '#f1f5f9',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'var(--brand-primary, #4f7dff)',
            width: `${percent}%`,
            transition: 'width 500ms',
          }}
        />
      </div>

      <div className="space-y-1">
        {steps.map(s => (
          <Link
            key={s.key}
            href={s.href}
            className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors group"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '999px',
                background: s.done ? '#dcfce7' : 'transparent',
                color: s.done ? '#16a34a' : 'transparent',
                border: s.done ? 'none' : '2px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {s.done ? '✓' : ''}
            </div>
            <span
              className="text-sm flex-1"
              style={{
                color: s.done ? '#94a3b8' : '#334155',
                textDecoration: s.done ? 'line-through' : 'none',
              }}
            >
              {s.label}
            </span>
            {!s.done && (
              <span
                className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--brand-primary, #4f7dff)' }}
              >
                Git →
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

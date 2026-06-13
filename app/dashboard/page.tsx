import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant/auth'
import Link from 'next/link'
import SetupChecklist from '@/components/setup-checklist'

const card = {
  background: '#ffffff',
  border: '1px solid #e8edf8',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
}
const shadowMd = '0 4px 16px rgba(79,125,255,0.1), 0 1px 4px rgba(0,0,0,0.06)'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { tenantId, role } = await getTenantContext()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'

  const [
    { count: clientCount },
    { count: serviceCount },
    { count: teamCount },
    { count: fileCount },
    { data: recentFilesData },
    { data: invoicesData },
    { data: membersData },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('tenant_members').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('files').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('files').select('id, name, file_type, size, created_at, client_id').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('id, invoice_number, client_name, status, total, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('tenant_members').select('id, user_id, role, status, joined_at').eq('tenant_id', tenantId).order('joined_at', { ascending: false }),
  ])

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const stats = [
    {
      color: 'green', label: 'Müşteri', value: clientCount ?? 0, trend: null,
      iconBg: '#ecfdf5', iconColor: '#10b981',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      color: 'blue', label: 'Hizmet', value: serviceCount ?? 0, trend: null,
      iconBg: '#eef2ff', iconColor: 'var(--brand-primary, #4f7dff)',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      color: 'purple', label: 'Ekip Üyesi', value: teamCount ?? 0, trend: null,
      iconBg: '#f5f3ff', iconColor: '#8b5cf6',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      color: 'orange', label: 'Dosya', value: fileCount ?? 0, trend: null,
      iconBg: '#fffbeb', iconColor: '#f59e0b',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      ),
    },
  ]

  const quickActions = [
    {
      href: '/dashboard/dosyalar', iconBg: '#eef2ff', iconColor: 'var(--brand-primary, #4f7dff)',
      title: 'Dosya Yükle', desc: 'Müşteriye dosya gönder',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    },
    {
      href: '/dashboard/hizmetler', iconBg: '#fffbeb', iconColor: '#f59e0b',
      title: 'Hizmet Ekle', desc: 'Paketini oluştur',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    },
    {
      href: '/dashboard/musteriler', iconBg: '#ecfdf5', iconColor: '#10b981',
      title: 'Müşteri Ekle', desc: 'Yeni müşteri davet et',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    },
  ]

  // Son dosyalar
  const recentFiles = (recentFilesData || []).map((f) => ({
    id: f.id,
    name: f.name,
    ext: f.file_type || 'DOSYA',
    size: f.size || '',
    client: '',
    clientColor: '#f1f5f9',
    clientText: '#64748b',
    time: f.created_at ? new Date(f.created_at).toLocaleDateString('tr-TR') : '',
    iconBg: '#eef2ff',
    iconColor: 'var(--brand-primary, #4f7dff)',
  }))

  // Aktiviteler (en son 5 fatura + ekip üyeleri)
  const invoiceActivities = (invoicesData || []).map((inv) => ({
    bg: '#eef2ff',
    color: 'var(--brand-primary, #4f7dff)',
    text: <><strong>{inv.invoice_number}</strong> faturası oluşturuldu — {inv.client_name}</>,
    time: inv.created_at ? new Date(inv.created_at).toLocaleDateString('tr-TR') : '',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  }))

  const memberActivities = (membersData || []).filter(m => m.joined_at).map((m) => ({
    bg: '#f5f3ff',
    color: '#8b5cf6',
    text: <>Ekip üyesi {m.role} rolüyle katıldı</>,
    time: m.joined_at ? new Date(m.joined_at).toLocaleDateString('tr-TR') : '',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  }))

  const activities = [...invoiceActivities, ...memberActivities].slice(0, 5)

  // Müşteriler (son 5)
  const { data: topClients } = await supabase
    .from('clients')
    .select('id, name, company, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5)

  const clients = (topClients || []).map((c, i) => ({
    initials: (c.name || '??').slice(0, 2).toUpperCase(),
    gradient: ['linear-gradient(135deg,var(--brand-primary, #4f7dff),var(--brand-primary-hover, #7aa0ff))', 'linear-gradient(135deg,#8b5cf6,#a78bfa)', 'linear-gradient(135deg,#f59e0b,#fbbf24)', 'linear-gradient(135deg,#10b981,#34d399)', 'linear-gradient(135deg,#ef4444,#f87171)'][i % 5],
    name: c.name,
    meta: c.company || 'Müşteri',
    dot: '#10b981',
  }))

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.2 }}>
            Merhaba, {userName} 👋
          </div>
          <div style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
            İşte bugünkü özet — {today}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...card, color: '#0f172a', fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Bu Ay
          </button>
          <Link
            href="/dashboard/musteriler"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--brand-primary, var(--brand-primary, #4f7dff))', color: 'white', fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(79,125,255,0.3)', textDecoration: 'none' }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Müşteri Ekle
          </Link>
        </div>
      </div>

      {/* Kurulum sihirbazı yalnızca işletme sahibine — şirket/marka/e-fatura
          ayarları owner'a ait; üye olarak katılanlar (admin/member/viewer) görmez */}
      {role === 'owner' && <SetupChecklist />}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map((s) => (
          <div key={s.label} className={`db-stat-card ${s.color}`} style={{ ...card, padding: '20px', cursor: 'default' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, padding: '3px 7px', borderRadius: '20px', background: s.trend ? '#ecfdf5' : '#f8fafc', color: s.trend ? '#10b981' : '#64748b' }}>
              {s.trend && <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>}
              {s.trend ?? 'Sabit'}
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              {s.icon}
            </div>
            <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1, marginBottom: '4px' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-3.5">
        <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Hızlı İşlemler</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {quickActions.map((qa) => (
          <Link
            key={qa.title}
            href={qa.href}
            className="db-hover-card" style={{ ...card, padding: '18px', display: 'flex', alignItems: 'flex-start', gap: '14px', textDecoration: 'none', transition: 'all 0.2s ease' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: qa.iconBg, color: qa.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {qa.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{qa.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{qa.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-col: Files Table + Right sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '24px' }}>

        {/* Files Table */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Son Dosyalar</div>
            <Link href="/dashboard/dosyalar" style={{ fontSize: '12.5px', color: 'var(--brand-primary, var(--brand-primary, #4f7dff))', fontWeight: 500, textDecoration: 'none' }}>Tümünü gör →</Link>
          </div>
          <div style={{ ...card, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Dosya Adı', 'Boyut', 'Müşteri', 'Tarih', 'İndir'].map((h, i) => (
                    <th key={h} style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase', padding: '10px 20px', textAlign: i === 4 ? 'center' : 'left', background: '#fafbff', borderBottom: '1px solid #e8edf8' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i < recentFiles.length - 1 ? '1px solid #e8edf8' : 'none' }}>
                    <td style={{ padding: '13px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: f.iconBg, color: f.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{f.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{f.ext}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '12.5px', color: '#64748b', verticalAlign: 'middle' }}>{f.size}</td>
                    <td style={{ padding: '13px 20px', verticalAlign: 'middle' }}>
                      <span style={{ background: f.clientColor, color: f.clientText, fontSize: '11.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>{f.client}</span>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '12.5px', color: '#64748b', verticalAlign: 'middle' }}>{f.time}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <button style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e8edf8', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#64748b', cursor: 'pointer' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Son Aktivite */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Son Aktivite</div>
              <span style={{ fontSize: '12.5px', color: 'var(--brand-primary, var(--brand-primary, #4f7dff))', fontWeight: 500, cursor: 'pointer' }}>Tümü →</span>
            </div>
            <div style={{ ...card, overflow: 'hidden' }}>
              {activities.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 20px', borderBottom: i < activities.length - 1 ? '1px solid #e8edf8' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    {a.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', color: '#0f172a', lineHeight: 1.5 }}>{a.text}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Depolama */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Depolama</div>
              <span style={{ fontSize: '12.5px', color: 'var(--brand-primary, var(--brand-primary, #4f7dff))', fontWeight: 500, cursor: 'pointer' }}>Yükselt →</span>
            </div>
            <div style={{ ...card, padding: '18px' }}>
              <div className="flex items-center justify-between mb-2.5">
                <span style={{ fontSize: '13px', color: '#64748b' }}>Kullanılan alan</span>
                <span style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>23.4 / 100 GB</span>
              </div>
              <div style={{ height: '6px', background: '#e8edf8', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '23.4%', borderRadius: '4px', background: 'linear-gradient(90deg, var(--brand-primary, var(--brand-primary, #4f7dff)), var(--brand-primary-hover, var(--brand-primary-hover, #7aa0ff)))' }} />
              </div>
              <div className="flex justify-between mt-2.5">
                {[
                  { color: 'var(--brand-primary, #4f7dff)', label: 'PDF / Döküman' },
                  { color: '#8b5cf6', label: 'Görsel' },
                  { color: '#10b981', label: 'Diğer' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1" style={{ fontSize: '11.5px', color: '#64748b' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
              {/* Mini chart */}
              <div style={{ marginTop: '16px', borderTop: '1px solid #e8edf8', paddingTop: '14px' }}>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>Bu hafta yükleme</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '36px' }}>
                  {[40, 65, 30, 85, 100, 55, 70].map((h, i) => (
                    <div key={i} className={`db-mini-bar${i === 4 ? ' today' : ''}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {['Pzt','Sal','Çar','Per','Bug','Cum','Cmt'].map((d, i) => (
                    <span key={d} style={{ fontSize: '10px', color: i === 4 ? 'var(--brand-primary, #4f7dff)' : '#64748b', fontWeight: i === 4 ? 600 : 400 }}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aktif Müşteriler */}
      <div className="flex items-center justify-between mb-3.5">
        <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Aktif Müşteriler</div>
        <Link href="/dashboard/musteriler" style={{ fontSize: '12.5px', color: 'var(--brand-primary, #4f7dff)', fontWeight: 500, textDecoration: 'none' }}>Tümünü gör →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {clients.map((c) => (
          <Link
            key={c.name}
            href="/dashboard/musteriler"
            className="db-hover-card" style={{ ...card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', transition: 'all 0.15s' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: c.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: 'white', flexShrink: 0 }}>
              {c.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>{c.meta}</div>
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      <div style={{ height: '32px' }} />
    </div>
  )
}

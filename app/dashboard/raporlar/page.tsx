import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant/auth'
import RevenueChart from './revenue-chart'

const card = {
  background: '#ffffff',
  border: '1px solid #e8edf8',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
}

const formatTRY = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v)

type MonthlyBucket = { label: string; month: number; year: number; total: number }
type TopClient = { id: string; name: string; total: number }

export default async function RaporlarPage() {
  const supabase = await createClient()
  const { tenantId } = await getTenantContext()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]

  // ── Parallel Supabase queries ──
  const [
    { data: paidMonth },
    { data: open },
    { count: clientCount },
    { data: files },
    { data: history },
    { data: clientList },
    { data: allPaid },
  ] = await Promise.all([
    supabase.from('invoices').select('total')
      .eq('tenant_id', tenantId).eq('status', 'paid')
      .gte('invoice_date', startOfMonth).lte('invoice_date', endOfMonth),

    supabase.from('invoices').select('total')
      .eq('tenant_id', tenantId).in('status', ['draft', 'sent', 'overdue']),

    supabase.from('clients').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),

    supabase.from('files').select('size')
      .eq('tenant_id', tenantId),

    supabase.from('invoices').select('total, invoice_date, client_id')
      .eq('tenant_id', tenantId).eq('status', 'paid')
      .gte('invoice_date', sixMonthsAgo)
      .order('invoice_date', { ascending: true }),

    supabase.from('clients').select('id, name')
      .eq('tenant_id', tenantId),

    supabase.from('invoices').select('total, client_id')
      .eq('tenant_id', tenantId).eq('status', 'paid'),
  ])

  // ── Metric calculations ──
  const monthRevenue = paidMonth?.reduce((s, r) => s + (r.total || 0), 0) || 0
  const openCount = open?.length || 0
  const openTotal = open?.reduce((s, r) => s + (r.total || 0), 0) || 0

  // Storage: try to parse text sizes like "4.2 MB"
  let totalSizeMB = 0
  let fileCount = 0
  files?.forEach((f) => {
    fileCount++
    if (f.size) {
      const num = parseFloat(f.size)
      if (!isNaN(num)) totalSizeMB += num
    }
  })

  // ── Monthly buckets for last 6 months ──
  const buckets: MonthlyBucket[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      label: d.toLocaleDateString('tr-TR', { month: 'short' }),
      month: d.getMonth(),
      year: d.getFullYear(),
      total: 0,
    })
  }
  history?.forEach((r) => {
    if (!r.invoice_date) return
    const d = new Date(r.invoice_date)
    const b = buckets.find((x) => x.month === d.getMonth() && x.year === d.getFullYear())
    if (b) b.total += r.total || 0
  })

  // ── Top 5 customers (lifetime paid) ──
  const clientMap = new Map<string, string>()
  clientList?.forEach((c) => clientMap.set(c.id, c.name))

  const revByClient = new Map<string, number>()
  allPaid?.forEach((r) => {
    if (!r.client_id) return
    revByClient.set(r.client_id, (revByClient.get(r.client_id) || 0) + (r.total || 0))
  })

  const top5: TopClient[] = Array.from(revByClient.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => ({ id, name: clientMap.get(id) || '—', total }))

  // ── Stat card definitions ──
  const stats = [
    {
      label: 'Bu Ay Gelir', value: formatTRY(monthRevenue),
      iconBg: '#ecfdf5', iconColor: '#10b981',
      icon: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-2h2zm0-4h-2V7h2z" />,
    },
    {
      label: 'Açık Fatura', value: `${openCount} adet`,
      sub: formatTRY(openTotal),
      iconBg: '#fef3c7', iconColor: '#f59e0b',
      icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
    },
    {
      label: 'Müşteri', value: `${clientCount ?? 0}`,
      sub: 'Toplam kayıtlı',
      iconBg: '#eef2ff', iconColor: 'var(--brand-primary, #4f7dff)',
      icon: <g><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></g>,
    },
    {
      label: 'Depolama', value: `${totalSizeMB.toFixed(1)} MB`,
      sub: `${fileCount} dosya`,
      iconBg: '#f5f3ff', iconColor: '#8b5cf6',
      icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
    },
  ]

  const hasChartData = buckets.some((b) => b.total > 0)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.2 }}>
          Raporlama Paneli
        </div>
        <div style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
          Gelir, açık faturalar ve müşteri istatistikleri
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...card, padding: '20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                {s.icon}
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1, marginBottom: '4px' }}>
              {s.value}
            </div>
            {s.sub && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.sub}</div>}
            <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500, marginTop: s.sub ? 0 : 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          Son 6 Ay Gelir
        </div>
        <div style={{ ...card, padding: '24px' }}>
          {hasChartData ? (
            <RevenueChart data={buckets} />
          ) : (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Bu döneme ait ödenmiş fatura bulunamadı.
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Customers */}
      <div>
        <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          En Çok Gelir Getiren 5 Müşteri
        </div>
        {top5.length === 0 ? (
          <div style={{ ...card, padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Henüz ödenmiş fatura bulunmamaktadır.
          </div>
        ) : (
          <div style={{ ...card, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase', padding: '12px 20px', textAlign: 'left', background: '#fafbff', borderBottom: '1px solid #e8edf8' }}>#</th>
                  <th style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase', padding: '12px 20px', textAlign: 'left', background: '#fafbff', borderBottom: '1px solid #e8edf8' }}>Müşteri</th>
                  <th style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase', padding: '12px 20px', textAlign: 'right', background: '#fafbff', borderBottom: '1px solid #e8edf8' }}>Toplam Gelir</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < top5.length - 1 ? '1px solid #e8edf8' : 'none' }}>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '9px',
                        background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' :
                                   i === 1 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' :
                                   i === 2 ? 'linear-gradient(135deg, #d97706, #f59e0b)' :
                                   '#eef2ff',
                        color: i <= 2 ? '#fff' : 'var(--brand-primary, #4f7dff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
                        fontWeight: 700, fontSize: '13px',
                      }}>
                        {i + 1}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <div style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                        {c.name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                      <span style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                        {formatTRY(c.total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ height: '32px' }} />
    </div>
  )
}

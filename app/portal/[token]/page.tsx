import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generatePortalBrand } from '@/lib/brand/server'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import BrandStyle from '@/components/brand-style'
import BrandLogo from '@/components/brand-logo'
import PortalFaturaTalep from '@/components/portal-fatura-talep'

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!client) notFound()

  const [{ data: files }, { data: invoices }] = await Promise.all([
    supabase.from('files').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, invoice_date, status, total').eq('client_id', client.id).order('created_at', { ascending: false }),
  ])

  const headersList = await headers()
  const host = headersList.get('host') || ''
  const brand = await generatePortalBrand(supabase, host)

  const typeColor: Record<string, string> = {
    PDF: 'bg-red-500', AI: 'bg-orange-500', ZIP: 'bg-purple-500',
    PNG: 'bg-blue-500', JPG: 'bg-blue-400', JPEG: 'bg-blue-400',
    MP4: 'bg-pink-500', DOC: 'bg-blue-600', DOCX: 'bg-blue-600',
    XLS: 'bg-green-600', XLSX: 'bg-green-600', FILE: 'bg-gray-500',
  }

  const defaultedBrand = brand.brandName ? brand : DEFAULT_BRAND

  return (
    <>
      <BrandStyle brand={brand} />
      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
            <div>
              <BrandLogo brand={defaultedBrand} className="text-lg font-bold tracking-tight text-primary" />
              <div className="text-xs text-gray-400">Müşteri Portalı</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{client.name}</div>
              {client.company && <div className="text-xs text-gray-400">{client.company}</div>}
            </div>
          </div>
        </div>

        {/* İÇERİK */}
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Dosyalarınız</h1>
          <p className="text-gray-500 text-sm mb-6">Paylaşılan dosyaları buradan indirebilirsiniz.</p>

          {!files || files.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">Henüz paylaşılan dosya yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4">
                  <div className={`w-10 h-10 ${typeColor[file.file_type] || 'bg-gray-500'} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {file.file_type?.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                    <div className="text-xs text-gray-400">{file.size} · {new Date(file.created_at).toLocaleDateString('tr-TR')}</div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    İndir
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FATURALAR */}
        <div className="max-w-3xl mx-auto px-6 py-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Faturalarınız</h1>
              <p className="text-gray-500 text-sm">Kesilen faturaları görüntüleyin veya yeni fatura talep edin.</p>
            </div>
            <PortalFaturaTalep token={token} />
          </div>

          {(!invoices || invoices.length === 0) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <div className="text-4xl mb-3">🧾</div>
              <p className="text-gray-500 text-sm">Henüz kesilmiş fatura yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{inv.invoice_number}</div>
                    <div className="text-xs text-gray-400">{new Date(inv.invoice_date).toLocaleDateString('tr-TR')}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {inv.status === 'paid' ? 'Ödendi' : inv.status === 'sent' ? 'Gönderildi' : inv.status === 'draft' ? 'Taslak' : inv.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">₺{Number(inv.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

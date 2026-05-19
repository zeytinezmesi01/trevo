import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function PortalPage({ params }: { params: { token: string } }) {
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('token', params.token)
    .single()

  if (!client) notFound()

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const typeColor: Record<string, string> = {
    PDF: 'bg-red-500', AI: 'bg-orange-500', ZIP: 'bg-purple-500',
    PNG: 'bg-blue-500', JPG: 'bg-blue-400', JPEG: 'bg-blue-400',
    MP4: 'bg-pink-500', DOC: 'bg-blue-600', DOCX: 'bg-blue-600',
    FILE: 'bg-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">trevo</div>
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
                  className="flex-shrink-0 bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  İndir
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

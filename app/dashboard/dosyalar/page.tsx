'use client'

import { useState, useEffect, useRef } from 'react'

type FileItem = {
  id: string
  name: string
  size: string
  file_type: string
  url: string
  created_at: string
}

export default function DosyalarPage() {
  const [dosyalar, setDosyalar] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [search, setSearch] = useState('')
  const [userRole, setUserRole] = useState<string>('')
  const [copied, setCopied] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => setUserRole(d.role || '')).catch(() => {})
  }, [])

  const fetchDosyalar = async () => {
    try {
      const res = await fetch('/api/files')
      if (res.ok) setDosyalar(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/files')
        if (res.ok) setDosyalar(await res.json())
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress('Hazırlanıyor...')

    try {
      // 1. Presigned URL al
      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      })

      const { signedUrl, error } = await res.json()

      if (error || !signedUrl) {
        alert('Hata: ' + (error || 'Bilinmeyen hata'))
        setUploading(false)
        setProgress('')
        return
      }

      // 2. Direkt R2'ye yükle (Vercel bypass)
      setProgress('Yükleniyor...')
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) {
        alert('R2 yükleme hatası')
        setUploading(false)
        setProgress('')
        return
      }

      setProgress('✓ Yüklendi!')
      setTimeout(() => setProgress(''), 2000)
    } catch {
      alert('Yükleme sırasında hata oluştu')
      setProgress('')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    fetchDosyalar()
  }

  const handleSil = async (id: string) => {
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' })
    } catch {}
    fetchDosyalar()
  }

  const handleKopyala = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const typeColor: Record<string, string> = {
    PDF: 'bg-red-500', AI: 'bg-orange-500', ZIP: 'bg-purple-500',
    PNG: 'bg-blue-500', JPG: 'bg-blue-400', JPEG: 'bg-blue-400',
    MP4: 'bg-pink-500', DOC: 'bg-blue-600', DOCX: 'bg-blue-600',
    XLS: 'bg-green-600', XLSX: 'bg-green-600', FILE: 'bg-gray-500',
  }

  const filtered = dosyalar.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dosyalar</h1>
          <p className="text-gray-500 text-sm mt-1">Müşterilerine ilettiğin dosyalar</p>
        </div>
        <div className="flex items-center gap-3">
          {progress && (
            <span className={`text-sm font-medium ${progress.startsWith('✓') ? 'text-green-600' : 'text-gray-500'}`}>
              {progress}
            </span>
          )}
          <input type="file" ref={fileRef} onChange={handleUpload} className="hidden" />
          {userRole !== 'viewer' && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {uploading ? '⏳ Yükleniyor...' : '+ Dosya Yükle'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Dosya ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">Henüz dosya yok</p>
              <button onClick={() => fileRef.current?.click()} className="mt-3 text-sm text-indigo-600 hover:underline">
                İlk dosyayı yükle
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dosya</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Boyut</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((dosya) => (
                  <tr key={dosya.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${typeColor[dosya.file_type] || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                          {dosya.file_type?.slice(0, 3)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{dosya.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{dosya.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(dosya.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleKopyala(`/api/files/${dosya.id}/download`, dosya.id)}
                          className={`text-xs font-medium transition-colors ${copied === dosya.id ? 'text-green-600' : 'text-indigo-600 hover:text-indigo-800'}`}
                        >
                          {copied === dosya.id ? '✓ Kopyalandı' : 'Linki Kopyala'}
                        </button>
                        <a href={`/api/files/${dosya.id}/download`} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-700">Aç</a>
                        {userRole !== 'viewer' && (
                          <button onClick={() => handleSil(dosya.id)} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

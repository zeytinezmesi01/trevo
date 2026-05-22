'use client'

import { useState, useEffect, useRef } from 'react'

type FileItem = {
  id: string
  name: string
  size: string
  file_type: string
  url: string
  created_at: string
  client_id: string | null
  shared_with_client: boolean
  current_version?: number
}

type ClientLite = {
  id: string
  name: string
}

type FileVersion = {
  id: string
  version_number: number
  name: string
  size: string | null
  file_type: string | null
  url: string
  created_at: string
}

export default function DosyalarPage() {
  const [dosyalar, setDosyalar] = useState<FileItem[]>([])
  const [clients, setClients] = useState<ClientLite[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [search, setSearch] = useState('')
  const [userRole, setUserRole] = useState<string>('')
  const [copied, setCopied] = useState<string | null>(null)

  // Yükleme seçenekleri
  const [uploadClientId, setUploadClientId] = useState('')
  const [uploadShared, setUploadShared] = useState(false)
  // Liste filtresi
  const [filterClientId, setFilterClientId] = useState('')

  // Sürüm geçmişi modalı
  const [versionsModal, setVersionsModal] = useState<{ id: string; name: string; clientId: string | null } | null>(null)
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionUploading, setVersionUploading] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const versionFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => setUserRole(d.role || '')).catch(() => {})
    fetch('/api/clients')
      .then(r => r.ok ? r.json() : [])
      .then((d: ClientLite[]) => setClients(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const fetchDosyalar = async () => {
    try {
      const res = await fetch('/api/files')
      if (res.ok) setDosyalar(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchDosyalar()
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
          clientId: uploadClientId || undefined,
          sharedWithClient: !!uploadClientId && uploadShared,
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

  const loadVersions = async (fileId: string) => {
    setVersionsLoading(true)
    try {
      const res = await fetch(`/api/files/${fileId}/versions`)
      if (res.ok) setVersions(await res.json())
    } catch {}
    setVersionsLoading(false)
  }

  const openVersions = (file: FileItem) => {
    setVersionsModal({ id: file.id, name: file.name, clientId: file.client_id })
    setVersions([])
    loadVersions(file.id)
  }

  const handleVersionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !versionsModal) return

    setVersionUploading(true)
    try {
      // 1. Presigned URL al — files kaydı oluşturma (skipFileRecord)
      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          clientId: versionsModal.clientId || undefined,
          skipFileRecord: true,
        }),
      })
      const { signedUrl, publicUrl, error } = await res.json()
      if (error || !signedUrl) {
        alert('Hata: ' + (error || 'Bilinmeyen hata'))
        setVersionUploading(false)
        return
      }

      // 2. R2'ye yükle
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) {
        alert('R2 yükleme hatası')
        setVersionUploading(false)
        return
      }

      // 3. Sürümü kaydet
      const sizeMB = `${(file.size / 1024 / 1024).toFixed(1)} MB`
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE'
      const reg = await fetch(`/api/files/${versionsModal.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publicUrl, name: file.name, size: sizeMB, fileType: ext }),
      })
      if (!reg.ok) {
        const d = await reg.json().catch(() => ({}))
        alert(d.error || 'Sürüm eklenemedi')
        setVersionUploading(false)
        return
      }

      await loadVersions(versionsModal.id)
      fetchDosyalar()
    } catch {
      alert('Sürüm yükleme sırasında hata oluştu')
    }
    setVersionUploading(false)
    if (versionFileRef.current) versionFileRef.current.value = ''
  }

  const typeColor: Record<string, string> = {
    PDF: 'bg-red-500', AI: 'bg-orange-500', ZIP: 'bg-purple-500',
    PNG: 'bg-blue-500', JPG: 'bg-blue-400', JPEG: 'bg-blue-400',
    MP4: 'bg-pink-500', DOC: 'bg-blue-600', DOCX: 'bg-blue-600',
    XLS: 'bg-green-600', XLSX: 'bg-green-600', FILE: 'bg-gray-500',
  }

  const clientName = (id: string | null) =>
    id ? (clients.find(c => c.id === id)?.name || 'Bilinmeyen müşteri') : null

  const filtered = dosyalar.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterClientId === '' || d.client_id === filterClientId)
  )

  const selectCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white'

  return (
    <div>
      <input type="file" ref={fileRef} onChange={handleUpload} className="hidden" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dosyalar</h1>
          <p className="text-gray-500 text-sm mt-1">Müşteri dosyaları ve iç çalışma dosyaların</p>
        </div>
      </div>

      {/* Yükleme araç çubuğu */}
      {userRole !== 'viewer' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Yükle:</span>
            <select
              value={uploadClientId}
              onChange={(e) => {
                setUploadClientId(e.target.value)
                if (!e.target.value) setUploadShared(false)
              }}
              className={selectCls}
            >
              <option value="">Genel dosya (müşterisiz)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className={`flex items-center gap-2 text-sm select-none ${uploadClientId ? 'text-gray-700 cursor-pointer' : 'text-gray-300'}`}>
              <input
                type="checkbox"
                checked={uploadShared}
                disabled={!uploadClientId}
                onChange={(e) => setUploadShared(e.target.checked)}
              />
              Müşteriye göster
            </label>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 ml-auto"
            >
              {uploading ? '⏳ Yükleniyor...' : '+ Dosya Yükle'}
            </button>
            {progress && (
              <span className={`text-sm font-medium ${progress.startsWith('✓') ? 'text-green-600' : 'text-gray-500'}`}>
                {progress}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2.5">
            Müşteri seçip <strong>“Müşteriye göster”</strong>i işaretlersen dosya o müşterinin portalında görünür.
            İşaretlemezsen yalnızca ekip görür (dahili çalışma dosyası).
          </p>
        </div>
      )}

      {/* Filtreler */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Dosya ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={filterClientId}
          onChange={(e) => setFilterClientId(e.target.value)}
          className={selectCls}
        >
          <option value="">Tüm dosyalar</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">
                {dosyalar.length === 0 ? 'Henüz dosya yok' : 'Bu filtreyle dosya bulunamadı'}
              </p>
              {dosyalar.length === 0 && userRole !== 'viewer' && (
                <button onClick={() => fileRef.current?.click()} className="mt-3 text-sm text-indigo-600 hover:underline">
                  İlk dosyayı yükle
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dosya</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Görünürlük</th>
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
                        {(dosya.current_version || 1) > 1 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-600">
                            v{dosya.current_version}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {clientName(dosya.client_id) || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {!dosya.client_id ? (
                        <span className="text-xs text-gray-400">Genel</span>
                      ) : dosya.shared_with_client ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">Paylaşıldı</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Dahili</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{dosya.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(dosya.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openVersions(dosya)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          Sürümler
                        </button>
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

      {/* Sürüm geçmişi modalı */}
      {versionsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.45)' }}
          onClick={() => setVersionsModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">Sürüm Geçmişi</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{versionsModal.name}</div>
              </div>
              <button
                onClick={() => setVersionsModal(null)}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none ml-3"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {versionsLoading ? (
                <div className="text-center py-10 text-sm text-gray-400">Yükleniyor...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">Sürüm bulunamadı</div>
              ) : (
                versions.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                    <span className="w-10 h-7 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      v{v.version_number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 truncate">
                        {v.name}
                        {i === 0 && <span className="ml-2 text-[11px] text-green-600 font-medium">güncel</span>}
                      </div>
                      <div className="text-xs text-gray-400">
                        {v.size || '—'} · {new Date(v.created_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                    >
                      Aç
                    </a>
                  </div>
                ))
              )}
            </div>

            {userRole !== 'viewer' && (
              <div className="px-5 py-3 border-t border-gray-100">
                <input type="file" ref={versionFileRef} onChange={handleVersionUpload} className="hidden" />
                <button
                  onClick={() => versionFileRef.current?.click()}
                  disabled={versionUploading}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 w-full"
                >
                  {versionUploading ? '⏳ Yükleniyor...' : '+ Yeni Sürüm Yükle'}
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Yeni sürüm güncel dosya olur; müşteri her zaman yalnızca güncel hâli görür.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

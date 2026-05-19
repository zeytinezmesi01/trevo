'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Client = {
  id: string
  name: string
  company: string
  email: string
  token: string
  created_at: string
}

export default function MusterilerPage() {
  const [modal, setModal] = useState(false)
  const [search, setSearch] = useState('')
  const [musteriler, setMusteriler] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', company: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMusteriler = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setMusteriler(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMusteriler() }, [])

  const handleEkle = async () => {
    if (!form.name) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('clients').insert({ ...form, user_id: user!.id })
    setForm({ name: '', company: '', email: '' })
    setModal(false)
    setSaving(false)
    fetchMusteriler()
  }

  const handleSil = async (id: string) => {
    if (!confirm('Bu müşteriyi silmek istediğine emin misin?')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchMusteriler()
  }

  const handlePortalKopyala = (token: string, id: string) => {
    const url = `${window.location.origin}/portal/${token}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = musteriler.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-gray-500 text-sm mt-1">Tüm müşterilerini tek yerden yönet</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Müşteri Ekle
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Müşteri veya şirket ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-gray-500 text-sm">Henüz müşteri yok</p>
          <button onClick={() => setModal(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
            İlk müşteriyi ekle
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                        {m.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{m.name}</div>
                        {m.company && <div className="text-xs text-gray-400">{m.company}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.email || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(m.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handlePortalKopyala(m.token, m.id)}
                        className={`text-xs font-medium transition-colors ${copied === m.id ? 'text-green-600' : 'text-indigo-600 hover:text-indigo-800'}`}
                      >
                        {copied === m.id ? '✓ Kopyalandı' : 'Portal Linki'}
                      </button>
                      <button onClick={() => handleSil(m.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Müşteri</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Ahmet Yılmaz" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Şirket</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Şirket Adı" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="musteri@sirket.com" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">İptal</button>
              <button onClick={handleEkle} disabled={saving} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

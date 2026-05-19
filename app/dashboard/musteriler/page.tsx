'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Client = {
  id: string
  name: string
  company: string
  email: string
  created_at: string
}

export default function MusterilerPage() {
  const [modal, setModal] = useState(false)
  const [search, setSearch] = useState('')
  const [musteriler, setMusteriler] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', company: '', email: '' })
  const [saving, setSaving] = useState(false)
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
    await supabase.from('clients').delete().eq('id', id)
    fetchMusteriler()
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
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold">
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.company}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-4">{m.email}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSil(m.id)}
                  className="flex-1 text-center text-xs bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setModal(true)}
            className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-100 transition-colors"
          >
            <div className="text-3xl text-gray-300">+</div>
            <span className="text-sm text-gray-400">Yeni müşteri ekle</span>
          </button>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-gray-500 text-sm">Henüz müşteri yok</p>
          <button onClick={() => setModal(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
            İlk müşteriyi ekle
          </button>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Müşteri</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Şirket</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Şirket Adı"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="musteri@sirket.com"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                İptal
              </button>
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

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Service = {
  id: string
  name: string
  price: number
  delivery: string
  description: string
  status: string
}

export default function HizmetlerPage() {
  const [modal, setModal] = useState(false)
  const [hizmetler, setHizmetler] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', price: '', delivery: '', description: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchHizmetler = async () => {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false })
    setHizmetler(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchHizmetler() }, [])

  const handleEkle = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('services').insert({
      name: form.name,
      price: parseFloat(form.price),
      delivery: form.delivery,
      description: form.description,
      user_id: user!.id,
      status: 'Aktif'
    })
    setForm({ name: '', price: '', delivery: '', description: '' })
    setModal(false)
    setSaving(false)
    fetchHizmetler()
  }

  const handleSil = async (id: string) => {
    await supabase.from('services').delete().eq('id', id)
    fetchHizmetler()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hizmetler</h1>
          <p className="text-gray-500 text-sm mt-1">Paketlerini oluştur ve müşterilerine sun</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          + Hizmet Ekle
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {hizmetler.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="text-2xl">💼</div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${h.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {h.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{h.name}</h3>
              <div className="text-xl font-bold text-gray-900 mb-1">₺{h.price.toLocaleString('tr-TR')}</div>
              {h.delivery && <div className="text-xs text-gray-400 mb-2">Teslim: {h.delivery}</div>}
              {h.description && <div className="text-xs text-gray-500 mb-4 line-clamp-2">{h.description}</div>}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => handleSil(h.id)} className="flex-1 text-center text-xs bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-100 transition-colors">
                  Sil
                </button>
                <button className="flex-1 text-center text-xs bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  Paylaş
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => setModal(true)} className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-100 transition-colors">
            <div className="text-3xl text-gray-300">+</div>
            <span className="text-sm text-gray-400">Yeni hizmet ekle</span>
          </button>
        </div>
      )}

      {hizmetler.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">💼</div>
          <p className="text-gray-500 text-sm">Henüz hizmet yok</p>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Hizmet</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hizmet Adı *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Logo Tasarımı" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fiyat (₺) *</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="2500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teslim Süresi</label>
                <input value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="5 iş günü" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" rows={3} placeholder="Hizmet hakkında kısa açıklama..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">İptal</button>
              <button onClick={handleEkle} disabled={saving} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

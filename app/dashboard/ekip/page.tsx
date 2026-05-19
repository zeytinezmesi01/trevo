'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function EkipPage() {
  const [modal, setModal] = useState(false)
  const [ekip, setEkip] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', role: 'Freelancer' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchEkip = async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at', { ascending: false })
    setEkip(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEkip() }, [])

  const handleEkle = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('team_members').insert({ ...form, user_id: user!.id, status: 'Davet Bekliyor' })
    setForm({ name: '', email: '', role: 'Freelancer' })
    setModal(false)
    setSaving(false)
    fetchEkip()
  }

  const handleSil = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id)
    fetchEkip()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ekip</h1>
          <p className="text-gray-500 text-sm mt-1">Freelancer ve çalışanlarını yönet</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          + Üye Davet Et
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {ekip.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500 text-sm">Henüz ekip üyesi yok</p>
              <button onClick={() => setModal(true)} className="mt-3 text-sm text-indigo-600 hover:underline">İlk üyeyi davet et</button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Üye</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ekip.map((uye) => (
                  <tr key={uye.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {uye.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{uye.name}</div>
                          <div className="text-xs text-gray-400">{uye.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{uye.role}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${uye.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {uye.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleSil(uye.id)} className="text-red-400 hover:text-red-600 text-xs transition-colors">Çıkar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Üye Davet Et</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Ayşe Kaya" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="ekip@ajans.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option>Freelancer</option>
                  <option>Yönetici</option>
                  <option>Görüntüleyici</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">İptal</button>
              <button onClick={handleEkle} disabled={saving} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Davet Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

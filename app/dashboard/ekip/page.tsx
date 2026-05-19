'use client'

import { useState } from 'react'

const mockEkip = [
  { id: 1, name: 'Ayşe Kaya', rol: 'Tasarımcı', email: 'ayse@ajans.com', durum: 'Aktif', avatar: 'A' },
  { id: 2, name: 'Burak Demir', rol: 'Geliştirici', email: 'burak@ajans.com', durum: 'Aktif', avatar: 'B' },
  { id: 3, name: 'Ceren Yıldız', rol: 'İçerik Yazarı', email: 'ceren@ajans.com', durum: 'Davet Bekliyor', avatar: 'C' },
]

export default function EkipPage() {
  const [modal, setModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ekip</h1>
          <p className="text-gray-500 text-sm mt-1">Freelancer ve çalışanlarını yönet</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Üye Davet Et
        </button>
      </div>

      {/* EKİP LİSTESİ */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
            {mockEkip.map((uye) => (
              <tr key={uye.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {uye.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{uye.name}</div>
                      <div className="text-xs text-gray-400">{uye.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{uye.rol}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    uye.durum === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {uye.durum}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-red-500 text-xs transition-colors">Çıkar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DAVET MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Üye Davet Et</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                <input type="email" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="ekip@ajans.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option>Freelancer</option>
                  <option>Yönetici</option>
                  <option>Görüntüleyici</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                İptal
              </button>
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
                Davet Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

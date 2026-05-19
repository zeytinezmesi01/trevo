'use client'

import { useState } from 'react'

const mockDosyalar = [
  { id: 1, name: 'logo-final.ai', size: '2.4 MB', type: 'AI', color: 'bg-orange-500', tarih: '20 May 2026', musteri: 'Ahmet Bey' },
  { id: 2, name: 'katalog-v3.pdf', size: '8.1 MB', type: 'PDF', color: 'bg-red-500', tarih: '19 May 2026', musteri: 'Zeynep Hanım' },
  { id: 3, name: 'sosyal-paket.zip', size: '15 MB', type: 'ZIP', color: 'bg-purple-500', tarih: '18 May 2026', musteri: 'Mehmet Bey' },
]

export default function DosyalarPage() {
  const [search, setSearch] = useState('')

  const filtered = mockDosyalar.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.musteri.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dosyalar</h1>
          <p className="text-gray-500 text-sm mt-1">Müşterilerine ilettiğin dosyalar</p>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          + Dosya Yükle
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Dosya veya müşteri ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* DOSYA LİSTESİ */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dosya</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Boyut</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((dosya) => (
              <tr key={dosya.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${dosya.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                      {dosya.type}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{dosya.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{dosya.size}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{dosya.musteri}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{dosya.tarih}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-indigo-600 text-sm hover:text-indigo-800 font-medium">
                    Linki Kopyala
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 text-sm">Dosya bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  )
}

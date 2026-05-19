'use client'

import { useState } from 'react'

const mockHizmetler = [
  { id: 1, name: 'Logo Tasarımı', fiyat: '₺2.500', sure: '5 iş günü', durum: 'Aktif', renk: 'bg-green-100 text-green-700' },
  { id: 2, name: 'Sosyal Medya Paketi', fiyat: '₺4.900/ay', sure: 'Aylık', durum: 'Aktif', renk: 'bg-green-100 text-green-700' },
  { id: 3, name: 'Web Sitesi', fiyat: '₺12.000', sure: '15 iş günü', durum: 'Taslak', renk: 'bg-gray-100 text-gray-600' },
]

export default function HizmetlerPage() {
  const [modal, setModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hizmetler</h1>
          <p className="text-gray-500 text-sm mt-1">Paketlerini oluştur ve müşterilerine sun</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Hizmet Ekle
        </button>
      </div>

      {/* HİZMET KARTLARI */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {mockHizmetler.map((h) => (
          <div key={h.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="text-2xl">💼</div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${h.renk}`}>{h.durum}</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{h.name}</h3>
            <div className="text-xl font-bold text-gray-900 mb-1">{h.fiyat}</div>
            <div className="text-xs text-gray-400 mb-4">Teslim: {h.sure}</div>
            <div className="flex gap-2">
              <button className="flex-1 text-center text-xs bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                Düzenle
              </button>
              <button className="flex-1 text-center text-xs bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Linki Paylaş
              </button>
            </div>
          </div>
        ))}

        {/* YENİ HİZMET */}
        <button
          onClick={() => setModal(true)}
          className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-100 transition-colors"
        >
          <div className="text-3xl text-gray-300">+</div>
          <span className="text-sm text-gray-400">Yeni hizmet ekle</span>
        </button>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Hizmet</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hizmet Adı</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Logo Tasarımı" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fiyat (₺)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="2500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teslim Süresi</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="5 iş günü" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" rows={3} placeholder="Hizmet hakkında kısa açıklama..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                İptal
              </button>
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

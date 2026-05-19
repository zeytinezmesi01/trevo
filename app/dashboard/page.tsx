import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.full_name || 'Kullanıcı'

  const stats = [
    { label: 'Aktif Proje', value: '0', icon: '📁', color: 'bg-blue-50 text-blue-600' },
    { label: 'Müşteri', value: '0', icon: '🤝', color: 'bg-green-50 text-green-600' },
    { label: 'Bekleyen Ödeme', value: '₺0', icon: '💰', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Ekip Üyesi', value: '0', icon: '👥', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Merhaba, {userName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">İşte bugünkü özet</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-lg mb-4`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* HIZLI BAŞLANGIÇ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Hızlı Başlangıç</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/dosyalar', icon: '📁', title: 'Dosya Yükle', desc: 'Müşteriye dosya gönder' },
            { href: '/dashboard/hizmetler', icon: '💼', title: 'Hizmet Ekle', desc: 'Paketini oluştur ve sat' },
            { href: '/dashboard/musteriler', icon: '🤝', title: 'Müşteri Ekle', desc: 'Yeni müşteri davet et' },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl">{item.icon}</div>
              <div>
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* SON AKTİVİTE */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Son Aktivite</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-gray-500 text-sm">Henüz aktivite yok.</p>
          <p className="text-gray-400 text-xs mt-1">İlk müşterini ekleyerek başla.</p>
        </div>
      </div>
    </div>
  )
}

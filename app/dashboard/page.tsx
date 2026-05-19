import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'

  const [
    { count: clientCount },
    { count: serviceCount },
    { count: teamCount },
    { count: fileCount },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])

  const stats = [
    { label: 'Müşteri', value: clientCount || 0, icon: '🤝', color: 'bg-green-50 text-green-600', href: '/dashboard/musteriler' },
    { label: 'Hizmet', value: serviceCount || 0, icon: '💼', color: 'bg-blue-50 text-blue-600', href: '/dashboard/hizmetler' },
    { label: 'Ekip Üyesi', value: teamCount || 0, icon: '👥', color: 'bg-purple-50 text-purple-600', href: '/dashboard/ekip' },
    { label: 'Dosya', value: fileCount || 0, icon: '📁', color: 'bg-orange-50 text-orange-600', href: '/dashboard/dosyalar' },
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
          <Link key={stat.label} href={stat.href} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-lg mb-4`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </Link>
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
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl">{item.icon}</div>
              <div>
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* BOŞ DURUM */}
      {(clientCount === 0 && serviceCount === 0) && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🚀</div>
          <h3 className="text-sm font-semibold text-indigo-900 mb-1">Başlamaya hazır mısın?</h3>
          <p className="text-xs text-indigo-600 mb-4">İlk müşterini ekle veya ilk hizmetini oluştur.</p>
          <div className="flex justify-center gap-2">
            <Link href="/dashboard/musteriler" className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Müşteri Ekle
            </Link>
            <Link href="/dashboard/hizmetler" className="text-xs bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
              Hizmet Ekle
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

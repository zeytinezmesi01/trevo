import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris')

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-gray-900">trevo</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem href="/dashboard" icon="🏠" label="Genel Bakış" />
          <NavItem href="/dashboard/dosyalar" icon="📁" label="Dosyalar" />
          <NavItem href="/dashboard/hizmetler" icon="💼" label="Hizmetler" />
          <NavItem href="/dashboard/ekip" icon="👥" label="Ekip" />
          <NavItem href="/dashboard/musteriler" icon="🤝" label="Müşteriler" />
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <NavItem href="/dashboard/ayarlar" icon="⚙️" label="Ayarlar" />
          <form action="/api/auth/cikis" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <span>🚪</span>
              <span>Çıkış yap</span>
            </button>
          </form>
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
              {userName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{userName}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-60 p-8">
        {children}
      </main>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

import { createClient } from '@/lib/supabase/server'
import { getBrandByUserId } from '@/lib/brand/server'
import { DEFAULT_BRAND } from '@/lib/types/brand'
import DashboardSidebar from '@/components/dashboard-sidebar'
import DashboardTopbar from '@/components/dashboard/topbar'
import OnboardingModal from '@/components/onboarding-modal'
import BrandStyle from '@/components/brand-style'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const brand = user ? await getBrandByUserId(user.id) : DEFAULT_BRAND
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'
  const userEmail = user?.email || ''

  return (
    <div
      className="db-root"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f0f4ff',
        color: '#0f172a',
        fontFamily: 'var(--font-body), Inter, sans-serif',
      }}
    >
      <BrandStyle brand={brand} />
      <DashboardSidebar brand={brand} userName={userName} userEmail={userEmail} />

      <main
        style={{
          marginLeft: '240px',
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <DashboardTopbar userName={userName} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </div>
      </main>
      <OnboardingModal />
    </div>
  )
}

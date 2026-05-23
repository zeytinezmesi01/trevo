import { createClient } from '@/lib/supabase/server'
import { getBrandByTenantId } from '@/lib/brand/server'
import { DEFAULT_BRAND } from '@/lib/types/brand'
import DashboardSidebar from '@/components/dashboard-sidebar'
import DashboardTopbar from '@/components/dashboard/topbar'
import OnboardingModal from '@/components/onboarding-modal'
import BrandStyle from '@/components/brand-style'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'
  const userEmail = user?.email || ''

  // Profil bilgileri
  let userRole = 'member'
  let userTenantId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role) userRole = profile.role
    if (profile?.tenant_id) userTenantId = profile.tenant_id
  }

  // Brand'i tenant owner'indan al (ekip uyesi kendi profilinde brand tutmaz)
  const brand = userTenantId ? await getBrandByTenantId(userTenantId) : DEFAULT_BRAND

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
      <DashboardSidebar brand={brand} userName={userName} userEmail={userEmail} userRole={userRole} />

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
      {userRole === 'owner' && <OnboardingModal />}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { getBrandByTenantId } from '@/lib/brand/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { effectiveMenuVisibility } from '@/lib/tenant/menu'
import DashboardSidebar from '@/components/dashboard-sidebar'
import DashboardTopbar from '@/components/dashboard/topbar'
import OnboardingModal from '@/components/onboarding-modal'
import ChatWidget from '@/components/chat/chat-widget'
import BrandStyle from '@/components/brand-style'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'
  const userEmail = user?.email || ''

  // Aktif tenant + üyelikler (çoklu tenant) — rol tenant_members'tan gelir
  const ctx = await getTenantContext()
  const userRole = ctx.role
  const userTenantId = ctx.tenantId

  // Brand'i tenant owner'indan al (ekip uyesi kendi profilinde brand tutmaz)
  const brand = await getBrandByTenantId(userTenantId)

  // Rol bazlı menü görünürlüğü: owner her şeyi görür; diğer roller için
  // role_permissions override'ları, yoksa koddaki minRole varsayılanı geçerli
  const { data: permRows } = await supabase
    .from('role_permissions')
    .select('role, menu_key, enabled')
    .eq('tenant_id', userTenantId)
  const menuVisibility = effectiveMenuVisibility(userRole, permRows || [])

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
      <DashboardSidebar
        brand={brand}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        menuVisibility={menuVisibility}
      />

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
        <DashboardTopbar
          userName={userName}
          memberships={ctx.memberships}
          activeTenantId={ctx.tenantId}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </div>
      </main>
      {userRole === 'owner' && <OnboardingModal />}
      {userTenantId && user && (
        <ChatWidget tenantId={userTenantId} userId={user.id} userName={userName} />
      )}
    </div>
  )
}

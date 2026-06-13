import { NextResponse } from 'next/server'
import { getTenantContextApi } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { MENU_DEFS, CUSTOMIZABLE_ROLES } from '@/lib/tenant/menu'

function apiError(e: unknown) {
  const status = (e as Error & { status?: number }).status || 401
  return NextResponse.json({ error: e instanceof Error ? e.message : 'Yetkisiz' }, { status })
}

// GET /api/tenant/role-permissions — menü tanımları + tenant override'ları
export async function GET() {
  try {
    const ctx = await getTenantContextApi()
    const supabase = await createClient()
    const { data } = await supabase
      .from('role_permissions')
      .select('role, menu_key, enabled')
      .eq('tenant_id', ctx.tenantId)

    return NextResponse.json({
      menus: MENU_DEFS,
      roles: CUSTOMIZABLE_ROLES,
      overrides: data || [],
    })
  } catch (e) {
    return apiError(e)
  }
}

// PUT /api/tenant/role-permissions — owner, matrix'i topluca kaydeder
export async function PUT(request: Request) {
  try {
    const ctx = await getTenantContextApi()
    if (ctx.role !== 'owner') {
      return NextResponse.json({ error: 'Bu işlem yalnızca işletme sahibine açık' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const permissions = body?.permissions
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'permissions dizisi gerekli' }, { status: 400 })
    }

    const validKeys = new Set(MENU_DEFS.filter((m) => !m.ownerOnly).map((m) => m.key))
    const validRoles = new Set<string>(CUSTOMIZABLE_ROLES)

    const rows = []
    for (const p of permissions) {
      if (!p || typeof p !== 'object') continue
      const { role, menu_key, enabled } = p as { role?: unknown; menu_key?: unknown; enabled?: unknown }
      if (typeof role !== 'string' || !validRoles.has(role)) {
        return NextResponse.json({ error: `Geçersiz rol: ${String(role)}` }, { status: 400 })
      }
      if (typeof menu_key !== 'string' || !validKeys.has(menu_key)) {
        return NextResponse.json({ error: `Geçersiz menü: ${String(menu_key)}` }, { status: 400 })
      }
      if (typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled boolean olmalı' }, { status: 400 })
      }
      rows.push({
        tenant_id: ctx.tenantId,
        role,
        menu_key,
        enabled,
        updated_at: new Date().toISOString(),
      })
    }

    if (rows.length === 0) return NextResponse.json({ ok: true })

    // RLS de yazmayı owner'a sınırlar — burada ikinci kat kontrol var
    const supabase = await createClient()
    const { error } = await supabase
      .from('role_permissions')
      .upsert(rows, { onConflict: 'tenant_id,role,menu_key' })

    if (error) {
      console.error('role-permissions PUT error:', error)
      return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}

'use client'

import { useState, useEffect } from 'react'

type MenuDef = { key: string; label: string; minRole: string; ownerOnly?: boolean }
type Override = { role: string; menu_key: string; enabled: boolean }

const ROLE_LABELS: Record<string, string> = {
  admin: 'Yönetici',
  member: 'Üye',
  viewer: 'İzleyici',
}

const ROLE_LEVEL: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 }

/**
 * Rol yetki matrix'i (yalnızca owner görür). Her rol için hangi dashboard
 * menülerinin görüneceğini özelleştirir. Satır yoksa minRole varsayılanı
 * geçerlidir; kaydedince tüm hücreler override olarak yazılır.
 */
export default function RolePermissionsMatrix() {
  const [menus, setMenus] = useState<MenuDef[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [matrix, setMatrix] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const cellKey = (role: string, menuKey: string) => `${role}:${menuKey}`

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tenant/role-permissions')
        if (!res.ok) return
        const data = await res.json()
        const menuDefs: MenuDef[] = (data.menus || []).filter((m: MenuDef) => !m.ownerOnly)
        const roleList: string[] = data.roles || []
        const overrides: Override[] = data.overrides || []

        const initial: Record<string, boolean> = {}
        for (const role of roleList) {
          for (const menu of menuDefs) {
            const override = overrides.find((o) => o.role === role && o.menu_key === menu.key)
            initial[cellKey(role, menu.key)] = override
              ? override.enabled
              : (ROLE_LEVEL[role] || 0) >= (ROLE_LEVEL[menu.minRole] || 0)
          }
        }
        setMenus(menuDefs)
        setRoles(roleList)
        setMatrix(initial)
      } catch {}
      setLoading(false)
    })()
  }, [])

  const toggle = (role: string, menuKey: string) => {
    setMatrix((m) => ({ ...m, [cellKey(role, menuKey)]: !m[cellKey(role, menuKey)] }))
    setMessage('')
  }

  const handleKaydet = async () => {
    setSaving(true)
    setMessage('')
    const permissions = roles.flatMap((role) =>
      menus.map((menu) => ({
        role,
        menu_key: menu.key,
        enabled: !!matrix[cellKey(role, menu.key)],
      }))
    )
    try {
      const res = await fetch('/api/tenant/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      })
      if (res.ok) {
        setMessage('Kaydedildi. Menü değişiklikleri üyelerin bir sonraki sayfa yüklemesinde geçerli olur.')
      } else {
        const data = await res.json().catch(() => ({}))
        setMessage(data.error || 'Kaydedilemedi.')
      }
    } catch {
      setMessage('Bağlantı hatası — kaydedilemedi.')
    }
    setSaving(false)
  }

  if (loading) return null
  if (menus.length === 0 || roles.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Rol Yetkileri</h2>
      <p className="text-xs text-gray-500 mb-4">
        Her rolün dashboard&apos;da hangi menüleri göreceğini belirle. Bu ayar yalnızca menü
        görünürlüğünü etkiler; işlem yetkileri rol bazında sabittir.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Menü</th>
              {roles.map((role) => (
                <th key={role} className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {ROLE_LABELS[role] || role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {menus.map((menu) => (
              <tr key={menu.key}>
                <td className="py-2.5 pr-4 text-gray-700">{menu.label}</td>
                {roles.map((role) => (
                  <td key={role} className="text-center py-2.5 px-3">
                    <input
                      type="checkbox"
                      aria-label={`${ROLE_LABELS[role] || role} — ${menu.label}`}
                      checked={!!matrix[cellKey(role, menu.key)]}
                      onChange={() => toggle(role, menu.key)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleKaydet}
          disabled={saving}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Yetkileri Kaydet'}
        </button>
        {message && <span className="text-xs text-gray-500">{message}</span>}
      </div>
    </div>
  )
}

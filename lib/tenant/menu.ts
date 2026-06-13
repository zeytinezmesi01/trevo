import { hasMinRole } from '@/lib/tenant/permissions'

/**
 * Dashboard menü tanımları — sidebar ve rol yetki matrix'i bu listeden beslenir.
 *
 * minRole: satır yoksa geçerli olan varsayılan görünürlük.
 * ownerOnly: matrix'te ÖZELLEŞTİRİLEMEZ — API tarafı da owner'a sabitlendiği
 * için menüyü başka role açmak kırık sayfa üretir (örn. Ödeme ayarları).
 */
export type MenuDef = {
  key: string
  label: string
  minRole: 'owner' | 'admin' | 'member' | 'viewer'
  ownerOnly?: boolean
}

export const MENU_DEFS: MenuDef[] = [
  { key: 'genel', label: 'Genel Bakış', minRole: 'viewer' },
  { key: 'raporlar', label: 'Raporlar', minRole: 'admin' },
  { key: 'dosyalar', label: 'Dosyalar', minRole: 'viewer' },
  { key: 'faturalar', label: 'Faturalar', minRole: 'admin' },
  { key: 'hizmetler', label: 'Hizmetler', minRole: 'admin' },
  { key: 'ekip', label: 'Ekip', minRole: 'admin' },
  { key: 'musteriler', label: 'Müşteriler', minRole: 'member' },
  { key: 'odeme', label: 'Ödeme', minRole: 'owner', ownerOnly: true },
  { key: 'ayarlar', label: 'Ayarlar', minRole: 'viewer' },
  { key: 'api', label: 'API & Webhook', minRole: 'admin' },
]

/** Matrix'te özelleştirilebilen roller (owner her zaman her şeyi görür) */
export const CUSTOMIZABLE_ROLES = ['admin', 'member', 'viewer'] as const

export type RolePermissionRow = { role: string; menu_key: string; enabled: boolean }

/**
 * Bir rolün etkin menü görünürlüğü: owner → hepsi; diğer roller →
 * override satırı varsa o, yoksa minRole varsayılanı. ownerOnly menüler
 * owner dışında asla görünmez.
 */
export function effectiveMenuVisibility(
  role: string,
  overrides: RolePermissionRow[],
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {}
  for (const def of MENU_DEFS) {
    if (role === 'owner') {
      visibility[def.key] = true
      continue
    }
    if (def.ownerOnly) {
      visibility[def.key] = false
      continue
    }
    const override = overrides.find((o) => o.role === role && o.menu_key === def.key)
    visibility[def.key] = override ? override.enabled : hasMinRole(role, def.minRole)
  }
  return visibility
}

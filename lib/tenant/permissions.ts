type Role = 'owner' | 'admin' | 'member' | 'viewer'
const ROLE_HIERARCHY: Record<Role, number> = { owner: 4, admin: 3, member: 2, viewer: 1 }

export function hasMinRole(userRole: string, minRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole as Role] || 0) >= ROLE_HIERARCHY[minRole]
}

export function canManageTenant(role: string): boolean { return hasMinRole(role, 'admin') }
export function canInviteMembers(role: string): boolean { return hasMinRole(role, 'admin') }
export function canRemoveMembers(role: string): boolean { return hasMinRole(role, 'admin') }
export function canCreateInvoices(role: string): boolean { return hasMinRole(role, 'member') }
export function canDeleteInvoices(role: string): boolean { return hasMinRole(role, 'admin') }
export function canUploadFiles(role: string): boolean { return hasMinRole(role, 'member') }
export function canManageClients(role: string): boolean { return hasMinRole(role, 'member') }
export function canManageServices(role: string): boolean { return hasMinRole(role, 'admin') }
export function canViewAll(role: string): boolean { return hasMinRole(role, 'viewer') }

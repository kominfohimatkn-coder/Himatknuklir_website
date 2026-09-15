export const PERMISSIONS = {
  dashboard: 'dashboard.view',
  news: 'news.manage',
  programs: 'programs.manage',
  members: 'members.manage',
  settings: 'settings.manage',
  admins: 'admins.manage',
}

const LEGACY_FULL_ROLES = new Set(['admin', 'superadmin'])

export function hasPermission(user, permission) {
  if (!user) return false
  if (LEGACY_FULL_ROLES.has(user.role)) return true
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}

export function getDefaultAdminPath(user) {
  if (hasPermission(user, PERMISSIONS.dashboard)) return '/admin/dashboard'
  if (hasPermission(user, PERMISSIONS.news)) return '/admin/berita'
  if (hasPermission(user, PERMISSIONS.programs)) return '/admin/proker'
  if (hasPermission(user, PERMISSIONS.members)) return '/admin/struktur'
  if (hasPermission(user, PERMISSIONS.settings)) return '/admin/pengaturan'
  if (hasPermission(user, PERMISSIONS.admins)) return '/admin/admins'
  return '/admin/login'
}

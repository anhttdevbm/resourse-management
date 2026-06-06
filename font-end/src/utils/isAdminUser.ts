import { User } from '../types/User';

/** Permission names that grant full admin access (aligned with backend). */
const ADMIN_PERMISSIONS = ['AllAccess', 'User:AllAccess'] as const;

export function userHasAdminAccess(user: User | null | undefined): boolean {
  if (!user?.permissions?.length) return false;
  return ADMIN_PERMISSIONS.some((p) => user.permissions!.includes(p));
}

import { useSearchParams } from 'react-router-dom';
import { ROLES, type Role, type RoleId } from '../data/roles';

export interface Session {
  userId: string;
  name: string;
  role: Role;
  hotelName: string;
  hotelId: string;
}

/**
 * DEMO MODE — there is no server yet, so sign-in checks these sample accounts.
 * Set to false (and connect `loginAsUser` in ../data/partnerApi.ts) for the real thing.
 * `pu1` / `1234` matches the account in the backend's seed data.
 */
export const DEMO_MODE = true;
export const DEMO_PASSWORD = '1234';
export const DEMO_HOTEL = { hotelName: 'Hotel Empire', hotelId: 'CHK-EMPIRE-017' };

export const DEMO_USERS: Record<string, { name: string; roleId: RoleId }> = {
  pu1: { name: 'Empire Admin', roleId: 'prole1' },
  pu2: { name: 'Priya Nair', roleId: 'prole2' },
  pu3: { name: 'Rahul Verma', roleId: 'prole3' },
  pu4: { name: 'Meena Das', roleId: 'prole4' },
  pu5: { name: 'Arjun Rao', roleId: 'prole5' },
};

const KEY = 'checkdin.partner.session';

export function saveSession(userId: string) {
  try { localStorage.setItem(KEY, userId); } catch { /* storage may be blocked */ }
}
export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
function storedUserId(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function useSession(): Session {
  const [params] = useSearchParams();
  const asked = params.get('role') as RoleId | null; // design-review shortcut, e.g. ?role=prole3
  const byRole = asked && asked in ROLES ? Object.entries(DEMO_USERS).find(([, u]) => u.roleId === asked) : undefined;
  const userId = byRole?.[0] ?? storedUserId() ?? 'pu1';
  const user = DEMO_USERS[userId] ?? DEMO_USERS.pu1;
  return { userId, name: user.name, role: ROLES[user.roleId], ...DEMO_HOTEL };
}

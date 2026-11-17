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
 * MOCK SESSION — replace with the user stored after login
 * (POST /auth/partner/login returns { token, user: { id, name, role_id, hotel_id } }).
 * For design review, `?role=prole2` (etc.) previews the app as another role.
 */
const MOCK_USERS: Record<RoleId, { userId: string; name: string }> = {
  prole1: { userId: 'pu1', name: 'Empire Admin' },
  prole2: { userId: 'pu2', name: 'Priya Nair' },
  prole3: { userId: 'pu3', name: 'Rahul Verma' },
  prole4: { userId: 'pu4', name: 'Meena Das' },
  prole5: { userId: 'pu5', name: 'Arjun Rao' },
};

export function useSession(): Session {
  const [params] = useSearchParams();
  const asked = params.get('role') as RoleId | null;
  const roleId: RoleId = asked && asked in ROLES ? asked : 'prole1';
  return { ...MOCK_USERS[roleId], role: ROLES[roleId], hotelName: 'Hotel Empire', hotelId: 'CHK-EMPIRE-017' };
}

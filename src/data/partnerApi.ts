import { DEMO_MODE, DEMO_PASSWORD, DEMO_USERS } from '../auth/session';
import type { RoleId } from './roles';

export type Lookup = { email: string } | { hotelId: string };

export interface PartnerSession {
  token: string;
  user: { id: string; name: string; role_id: RoleId; hotel_id: string };
}

/**
 * STEP 1: check that the property exists.
 * MOCK DATA — replace with a real lookup. The backend's POST /auth/partner/login only
 * understands { hotelId } today; the `email` branch needs a new endpoint.
 * Do not return the list of staff here: users type their own User ID in step 2.
 */
export async function findHotel(_lookup: Lookup): Promise<{ hotelName: string }> {
  await new Promise((r) => setTimeout(r, 600));
  return { hotelName: 'Hotel Empire' };
}

/**
 * STEP 2: log in as one user.
 * Demo mode checks the sample accounts in ../auth/session.ts.
 * REAL: POST /auth/partner/login { hotelId, userId, userPassword } →
 * { token, user: { id, name, role_id, hotel_id } }; the role_id (see ./roles.ts) decides
 * which features the app shows.
 */
export async function loginAsUser(userId: string, password: string): Promise<PartnerSession> {
  await new Promise((r) => setTimeout(r, 700));
  if (DEMO_MODE) {
    const user = DEMO_USERS[userId.toLowerCase()];
    if (!user || password !== DEMO_PASSWORD) throw new Error('Wrong User ID or password.');
    return { token: 'demo', user: { id: userId.toLowerCase(), name: user.name, role_id: user.roleId, hotel_id: 'CHK-EMPIRE-017' } };
  }
  throw new Error('Login is not connected to the server yet.');
}

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
 * MOCK — replace with POST /auth/partner/login { hotelId, userId, userPassword }.
 * On success the backend returns { token, user: { id, name, role_id, hotel_id } }; the
 * role_id (see ./roles.ts) decides which features the dashboard shows.
 */
export async function loginAsUser(_userId: string, _password: string): Promise<PartnerSession> {
  await new Promise((r) => setTimeout(r, 900));
  throw new Error('Login is not connected to the server yet.');
}
